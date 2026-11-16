import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Plus, Calendar, Clock, AlertTriangle } from 'lucide-react';

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Modals
  const [showAddSched, setShowAddSched] = useState(false);
  const [schedForm, setSchedForm] = useState({
    id_ruangan: '',
    nama_mata_kuliah: '',
    nama_dosen: '',
    hari: 'Senin',
    jam_mulai: '08:00',
    jam_selesai: '09:40',
    berlaku_mulai: '2026-09-01',
    berlaku_selesai: '2026-12-31',
    semester: 'Ganjil 2026/2027',
  });

  const [showAddExc, setShowAddExc] = useState(false);
  const [excForm, setExcForm] = useState({
    id_jadwal: '',
    tanggal: '2026-11-16',
    jenis_pengecualian: 'Pembatalan',
    jam_mulai_baru: '',
    jam_selesai_baru: '',
    alasan: '',
  });

  const loadData = async () => {
    try {
      const s = await api.get('/api/schedules');
      setSchedules(s);
      if (s.length > 0 && !excForm.id_jadwal) {
        setExcForm((prev) => ({ ...prev, id_jadwal: String(s[0].id_jadwal) }));
      }

      const e = await api.get('/api/schedule-exceptions');
      setExceptions(e);

      const r = await api.get('/api/rooms');
      setRooms(r);
      if (r.length > 0 && !schedForm.id_ruangan) {
        setSchedForm((prev) => ({ ...prev, id_ruangan: String(r[0].id_ruangan) }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSched = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/schedules', {
        ...schedForm,
        id_ruangan: Number(schedForm.id_ruangan),
      });
      setShowAddSched(false);
      alert('Jadwal kuliah berulang berhasil ditambahkan!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan jadwal kuliah.');
    }
  };

  const handleCreateExc = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        id_jadwal: Number(excForm.id_jadwal),
        tanggal: excForm.tanggal,
        jenis_pengecualian: excForm.jenis_pengecualian,
        alasan: excForm.alasan,
      };
      if (excForm.jenis_pengecualian === 'Perubahan') {
        payload.jam_mulai_baru = excForm.jam_mulai_baru;
        payload.jam_selesai_baru = excForm.jam_selesai_baru;
      }
      await api.post('/api/schedule-exceptions', payload);
      setShowAddExc(false);
      alert('Pengecualian jadwal berhasil dicatat!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal mencatat pengecualian.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-10 / LABORAN / JADWAL KULIAH
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Pengelolaan jadwal kuliah</h1>
        <p className="text-sm text-slate-500 mt-1">
          Jadwal kuliah disimpan sebagai perulangan mingguan. Pengecualian atau pembatalan pada tanggal tertentu dicatat secara terpisah.
        </p>
      </div>

      {/* Section 1: Recurring Schedules */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Jadwal Kuliah Mingguan Berulang</h2>
            <div className="text-xs text-slate-500">Mencakup hari, jam, ruangan, dan periode berlaku satu semester</div>
          </div>
          <button
            onClick={() => setShowAddSched(true)}
            className="py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah jadwal kuliah</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Mata Kuliah</th>
                <th className="py-3.5 px-6">Dosen Pengampu</th>
                <th className="py-3.5 px-6">Ruangan</th>
                <th className="py-3.5 px-6">Hari & Jam</th>
                <th className="py-3.5 px-6">Periode Berlaku</th>
                <th className="py-3.5 px-6">Semester</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((s) => (
                <tr key={s.id_jadwal} className="hover:bg-slate-50">
                  <td className="py-3.5 px-6 font-bold text-slate-900">{s.nama_mata_kuliah}</td>
                  <td className="py-3.5 px-6 text-slate-700">{s.nama_dosen}</td>
                  <td className="py-3.5 px-6 font-semibold text-teal-800">{s.ruangan?.nama_ruangan || `Ruang ${s.id_ruangan}`}</td>
                  <td className="py-3.5 px-6 font-mono text-slate-800">
                    {s.hari}, {s.jam_mulai}–{s.jam_selesai}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {s.berlaku_mulai} s/d {s.berlaku_selesai}
                  </td>
                  <td className="py-3.5 px-6">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {s.semester}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Exceptions */}
      <div className="space-y-4 pt-6 border-t border-slate-200/80">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pengecualian Jadwal Tertentu</h2>
            <div className="text-xs text-slate-500">Pencatatan pembatalan atau pergeseran jam kuliah pada tanggal khusus</div>
          </div>
          <button
            onClick={() => setShowAddExc(true)}
            className="py-2 px-4 rounded-xl border border-teal-600 text-teal-700 hover:bg-teal-50 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat pengecualian jadwal</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Tanggal</th>
                <th className="py-3.5 px-6">Jadwal Asli</th>
                <th className="py-3.5 px-6">Jenis Pengecualian</th>
                <th className="py-3.5 px-6">Jam Baru (Jika diubah)</th>
                <th className="py-3.5 px-6">Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exceptions.map((exc) => (
                <tr key={exc.id_pengecualian} className="hover:bg-slate-50">
                  <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{exc.tanggal}</td>
                  <td className="py-3.5 px-6 font-semibold text-slate-800">
                    {exc.jadwal?.nama_mata_kuliah} ({exc.jadwal?.ruangan?.nama_ruangan})
                  </td>
                  <td className="py-3.5 px-6">
                    <Badge
                      status={exc.jenis_pengecualian === 'Pembatalan' ? 'dibatalkan' : 'diubah'}
                      text={exc.jenis_pengecualian}
                    />
                  </td>
                  <td className="py-3.5 px-6 font-mono text-slate-700">
                    {exc.jam_mulai_baru ? `${exc.jam_mulai_baru}–${exc.jam_selesai_baru}` : '—'}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">{exc.alasan}</td>
                </tr>
              ))}
              {exceptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    Belum ada data pengecualian jadwal yang dicatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Schedule */}
      {showAddSched && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateSched} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Tambah Jadwal Kuliah Mingguan</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Mata Kuliah</label>
              <input
                type="text"
                required
                placeholder="Misal: Praktikum Telekomunikasi"
                value={schedForm.nama_mata_kuliah}
                onChange={(e) => setSchedForm({ ...schedForm, nama_mata_kuliah: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dosen Pengampu</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dr. Budi Santoso"
                  value={schedForm.nama_dosen}
                  onChange={(e) => setSchedForm({ ...schedForm, nama_dosen: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Ruangan</label>
                <select
                  value={schedForm.id_ruangan}
                  onChange={(e) => setSchedForm({ ...schedForm, id_ruangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  {rooms.map((r) => (
                    <option key={r.id_ruangan} value={r.id_ruangan}>{r.nama_ruangan}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hari</label>
                <select
                  value={schedForm.hari}
                  onChange={(e) => setSchedForm({ ...schedForm, hari: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Mulai</label>
                <input
                  type="time"
                  required
                  value={schedForm.jam_mulai}
                  onChange={(e) => setSchedForm({ ...schedForm, jam_mulai: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Selesai</label>
                <input
                  type="time"
                  required
                  value={schedForm.jam_selesai}
                  onChange={(e) => setSchedForm({ ...schedForm, jam_selesai: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Berlaku Mulai</label>
                <input
                  type="date"
                  required
                  value={schedForm.berlaku_mulai}
                  onChange={(e) => setSchedForm({ ...schedForm, berlaku_mulai: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Berlaku Selesai</label>
                <input
                  type="date"
                  required
                  value={schedForm.berlaku_selesai}
                  onChange={(e) => setSchedForm({ ...schedForm, berlaku_selesai: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Semester</label>
                <input
                  type="text"
                  required
                  value={schedForm.semester}
                  onChange={(e) => setSchedForm({ ...schedForm, semester: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSched(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
              >
                Simpan Jadwal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Add Exception */}
      {showAddExc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateExc} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">Catat Pengecualian Jadwal</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Jadwal Kuliah</label>
              <select
                value={excForm.id_jadwal}
                onChange={(e) => setExcForm({ ...excForm, id_jadwal: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                required
              >
                {schedules.map((s) => (
                  <option key={s.id_jadwal} value={s.id_jadwal}>
                    {s.nama_mata_kuliah} ({s.hari}, {s.jam_mulai}–{s.jam_selesai})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Terjadi</label>
                <input
                  type="date"
                  required
                  value={excForm.tanggal}
                  onChange={(e) => setExcForm({ ...excForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Pengecualian</label>
                <select
                  value={excForm.jenis_pengecualian}
                  onChange={(e) => setExcForm({ ...excForm, jenis_pengecualian: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Pembatalan">Pembatalan</option>
                  <option value="Perubahan">Perubahan Jam</option>
                </select>
              </div>
            </div>

            {excForm.jenis_pengecualian === 'Perubahan' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Mulai Baru</label>
                  <input
                    type="time"
                    required
                    value={excForm.jam_mulai_baru}
                    onChange={(e) => setExcForm({ ...excForm, jam_mulai_baru: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jam Selesai Baru</label>
                  <input
                    type="time"
                    required
                    value={excForm.jam_selesai_baru}
                    onChange={(e) => setExcForm({ ...excForm, jam_selesai_baru: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan Pengecualian</label>
              <textarea
                required
                rows={2}
                placeholder="Misal: Dosen narasumber dinas luar kota..."
                value={excForm.alasan}
                onChange={(e) => setExcForm({ ...excForm, alasan: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddExc(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
              >
                Simpan Pengecualian
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
