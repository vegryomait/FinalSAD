from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    Pengembalian, DetailPengembalian, AlokasiUnitPeminjaman,
    Peminjaman, UnitAlat, RiwayatKeterlambatan, Pengguna
)
from ..schemas import ReturnCreate, ReturnOut
from ..auth import require_roles
from .bookings import format_booking_response

router = APIRouter(prefix="/api/returns", tags=["Pengembalian"])

@router.get("/active-loans")
def list_active_loans_for_return(db: Session = Depends(get_db)):
    """
    Returns bookings that have allocated units currently out on loan (status Disetujui, Berjalan, Sebagian kembali)
    """
    bookings = db.query(Peminjaman).filter(
        Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali"])
    ).order_by(Peminjaman.id_peminjaman.desc()).all()

    results = []
    for b in bookings:
        allocated_items = []
        total_allocated = 0
        returned_count = 0

        for da in b.detail_alat_list:
            for al in da.alokasi_list:
                total_allocated += 1
                if al.status_alokasi == "Kembali":
                    returned_count += 1
                allocated_items.append({
                    "id_alokasi": al.id_alokasi,
                    "id_unit": al.id_unit,
                    "kode_inventaris": al.unit.kode_inventaris,
                    "nama_alat": da.alat.nama_alat,
                    "status_saat_ini": al.status_alokasi,
                    "unit_status": al.unit.status,
                    "tenggat": da.tenggat_pengembalian,
                    "id_detail_alat": da.id_detail_alat
                })

        if total_allocated > 0:
            results.append({
                "id_peminjaman": b.id_peminjaman,
                "kode_peminjaman": f"PMJ-{b.id_peminjaman:04d}",
                "peminjam_nama": b.peminjam.nama,
                "peminjam_nomor_identitas": b.peminjam.nomor_identitas,
                "tujuan": b.tujuan,
                "status": b.status,
                "total_allocated": total_allocated,
                "returned_count": returned_count,
                "remaining_count": total_allocated - returned_count,
                "allocated_items": allocated_items
            })

    return results

@router.post("", status_code=status.HTTP_201_CREATED)
def process_return(
    ret_in: ReturnCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium"]))
):
    booking = db.query(Peminjaman).filter(Peminjaman.id_peminjaman == ret_in.id_peminjaman).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Peminjaman tidak ditemukan.")

    if not ret_in.items:
        raise HTTPException(status_code=400, detail="Pilih setidaknya satu unit alat yang dikembalikan.")

    # Create master return record
    ret_record = Pengembalian(
        id_peminjaman=booking.id_peminjaman,
        id_laboran=current_user.id_pengguna,
        tanggal_pengembalian=datetime.utcnow(),
        catatan=ret_in.catatan
    )
    db.add(ret_record)
    db.commit()
    db.refresh(ret_record)

    # Process each unit item
    for item in ret_in.items:
        alloc = db.query(AlokasiUnitPeminjaman).filter(
            AlokasiUnitPeminjaman.id_alokasi == item.id_alokasi
        ).first()

        if not alloc:
            db.rollback()
            raise HTTPException(status_code=404, detail=f"Alokasi ID {item.id_alokasi} tidak ditemukan.")

        if alloc.status_alokasi == "Kembali":
            continue  # Already returned, skip

        # Create detail_pengembalian
        det = DetailPengembalian(
            id_pengembalian=ret_record.id_pengembalian,
            id_alokasi=alloc.id_alokasi,
            kondisi_kembali=item.kondisi_kembali,
            catatan=item.catatan
        )
        db.add(det)

        # Update allocation status
        alloc.status_alokasi = "Kembali"

        # Update physical unit status and condition
        unit = alloc.unit
        kondisi = item.kondisi_kembali
        unit.kondisi = kondisi

        if kondisi == "Baik":
            unit.status = "Tersedia"
        elif kondisi == "Rusak ringan":
            unit.status = "Pemeliharaan"
        elif kondisi == "Rusak berat":
            unit.status = "Rusak"
        elif kondisi == "Hilang":
            unit.status = "Hilang"
        else:
            unit.status = "Tersedia"

    db.commit()

    # Re-evaluate booking completion
    all_allocations = []
    for da in booking.detail_alat_list:
        for al in da.alokasi_list:
            all_allocations.append(al)

    total_units = len(all_allocations)
    returned_units = sum(1 for al in all_allocations if al.status_alokasi == "Kembali")

    if total_units > 0 and returned_units >= total_units:
        booking.status = "Selesai"
    elif returned_units > 0:
        booking.status = "Sebagian kembali"

    # Check and close late records if resolved
    for da in booking.detail_alat_list:
        detail_units = da.alokasi_list
        if detail_units and all(al.status_alokasi == "Kembali" for al in detail_units):
            late_rec = db.query(RiwayatKeterlambatan).filter(
                RiwayatKeterlambatan.id_detail_alat == da.id_detail_alat,
                RiwayatKeterlambatan.status == "Aktif"
            ).first()
            if late_rec:
                late_rec.status = "Selesai"
                late_rec.waktu_selesai = datetime.utcnow()

    db.commit()
    db.refresh(booking)

    return {
        "message": "Pengembalian berhasil dicatat.",
        "id_pengembalian": ret_record.id_pengembalian,
        "status_peminjaman": booking.status,
        "returned_count": returned_units,
        "total_units": total_units,
        "booking": format_booking_response(booking)
    }
