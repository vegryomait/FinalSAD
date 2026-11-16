from datetime import date, time, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ruangan, JadwalKuliah, PengecualianJadwal, DetailPeminjamanRuang, Peminjaman, Pengguna
from ..schemas import RoomCreate, RoomUpdate, RoomOut
from ..auth import get_current_user, require_roles

router = APIRouter(prefix="/api/rooms", tags=["Ruangan"])

HARI_MAP = {
    0: "Senin",
    1: "Selasa",
    2: "Rabu",
    3: "Kamis",
    4: "Jumat",
    5: "Sabtu",
    6: "Minggu"
}

def times_overlap(start1: time, end1: time, start2: time, end2: time) -> bool:
    return max(start1, start2) < min(end1, end2)

@router.get("", response_model=List[RoomOut])
def list_rooms(db: Session = Depends(get_db)):
    return db.query(Ruangan).all()

@router.post("", response_model=RoomOut, status_code=status.HTTP_201_CREATED)
def create_room(
    room_in: RoomCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    room = Ruangan(**room_in.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    return room

@router.put("/{id_ruangan}", response_model=RoomOut)
def update_room(
    id_ruangan: int,
    room_in: RoomUpdate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    room = db.query(Ruangan).filter(Ruangan.id_ruangan == id_ruangan).first()
    if not room:
        raise HTTPException(status_code=404, detail="Ruangan tidak ditemukan.")

    for k, v in room_in.model_dump(exclude_unset=True).items():
        setattr(room, k, v)

    db.commit()
    db.refresh(room)
    return room

@router.get("/availability")
def check_room_availability(
    tanggal: date = Query(..., description="Format YYYY-MM-DD"),
    jam_mulai: time = Query(..., description="Format HH:MM"),
    jam_selesai: time = Query(..., description="Format HH:MM"),
    db: Session = Depends(get_db)
):
    if jam_selesai <= jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus lebih besar dari jam mulai.")

    day_name = HARI_MAP[tanggal.weekday()]
    rooms = db.query(Ruangan).all()
    results = []

    for room in rooms:
        is_available = True
        conflict_reason = None
        conflict_detail = None

        if room.status != "Aktif":
            is_available = False
            conflict_reason = f"Ruangan berstatus {room.status}"
        else:
            # 1. Check recurring class schedule for this day & date range
            schedules = db.query(JadwalKuliah).filter(
                JadwalKuliah.id_ruangan == room.id_ruangan,
                JadwalKuliah.hari == day_name,
                JadwalKuliah.berlaku_mulai <= tanggal,
                JadwalKuliah.berlaku_selesai >= tanggal
            ).all()

            for sched in schedules:
                # Check if there is an exception for this schedule on this specific date
                exc = db.query(PengecualianJadwal).filter(
                    PengecualianJadwal.id_jadwal == sched.id_jadwal,
                    PengecualianJadwal.tanggal == tanggal
                ).first()

                if exc:
                    if exc.jenis_pengecualian == "Pembatalan":
                        # Canceled class, doesn't conflict
                        continue
                    elif exc.jenis_pengecualian == "Perubahan" and exc.jam_mulai_baru and exc.jam_selesai_baru:
                        if times_overlap(jam_mulai, jam_selesai, exc.jam_mulai_baru, exc.jam_selesai_baru):
                            is_available = False
                            conflict_reason = f"Kuliah berlangsung {exc.jam_mulai_baru.strftime('%H.%M')}–{exc.jam_selesai_baru.strftime('%H.%M')}"
                            conflict_detail = f"{sched.nama_mata_kuliah} (Jadwal diubah)"
                            break
                else:
                    if times_overlap(jam_mulai, jam_selesai, sched.jam_mulai, sched.jam_selesai):
                        is_available = False
                        conflict_reason = f"Kuliah berlangsung {sched.jam_mulai.strftime('%H.%M')}–{sched.jam_selesai.strftime('%H.%M')}"
                        conflict_detail = sched.nama_mata_kuliah
                        break

            # 2. Check approved bookings on this date
            if is_available:
                booking_details = db.query(DetailPeminjamanRuang).join(Peminjaman).filter(
                    DetailPeminjamanRuang.id_ruangan == room.id_ruangan,
                    DetailPeminjamanRuang.tanggal == tanggal,
                    Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali"])
                ).all()

                for bd in booking_details:
                    if times_overlap(jam_mulai, jam_selesai, bd.jam_mulai, bd.jam_selesai):
                        is_available = False
                        conflict_reason = f"Peminjaman lain {bd.jam_mulai.strftime('%H.%M')}–{bd.jam_selesai.strftime('%H.%M')}"
                        conflict_detail = bd.peminjaman.tujuan
                        break

        results.append({
            "id_ruangan": room.id_ruangan,
            "nama_ruangan": room.nama_ruangan,
            "lokasi": room.lokasi,
            "kapasitas": room.kapasitas,
            "deskripsi": room.deskripsi,
            "is_available": is_available,
            "conflict_reason": conflict_reason,
            "conflict_detail": conflict_detail
        })

    return results

@router.get("/agenda")
def get_room_agenda(
    tanggal: date = Query(..., description="Format YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    """
    Returns agenda table for UC-03:
    Waktu | Ruangan | Agenda | Sumber | Status
    """
    day_name = HARI_MAP[tanggal.weekday()]
    agenda_items = []

    # 1. Recurring schedules for this weekday
    schedules = db.query(JadwalKuliah).filter(
        JadwalKuliah.hari == day_name,
        JadwalKuliah.berlaku_mulai <= tanggal,
        JadwalKuliah.berlaku_selesai >= tanggal
    ).all()

    for s in schedules:
        exc = db.query(PengecualianJadwal).filter(
            PengecualianJadwal.id_jadwal == s.id_jadwal,
            PengecualianJadwal.tanggal == tanggal
        ).first()

        if exc:
            if exc.jenis_pengecualian == "Pembatalan":
                agenda_items.append({
                    "waktu": f"{s.jam_mulai.strftime('%H.%M')}–{s.jam_selesai.strftime('%H.%M')}",
                    "ruangan": s.ruangan.nama_ruangan,
                    "agenda": f"{s.nama_mata_kuliah} · {s.nama_dosen}",
                    "sumber": "Pengecualian · pembatalan",
                    "status": "Dibatalkan",
                    "alasan": exc.alasan
                })
            elif exc.jenis_pengecualian == "Perubahan":
                waktu_str = f"{exc.jam_mulai_baru.strftime('%H.%M')}–{exc.jam_selesai_baru.strftime('%H.%M')}" if exc.jam_mulai_baru and exc.jam_selesai_baru else f"{s.jam_mulai.strftime('%H.%M')}–{s.jam_selesai.strftime('%H.%M')}"
                agenda_items.append({
                    "waktu": waktu_str,
                    "ruangan": s.ruangan.nama_ruangan,
                    "agenda": f"{s.nama_mata_kuliah} · {s.nama_dosen}",
                    "sumber": f"Pengecualian · dari {s.jam_mulai.strftime('%H.%M')}",
                    "status": "Diubah",
                    "alasan": exc.alasan
                })
        else:
            agenda_items.append({
                "waktu": f"{s.jam_mulai.strftime('%H.%M')}–{s.jam_selesai.strftime('%H.%M')}",
                "ruangan": s.ruangan.nama_ruangan,
                "agenda": f"{s.nama_mata_kuliah} · {s.nama_dosen}",
                "sumber": f"Mingguan · {day_name}",
                "status": "Terjadwal",
                "alasan": None
            })

    # 2. Approved Bookings
    bookings = db.query(DetailPeminjamanRuang).join(Peminjaman).filter(
        DetailPeminjamanRuang.tanggal == tanggal,
        Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali"])
    ).all()

    for b in bookings:
        agenda_items.append({
            "waktu": f"{b.jam_mulai.strftime('%H.%M')}–{b.jam_selesai.strftime('%H.%M')}",
            "ruangan": b.ruangan.nama_ruangan,
            "agenda": f"{b.peminjaman.tujuan} · PMJ-{b.peminjaman.id_peminjaman:04d}",
            "sumber": "Peminjaman lain",
            "status": "Disetujui",
            "alasan": None
        })

    agenda_items.sort(key=lambda x: x["waktu"])
    return agenda_items
