import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { TAHAP1_CLASSES, TAHAP2_CLASSES, TAHAP1_SUBJECTS, TAHAP2_SUBJECTS } from '../types';

export default function SubjectAnalysis() {
  const { studentsPBD = [] } = useDataStore();
  
  const [filterTahap, setFilterTahap] = useState('Semua');
  const [filterTahun, setFilterTahun] = useState('Semua');
  const [filterKelas, setFilterKelas] = useState('Semua');
  const [filterPbd, setFilterPbd] = useState('PBD2');

  // Derive available filters based on selections
  const availableClasses = useMemo(() => {
    let classes = [...TAHAP1_CLASSES, ...TAHAP2_CLASSES];
    if (filterTahap === 'Tahap 1') classes = TAHAP1_CLASSES;
    if (filterTahap === 'Tahap 2') classes = TAHAP2_CLASSES;
    
    if (filterTahun !== 'Semua') {
      classes = classes.filter(c => c.startsWith(filterTahun));
    }
    return classes;
  }, [filterTahap, filterTahun]);

  const subjectsData = useMemo(() => {
    // Determine which subjects to show
    let subjectsToShow = [...new Set([...TAHAP1_SUBJECTS, ...TAHAP2_SUBJECTS])];
    if (filterTahap === 'Tahap 1') subjectsToShow = TAHAP1_SUBJECTS;
    if (filterTahap === 'Tahap 2') subjectsToShow = TAHAP2_SUBJECTS;

    // Filter students
    const filteredStudents = studentsPBD.filter(s => {
      if (s.pbdType !== filterPbd) return false;
      if (filterTahap !== 'Semua' && s.tahap !== filterTahap) return false;
      if (filterTahun !== 'Semua' && !s.kelas.startsWith(filterTahun)) return false;
      if (filterKelas !== 'Semua' && s.kelas !== filterKelas) return false;
      return true;
    });

    // Aggregate data
    const data = subjectsToShow.map(sub => {
      let tp1 = 0, tp2 = 0, tp3 = 0, tp4 = 0, tp5 = 0, tp6 = 0;
      let bilDitaksir = 0;
      
      filteredStudents.forEach(stu => {
        const val = stu.mataPelajaran?.[sub];
        if (val !== undefined) {
          bilDitaksir++;
          if (val === 1) tp1++;
          if (val === 2) tp2++;
          if (val === 3) tp3++;
          if (val === 4) tp4++;
          if (val === 5) tp5++;
          if (val === 6) tp6++;
        }
      });

      const tp12 = tp1 + tp2;
      const tp36 = tp3 + tp4 + tp5 + tp6;
      const total = tp12 + tp36;
      const pct12 = total > 0 ? ((tp12 / total) * 100).toFixed(1) : '0.0';
      const pct36 = total > 0 ? ((tp36 / total) * 100).toFixed(1) : '0.0';

      // Total students in the filtered scope who SHOULD be assessed for this subject?
      // For simplicity, we assume bilTidakDitaksir is 0 unless we know the total enrollment.
      // If we use the max students who took ANY subject in this filtered scope as the total cohort:
      const totalCohort = filteredStudents.length;
      const bilTidakDitaksir = Math.max(0, totalCohort - bilDitaksir);

      return {
        subject: sub,
        tp1, tp2, tp3, tp4, tp5, tp6,
        tp12, pct12,
        tp36, pct36,
        bilDitaksir,
        bilTidakDitaksir
      };
    });

    return data.sort((a,b) => a.subject.localeCompare(b.subject));
  }, [studentsPBD, filterPbd, filterTahap, filterTahun, filterKelas]);

  // Download CSV
  const exportCSV = () => {
    let csv = "MATA PELAJARAN,1,2,TP 1+2,% TP 1+2,3,4,5,6,TP 3-6,% TP 3-6,BIL DITAKSIR,BIL TIDAK DITAKSIR\n";
    subjectsData.forEach(row => {
      csv += `${row.subject},${row.tp1},${row.tp2},${row.tp12},${row.pct12}%,${row.tp3},${row.tp4},${row.tp5},${row.tp6},${row.tp36},${row.pct36}%,${row.bilDitaksir},${row.bilTidakDitaksir}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analisis_MP_${filterPbd}_${filterTahap}_${filterTahun}_${filterKelas}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Analisis Mata Pelajaran</h2>
          <p className="text-slate-500">Analisis terperinci mengikut Tahap Penguasaan (TP) setiap mata pelajaran.</p>
        </div>
        <button 
          onClick={exportCSV}
          className="px-4 py-2 bg-emerald-50 text-emerald-600 font-bold rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          Muat Turun CSV
        </button>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border border-slate-200 rounded-xl p-4 bg-slate-50 mb-8 shadow-sm">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilihan PBD</label>
            <select 
              value={filterPbd}
              onChange={e => setFilterPbd(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
            >
              <option value="PBD1">PBD Pertengahan</option>
              <option value="PBD2">PBD Akhir</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tahap</label>
            <select 
              value={filterTahap}
              onChange={e => { setFilterTahap(e.target.value); setFilterKelas('Semua'); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
            >
              <option value="Semua">Semua Tahap</option>
              <option value="Tahap 1">Tahap 1</option>
              <option value="Tahap 2">Tahap 2</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tahun/Tingkatan</label>
            <select 
              value={filterTahun}
              onChange={e => { setFilterTahun(e.target.value); setFilterKelas('Semua'); }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
            >
              <option value="Semua">Semua Tahun</option>
              {filterTahap !== 'Tahap 2' && <option value="1">1</option>}
              {filterTahap !== 'Tahap 2' && <option value="2">2</option>}
              {filterTahap !== 'Tahap 2' && <option value="3">3</option>}
              {filterTahap !== 'Tahap 1' && <option value="4">4</option>}
              {filterTahap !== 'Tahap 1' && <option value="5">5</option>}
              {filterTahap !== 'Tahap 1' && <option value="6">6</option>}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Kelas</label>
            <select 
              value={filterKelas}
              onChange={e => setFilterKelas(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-gold-500 transition-all font-medium text-slate-800"
            >
              <option value="Semua">Semua Kelas</option>
              {availableClasses.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm text-center border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase text-slate-600 font-bold select-none text-xs tracking-wider">
                <th className="py-4 px-4 text-left border-r border-slate-200 min-w-[200px]">Mata Pelajaran</th>
                <th className="py-4 px-2 w-12">1</th>
                <th className="py-4 px-2 w-12">2</th>
                <th className="py-4 px-4 bg-red-50 text-red-700">TP 1+2</th>
                <th className="py-4 px-4 bg-red-50 text-red-700 border-r border-red-100">% TP 1+2</th>
                <th className="py-4 px-2 w-12">3</th>
                <th className="py-4 px-2 w-12">4</th>
                <th className="py-4 px-2 w-12">5</th>
                <th className="py-4 px-2 w-12">6</th>
                <th className="py-4 px-4 bg-emerald-50 text-emerald-700">TP 3-6</th>
                <th className="py-4 px-4 bg-emerald-50 text-emerald-700 border-r border-emerald-100">% TP 3-6</th>
                <th className="py-4 px-4 text-blue-700">Bil Ditaksir</th>
                <th className="py-4 px-4 bg-slate-900 text-slate-100">Bil Tidak Ditaksir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjectsData.map((row, idx) => (
                <tr key={row.subject} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-left border-r border-slate-100 font-medium text-slate-800">{row.subject.toUpperCase()}</td>
                  <td className={`py-3 px-2 ${row.tp1 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp1}</td>
                  <td className={`py-3 px-2 ${row.tp2 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp2}</td>
                  <td className="py-3 px-4 bg-red-50/50 font-bold text-red-600">{row.tp12}</td>
                  <td className="py-3 px-4 bg-red-50/50 font-bold text-red-600 border-r border-red-50">{row.pct12}%</td>
                  <td className={`py-3 px-2 ${row.tp3 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp3}</td>
                  <td className={`py-3 px-2 ${row.tp4 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp4}</td>
                  <td className={`py-3 px-2 ${row.tp5 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp5}</td>
                  <td className={`py-3 px-2 ${row.tp6 === 0 ? 'text-slate-300' : 'font-bold text-slate-700'}`}>{row.tp6}</td>
                  <td className="py-3 px-4 bg-emerald-50/50 font-bold text-emerald-600">{row.tp36}</td>
                  <td className="py-3 px-4 bg-emerald-50/50 font-bold text-emerald-600 border-r border-emerald-50">{row.pct36}%</td>
                  <td className="py-3 px-4 text-blue-600 font-medium tracking-wide">{row.bilDitaksir}</td>
                  <td className="py-3 px-4 bg-slate-800 text-slate-200 font-bold border-l border-slate-700">{row.bilTidakDitaksir}</td>
                </tr>
              ))}
              {subjectsData.length === 0 && (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-500 italic">Tiada rekod PBD dijumpai untuk saringan ini.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

