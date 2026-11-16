import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Plus, Search, UserCheck, UserX, ShieldCheck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Semua role');
  const [statusFilter, setStatusFilter] = useState('Semua status');

  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    nomor_identitas: '',
    role: 'Mahasiswa',
    status_akun: 'Aktif',
  });

  const loadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter !== 'Semua role') params.append('role', roleFilter);
      if (statusFilter !== 'Semua status') params.append('status', statusFilter);

      const data = await api.get(`/api/users?${params.toString()}`);
      setUsers(data);
      if (data.length > 0 && !selectedUser && !isCreating) {
        selectUserForEdit(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter, statusFilter]);

  const selectUserForEdit = (u) => {
    setIsCreating(false);
    setSelectedUser(u);
    setFormData({
      nama: u.nama,
      email: u.email,
      password: '',
      nomor_identitas: u.nomor_identitas,
      role: u.role,
      status_akun: u.status_akun,
    });
  };

  const startCreate = () => {
    setIsCreating(true);
    setSelectedUser(null);
    setFormData({
      nama: '',
      email: '',
      password: 'password123',
      nomor_identitas: '',
      role: 'Mahasiswa',
      status_akun: 'Aktif',
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (isCreating) {
        await api.post('/api/users', formData);
        alert('Pengguna baru berhasil dibuat!');
        setIsCreating(false);
      } else {
        const payload = { ...formData };
        if (!payload.password) delete payload.password;
        await api.put(`/api/users/${selectedUser.id_pengguna}`, payload);
        alert('Data pengguna berhasil diperbarui!');
      }
      loadUsers();
    } catch (err) {
      alert(err.message || 'Gagal menyimpan data pengguna.');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedUser) return;
    try {
      const updated = await api.patch(`/api/users/${selectedUser.id_pengguna}/toggle-status`);
      selectUserForEdit(updated);
      loadUsers();
    } catch (err) {
      alert(err.message || 'Gagal mengubah status akun.');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-02 / LABORAN / PENGELOLAAN AKUN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Pengelolaan akun pengguna</h1>
        <p className="text-sm text-slate-500 mt-1">
          Kelola akses dan peran seluruh pengguna laboratorium. Setiap pembuatan dan perubahan akun dicatat untuk audit.
        </p>
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div className="md:col-span-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Cari pengguna</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari nama, email, identitas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="Semua role">Semua role</option>
            <option value="Mahasiswa">Mahasiswa</option>
            <option value="Dosen">Dosen</option>
            <option value="Dosen Pengampu">Dosen Pengampu</option>
            <option value="Laboran">Laboran</option>
            <option value="Kepala Laboratorium">Kepala Laboratorium</option>
            <option value="Dekan">Dekan</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Status akun</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="Semua status">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>

        <div>
          <button
            onClick={startCreate}
            className="w-full py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold flex items-center justify-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah pengguna</span>
          </button>
        </div>
      </div>

      {/* Main Content: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: User Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftar pengguna</h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  {users.length} pengguna ditampilkan · Seluruh akun dibuat oleh Laboran
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">Nama / Email</th>
                    <th className="py-3 px-6">No. Identitas</th>
                    <th className="py-3 px-6">Role</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const isSelected = selectedUser?.id_pengguna === u.id_pengguna;
                    return (
                      <tr
                        key={u.id_pengguna}
                        onClick={() => selectUserForEdit(u)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-teal-50/60 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3.5 px-6">
                          <div className="font-bold text-slate-900">{u.nama}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </td>
                        <td className="py-3.5 px-6 font-mono text-slate-700">{u.nomor_identitas}</td>
                        <td className="py-3.5 px-6 text-slate-800">{u.role}</td>
                        <td className="py-3.5 px-6">
                          <Badge status={u.status_akun} />
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span className="text-teal-700 font-semibold hover:underline">
                            Ubah
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada pengguna ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-teal-50/60 border border-teal-100 text-xs text-teal-900">
            Pembuat akun dan waktu perubahan tersimpan untuk audit.
          </div>
        </div>

        {/* Right Column: Edit/Create Form (1 col) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs h-fit space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-900">
              {isCreating ? 'Tambah pengguna baru' : `Ubah pengguna · ${selectedUser?.nama || ''}`}
            </h3>
            <div className="text-xs text-slate-400 mt-0.5">
              {isCreating ? 'Isi formulir untuk mendaftarkan akun baru' : `Data terpilih · ${selectedUser?.nama}`}
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nama lengkap</label>
              <input
                type="text"
                required
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor identitas (NIM/NIP)</label>
              <input
                type="text"
                required
                value={formData.nomor_identitas}
                onChange={(e) => setFormData({ ...formData, nomor_identitas: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>

            {isCreating && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password Awal</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Dosen">Dosen</option>
                  <option value="Dosen Pengampu">Dosen Pengampu</option>
                  <option value="Laboran">Laboran</option>
                  <option value="Kepala Laboratorium">Kepala Laboratorium</option>
                  <option value="Dekan">Dekan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status akun</label>
                <select
                  value={formData.status_akun}
                  onChange={(e) => setFormData({ ...formData, status_akun: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <button
                type="submit"
                className="flex-1 py-2 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white text-xs font-semibold shadow-xs transition"
              >
                {isCreating ? 'Buat Pengguna' : 'Simpan perubahan'}
              </button>

              {!isCreating && selectedUser && (
                <button
                  type="button"
                  onClick={handleToggleStatus}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                    selectedUser.status_akun === 'Aktif'
                      ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  {selectedUser.status_akun === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              Mode tambah menggunakan kolom yang sama. Identitas pembuat akun dicatat otomatis.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
