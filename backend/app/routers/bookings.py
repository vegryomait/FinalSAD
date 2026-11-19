from datetime import datetime, date, time
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import (
    Peminjaman, DetailPeminjamanRuang, DetailPeminjamanAlat,
    Ruangan, Alat, UnitAlat, JadwalKuliah, PengecualianJadwal,
    Persetujuan, Pengguna, RiwayatKeterlambatan
)
from ..schemas import BookingCreate, BookingOut
from ..auth import get_current_user, require_roles
from .rooms import HARI_MAP, times_overlap

router = APIRouter(prefix="/api/bookings", tags=["Peminjaman"])

def format_booking_response(b: Peminjaman) -> dict:
    return {
        "id_peminjaman": b.id_peminjaman,
        "kode_peminjaman": f"PMJ-{b.id_peminjaman:04d}",
        "id_pengguna": b.id_pengguna,
        "tanggal_pengajuan": b.tanggal_pengajuan,
        "tujuan": b.tujuan,
        "status": b.status,
        "catatan": b.catatan,
        "peminjam": {
            "id_pengguna": b.peminjam.id_pengguna,
            "nama": b.peminjam.nama,
            "email": b.peminjam.email,
            "nomor_identitas": b.peminjam.nomor_identitas,
            "role": b.peminjam.role,
            "status_akun": b.peminjam.status_akun
        } if b.peminjam else None,
        "detail_ruang_list": [
            {
                "id_detail_ruang": dr.id_detail_ruang,
                "id_ruangan": dr.id_ruangan,
                "tanggal": dr.tanggal,
                "jam_mulai": dr.jam_mulai,
                "jam_selesai": dr.jam_selesai,
                "ruangan": {
                    "id_ruangan": dr.ruangan.id_ruangan,
                    "nama_ruangan": dr.ruangan.nama_ruangan,
                    "lokasi": dr.ruangan.lokasi,
                    "kapasitas": dr.ruangan.kapasitas,
                    "deskripsi": dr.ruangan.deskripsi,
                    "status": dr.ruangan.status
                } if dr.ruangan else None
            } for dr in b.detail_ruang_list
        ],
        "detail_alat_list": [
            {
                "id_detail_alat": da.id_detail_alat,
                "id_alat": da.id_alat,
                "jumlah_pinjam": da.jumlah_pinjam,
                "tenggat_pengembalian": da.tenggat_pengembalian,
                "alat": {
                    "id_alat": da.alat.id_alat,
                    "nama_alat": da.alat.nama_alat,
                    "deskripsi": da.alat.deskripsi,
                    "alat_khusus": da.alat.alat_khusus
                } if da.alat else None,
                "alokasi_list": [
                    {
                        "id_alokasi": al.id_alokasi,
                        "id_detail_alat": al.id_detail_alat,
                        "id_unit": al.id_unit,
                        "status_alokasi": al.status_alokasi,
                        "tanggal_alokasi": al.tanggal_alokasi,
                        "unit": {
                            "id_unit": al.unit.id_unit,
                            "id_alat": al.unit.id_alat,
                            "kode_inventaris": al.unit.kode_inventaris,
                            "kondisi": al.unit.kondisi,
                            "status": al.unit.status
                        } if al.unit else None
                    } for al in da.alokasi_list
                ],
                "riwayat_keterlambatan": {
                    "id_riwayat": da.riwayat_keterlambatan.id_riwayat,
                    "id_detail_alat": da.riwayat_keterlambatan.id_detail_alat,
                    "mulai_terlambat": da.riwayat_keterlambatan.mulai_terlambat,
                    "waktu_selesai": da.riwayat_keterlambatan.waktu_selesai,
                    "status": da.riwayat_keterlambatan.status,
                    "catatan": da.riwayat_keterlambatan.catatan
                } if da.riwayat_keterlambatan else None
            } for da in b.detail_alat_list
        ],
        "persetujuan_list": [
            {
                "id_persetujuan": p.id_persetujuan,
                "id_peminjaman": p.id_peminjaman,
                "id_penyetuju": p.id_penyetuju,
                "jenis_persetujuan": p.jenis_persetujuan,
                "status": p.status,
                "catatan": p.catatan,
                "waktu_keputusan": p.waktu_keputusan,
                "penyetuju": {
                    "id_pengguna": p.penyetuju.id_pengguna,
                    "nama": p.penyetuju.nama,
                    "email": p.penyetuju.email,
                    "nomor_identitas": p.penyetuju.nomor_identitas,
                    "role": p.penyetuju.role,
                    "status_akun": p.penyetuju.status_akun
                } if p.penyetuju else None
            } for p in b.persetujuan_list
        ]
    }

@router.post("", status_code=status.HTTP_201_CREATED)
def create_booking(
    booking_in: BookingCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    if not booking_in.ruang and not booking_in.alat:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pengajuan harus memiliki setidaknya ruangan atau alat yang dipinjam."
        )

    # 0. Validasi Skorsing / Pembatasan Keterlambatan (Aturan: 2x terlambat = skors peminjaman)
    if current_user.status_akun == "Nonaktif":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda berstatus Nonaktif / Diskors sehingga tidak dapat mengajukan peminjaman. Silakan hubungi Laboran (Kak Dina)."
        )

    total_late_count = db.query(RiwayatKeterlambatan).join(DetailPeminjamanAlat).join(Peminjaman).filter(
        Peminjaman.id_pengguna == current_user.id_pengguna
    ).count()

    if total_late_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Pengajuan ditolak: Anda telah tercatat terlambat mengembalikan alat sebanyak {total_late_count} kali. Sesuai aturan laboratorium, peminjam yang terlambat 2 kali dalam satu semester diskors dan tidak diperkenankan meminjam lagi sampai semester selesai."
        )

    # 1. Validate Room if included
    if booking_in.ruang:
        r_in = booking_in.ruang
        if r_in.jam_selesai <= r_in.jam_mulai:
            raise HTTPException(status_code=400, detail="Jam selesai penggunaan ruangan harus lebih besar dari jam mulai.")

        room = db.query(Ruangan).filter(Ruangan.id_ruangan == r_in.id_ruangan).first()
        if not room:
            raise HTTPException(status_code=404, detail="Ruangan yang dipilih tidak ditemukan.")
        if room.status != "Aktif":
            raise HTTPException(status_code=400, detail=f"Ruangan {room.nama_ruangan} sedang tidak aktif / pemeliharaan.")

        day_name = HARI_MAP[r_in.tanggal.weekday()]

        # Check recurring schedule with exceptions
        schedules = db.query(JadwalKuliah).filter(
            JadwalKuliah.id_ruangan == room.id_ruangan,
            JadwalKuliah.hari == day_name,
            JadwalKuliah.berlaku_mulai <= r_in.tanggal,
            JadwalKuliah.berlaku_selesai >= r_in.tanggal
        ).all()

        for sched in schedules:
            exc = db.query(PengecualianJadwal).filter(
                PengecualianJadwal.id_jadwal == sched.id_jadwal,
                PengecualianJadwal.tanggal == r_in.tanggal
            ).first()

            if exc:
                if exc.jenis_pengecualian == "Pembatalan":
                    continue
                elif exc.jenis_pengecualian == "Perubahan" and exc.jam_mulai_baru and exc.jam_selesai_baru:
                    if times_overlap(r_in.jam_mulai, r_in.jam_selesai, exc.jam_mulai_baru, exc.jam_selesai_baru):
                        raise HTTPException(
                            status_code=400,
                            detail=f"Bentrok jadwal: {sched.nama_mata_kuliah} (jadwal diubah ke {exc.jam_mulai_baru.strftime('%H.%M')}–{exc.jam_selesai_baru.strftime('%H.%M')}) pada ruangan {room.nama_ruangan}."
                        )
            else:
                if times_overlap(r_in.jam_mulai, r_in.jam_selesai, sched.jam_mulai, sched.jam_selesai):
                    raise HTTPException(
                        status_code=400,
                        detail=f"Bentrok jadwal kuliah: {sched.nama_mata_kuliah} ({sched.jam_mulai.strftime('%H.%M')}–{sched.jam_selesai.strftime('%H.%M')}) pada ruangan {room.nama_ruangan}."
                    )

        # Check existing approved bookings
        existing_bookings = db.query(DetailPeminjamanRuang).join(Peminjaman).filter(
            DetailPeminjamanRuang.id_ruangan == room.id_ruangan,
            DetailPeminjamanRuang.tanggal == r_in.tanggal,
            Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali"])
        ).all()

        for eb in existing_bookings:
            if times_overlap(r_in.jam_mulai, r_in.jam_selesai, eb.jam_mulai, eb.jam_selesai):
                raise HTTPException(
                    status_code=400,
                    detail=f"Bentrok peminjaman: Ruangan {room.nama_ruangan} sudah disetujui untuk peminjaman lain pada jam {eb.jam_mulai.strftime('%H.%M')}–{eb.jam_selesai.strftime('%H.%M')}."
                )

    # 2. Validate Equipment if included
    has_alat_khusus = False
    if booking_in.alat:
        for a_in in booking_in.alat:
            if a_in.jumlah_pinjam <= 0:
                raise HTTPException(status_code=400, detail="Jumlah pinjam alat harus minimal 1.")
            eq = db.query(Alat).filter(Alat.id_alat == a_in.id_alat).first()
            if not eq:
                raise HTTPException(status_code=404, detail=f"Alat dengan ID {a_in.id_alat} tidak ditemukan.")
            if eq.alat_khusus:
                has_alat_khusus = True

            # Check available physical units
            available_count = db.query(UnitAlat).filter(
                UnitAlat.id_alat == eq.id_alat,
                UnitAlat.status == "Tersedia"
            ).count()

            if available_count < a_in.jumlah_pinjam:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stok unit alat {eq.nama_alat} tidak mencukupi. Tersedia: {available_count} unit, diminta: {a_in.jumlah_pinjam} unit."
                )

    # 3. Create Main Booking Transaction
    new_booking = Peminjaman(
        id_pengguna=current_user.id_pengguna,
        tanggal_pengajuan=datetime.utcnow(),
        tujuan=booking_in.tujuan,
        status="Menunggu Persetujuan",
        catatan=booking_in.catatan
    )
    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # 4. Add Room Detail if any
    if booking_in.ruang:
        dr = DetailPeminjamanRuang(
            id_peminjaman=new_booking.id_peminjaman,
            id_ruangan=booking_in.ruang.id_ruangan,
            tanggal=booking_in.ruang.tanggal,
            jam_mulai=booking_in.ruang.jam_mulai,
            jam_selesai=booking_in.ruang.jam_selesai
        )
        db.add(dr)

    # 5. Add Equipment Detail if any
    if booking_in.alat:
        for a_in in booking_in.alat:
            da = DetailPeminjamanAlat(
                id_peminjaman=new_booking.id_peminjaman,
                id_alat=a_in.id_alat,
                jumlah_pinjam=a_in.jumlah_pinjam,
                tenggat_pengembalian=a_in.tenggat_pengembalian
            )
            db.add(da)

    # 6. Create Approvals
    if has_alat_khusus:
        # Requires 2 approvals: Dosen Pengampu AND Laboran
        app_dosen = Persetujuan(
            id_peminjaman=new_booking.id_peminjaman,
            id_penyetuju=None,
            jenis_persetujuan="dosen_pengampu",
            status="Menunggu"
        )
        app_laboran = Persetujuan(
            id_peminjaman=new_booking.id_peminjaman,
            id_penyetuju=None,
            jenis_persetujuan="laboran",
            status="Menunggu"
        )
        db.add_all([app_dosen, app_laboran])
    else:
        # Regular booking: single approval from Laboran
        app_laboran = Persetujuan(
            id_peminjaman=new_booking.id_peminjaman,
            id_penyetuju=None,
            jenis_persetujuan="laboran",
            status="Menunggu"
        )
        db.add(app_laboran)

    db.commit()
    db.refresh(new_booking)

    return format_booking_response(new_booking)

@router.get("")
def list_bookings(
    status: Optional[str] = None,
    search: Optional[str] = None,
    tanggal_mulai: Optional[date] = None,
    tanggal_selesai: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    query = db.query(Peminjaman)
    if status and status != "Semua status":
        query = query.filter(Peminjaman.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.join(Pengguna).filter(
            or_(
                Pengguna.nama.ilike(search_fmt),
                Pengguna.nomor_identitas.ilike(search_fmt),
                Peminjaman.tujuan.ilike(search_fmt)
            )
        )
    if tanggal_mulai:
        query = query.filter(Peminjaman.tanggal_pengajuan >= datetime.combine(tanggal_mulai, time.min))
    if tanggal_selesai:
        query = query.filter(Peminjaman.tanggal_pengajuan <= datetime.combine(tanggal_selesai, time.max))

    bookings = query.order_by(Peminjaman.id_peminjaman.desc()).all()
    return [format_booking_response(b) for b in bookings]

@router.get("/my")
def list_my_bookings(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    query = db.query(Peminjaman).filter(Peminjaman.id_pengguna == current_user.id_pengguna)
    if status and status != "Semua status":
        query = query.filter(Peminjaman.status == status)
    bookings = query.order_by(Peminjaman.id_peminjaman.desc()).all()
    return [format_booking_response(b) for b in bookings]

@router.get("/{id_peminjaman}")
def get_booking(
    id_peminjaman: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(get_current_user)
):
    booking = db.query(Peminjaman).filter(Peminjaman.id_peminjaman == id_peminjaman).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Data peminjaman tidak ditemukan.")
    return format_booking_response(booking)
