from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Alat, UnitAlat, Pengguna
from ..schemas import EquipmentCreate, EquipmentUpdate, EquipmentOut, UnitCreate, UnitUpdate, UnitOut
from ..auth import require_roles

router = APIRouter(prefix="/api/equipment", tags=["Inventaris Alat"])

@router.get("", response_model=List[EquipmentOut])
def list_equipment(db: Session = Depends(get_db)):
    equipments = db.query(Alat).all()
    results = []
    for eq in equipments:
        units = db.query(UnitAlat).filter(UnitAlat.id_alat == eq.id_alat).all()
        total = len(units)
        tersedia = sum(1 for u in units if u.status == "Tersedia")
        dipinjam = sum(1 for u in units if u.status == "Dipinjam")
        pemeliharaan = sum(1 for u in units if u.status == "Pemeliharaan")
        rusak = sum(1 for u in units if u.status == "Rusak")
        hilang = sum(1 for u in units if u.status == "Hilang")

        out = EquipmentOut(
            id_alat=eq.id_alat,
            nama_alat=eq.nama_alat,
            deskripsi=eq.deskripsi,
            alat_khusus=eq.alat_khusus,
            total_unit=total,
            tersedia=tersedia,
            dipinjam=dipinjam,
            pemeliharaan=pemeliharaan,
            rusak=rusak,
            hilang=hilang
        )
        results.append(out)
    return results

@router.post("", response_model=EquipmentOut, status_code=status.HTTP_201_CREATED)
def create_equipment(
    eq_in: EquipmentCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    eq = Alat(**eq_in.model_dump())
    db.add(eq)
    db.commit()
    db.refresh(eq)
    return EquipmentOut(
        id_alat=eq.id_alat,
        nama_alat=eq.nama_alat,
        deskripsi=eq.deskripsi,
        alat_khusus=eq.alat_khusus,
        total_unit=0,
        tersedia=0,
        dipinjam=0,
        pemeliharaan=0,
        rusak=0,
        hilang=0
    )

@router.put("/{id_alat}", response_model=EquipmentOut)
def update_equipment(
    id_alat: int,
    eq_in: EquipmentUpdate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium"]))
):
    eq = db.query(Alat).filter(Alat.id_alat == id_alat).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Alat tidak ditemukan.")

    for k, v in eq_in.model_dump(exclude_unset=True).items():
        setattr(eq, k, v)
    db.commit()
    db.refresh(eq)

    units = db.query(UnitAlat).filter(UnitAlat.id_alat == eq.id_alat).all()
    return EquipmentOut(
        id_alat=eq.id_alat,
        nama_alat=eq.nama_alat,
        deskripsi=eq.deskripsi,
        alat_khusus=eq.alat_khusus,
        total_unit=len(units),
        tersedia=sum(1 for u in units if u.status == "Tersedia"),
        dipinjam=sum(1 for u in units if u.status == "Dipinjam"),
        pemeliharaan=sum(1 for u in units if u.status == "Pemeliharaan"),
        rusak=sum(1 for u in units if u.status == "Rusak"),
        hilang=sum(1 for u in units if u.status == "Hilang")
    )

@router.delete("/{id_alat}", status_code=status.HTTP_200_OK)
def delete_equipment(
    id_alat: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium"]))
):
    eq = db.query(Alat).filter(Alat.id_alat == id_alat).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Jenis alat tidak ditemukan.")

    # Check if any unit is currently borrowed
    borrowed = db.query(UnitAlat).filter(
        UnitAlat.id_alat == id_alat,
        UnitAlat.status == "Dipinjam"
    ).count()
    if borrowed > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Jenis alat '{eq.nama_alat}' tidak dapat dihapus karena terdapat {borrowed} unit fisik yang sedang dipinjam."
        )

    # Clean up associated allocations and physical units
    units = db.query(UnitAlat).filter(UnitAlat.id_alat == id_alat).all()
    unit_ids = [u.id_unit for u in units]
    if unit_ids:
        from ..models import AlokasiUnitPeminjaman, DetailPengembalian
        allocs = db.query(AlokasiUnitPeminjaman).filter(AlokasiUnitPeminjaman.id_unit.in_(unit_ids)).all()
        alloc_ids = [a.id_alokasi for a in allocs]
        if alloc_ids:
            db.query(DetailPengembalian).filter(DetailPengembalian.id_alokasi.in_(alloc_ids)).delete(synchronize_session=False)
            db.query(AlokasiUnitPeminjaman).filter(AlokasiUnitPeminjaman.id_alokasi.in_(alloc_ids)).delete(synchronize_session=False)

    from ..models import DetailPeminjamanAlat, RiwayatKeterlambatan
    detail_alats = db.query(DetailPeminjamanAlat).filter(DetailPeminjamanAlat.id_alat == id_alat).all()
    da_ids = [da.id_detail_alat for da in detail_alats]
    if da_ids:
        db.query(RiwayatKeterlambatan).filter(RiwayatKeterlambatan.id_detail_alat.in_(da_ids)).delete(synchronize_session=False)
        db.query(DetailPeminjamanAlat).filter(DetailPeminjamanAlat.id_detail_alat.in_(da_ids)).delete(synchronize_session=False)

    db.query(UnitAlat).filter(UnitAlat.id_alat == id_alat).delete(synchronize_session=False)
    eq_name = eq.nama_alat
    db.delete(eq)
    db.commit()
    return {"message": f"Jenis alat '{eq_name}' dan seluruh unit fisiknya berhasil dihapus."}

@router.delete("/units/{id_unit}", status_code=status.HTTP_200_OK)
def delete_unit(
    id_unit: int,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran", "Kepala Laboratorium"]))
):
    unit = db.query(UnitAlat).filter(UnitAlat.id_unit == id_unit).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit alat tidak ditemukan.")

    if unit.status == "Dipinjam":
        raise HTTPException(
            status_code=400,
            detail=f"Unit '{unit.kode_inventaris}' tidak dapat dihapus karena sedang dipinjam."
        )

    from ..models import AlokasiUnitPeminjaman, DetailPengembalian
    allocs = db.query(AlokasiUnitPeminjaman).filter(AlokasiUnitPeminjaman.id_unit == id_unit).all()
    alloc_ids = [a.id_alokasi for a in allocs]
    if alloc_ids:
        db.query(DetailPengembalian).filter(DetailPengembalian.id_alokasi.in_(alloc_ids)).delete(synchronize_session=False)
        db.query(AlokasiUnitPeminjaman).filter(AlokasiUnitPeminjaman.id_alokasi.in_(alloc_ids)).delete(synchronize_session=False)

    kode = unit.kode_inventaris
    db.delete(unit)
    db.commit()
    return {"message": f"Unit '{kode}' berhasil dihapus."}

# --- Physical Units ---
@router.get("/units", response_model=List[UnitOut])
def list_units(
    id_alat: Optional[int] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(UnitAlat)
    if id_alat:
        query = query.filter(UnitAlat.id_alat == id_alat)
    if status and status != "Semua status":
        query = query.filter(UnitAlat.status == status)
    if search:
        search_fmt = f"%{search}%"
        query = query.filter(UnitAlat.kode_inventaris.ilike(search_fmt))
    return query.order_by(UnitAlat.kode_inventaris.asc()).all()

@router.post("/units", response_model=UnitOut, status_code=status.HTTP_201_CREATED)
def create_unit(
    unit_in: UnitCreate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    # Verify equipment exists
    eq = db.query(Alat).filter(Alat.id_alat == unit_in.id_alat).first()
    if not eq:
        raise HTTPException(status_code=404, detail="Jenis alat tidak ditemukan.")

    # Check unique kode_inventaris
    existing = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == unit_in.kode_inventaris).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Kode inventaris '{unit_in.kode_inventaris}' sudah digunakan.")

    unit = UnitAlat(**unit_in.model_dump())
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit

@router.patch("/units/{id_unit}", response_model=UnitOut)
def update_unit(
    id_unit: int,
    unit_in: UnitUpdate,
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Laboran"]))
):
    unit = db.query(UnitAlat).filter(UnitAlat.id_unit == id_unit).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit alat tidak ditemukan.")

    if unit_in.kode_inventaris and unit_in.kode_inventaris != unit.kode_inventaris:
        existing = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == unit_in.kode_inventaris).first()
        if existing:
            raise HTTPException(status_code=400, detail="Kode inventaris sudah digunakan unit lain.")
        unit.kode_inventaris = unit_in.kode_inventaris

    if unit_in.kondisi is not None:
        unit.kondisi = unit_in.kondisi
    if unit_in.status is not None:
        unit.status = unit_in.status

    db.commit()
    db.refresh(unit)
    return unit
