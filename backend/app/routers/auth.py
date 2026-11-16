from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Pengguna
from ..schemas import LoginRequest, TokenResponse, UserOut
from ..auth import verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Pengguna).filter(
        or_(
            Pengguna.email == req.username,
            Pengguna.nomor_identitas == req.username
        )
    ).first()

    if not user or not verify_password(req.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kredensial salah. Periksa email / nomor identitas dan password Anda."
        )

    if user.status_akun != "Aktif":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif. Hubungi Laboran untuk mengaktifkan kembali akun."
        )

    access_token = create_access_token(
        data={"sub": str(user.id_pengguna), "role": user.role, "nama": user.nama}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_me(current_user: Pengguna = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
