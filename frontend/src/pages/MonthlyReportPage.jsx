import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Download, FileSpreadsheet, BarChart2, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export default function MonthlyReportPage() {
  const [bulan, setBulan] = useState(11);
  const [tahun, setTahun] = useState(2026);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/api/reports/monthly?bulan=${bulan}&tahun=${tahun}`);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleExportCSV = () => {
    window.open(`/api/reports/monthly/export?bulan=${bulan}&tahun=${tahun}`, '_blank');
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const r = reportData?.ringkasan;
  const rekap = reportData?.rekapitulasi || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto print:space-y-4">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-11 / DEKAN · KEPALA LAB / PELAPORAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Laporan bulanan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Rekap aktivitas dan kondisi inventaris laboratorium. Disusun otomatis dari transaksi relasional.
        </p>
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Bulan</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun</label>
            <input
              type="number"
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="w-28 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchReport}
            className="py-2.5 px-6 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-sm font-semibold transition shadow-xs cursor-pointer"
          >
            {loading ? 'Memuat...' : 'Tampilkan'}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrintPDF}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Cetak / Simpan PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 rounded-xl border border-teal-600 hover:bg-teal-50 text-teal-700 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      {r && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TRANSAKSI PEMINJAMAN</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{r.transaksi_peminjaman.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              {r.transaksi_peminjaman.ruangan_saja} ruangan · {r.transaksi_peminjaman.alat_saja} alat · {r.transaksi_peminjaman.ruangan_dan_alat} keduanya
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENGGUNAAN RUANGAN</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{r.penggunaan_ruangan.total_sesi} sesi</div>
            <div className="text-xs text-slate-500 mt-1">
              Total durasi {r.penggunaan_ruangan.total_durasi_jam} jam
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PEMINJAMAN ALAT</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">{r.peminjaman_alat.total_unit} unit</div>
            <div className="text-xs text-slate-500 mt-1">
              {r.peminjaman_alat.total_transaksi} transaksi dengan alat
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PENGEMBALIAN UNIT</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-2">{r.pengembalian_unit.total_kembali} unit</div>
            <div className="text-xs text-slate-500 mt-1">
              {r.pengembalian_unit.tepat_waktu} tepat waktu · {r.pengembalian_unit.terlambat} terlambat
            </div>
          </div>
        </div>
      )}

      {/* Two Analytical Visual Panels */}
      {r && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Komposisi Transaksi Bar Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-5">
            <h3 className="text-sm font-bold text-slate-900">Komposisi transaksi</h3>
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1 font-medium">
                  <span className="text-slate-700">Ruangan saja</span>
                  <span className="font-bold text-slate-900">{r.transaksi_peminjaman.ruangan_saja}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${Math.min(100, (r.transaksi_peminjaman.ruangan_saja / (r.transaksi_peminjaman.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-medium">
                  <span className="text-slate-700">Alat saja</span>
                  <span className="font-bold text-slate-900">{r.transaksi_peminjaman.alat_saja}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${Math.min(100, (r.transaksi_peminjaman.alat_saja / (r.transaksi_peminjaman.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1 font-medium">
                  <span className="text-slate-700">Ruangan & alat</span>
                  <span className="font-bold text-slate-900">{r.transaksi_peminjaman.ruangan_dan_alat}</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-700 rounded-full"
                    style={{ width: `${Math.min(100, (r.transaksi_peminjaman.ruangan_dan_alat / (r.transaksi_peminjaman.total || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Unit Inventaris */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Status unit · Posisi Akhir Bulan
            </h3>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="text-2xl font-extrabold text-emerald-800">{r.status_unit_saat_ini.tersedia}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Tersedia</div>
              </div>
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
                <div className="text-2xl font-extrabold text-teal-800">{r.status_unit_saat_ini.dipinjam}</div>
                <div className="text-[11px] text-teal-700 font-semibold mt-1">Dipinjam</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                <div className="text-2xl font-extrabold text-amber-800">{r.status_unit_saat_ini.pemeliharaan}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-1">Pemeliharaan</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                <div className="text-2xl font-extrabold text-rose-800">{r.status_unit_saat_ini.rusak}</div>
                <div className="text-[11px] text-rose-700 font-semibold mt-1">Rusak</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-100 text-xs text-amber-900">
              {r.status_unit_saat_ini.total_unit} total unit terdaftar dalam sistem inventaris laboratorium.
            </div>
          </div>
        </div>
      )}

      {/* Rekapitulasi Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Rekapitulasi bulanan</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Kategori</th>
                <th className="py-3.5 px-6">Jenis kebutuhan</th>
                <th className="py-3.5 px-6">Transaksi / Sesi</th>
                <th className="py-3.5 px-6">Unit alat</th>
                <th className="py-3.5 px-6">Durasi ruangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rekap.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3.5 px-6 font-bold text-slate-800">{item.kategori}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-900">{item.jenis_kebutuhan}</td>
                  <td className="py-3.5 px-6 text-slate-700">{item.transaksi_sesi}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-700">{item.unit_alat}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-700">{item.durasi_ruangan}</td>
                </tr>
              ))}
              {rekap.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data aktivitas untuk bulan ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Footer Box */}
      <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 text-xs">
        <strong>Pengembalian & keterlambatan:</strong> {r?.pengembalian_unit.total_kembali} unit diterima kembali · {r?.pengembalian_unit.terlambat} di antaranya tercatat terlambat. Angka unit dipinjam adalah posisi akhir bulan.
      </div>
    </div>
  );
}
