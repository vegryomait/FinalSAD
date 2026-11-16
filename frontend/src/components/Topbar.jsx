import React, { useState } from 'react';
import { useAuth, PRESET_USERS } from '../context/AuthContext';
import { User, Shield, ChevronDown } from 'lucide-react';
import Badge from './Badge';

export default function Topbar({ breadcrumb }) {
  const { user, quickLoginAs } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-slate-500">
        <span className="hover:text-slate-700">Laboratorium</span>
        <span>/</span>
        <span className="font-semibold text-slate-800">{breadcrumb || 'Dashboard'}</span>
      </div>

      {/* Right User & Role Switcher */}
      <div className="flex items-center space-x-4">
        {/* Quick Role Switcher for Testing */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-800 text-xs font-medium transition-colors"
            title="Klik untuk mengganti akun / role uji coba"
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span>Simulasi Role: <strong>{user?.role}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-teal-600" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Pilih Akun / Peran Pengguna
              </div>
              {PRESET_USERS.map((u) => (
                <button
                  key={u.email}
                  onClick={() => {
                    quickLoginAs(u.email);
                    setShowRoleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-teal-50 transition-colors ${
                    user?.email === u.email ? 'bg-teal-50/80 font-semibold text-teal-900' : 'text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{u.name}</span>
                    <Badge status={u.role} text={u.role} />
                  </div>
                  <span className="text-[10px] text-slate-400">{u.email}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Current User Info */}
        <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
            {user?.nama?.charAt(0) || 'U'}
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-800 leading-tight">{user?.nama}</div>
            <div className="text-xs text-slate-500">{user?.role} · {user?.nomor_identitas}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
