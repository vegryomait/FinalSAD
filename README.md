# labora. — Sistem Layanan Laboratorium Terpadu

> **"Ruang untuk belajar. Alat untuk berkarya. Kelola akses ruangan dan peralatan laboratorium dalam satu layanan yang terhubung."**

Sistem informasi laboratorium terintegrasi berbasis web yang mengelola peminjaman ruangan dan alat secara terpadu, pemantauan ketersediaan berbasis unit fisik unik, jadwal kuliah berulang, persetujuan bertingkat (Dosen Pengampu & Laboran), pengembalian bertahap, dan pemantauan keterlambatan.

---

## 1. Arsitektur & Teknologi

| Lapisan | Teknologi | Tanggung Jawab |
|---|---|---|
| **Frontend** | React JS (React 19, Tailwind CSS, Lucide Icons, Vite) | Menampilkan formulir gabungan, ketersediaan ruangan, status persetujuan, pengembalian bertahap, dan dashboard analitik laporan. |
| **Backend / API** | Python FastAPI | REST API, validasi bentrok jadwal, autentikasi JWT, otorisasi RBAC (Role-Based Access Control), dan aturan bisnis alokasi transaksional. |
| **ORM** | SQLAlchemy 2.0 | Menghubungkan logika backend dengan 14 tabel database relasional. |
| **Database** | PostgreSQL (Neon / Render) | Menyimpan seluruh transaksi dan data master (didukung fallback SQLite otomatis untuk kemudahan pengujian lokal). |
| **Komunikasi** | REST API / JSON melalui HTTPS | Pertukaran data terstruktur antara React JS dan FastAPI. |
| **Pengujian API** | Postman | File koleksi Postman tersedia di `backend/postman_collection.json`. |
| **Hosting Usulan** | Vercel (Frontend), Render (Backend), Neon (PostgreSQL Database). |

---

## 2. Struktur 14 Tabel Database Relasional

1. **`pengguna`**: Akun pengguna, peran (Mahasiswa, Dosen, Dosen Pengampu, Laboran, Kepala Lab, Dekan), status akun, password hash.
2. **`ruangan`**: Data ruang laboratorium, lokasi, kapasitas, dan status operasional.
3. **`jadwal_kuliah`**: Jadwal perkuliahan mingguan berulang (hari, jam mulai/selesai, periode semester).
4. **`pengecualian_jadwal`**: Pembatalan atau perubahan jam perkuliahan pada tanggal spesifik.
5. **`alat`**: Kategori alat laboratorium dan penanda `alat_khusus` (memerlukan persetujuan ganda).
6. **`unit_alat`**: Identitas fisik unit alat dengan `kode_inventaris` unik dan status kondisi.
7. **`peminjaman`**: Transaksi induk peminjaman yang dapat menampung kebutuhan ruangan, alat, atau keduanya sekaligus.
8. **`detail_peminjaman_ruang`**: Rincian ruangan, tanggal, dan rentang jam penggunaan.
9. **`detail_peminjaman_alat`**: Rincian jenis alat, kuantitas yang diminta, dan tenggat pengembalian.
10. **`alokasi_unit_peminjaman`**: Unit fisik spesifik yang dialokasikan saat pengajuan disetujui.
11. **`persetujuan`**: Keputusan terpisah dari Dosen Pengampu dan Laboran.
12. **`pengembalian`**: Aktivitas pencatatan sesi pengembalian oleh Laboran.
13. **`detail_pengembalian`**: Unit fisik yang diterima kembali beserta catatan kondisinya.
14. **`riwayat_keterlambatan`**: Catatan tunggal pelacakan keterlambatan per detail alat yang aktif sampai seluruh unit dikembalikan.

---

## 3. Cakupan Use Case (UC-01 s/d UC-11)

- **UC-01 (Login)**: Otentikasi dengan Email/Nomor Identitas dan Password hash, JWT token, serta proteksi akun nonaktif.
- **UC-02 (Pengelolaan Akun Pengguna)**: CRUD pengguna oleh Laboran, pencatatan laboran pembuat akun untuk audit, aktivasi/nonaktivasi akun.
- **UC-03 (Melihat Ketersediaan Ruangan)**: Pemeriksaan bentrok jadwal komprehensif di backend (jadwal kuliah berulang, pengecualian tanggal, dan peminjaman disetujui lain) serta agenda harian.
- **UC-04 (Pengajuan Peminjaman Ruangan & Alat)**: Formulir peminjaman gabungan satu pintu dengan id_peminjaman tunggal, validasi bentrok, dan validasi stok fisik unit alat.
- **UC-05 (Persetujuan Peminjaman Alat Khusus)**: Dua persetujuan independen (Dosen Pengampu & Laboran); alokasi unit fisik otomatis dan transaksional saat seluruh persetujuan terpenuhi.
- **UC-06 (Riwayat & Status Peminjaman)**: Pelacakan tahapan peminjaman dari pengajuan, persetujuan, unit fisik yang dialokasikan, hingga status pengembalian.
- **UC-07 (Pencatatan Pengembalian Bertahap)**: Pencatatan pengembalian sebagian unit tanpa menutup unit yang masih dipinjam, dengan pembaruan kondisi fisik alat (Tersedia, Pemeliharaan, Rusak).
- **UC-08 (Pemantauan Keterlambatan)**: Sinkronisasi dan pelacakan peminjaman yang melewati batas tenggat pengembalian, durasi keterlambatan, dan penyelesaian otomatis saat unit kembali.
- **UC-09 (Pengelolaan Inventaris Ruangan & Alat)**: Pengelolaan ruangan, jenis alat, serta unit fisik alat dengan kode inventaris unik.
- **UC-10 (Pengelolaan Jadwal Kuliah)**: Pengelolaan jadwal perkuliahan mingguan berulang dan pencatatan pengecualian (pembatalan/perubahan jadwal).
- **UC-11 (Laporan Bulanan)**: Analitik komprehensif (komposisi peminjaman, durasi ruangan, status inventaris, keterlambatan) dengan fitur cetak PDF dan ekspor CSV.

---

## 4. Akun Bawaan (Demo Data)

Seluruh akun menggunakan password: **`password123`**

| Peran | Nama | Email / Login | Nomor Identitas |
|---|---|---|---|
| **Laboran** | Sinta Rahma | `sinta@kampus.ac.id` | LAB-001 |
| **Mahasiswa** | Nadia Putri | `nadia.putri@kampus.ac.id` | 2204101021 |
| **Mahasiswa** | Farhan Akbar | `farhan@kampus.ac.id` | 2204101033 |
| **Dosen Pengampu** | Dr. Budi Santoso | `budi@kampus.ac.id` | 198603121 |
| **Dosen** | Dr. Maya Dewi | `maya@kampus.ac.id` | 198904053 |
| **Kepala Lab** | Prof. Hendra Kusuma | `hendra@kampus.ac.id` | 197508151 |
| **Dekan** | Dr. Ratna Sari | `ratna.sari@kampus.ac.id` | 197001011 |

> *Catatan:* Aplikasi dilengkapi fitur **"Simulasi Role"** di pojok kanan atas untuk berpindah peran pengujian dalam 1 klik tanpa perlu logout dan mengetik ulang.

---

## 5. Cara Menjalankan Sistem

### A. Menjalankan Sekaligus (Satu Perintah)
Pastikan lingkungan virtual Python aktif, lalu jalankan:
```bash
python run.py
```
- Sistem akan otomatis membuat tabel database, mengisi data awal (seed), dan menyajikan aplikasi web di:
  **`http://127.0.0.1:8000`**
- Dokumentasi interaktif REST API (Swagger UI):
  **`http://127.0.0.1:8000/docs`**

### B. Mode Pengembangan (Hot-Reloading)
Jika ingin memodifikasi kode frontend atau backend secara langsung:

1. **Jalankan Backend:**
   ```bash
   python backend/run.py
   ```
2. **Jalankan Frontend (Terminal Terpisah):**
   ```bash
   cd frontend
   npm run dev
   ```
   Akses di `http://localhost:5173`. Frontend telah dikonfigurasi dengan proxy otomatis ke port backend `8000`.

---

## 6. Panduan Deployment

### Database (Neon PostgreSQL)
1. Buat database baru di [Neon.tech](https://neon.tech).
2. Salin *Connection String* PostgreSQL Neon.
3. Atur variabel lingkungan `DATABASE_URL` pada backend Anda.

### Backend (Render)
1. Hubungkan repositori GitHub ke Render sebagai *Web Service*.
2. Konfigurasi:
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `DATABASE_URL`: URL PostgreSQL Neon
     - `SECRET_KEY`: Kunci rahasia JWT Anda

### Frontend (Vercel)
1. Hubungkan direktori `frontend` ke [Vercel](https://vercel.com).
2. Konfigurasi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_BASE_URL`: URL publik backend Render Anda (misal `https://labora-api.onrender.com`)
