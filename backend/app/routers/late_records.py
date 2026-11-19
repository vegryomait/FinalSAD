from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import RiwayatKeterlambatan, DetailPeminjamanAlat, Peminjaman, Pengguna
from ..auth import get_current_user

router = APIRouter(prefix="/api/late-records", tags=["Keterlambatan"])

def sync_overdue_records(db: Session):
    """
    Scans active approved/partial bookings to see if deadline passed without full return.
    Creates late record if missing.
    """
    now = datetime.utcnow()
    detail_tools = db.query(DetailPeminjamanAlat).join(Peminjaman).filter(
        Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali"]),
        DetailPeminjamanAlat.tenggat_pengembalian < now
    ).all()

    for da in detail_tools:
        # Check if has unreturned units
        unreturned = [al for al in da.alokasi_list if al.status_alokasi != "Kembali"]
        if unreturned:
            existing = db.query(RiwayatKeterlambatan).filter(
                RiwayatKeterlambatan.id_detail_alat == da.id_detail_alat
            ).first()
            if not existing:
                late = RiwayatKeterlambatan(
                    id_detail_alat=da.id_detail_alat,
                    mulai_terlambat=da.tenggat_pengembalian,
                    status="Aktif",
                    catatan=f"{len(unreturned)} unit belum dikembalikan melewati batas waktu."
                )
                db.add(late)
    db.commit()

@router.get("/user-status")
def get_user_late_status(
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    sync_overdue_records(db)

    records = db.query(RiwayatKeterlambatan).join(DetailPeminjamanAlat).join(Peminjaman).filter(
        Peminjaman.id_pengguna == current_user.id_pengguna
    ).all()

    total_late = len(records)
    active_late = sum(1 for r in records if r.status == "Aktif")
    is_suspended = total_late >= 2 or current_user.status_akun == "Nonaktif"

    return {
        "id_pengguna": current_user.id_pengguna,
        "nama": current_user.nama,
        "total_terlambat": total_late,
        "terlambat_aktif": active_late,
        "is_suspended": is_suspended,
        "status_akun": current_user.status_akun,
        "pesan_skors": (
            "Akun Anda sedang diskors dari peminjaman laboratorium karena telah mencapai batas 2 kali keterlambatan pengembalian alat dalam semester ini."
            if is_suspended else (
                "Perhatian: Anda memiliki 1 catatan keterlambatan. Jika terlambat 1 kali lagi (total 2 kali), akun Anda akan diskors dari peminjaman sampai semester selesai."
                if total_late == 1 else None
            )
        )
    }

@router.get("")
def list_late_records(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    sync_overdue_records(db)

    query = db.query(RiwayatKeterlambatan).join(DetailPeminjamanAlat).join(Peminjaman).join(Pengguna)
    if status and status != "Semua status":
        query = query.filter(RiwayatKeterlambatan.status == status)

    records = query.order_by(RiwayatKeterlambatan.id_riwayat.desc()).all()
    results = []

    now = datetime.utcnow()

    for r in records:
        da = r.detail_alat
        booking = da.peminjaman
        peminjam = booking.peminjam

        total_dipinjam = da.jumlah_pinjam
        sudah_kembali = sum(1 for al in da.alokasi_list if al.status_alokasi == "Kembali")
        belum_kembali = total_dipinjam - sudah_kembali

        # Count total late records for this borrower in the system
        peminjam_total_late = db.query(RiwayatKeterlambatan).join(DetailPeminjamanAlat).join(Peminjaman).filter(
            Peminjaman.id_pengguna == peminjam.id_pengguna
        ).count()
        terkena_skors = peminjam_total_late >= 2 or peminjam.status_akun == "Nonaktif"

        # Duration calculation
        end_time = r.waktu_selesai if r.waktu_selesai else now
        diff = end_time - r.mulai_terlambat
        days = diff.days
        hours = diff.seconds // 3600
        mins = (diff.seconds % 3600) // 60

        durasi_str = f"{days} hari {hours} jam" if days > 0 else f"{hours} jam {mins} menit"

        results.append({
            "id_riwayat": r.id_riwayat,
            "id_detail_alat": r.id_detail_alat,
            "id_peminjaman": booking.id_peminjaman,
            "kode_peminjaman": f"PMJ-{booking.id_peminjaman:04d}",
            "peminjam_nama": peminjam.nama,
            "peminjam_nomor_identitas": peminjam.nomor_identitas,
            "nama_alat": da.alat.nama_alat,
            "jumlah_dipinjam": total_dipinjam,
            "belum_kembali": belum_kembali,
            "tenggat": da.tenggat_pengembalian,
            "mulai_terlambat": r.mulai_terlambat,
            "waktu_selesai": r.waktu_selesai,
            "durasi_terlambat": durasi_str,
            "status": r.status,
            "catatan": r.catatan,
            "total_terlambat_peminjam": peminjam_total_late,
            "terkena_skors": terkena_skors
        })

    return results
