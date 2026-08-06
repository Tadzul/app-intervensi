import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { PANITIA_LIST, matchesPanitia, resolveTeacherName } from '../types';
import { Printer, Download, Filter, Search, Layers, BookOpen, CheckCircle2, Users, FileText, AlertTriangle, Sparkles } from 'lucide-react';

export default function PanitiaIntervention() {
  const { teachers, interventions } = useDataStore();

  const [selectedPanitia, setSelectedPanitia] = useState<string>('PANITIA BAHASA MELAYU');
  const [selectedPbdType, setSelectedPbdType] = useState<string>('');
  const [selectedTahun, setSelectedTahun] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Map teacher ID to teacher name
  const teacherMap = useMemo(() => {
    const map = new Map<string, string>();
    teachers.forEach(t => map.set(String(t.id), t.name));
    return map;
  }, [teachers]);

  // Filter interventions based on selected Panitia, PBD session, Year, and Search Query
  const filteredInterventions = useMemo(() => {
    return interventions.filter(inv => {
      // Panitia Match
      if (!matchesPanitia(inv.mataPelajaran, selectedPanitia)) {
        return false;
      }

      // PBD Session Match
      if (selectedPbdType && inv.pbdType !== selectedPbdType) {
        return false;
      }

      // Year / Tahun Match
      if (selectedTahun !== 'Semua') {
        const classYear = inv.kelas.trim().charAt(0);
        if (classYear !== selectedTahun) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const teacherName = resolveTeacherName(inv.teacherId, teachers).toLowerCase();
        const kelas = inv.kelas.toLowerCase();
        const isu = inv.isu.toLowerCase();
        const pelan = inv.pelanIntervensi.toLowerCase();
        const tajuk = inv.tajukBelumDikuasai.toLowerCase();

        return (
          teacherName.includes(query) ||
          kelas.includes(query) ||
          isu.includes(query) ||
          pelan.includes(query) ||
          tajuk.includes(query)
        );
      }

      return true;
    });
  }, [interventions, selectedPanitia, selectedPbdType, selectedTahun, searchQuery, teacherMap]);

  // Grouped by Year (Tahun 1 to 6)
  const interventionsByYear = useMemo(() => {
    const years: Record<string, typeof filteredInterventions> = {
      'Tahun 1': [],
      'Tahun 2': [],
      'Tahun 3': [],
      'Tahun 4': [],
      'Tahun 5': [],
      'Tahun 6': [],
      'Lain-lain': []
    };

    filteredInterventions.forEach(inv => {
      const yearChar = inv.kelas.trim().charAt(0);
      if (['1', '2', '3', '4', '5', '6'].includes(yearChar)) {
        years[`Tahun ${yearChar}`].push(inv);
      } else {
        years['Lain-lain'].push(inv);
      }
    });

    return years;
  }, [filteredInterventions]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalInterventions = filteredInterventions.length;
    let totalStudents = 0;
    let totalTp1 = 0, totalTp2 = 0, totalTp3 = 0, totalTp4 = 0, totalTp5 = 0, totalTp6 = 0;
    const uniqueTeachers = new Set<string>();
    const uniqueClasses = new Set<string>();

    filteredInterventions.forEach(inv => {
      if (inv.teacherId) uniqueTeachers.add(String(inv.teacherId));
      if (inv.kelas) uniqueClasses.add(inv.kelas);

      totalTp1 += inv.tp1 || 0;
      totalTp2 += inv.tp2 || 0;
      totalTp3 += inv.tp3 || 0;
      totalTp4 += inv.tp4 || 0;
      totalTp5 += inv.tp5 || 0;
      totalTp6 += inv.tp6 || 0;
    });

    totalStudents = totalTp1 + totalTp2 + totalTp3 + totalTp4 + totalTp5 + totalTp6;
    const totalTp123 = totalTp1 + totalTp2 + totalTp3;
    const pctTp123 = totalStudents > 0 ? ((totalTp123 / totalStudents) * 100).toFixed(1) : '0.0';

    return {
      totalInterventions,
      totalTeachers: uniqueTeachers.size,
      totalClasses: uniqueClasses.size,
      totalStudents,
      totalTp123,
      pctTp123,
      totalTp1,
      totalTp2,
      totalTp3,
      totalTp4,
      totalTp5,
      totalTp6
    };
  }, [filteredInterventions]);

  // Extract and group proposed interventions (Cadangan Intervensi)
  const proposedInterventionsSummary = useMemo(() => {
    const proposalMap = new Map<string, {
      title: string;
      count: number;
      classes: Set<string>;
      teachers: Set<string>;
      issues: Set<string>;
    }>();

    filteredInterventions.forEach(inv => {
      const teacherName = resolveTeacherName(inv.teacherId, teachers);
      const rawPlans = inv.pelanIntervensi ? inv.pelanIntervensi.split('\n') : [];
      
      if (inv.pelanIntervensiLain) {
        rawPlans.push(inv.pelanIntervensiLain);
      }

      // Process each line / item of plan
      rawPlans.forEach(line => {
        const cleanLine = line.replace(/^[-*•\d.]+\s*/, '').trim();
        if (!cleanLine) return;

        // Grouping key (case insensitive match for common categories)
        let groupKey = cleanLine;
        const lowerKey = cleanLine.toLowerCase();

        if (lowerKey.includes('pemulihan')) groupKey = 'Kelas Pemulihan / Bimbingan Asas';
        else if (lowerKey.includes('latih tubi')) groupKey = 'Program Latih Tubi / Modul Soalan';
        else if (lowerKey.includes('bimbingan individu')) groupKey = 'Bimbingan Individu / Rakan Sebaya';
        else if (lowerKey.includes('mentor')) groupKey = 'Program Mentor Mentee';
        else if (lowerKey.includes('modul')) groupKey = 'Penggunaan Modul Khas Subjek';

        if (!proposalMap.has(groupKey)) {
          proposalMap.set(groupKey, {
            title: groupKey,
            count: 0,
            classes: new Set(),
            teachers: new Set(),
            issues: new Set()
          });
        }

        const entry = proposalMap.get(groupKey)!;
        entry.count += 1;
        entry.classes.add(inv.kelas);
        entry.teachers.add(teacherName);
        if (inv.isu) entry.issues.add(inv.isu);
      });
    });

    return Array.from(proposalMap.values()).sort((a, b) => b.count - a.count);
  }, [filteredInterventions, teacherMap]);

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csv = "TAHUN/KELAS,SESI PBD,GURU MATA PELAJARAN,MATA PELAJARAN,TP1,TP2,TP3,TP4,TP5,TP6,JUMLAH,TAJUK BELUM DIKUASAI,ISU,PUNCA,CADANGAN INTERVENSI\n";

    filteredInterventions.forEach(inv => {
      const teacherName = resolveTeacherName(inv.teacherId, teachers);
      const total = inv.tp1 + inv.tp2 + inv.tp3 + inv.tp4 + inv.tp5 + inv.tp6;
      const puncaStr = inv.punca.join('; ') + (inv.puncaLain ? `; ${inv.puncaLain}` : '');
      const tajukClean = `"${(inv.tajukBelumDikuasai || '').replace(/"/g, '""')}"`;
      const isuClean = `"${(inv.isu || '').replace(/"/g, '""')}"`;
      const puncaClean = `"${puncaStr.replace(/"/g, '""')}"`;
      const pelanClean = `"${(inv.pelanIntervensi || '').replace(/"/g, '""')}"`;

      csv += `"${inv.kelas}","${inv.pbdType}","${teacherName}","${inv.mataPelajaran}",${inv.tp1},${inv.tp2},${inv.tp3},${inv.tp4},${inv.tp5},${inv.tp6},${total},${tajukClean},${isuClean},${puncaClean},${pelanClean}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Intervensi_${selectedPanitia.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header (No Print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full uppercase tracking-wider">
              Panitia Subjek
            </span>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">
              Intervensi Panitia
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Penggabungan laporan dan senarai cadangan intervensi mengikut Panitia (Tahun 1 hingga Tahun 6).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl border border-emerald-200 hover:bg-emerald-100 transition-all flex items-center gap-2 text-sm shadow-sm"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 text-sm shadow-md hover:shadow-lg"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan Panitia
          </button>
        </div>
      </div>

      {/* Filter Section (No Print) */}
      <div className="no-print bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Filter className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
            Tetapan Saringan Panitia
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Panitia Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-blue-950 uppercase tracking-wider block">
              Pilih Panitia Mata Pelajaran <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedPanitia}
              onChange={(e) => setSelectedPanitia(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-blue-50/50 border-2 border-blue-200 rounded-xl font-bold text-blue-950 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="Semua Panitia">-- SEMUA PANITIA --</option>
              {PANITIA_LIST.map((pan) => (
                <option key={pan} value={pan}>
                  {pan}
                </option>
              ))}
            </select>
          </div>

          {/* Sesi PBD Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Sesi PBD
            </label>
            <select
              value={selectedPbdType}
              onChange={(e) => setSelectedPbdType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
            >
              <option value="">-- Semua Sesi PBD --</option>
              <option value="PBD Pertengahan">PBD Pertengahan</option>
              <option value="PBD Akhir">PBD Akhir</option>
            </select>
          </div>

          {/* Tahun / Darjah Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
              Peringkat Tahun
            </label>
            <select
              value={selectedTahun}
              onChange={(e) => setSelectedTahun(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 text-sm focus:ring-2 focus:ring-amber-500 transition-all cursor-pointer"
            >
              <option value="Semua">Semua Tahun (Tahun 1 - 6)</option>
              <option value="1">Tahun 1</option>
              <option value="2">Tahun 2</option>
              <option value="3">Tahun 3</option>
              <option value="4">Tahun 4</option>
              <option value="5">Tahun 5</option>
              <option value="6">Tahun 6</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru, kelas, tajuk, isu atau cadangan intervensi..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Summary Cards (No Print) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rekod Intervensi</p>
            <p className="text-2xl font-black text-slate-900">{stats.totalInterventions}</p>
            <p className="text-xs text-slate-500 font-medium">{stats.totalClasses} Kelas Terlibat</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guru Terlibat</p>
            <p className="text-2xl font-black text-amber-600">{stats.totalTeachers}</p>
            <p className="text-xs text-slate-500 font-medium">Pengajar Subjek</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Murid Perlu Bimbingan</p>
            <p className="text-2xl font-black text-rose-600">{stats.totalTp1 + stats.totalTp2}</p>
            <p className="text-xs text-slate-500 font-medium">TP1 & TP2 (Keutamaan)</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Jumlah Murid Ditaksir</p>
            <p className="text-2xl font-black text-emerald-600">{stats.totalStudents}</p>
            <p className="text-xs text-slate-500 font-medium">Tahun 1 hingga 6</p>
          </div>
        </div>
      </div>

      {/* Main Content Area - Print & Display */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 print-area space-y-10">
        
        {/* Official Header Header for Print */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2">
          <h1 className="text-2xl font-black uppercase text-slate-900 tracking-wider">
            SISTEM ANALISIS INTERVENSI AKADEMIK SEKOLAH (SAIAS)
          </h1>
          <h2 className="text-xl font-bold uppercase text-blue-900 tracking-wide">
            LAPORAN GABUNGAN INTERVENSI {selectedPanitia}
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-4 text-xs font-bold text-slate-600 pt-2 uppercase">
            <span className="px-3 py-1 bg-slate-100 rounded-md">
              PERINGKAT: TAHUN 1 HINGGA TAHUN 6
            </span>
            <span className="px-3 py-1 bg-slate-100 rounded-md">
              SESI PBD: {selectedPbdType || 'SEMUA SESI'}
            </span>
            <span className="px-3 py-1 bg-slate-100 rounded-md">
              JUMLAH REKOD: {stats.totalInterventions} KELAS
            </span>
          </div>
        </div>

        {/* Section 1: Ringkasan Cadangan Intervensi Yang Dirancang */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 no-print" />
              <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">
                1. Senarai Cadangan Intervensi Yang Telah Dirancang Oleh Guru
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {proposedInterventionsSummary.length} Kategori Intervensi
            </span>
          </div>

          {proposedInterventionsSummary.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {proposedInterventionsSummary.map((item, index) => (
                <div
                  key={index}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 hover:border-amber-300 transition-all break-inside-avoid"
                  style={{ pageBreakInside: 'avoid' }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shrink-0 font-extrabold">
                        {index + 1}
                      </span>
                      {item.title}
                    </h4>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold text-xs rounded-lg shrink-0">
                      {item.count} Kelas
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 pl-8">
                    <p>
                      <strong className="text-slate-800">Kelas Melaksanakan:</strong>{' '}
                      {Array.from(item.classes).join(', ')}
                    </p>
                    <p>
                      <strong className="text-slate-800">Guru Melaksanakan:</strong>{' '}
                      {Array.from(item.teachers).join(', ')}
                    </p>
                    {item.issues.size > 0 && (
                      <p className="line-clamp-2">
                        <strong className="text-slate-800">Isu Disasarkan:</strong>{' '}
                        {Array.from(item.issues).join('; ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
              Tiada cadangan intervensi dijumpai untuk panitia ini pada saringan semasa.
            </div>
          )}
        </div>

        {/* Section 2: Jadual Terperinci Intervensi Mengikut Tahun 1 Hingga 6 */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide">
              2. Analisis Terperinci Mengikut Tahun (Tahun 1 hingga Tahun 6)
            </h3>
          </div>

          {['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6', 'Lain-lain'].map((yearGroup) => {
            const list = interventionsByYear[yearGroup] || [];
            if (list.length === 0) return null;

            return (
              <div key={yearGroup} className="space-y-3">
                <div className="flex items-center gap-3 bg-blue-950 text-white px-4 py-2.5 rounded-lg shadow-sm">
                  <BookOpen className="w-5 h-5 text-amber-400 no-print" />
                  <h4 className="font-extrabold text-sm uppercase tracking-wider">
                    PERINGKAT {yearGroup.toUpperCase()} ({list.length} KELAS)
                  </h4>
                </div>

                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse border border-slate-900 text-xs text-slate-900 bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-900 font-bold uppercase text-slate-900">
                        <th className="border border-slate-900 p-2 text-center w-[12%]">Kelas & Sesi</th>
                        <th className="border border-slate-900 p-2 text-center w-[15%]">Guru Subjek</th>
                        <th className="border border-slate-900 p-2 text-center w-[14%]">Pencapaian TP</th>
                        <th className="border border-slate-900 p-2 text-center w-[18%]">Tajuk Belum Dikuasai</th>
                        <th className="border border-slate-900 p-2 text-center w-[20%]">Isu & Punca Utama</th>
                        <th className="border border-slate-900 p-2 text-center w-[21%]">Cadangan Intervensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((inv) => {
                        const teacherName = resolveTeacherName(inv.teacherId, teachers);
                        const total = inv.tp1 + inv.tp2 + inv.tp3 + inv.tp4 + inv.tp5 + inv.tp6;
                        const puncaCombined = [...inv.punca, inv.puncaLain].filter(Boolean).join(', ');

                        return (
                          <tr key={inv.id} className="border-b border-slate-900 hover:bg-slate-50 transition-colors">
                            {/* Kelas & Sesi */}
                            <td className="border border-slate-900 p-2 text-center font-bold align-top">
                              <div className="text-sm text-blue-900">{inv.kelas}</div>
                              <div className="text-[11px] font-semibold text-slate-600 mt-1">{inv.pbdType}</div>
                              <div className="text-[10px] text-slate-400 mt-1">{inv.date}</div>
                            </td>

                            {/* Guru Subjek */}
                            <td className="border border-slate-900 p-2 text-left font-semibold align-top uppercase">
                              {teacherName}
                            </td>

                            {/* Taburan TP */}
                            <td className="border border-slate-900 p-1 align-top">
                              <div className="grid grid-cols-2 gap-x-1 text-[11px] font-mono leading-tight">
                                <span className="font-bold text-red-700">TP1: {inv.tp1}</span>
                                <span className="font-bold text-orange-700">TP2: {inv.tp2}</span>
                                <span className="font-semibold text-amber-700">TP3: {inv.tp3}</span>
                                <span className="font-semibold text-emerald-700">TP4: {inv.tp4}</span>
                                <span className="font-semibold text-blue-700">TP5: {inv.tp5}</span>
                                <span className="font-semibold text-indigo-700">TP6: {inv.tp6}</span>
                              </div>
                              <div className="mt-1 pt-1 border-t border-slate-300 font-bold text-center text-[11px]">
                                JUM: {total} MURID
                              </div>
                            </td>

                            {/* Tajuk Belum Dikuasai */}
                            <td className="border border-slate-900 p-2 align-top whitespace-pre-wrap leading-relaxed">
                              {inv.tajukBelumDikuasai || '-'}
                            </td>

                            {/* Isu & Punca */}
                            <td className="border border-slate-900 p-2 align-top space-y-1.5 leading-relaxed">
                              {inv.isu && (
                                <div>
                                  <span className="font-bold underline text-slate-900">ISU:</span>
                                  <p className="whitespace-pre-wrap">{inv.isu}</p>
                                </div>
                              )}
                              {puncaCombined && (
                                <div className="mt-1">
                                  <span className="font-bold underline text-slate-900">PUNCA:</span>
                                  <p className="whitespace-pre-wrap">{puncaCombined}</p>
                                </div>
                              )}
                            </td>

                            {/* Cadangan Intervensi */}
                            <td className="border border-slate-900 p-2 align-top whitespace-pre-wrap font-medium leading-relaxed bg-amber-50/30">
                              {inv.pelanIntervensi || '-'}
                              {inv.pelanIntervensiLain && (
                                <div className="mt-1 pt-1 border-t border-amber-200 italic">
                                  Lain-lain: {inv.pelanIntervensiLain}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {filteredInterventions.length === 0 && (
            <div className="py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-300 rounded-xl">
              Tiada rekod intervensi dijumpai untuk {selectedPanitia}.
            </div>
          )}
        </div>

        {/* Print Signoff Footer */}
        <div 
          className="pt-12 mt-12 border-t-2 border-slate-900 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-900 break-inside-avoid"
          style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
        >
          <div className="space-y-12">
            <p className="uppercase tracking-wider font-extrabold">Disediakan Oleh:</p>
            <div className="pt-10 space-y-1">
              <div className="border-b-2 border-slate-900 mx-auto w-64 pb-1"></div>
              <p className="uppercase font-black text-xs text-slate-900 pt-1">
                ( KETUA PANITIA {selectedPanitia.replace(/^PANITIA\s+/i, '')} )
              </p>
              <p className="text-[11px] text-slate-600 font-semibold">Ketua Panitia Mata Pelajaran</p>
              <p className="text-[10px] text-slate-500 font-normal pt-1">Tarikh: ....................................</p>
            </div>
          </div>

          <div className="space-y-12">
            <p className="uppercase tracking-wider font-extrabold">Disahkan Oleh:</p>
            <div className="pt-10 space-y-1">
              <div className="border-b-2 border-slate-900 mx-auto w-64 pb-1"></div>
              <p className="uppercase font-black text-xs text-slate-900 pt-1">
                ( GURU BESAR / PK PENTADBIRAN )
              </p>
              <p className="text-[11px] text-slate-600 font-semibold">Pengurusan Pentadbiran Sekolah</p>
              <p className="text-[10px] text-slate-500 font-normal pt-1">Tarikh: ....................................</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
