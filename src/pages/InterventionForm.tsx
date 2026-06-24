import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { PUNCA_OPTIONS, PELAN_OPTIONS, Intervention } from '../types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function InterventionForm() {
  const { teachers, subjects, interventions, studentsPBD = [], addIntervention, pbdControl = { pbd1Open: true, pbd2Open: true } } = useDataStore();
  const [successMsg, setSuccessMsg] = useState(false);

  // Form State
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [filterPbdType, setFilterPbdType] = useState<'PBD Pertengahan' | 'PBD Akhir' | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const [tp1, setTp1] = useState(0);
  const [tp2, setTp2] = useState(0);
  const [tp3, setTp3] = useState(0);
  const [tp4, setTp4] = useState(0);
  const [tp5, setTp5] = useState(0);
  const [tp6, setTp6] = useState(0);

  const [tajuk, setTajuk] = useState('');
  const [punca, setPunca] = useState<string[]>([]);
  const [puncaLain, setPuncaLain] = useState('');
  const [isu, setIsu] = useState('');
  const [pelan, setPelan] = useState('');
  const [pelanLain, setPelanLain] = useState('');
  const [catatan, setCatatan] = useState('');

  const teacherSubjects = subjects.filter(s => {
    if (String(s.teacherId) !== String(selectedTeacherId)) return false;
    
    if (s.pbdType === 'PBD Pertengahan' && !pbdControl.pbd1Open) return false;
    if (s.pbdType === 'PBD Akhir' && !pbdControl.pbd2Open) return false;
    
    if (filterPbdType && s.pbdType !== filterPbdType) return false;

    const hasIntervention = interventions.some(inv => 
      String(inv.teacherId) === String(s.teacherId) && 
      inv.kelas === s.kelas && 
      inv.mataPelajaran === s.mataPelajaran &&
      inv.pbdType === s.pbdType
    );
    return !hasIntervention;
  });

  const selectedSubject = teacherSubjects.find(s => String(s.id) === String(selectedSubjectId));

  // Auto populate TP when subject selected
  React.useEffect(() => {
    if (selectedSubject) {
      const classStudents = studentsPBD.filter(s => s.kelas === selectedSubject.kelas);
      
      if (classStudents.length > 0) {
        const targetStudents = classStudents.filter(s => s.pbdType === selectedSubject.pbdType);

        const subjName = selectedSubject.mataPelajaran;
        let cTp1 = 0, cTp2 = 0, cTp3 = 0, cTp4 = 0, cTp5 = 0, cTp6 = 0;

        targetStudents.forEach(stu => {
          const tpScore = stu.mataPelajaran[subjName];
          if (tpScore === 1) cTp1++;
          else if (tpScore === 2) cTp2++;
          else if (tpScore === 3) cTp3++;
          else if (tpScore === 4) cTp4++;
          else if (tpScore === 5) cTp5++;
          else if (tpScore === 6) cTp6++;
        });

        setTp1(cTp1);
        setTp2(cTp2);
        setTp3(cTp3);
        setTp4(cTp4);
        setTp5(cTp5);
        setTp6(cTp6);
      }
    }
  }, [selectedSubject, studentsPBD]);

  const totalMurid = tp1 + tp2 + tp3 + tp4 + tp5 + tp6;
  const tidakMenguasai = tp1 + tp2;
  const menguasai = tp3 + tp4 + tp5 + tp6;
  const peratusTidakMenguasai = totalMurid > 0 ? ((tidakMenguasai / totalMurid) * 100).toFixed(1) : '0.0';
  const peratusMenguasai = totalMurid > 0 ? ((menguasai / totalMurid) * 100).toFixed(1) : '0.0';
  
  const avgTP = totalMurid > 0 
    ? ((1*tp1 + 2*tp2 + 3*tp3 + 4*tp4 + 5*tp5 + 6*tp6) / totalMurid).toFixed(2)
    : '0.00';

  const handlePuncaChange = (option: string) => {
    setPunca(prev => 
      prev.includes(option) ? prev.filter(p => p !== option) : [...prev, option]
    );
  };

  const handleReset = () => {
    setSelectedTeacherId('');
    setFilterPbdType('');
    setSelectedSubjectId('');
    setTp1(0); setTp2(0); setTp3(0); setTp4(0); setTp5(0); setTp6(0);
    setTajuk(''); setPunca([]); setPuncaLain(''); setIsu(''); setPelan(''); setPelanLain(''); setCatatan('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId || !selectedSubjectId) return;

    const newIntervention: Intervention = {
      id: Date.now().toString(),
      date,
      teacherId: selectedTeacherId,
      tahap: selectedSubject!.tahap,
      kelas: selectedSubject!.kelas,
      mataPelajaran: selectedSubject!.mataPelajaran,
      pbdType: selectedSubject!.pbdType,
      tp1, tp2, tp3, tp4, tp5, tp6,
      tajukBelumDikuasai: tajuk,
      punca, puncaLain,
      isu,
      pelanIntervensi: pelan,
      pelanIntervensiLain: pelanLain,
      catatan
    };

    addIntervention(newIntervention);
    setSuccessMsg(true);
    setTimeout(() => {
      setSuccessMsg(false);
      handleReset();
    }, 2000);
  };

  if (!pbdControl.pbd1Open && !pbdControl.pbd2Open) {
    return (
      <div className="max-w-4xl mx-auto pb-12 relative">
        <div className="bg-red-50 text-red-600 p-10 rounded-2xl shadow-sm border border-red-100 flex flex-col items-center text-center mt-12 w-full animate-in fade-in slide-in-from-bottom-4">
          <AlertCircle className="w-16 h-16 mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Sistem Ditutup</h2>
          <p className="text-red-700 font-medium">Borang pengisian data Intervensi PBD telah ditutup oleh pihak pentadbir pada masa ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12 relative">
      {successMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-lg shadow-lg border border-emerald-200 flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-medium">Rekod berjaya disimpan.</p>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Borang Intervensi</h2>
        <p className="text-slate-500">Isi maklumat pencapaian kelas dan rancangan intervensi anda.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* L1: Guru & Subjek */}
        <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-5 transition-all hover:shadow-md">
          <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">Langkah 1: Maklumat Kelas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Nama Guru</label>
              <select 
                required
                value={selectedTeacherId}
                onChange={e => {
                  setSelectedTeacherId(e.target.value);
                  setSelectedSubjectId('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
              >
                <option value="">-- Pilih Guru --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Tarikh</label>
              <input 
                type="date" 
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Sesi PBD</label>
              <select 
                value={filterPbdType}
                onChange={e => {
                  setFilterPbdType(e.target.value as any);
                  setSelectedSubjectId('');
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
              >
                <option value="">-- Semua Sesi --</option>
                {pbdControl.pbd1Open && <option value="PBD Pertengahan">PBD Pertengahan</option>}
                {pbdControl.pbd2Open && <option value="PBD Akhir">PBD Akhir</option>}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Kelas & Mata Pelajaran Di ajar</label>
              <select 
                required
                disabled={!selectedTeacherId || (selectedTeacherId && teacherSubjects.length === 0)}
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">
                  {selectedTeacherId 
                    ? (teacherSubjects.length > 0 ? '-- Pilih Kelas --' : '-- Tiada kelas / Sesi PBD ditutup --') 
                    : '-- Pilih Guru Dahulu --'}
                </option>
                {teacherSubjects.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.kelas} - {s.mataPelajaran} ({s.pbdType === 'PBD Pertengahan' ? 'PBD Pertengahan' : 'PBD Akhir'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {selectedSubjectId && (
          <>
            {/* L2: Analisis TP */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-6">Analisis Pencapaian TP</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 text-center">
                {[
                  { lbl: 'TP 1', val: tp1, set: setTp1, color: 'text-red-700 bg-red-50/50 border-red-200 hover:bg-red-50 hover:shadow-sm' },
                  { lbl: 'TP 2', val: tp2, set: setTp2, color: 'text-orange-700 bg-orange-50/50 border-orange-200 hover:bg-orange-50 hover:shadow-sm' },
                  { lbl: 'TP 3', val: tp3, set: setTp3, color: 'text-amber-700 bg-amber-50/50 border-amber-200 hover:bg-amber-50 hover:shadow-sm' },
                  { lbl: 'TP 4', val: tp4, set: setTp4, color: 'text-green-700 bg-green-50/50 border-green-200 hover:bg-green-50 hover:shadow-sm' },
                  { lbl: 'TP 5', val: tp5, set: setTp5, color: 'text-emerald-700 bg-emerald-50/50 border-emerald-200 hover:bg-emerald-50 hover:shadow-sm' },
                  { lbl: 'TP 6', val: tp6, set: setTp6, color: 'text-blue-700 bg-blue-50/50 border-blue-200 hover:bg-blue-50 hover:shadow-sm' },
                ].map(tp => (
                  <div key={tp.lbl} className={`border rounded-xl p-4 transition-all duration-300 ${tp.color}`}>
                    <label className="block text-sm font-bold mb-3">{tp.lbl}</label>
                    <input 
                      type="number" 
                      min="0"
                      value={tp.val}
                      onChange={e => tp.set(parseInt(e.target.value) || 0)}
                      className="w-full text-center px-3 py-2 border border-white/60 rounded-lg bg-white/80 font-bold focus:outline-none focus:ring-2 focus:ring-gold-500 shadow-inner"
                    />
                  </div>
                ))}
              </div>

              {/* Auto calc stats */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl flex flex-wrap gap-6 justify-around border border-slate-200 items-center shadow-inner">
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Jumlah</p>
                  <p className="text-3xl font-bold text-slate-900">{totalMurid}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Menguasai</p>
                  <p className="text-3xl font-bold text-emerald-600">{peratusMenguasai}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Belum</p>
                  <p className="text-3xl font-bold text-red-600">{peratusTidakMenguasai}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Purata TP</p>
                  <p className="text-3xl font-bold text-slate-900">{avgTP}</p>
                </div>
              </div>
            </section>

            {/* L3: Kualitatif */}
            <section className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6 transition-all hover:shadow-md">
              <h3 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-3 mb-5">Analisis Kualitatif & Pelan</h3>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Tajuk Yang Belum Dikuasai</label>
                <textarea 
                  required
                  rows={2}
                  value={tajuk}
                  onChange={e => setTajuk(e.target.value)}
                  placeholder="Contoh: Operasi Darab, Penjodoh Bilangan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold text-slate-700">Punca Utama (Boleh pilih lebih dari satu)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PUNCA_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-3 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={punca.includes(opt)}
                        onChange={() => handlePuncaChange(opt)}
                        className="rounded text-gold-500 w-5 h-5 focus:ring-gold-500 border-slate-300"
                      />
                      <span className="font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
                <input 
                  type="text" 
                  value={puncaLain}
                  onChange={e => setPuncaLain(e.target.value)}
                  placeholder="Punca lain (Sila nyatakan jika ada)..."
                  className="w-full mt-3 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Isu</label>
                <textarea 
                  required
                  rows={3}
                  value={isu}
                  onChange={e => setIsu(e.target.value)}
                  placeholder="Huraikan isu dengan lebih terperinci..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Pelan Intervensi</label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {PELAN_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPelan(prev => prev ? `${prev}\n- ${opt}` : `- ${opt}`)}
                      className="px-4 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded-full hover:bg-slate-200 hover:border-slate-300 transition-all active:scale-95"
                    >
                      + {opt}
                    </button>
                  ))}
                </div>
                <textarea 
                  required
                  rows={3}
                  value={pelan}
                  onChange={e => setPelan(e.target.value)}
                  placeholder="Sila taip pelan intervensi yang akan dijalankan..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                ></textarea>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Catatan Tambahan (Pilihan)</label>
                <textarea 
                  rows={2}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
                ></textarea>
              </div>
            </section>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-slate-200">
              <button 
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white font-bold rounded-xl hover:shadow-lg transform transition-all hover:-translate-y-0.5 focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
              >
                Simpan Borang Intervensi
              </button>
              <button 
                type="button"
                onClick={handleReset}
                className="px-8 py-3 bg-white text-slate-700 font-bold border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
              >
                Reset Semula
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
