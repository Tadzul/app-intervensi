import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { TAHAP1_SUBJECTS, TAHAP2_SUBJECTS } from '../types';
import { Award, Filter, ArrowUp, ArrowDown, Search } from 'lucide-react';

export default function TopStudents() {
  const { studentsPBD } = useDataStore();

  const [pbdType, setPbdType] = useState<'PBD Pertengahan' | 'PBD Akhir'>('PBD Pertengahan');
  const [tahun, setTahun] = useState<string>('1');
  const [kelas, setKelas] = useState<string>('Bitara');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const isTahap1 = ['1', '2', '3'].includes(tahun);
  const subjectList = isTahap1 ? TAHAP1_SUBJECTS : TAHAP2_SUBJECTS;

  const targetClassName = `${tahun} ${kelas}`;

  const filteredData = useMemo(() => {
    let data = studentsPBD.filter(
      (student) =>
        student.pbdType === pbdType &&
        student.kelas === targetClassName
    );

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      data = data.filter((student) => student.nama.toLowerCase().includes(lowerQuery));
    }

    // Calculate total/average TP for sorting
    const dataWithStats = data.map(student => {
      const subjects = student.mataPelajaran || {};
      let totalTP = 0;
      let count = 0;
      subjectList.forEach(sub => {
        if (subjects[sub] > 0) {
          totalTP += subjects[sub];
          count++;
        }
      });
      const averageTP = count > 0 ? totalTP / count : 0;
      return { ...student, averageTP, totalTP };
    });

    // Sort by average TP
    dataWithStats.sort((a, b) => {
      if (sortOrder === 'desc') {
        return b.averageTP - a.averageTP;
      }
      return a.averageTP - b.averageTP;
    });

    return dataWithStats;
  }, [studentsPBD, pbdType, targetClassName, subjectList, sortOrder, searchQuery]);

  const getTPColor = (tp: number) => {
    if (tp === 0) return "bg-slate-100 text-slate-400";
    if (tp <= 2) return "bg-red-100 text-red-700 font-bold";
    if (tp <= 4) return "bg-amber-100 text-amber-700 font-bold";
    return "bg-green-100 text-green-700 font-bold";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gold-500" />
          Filter Murid Pilihan
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Sesi PBD</label>
            <select
              value={pbdType}
              onChange={(e) => setPbdType(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none"
            >
              <option value="PBD Pertengahan">PBD Pertengahan</option>
              <option value="PBD Akhir">PBD Akhir</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Tahun</label>
            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none"
            >
              {[1, 2, 3, 4, 5, 6].map(y => (
                <option key={y} value={String(y)}>Tahun {y}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Kelas</label>
            <select
              value={kelas}
              onChange={(e) => setKelas(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none"
            >
              {['Bitara', 'Dinamik', 'Intelek', 'Pintar', 'Mahir'].map(k => (
                // Hanya Tahun 6 ada Mahir mengikut sistem (Tahun 6 Mahir)
                (k !== 'Mahir' || tahun === '6') && (
                  <option key={k} value={k}>{k}</option>
                )
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
              <Award className="w-5 h-5 text-gold-500" />
              Senarai Murid Pilihan
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {targetClassName} • {pbdType}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama murid..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              />
            </div>
            <button
              onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center"
            >
              {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
              <span className="text-sm font-medium">Purata TP</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-12 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">No.</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[200px] sticky left-[48px] bg-slate-50 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Nama Murid</th>
                <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Purata TP</th>
                {subjectList.map(sub => (
                  <th key={sub} className="px-2 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">
                    <div className="w-16 mx-auto truncate" title={sub}>
                      {sub.substring(0, 3)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-slate-400 sticky left-0 bg-white z-10 border-r border-slate-100">{idx + 1}</td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-700 sticky left-[48px] bg-white z-10 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                      <div className="truncate max-w-[250px]" title={student.nama}>
                        {student.nama}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="text-sm font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
                        {student.averageTP.toFixed(2)}
                      </span>
                    </td>
                    {subjectList.map(sub => {
                      const tp = student.mataPelajaran?.[sub] || 0;
                      return (
                        <td key={sub} className="px-2 py-4 text-center">
                          {tp > 0 ? (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs shadow-sm ${getTPColor(tp)}`} title={`${sub}: TP ${tp}`}>
                              {tp}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={subjectList.length + 3} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-sm">Tiada data murid dijumpai untuk filter yang dipilih.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
