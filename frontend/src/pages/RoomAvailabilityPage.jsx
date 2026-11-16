import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Search, Calendar, Users, MapPin, ArrowRight } from 'lucide-react';

export default function RoomAvailabilityPage({ onNavigateToBooking }) {
  const [tanggal, setTanggal] = useState('2026-11-16');
  const [jamMulai, setJamMulai] = useState('13:00');
  const [jamSelesai, setJamSelesai] = useState('15:00');
  const [rooms, setRooms] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const roomData = await api.get(`/api/rooms/availability?tanggal=${tanggal}&jam_mulai=${jamMulai}&jam_selesai=${jamSelesai}`);
      setRooms(roomData);

      const agendaData = await api.get(`/api/rooms/agenda?tanggal=${tanggal}`);
      setAgenda(agendaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-03 / MAHASISWA · DOSEN / KETERSEDIAAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Ketersediaan ruangan</h1>
        <p className="text-sm text-slate-500 mt-1">
          Temukan ruangan yang sesuai dengan waktu kegiatan Anda berdasarkan jadwal kuliah berulang, pengecualian, dan peminjaman aktif.
        </p>
      </div>

      {/* Filter Box */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Tanggal penggunaan
          </label>
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Jam mulai
          </label>
          <input
            type="time"
            value={jamMulai}
            onChange={(e) => setJamMulai(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Jam selesai
          </label>
          <input
            type="time"
            value={jamSelesai}
            onChange={(e) => setJamSelesai(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            required
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-sm transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{loading ? 'Memeriksa...' : 'Cari ketersediaan'}</span>
          </button>
        </div>
      </form>

      {/* Room Availability Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rooms.map((r) => (
          <div
            key={r.id_ruangan}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between">
                <Badge status={r.is_available ? 'Tersedia' : 'Bentrok'} text={r.is_available ? 'Tersedia' : 'Bentrok'} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-4">{r.nama_ruangan}</h3>
              <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{r.lokasi}</span>
                </span>
                <span>•</span>
                <span className="flex items-center space-x-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{r.kapasitas} orang</span>
                </span>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 min-h-[50px] flex items-center">
                {r.is_available ? (
                  <span className="text-emerald-700">Kosong pada {jamMulai}–{jamSelesai}</span>
                ) : (
                  <span className="text-rose-700">{r.conflict_reason} · {r.conflict_detail}</span>
                )}
              </div>
            </div>

            <div className="mt-6">
              {r.is_available ? (
                <button
                  onClick={() => onNavigateToBooking({ id_ruangan: r.id_ruangan, tanggal, jamMulai, jamSelesai })}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Ajukan peminjaman</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200 cursor-not-allowed"
                >
                  Tidak tersedia
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Agenda Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Agenda ruangan · {tanggal}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Perulangan kuliah, perubahan jadwal, dan peminjaman disatukan untuk pemeriksaan bentrok.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3.5 px-6">Waktu</th>
                <th className="py-3.5 px-6">Ruangan</th>
                <th className="py-3.5 px-6">Agenda</th>
                <th className="py-3.5 px-6">Sumber</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agenda.map((ag, i) => (
                <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-mono font-medium text-slate-800">{ag.waktu}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">{ag.ruangan}</td>
                  <td className="py-3.5 px-6 text-slate-700">
                    <div>{ag.agenda}</div>
                    {ag.alasan && <div className="text-[11px] text-slate-400 mt-0.5">{ag.alasan}</div>}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">{ag.sumber}</td>
                  <td className="py-3.5 px-6">
                    <Badge status={ag.status} text={ag.status} />
                  </td>
                </tr>
              ))}
              {agenda.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada agenda kegiatan pada tanggal ini.
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
