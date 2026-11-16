import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { AlertTriangle, Clock, CheckCircle2, Filter } from 'lucide-react';

export default function LateRecordsPage() {
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('Semua status');

  const loadLateRecords = async () => {
    try {
      const url = statusFilter !== 'Semua status'
        ? `/api/late-records?status=${encodeURIComponent(statusFilter)}`
        : '/api/late-records';
      const data = await api.get(url);
      setRecords(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLateRecords();
  }, [statusFilter]);

  const activeCount = records.filter((r) => r.status === 'Aktif').length;
  const finishedCount = records.filter((r) => r.status === 'Selesai').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-08 / LABORAN · KEPALA LAB / KETERLAMBATAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Pemantauan keterlambatan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar peminjaman alat yang melewati batas tenggat pengembalian. Sistem mencatat satu riwayat per detail alat dan menyelesaikan status otomatis saat seluruh unit kembali.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL CATATAN</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{records.length} kasus</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TERLAMBAT AKTIF</div>
            <div className="text-3xl font-extrabold text-rose-600 mt-1">{activeCount} kasus</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SELESAI DIKEMBALIKAN</div>
            <div className="text-3xl font-extrabold text-emerald-700 mt-1">{finishedCount} kasus</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="Semua status">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>

        <button
          onClick={loadLateRecords}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
        >
          Periksa ulang batas tenggat
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3.5 px-6">ID / Peminjam</th>
                <th className="py-3.5 px-6">Jenis alat</th>
                <th className="py-3.5 px-6">Belum kembali</th>
                <th className="py-3.5 px-6">Tenggat</th>
                <th className="py-3.5 px-6">Durasi terlambat</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => (
                <tr key={r.id_riwayat} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="font-mono font-bold text-teal-800">{r.kode_peminjaman}</div>
                    <div className="font-semibold text-slate-900">{r.peminjam_nama}</div>
                    <div className="text-[11px] text-slate-400">{r.peminjam_nomor_identitas}</div>
                  </td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{r.nama_alat}</td>
                  <td className="py-3.5 px-6">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {r.belum_kembali} dari {r.jumlah_dipinjam} unit
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {new Date(r.tenggat).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3.5 px-6 font-medium text-slate-800">
                    {r.durasi_terlambat}
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge status={r.status === 'Aktif' ? 'terlambat' : 'selesai'} text={r.status} />
                  </td>
                  <td className="py-3.5 px-6 text-slate-500 max-w-xs truncate">
                    {r.catatan || '—'}
                  </td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada catatan keterlambatan untuk kriteria filter ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
