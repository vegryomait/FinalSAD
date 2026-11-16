import React from 'react';

export default function Badge({ status, text }) {
  const s = (status || text || '').toLowerCase().trim();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['tersedia', 'aktif', 'disetujui', 'selesai', 'baik'].includes(s)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['menunggu', 'sebagian kembali', 'diubah', 'menunggu keputusan', 'menunggu persetujuan'].includes(s)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['bentrok', 'rusak', 'rusak berat', 'ditolak', 'dibatalkan', 'terlambat', 'nonaktif', 'tidak tersedia', 'hilang'].includes(s)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['dipinjam', 'terjadwal'].includes(s)) {
    styles = 'bg-teal-50 text-teal-800 border-teal-200';
  } else if (['pemeliharaan', 'rusak ringan'].includes(s)) {
    styles = 'bg-orange-50 text-orange-800 border-orange-200';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles}`}>
      {text || status}
    </span>
  );
}
