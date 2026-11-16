import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import Badge from '../components/Badge';
import { Search, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react';

export default function ReturnsPage() {
  const [activeLoans, setActiveLoans] = useState([]);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Selected unit states: { [id_alokasi]: { selected: boolean, kondisi: string, catatan: string } }
  const [unitStates, setUnitStates] = useState({});
  const [generalNote, setGeneralNote] = useState('Penerimaan unit kembali');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState(null);

  const loadLoans = async () => {
    try {
      const data = await api.get('/api/returns/active-loans');
      setActiveLoans(data);
      if (data.length > 0 && !selectedLoan) {
        selectLoan(data[0]);
      } else if (data.length > 0 && selectedLoan) {
        const found = data.find((d) => d.id_peminjaman === selectedLoan.id_peminjaman);
        if (found) selectLoan(found);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  const selectLoan = (loan) => {
    setSelectedLoan(loan);
    const initial = {};
    loan.allocated_items?.forEach((item) => {
      initial[item.id_alokasi] = {
        selected: false,
        kondisi: 'Baik',
        catatan: '',
      };
    });
    setUnitStates(initial);
  };

  const handleToggleSelect = (id_alokasi) => {
    setUnitStates((prev) => ({
      ...prev,
      [id_alokasi]: {
        ...prev[id_alokasi],
        selected: !prev[id_alokasi]?.selected,
      },
    }));
  };

  const handleKondisiChange = (id_alokasi, kondisi) => {
    setUnitStates((prev) => ({
      ...prev,
      [id_alokasi]: {
        ...prev[id_alokasi],
        kondisi,
      },
    }));
  };

  const handleNoteChange = (id_alokasi, note) => {
    setUnitStates((prev) => ({
      ...prev,
      [id_alokasi]: {
        ...prev[id_alokasi],
        catatan: note,
      },
    }));
  };

  const selectedCount = Object.values(unitStates).filter((s) => s.selected).length;
  const alreadyReturned = selectedLoan?.returned_count || 0;
  const totalAllocated = selectedLoan?.total_allocated || 0;
  const willBeReturned = alreadyReturned + selectedCount;
  const willRemain = totalAllocated - willBeReturned;

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (selectedCount === 0) {
      alert('Pilih setidaknya satu unit alat yang diterima.');
      return;
    }

    setLoading(true);
    setResultMsg(null);

    try {
      const items = [];
      Object.entries(unitStates).forEach(([id_alokasi, state]) => {
        if (state.selected) {
          items.push({
            id_alokasi: Number(id_alokasi),
            kondisi_kembali: state.kondisi,
            catatan: state.catatan || generalNote,
          });
        }
      });

      const res = await api.post('/api/returns', {
        id_peminjaman: selectedLoan.id_peminjaman,
        catatan: generalNote,
        items,
      });

      setResultMsg({ type: 'success', text: res.message });
      await loadLoans();
    } catch (err) {
      setResultMsg({ type: 'error', text: err.message || 'Gagal memproses pengembalian.' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusAfterSave = (kondisi) => {
    if (kondisi === 'Baik') return 'Tersedia';
    if (kondisi === 'Rusak ringan') return 'Pemeliharaan';
    if (kondisi === 'Rusak berat') return 'Rusak';
    if (kondisi === 'Hilang') return 'Hilang';
    return 'Tersedia';
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="text-xs font-semibold tracking-wider text-teal-700 uppercase">
          UC-07 / LABORAN / PENGEMBALIAN BERTAHAP
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Pengembalian bertahap</h1>
        <p className="text-sm text-slate-500 mt-1">
          Catat unit yang benar-benar diterima, tanpa menutup unit lainnya. Status unit fisik diperbarui secara otomatis.
        </p>
      </div>

      {resultMsg && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 border ${
          resultMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {resultMsg.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
          <span className="font-semibold">{resultMsg.text}</span>
        </div>
      )}

      {/* Search / Select Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Cari transaksi atau peminjam
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Misal: PMJ-0138 / Nadia Putri"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-end pt-5">
          <div className="flex gap-2">
            {activeLoans.map((loan) => (
              <button
                key={loan.id_peminjaman}
                onClick={() => selectLoan(loan)}
                className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  selectedLoan?.id_peminjaman === loan.id_peminjaman
                    ? 'bg-[#006d64] text-white border-transparent'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {loan.kode_peminjaman} · {loan.peminjam_nama}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedLoan && (
        <>
          {/* 3 Stat Counter Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">TOTAL DIPINJAM</div>
              <div className="text-3xl font-extrabold text-slate-900 mt-2">{selectedLoan.total_allocated} unit</div>
              <div className="text-xs text-slate-500 mt-1">Alokasi seluruh unit peminjaman ini</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">SUDAH KEMBALI</div>
              <div className="text-3xl font-extrabold text-emerald-700 mt-2">{selectedLoan.returned_count} unit</div>
              <div className="text-xs text-slate-500 mt-1">Diterima dalam pencatatan sebelumnya</div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">MASIH DIPINJAM</div>
              <div className="text-3xl font-extrabold text-amber-700 mt-2">{selectedLoan.remaining_count} unit</div>
              <div className="text-xs text-slate-500 mt-1">Sebelum pencatatan sesi ini</div>
            </div>
          </div>

          {/* Active Unit Return Table */}
          <form onSubmit={handleSubmitReturn} className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 font-mono">
                {selectedLoan.kode_peminjaman} · {selectedLoan.peminjam_nama}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Tenggat: {selectedLoan.allocated_items?.[0]?.tenggat ? new Date(selectedLoan.allocated_items[0].tenggat).toLocaleString('id-ID') : '—'} · Pilih hanya unit yang diterima secara fisik.
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-5 w-12 text-center">Pilih</th>
                    <th className="py-3 px-5">Kode inventaris</th>
                    <th className="py-3 px-5">Jenis alat</th>
                    <th className="py-3 px-5">Status saat ini</th>
                    <th className="py-3 px-5">Kondisi diterima</th>
                    <th className="py-3 px-5">Status setelah simpan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLoan.allocated_items?.map((item) => {
                    const isAlreadyReturned = item.status_saat_ini === 'Kembali';
                    const uState = unitStates[item.id_alokasi] || { selected: false, kondisi: 'Baik' };
                    return (
                      <tr key={item.id_alokasi} className={isAlreadyReturned ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/70'}>
                        <td className="py-3.5 px-5 text-center">
                          {isAlreadyReturned ? (
                            <span className="text-slate-400 font-bold">—</span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={uState.selected}
                              onChange={() => handleToggleSelect(item.id_alokasi)}
                              className="w-4 h-4 text-teal-700 rounded border-slate-300 focus:ring-teal-600 cursor-pointer"
                            />
                          )}
                        </td>
                        <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                          {item.kode_inventaris}
                        </td>
                        <td className="py-3.5 px-5 text-slate-700">{item.nama_alat}</td>
                        <td className="py-3.5 px-5">
                          <Badge status={item.status_saat_ini} text={item.status_saat_ini} />
                        </td>
                        <td className="py-3.5 px-5">
                          {isAlreadyReturned ? (
                            <span className="text-slate-500">Baik (Sudah kembali)</span>
                          ) : (
                            <select
                              disabled={!uState.selected}
                              value={uState.kondisi}
                              onChange={(e) => handleKondisiChange(item.id_alokasi, e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:ring-1 focus:ring-teal-600 disabled:bg-slate-100 disabled:text-slate-400"
                            >
                              <option value="Baik">Baik</option>
                              <option value="Rusak ringan">Rusak ringan</option>
                              <option value="Rusak berat">Rusak berat</option>
                              <option value="Hilang">Hilang</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3.5 px-5">
                          {isAlreadyReturned ? (
                            <span className="text-slate-400">Tersedia</span>
                          ) : uState.selected ? (
                            <Badge status={getStatusAfterSave(uState.kondisi)} text={getStatusAfterSave(uState.kondisi)} />
                          ) : (
                            <span className="text-slate-400 text-xs">Tetap Dipinjam</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Dynamic Counter Banner */}
            <div className="p-4 bg-teal-50/70 border-t border-b border-teal-100 text-xs text-teal-900 font-medium">
              {selectedCount} unit dipilih · Setelah disimpan: <strong>{willBeReturned} unit sudah kembali</strong>, <strong>{willRemain} unit masih dipinjam</strong>. {willRemain > 0 ? 'Transaksi belum selesai.' : 'Seluruh unit kembali, transaksi akan selesai otomatis.'}
            </div>

            {/* Bottom Form Inputs */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  Catatan penerimaan
                </label>
                <input
                  type="text"
                  value={generalNote}
                  onChange={(e) => setGeneralNote(e.target.value)}
                  placeholder="Misal: OSC-003: layar berkedip. Perlu diperiksa teknisi."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  disabled={loading || selectedCount === 0}
                  className="py-2.5 px-6 rounded-xl bg-[#006d64] hover:bg-[#005851] text-white font-medium text-sm transition shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan pengembalian'}
                </button>

                <div className="text-[11px] text-slate-500">
                  Transisi otomatis: <span className="text-emerald-700 font-medium">Baik → Tersedia</span> · <span className="text-amber-700 font-medium">Rusak ringan → Pemeliharaan</span> · <span className="text-rose-700 font-medium">Rusak berat → Rusak</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                Unit yang tidak dipilih tetap berstatus Dipinjam. Catatan penerimaan sebelumnya tidak ditimpa.
              </div>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
