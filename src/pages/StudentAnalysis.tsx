import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { TAHAP1_SUBJECTS, TAHAP2_SUBJECTS, getSubjectTP } from '../types';
import { User, Filter, ArrowUp, ArrowDown, Search } from 'lucide-react';

export default function StudentAnalysis() {
  const { studentsPBD } = useDataStore();

  const [pbdType, setPbdType] = useState<'PBD Pertengahan' | 'PBD Akhir'>('PBD Pertengahan');
  const [tahun, setTahun] = useState<string>('1');
  const [kelas, setKelas] = useState<string>('Bitara');
  const [mataPelajaran, setMataPelajaran] = useState<string>('Bahasa Melayu');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');

  const isTahap1 = ['1', '2', '3'].includes(tahun);
  const subjectList = isTahap1 ? TAHAP1_SUBJECTS : TAHAP2_SUBJECTS;

  // Make sure selected subject is valid for the selected year
  React.useEffect(() => {
    if (!subjectList.includes(mataPelajaran)) {
      setMataPelajaran(subjectList[0]);
    }
  }, [tahun, subjectList, mataPelajaran]);

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

    // Sort by TP for the selected subject
    data.sort((a, b) => {
      const tpA = getSubjectTP(a.mataPelajaran, mataPelajaran) || 0;
      const tpB = getSubjectTP(b.mataPelajaran, mataPelajaran) || 0;
      
      if (sortOrder === 'desc') {
        return tpB - tpA;
      }
      return tpA - tpB;
    });

    return data;
  }, [studentsPBD, pbdType, targetClassName, mataPelajaran, sortOrder, searchQuery]);

  // Statistics
  const highestTP = useMemo(() => {
    if (filteredData.length === 0) return 0;
    return Math.max(...filteredData.map(s => getSubjectTP(s.mataPelajaran, mataPelajaran) || 0));
  }, [filteredData, mataPelajaran]);

  const lowestTP = useMemo(() => {
    if (filteredData.length === 0) return 0;
    const validTPs = filteredData.map(s => getSubjectTP(s.mataPelajaran, mataPelajaran) || 0).filter(tp => tp > 0);
    if (validTPs.length === 0) return 0;
    return Math.min(...validTPs);
  }, [filteredData, mataPelajaran]);

  const getTPColor = (tp: number) => {
    if (tp === 0) return "bg-slate-100 text-slate-500";
    if (tp <= 2) return "bg-red-100 text-red-700 font-bold";
    if (tp <= 4) return "bg-amber-100 text-amber-700 font-bold";
    return "bg-green-100 text-green-700 font-bold";
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2 mb-6">
          <Filter className="w-5 h-5 text-gold-500" />
          Filter Analisis Murid
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Mata Pelajaran</label>
            <select
              value={mataPelajaran}
              onChange={(e) => setMataPelajaran(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none"
            >
              {subjectList.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-blue-950 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-500" />
              Senarai Pencapaian TP Murid
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {targetClassName} • {mataPelajaran} • {pbdType}
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
              <span className="text-sm font-medium">Susunan TP</span>
            </button>
          </div>
        </div>

        {/* Statistics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200">
          <div className="bg-white p-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jumlah Murid</p>
            <p className="text-2xl font-black text-blue-950 mt-1">{filteredData.length}</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TP Tertinggi</p>
            <p className="text-2xl font-black text-green-600 mt-1">{highestTP || '-'}</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TP Terendah</p>
            <p className="text-2xl font-black text-red-600 mt-1">{lowestTP || '-'}</p>
          </div>
          <div className="bg-white p-4 text-center">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Murid TP 1-2</p>
             <p className="text-2xl font-black text-amber-600 mt-1">
               {filteredData.filter(s => {
                 const tp = getSubjectTP(s.mataPelajaran, mataPelajaran) || 0;
                 return tp === 1 || tp === 2;
               }).length}
             </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-16">No.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Murid</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-32">Tahap Penguasaan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length > 0 ? (
                filteredData.map((student, idx) => {
                  const tp = getSubjectTP(student.mataPelajaran, mataPelajaran) || 0;
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-400">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">{student.nama}</td>
                      <td className="px-6 py-4 text-center">
                        {tp > 0 ? (
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm shadow-sm ${getTPColor(tp)}`}>
                            {tp}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-medium bg-slate-100 px-2 py-1 rounded-md">Tiada Data</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
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
