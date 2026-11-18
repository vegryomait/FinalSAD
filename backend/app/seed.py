from datetime import datetime, date, time, timedelta
from sqlalchemy.orm import Session
from .database import SessionLocal, engine, Base
from .models import (
    Pengguna, Ruangan, JadwalKuliah, PengecualianJadwal,
    Alat, UnitAlat, Peminjaman, DetailPeminjamanRuang,
    DetailPeminjamanAlat, AlokasiUnitPeminjaman, Persetujuan,
    Pengembalian, DetailPengembalian, RiwayatKeterlambatan
)
from .auth import get_password_hash

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(Pengguna).first():
        print("Database already has records, skipping seed.")
        db.close()
        return

    print("Seeding initial data...")
    pwd = get_password_hash("password123")

    # 1. Users
    dina = Pengguna(
        nama="Dina",
        email="dina@kampus.ac.id",
        password=pwd,
        nomor_identitas="LAB-001",
        role="Laboran",
        status_akun="Aktif"
    )
    db.add(dina)
    db.commit()
    db.refresh(dina)

    users = [
        Pengguna(nama="Nadia Putri", email="nadia.putri@kampus.ac.id", password=pwd, nomor_identitas="2204101021", role="Mahasiswa", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Rizky Pratama", email="rizky@kampus.ac.id", password=pwd, nomor_identitas="2204101048", role="Mahasiswa", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Dr. Budi Santoso", email="budi@kampus.ac.id", password=pwd, nomor_identitas="198603121", role="Dosen Pengampu", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Dr. Maya Dewi", email="maya@kampus.ac.id", password=pwd, nomor_identitas="198904053", role="Dosen", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Andi Saputra", email="andi@kampus.ac.id", password=pwd, nomor_identitas="2104101009", role="Mahasiswa", status_akun="Nonaktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Farhan Akbar", email="farhan@kampus.ac.id", password=pwd, nomor_identitas="2204101033", role="Mahasiswa", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Rina Lestari", email="rina@kampus.ac.id", password=pwd, nomor_identitas="2204101055", role="Mahasiswa", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Dimas Putra", email="dimas@kampus.ac.id", password=pwd, nomor_identitas="2204101062", role="Mahasiswa", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Ronald Tumbelaka", email="ronald@kampus.ac.id", password=pwd, nomor_identitas="197508151", role="Kepala Laboratorium", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
        Pengguna(nama="Dr. Ratna Sari", email="ratna.sari@kampus.ac.id", password=pwd, nomor_identitas="197001011", role="Dekan", status_akun="Aktif", dibuat_oleh=dina.id_pengguna),
    ]
    db.add_all(users)
    db.commit()

    # User lookup
    nadia = db.query(Pengguna).filter(Pengguna.email == "nadia.putri@kampus.ac.id").first()
    dr_budi = db.query(Pengguna).filter(Pengguna.email == "budi@kampus.ac.id").first()
    farhan = db.query(Pengguna).filter(Pengguna.email == "farhan@kampus.ac.id").first()
    rina = db.query(Pengguna).filter(Pengguna.email == "rina@kampus.ac.id").first()
    dimas = db.query(Pengguna).filter(Pengguna.email == "dimas@kampus.ac.id").first()

    # 2. Ruangan
    r_komputer = Ruangan(nama_ruangan="Lab Komputer 01", lokasi="Gedung A · Lantai 2", kapasitas=40, deskripsi="Laboratorium komputer multimedia dan pemrograman", status="Aktif")
    r_elektro = Ruangan(nama_ruangan="Lab Elektronika", lokasi="Gedung B · Lantai 1", kapasitas=24, deskripsi="Laboratorium rangkaian digital dan sistem tertanam", status="Aktif")
    r_multimedia = Ruangan(nama_ruangan="Lab Multimedia", lokasi="Gedung A · Lantai 3", kapasitas=30, deskripsi="Laboratorium desain dan produksi konten digital", status="Aktif")
    db.add_all([r_komputer, r_elektro, r_multimedia])
    db.commit()

    # 3. Jadwal Kuliah (Recurring weekly)
    today = date(2026, 11, 16)
    sem_start = date(2026, 9, 1)
    sem_end = date(2026, 12, 31)

    j1 = JadwalKuliah(id_ruangan=r_komputer.id_ruangan, nama_mata_kuliah="Pemrograman Dasar", nama_dosen="Dr. Budi Santoso", hari="Senin", jam_mulai=time(8, 0), jam_selesai=time(9, 40), berlaku_mulai=sem_start, berlaku_selesai=sem_end, semester="Ganjil 2026/2027")
    j2 = JadwalKuliah(id_ruangan=r_komputer.id_ruangan, nama_mata_kuliah="Praktikum Basis Data", nama_dosen="Dr. Budi Santoso", hari="Senin", jam_mulai=time(10, 0), jam_selesai=time(11, 40), berlaku_mulai=sem_start, berlaku_selesai=sem_end, semester="Ganjil 2026/2027")
    j3 = JadwalKuliah(id_ruangan=r_elektro.id_ruangan, nama_mata_kuliah="Rangkaian Digital", nama_dosen="Dr. Maya Dewi", hari="Senin", jam_mulai=time(13, 0), jam_selesai=time(14, 40), berlaku_mulai=sem_start, berlaku_selesai=sem_end, semester="Ganjil 2026/2027")
    j4 = JadwalKuliah(id_ruangan=r_multimedia.id_ruangan, nama_mata_kuliah="Produksi Media", nama_dosen="Dr. Raka", hari="Senin", jam_mulai=time(13, 0), jam_selesai=time(15, 0), berlaku_mulai=sem_start, berlaku_selesai=sem_end, semester="Ganjil 2026/2027")
    db.add_all([j1, j2, j3, j4])
    db.commit()

    # 4. Pengecualian Jadwal
    exc1 = PengecualianJadwal(id_jadwal=j2.id_jadwal, tanggal=today, jenis_pengecualian="Perubahan", jam_mulai_baru=time(10, 0), jam_selesai_baru=time(11, 40), alasan="Pergeseran dari jam 09.00 karena rapat koordinasi", dibuat_oleh=sinta.id_pengguna)
    exc2 = PengecualianJadwal(id_jadwal=j4.id_jadwal, tanggal=today, jenis_pengecualian="Pembatalan", jam_mulai_baru=None, jam_selesai_baru=None, alasan="Jadwal hari ini dibatalkan karena dosen narasumber dinas", dibuat_oleh=sinta.id_pengguna)
    db.add_all([exc1, exc2])
    db.commit()

    # 5. Alat
    a_osc = Alat(nama_alat="Osiloskop digital", deskripsi="Ukur sinyal frekuensi 100 MHz, dual channel", alat_khusus=True)
    a_mlt = Alat(nama_alat="Multimeter digital", deskripsi="Ukur arus, tegangan, dan resistansi presisi", alat_khusus=False)
    a_mic = Alat(nama_alat="Mikroskop trinokuler", deskripsi="Mikroskop optik trinokuler resolusi tinggi", alat_khusus=True)
    a_spe = Alat(nama_alat="Spektrofotometer", deskripsi="Spektrofotometer UV-Vis untuk analisis material", alat_khusus=True)
    a_gen = Alat(nama_alat="Function Generator", deskripsi="Generator sinyal sinus, kotak, dan segitiga 20 MHz", alat_khusus=False)
    db.add_all([a_osc, a_mlt, a_mic, a_spe, a_gen])
    db.commit()

    # 6. Unit Alat
    units = [
        # Osiloskop
        UnitAlat(id_alat=a_osc.id_alat, kode_inventaris="OSC-001", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_osc.id_alat, kode_inventaris="OSC-002", kondisi="Baik", status="Dipinjam"),
        UnitAlat(id_alat=a_osc.id_alat, kode_inventaris="OSC-003", kondisi="Rusak ringan", status="Pemeliharaan"),
        UnitAlat(id_alat=a_osc.id_alat, kode_inventaris="OSC-004", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_osc.id_alat, kode_inventaris="OSC-010", kondisi="Rusak ringan", status="Pemeliharaan"),
        # Multimeter
        UnitAlat(id_alat=a_mlt.id_alat, kode_inventaris="MLT-011", kondisi="Baik", status="Dipinjam"),
        UnitAlat(id_alat=a_mlt.id_alat, kode_inventaris="MLT-012", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_mlt.id_alat, kode_inventaris="MLT-013", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_mlt.id_alat, kode_inventaris="MLT-014", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_mlt.id_alat, kode_inventaris="MLT-020", kondisi="Rusak berat", status="Rusak"),
        # Mikroskop
        UnitAlat(id_alat=a_mic.id_alat, kode_inventaris="MIC-001", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_mic.id_alat, kode_inventaris="MIC-002", kondisi="Baik", status="Tersedia"),
        # Spektrofotometer
        UnitAlat(id_alat=a_spe.id_alat, kode_inventaris="SPE-001", kondisi="Baik", status="Tersedia"),
        # Function Gen
        UnitAlat(id_alat=a_gen.id_alat, kode_inventaris="GEN-001", kondisi="Baik", status="Tersedia"),
        UnitAlat(id_alat=a_gen.id_alat, kode_inventaris="GEN-002", kondisi="Baik", status="Tersedia"),
    ]
    db.add_all(units)
    db.commit()

    # Unit lookup
    u_osc1 = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == "OSC-001").first()
    u_osc2 = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == "OSC-002").first()
    u_osc3 = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == "OSC-003").first()
    u_mlt1 = db.query(UnitAlat).filter(UnitAlat.kode_inventaris == "MLT-011").first()

    # 7. Mock Booking: PMJ-0138 (Nadia Putri - Sebagian Kembali)
    pmj_138 = Peminjaman(
        id_pengguna=nadia.id_pengguna,
        tanggal_pengajuan=datetime(2026, 11, 13, 8, 0),
        tujuan="Praktikum pengukuran rangkaian elektronika daya",
        status="Sebagian kembali",
        catatan="Digunakan oleh kelompok 4, kelas A."
    )
    db.add(pmj_138)
    db.commit()

    # Detail Ruang PMJ-0138
    dr_138 = DetailPeminjamanRuang(
        id_peminjaman=pmj_138.id_peminjaman,
        id_ruangan=r_elektro.id_ruangan,
        tanggal=date(2026, 11, 14),
        jam_mulai=time(9, 0),
        jam_selesai=time(12, 0)
    )
    # Detail Alat PMJ-0138 (3 Osiloskop + 1 Multimeter)
    da_osc_138 = DetailPeminjamanAlat(
        id_peminjaman=pmj_138.id_peminjaman,
        id_alat=a_osc.id_alat,
        jumlah_pinjam=3,
        tenggat_pengembalian=datetime(2026, 11, 16, 16, 0)
    )
    da_mlt_138 = DetailPeminjamanAlat(
        id_peminjaman=pmj_138.id_peminjaman,
        id_alat=a_mlt.id_alat,
        jumlah_pinjam=1,
        tenggat_pengembalian=datetime(2026, 11, 16, 16, 0)
    )
    db.add_all([dr_138, da_osc_138, da_mlt_138])
    db.commit()

    # Persetujuan PMJ-0138 (Dua persetujuan terpenuhi)
    p1 = Persetujuan(id_peminjaman=pmj_138.id_peminjaman, id_penyetuju=dr_budi.id_pengguna, jenis_persetujuan="dosen_pengampu", status="Disetujui", catatan="Disetujui untuk praktikum", waktu_keputusan=datetime(2026, 11, 13, 10, 15))
    p2 = Persetujuan(id_peminjaman=pmj_138.id_peminjaman, id_penyetuju=sinta.id_pengguna, jenis_persetujuan="laboran", status="Disetujui", catatan="Unit alat tersedia dan ruangan siap", waktu_keputusan=datetime(2026, 11, 13, 11, 0))
    db.add_all([p1, p2])
    db.commit()

    # Alokasi Unit PMJ-0138
    alok_osc1 = AlokasiUnitPeminjaman(id_detail_alat=da_osc_138.id_detail_alat, id_unit=u_osc1.id_unit, status_alokasi="Kembali", tanggal_alokasi=datetime(2026, 11, 13, 11, 30))
    alok_osc2 = AlokasiUnitPeminjaman(id_detail_alat=da_osc_138.id_detail_alat, id_unit=u_osc2.id_unit, status_alokasi="Dipinjam", tanggal_alokasi=datetime(2026, 11, 13, 11, 30))
    alok_osc3 = AlokasiUnitPeminjaman(id_detail_alat=da_osc_138.id_detail_alat, id_unit=u_osc3.id_unit, status_alokasi="Dipinjam", tanggal_alokasi=datetime(2026, 11, 13, 11, 30))
    alok_mlt1 = AlokasiUnitPeminjaman(id_detail_alat=da_mlt_138.id_detail_alat, id_unit=u_mlt1.id_unit, status_alokasi="Dipinjam", tanggal_alokasi=datetime(2026, 11, 13, 11, 30))
    db.add_all([alok_osc1, alok_osc2, alok_osc3, alok_mlt1])
    db.commit()

    # Pengembalian sebagian 1 unit OSC-001
    ret_1 = Pengembalian(id_peminjaman=pmj_138.id_peminjaman, id_laboran=sinta.id_pengguna, tanggal_pengembalian=datetime(2026, 11, 15, 9, 30), catatan="OSC-001 dikembalikan lebih awal dalam kondisi baik")
    db.add(ret_1)
    db.commit()
    det_ret_1 = DetailPengembalian(id_pengembalian=ret_1.id_pengembalian, id_alokasi=alok_osc1.id_alokasi, kondisi_kembali="Baik", catatan="Fungsi layar dan probe normal")
    db.add(det_ret_1)
    db.commit()

    # 8. Mock Peminjaman lain: PMJ-0141 (Farhan Akbar - Menunggu Persetujuan)
    pmj_141 = Peminjaman(id_pengguna=farhan.id_pengguna, tanggal_pengajuan=datetime(2026, 11, 15, 8, 30), tujuan="Pengujian sinyal tugas akhir", status="Menunggu Persetujuan", catatan=None)
    db.add(pmj_141)
    db.commit()
    da_141 = DetailPeminjamanAlat(id_peminjaman=pmj_141.id_peminjaman, id_alat=a_osc.id_alat, jumlah_pinjam=2, tenggat_pengembalian=datetime(2026, 11, 18, 16, 0))
    db.add(da_141)
    db.commit()
    app_141_dosen = Persetujuan(id_peminjaman=pmj_141.id_peminjaman, id_penyetuju=None, jenis_persetujuan="dosen_pengampu", status="Menunggu")
    app_141_lab = Persetujuan(id_peminjaman=pmj_141.id_peminjaman, id_penyetuju=None, jenis_persetujuan="laboran", status="Menunggu")
    db.add_all([app_141_dosen, app_141_lab])
    db.commit()

    # 9. Mock Peminjaman PMJ-0139 (Rina Lestari - Pengampu Setuju, Laboran Menunggu)
    pmj_139 = Peminjaman(id_pengguna=rina.id_pengguna, tanggal_pengajuan=datetime(2026, 11, 15, 9, 0), tujuan="Pengamatan preparat biologi sel", status="Menunggu Persetujuan")
    db.add(pmj_139)
    db.commit()
    da_139 = DetailPeminjamanAlat(id_peminjaman=pmj_139.id_peminjaman, id_alat=a_mic.id_alat, jumlah_pinjam=1, tenggat_pengembalian=datetime(2026, 11, 17, 15, 0))
    db.add(da_139)
    db.commit()
    app_139_dosen = Persetujuan(id_peminjaman=pmj_139.id_peminjaman, id_penyetuju=dr_budi.id_pengguna, jenis_persetujuan="dosen_pengampu", status="Disetujui", catatan="Rekomendasi disetujui", waktu_keputusan=datetime(2026, 11, 15, 10, 0))
    app_139_lab = Persetujuan(id_peminjaman=pmj_139.id_peminjaman, id_penyetuju=None, jenis_persetujuan="laboran", status="Menunggu")
    db.add_all([app_139_dosen, app_139_lab])
    db.commit()

    # 10. Mock Peminjaman PMJ-0137 (Dimas Putra - Pengampu Menunggu, Laboran Setuju)
    pmj_137 = Peminjaman(id_pengguna=dimas.id_pengguna, tanggal_pengajuan=datetime(2026, 11, 15, 9, 30), tujuan="Uji spektroskopi larutan kimia", status="Menunggu Persetujuan")
    db.add(pmj_137)
    db.commit()
    da_137 = DetailPeminjamanAlat(id_peminjaman=pmj_137.id_peminjaman, id_alat=a_spe.id_alat, jumlah_pinjam=1, tenggat_pengembalian=datetime(2026, 11, 17, 16, 0))
    db.add(da_137)
    db.commit()
    app_137_dosen = Persetujuan(id_peminjaman=pmj_137.id_peminjaman, id_penyetuju=None, jenis_persetujuan="dosen_pengampu", status="Menunggu")
    app_137_lab = Persetujuan(id_peminjaman=pmj_137.id_peminjaman, id_penyetuju=sinta.id_pengguna, jenis_persetujuan="laboran", status="Disetujui", catatan="Spektrofotometer siap digunakan", waktu_keputusan=datetime(2026, 11, 15, 11, 0))
    db.add_all([app_137_dosen, app_137_lab])
    db.commit()

    # 11. Mock Peminjaman Selesai: PMJ-0120 & PMJ-0108
    pmj_120 = Peminjaman(id_pengguna=nadia.id_pengguna, tanggal_pengajuan=datetime(2026, 11, 10, 8, 0), tujuan="Diskusi kelompok mata kuliah", status="Selesai")
    db.add(pmj_120)
    db.commit()
    dr_120 = DetailPeminjamanRuang(id_peminjaman=pmj_120.id_peminjaman, id_ruangan=r_komputer.id_ruangan, tanggal=date(2026, 11, 10), jam_mulai=time(13, 0), jam_selesai=time(15, 0))
    db.add(dr_120)
    db.commit()

    pmj_108 = Peminjaman(id_pengguna=nadia.id_pengguna, tanggal_pengajuan=datetime(2026, 11, 5, 8, 0), tujuan="Pengukuran resistor tugas mandiri", status="Selesai")
    db.add(pmj_108)
    db.commit()
    da_108 = DetailPeminjamanAlat(id_peminjaman=pmj_108.id_peminjaman, id_alat=a_mlt.id_alat, jumlah_pinjam=2, tenggat_pengembalian=datetime(2026, 11, 7, 16, 0))
    db.add(da_108)
    db.commit()

    # 12. Mock late record for demo
    late1 = RiwayatKeterlambatan(
        id_detail_alat=da_osc_138.id_detail_alat,
        mulai_terlambat=datetime(2026, 11, 16, 16, 1),
        waktu_selesai=None,
        status="Aktif",
        catatan="2 unit osiloskop belum dikembalikan melewati tenggat"
    )
    db.add(late1)
    db.commit()

    print("Seed data completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
