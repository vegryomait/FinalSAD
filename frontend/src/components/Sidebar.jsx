import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  FilePlus,
  Clock,
  CheckCircle,
  RotateCcw,
  AlertTriangle,
  Boxes,
  CalendarRange,
  Users,
  BarChart3,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();
  const role = user?.role || 'Mahasiswa';

  // Role permissions for navigation
  const canSeeApprovals = ['Dosen Pengampu', 'Laboran', 'Kepala Laboratorium', 'Dekan'].includes(role);
  const canSeeReturns = ['Laboran', 'Kepala Laboratorium'].includes(role);
  const canSeeLate = ['Laboran', 'Kepala Laboratorium', 'Dekan'].includes(role);
  const canSeeInventory = ['Laboran', 'Kepala Laboratorium', 'Dekan'].includes(role);
  const canSeeSchedules = ['Laboran', 'Kepala Laboratorium'].includes(role);
  const canSeeUsers = ['Laboran', 'Kepala Laboratorium'].includes(role);
  const canSeeReports = ['Kepala Laboratorium', 'Dekan', 'Laboran'].includes(role);

  const navItems = [
    {
      section: 'LAYANAN',
      items: [
        { id: 'availability', label: 'Ketersediaan ruang & alat', code: '03', icon: CalendarDays },
        { id: 'new-booking', label: 'Ajukan peminjaman', code: '04', icon: FilePlus },
        { id: 'my-bookings', label: 'Riwayat peminjaman', code: '06', icon: Clock },
      ]
    },
    {
      section: 'PENGELOLAAN',
      items: [
        canSeeApprovals && { id: 'approvals', label: 'Persetujuan khusus', code: '05', icon: CheckCircle },
        canSeeReturns && { id: 'returns', label: 'Pengembalian alat', code: '07', icon: RotateCcw },
        canSeeLate && { id: 'late-records', label: 'Keterlambatan', code: '08', icon: AlertTriangle },
        canSeeInventory && { id: 'inventory', label: 'Inventaris', code: '09', icon: Boxes },
        canSeeSchedules && { id: 'schedules', label: 'Jadwal kuliah', code: '10', icon: CalendarRange },
        canSeeUsers && { id: 'users', label: 'Akun pengguna', code: '02', icon: Users },
      ].filter(Boolean)
    },
    {
      section: 'PELAPORAN',
      items: [
        canSeeReports && { id: 'reports', label: 'Laporan bulanan', code: '11', icon: BarChart3 },
      ].filter(Boolean)
    }
  ];

  return (
    <aside className="w-64 bg-[#022c2b] text-teal-100/80 flex flex-col min-h-screen shrink-0 border-r border-teal-900/60 shadow-xl">
      {/* Brand Header */}
      <div className="p-6 border-b border-teal-800/40">
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-extrabold tracking-tight text-white font-serif">labora.</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-teal-400 font-semibold mt-1">
          Sistem Laboratorium Terpadu
        </p>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        {navItems.map((sec, idx) => (
          sec.items.length > 0 && (
            <div key={idx} className="space-y-1.5">
              <div className="px-3 text-[10px] font-bold tracking-widest text-teal-400/70 uppercase">
                {sec.section}
              </div>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-[#004d49] text-white shadow-sm font-semibold'
                          : 'text-teal-200/75 hover:bg-teal-900/40 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-mono text-teal-400/80 w-5">{item.code}</span>
                      <Icon className="w-4 h-4 opacity-80" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )
        ))}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-teal-800/40 text-[11px] text-teal-400/60">
        <div className="flex items-center justify-end">
          <button
            onClick={logout}
            className="text-teal-300 hover:text-white flex items-center space-x-1"
            title="Keluar"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
