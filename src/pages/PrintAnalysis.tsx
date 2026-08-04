import React, { useState } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Printer } from 'lucide-react';

export default function PrintAnalysis() {
  const { teachers, interventions } = useDataStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [filterPbdType, setFilterPbdType] = useState('');

  const filteredTeachers = selectedTeacherId 
    ? teachers.filter(t => String(t.id) === String(selectedTeacherId))
    : teachers;

  const visibleInterventions = filterPbdType 
    ? interventions.filter(i => i.pbdType === filterPbdType)
    : interventions;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <div className="no-print">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Intervensi Versi Cetak</h2>
        <p className="text-slate-500">Cetak analisis mengikut format rasmi borang pelaporan KPM.</p>
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
            <option value="">-- Semua Guru --</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={handlePrint}
          className="w-full sm:w-auto px-6 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <Printer className="w-5 h-5" /> Cetak Borang
        </button>
      </div>

      <div id="print-content-area" className="print-area space-y-16 bg-white p-4">
        {filteredTeachers.map(teacher => {
          const teacherInterventions = visibleInterventions.filter(i => String(i.teacherId) === String(teacher.id));
          
          if (teacherInterventions.length === 0) return null;

          return (
            <div key={teacher.id} className="break-inside-avoid print-page-break">
              <h3 className="font-bold text-lg mb-4 uppercase text-black">NAMA GURU : {teacher.name}</h3>
              
              <table className="w-full border-collapse border border-black text-sm text-black table-fixed bg-white">
                <thead>
                  <tr className="border border-black bg-white">
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>M/PELAJARAN</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>KELAS</th>
                    <th colSpan={2} className="border border-black p-2 text-center uppercase font-bold" style={{ width: '12%' }}>PENCAPAIAN</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '20%' }}>TAJUK BELUM<br/>DIKUASAI</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '24%' }}>PUNCA/ISU</th>
                    <th className="border border-black p-2 text-center uppercase font-bold" style={{ width: '20%' }}>PELAN INTERVENSI<br/>(TINDAKAN)</th>
                  </tr>
                </thead>
                {teacherInterventions.map((inv) => {
                  const total = inv.tp1 + inv.tp2 + inv.tp3 + inv.tp4 + inv.tp5 + inv.tp6;
                  return (
                    <tbody key={inv.id} className="break-inside-avoid" style={{ pageBreakInside: 'avoid' }}>
                      <tr className="border border-black bg-white">
                        <td rowSpan={7} className="border border-black p-2 text-center align-top font-semibold">{inv.mataPelajaran}</td>
                        <td rowSpan={7} className="border border-black p-2 text-center align-top font-semibold">{inv.kelas}</td>
                        <td className="border-b border-black border-r border-black p-1 text-center font-bold w-[4%] leading-tight">TP1</td>
                        <td className="border-b border-black p-1 text-center w-[4%] leading-tight">{inv.tp1}</td>
                        <td rowSpan={7} className="border border-black p-3 align-top whitespace-pre-wrap">{inv.tajukBelumDikuasai}</td>
                        <td rowSpan={7} className="border border-black p-3 align-top text-sm">
                          <div className="mb-4">
                            <span className="font-bold underline">ISU:</span>
                            <p className="mt-1 whitespace-pre-wrap leading-snug">{inv.isu}</p>
                          </div>
                          <div>
                            <span className="font-bold underline">PUNCA:</span>
                            <p className="mt-1 whitespace-pre-wrap leading-snug">
                              {inv.punca.join(', ')}
                              {inv.puncaLain && (inv.punca.length > 0 ? `, ${inv.puncaLain}` : inv.puncaLain)}
                            </p>
                          </div>
                        </td>
                        <td rowSpan={7} className="border border-black p-3 align-top whitespace-pre-wrap">{inv.pelanIntervensi}</td>
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
            </div>
          );
        })}

        {filteredTeachers.every(t => visibleInterventions.filter(i => String(i.teacherId) === String(t.id)).length === 0) && (
          <div className="py-12 text-center text-slate-500 italic border-2 border-dashed border-slate-300 rounded-xl no-print">
            Tiada rekod intervensi dijumpai untuk paparan cetak.
          </div>
        )}
      </div>
    </div>
  );
}

