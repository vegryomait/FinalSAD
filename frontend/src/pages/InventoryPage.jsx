import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Plus, Search, Edit3, Boxes, Layers, DoorOpen, Trash2 } from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('unit'); // 'ruangan' | 'alat' | 'unit'

  // Data states
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [units, setUnits] = useState([]);

  // Unit filter & edit
  const [unitSearch, setUnitSearch] = useState('');
  const [unitStatusFilter, setUnitStatusFilter] = useState('Semua status');
  const [editingUnit, setEditingUnit] = useState(null);

  // Modals / forms
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [newUnitData, setNewUnitData] = useState({ id_alat: '', kode_inventaris: '', kondisi: 'Baik', status: 'Tersedia' });

  const [showAddRoom, setShowAddRoom] = useState(false);
  const [newRoomData, setNewRoomData] = useState({ nama_ruangan: '', lokasi: '', kapasitas: 30, deskripsi: '', status: 'Aktif' });

  const [showAddEq, setShowAddEq] = useState(false);
  const [newEqData, setNewEqData] = useState({ nama_alat: '', deskripsi: '', alat_khusus: false });

  const loadData = async () => {
    try {
      const r = await api.get('/api/rooms');
      setRooms(r);

      const eq = await api.get('/api/equipment');
      setEquipment(eq);

      const u = await api.get('/api/equipment/units');
      setUnits(u);
      if (u.length > 0 && !editingUnit) {
        setEditingUnit(u[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered units
  const filteredUnits = units.filter((u) => {
    const matchStatus = unitStatusFilter === 'Semua status' || u.status === unitStatusFilter;
    const matchSearch = !unitSearch ||
      u.kode_inventaris.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.alat?.nama_alat.toLowerCase().includes(unitSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleUpdateUnit = async (e) => {
    e.preventDefault();
    if (!editingUnit) return;
    try {
      await api.patch(`/api/equipment/units/${editingUnit.id_unit}`, {
        kode_inventaris: editingUnit.kode_inventaris,
        kondisi: editingUnit.kondisi,
        status: editingUnit.status,
      });
      alert('Unit berhasil diperbarui!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui unit.');
    }
  };

  const handleCreateUnit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/equipment/units', {
        ...newUnitData,
        id_alat: Number(newUnitData.id_alat),
      });
      setShowAddUnit(false);
      setNewUnitData({ id_alat: '', kode_inventaris: '', kondisi: 'Baik', status: 'Tersedia' });
      alert('Unit baru berhasil ditambahkan!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan unit.');
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/rooms', {
        ...newRoomData,
        kapasitas: Number(newRoomData.kapasitas),
      });
      setShowAddRoom(false);
      alert('Ruangan berhasil ditambahkan!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan ruangan.');
    }
  };

  const handleCreateEq = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/equipment', newEqData);
      setShowAddEq(false);
      alert('Jenis alat berhasil ditambahkan!');
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menambahkan jenis alat.');
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!window.confirm(`Yakin ingin menghapus ruangan "${room.nama_ruangan}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/rooms/${room.id_ruangan}`);
      alert(`Ruangan "${room.nama_ruangan}" berhasil dihapus.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus ruangan.');
    }
  };

  const handleDeleteEq = async (eq) => {
    if (!window.confirm(`Yakin ingin menghapus jenis alat "${eq.nama_alat}" beserta unit fisiknya?`)) {
      return;
    }
    try {
      await api.delete(`/api/equipment/${eq.id_alat}`);
      alert(`Jenis alat "${eq.nama_alat}" berhasil dihapus.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus jenis alat.');
    }
  };

  const handleDeleteUnit = async (u) => {
    if (!window.confirm(`Yakin ingin menghapus unit fisik "${u.kode_inventaris}"?`)) {
      return;
    }
    try {
      await api.delete(`/api/equipment/units/${u.id_unit}`);
      alert(`Unit fisik "${u.kode_inventaris}" berhasil dihapus.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Gagal menghapus unit.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-09 / LABORAN / INVENTARIS
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Inventaris ruangan & alat</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola ruangan, jenis alat, dan setiap unit fisik laboratorium. Setiap unit memiliki kode inventaris yang unik.
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setActiveTab('ruangan')}
          className={`py-2 px-5 rounded-xl text-xs font-semibold border transition-all ${
            activeTab === 'ruangan'
              ? 'bg-[#006d64] text-white border-transparent shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Ruangan ({rooms.length})
        </button>
        <button
          onClick={() => setActiveTab('alat')}
          className={`py-2 px-5 rounded-xl text-xs font-semibold border transition-all ${
            activeTab === 'alat'
              ? 'bg-[#006d64] text-white border-transparent shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Jenis Alat ({equipment.length})
        </button>
        <button
          onClick={() => setActiveTab('unit')}
          className={`py-2 px-5 rounded-xl text-xs font-semibold border transition-all ${
            activeTab === 'unit'
              ? 'bg-[#006d64] text-white border-transparent shadow-xs'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          Unit Alat ({units.length})
        </button>
      </div>

      {/* Tab Content: Unit Alat */}
      {activeTab === 'unit' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 flex-1">
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari kode / jenis alat..."
                  value={unitSearch}
                  onChange={(e) => setUnitSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
              <select
                value={unitStatusFilter}
                onChange={(e) => setUnitStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="Semua status">Semua status</option>
                <option value="Tersedia">Tersedia</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Pemeliharaan">Pemeliharaan</option>
                <option value="Rusak">Rusak</option>
                <option value="Hilang">Hilang</option>
              </select>
            </div>

            <button
              onClick={() => {
                if (equipment.length > 0) setNewUnitData({ ...newUnitData, id_alat: String(equipment[0].id_alat) });
                setShowAddUnit(true);
              }}
              className="py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah unit</span>
            </button>
          </div>

          {/* Units Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Kode inventaris</th>
                    <th className="py-3 px-6">Jenis alat</th>
                    <th className="py-3 px-6">Kondisi</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUnits.map((u) => (
                    <tr
                      key={u.id_unit}
                      onClick={() => setEditingUnit(u)}
                      className={`cursor-pointer transition-colors ${
                        editingUnit?.id_unit === u.id_unit ? 'bg-teal-50/60 font-medium' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900">{u.kode_inventaris}</td>
                      <td className="py-3.5 px-6 text-slate-800">{u.alat?.nama_alat || '—'}</td>
                      <td className="py-3.5 px-6 text-slate-600">{u.kondisi}</td>
                      <td className="py-3.5 px-6">
                        <Badge status={u.status} />
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-3">
                        <span className="text-teal-700 font-semibold hover:underline">
                          Ubah
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUnit(u);
                          }}
                          className="text-rose-600 hover:text-rose-800 font-semibold hover:underline text-xs cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUnits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada unit fisik yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unit Edit Card */}
          {editingUnit && (
            <form onSubmit={handleUpdateUnit} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900">
                  Ubah unit · {editingUnit.kode_inventaris}
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kode inventaris unik
                  </label>
                  <input
                    type="text"
                    value={editingUnit.kode_inventaris}
                    onChange={(e) => setEditingUnit({ ...editingUnit, kode_inventaris: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Jenis alat
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingUnit.alat?.nama_alat || ''}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kondisi
                  </label>
                  <select
                    value={editingUnit.kondisi}
                    onChange={(e) => setEditingUnit({ ...editingUnit, kondisi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Baik">Baik</option>
                    <option value="Rusak ringan">Rusak ringan</option>
                    <option value="Rusak berat">Rusak berat</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Status
                  </label>
                  <select
                    value={editingUnit.status}
                    onChange={(e) => setEditingUnit({ ...editingUnit, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Tersedia">Tersedia</option>
                    <option value="Dipinjam">Dipinjam</option>
                    <option value="Pemeliharaan">Pemeliharaan</option>
                    <option value="Rusak">Rusak</option>
                    <option value="Hilang">Hilang</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
                >
                  Simpan perubahan
                </button>
                <div className="text-[11px] text-slate-400">
                  Kode inventaris tidak boleh sama dengan unit lain.
                </div>
              </div>
            </form>
          )}

          {/* Modal Add Unit */}
          {showAddUnit && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <form onSubmit={handleCreateUnit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Tambah Unit Alat Fisik</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Alat</label>
                  <select
                    value={newUnitData.id_alat}
                    onChange={(e) => setNewUnitData({ ...newUnitData, id_alat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    required
                  >
                    {equipment.map((eq) => (
                      <option key={eq.id_alat} value={eq.id_alat}>{eq.nama_alat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kode Inventaris Unik</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: OSC-011"
                    value={newUnitData.kode_inventaris}
                    onChange={(e) => setNewUnitData({ ...newUnitData, kode_inventaris: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kondisi</label>
                    <select
                      value={newUnitData.kondisi}
                      onChange={(e) => setNewUnitData({ ...newUnitData, kondisi: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Baik">Baik</option>
                      <option value="Rusak ringan">Rusak ringan</option>
                      <option value="Rusak berat">Rusak berat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      value={newUnitData.status}
                      onChange={(e) => setNewUnitData({ ...newUnitData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Tersedia">Tersedia</option>
                      <option value="Pemeliharaan">Pemeliharaan</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddUnit(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
                  >
                    Simpan Unit
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Ruangan */}
      {activeTab === 'ruangan' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Daftar Ruangan Laboratorium</h2>
            <button
              onClick={() => setShowAddRoom(true)}
              className="py-2 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah ruangan</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Nama Ruangan</th>
                  <th className="py-3.5 px-6">Lokasi</th>
                  <th className="py-3.5 px-6">Kapasitas</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rooms.map((r) => (
                  <tr key={r.id_ruangan} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{r.nama_ruangan}</td>
                    <td className="py-3.5 px-6 text-slate-600">{r.lokasi}</td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">{r.kapasitas} orang</td>
                    <td className="py-3.5 px-6">
                      <Badge status={r.status} />
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteRoom(r)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                        title="Hapus Ruangan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddRoom && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <form onSubmit={handleCreateRoom} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Tambah Ruangan Baru</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Ruangan</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Lab Komputer 02"
                    value={newRoomData.nama_ruangan}
                    onChange={(e) => setNewRoomData({ ...newRoomData, nama_ruangan: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Gedung A · Lantai 2"
                    value={newRoomData.lokasi}
                    onChange={(e) => setNewRoomData({ ...newRoomData, lokasi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Kapasitas</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newRoomData.kapasitas}
                      onChange={(e) => setNewRoomData({ ...newRoomData, kapasitas: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                    <select
                      value={newRoomData.status}
                      onChange={(e) => setNewRoomData({ ...newRoomData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Pemeliharaan">Pemeliharaan</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRoom(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
                  >
                    Simpan Ruangan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Jenis Alat */}
      {activeTab === 'alat' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-900">Kategori & Jenis Alat</h2>
            <button
              onClick={() => setShowAddEq(true)}
              className="py-2 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah jenis</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Nama Alat</th>
                  <th className="py-3.5 px-6">Deskripsi</th>
                  <th className="py-3.5 px-6">Kategori Khusus</th>
                  <th className="py-3.5 px-6">Stok Fisik Tersedia</th>
                  <th className="py-3.5 px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((eq) => (
                  <tr key={eq.id_alat} className="hover:bg-slate-50">
                    <td className="py-3.5 px-6 font-bold text-slate-900">{eq.nama_alat}</td>
                    <td className="py-3.5 px-6 text-slate-600">{eq.deskripsi}</td>
                    <td className="py-3.5 px-6">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        eq.alat_khusus ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {eq.alat_khusus ? 'Ya · 2 penyetuju' : 'Tidak · reguler'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-teal-800">
                      {eq.tersedia} dari {eq.total_unit} unit tersedia
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDeleteEq(eq)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition cursor-pointer"
                        title="Hapus Jenis Alat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddEq && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
              <form onSubmit={handleCreateEq} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                <h3 className="text-base font-bold text-slate-900">Tambah Jenis Alat</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Alat</label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Spektrofotometer UV-Vis"
                    value={newEqData.nama_alat}
                    onChange={(e) => setNewEqData({ ...newEqData, nama_alat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                  <textarea
                    rows={2}
                    placeholder="Keterangan fungsi atau spesifikasi alat..."
                    value={newEqData.deskripsi}
                    onChange={(e) => setNewEqData({ ...newEqData, deskripsi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="alat_khusus"
                    checked={newEqData.alat_khusus}
                    onChange={(e) => setNewEqData({ ...newEqData, alat_khusus: e.target.checked })}
                    className="w-4 h-4 text-teal-700 rounded border-slate-300"
                  />
                  <label htmlFor="alat_khusus" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Kategori Alat Khusus (Memerlukan persetujuan Dosen Pengampu & Laboran)
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddEq(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold"
                  >
                    Simpan Jenis
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
