import React, { useState } from 'react';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login, quickLoginAs } = useAuth();
  const [username, setUsername] = useState('nadia.putri@kampus.ac.id');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Kredensial salah atau akun tidak aktif.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Branding Panel (matching mockup dark teal) */}
      <div className="md:w-5/12 bg-[#022c2b] text-white p-8 md:p-14 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-4xl font-extrabold tracking-tight font-serif text-teal-50">labora.</span>
          </div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-teal-400 mt-2">
            Layanan Laboratorium Terpadu
          </p>

          <div className="mt-16 md:mt-24 space-y-6">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight font-serif text-teal-50">
              Ruang untuk belajar.<br />
              Alat untuk berkarya.
            </h1>
            <p className="text-teal-200/80 text-sm md:text-base leading-relaxed max-w-sm">
              Kelola akses ruangan dan peralatan laboratorium dalam satu layanan yang terhubung.
            </p>
          </div>
        </div>

        {/* 3 Step Process Box */}
        <div className="my-12 p-6 rounded-2xl bg-teal-900/40 border border-teal-800/60 backdrop-blur-sm space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-teal-300">
            Dari rencana hingga pengembalian
          </div>
          <div className="space-y-2.5 text-xs text-teal-100">
            <div className="flex items-center space-x-3">
              <span className="font-mono text-teal-400 font-bold">01</span>
              <span>Cek ruangan dan pilih kebutuhan</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-teal-400 font-bold">02</span>
              <span>Ajukan dan pantau persetujuan</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="font-mono text-teal-400 font-bold">03</span>
              <span>Gunakan, lalu kembalikan alat</span>
            </div>
          </div>
        </div>

        <div className="text-xs text-teal-400/60 space-y-1">
          <div>Akses terkelola untuk civitas akademika · TA 2026/2027</div>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-20 py-12 bg-white">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <div className="text-xs font-semibold tracking-widest uppercase text-teal-700">
              UC-01 / AKSES PENGGUNA
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mt-2">Selamat datang kembali</h2>
            <p className="text-sm text-slate-500 mt-2">
              Masuk dengan akun yang diberikan oleh Laboran.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm space-y-1">
              <div className="flex items-center space-x-2 font-semibold">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Tidak dapat masuk</span>
              </div>
              <p className="text-xs text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email atau nomor identitas
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="nadia.putri@kampus.ac.id atau 2204101021"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-sm transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Memeriksa kredensial...' : 'Masuk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins for Fast Role Evaluation */}
          <div className="pt-6 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400 mb-3">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>LOGIN CEPAT UNTUK PENGUJIAN ROLE</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => quickLoginAs(u.email)}
                  className="text-left px-3 py-2 rounded-lg border border-slate-200 hover:border-teal-400 hover:bg-teal-50/50 text-xs transition-colors"
                >
                  <div className="font-semibold text-slate-800">{u.name}</div>
                  <div className="text-[11px] text-teal-700 font-medium">{u.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
