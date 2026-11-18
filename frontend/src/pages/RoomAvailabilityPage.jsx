import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import {
  Search,
  Calendar,
  Users,
  MapPin,
  ArrowRight,
  DoorOpen,
  Boxes,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function RoomAvailabilityPage({ onNavigateToBooking }) {
  // Mode: 'ruang' | 'alat'
  const [activeMode, setActiveMode] = useState('ruang');

  // Room state
  const [tanggal, setTanggal] = useState('2026-11-16');
  const [jamMulai, setJamMulai] = useState('13:00');
  const [jamSelesai, setJamSelesai] = useState('15:00');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState('semua');
  const [rooms, setRooms] = useState([]);
  const [agenda, setAgenda] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Equipment state
  const [equipmentList, setEquipmentList] = useState([]);
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategoryFilter, setToolCategoryFilter] = useState('semua');
  const [loadingEquipment, setLoadingEquipment] = useState(false);

  // Fetch Rooms & Agenda
  const fetchRoomData = async () => {
    setLoadingRooms(true);
    try {
      const roomData = await api.get(
        `/api/rooms/availability?tanggal=${tanggal}&jam_mulai=${jamMulai}&jam_selesai=${jamSelesai}`
      );
      setRooms(roomData);

      const agendaData = await api.get(`/api/rooms/agenda?tanggal=${tanggal}`);
      setAgenda(agendaData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch Equipment & Units
  const fetchEquipmentData = async () => {
    setLoadingEquipment(true);
    try {
      const eqData = await api.get('/api/equipment');
      setEquipmentList(eqData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  useEffect(() => {
    fetchRoomData();
    fetchEquipmentData();
  }, []);

  const handleSearchRooms = (e) => {
    e.preventDefault();
    fetchRoomData();
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedRoomFilter === 'semua') return true;
    return String(r.id_ruangan) === selectedRoomFilter;
  });

  // Filtered equipment
  const filteredEquipment = equipmentList.filter((eq) => {
    const matchSearch =
      !toolSearch ||
      eq.nama_alat.toLowerCase().includes(toolSearch.toLowerCase()) ||
      (eq.deskripsi && eq.deskripsi.toLowerCase().includes(toolSearch.toLowerCase()));

    const matchCategory =
      toolCategoryFilter === 'semua' ||
      (toolCategoryFilter === 'khusus' && eq.alat_khusus) ||
      (toolCategoryFilter === 'biasa' && !eq.alat_khusus);

    return matchSearch && matchCategory;
  });

  // Aggregate Equipment Stats
  const totalTools = equipmentList.reduce((acc, eq) => acc + (eq.total_unit || 0), 0);
  const totalAvailable = equipmentList.reduce((acc, eq) => acc + (eq.tersedia || 0), 0);
  const totalBorrowed = equipmentList.reduce((acc, eq) => acc + (eq.dipinjam || 0), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-03 / MAHASISWA · DOSEN / KETERSEDIAAN RUANGAN & ALAT
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
          Ketersediaan Ruangan dan Alat
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Pilih untuk memeriksa ketersediaan ruangan praktikum berdasarkan jadwal kuliah, atau periksa sisa stok fisik peralatan laboratorium yang siap dipinjam.
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={() => setActiveMode('ruang')}
          className={`flex items-center space-x-2.5 px-6 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'ruang'
              ? 'bg-[#006d64] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Pemeriksaan Ruangan ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveMode('alat')}
          className={`flex items-center space-x-2.5 px-6 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeMode === 'alat'
              ? 'bg-[#006d64] text-white shadow-sm'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Pemeriksaan Peralatan ({equipmentList.length} jenis)</span>
        </button>
      </div>

      {/* ========================================================
          PANEL 1: PEMERIKSAAN RUANGAN
          ======================================================== */}
      {activeMode === 'ruang' && (
        <div className="space-y-6">
          {/* Room Filter Form */}
          <form
            onSubmit={handleSearchRooms}
            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tanggal penggunaan
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Pilih ruangan
              </label>
              <select
                value={selectedRoomFilter}
                onChange={(e) => setSelectedRoomFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="semua">Semua Ruangan ({rooms.length})</option>
                {rooms.map((r) => (
                  <option key={r.id_ruangan} value={String(r.id_ruangan)}>
                    {r.nama_ruangan}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={loadingRooms}
                className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{loadingRooms ? 'Memeriksa...' : 'Periksa Jadwal'}</span>
              </button>
            </div>
          </form>

          {/* Room Availability Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredRooms.map((r) => (
              <div
                key={r.id_ruangan}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge
                      status={r.is_available ? 'Tersedia' : 'Bentrok'}
                      text={r.is_available ? 'Tersedia' : 'Bentrok'}
                    />
                    <span className="text-[11px] font-mono text-slate-400">
                      ID-{r.id_ruangan}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-3">{r.nama_ruangan}</h3>
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
                      <span className="text-emerald-700 font-semibold">
                        ✓ Ruangan siap digunakan pada {jamMulai}–{jamSelesai}
                      </span>
                    ) : (
                      <span className="text-rose-700 font-semibold">
                        ✕ {r.conflict_reason} · {r.conflict_detail}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  {r.is_available ? (
                    <button
                      onClick={() =>
                        onNavigateToBooking({
                          id_ruangan: r.id_ruangan,
                          tanggal,
                          jamMulai,
                          jamSelesai,
                        })
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Ajukan peminjaman ruangan</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200 cursor-not-allowed"
                    >
                      Ruangan tidak tersedia
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
                Agenda kegiatan ruangan · {tanggal}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Jadwal kuliah rutin mingguan, pembatalan dosen, dan peminjaman mahasiswa disatukan untuk deteksi bentrok.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
                  <tr>
                    <th className="py-3.5 px-6">Waktu</th>
                    <th className="py-3.5 px-6">Ruangan</th>
                    <th className="py-3.5 px-6">Agenda Kegiatan</th>
                    <th className="py-3.5 px-6">Sumber Data</th>
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
                        {ag.alasan && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{ag.alasan}</div>
                        )}
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
                        Tidak ada agenda kegiatan pada tanggal ini. Ruangan bebas digunakan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PANEL 2: PEMERIKSAAN PERALATAN
          ======================================================== */}
      {activeMode === 'alat' && (
        <div className="space-y-6">
          {/* Quick Stats Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-800">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Total Unit Fisik</div>
                <div className="text-2xl font-bold text-slate-900 font-mono mt-0.5">
                  {totalTools} <span className="text-xs font-normal text-slate-500">unit</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Tersedia Saat Ini</div>
                <div className="text-2xl font-bold text-emerald-700 font-mono mt-0.5">
                  {totalAvailable} <span className="text-xs font-normal text-slate-500">unit siap pinjam</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase">Sedang Dipinjam</div>
                <div className="text-2xl font-bold text-amber-700 font-mono mt-0.5">
                  {totalBorrowed} <span className="text-xs font-normal text-slate-500">unit di luar</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="relative min-w-[260px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari jenis alat atau spesifikasi..."
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <select
                value={toolCategoryFilter}
                onChange={(e) => setToolCategoryFilter(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="semua">Semua Kategori ({equipmentList.length})</option>
                <option value="biasa">Alat Biasa (Izin Kak Dina Saja)</option>
                <option value="khusus">Alat Khusus (Butuh Dosen Pengampu)</option>
              </select>
            </div>

            <button
              onClick={fetchEquipmentData}
              disabled={loadingEquipment}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              {loadingEquipment ? 'Memperbarui...' : 'Segarkan Stok'}
            </button>
          </div>

          {/* Equipment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredEquipment.map((eq) => {
              const isAvailable = eq.tersedia > 0;
              return (
                <div
                  key={eq.id_alat}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 flex flex-col justify-between hover:shadow-sm transition-all"
                >
                  <div>
                    {/* Header badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          eq.alat_khusus
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-teal-50 text-teal-800 border-teal-200'
                        }`}
                      >
                        {eq.alat_khusus ? '★ Alat Khusus (2 Penyetuju)' : '✓ Alat Biasa (Izin Laboran)'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {eq.total_unit} unit fisik
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mt-3">{eq.nama_alat}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {eq.deskripsi || 'Peralatan praktikum dan riset laboratorium.'}
                    </p>

                    {/* Stock Meter */}
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Stok Siap Pinjam:</span>
                        <span
                          className={`font-bold font-mono text-sm ${
                            isAvailable ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {eq.tersedia} unit tersedia
                        </span>
                      </div>

                      {/* Mini bar */}
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                        <div
                          className="bg-emerald-600 h-full"
                          style={{
                            width: `${eq.total_unit > 0 ? (eq.tersedia / eq.total_unit) * 100 : 0}%`,
                          }}
                          title={`Tersedia: ${eq.tersedia}`}
                        />
                        <div
                          className="bg-amber-500 h-full"
                          style={{
                            width: `${eq.total_unit > 0 ? (eq.dipinjam / eq.total_unit) * 100 : 0}%`,
                          }}
                          title={`Dipinjam: ${eq.dipinjam}`}
                        />
                        <div
                          className="bg-rose-500 h-full"
                          style={{
                            width: `${eq.total_unit > 0 ? ((eq.pemeliharaan + eq.rusak) / eq.total_unit) * 100 : 0}%`,
                          }}
                          title={`Pemeliharaan/Rusak: ${eq.pemeliharaan + eq.rusak}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        <span>Sedang dipinjam: {eq.dipinjam}</span>
                        <span>Perbaikan/Rusak: {(eq.pemeliharaan || 0) + (eq.rusak || 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {isAvailable ? (
                      <button
                        onClick={() =>
                          onNavigateToBooking({
                            id_alat: eq.id_alat,
                            nama_alat: eq.nama_alat,
                            alat_khusus: eq.alat_khusus,
                          })
                        }
                        className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Ajukan peminjaman alat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 font-medium text-xs border border-slate-200 cursor-not-allowed"
                      >
                        Semua unit sedang dipinjam
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredEquipment.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              Tidak ada jenis alat yang cocok dengan pencarian Anda.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
