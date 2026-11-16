from datetime import datetime, date, time
from sqlalchemy import Column, Integer, String, Boolean, Text, Date, Time, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Pengguna(Base):
    __tablename__ = "pengguna"

    id_pengguna = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    nomor_identitas = Column(String(30), nullable=False)
    role = Column(String(30), nullable=False)  # Mahasiswa, Dosen, Dosen Pengampu, Laboran, Kepala Laboratorium, Dekan
    status_akun = Column(String(20), default="Aktif", nullable=False)  # Aktif, Nonaktif
    dibuat_oleh = Column(Integer, ForeignKey("pengguna.id_pengguna"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    pembuat = relationship("Pengguna", remote_side=[id_pengguna], backref="pengguna_dibuat")
    peminjaman_list = relationship("Peminjaman", back_populates="peminjam")
    persetujuan_list = relationship("Persetujuan", back_populates="penyetuju")
    pengembalian_list = relationship("Pengembalian", back_populates="laboran")


class Ruangan(Base):
    __tablename__ = "ruangan"

    id_ruangan = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama_ruangan = Column(String(100), nullable=False)
    lokasi = Column(String(150), nullable=False)
    kapasitas = Column(Integer, nullable=False)
    deskripsi = Column(Text, nullable=True)
    status = Column(String(20), default="Aktif", nullable=False)  # Aktif, Pemeliharaan, Nonaktif

    jadwal_list = relationship("JadwalKuliah", back_populates="ruangan")
    detail_ruang_list = relationship("DetailPeminjamanRuang", back_populates="ruangan")


class JadwalKuliah(Base):
    __tablename__ = "jadwal_kuliah"

    id_jadwal = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_ruangan = Column(Integer, ForeignKey("ruangan.id_ruangan"), nullable=False)
    nama_mata_kuliah = Column(String(100), nullable=False)
    nama_dosen = Column(String(100), nullable=False)
    hari = Column(String(15), nullable=False)  # Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
    jam_mulai = Column(Time, nullable=False)
    jam_selesai = Column(Time, nullable=False)
    berlaku_mulai = Column(Date, nullable=False)
    berlaku_selesai = Column(Date, nullable=False)
    semester = Column(String(30), nullable=False)

    ruangan = relationship("Ruangan", back_populates="jadwal_list")
    pengecualian_list = relationship("PengecualianJadwal", back_populates="jadwal")


class PengecualianJadwal(Base):
    __tablename__ = "pengecualian_jadwal"

    id_pengecualian = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_jadwal = Column(Integer, ForeignKey("jadwal_kuliah.id_jadwal"), nullable=False)
    tanggal = Column(Date, nullable=False)
    jenis_pengecualian = Column(String(30), nullable=False)  # Pembatalan, Perubahan
    jam_mulai_baru = Column(Time, nullable=True)
    jam_selesai_baru = Column(Time, nullable=True)
    alasan = Column(Text, nullable=False)
    dibuat_oleh = Column(Integer, ForeignKey("pengguna.id_pengguna"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    jadwal = relationship("JadwalKuliah", back_populates="pengecualian_list")
    pencatat = relationship("Pengguna")


class Alat(Base):
    __tablename__ = "alat"

    id_alat = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nama_alat = Column(String(100), nullable=False)
    deskripsi = Column(Text, nullable=True)
    alat_khusus = Column(Boolean, default=False, nullable=False)

    unit_list = relationship("UnitAlat", back_populates="alat")
    detail_pinjam_list = relationship("DetailPeminjamanAlat", back_populates="alat")


class UnitAlat(Base):
    __tablename__ = "unit_alat"

    id_unit = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_alat = Column(Integer, ForeignKey("alat.id_alat"), nullable=False)
    kode_inventaris = Column(String(50), unique=True, index=True, nullable=False)
    kondisi = Column(String(30), default="Baik", nullable=False)  # Baik, Rusak ringan, Rusak berat
    status = Column(String(20), default="Tersedia", nullable=False)  # Tersedia, Dipinjam, Pemeliharaan, Rusak, Hilang

    alat = relationship("Alat", back_populates="unit_list")
    alokasi_list = relationship("AlokasiUnitPeminjaman", back_populates="unit")


class Peminjaman(Base):
    __tablename__ = "peminjaman"

    id_peminjaman = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_pengguna = Column(Integer, ForeignKey("pengguna.id_pengguna"), nullable=False)
    tanggal_pengajuan = Column(DateTime, default=datetime.utcnow, nullable=False)
    tujuan = Column(Text, nullable=False)
    status = Column(String(30), default="Menunggu Persetujuan", nullable=False)  # Menunggu Persetujuan, Disetujui, Ditolak, Berjalan, Sebagian kembali, Selesai, Dibatalkan
    catatan = Column(Text, nullable=True)

    peminjam = relationship("Pengguna", back_populates="peminjaman_list")
    detail_ruang_list = relationship("DetailPeminjamanRuang", back_populates="peminjaman", cascade="all, delete-orphan")
    detail_alat_list = relationship("DetailPeminjamanAlat", back_populates="peminjaman", cascade="all, delete-orphan")
    persetujuan_list = relationship("Persetujuan", back_populates="peminjaman", cascade="all, delete-orphan")
    pengembalian_list = relationship("Pengembalian", back_populates="peminjaman", cascade="all, delete-orphan")


class DetailPeminjamanRuang(Base):
    __tablename__ = "detail_peminjaman_ruang"

    id_detail_ruang = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_peminjaman = Column(Integer, ForeignKey("peminjaman.id_peminjaman"), nullable=False)
    id_ruangan = Column(Integer, ForeignKey("ruangan.id_ruangan"), nullable=False)
    tanggal = Column(Date, nullable=False)
    jam_mulai = Column(Time, nullable=False)
    jam_selesai = Column(Time, nullable=False)

    peminjaman = relationship("Peminjaman", back_populates="detail_ruang_list")
    ruangan = relationship("Ruangan", back_populates="detail_ruang_list")


class DetailPeminjamanAlat(Base):
    __tablename__ = "detail_peminjaman_alat"

    id_detail_alat = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_peminjaman = Column(Integer, ForeignKey("peminjaman.id_peminjaman"), nullable=False)
    id_alat = Column(Integer, ForeignKey("alat.id_alat"), nullable=False)
    jumlah_pinjam = Column(Integer, nullable=False)
    tenggat_pengembalian = Column(DateTime, nullable=False)

    peminjaman = relationship("Peminjaman", back_populates="detail_alat_list")
    alat = relationship("Alat", back_populates="detail_pinjam_list")
    alokasi_list = relationship("AlokasiUnitPeminjaman", back_populates="detail_alat", cascade="all, delete-orphan")
    riwayat_keterlambatan = relationship("RiwayatKeterlambatan", back_populates="detail_alat", uselist=False, cascade="all, delete-orphan")


class AlokasiUnitPeminjaman(Base):
    __tablename__ = "alokasi_unit_peminjaman"

    id_alokasi = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_detail_alat = Column(Integer, ForeignKey("detail_peminjaman_alat.id_detail_alat"), nullable=False)
    id_unit = Column(Integer, ForeignKey("unit_alat.id_unit"), nullable=False)
    status_alokasi = Column(String(20), default="Dipinjam", nullable=False)  # Dipinjam, Kembali
    tanggal_alokasi = Column(DateTime, default=datetime.utcnow, nullable=False)

    detail_alat = relationship("DetailPeminjamanAlat", back_populates="alokasi_list")
    unit = relationship("UnitAlat", back_populates="alokasi_list")
    detail_pengembalian = relationship("DetailPengembalian", back_populates="alokasi", uselist=False)


class Persetujuan(Base):
    __tablename__ = "persetujuan"

    id_persetujuan = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_peminjaman = Column(Integer, ForeignKey("peminjaman.id_peminjaman"), nullable=False)
    id_penyetuju = Column(Integer, ForeignKey("pengguna.id_pengguna"), nullable=True)
    jenis_persetujuan = Column(String(30), nullable=False)  # dosen_pengampu, laboran, kepala_lab
    status = Column(String(20), default="Menunggu", nullable=False)  # Menunggu, Disetujui, Ditolak
    catatan = Column(Text, nullable=True)
    waktu_keputusan = Column(DateTime, nullable=True)

    peminjaman = relationship("Peminjaman", back_populates="persetujuan_list")
    penyetuju = relationship("Pengguna", back_populates="persetujuan_list")


class Pengembalian(Base):
    __tablename__ = "pengembalian"

    id_pengembalian = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_peminjaman = Column(Integer, ForeignKey("peminjaman.id_peminjaman"), nullable=False)
    id_laboran = Column(Integer, ForeignKey("pengguna.id_pengguna"), nullable=False)
    tanggal_pengembalian = Column(DateTime, default=datetime.utcnow, nullable=False)
    catatan = Column(Text, nullable=True)

    peminjaman = relationship("Peminjaman", back_populates="pengembalian_list")
    laboran = relationship("Pengguna", back_populates="pengembalian_list")
    detail_list = relationship("DetailPengembalian", back_populates="pengembalian", cascade="all, delete-orphan")


class DetailPengembalian(Base):
    __tablename__ = "detail_pengembalian"

    id_detail_pengembalian = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_pengembalian = Column(Integer, ForeignKey("pengembalian.id_pengembalian"), nullable=False)
    id_alokasi = Column(Integer, ForeignKey("alokasi_unit_peminjaman.id_alokasi"), nullable=False)
    kondisi_kembali = Column(String(30), default="Baik", nullable=False)  # Baik, Rusak ringan, Rusak berat, Hilang
    catatan = Column(Text, nullable=True)

    pengembalian = relationship("Pengembalian", back_populates="detail_list")
    alokasi = relationship("AlokasiUnitPeminjaman", back_populates="detail_pengembalian")


class RiwayatKeterlambatan(Base):
    __tablename__ = "riwayat_keterlambatan"

    id_riwayat = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_detail_alat = Column(Integer, ForeignKey("detail_peminjaman_alat.id_detail_alat"), unique=True, nullable=False)
    mulai_terlambat = Column(DateTime, nullable=False)
    waktu_selesai = Column(DateTime, nullable=True)
    status = Column(String(20), default="Aktif", nullable=False)  # Aktif, Selesai
    catatan = Column(Text, nullable=True)

    detail_alat = relationship("DetailPeminjamanAlat", back_populates="riwayat_keterlambatan")
