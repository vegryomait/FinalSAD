import csv
import io
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import extract

from ..database import get_db
from ..models import (
    Peminjaman, DetailPeminjamanRuang, DetailPeminjamanAlat,
    UnitAlat, Pengembalian, DetailPengembalian, RiwayatKeterlambatan,
    Ruangan, Alat, Pengguna
)
from ..auth import require_roles

router = APIRouter(prefix="/api/reports", tags=["Laporan"])

@router.get("/monthly")
def get_monthly_report(
    bulan: int = Query(..., ge=1, le=12, description="Bulan (1-12)"),
    tahun: int = Query(..., ge=2020, le=2040, description="Tahun (e.g. 2026)"),
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Kepala Laboratorium", "Dekan", "Laboran"]))
):
    # 1. Total bookings in this month
    bookings = db.query(Peminjaman).filter(
        extract("month", Peminjaman.tanggal_pengajuan) == bulan,
        extract("year", Peminjaman.tanggal_pengajuan) == tahun
    ).all()

    total_transaksi = len(bookings)
    ruangan_saja = 0
    alat_saja = 0
    keduanya = 0

    for b in bookings:
        has_room = len(b.detail_ruang_list) > 0
        has_tool = len(b.detail_alat_list) > 0
        if has_room and has_tool:
            keduanya += 1
        elif has_room:
            ruangan_saja += 1
        elif has_tool:
            alat_saja += 1

    # 2. Room usage
    room_details = db.query(DetailPeminjamanRuang).join(Peminjaman).filter(
        extract("month", DetailPeminjamanRuang.tanggal) == bulan,
        extract("year", DetailPeminjamanRuang.tanggal) == tahun,
        Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali", "Selesai"])
    ).all()

    total_sesi_ruang = len(room_details)
    total_durasi_jam_ruang = 0.0
    for rd in room_details:
        start_min = rd.jam_mulai.hour * 60 + rd.jam_mulai.minute
        end_min = rd.jam_selesai.hour * 60 + rd.jam_selesai.minute
        if end_min > start_min:
            total_durasi_jam_ruang += (end_min - start_min) / 60.0

    # 3. Equipment loans
    tool_details = db.query(DetailPeminjamanAlat).join(Peminjaman).filter(
        extract("month", Peminjaman.tanggal_pengajuan) == bulan,
        extract("year", Peminjaman.tanggal_pengajuan) == tahun,
        Peminjaman.status.in_(["Disetujui", "Berjalan", "Sebagian kembali", "Selesai"])
    ).all()

    total_alat_unit = sum(td.jumlah_pinjam for td in tool_details)
    transaksi_alat = len(set(td.id_peminjaman for td in tool_details))

    # 4. Returns & Late
    returns = db.query(DetailPengembalian).join(Pengembalian).filter(
        extract("month", Pengembalian.tanggal_pengembalian) == bulan,
        extract("year", Pengembalian.tanggal_pengembalian) == tahun
    ).all()

    total_unit_kembali = len(returns)

    # Check late returns in this month
    late_records = db.query(RiwayatKeterlambatan).filter(
        extract("month", RiwayatKeterlambatan.mulai_terlambat) == bulan,
        extract("year", RiwayatKeterlambatan.mulai_terlambat) == tahun
    ).all()
    total_terlambat = len(late_records)
    tepat_waktu = max(0, total_unit_kembali - total_terlambat)

    # 5. Current Physical Units Status
    all_units = db.query(UnitAlat).all()
    unit_total = len(all_units)
    unit_tersedia = sum(1 for u in all_units if u.status == "Tersedia")
    unit_dipinjam = sum(1 for u in all_units if u.status == "Dipinjam")
    unit_pemeliharaan = sum(1 for u in all_units if u.status == "Pemeliharaan")
    unit_rusak = sum(1 for u in all_units if u.status == "Rusak")
    unit_hilang = sum(1 for u in all_units if u.status == "Hilang")

    # 6. Detailed recap table
    rekapitulasi = []

    # Room recap
    rooms = db.query(Ruangan).all()
    for r in rooms:
        r_sessions = [rd for rd in room_details if rd.id_ruangan == r.id_ruangan]
        if r_sessions:
            durasi = sum(((rd.jam_selesai.hour * 60 + rd.jam_selesai.minute) - (rd.jam_mulai.hour * 60 + rd.jam_mulai.minute)) / 60.0 for rd in r_sessions)
            rekapitulasi.append({
                "kategori": "Ruangan",
                "jenis_kebutuhan": r.nama_ruangan,
                "transaksi_sesi": f"{len(r_sessions)} sesi",
                "unit_alat": "—",
                "durasi_ruangan": f"{durasi:.0f} jam"
            })

    # Equipment recap
    alats = db.query(Alat).all()
    for a in alats:
        a_details = [td for td in tool_details if td.id_alat == a.id_alat]
        if a_details:
            total_u = sum(td.jumlah_pinjam for td in a_details)
            rekapitulasi.append({
                "kategori": "Alat",
                "jenis_kebutuhan": a.nama_alat,
                "transaksi_sesi": f"{len(a_details)} transaksi",
                "unit_alat": f"{total_u} unit",
                "durasi_ruangan": "—"
            })

    return {
        "bulan": bulan,
        "tahun": tahun,
        "ringkasan": {
            "transaksi_peminjaman": {
                "total": total_transaksi,
                "ruangan_saja": ruangan_saja,
                "alat_saja": alat_saja,
                "ruangan_dan_alat": keduanya
            },
            "penggunaan_ruangan": {
                "total_sesi": total_sesi_ruang,
                "total_durasi_jam": round(total_durasi_jam_ruang, 1)
            },
            "peminjaman_alat": {
                "total_unit": total_alat_unit,
                "total_transaksi": transaksi_alat
            },
            "pengembalian_unit": {
                "total_kembali": total_unit_kembali,
                "tepat_waktu": tepat_waktu,
                "terlambat": total_terlambat
            },
            "status_unit_saat_ini": {
                "total_unit": unit_total,
                "tersedia": unit_tersedia,
                "dipinjam": unit_dipinjam,
                "pemeliharaan": unit_pemeliharaan,
                "rusak": unit_rusak,
                "hilang": unit_hilang
            }
        },
        "rekapitulasi": rekapitulasi
    }

@router.get("/monthly/export")
def export_monthly_report(
    bulan: int = Query(...),
    tahun: int = Query(...),
    db: Session = Depends(get_db),
    current_user: Pengguna = Depends(require_roles(["Kepala Laboratorium", "Dekan", "Laboran"]))
):
    data = get_monthly_report(bulan=bulan, tahun=tahun, db=db, current_user=current_user)

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["LAPORAN BULANAN SISTEM LABORATORIUM - LABORA"])
    writer.writerow([f"Periode: Bulan {bulan} Tahun {tahun}"])
    writer.writerow([])

    writer.writerow(["RINGKASAN UTAMA"])
    writer.writerow(["Metrik", "Nilai"])
    writer.writerow(["Total Transaksi Peminjaman", data["ringkasan"]["transaksi_peminjaman"]["total"]])
    writer.writerow(["- Transaksi Ruangan Saja", data["ringkasan"]["transaksi_peminjaman"]["ruangan_saja"]])
    writer.writerow(["- Transaksi Alat Saja", data["ringkasan"]["transaksi_peminjaman"]["alat_saja"]])
    writer.writerow(["- Transaksi Ruangan & Alat", data["ringkasan"]["transaksi_peminjaman"]["ruangan_dan_alat"]])
    writer.writerow(["Total Sesi Penggunaan Ruang", data["ringkasan"]["penggunaan_ruangan"]["total_sesi"]])
    writer.writerow(["Total Durasi Ruang (Jam)", data["ringkasan"]["penggunaan_ruangan"]["total_durasi_jam"]])
    writer.writerow(["Total Unit Alat Dipinjam", data["ringkasan"]["peminjaman_alat"]["total_unit"]])
    writer.writerow(["Total Unit Alat Dikembalikan", data["ringkasan"]["pengembalian_unit"]["total_kembali"]])
    writer.writerow(["Unit Tersedia Saat Ini", data["ringkasan"]["status_unit_saat_ini"]["tersedia"]])
    writer.writerow(["Unit Dipinjam Saat Ini", data["ringkasan"]["status_unit_saat_ini"]["dipinjam"]])
    writer.writerow(["Unit Dalam Pemeliharaan", data["ringkasan"]["status_unit_saat_ini"]["pemeliharaan"]])
    writer.writerow(["Unit Rusak", data["ringkasan"]["status_unit_saat_ini"]["rusak"]])
    writer.writerow([])

    writer.writerow(["REKAPITULASI AKTIVITAS"])
    writer.writerow(["Kategori", "Jenis Kebutuhan", "Sesi / Transaksi", "Unit Alat", "Durasi Ruangan"])
    for row in data["rekapitulasi"]:
        writer.writerow([row["kategori"], row["jenis_kebutuhan"], row["transaksi_sesi"], row["unit_alat"], row["durasi_ruangan"]])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=laporan-labora-{tahun}-{bulan:02d}.csv"}
    )
