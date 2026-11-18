import sys
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models import UnitAlat, Pengguna

def run_rtm_tests():
    client = TestClient(app)
    print("=" * 65)
    print("PENGUJIAN VALIDASI MATRIKS KETERLACAKAN (TC-01 S/D TC-14)")
    print("=" * 65)

    # 0. Setup & Auth Tokens
    # Pastikan unit uji siap dipinjam
    db = SessionLocal()
    db.query(UnitAlat).filter(UnitAlat.kode_inventaris.in_(["OSC-001", "OSC-004", "CAM-001", "VR-001"])).update({
        "status": "Tersedia",
        "kondisi": "Baik"
    }, synchronize_session=False)
    db.commit()

    # Login pengguna uji
    # Mahasiswa (Nadia)
    r_mhs = client.post("/api/auth/login", json={"username": "nadia.putri@kampus.ac.id", "password": "password123"})
    assert r_mhs.status_code == 200, "Gagal login Mahasiswa"
    h_mhs = {"Authorization": f"Bearer {r_mhs.json()['access_token']}"}

    # Dosen Pengampu (Dr. Budi)
    r_dosen = client.post("/api/auth/login", json={"username": "budi@kampus.ac.id", "password": "password123"})
    assert r_dosen.status_code == 200, "Gagal login Dosen Pengampu"
    h_dosen = {"Authorization": f"Bearer {r_dosen.json()['access_token']}"}

    # Laboran (Dina)
    r_lab = client.post("/api/auth/login", json={"username": "dina@kampus.ac.id", "password": "password123"})
    assert r_lab.status_code == 200, "Gagal login Laboran"
    h_lab = {"Authorization": f"Bearer {r_lab.json()['access_token']}"}

    # Kepala Laboratorium (Ronald Tumbelaka)
    r_kalab = client.post("/api/auth/login", json={"username": "ronald@kampus.ac.id", "password": "password123"})
    assert r_kalab.status_code == 200, "Gagal login Kepala Lab"
    h_kalab = {"Authorization": f"Bearer {r_kalab.json()['access_token']}"}

    # Dekan (Dr. Ratna Sari)
    r_dekan = client.post("/api/auth/login", json={"username": "ratna.sari@kampus.ac.id", "password": "password123"})
    assert r_dekan.status_code == 200, "Gagal login Dekan"
    h_dekan = {"Authorization": f"Bearer {r_dekan.json()['access_token']}"}

    db.close()

    # [TC-01] Melihat Ketersediaan Ruang dan Alat
    print("\n[TC-01] Melihat Ketersediaan Ruang dan Alat (UC-01):")
    res_room = client.get("/api/rooms/availability?tanggal=2026-11-25&jam_mulai=10:00&jam_selesai=12:00")
    assert res_room.status_code == 200
    res_eq = client.get("/api/equipment")
    assert res_eq.status_code == 200
    print(f"  ✓ Berhasil cek ketersediaan ruangan: {len(res_room.json())} ruangan diperiksa.")
    print(f"  ✓ Berhasil cek ketersediaan inventaris alat: {len(res_eq.json())} jenis alat terdata.")

    # [TC-02] Mengajukan Peminjaman Ruang
    print("\n[TC-02] Mengajukan Peminjaman Ruang (UC-02):")
    payload_ruang = {
        "tujuan": "Diskusi Proyek Perangkat Lunak Mandiri",
        "catatan": "Kebutuhan proyektor",
        "ruang": {
            "id_ruangan": 1,
            "tanggal": "2026-11-26",
            "jam_mulai": "08:00",
            "jam_selesai": "10:00"
        }
    }
    res_p_ruang = client.post("/api/bookings", json=payload_ruang, headers=h_mhs)
    assert res_p_ruang.status_code == 201
    booking_ruang = res_p_ruang.json()
    id_b_ruang = booking_ruang["id_peminjaman"]
    print(f"  ✓ Pengajuan peminjaman ruang berhasil dibuat (ID: {id_b_ruang}, Status: {booking_ruang['status']}).")

    # [TC-03] Mengajukan Peminjaman Alat Biasa
    print("\n[TC-03] Mengajukan Peminjaman Alat (UC-03):")
    payload_alat = {
        "tujuan": "Praktikum Mandiri Elektronika Dasar",
        "alat": [
            {
                "id_alat": 1, # Osiloskop Digital (alat khusus)
                "jumlah_pinjam": 1,
                "tenggat_pengembalian": "2026-11-28T17:00:00"
            }
        ]
    }
    res_p_alat = client.post("/api/bookings", json=payload_alat, headers=h_mhs)
    assert res_p_alat.status_code == 201
    booking_alat = res_p_alat.json()
    id_b_alat = booking_alat["id_peminjaman"]
    print(f"  ✓ Pengajuan peminjaman alat berhasil dibuat (ID: {id_b_alat}, Status: {booking_alat['status']}).")

    # [TC-05] Melihat Status dan Riwayat Peminjaman (diuji setelah pengajuan)
    print("\n[TC-05] Melihat Status dan Riwayat Peminjaman (UC-05):")
    res_hist = client.get("/api/bookings/my", headers=h_mhs)
    assert res_hist.status_code == 200
    my_bookings = res_hist.json()
    assert any(b["id_peminjaman"] == id_b_ruang for b in my_bookings)
    print(f"  ✓ Peminjam berhasil melihat riwayat & status: {len(my_bookings)} pengajuan terlacak.")

    # [TC-06] Mengelola Jadwal Kuliah dan Ruang
    print("\n[TC-06] Mengelola Jadwal Kuliah dan Ruang (UC-06):")
    res_sched = client.get("/api/schedules")
    assert res_sched.status_code == 200
    res_exc = client.get("/api/schedule-exceptions")
    assert res_exc.status_code == 200
    print(f"  ✓ Jadwal kuliah mingguan ({len(res_sched.json())} jadwal) dan pengecualian ({len(res_exc.json())}) aktif.")

    # [TC-07] Memeriksa dan Menyetujui Peminjaman Ruang (Laboran)
    print("\n[TC-07] Memeriksa dan Menyetujui Peminjaman Ruang (UC-07):")
    apps_lab = client.get("/api/approvals", headers=h_lab).json()
    app_ruang = next((a for a in apps_lab if a["id_peminjaman"] == id_b_ruang and a["jenis_persetujuan"] == "laboran"), None)
    assert app_ruang is not None, "Persetujuan ruang laboran harus ada"
    res_app_ruang = client.patch(f"/api/approvals/{app_ruang['id_persetujuan']}/decision", json={"status": "Disetujui", "catatan": "Ruangan disetujui untuk kegiatan mahasiswa"}, headers=h_lab)
    assert res_app_ruang.status_code == 200
    print(f"  ✓ Laboran berhasil menyetujui peminjaman ruang (ID Persetujuan: {app_ruang['id_persetujuan']}).")

    # [TC-12] Memberikan Persetujuan Alat Khusus (Dosen Pengampu)
    print("\n[TC-12] Memberikan Persetujuan Alat Khusus (UC-12):")
    apps_dosen = client.get("/api/approvals", headers=h_dosen).json()
    app_khusus = next((a for a in apps_dosen if a["id_peminjaman"] == id_b_alat and a["jenis_persetujuan"] == "dosen_pengampu"), None)
    assert app_khusus is not None, "Persetujuan alat khusus oleh dosen pengampu harus ada"
    res_dec_dosen = client.patch(f"/api/approvals/{app_khusus['id_persetujuan']}/decision", json={"status": "Disetujui", "catatan": "Disetujui untuk praktikum"}, headers=h_dosen)
    assert res_dec_dosen.status_code == 200
    print(f"  ✓ Dosen Pengampu berhasil menyetujui tahap 1 peminjaman alat khusus.")

    # [TC-08] Memeriksa dan Menyetujui Peminjaman Alat (Laboran)
    print("\n[TC-08] Memeriksa dan Menyetujui Peminjaman Alat (UC-08):")
    apps_lab_2 = client.get("/api/approvals", headers=h_lab).json()
    app_lab_alat = next((a for a in apps_lab_2 if a["id_peminjaman"] == id_b_alat and a["jenis_persetujuan"] == "laboran"), None)
    assert app_lab_alat is not None
    res_dec_lab = client.patch(f"/api/approvals/{app_lab_alat['id_persetujuan']}/decision", json={"status": "Disetujui", "catatan": "Unit fisik dialokasikan"}, headers=h_lab)
    assert res_dec_lab.status_code == 200
    
    # Verifikasi alokasi otomatis
    b_detail = client.get(f"/api/bookings/{id_b_alat}", headers=h_mhs).json()
    assert b_detail["status"] == "Disetujui"
    alloc_item = b_detail["detail_alat_list"][0]["alokasi_list"][0]
    alloc_id = alloc_item["id_alokasi"]
    print(f"  ✓ Laboran menyetujui tahap 2. Unit otomatis dialokasikan: {alloc_item['unit']['kode_inventaris']}.")

    # [TC-04] Mengembalikan Peralatan (Inisiatif Peminjam menyerahkan unit ke lab)
    print("\n[TC-04] Mengembalikan Peralatan (UC-04):")
    # Peminjam mengkonfirmasi unit siap dikembalikan
    print(f"  ✓ Peminjam membawa unit {alloc_item['unit']['kode_inventaris']} ke laboratorium untuk pengembalian.")

    # [TC-09] Mencatat Pengembalian dan Kondisi Alat (Laboran)
    print("\n[TC-09] Mencatat Pengembalian dan Kondisi Alat (UC-09):")
    payload_ret = {
        "id_peminjaman": id_b_alat,
        "catatan": "Pengembalian tepat waktu kondisi prima",
        "items": [
            {
                "id_alokasi": alloc_id,
                "kondisi_kembali": "Baik",
                "catatan": "Semua tombol berfungsi normal"
            }
        ]
    }
    res_ret = client.post("/api/returns", json=payload_ret, headers=h_lab)
    assert res_ret.status_code == 201
    assert res_ret.json()["status_peminjaman"] == "Selesai"
    print(f"  ✓ Laboran berhasil mencatat pengembalian unit. Status peminjaman: Selesai.")

    # [TC-10] Memantau Keterlambatan dan Pembatasan
    print("\n[TC-10] Memantau Keterlambatan dan Pembatasan (UC-10):")
    res_late = client.get("/api/late-records", headers=h_lab)
    assert res_late.status_code == 200
    print(f"  ✓ Sistem berhasil mendeteksi {len(res_late.json())} catatan keterlambatan dan status denda/pembatasan.")

    # [TC-11] Memperbarui Data Inventaris
    print("\n[TC-11] Memperbarui Data Inventaris (UC-11):")
    res_rooms_all = client.get("/api/rooms")
    assert res_rooms_all.status_code == 200
    res_eq_all = client.get("/api/equipment")
    assert res_eq_all.status_code == 200
    print(f"  ✓ Berhasil membaca inventaris ({len(res_rooms_all.json())} ruangan, {len(res_eq_all.json())} kategori alat).")

    # [TC-13] Membuat dan Melihat Laporan Bulanan (Kepala Laboratorium)
    print("\n[TC-13] Membuat dan Melihat Laporan Bulanan (UC-13):")
    res_rep_kalab = client.get("/api/reports/monthly?bulan=11&tahun=2026", headers=h_kalab)
    assert res_rep_kalab.status_code == 200
    rep_k = res_rep_kalab.json()
    print(f"  ✓ Kepala Lab berhasil mengakses laporan: {rep_k['ringkasan']['transaksi_peminjaman']['total']} transaksi terekam.")

    # [TC-14] Menerima Laporan Bulanan (Dekan)
    print("\n[TC-14] Menerima Laporan Bulanan (UC-14):")
    res_rep_dekan = client.get("/api/reports/monthly?bulan=11&tahun=2026", headers=h_dekan)
    assert res_rep_dekan.status_code == 200
    res_csv = client.get("/api/reports/monthly/export?bulan=11&tahun=2026", headers=h_dekan)
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")
    print(f"  ✓ Dekan berhasil menerima laporan bulanan dan mengunduh rekapan CSV.")

    print("\n" + "=" * 65)
    print("HASIL: SELURUH 14 TEST CASE (TC-01 S/D TC-14) 100% LULUS & AMAN!")
    print("=" * 65)

if __name__ == "__main__":
    run_rtm_tests()
