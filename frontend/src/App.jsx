import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import RoomAvailabilityPage from './pages/RoomAvailabilityPage';
import NewBookingPage from './pages/NewBookingPage';
import ApprovalsPage from './pages/ApprovalsPage';
import BookingHistoryPage from './pages/BookingHistoryPage';
import ReturnsPage from './pages/ReturnsPage';
import LateRecordsPage from './pages/LateRecordsPage';
import InventoryPage from './pages/InventoryPage';
import SchedulesPage from './pages/SchedulesPage';
import UsersPage from './pages/UsersPage';
import MonthlyReportPage from './pages/MonthlyReportPage';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('availability');
  const [roomPref, setRoomPref] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 text-sm">
        Memuat sistem Labora...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigateToBooking = (pref) => {
    setRoomPref(pref);
    setActiveTab('new-booking');
  };

  const handleBookingSuccess = () => {
    setActiveTab('my-bookings');
  };

  const getBreadcrumb = () => {
    switch (activeTab) {
      case 'availability': return 'Ketersediaan ruangan (UC-03)';
      case 'new-booking': return 'Ajukan peminjaman (UC-04)';
      case 'my-bookings': return 'Riwayat peminjaman (UC-06)';
      case 'approvals': return 'Persetujuan alat khusus (UC-05)';
      case 'returns': return 'Pengembalian alat bertahap (UC-07)';
      case 'late-records': return 'Pemantauan keterlambatan (UC-08)';
      case 'inventory': return 'Inventaris ruangan & alat (UC-09)';
      case 'schedules': return 'Jadwal kuliah & pengecualian (UC-10)';
      case 'users': return 'Pengelolaan akun pengguna (UC-02)';
      case 'reports': return 'Laporan bulanan (UC-11)';
      default: return 'Layanan Laboratorium';
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50/60 font-sans antialiased text-slate-900">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar breadcrumb={getBreadcrumb()} />

        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'availability' && (
            <RoomAvailabilityPage onNavigateToBooking={handleNavigateToBooking} />
          )}

          {activeTab === 'new-booking' && (
            <NewBookingPage
              initialRoomPref={roomPref}
              onBookingSuccess={handleBookingSuccess}
            />
          )}

          {activeTab === 'my-bookings' && <BookingHistoryPage />}

          {activeTab === 'approvals' && <ApprovalsPage />}

          {activeTab === 'returns' && <ReturnsPage />}

          {activeTab === 'late-records' && <LateRecordsPage />}

          {activeTab === 'inventory' && <InventoryPage />}

          {activeTab === 'schedules' && <SchedulesPage />}

          {activeTab === 'users' && <UsersPage />}

          {activeTab === 'reports' && <MonthlyReportPage />}
        </main>
      </div>
    </div>
  );
}
