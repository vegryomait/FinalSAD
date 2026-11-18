import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Filter, CheckCircle2, Clock, Calendar, ArrowRight } from 'lucide-react';

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('Semua status');

  const loadMyBookings = async () => {
    try {
      const url = statusFilter !== 'Semua status'
        ? `/api/bookings/my?status=${encodeURIComponent(statusFilter)}`
        : '/api/bookings/my';
      const data = await api.get(url);
      setBookings(data);
      if (data.length > 0 && !selectedBooking) {
        setSelectedBooking(data[0]);
      } else if (data.length > 0 && selectedBooking) {
        const refreshed = data.find((b) => b.id_peminjaman === selectedBooking.id_peminjaman);
        if (refreshed) setSelectedBooking(refreshed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMyBookings();
  }, [statusFilter]);

  const getSummaryText = (b) => {
    const parts = [];
    if (b.detail_ruang_list?.length > 0) {
      parts.push(b.detail_ruang_list[0].ruangan?.nama_ruangan || 'Ruangan');
    }
    if (b.detail_alat_list?.length > 0) {
      const toolStrs = b.detail_alat_list.map((da) => `${da.jumlah_pinjam} ${da.alat?.nama_alat || 'alat'}`);
      parts.push(toolStrs.join(', '));
    }
    return parts.join(' · ') || b.tujuan;
  };

  // Compile flat allocated unit rows from detail_alat_list
  const allocatedUnits = [];
  let totalAllocated = 0;
  let returnedCount = 0;

  if (selectedBooking) {
    selectedBooking.detail_alat_list?.forEach((da) => {
      da.alokasi_list?.forEach((al) => {
        totalAllocated++;
        const isKembali = al.status_alokasi === 'Kembali';
        if (isKembali) returnedCount++;
        allocatedUnits.push({
          id_alokasi: al.id_alokasi,
          kode_inventaris: al.unit?.kode_inventaris || `UNIT-${al.id_unit}`,
          nama_alat: da.alat?.nama_alat || 'Alat',
          status_alokasi: al.status_alokasi,
          tenggat: da.tenggat_pengembalian,
        });
      });
    });
  }

  // Approvals info
  const dosenApp = selectedBooking?.persetujuan_list?.find((p) => p.jenis_persetujuan === 'dosen_pengampu');
  const laboranApp = selectedBooking?.persetujuan_list?.find((p) => p.jenis_persetujuan === 'laboran');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          LAYANAN LABORATORIUM / RIWAYAT PEMINJAMAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Riwayat & status peminjaman</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pantau seluruh kebutuhan dalam satu transaksi peminjaman.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              <option value="Semua status">Semua status</option>
              <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Sebagian kembali">Sebagian kembali</option>
              <option value="Selesai">Selesai</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadMyBookings}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Segarkan data</span>
        </button>
      </div>

      {/* Top Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Riwayat peminjaman saya</h2>
          <div className="text-xs text-slate-400 mt-0.5">
            1–{bookings.length} dari {bookings.length} transaksi · Semua kebutuhan dirangkum per ID peminjaman
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3.5 px-6">Tanggal</th>
                <th className="py-3.5 px-6">ID peminjaman</th>
                <th className="py-3.5 px-6">Ringkasan kebutuhan</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.map((b) => {
                const isSelected = selectedBooking?.id_peminjaman === b.id_peminjaman;
                return (
                  <tr
                    key={b.id_peminjaman}
                    onClick={() => setSelectedBooking(b)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/60 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-6 text-slate-600">
                      {new Date(b.tanggal_pengajuan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-teal-800">{b.kode_peminjaman}</td>
                    <td className="py-3.5 px-6 text-slate-800">{getSummaryText(b)}</td>
                    <td className="py-3.5 px-6">
                      <Badge status={b.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <span className="text-teal-700 font-semibold hover:underline">
                        Lihat detail
                      </span>
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Belum ada data peminjaman yang tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Section */}
      {selectedBooking && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-bold text-slate-900 font-mono">
                  Detail transaksi · {selectedBooking.kode_peminjaman}
                </h2>
                <Badge status={selectedBooking.status} />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedBooking.detail_ruang_list?.[0] && (
                  <span>
                    {selectedBooking.detail_ruang_list[0].ruangan?.nama_ruangan} · {selectedBooking.detail_ruang_list[0].tanggal}, {selectedBooking.detail_ruang_list[0].jam_mulai}–{selectedBooking.detail_ruang_list[0].jam_selesai} WIB
                  </span>
                )}
                {selectedBooking.detail_alat_list?.[0] && (
                  <span className="ml-2">
                    | Tenggat alat: {new Date(selectedBooking.detail_alat_list[0].tenggat_pengembalian).toLocaleString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-bold text-teal-800">01 Diajukan</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {new Date(selectedBooking.tanggal_pengajuan).toLocaleString('id-ID')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-bold text-teal-800">02 Pengampu setuju</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {selectedBooking?.detail_alat_list?.some((da) => da.alat?.alat_khusus)
                  ? (dosenApp?.waktu_keputusan ? new Date(dosenApp.waktu_keputusan).toLocaleString('id-ID') : dosenApp?.status || 'Menunggu')
                  : 'Tidak diperlukan (alat biasa)'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-bold text-teal-800">03 Laboran setuju (Kak Dina)</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {laboranApp?.waktu_keputusan ? new Date(laboranApp.waktu_keputusan).toLocaleString('id-ID') : laboranApp?.status || 'Menunggu'}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="text-xs font-bold text-teal-800">04 Pengembalian</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {returnedCount} dari {totalAllocated} unit kembali
              </div>
            </div>
          </div>

          {/* Table of Allocated Units */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-5">Unit yang dialokasikan</th>
                  <th className="py-3 px-5">Jenis alat</th>
                  <th className="py-3 px-5">Status unit</th>
                  <th className="py-3 px-5">Informasi pengembalian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocatedUnits.map((u, i) => (
                  <tr key={i}>
                    <td className="py-3 px-5 font-mono font-bold text-slate-800">{u.kode_inventaris}</td>
                    <td className="py-3 px-5 text-slate-700">{u.nama_alat}</td>
                    <td className="py-3 px-5">
                      <Badge status={u.status_alokasi} text={u.status_alokasi} />
                    </td>
                    <td className="py-3 px-5 text-slate-500">
                      {u.status_alokasi === 'Kembali' ? 'Sudah dikembalikan (Kondisi baik)' : 'Belum dikembalikan'}
                    </td>
                  </tr>
                ))}
                {allocatedUnits.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-400">
                      Tidak ada unit alat fisik yang dialokasikan pada peminjaman ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalAllocated > 0 && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-900 text-xs">
              Dipinjam {totalAllocated} unit · Sudah kembali {returnedCount} unit · Masih dipinjam {totalAllocated - returnedCount} unit. Transaksi tetap berjalan sampai seluruh unit kembali.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
