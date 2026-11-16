from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import JadwalKuliah, PengecualianJadwal, Pengguna, Ruangan
from ..schemas import ScheduleCreate, ScheduleUpdate, ScheduleOut, ScheduleExceptionCreate, ScheduleExceptionOut
from ..auth import require_roles, get_current_user

router = APIRouter(tags=["Jadwal Kuliah"])

@router.get("/api/schedules", response_model=List[ScheduleOut])
def list_schedules(
    id_ruangan: Optional[int] = None,
    hari: Optional[str] = None,
    semester: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(JadwalKuliah)
    if id_ruangan:
        query = query.filter(JadwalKuliah.id_ruangan == id_ruangan)
    if hari:
        query = query.filter(JadwalKuliah.hari == hari)
    if semester:
        query = query.filter(JadwalKuliah.semester == semester)
    return query.order_by(JadwalKuliah.hari.asc(), JadwalKuliah.jam_mulai.asc()).all()

@router.post("/api/schedules", response_model=ScheduleOut, status_code=status.HTTP_201_CREATED)
def create_schedule(
    sched_in: ScheduleCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    room = db.query(Ruangan).filter(Ruangan.id_ruangan == sched_in.id_ruangan).first()
    if not room:
        raise HTTPException(status_code=404, detail="Ruangan tidak ditemukan.")

    if sched_in.jam_selesai <= sched_in.jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus lebih besar dari jam mulai.")

    sched = JadwalKuliah(**sched_in.model_dump())
    db.add(sched)
    db.commit()
    db.refresh(sched)
    return sched

@router.put("/api/schedules/{id_jadwal}", response_model=ScheduleOut)
def update_schedule(
    id_jadwal: int,
    sched_in: ScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    sched = db.query(JadwalKuliah).filter(JadwalKuliah.id_jadwal == id_jadwal).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan.")

    for k, v in sched_in.model_dump(exclude_unset=True).items():
        setattr(sched, k, v)
    db.commit()
    db.refresh(sched)
    return sched

@router.delete("/api/schedules/{id_jadwal}", status_code=status.HTTP_204_NO_CONTENT)
def delete_schedule(
    id_jadwal: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    sched = db.query(JadwalKuliah).filter(JadwalKuliah.id_jadwal == id_jadwal).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan.")
    db.delete(sched)
    db.commit()
    return None

# --- Schedule Exceptions ---
@router.get("/api/schedule-exceptions", response_model=List[ScheduleExceptionOut])
def list_exceptions(
    tanggal: Optional[date] = None,
    id_jadwal: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(PengecualianJadwal)
    if tanggal:
        query = query.filter(PengecualianJadwal.tanggal == tanggal)
    if id_jadwal:
        query = query.filter(PengecualianJadwal.id_jadwal == id_jadwal)
    return query.order_by(PengecualianJadwal.tanggal.desc()).all()

@router.post("/api/schedule-exceptions", response_model=ScheduleExceptionOut, status_code=status.HTTP_201_CREATED)
def create_exception(
    exc_in: ScheduleExceptionCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    sched = db.query(JadwalKuliah).filter(JadwalKuliah.id_jadwal == exc_in.id_jadwal).first()
    if not sched:
        raise HTTPException(status_code=404, detail="Jadwal kuliah induk tidak ditemukan.")

    exc = PengecualianJadwal(
        id_jadwal=exc_in.id_jadwal,
        tanggal=exc_in.tanggal,
        jenis_pengecualian=exc_in.jenis_pengecualian,
        jam_mulai_baru=exc_in.jam_mulai_baru,
        jam_selesai_baru=exc_in.jam_selesai_baru,
        alasan=exc_in.alasan,
        dibuat_oleh=current_user.id_pengguna
    )
    db.add(exc)
    db.commit()
    db.refresh(exc)
    return exc
