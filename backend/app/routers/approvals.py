from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Persetujuan, Peminjaman, DetailPeminjamanAlat, UnitAlat, AlokasiUnitPeminjaman, Pengguna
from ..schemas import ApprovalDecisionRequest, ApprovalOut
from ..auth import get_current_user, require_roles
from .bookings import format_booking_response

router = APIRouter(prefix="/api/approvals", tags=["Persetujuan"])

@router.get("")
def list_approvals(
    status: Optional[str] = None,
    jenis: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    query = db.query(Persetujuan)
    if status and status != "Semua status":
        query = query.filter(Persetujuan.status == status)
    if jenis:
        query = query.filter(Persetujuan.jenis_persetujuan == jenis)

    # If user is Dosen Pengampu, default or emphasize their approval queue
    if current_user.role == "Dosen Pengampu" and not jenis:
        query = query.filter(Persetujuan.jenis_persetujuan == "dosen_pengampu")
    elif current_user.role == "Laboran" and not jenis:
        query = query.filter(Persetujuan.jenis_persetujuan == "laboran")

    approvals = query.order_by(Persetujuan.id_persetujuan.desc()).all()
    results = []

    for app in approvals:
        booking = app.peminjaman
        # Find companion approvals for same booking to present full two-step status
        all_apps = booking.persetujuan_list
        dosen_app = next((a for a in all_apps if a.jenis_persetujuan == "dosen_pengampu"), None)
        laboran_app = next((a for a in all_apps if a.jenis_persetujuan == "laboran"), None)

        tools_summary = []
        has_alat_khusus = False
        for da in booking.detail_alat_list:
            is_khusus = da.alat.alat_khusus if da.alat else False
            if is_khusus:
                has_alat_khusus = True
            tools_summary.append({
                "nama_alat": da.alat.nama_alat if da.alat else "Alat",
                "jumlah_pinjam": da.jumlah_pinjam,
                "alat_khusus": is_khusus,
                "tenggat": da.tenggat_pengembalian
            })

        results.append({
            "id_persetujuan": app.id_persetujuan,
            "id_peminjaman": booking.id_peminjaman,
            "kode_peminjaman": f"PMJ-{booking.id_peminjaman:04d}",
            "jenis_persetujuan": app.jenis_persetujuan,
            "status": app.status,
            "catatan": app.catatan,
            "waktu_keputusan": app.waktu_keputusan,
            "penyetuju_nama": app.penyetuju.nama if app.penyetuju else None,
            "has_alat_khusus": has_alat_khusus,
            "id_persetujuan_dosen": dosen_app.id_persetujuan if dosen_app else None,
            "id_persetujuan_laboran": laboran_app.id_persetujuan if laboran_app else None,
            "status_dosen_pengampu": dosen_app.status if dosen_app else "Tidak diperlukan",
            "catatan_dosen_pengampu": dosen_app.catatan if dosen_app else None,
            "penyetuju_dosen": dosen_app.penyetuju.nama if dosen_app and dosen_app.penyetuju else None,
            "status_laboran": laboran_app.status if laboran_app else None,
            "catatan_laboran": laboran_app.catatan if laboran_app else None,
            "penyetuju_laboran": laboran_app.penyetuju.nama if laboran_app and laboran_app.penyetuju else None,
            "booking": {
                "id_peminjaman": booking.id_peminjaman,
                "kode_peminjaman": f"PMJ-{booking.id_peminjaman:04d}",
                "peminjam_nama": booking.peminjam.nama,
                "peminjam_nomor_identitas": booking.peminjam.nomor_identitas,
                "peminjam_role": booking.peminjam.role,
                "tanggal_pengajuan": booking.tanggal_pengajuan,
                "tujuan": booking.tujuan,
                "status_peminjaman": booking.status,
                "has_alat_khusus": has_alat_khusus,
                "tools": tools_summary
            }
        })

    return results

@router.patch("/{id_persetujuan}/decision")
def make_decision(
    id_persetujuan: int,
    req: ApprovalDecisionRequest,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Dosen Pengampu", "Laboran", "Kepala Laboratorium", "Dekan"]))
):
    app = db.query(Persetujuan).filter(Persetujuan.id_persetujuan == id_persetujuan).first()
    if not app:
        raise HTTPException(status_code=404, detail="Data persetujuan tidak ditemukan.")

    if app.status != "Menunggu":
        raise HTTPException(status_code=400, detail=f"Persetujuan ini sudah diputuskan ({app.status}).")

    # Verify role authorization
    if app.jenis_persetujuan == "dosen_pengampu" and current_user.role not in ["Dosen Pengampu", "Dekan"]:
        raise HTTPException(status_code=403, detail="Hanya Dosen Pengampu yang berwenang memberikan persetujuan ini.")
    if app.jenis_persetujuan == "laboran" and current_user.role not in ["Laboran", "Kepala Laboratorium", "Dekan"]:
        raise HTTPException(status_code=403, detail="Hanya Laboran yang berwenang memberikan persetujuan ini.")

    decision_status = req.status.strip().capitalize()
    if decision_status not in ["Disetujui", "Ditolak"]:
        raise HTTPException(status_code=400, detail="Status keputusan harus 'Disetujui' atau 'Ditolak'.")

    app.status = decision_status
    app.id_penyetuju = current_user.id_pengguna
    app.catatan = req.catatan
    app.waktu_keputusan = datetime.utcnow()

    booking = app.peminjaman

    if decision_status == "Ditolak":
        booking.status = "Ditolak"
    else:
        # Check all approvals for this booking
        all_approved = all(a.status == "Disetujui" for a in booking.persetujuan_list)
        if all_approved:
            booking.status = "Disetujui"

            # Allocate physical units transaksional
            for da in booking.detail_alat_list:
                # Find available units for this equipment type
                available_units = db.query(UnitAlat).filter(
                    UnitAlat.id_alat == da.id_alat,
                    UnitAlat.status == "Tersedia"
                ).limit(da.jumlah_pinjam).all()

                if len(available_units) < da.jumlah_pinjam:
                    db.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail=f"Gagal mengalokasikan unit {da.alat.nama_alat}. Stok fisik yang tersedia tidak mencukupi saat persetujuan final."
                    )

                for u in available_units:
                    u.status = "Dipinjam"
                    alloc = AlokasiUnitPeminjaman(
                        id_detail_alat=da.id_detail_alat,
                        id_unit=u.id_unit,
                        status_alokasi="Dipinjam",
                        tanggal_alokasi=datetime.utcnow()
                    )
                    db.add(alloc)

    db.commit()
    db.refresh(app)
    db.refresh(booking)

    return {
        "message": f"Keputusan berhasil disimpan sebagai {decision_status}.",
        "id_persetujuan": app.id_persetujuan,
        "status_persetujuan": app.status,
        "status_peminjaman": booking.status,
        "booking": format_booking_response(booking)
    }
