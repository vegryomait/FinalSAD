import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import Badge from '../components/Badge';

export default function NewBookingPage({ initialRoomPref, onBookingSuccess }) {
  const { user } = useAuth();

  // Mode: 'ruang_dan_alat' | 'ruang' | 'alat'
  const [kebutuhan, setKebutuhan] = useState('ruang_dan_alat');

  // Room fields
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [tanggalPenggunaan, setTanggalPenggunaan] = useState('2026-11-16');
  const [jamMulai, setJamMulai] = useState('13:00');
  const [jamSelesai, setJamSelesai] = useState('15:00');

  // Equipment fields
  const [allEquipment, setAllEquipment] = useState([]);
  const [selectedTools, setSelectedTools] = useState([
    { id_alat: 1, nama_alat: 'Osiloskop digital', jumlah_pinjam: 2, alat_khusus: true },
    { id_alat: 2, nama_alat: 'Multimeter digital', jumlah_pinjam: 1, alat_khusus: false },
  ]);
  const [tenggatTanggal, setTenggatTanggal] = useState('2026-11-17');
  const [tenggatJam, setTenggatJam] = useState('16:00');

  // Tool selector modal / inputs
  const [showAddTool, setShowAddTool] = useState(false);
  const [toolToAdd, setToolToAdd] = useState('');
  const [qtyToAdd, setQtyToAdd] = useState(1);

  // Common fields
  const [tujuan, setTujuan] = useState('Praktikum pengukuran rangkaian elektronika');
  const [catatan, setCatatan] = useState('Digunakan oleh kelompok 4, kelas A.');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadMasterData() {
      try {
        const rooms = await api.get('/api/rooms');
        setAllRooms(rooms);
        if (initialRoomPref?.id_ruangan) {
          setSelectedRoomId(String(initialRoomPref.id_ruangan));
          if (initialRoomPref.tanggal) setTanggalPenggunaan(initialRoomPref.tanggal);
          if (initialRoomPref.jamMulai) setJamMulai(initialRoomPref.jamMulai);
          if (initialRoomPref.jamSelesai) setJamSelesai(initialRoomPref.jamSelesai);
        } else if (rooms.length > 0) {
          setSelectedRoomId(String(rooms[0].id_ruangan));
        }

        const eq = await api.get('/api/equipment');
        setAllEquipment(eq);
        if (eq.length > 0) {
          setToolToAdd(String(eq[0].id_alat));
        }

        if (initialRoomPref?.id_alat) {
          setKebutuhan('alat');
          const eqItem = eq.find((e) => e.id_alat === initialRoomPref.id_alat);
          if (eqItem) {
            setSelectedTools([{
              id_alat: eqItem.id_alat,
              nama_alat: eqItem.nama_alat,
              jumlah_pinjam: 1,
              alat_khusus: eqItem.alat_khusus,
            }]);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMasterData();
  }, [initialRoomPref]);

  const handleAddTool = () => {
    const eq = allEquipment.find((e) => String(e.id_alat) === String(toolToAdd));
    if (!eq) return;

    const existingIndex = selectedTools.findIndex((t) => t.id_alat === eq.id_alat);
    if (existingIndex >= 0) {
      const updated = [...selectedTools];
      updated[existingIndex].jumlah_pinjam += Number(qtyToAdd);
      setSelectedTools(updated);
    } else {
      setSelectedTools([
        ...selectedTools,
        {
          id_alat: eq.id_alat,
          nama_alat: eq.nama_alat,
          jumlah_pinjam: Number(qtyToAdd),
          alat_khusus: eq.alat_khusus,
        },
      ]);
    }
    setShowAddTool(false);
    setQtyToAdd(1);
  };

  const handleRemoveTool = (id_alat) => {
    setSelectedTools(selectedTools.filter((t) => t.id_alat !== id_alat));
  };

  const hasSpecialTool = (kebutuhan === 'alat' || kebutuhan === 'ruang_dan_alat') &&
    selectedTools.some((t) => t.alat_khusus);

  const selectedRoomObj = allRooms.find((r) => String(r.id_ruangan) === String(selectedRoomId));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const payload = {
        tujuan,
        catatan,
      };

      if (kebutuhan === 'ruang' || kebutuhan === 'ruang_dan_alat') {
        payload.ruang = {
          id_ruangan: Number(selectedRoomId),
          tanggal: tanggalPenggunaan,
          jam_mulai: jamMulai,
          jam_selesai: jamSelesai,
        };
      }

      if (kebutuhan === 'alat' || kebutuhan === 'ruang_dan_alat') {
        if (selectedTools.length === 0) {
          throw new Error('Pilih setidaknya satu alat untuk dipinjam.');
        }
        const tenggatISO = `${tenggatTanggal}T${tenggatJam}:00`;
        payload.alat = selectedTools.map((t) => ({
          id_alat: t.id_alat,
          jumlah_pinjam: t.jumlah_pinjam,
          tenggat_pengembalian: tenggatISO,
        }));
      }

      const res = await api.post('/api/bookings', payload);
      setSuccess(`Pengajuan berhasil dikirim dengan ID ${res.kode_peminjaman}!`);
      setTimeout(() => {
        if (onBookingSuccess) onBookingSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Gagal mengirim pengajuan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          LAYANAN LABORATORIUM / FORMULIR PEMINJAMAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Pengajuan peminjaman</h1>
        <p className="text-sm text-slate-500 mt-1">
          Satu pengajuan untuk seluruh kebutuhan ruangan dan alat.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Validasi Pengajuan Gagal</div>
            <div className="text-xs mt-0.5">{error}</div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Form (2 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8 bg-white p-8 rounded-2xl border border-slate-200/90 shadow-xs">
          {/* Section 01: Kebutuhan & Waktu Penggunaan */}
          <div className="space-y-5">
            <div className="flex items-center space-x-2 text-base font-bold text-slate-900">
              <span className="text-teal-700 font-mono">01</span>
              <span>Kebutuhan & waktu penggunaan</span>
            </div>

            {/* Kebutuhan Toggle */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => setKebutuhan('ruang')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  kebutuhan === 'ruang'
                    ? 'bg-[#006d64] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ruangan
              </button>
              <button
                type="button"
                onClick={() => setKebutuhan('alat')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  kebutuhan === 'alat'
                    ? 'bg-[#006d64] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Alat
              </button>
              <button
                type="button"
                onClick={() => setKebutuhan('ruang_dan_alat')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  kebutuhan === 'ruang_dan_alat'
                    ? 'bg-[#006d64] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ruangan dan Alat
              </button>
            </div>

            {/* Room Inputs if applicable */}
            {(kebutuhan === 'ruang' || kebutuhan === 'ruang_dan_alat') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Ruangan
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  >
                    {allRooms.map((r) => (
                      <option key={r.id_ruangan} value={r.id_ruangan}>
                        {r.nama_ruangan} · {r.kapasitas} orang
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal penggunaan
                  </label>
                  <input
                    type="date"
                    value={tanggalPenggunaan}
                    onChange={(e) => setTanggalPenggunaan(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 02: Alat & Tenggat Pengembalian */}
          {(kebutuhan === 'alat' || kebutuhan === 'ruang_dan_alat') && (
            <div className="space-y-5 pt-4 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-base font-bold text-slate-900">
                <span className="text-teal-700 font-mono">02</span>
                <span>Alat & tenggat pengembalian</span>
              </div>

              {/* Tools Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Jenis alat</th>
                      <th className="py-2.5 px-4">Jumlah unit</th>
                      <th className="py-2.5 px-4">Kategori</th>
                      <th className="py-2.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTools.map((t) => (
                      <tr key={t.id_alat}>
                        <td className="py-3 px-4 font-semibold text-slate-800">{t.nama_alat}</td>
                        <td className="py-3 px-4 font-mono">{t.jumlah_pinjam}</td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-medium ${t.alat_khusus ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                            {t.alat_khusus ? 'Alat khusus' : 'Reguler'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveTool(t.id_alat)}
                            className="text-rose-600 hover:text-rose-800 text-xs font-medium cursor-pointer"
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                    {selectedTools.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400">
                          Belum ada alat yang ditambahkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Add Tool Form or Button */}
              {!showAddTool ? (
                <button
                  type="button"
                  onClick={() => setShowAddTool(true)}
                  className="py-2 px-3 rounded-lg border border-slate-300 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:text-teal-700 flex items-center space-x-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah alat</span>
                </button>
              ) : (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Pilih Jenis Alat
                    </label>
                    <select
                      value={toolToAdd}
                      onChange={(e) => setToolToAdd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    >
                      {allEquipment.map((eq) => (
                        <option key={eq.id_alat} value={eq.id_alat}>
                          {eq.nama_alat} {eq.alat_khusus ? '(Khusus)' : ''} (Tersedia: {eq.tersedia})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={qtyToAdd}
                      onChange={(e) => setQtyToAdd(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleAddTool}
                      className="px-4 py-2 bg-[#006d64] text-white text-xs font-semibold rounded-lg hover:bg-[#005851]"
                    >
                      Tambahkan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddTool(false)}
                      className="px-3 py-2 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              )}

              {/* Deadline inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Tanggal pengembalian alat
                  </label>
                  <input
                    type="date"
                    value={tenggatTanggal}
                    onChange={(e) => setTenggatTanggal(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Waktu tenggat
                  </label>
                  <input
                    type="time"
                    value={tenggatJam}
                    onChange={(e) => setTenggatJam(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tujuan & Catatan */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tujuan / kegiatan
              </label>
              <input
                type="text"
                value={tujuan}
                onChange={(e) => setTujuan(e.target.value)}
                placeholder="Misal: Praktikum pengukuran rangkaian elektronika"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Catatan tambahan
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                rows={2}
                placeholder="Catatan pelengkap, informasi anggota kelompok, dsb."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Mengirim...' : 'Kirim pengajuan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setTujuan('');
                setCatatan('');
              }}
              className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>

        {/* Right Summary Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs h-fit space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Ringkasan pengajuan</h2>
            <Badge status="menunggu" text="Draf pengajuan" />
          </div>

          {/* Requester Info */}
          <div>
            <div className="text-sm font-bold text-slate-900">{user?.nama}</div>
            <div className="text-xs text-slate-500">{user?.role} · {user?.nomor_identitas}</div>
          </div>

          {/* Summary of Room */}
          {(kebutuhan === 'ruang' || kebutuhan === 'ruang_dan_alat') && (
            <div className="space-y-1 text-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">RUANGAN</div>
              <div className="font-semibold text-slate-800">{selectedRoomObj?.nama_ruangan || '—'}</div>
              <div className="text-slate-500">{tanggalPenggunaan} · {jamMulai}–{jamSelesai} WIB</div>
            </div>
          )}

          {/* Summary of Tools */}
          {(kebutuhan === 'alat' || kebutuhan === 'ruang_dan_alat') && (
            <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ALAT</div>
              {selectedTools.map((t) => (
                <div key={t.id_alat} className="flex justify-between items-center text-slate-700">
                  <span>{t.jumlah_pinjam} × {t.nama_alat}</span>
                  {t.alat_khusus && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Khusus</span>}
                </div>
              ))}
              <div className="text-slate-500 text-[11px] pt-1">
                Tenggat: {tenggatTanggal} · {tenggatJam} WIB
              </div>
            </div>
          )}

          {/* Special Approval Callout */}
          {hasSpecialTool && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Memerlukan 2 Persetujuan</span>
              </div>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                Alat khusus memerlukan keputusan Dosen Pengampu dan Laboran.
              </p>
            </div>
          )}

          <div className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-3">
            Seluruh kebutuhan disimpan dalam satu transaksi dengan <span className="font-mono font-medium">id_peminjaman</span> yang sama. ID terbit setelah pengajuan dikirim.
          </div>
        </div>
      </div>
    </div>
  );
}
