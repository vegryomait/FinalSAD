import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Badge from '../components/Badge';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [dosenNote, setDosenNote] = useState('');
  const [laboranNote, setLaboranNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadApprovals = async () => {
    try {
      const data = await api.get('/api/approvals');
      setApprovals(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id_peminjaman);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, [user]);

  useEffect(() => {
    if (selectedId) {
      const found = approvals.find((a) => a.id_peminjaman === selectedId);
      setSelectedDetail(found || null);
    }
  }, [selectedId, approvals]);

  const handleDecision = async (id_persetujuan, status, catatan) => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.patch(`/api/approvals/${id_persetujuan}/decision`, {
        status,
        catatan,
      });
      setMessage({ type: 'success', text: res.message });
      await loadApprovals();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan keputusan.' });
    } finally {
      setLoading(false);
    }
  };

  const isDosenPengampu = user?.role === 'Dosen Pengampu' || user?.role === 'Dekan';
  const isLaboran = user?.role === 'Laboran' || user?.role === 'Kepala Laboratorium' || user?.role === 'Dekan';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          DOSEN PENGAMPU · LABORAN / PERSETUJUAN PEMINJAMAN
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Persetujuan peminjaman</h1>
        <p className="text-sm text-slate-500 mt-1">
          Alat khusus memerlukan 2 tahap persetujuan (Dosen Pengampu & Kak Dina). Alat biasa hanya membutuhkan persetujuan langsung dari Kak Dina (Laboran).
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{message.text}</span>
        </div>
      )}

      {/* Top Table: Approvals Queue */}
      <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Menunggu persetujuan · {approvals.length} pengajuan
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200/70">
              <tr>
                <th className="py-3.5 px-6">ID / Peminjam</th>
                <th className="py-3.5 px-6">Alat khusus</th>
                <th className="py-3.5 px-6">Jumlah</th>
                <th className="py-3.5 px-6">Tenggat</th>
                <th className="py-3.5 px-6">Pengampu</th>
                <th className="py-3.5 px-6">Laboran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvals.map((app) => {
                const b = app.booking;
                const isSelected = selectedId === app.id_peminjaman;
                const firstTool = b.tools[0];
                return (
                  <tr
                    key={app.id_persetujuan}
                    onClick={() => setSelectedId(app.id_peminjaman)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-teal-50/60 font-medium' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3.5 px-6">
                      <div className="font-mono font-bold text-teal-800">{app.kode_peminjaman}</div>
                      <div className="text-slate-600">{b.peminjam_nama}</div>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-800">
                      <div>{firstTool?.nama_alat || '—'}</div>
                      <div className="text-[10px] font-normal mt-0.5">
                        {app.has_alat_khusus ? (
                          <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Alat Khusus</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Alat Biasa</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-slate-700">
                      {firstTool?.jumlah_pinjam} unit
                    </td>
                    <td className="py-3.5 px-6 text-slate-600">
                      {firstTool?.tenggat ? new Date(firstTool.tenggat).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' · ' + new Date(firstTool.tenggat).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge status={app.status_dosen_pengampu || (app.has_alat_khusus ? 'Menunggu' : 'Tidak diperlukan')} />
                    </td>
                    <td className="py-3.5 px-6">
                      <Badge status={app.status_laboran || 'Menunggu'} />
                    </td>
                  </tr>
                );
              })}
              {approvals.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Tidak ada pengajuan yang memerlukan persetujuan saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Detail Decision Review Card */}
      {selectedDetail && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900 font-mono">
                  {selectedDetail.kode_peminjaman} · {selectedDetail.booking.peminjam_nama}
                </h2>
                <Badge status={selectedDetail.booking.status_peminjaman} />
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {selectedDetail.booking.peminjam_role} · {selectedDetail.booking.peminjam_nomor_identitas} · Diajukan {new Date(selectedDetail.booking.tanggal_pengajuan).toLocaleString('id-ID')}
              </div>
            </div>

            {/* Quick stats strip */}
            <div className="flex items-center space-x-6 text-xs text-slate-600 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">KEBUTUHAN</div>
                <div className="font-semibold text-slate-800">
                  {selectedDetail.booking.tools.map((t) => `${t.jumlah_pinjam} unit ${t.nama_alat}`).join(', ')}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">TUJUAN</div>
                <div className="font-semibold text-slate-800">{selectedDetail.booking.tujuan}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 uppercase">TENGGAT</div>
                <div className="font-semibold text-slate-800">
                  {selectedDetail.booking.tools[0]?.tenggat ? new Date(selectedDetail.booking.tools[0].tenggat).toLocaleString('id-ID') : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Two Decision Panels Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel 1: Dosen Pengampu */}
            <div className={`p-6 rounded-2xl border ${
              selectedDetail.has_alat_khusus && isDosenPengampu ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200 bg-slate-50/50'
            } space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Dosen Pengampu · Dr. Budi Santoso</h3>
                  <div className="text-[11px] text-slate-400">Persetujuan akademik alat khusus</div>
                </div>
                <Badge status={selectedDetail.status_dosen_pengampu || (selectedDetail.has_alat_khusus ? 'Menunggu' : 'Tidak diperlukan')} />
              </div>

              {!selectedDetail.has_alat_khusus ? (
                <div className="p-4 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  <div className="font-semibold text-slate-800">Alat Biasa (Bukan Alat Khusus)</div>
                  <p className="mt-1 text-slate-500">
                    Peminjaman ini hanya memuat peralatan biasa. Sesuai ketentuan, persetujuan Dosen Pengampu <strong>tidak diperlukan</strong> dan langsung disetujui oleh <strong>Kak Dina (Laboran)</strong>.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Catatan keputusan
                    </label>
                    <textarea
                      disabled={!isDosenPengampu || selectedDetail.status_dosen_pengampu !== 'Menunggu'}
                      value={dosenNote || selectedDetail.catatan_dosen_pengampu || ''}
                      onChange={(e) => setDosenNote(e.target.value)}
                      placeholder="Tulis hasil peninjauan pengajuan..."
                      rows={3}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                    />
                  </div>

                  {isDosenPengampu && selectedDetail.status_dosen_pengampu === 'Menunggu' && (
                    <div className="flex space-x-3 pt-2">
                      <button
                        disabled={loading}
                        onClick={() => handleDecision(selectedDetail.id_persetujuan_dosen || selectedDetail.id_persetujuan, 'Disetujui', dosenNote)}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition shadow-xs cursor-pointer"
                      >
                        Setujui · Pengampu
                      </button>
                      <button
                        disabled={loading}
                        onClick={() => handleDecision(selectedDetail.id_persetujuan_dosen || selectedDetail.id_persetujuan, 'Ditolak', dosenNote)}
                        className="py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium text-xs transition cursor-pointer"
                      >
                        Tolak · Pengampu
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Panel 2: Laboran */}
            <div className={`p-6 rounded-2xl border ${
              isLaboran ? 'border-teal-200 bg-teal-50/20' : 'border-slate-200 bg-slate-50/50'
            } space-y-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Laboran · Dina</h3>
                  <div className="text-[11px] text-slate-400">Verifikasi fisik & persetujuan operasional lab</div>
                </div>
                <Badge status={selectedDetail.status_laboran || 'Menunggu'} />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Catatan keputusan
                </label>
                <textarea
                  disabled={!isLaboran || selectedDetail.status_laboran !== 'Menunggu'}
                  value={laboranNote || selectedDetail.catatan_laboran || ''}
                  onChange={(e) => setLaboranNote(e.target.value)}
                  placeholder="Belum ada catatan Laboran..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-teal-600 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              {isLaboran && selectedDetail.status_laboran === 'Menunggu' && (
                <div className="flex space-x-3 pt-2">
                  <button
                    disabled={loading}
                    onClick={() => handleDecision(selectedDetail.id_persetujuan_laboran || selectedDetail.id_persetujuan, 'Disetujui', laboranNote)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-xs transition shadow-xs cursor-pointer"
                  >
                    Setujui · Laboran
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleDecision(selectedDetail.id_persetujuan_laboran || selectedDetail.id_persetujuan, 'Ditolak', laboranNote)}
                    className="py-2.5 px-4 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-medium text-xs transition cursor-pointer"
                  >
                    Tolak · Laboran
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info Banner */}
          <div className="p-4 rounded-xl bg-teal-50/70 border border-teal-200/80 text-teal-900 text-xs flex items-center justify-between">
            <span>
              Anda saat ini masuk sebagai <strong>{user?.nama} ({user?.role})</strong>. Pihak penyetuju lain memberikan keputusan melalui otorisasi perannya masing-masing.
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Status akhir dan alokasi unit ditentukan sistem setelah kedua persetujuan terpenuhi. Unit belum dialokasikan jika belum disetujui penuh.
          </div>
        </div>
      )}
    </div>
  );
}
