from datetime import datetime, date, time
from typing import List, Optional
from pydantic import BaseModel, EmailStr

# --- Auth ---
class LoginRequest(BaseModel):
    username: str  # email or nomor_identitas
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

# --- Pengguna ---
class UserBase(BaseModel):
    nama: str
    email: EmailStr
    nomor_identitas: str
    role: str
    status_akun: Optional[str] = "Aktif"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    nama: Optional[str] = None
    email: Optional[EmailStr] = None
    nomor_identitas: Optional[str] = None
    role: Optional[str] = None
    status_akun: Optional[str] = None
    password: Optional[str] = None

class UserOut(UserBase):
    id_pengguna: int
    dibuat_oleh: Optional[int] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Ruangan ---
class RoomBase(BaseModel):
    nama_ruangan: str
    lokasi: str
    kapasitas: int
    deskripsi: Optional[str] = None
    status: Optional[str] = "Aktif"

class RoomCreate(RoomBase):
    pass

class RoomUpdate(BaseModel):
    nama_ruangan: Optional[str] = None
    lokasi: Optional[str] = None
    kapasitas: Optional[int] = None
    deskripsi: Optional[str] = None
    status: Optional[str] = None

class RoomOut(RoomBase):
    id_ruangan: int

    class Config:
        from_attributes = True

# --- Jadwal Kuliah & Pengecualian ---
class ScheduleBase(BaseModel):
    id_ruangan: int
    nama_mata_kuliah: str
    nama_dosen: str
    hari: str
    jam_mulai: time
    jam_selesai: time
    berlaku_mulai: date
    berlaku_selesai: date
    semester: str

class ScheduleCreate(ScheduleBase):
    pass

class ScheduleUpdate(BaseModel):
    nama_mata_kuliah: Optional[str] = None
    nama_dosen: Optional[str] = None
    hari: Optional[str] = None
    jam_mulai: Optional[time] = None
    jam_selesai: Optional[time] = None
    berlaku_mulai: Optional[date] = None
    berlaku_selesai: Optional[date] = None
    semester: Optional[str] = None

class ScheduleOut(ScheduleBase):
    id_jadwal: int
    ruangan: Optional[RoomOut] = None

    class Config:
        from_attributes = True

class ScheduleExceptionCreate(BaseModel):
    id_jadwal: int
    tanggal: date
    jenis_pengecualian: str  # Pembatalan, Perubahan
    jam_mulai_baru: Optional[time] = None
    jam_selesai_baru: Optional[time] = None
    alasan: str

class ScheduleExceptionOut(BaseModel):
    id_pengecualian: int
    id_jadwal: int
    tanggal: date
    jenis_pengecualian: str
    jam_mulai_baru: Optional[time] = None
    jam_selesai_baru: Optional[time] = None
    alasan: str
    dibuat_oleh: int
    created_at: datetime
    jadwal: Optional[ScheduleOut] = None

    class Config:
        from_attributes = True

# --- Alat & Unit ---
class EquipmentBase(BaseModel):
    nama_alat: str
    deskripsi: Optional[str] = None
    alat_khusus: bool = False

class EquipmentCreate(EquipmentBase):
    pass

class EquipmentUpdate(BaseModel):
    nama_alat: Optional[str] = None
    deskripsi: Optional[str] = None
    alat_khusus: Optional[bool] = None

class EquipmentOut(EquipmentBase):
    id_alat: int
    total_unit: Optional[int] = 0
    tersedia: Optional[int] = 0
    dipinjam: Optional[int] = 0
    pemeliharaan: Optional[int] = 0
    rusak: Optional[int] = 0
    hilang: Optional[int] = 0

    class Config:
        from_attributes = True

class UnitBase(BaseModel):
    id_alat: int
    kode_inventaris: str
    kondisi: Optional[str] = "Baik"
    status: Optional[str] = "Tersedia"

class UnitCreate(UnitBase):
    pass

class UnitUpdate(BaseModel):
    kode_inventaris: Optional[str] = None
    kondisi: Optional[str] = None
    status: Optional[str] = None

class UnitOut(UnitBase):
    id_unit: int
    alat: Optional[EquipmentBase] = None

    class Config:
        from_attributes = True

# --- Peminjaman ---
class DetailRuangCreate(BaseModel):
    id_ruangan: int
    tanggal: date
    jam_mulai: time
    jam_selesai: time

class DetailRuangOut(BaseModel):
    id_detail_ruang: int
    id_ruangan: int
    tanggal: date
    jam_mulai: time
    jam_selesai: time
    ruangan: Optional[RoomOut] = None

    class Config:
        from_attributes = True

class DetailAlatCreate(BaseModel):
    id_alat: int
    jumlah_pinjam: int
    tenggat_pengembalian: datetime

class AlokasiUnitOut(BaseModel):
    id_alokasi: int
    id_detail_alat: int
    id_unit: int
    status_alokasi: str
    tanggal_alokasi: datetime
    unit: Optional[UnitOut] = None

    class Config:
        from_attributes = True

class RiwayatKeterlambatanOut(BaseModel):
    id_riwayat: int
    id_detail_alat: int
    mulai_terlambat: datetime
    waktu_selesai: Optional[datetime] = None
    status: str
    catatan: Optional[str] = None

    class Config:
        from_attributes = True

class DetailAlatOut(BaseModel):
    id_detail_alat: int
    id_alat: int
    jumlah_pinjam: int
    tenggat_pengembalian: datetime
    alat: Optional[EquipmentBase] = None
    alokasi_list: List[AlokasiUnitOut] = []
    riwayat_keterlambatan: Optional[RiwayatKeterlambatanOut] = None

    class Config:
        from_attributes = True

class ApprovalOut(BaseModel):
    id_persetujuan: int
    id_peminjaman: int
    id_penyetuju: Optional[int] = None
    jenis_persetujuan: str
    status: str
    catatan: Optional[str] = None
    waktu_keputusan: Optional[datetime] = None
    penyetuju: Optional[UserOut] = None

    class Config:
        from_attributes = True

class ApprovalDecisionRequest(BaseModel):
    status: str  # Disetujui, Ditolak
    catatan: Optional[str] = None

class BookingCreate(BaseModel):
    tujuan: str
    catatan: Optional[str] = None
    ruang: Optional[DetailRuangCreate] = None
    alat: Optional[List[DetailAlatCreate]] = None

class BookingOut(BaseModel):
    id_peminjaman: int
    id_pengguna: int
    tanggal_pengajuan: datetime
    tujuan: str
    status: str
    catatan: Optional[str] = None
    kode_peminjaman: Optional[str] = None
    peminjam: Optional[UserOut] = None
    detail_ruang_list: List[DetailRuangOut] = []
    detail_alat_list: List[DetailAlatOut] = []
    persetujuan_list: List[ApprovalOut] = []

    class Config:
        from_attributes = True

# --- Pengembalian ---
class ReturnUnitItem(BaseModel):
    id_alokasi: int
    kondisi_kembali: str  # Baik, Rusak ringan, Rusak berat, Hilang
    catatan: Optional[str] = None

class ReturnCreate(BaseModel):
    id_peminjaman: int
    catatan: Optional[str] = None
    items: List[ReturnUnitItem]

class DetailPengembalianOut(BaseModel):
    id_detail_pengembalian: int
    id_alokasi: int
    kondisi_kembali: str
    catatan: Optional[str] = None
    alokasi: Optional[AlokasiUnitOut] = None

    class Config:
        from_attributes = True

class ReturnOut(BaseModel):
    id_pengembalian: int
    id_peminjaman: int
    id_laboran: int
    tanggal_pengembalian: datetime
    catatan: Optional[str] = None
    detail_list: List[DetailPengembalianOut] = []

    class Config:
        from_attributes = True

# Resolve forward ref
TokenResponse.model_rebuild()
