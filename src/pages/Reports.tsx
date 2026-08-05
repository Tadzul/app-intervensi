import React, { useState, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Download, Printer, Search, Trash2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { resolveTeacherName, isInterventionByTeacher } from '../types';

export default function Reports({ printMode = false }: { printMode?: boolean }) {
  const { teachers, subjects, interventions, isAdmin, deleteIntervention } = useDataStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterPbdType, setFilterPbdType] = useState('');

  const filteredInterventions = useMemo(() => {
    return interventions.filter(inv => {
      const teacherName = resolveTeacherName(inv.teacherId, teachers);
      const matchesSearch = 
        !searchTerm || 
        teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.kelas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.mataPelajaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.isu?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.punca?.join(' ').toLowerCase().includes(searchTerm.toLowerCase());

      const selectedTeacher = teachers.find(t => String(t.id) === String(filterTeacher));
      const matchesTeacher = !filterTeacher || (selectedTeacher ? isInterventionByTeacher(inv, selectedTeacher) : String(inv.teacherId) === String(filterTeacher));
      const matchesClass = !filterClass || inv.kelas === filterClass;
      const matchesSubject = !filterSubject || inv.mataPelajaran === filterSubject;
      const matchesPbd = !filterPbdType || inv.pbdType === filterPbdType;

      return matchesSearch && matchesTeacher && matchesClass && matchesSubject && matchesPbd;
    });
  }, [interventions, teachers, searchTerm, filterTeacher, filterClass, filterSubject, filterPbdType]);

  const uniqueClasses = Array.from(new Set(subjects.map(s => s.kelas))).sort();
  const uniqueSubjects = Array.from(new Set(subjects.map(s => s.mataPelajaran))).sort();

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredInterventions.length === 0) return;
    
    // Header
    const rows = [
      ['Tarikh', 'Nama Guru', 'Kelas', 'Mata Pelajaran', 'TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6', 'Jumlah', 'Punca', 'Isu', 'Pelan Intervensi']
    ];

    filteredInterventions.forEach(inv => {
      const teacherName = resolveTeacherName(inv.teacherId, teachers);
      rows.push([
        inv.date,
        `"${teacherName}"`,
        `"${inv.kelas}"`,
        `"${inv.mataPelajaran}"`,
        inv.tp1.toString(), inv.tp2.toString(), inv.tp3.toString(),
        inv.tp4.toString(), inv.tp5.toString(), inv.tp6.toString(),
        (inv.tp1+inv.tp2+inv.tp3+inv.tp4+inv.tp5+inv.tp6).toString(),
        `"${inv.punca.join(', ') + (inv.puncaLain ? ', ' + inv.puncaLain : '')}"`,
        `"${inv.isu}"`,
        `"${inv.pelanIntervensi}"`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Laporan_Intervensi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save("Laporan_Intervensi_Cetak.pdf");
    } catch (err) {
      console.error("PDF generation failed", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="no-print">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Laporan & Cetakan</h2>
        <p className="text-slate-500">Jana dan analisis laporan mengikut kriteria.</p>
      </div>

      {!printMode && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 no-print transition-all hover:shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari (Guru, Kelas, Punca...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm"
              />
            </div>

            <select
              value={filterPbdType}
              onChange={(e) => setFilterPbdType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm cursor-pointer"
            >
              <option value="">Semua Sesi PBD</option>
              <option value="PBD Pertengahan">PBD Pertengahan</option>
              <option value="PBD Akhir">PBD Akhir</option>
            </select>
            
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm cursor-pointer"
            >
              <option value="">Semua Guru</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm cursor-pointer"
            >
              <option value="">Semua Kelas</option>
              {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all shadow-sm cursor-pointer"
            >
              <option value="">Semua Subjek</option>
              {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={generatePDF}
              className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transform transition-all hover:-translate-y-0.5 text-sm font-bold"
            >
              <Download w={18} h={18} /> Muat Turun PDF (High Res)
            </button>
            <button
              onClick={handleExportCSV}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl flex items-center gap-2 hover:shadow-lg transform transition-all hover:-translate-y-0.5 text-sm font-bold"
            >
              <Download w={18} h={18} /> Muat Turun CSV / Excel
            </button>
          </div>
        </div>
      )}

      {/* Printable Area */}
      <div id="report-content" className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-slate-100">
        <div className="text-center mb-10 pb-6 border-b-2 border-slate-800">
          <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 border-2 border-gold-400 flex items-center justify-center overflow-hidden">
             <img src="https://i.postimg.cc/vTLqGVMs/logo.jpg" alt="Logo Sekolah" className="w-full h-full object-cover" crossOrigin="anonymous" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 uppercase">SEKOLAH KEBANGSAAN JALAN PEGOH</h1>
          <p className="text-slate-600 font-medium mt-1">Laporan Analisis Intervensi Akademik (SAIAS)</p>
          <div className="text-sm mt-4 text-slate-500 font-mono">
            Tarikh Cetakan: {new Date().toLocaleDateString('ms-MY')}
          </div>
        </div>

        {filteredInterventions.length > 0 ? (
          <div className="space-y-12">
            {filteredInterventions.map((inv, idx) => {
              const teacherName = resolveTeacherName(inv.teacherId, teachers);
              const total = inv.tp1 + inv.tp2 + inv.tp3 + inv.tp4 + inv.tp5 + inv.tp6;
              const tp12 = inv.tp1 + inv.tp2;
              const tp12P = total > 0 ? ((tp12/total)*100).toFixed(0) : 0;

              return (
                <div key={inv.id} className="break-inside-avoid">
                  <div className="bg-slate-50 p-4 border-l-4 border-slate-900 rounded-r-lg mb-4 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{inv.kelas} - {inv.mataPelajaran}</h3>
                      <div className="text-sm text-slate-600 flex gap-4 mt-1">
                        <span>Guru: <span className="font-semibold text-slate-800">{teacherName}</span></span>
                        <span>Tarikh: {inv.date}</span>
                      </div>
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => deleteIntervention(inv.id)}
                        className="no-print p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Padam Laporan"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="border border-slate-200 p-3 rounded-lg text-center">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Jumlah Murid</p>
                      <p className="text-xl font-bold">{total}</p>
                    </div>
                    <div className="border border-red-200 bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-xs font-semibold text-red-600 uppercase">Belum Menguasai (TP1-2)</p>
                      <p className="text-xl font-bold text-red-700">{tp12} ({tp12P}%)</p>
                    </div>
                    <div className="border border-slate-200 p-3 rounded-lg col-span-2">
                       <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Pecahan TP</p>
                       <div className="flex gap-2 justify-between font-mono text-sm">
                         <span>TP1:{inv.tp1}</span>
                         <span>TP2:{inv.tp2}</span>
                         <span>TP3:{inv.tp3}</span>
                         <span>TP4:{inv.tp4}</span>
                         <span>TP5:{inv.tp5}</span>
                         <span>TP6:{inv.tp6}</span>
                       </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 bg-white border border-slate-200 rounded-lg p-5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 uppercase border-b pb-2 mb-2">Punca & Isu</h4>
                      <p className="text-sm text-slate-700 font-medium mb-1 line-clamp-2">Tajuk Lemah: <span className="font-normal">{inv.tajukBelumDikuasai}</span></p>
                      <p className="text-sm text-slate-700 font-medium mb-1">Punca: <span className="font-normal">{inv.punca.join(', ')} {inv.puncaLain && `, ${inv.puncaLain}`}</span></p>
                      <p className="text-sm text-slate-700 font-medium mt-3 italic text-slate-600 p-2 bg-slate-50 rounded">"{inv.isu}"</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-800 uppercase border-b pb-2 mb-2">Cadangan Intervensi</h4>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">{inv.pelanIntervensi}</p>
                    </div>
                  </div>
                  
                  {idx < filteredInterventions.length - 1 && <div className="my-8 border-b border-dashed border-slate-300"></div>}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center text-slate-500 italic border-2 border-dashed border-slate-200 rounded-xl">
            Tiada laporan dijumpai berdasarkan carian anda.
          </div>
        )}
      </div>
    </div>
  );
}
