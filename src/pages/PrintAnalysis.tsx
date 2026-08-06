import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Printer, CheckCircle, Database } from 'lucide-react';
import { resolveTeacherName, isInterventionByTeacher, Intervention } from '../types';

export default function PrintAnalysis() {
  const { teachers, subjects, interventions } = useDataStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [filterPbdType, setFilterPbdType] = useState('');

  // 1. Filter interventions by PBD type and validity
  const visibleInterventions = useMemo(() => {
    return interventions.filter(i => {
      if (!i || !i.kelas || !i.kelas.trim() || !i.mataPelajaran || !i.mataPelajaran.trim()) {
        return false;
      }
      if (filterPbdType && i.pbdType !== filterPbdType) {
        return false;
      }
      return true;
    });
  }, [interventions, filterPbdType]);

  // 2. Group ALL interventions dynamically by teacher
  const teacherGroups = useMemo(() => {
    const map = new Map<string, { teacherName: string; teacherId: string; items: Intervention[] }>();

    // Process all visible interventions
    visibleInterventions.forEach(inv => {
      // Find registered teacher match
      const matchedTeacher = teachers.find(t => isInterventionByTeacher(inv, t, subjects));
      
      let key = '';
      let teacherName = '';

      if (matchedTeacher) {
        key = String(matchedTeacher.id);
        teacherName = matchedTeacher.name;
      } else {
        teacherName = resolveTeacherName(inv.teacherId, teachers, subjects, interventions);
        key = String(inv.teacherId || teacherName || 'unknown').trim();
      }

      if (!map.has(key)) {
        map.set(key, {
          teacherId: key,
          teacherName: teacherName || 'GURU / TIDAK DINYATAKAN',
          items: []
        });
      }

      map.get(key)!.items.push(inv);
    });

    return Array.from(map.values());
  }, [visibleInterventions, teachers, subjects, interventions]);

  // 3. Unified teacher list for selection
  const teacherOptions = useMemo(() => {
    const listMap = new Map<string, { id: string; name: string }>();
    teachers.forEach(t => {
      if (t.id && t.name) {
        listMap.set(String(t.id), { id: String(t.id), name: t.name });
      }
    });
    teacherGroups.forEach(g => {
      if (!listMap.has(g.teacherId)) {
        listMap.set(g.teacherId, { id: g.teacherId, name: g.teacherName });
      }
    });
    return Array.from(listMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [teachers, teacherGroups]);

  // 4. Filter teacher groups if a specific teacher is selected
  const filteredGroups = useMemo(() => {
    if (!selectedTeacherId) return teacherGroups;

    const selOption = teacherOptions.find(t => String(t.id) === String(selectedTeacherId));
    const searchTarget = selOption ? selOption.name.toLowerCase().trim() : selectedTeacherId.toLowerCase().trim();

    return teacherGroups.filter(group => {
      if (group.teacherId === String(selectedTeacherId)) return true;
      if (group.teacherName.toLowerCase().trim() === searchTarget) return true;
      if (group.teacherId.toLowerCase().includes(searchTarget) || group.teacherName.toLowerCase().includes(searchTarget)) return true;
      return false;
    });
  }, [teacherGroups, selectedTeacherId, teacherOptions]);

  const totalDisplayedRecords = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.items.length, 0);
  }, [filteredGroups]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 pb-16">
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intervensi Versi Cetak</h2>
          <p className="text-slate-500">Cetak analisis mengikut format rasmi borang pelaporan KPM (100% Selaras Database).</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            {totalDisplayedRecords} Rekod Intervensi Sedia Dicetak
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 no-print flex flex-col sm:flex-row items-end gap-4">
        <div className="flex-1 w-full space-y-2">
          <label className="text-sm font-semibold text-slate-700">Pilih Sesi PBD</label>
          <select
            value={filterPbdType}
            onChange={(e) => setFilterPbdType(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">-- Semua Sesi PBD --</option>
            <option value="PBD Pertengahan">PBD Pertengahan</option>
            <option value="PBD Akhir">PBD Akhir</option>
          </select>
        </div>
        <div className="flex-1 w-full space-y-2">
          <label className="text-sm font-semibold text-slate-700">Pilih Guru (Kosongkan untuk cetak semua)</label>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-gold-500 focus:border-gold-500"
          >
            <option value="">-- Semua Guru ({teacherGroups.length} Guru Mempunyai Rekod) --</option>
            {teacherOptions.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Printer className="w-5 h-5" /> Cetak Borang ({totalDisplayedRecords})
        </button>
      </div>

      <div id="print-content-area" className="print-area space-y-16 bg-white p-4">
        {filteredGroups.map(group => {
          if (group.items.length === 0) return null;

          return (
            <div key={group.teacherId} className="break-inside-avoid print-page-break space-y-4">
              <div className="border-b-2 border-black pb-2 flex justify-between items-end">
                <h3 className="font-bold text-lg uppercase text-black">NAMA GURU : {group.teacherName}</h3>
                <span className="text-xs font-bold text-black uppercase">JUMLAH REKOD: {group.items.length} KELAS</span>
              </div>
              
              <table className="w-full border-collapse border border-black text-sm text-black table-fixed bg-white">
                <thead>
                  <tr className="border border-black bg-white">
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>M/PELAJARAN</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>KELAS & SESI</th>
                    <th colSpan={2} className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>PENCAPAIAN</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '20%' }}>TAJUK BELUM<br/>DIKUASAI</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '24%' }}>PUNCA/ISU</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '20%' }}>PELAN INTERVENSI<br/>(TINDAKAN)</th>
                  </tr>
                </thead>
                {group.items.map((inv) => {
                  const total = inv.tp1 + inv.tp2 + inv.tp3 + inv.tp4 + inv.tp5 + inv.tp6;
                  const puncaStr = [...(inv.punca || []), inv.puncaLain].filter(Boolean).join(', ');

                  return (
                    <tbody key={inv.id} className="break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                      <tr className="border border-black bg-white">
                        <td rowSpan={7} className="border border-black p-2 text-center align-top font-semibold">{inv.mataPelajaran}</td>
                        <td rowSpan={7} className="border border-black p-2 text-center align-top font-semibold">
                          <div>{inv.kelas}</div>
                          <div className="text-xs font-normal text-slate-600 mt-1">({inv.pbdType})</div>
                          <div className="text-[10px] text-slate-500">{inv.date}</div>
                        </td>
                        <td className="border-b border-black border-r border-black p-1 text-center font-bold w-[4%] leading-tight">TP1</td>
                        <td className="border-b border-black p-1 text-center w-[4%] leading-tight">{inv.tp1}</td>
                        <td rowSpan={7} className="border border-black p-3 align-top whitespace-pre-wrap">{inv.tajukBelumDikuasai || '-'}</td>
                        <td rowSpan={7} className="border border-black p-3 align-top text-sm">
                          {inv.isu && (
                            <div className="mb-4">
                              <span className="font-bold underline">ISU:</span>
                              <p className="mt-1 whitespace-pre-wrap leading-snug">{inv.isu}</p>
                            </div>
                          )}
                          {puncaStr && (
                            <div>
                              <span className="font-bold underline">PUNCA:</span>
                              <p className="mt-1 whitespace-pre-wrap leading-snug">{puncaStr}</p>
                            </div>
                          )}
                        </td>
                        <td rowSpan={7} className="border border-black p-3 align-top whitespace-pre-wrap">
                          {inv.pelanIntervensi || '-'}
                          {inv.pelanIntervensiLain && (
                            <div className="mt-2 pt-2 border-t border-black text-xs italic">
                              Lain-lain: {inv.pelanIntervensiLain}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border-r border-black border-b border-black p-1 text-center font-bold leading-tight">TP2</td>
                        <td className="p-1 text-center border-b border-black leading-tight">{inv.tp2}</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border-r border-black border-b border-black p-1 text-center font-bold leading-tight">TP3</td>
                        <td className="p-1 text-center border-b border-black leading-tight">{inv.tp3}</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border-r border-black border-b border-black p-1 text-center font-bold leading-tight">TP4</td>
                        <td className="p-1 text-center border-b border-black leading-tight">{inv.tp4}</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border-r border-black border-b border-black p-1 text-center font-bold leading-tight">TP5</td>
                        <td className="p-1 text-center border-b border-black leading-tight">{inv.tp5}</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border-r border-black border-b border-black p-1 text-center font-bold leading-tight">TP6</td>
                        <td className="p-1 text-center border-b border-black leading-tight">{inv.tp6}</td>
                      </tr>
                      <tr className="bg-white border-b border-black">
                        <td className="border-r border-black p-1 text-center font-bold leading-tight">JUM</td>
                        <td className="p-1 text-center leading-tight font-bold">{total}</td>
                      </tr>
                    </tbody>
                  );
                })}
              </table>

              {/* Signoff Footer */}
              <div 
                className="pt-8 mt-6 border-t border-black grid grid-cols-2 gap-8 text-center text-xs font-bold text-black break-inside-avoid"
                style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
              >
                <div className="space-y-6">
                  <p className="uppercase tracking-wider font-extrabold">Disediakan Oleh:</p>
                  <div className="pt-6 space-y-1">
                    <div className="border-b border-black mx-auto w-56 pb-1"></div>
                    <p className="uppercase font-black text-xs text-black pt-1">
                      ( {group.teacherName} )
                    </p>
                    <p className="text-[11px] text-slate-700 font-semibold">Guru Mata Pelajaran</p>
                    <p className="text-[10px] text-slate-600 font-normal pt-1">Tarikh: ....................................</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <p className="uppercase tracking-wider font-extrabold">Disahkan Oleh:</p>
                  <div className="pt-6 space-y-1">
                    <div className="border-b border-black mx-auto w-56 pb-1"></div>
                    <p className="uppercase font-black text-xs text-black pt-1">
                      ( GURU BESAR / PK PENTADBIRAN )
                    </p>
                    <p className="text-[11px] text-slate-700 font-semibold">Pengurusan Pentadbiran Sekolah</p>
                    <p className="text-[10px] text-slate-600 font-normal pt-1">Tarikh: ....................................</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filteredGroups.length === 0 && (
          <div className="py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-300 rounded-xl no-print">
            Tiada rekod intervensi dijumpai untuk paparan cetak.
          </div>
        )}
      </div>
    </div>
  );
}

