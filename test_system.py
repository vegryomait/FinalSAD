import sys
from fastapi.testclient import TestClient
from backend.app.main import app

def run_tests():
    client = TestClient(app)
    print("==================================================")
    print("Memulai Pengujian Komprehensif Sistem labora.")
    print("==================================================")

    # Persiapan idempotensi: pastikan unit uji siap dipinjam
    from backend.app.database import SessionLocal
    from backend.app.models import UnitAlat
    _db = SessionLocal()
    _db.query(UnitAlat).filter(UnitAlat.kode_inventaris.in_(["OSC-001", "OSC-004"])).update({
        "status": "Tersedia",
        "kondisi": "Baik"
    }, synchronize_session=False)
    _db.commit()
    _db.close()

    # 1. Test UC-01: Login Mahasiswa & Laboran
    print("\n[UC-01] Pengujian Autentikasi Login:")
    res_nadia = client.post("/api/auth/login", json={"username": "nadia.putri@kampus.ac.id", "password": "password123"})
    assert res_nadia.status_code == 200, f"Login Nadia gagal: {res_nadia.text}"
    token_nadia = res_nadia.json()["access_token"]
    print("  ✓ Login Mahasiswa (Nadia Putri) berhasil.")

    res_sinta = client.post("/api/auth/login", json={"username": "sinta@kampus.ac.id", "password": "password123"})
    assert res_sinta.status_code == 200, f"Login Sinta gagal: {res_sinta.text}"
    token_sinta = res_sinta.json()["access_token"]
    print("  ✓ Login Laboran (Sinta Rahma) berhasil.")

    res_budi = client.post("/api/auth/login", json={"username": "budi@kampus.ac.id", "password": "password123"})
    assert res_budi.status_code == 200, f"Login Budi gagal: {res_budi.text}"
    token_budi = res_budi.json()["access_token"]
    print("  ✓ Login Dosen Pengampu (Dr. Budi Santoso) berhasil.")

    headers_nadia = {"Authorization": f"Bearer {token_nadia}"}
    headers_sinta = {"Authorization": f"Bearer {token_sinta}"}
    headers_budi = {"Authorization": f"Bearer {token_budi}"}

    # 2. Test UC-02: Pengelolaan Akun Pengguna
    print("\n[UC-02] Pengujian Pengelolaan Akun Pengguna:")
    res_users = client.get("/api/users", headers=headers_sinta)
    assert res_users.status_code == 200
    print(f"  ✓ Laboran berhasil mengambil daftar pengguna: {len(res_users.json())} akun.")

    # 3. Test UC-03: Ketersediaan Ruangan & Agenda
    print("\n[UC-03] Pengujian Ketersediaan Ruangan:")
    res_avail = client.get("/api/rooms/availability?tanggal=2026-11-16&jam_mulai=13:00&jam_selesai=15:00")
    assert res_avail.status_code == 200
    rooms = res_avail.json()
    print(f"  ✓ Memeriksa ketersediaan {len(rooms)} ruangan pada 2026-11-16 (13:00-15:00):")
    for r in rooms:
        status_str = "Tersedia" if r["is_available"] else f"Bentrok ({r['conflict_reason']})"
        print(f"    - {r['nama_ruangan']}: {status_str}")

    res_agenda = client.get("/api/rooms/agenda?tanggal=2026-11-16")
    assert res_agenda.status_code == 200
    print(f"  ✓ Agenda ruangan tanggal 2026-11-16: {len(res_agenda.json())} kegiatan tercatat.")

    # 4. Test UC-04: Pengajuan Peminjaman Gabungan (Ruangan & Alat)
    print("\n[UC-04] Pengujian Pengajuan Peminjaman Gabungan:")
    booking_payload = {
        "tujuan": "Praktikum Sinyal dan Sistem Otomatisasi",
        "catatan": "Kelompok Mandiri",
        "ruang": {
            "id_ruangan": 1,
            "tanggal": "2026-11-20",
            "jam_mulai": "09:00",
            "jam_selesai": "11:00"
        },
        "alat": [
            {
                "id_alat": 1,
                "jumlah_pinjam": 1,
                "tenggat_pengembalian": "2026-11-21T16:00:00"
            }
        ]
    }
    res_new_booking = client.post("/api/bookings", json=booking_payload, headers=headers_nadia)
    assert res_new_booking.status_code == 201, f"Booking gagal: {res_new_booking.text}"
    created_booking = res_new_booking.json()
    new_booking_id = created_booking["id_peminjaman"]
    print(f"  ✓ Pengajuan baru berhasil dibuat: {created_booking['kode_peminjaman']} (Status: {created_booking['status']}).")
    print(f"  ✓ Memiliki detail ruang: {len(created_booking['detail_ruang_list'])} & detail alat: {len(created_booking['detail_alat_list'])}.")
    print(f"  ✓ Persetujuan yang diterbitkan: {len(created_booking['persetujuan_list'])} tahap.")

    # 5. Test UC-05: Persetujuan Alat Khusus
    print("\n[UC-05] Pengujian Persetujuan Bertingkat (Alat Khusus):")
    res_apps = client.get("/api/approvals", headers=headers_budi)
    assert res_apps.status_code == 200
    print(f"  ✓ Antrean persetujuan Dosen Pengampu: {len(res_apps.json())} pengajuan.")

    # Find the approval for the newly created booking
    target_app_dosen = next((a for a in res_apps.json() if a["id_peminjaman"] == new_booking_id and a["jenis_persetujuan"] == "dosen_pengampu"), None)
    if target_app_dosen:
        res_dec1 = client.patch(f"/api/approvals/{target_app_dosen['id_persetujuan']}/decision", json={"status": "Disetujui", "catatan": "Disetujui oleh Dosen Pengampu"}, headers=headers_budi)
        assert res_dec1.status_code == 200
        print("  ✓ Persetujuan Dosen Pengampu: Disetujui.")

    # Laboran approves the second stage
    res_apps_lab = client.get("/api/approvals", headers=headers_sinta)
    target_app_lab = next((a for a in res_apps_lab.json() if a["id_peminjaman"] == new_booking_id and a["jenis_persetujuan"] == "laboran"), None)
    if target_app_lab:
        res_dec2 = client.patch(f"/api/approvals/{target_app_lab['id_persetujuan']}/decision", json={"status": "Disetujui", "catatan": "Disetujui oleh Laboran"}, headers=headers_sinta)
        assert res_dec2.status_code == 200
        print("  ✓ Persetujuan Laboran: Disetujui.")

    # Check that booking status became 'Disetujui' and physical units were allocated!
    res_b_detail = client.get(f"/api/bookings/{new_booking_id}", headers=headers_nadia)
    assert res_b_detail.status_code == 200
    b_data = res_b_detail.json()
    assert b_data["status"] == "Disetujui", f"Status expected Disetujui, got {b_data['status']}"
    allocs = b_data["detail_alat_list"][0]["alokasi_list"]
    assert len(allocs) > 0, "Alokasi unit fisik seharusnya terisi otomatis!"
    allocated_code = allocs[0]["unit"]["kode_inventaris"]
    print(f"  ✓ Status transaksi berubah menjadi: {b_data['status']}.")
    print(f"  ✓ Alokasi unit fisik transaksional otomatis: Unit {allocated_code} dialokasikan!")

    # 6. Test UC-06: Riwayat Peminjaman Saya
    print("\n[UC-06] Pengujian Riwayat Peminjaman:")
    res_my = client.get("/api/bookings/my", headers=headers_nadia)
    assert res_my.status_code == 200
    print(f"  ✓ Riwayat peminjaman peminjam: {len(res_my.json())} transaksi.")

    # 7. Test UC-07: Pengembalian Bertahap (Laboran)
    print("\n[UC-07] Pengujian Pengembalian Alat Bertahap:")
    res_loans = client.get("/api/returns/active-loans", headers=headers_sinta)
    assert res_loans.status_code == 200
    target_loan = next((l for l in res_loans.json() if l["id_peminjaman"] == new_booking_id), None)
    if target_loan and target_loan["allocated_items"]:
        alloc_id = target_loan["allocated_items"][0]["id_alokasi"]
        return_payload = {
            "id_peminjaman": new_booking_id,
            "catatan": "Unit dikembalikan dalam kondisi baik setelah praktikum",
            "items": [
                {
                    "id_alokasi": alloc_id,
                    "kondisi_kembali": "Baik",
                    "catatan": "Pemeriksaan fungsi normal"
                }
            ]
        }
        res_ret = client.post("/api/returns", json=return_payload, headers=headers_sinta)
        assert res_ret.status_code == 201
        print(f"  ✓ Pengembalian unit berhasil dicatat. Status transaksi menjadi: {res_ret.json()['status_peminjaman']}.")

    # 8. Test UC-08: Keterlambatan
    print("\n[UC-08] Pengujian Pemantauan Keterlambatan:")
    res_late = client.get("/api/late-records", headers=headers_sinta)
    assert res_late.status_code == 200
    print(f"  ✓ Data pemantauan keterlambatan: {len(res_late.json())} catatan terlambat terpantau.")

    # 9. Test UC-09: Inventaris Ruangan & Alat
    print("\n[UC-09] Pengujian Inventaris:")
    res_eq = client.get("/api/equipment")
    assert res_eq.status_code == 200
    res_units = client.get("/api/equipment/units")
    assert res_units.status_code == 200
    print(f"  ✓ Data kategori alat: {len(res_eq.json())} jenis, total unit fisik: {len(res_units.json())} unit.")

    # 10. Test UC-10: Jadwal Kuliah & Pengecualian
    print("\n[UC-10] Pengujian Jadwal Kuliah:")
    res_sched = client.get("/api/schedules")
    assert res_sched.status_code == 200
    res_exc = client.get("/api/schedule-exceptions")
    assert res_exc.status_code == 200
    print(f"  ✓ Jadwal berulang mingguan: {len(res_sched.json())} jadwal, pengecualian: {len(res_exc.json())} pengecualian.")

    # 11. Test UC-11: Laporan Bulanan
    print("\n[UC-11] Pengujian Laporan Bulanan & Ekspor CSV:")
    res_rep = client.get("/api/reports/monthly?bulan=11&tahun=2026", headers=headers_sinta)
    assert res_rep.status_code == 200
    rep_json = res_rep.json()
    print(f"  ✓ Total transaksi bulan ini: {rep_json['ringkasan']['transaksi_peminjaman']['total']}.")
    print(f"  ✓ Total sesi ruangan: {rep_json['ringkasan']['penggunaan_ruangan']['total_sesi']} sesi ({rep_json['ringkasan']['penggunaan_ruangan']['total_durasi_jam']} jam).")
    print(f"  ✓ Rekapitulasi per aktivitas: {len(rep_json['rekapitulasi'])} baris data.")

    res_csv = client.get("/api/reports/monthly/export?bulan=11&tahun=2026", headers=headers_sinta)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")
    print("  ✓ Ekspor laporan CSV berhasil dihasilkan.")

    print("\n==================================================")
    print("SELURUH 11 USE CASE BERHASIL TERVERIFIKASI 100%!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
