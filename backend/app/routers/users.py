from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Pengguna
from ..schemas import UserCreate, UserUpdate, UserOut
from ..auth import get_password_hash, require_roles

router = APIRouter(prefix="/api/users", tags=["Pengguna"])

@router.get("", response_model=List[UserOut])
def list_users(
    search: Optional[str] = Query(None, description="Cari nama, email, atau nomor identitas"),
    role: Optional[str] = Query(None, description="Filter role"),
    status: Optional[str] = Query(None, description="Filter status akun"),
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium", "Dekan"]))
):
    query = db.query(Pengguna)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            or_(
                Pengguna.nama.ilike(search_fmt),
                Pengguna.email.ilike(search_fmt),
                Pengguna.nomor_identitas.ilike(search_fmt)
            )
        )
    if role and role != "Semua role":
        query = query.filter(Pengguna.role == role)
    if status and status != "Semua status":
        query = query.filter(Pengguna.status_akun == status)

    return query.order_by(Pengguna.id_pengguna.asc()).all()

@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    existing = db.query(Pengguna).filter(
        or_(
            Pengguna.email == user_in.email,
            Pengguna.nomor_identitas == user_in.nomor_identitas
        )
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email atau nomor identitas sudah terdaftar dalam sistem."
        )

    new_user = Pengguna(
        nama=user_in.nama,
        email=user_in.email,
        password=get_password_hash(user_in.password),
        nomor_identitas=user_in.nomor_identitas,
        role=user_in.role,
        status_akun=user_in.status_akun or "Aktif",
        dibuat_oleh=current_user.id_pengguna
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{id_pengguna}", response_model=UserOut)
def get_user(
    id_pengguna: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium", "Dekan"]))
):
    user = db.query(Pengguna).filter(Pengguna.id_pengguna == id_pengguna).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")
    return user

@router.put("/{id_pengguna}", response_model=UserOut)
def update_user(
    id_pengguna: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    user = db.query(Pengguna).filter(Pengguna.id_pengguna == id_pengguna).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    if user_in.email and user_in.email != user.email:
        existing = db.query(Pengguna).filter(Pengguna.email == user_in.email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email sudah digunakan oleh akun lain.")
        user.email = user_in.email

    if user_in.nama is not None:
        user.nama = user_in.nama
    if user_in.nomor_identitas is not None:
        user.nomor_identitas = user_in.nomor_identitas
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.status_akun is not None:
        user.status_akun = user_in.status_akun
    if user_in.password:
        user.password = get_password_hash(user_in.password)

    db.commit()
    db.refresh(user)
    return user

@router.patch("/{id_pengguna}/toggle-status", response_model=UserOut)
def toggle_user_status(
    id_pengguna: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    user = db.query(Pengguna).filter(Pengguna.id_pengguna == id_pengguna).first()
    if not user:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan.")

    user.status_akun = "Nonaktif" if user.status_akun == "Aktif" else "Aktif"
    db.commit()
    db.refresh(user)
    return user
