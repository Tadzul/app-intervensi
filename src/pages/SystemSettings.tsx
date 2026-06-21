import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useDataStore } from '../store/useDataStore';
import { StudentPBD, TAHAP1_CLASSES, TAHAP2_CLASSES, TAHAP1_SUBJECTS, TAHAP2_SUBJECTS } from '../types';
import { Upload, X, Trash2, Trophy, ArrowDown, Database } from 'lucide-react';

export default function SystemSettings() {
  const { studentsPBD = [], uploadPBDData, deletePBDClass, isAdmin, pbdControl = { pbd1Open: true, pbd2Open: true }, updatePbdControl } = useDataStore();
  const [activeTahap, setActiveTahap] = useState<'Tahap 1' | 'Tahap 2'>('Tahap 1');
  const [pbdType, setPbdType] = useState<'PBD1' | 'PBD2'>('PBD1');
  
  const classes = activeTahap === 'Tahap 1' ? TAHAP1_CLASSES : TAHAP2_CLASSES;
  const subjects = activeTahap === 'Tahap 1' ? TAHAP1_SUBJECTS : TAHAP2_SUBJECTS;
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Handle class selection when Tahap changes
  React.useEffect(() => {
    setSelectedClass(classes[0]);
  }, [activeTahap]);

  const existingData = studentsPBD.filter(s => s.pbdType === pbdType && s.kelas === selectedClass);
  const isDataUploaded = existingData.length > 0;

  const togglePbd1 = () => updatePbdControl({ ...pbdControl, pbd1Open: !pbdControl.pbd1Open });
  const togglePbd2 = () => updatePbdControl({ ...pbdControl, pbd2Open: !pbdControl.pbd2Open });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Transform
        const newStudents: StudentPBD[] = data.map((row: any, idx) => {
          const name = row['Nama'] || row['NAMA'] || row['Name'] || row['NAME'] || `Murid ${idx + 1}`;
          
          const mpScores: Record<string, number> = {};
          
          subjects.forEach(sub => {
            // Check for exact object match or case-insensitive
            let foundKey = Object.keys(row).find(k => k.toLowerCase().trim() === sub.toLowerCase());
            
            if (!foundKey) {
              const headerMapping: Record<string, string> = {
                'Bahasa Melayu': 'BM',
                'Bahasa Inggeris': 'BI',
                'Matematik': 'MM',
                'Sains': 'SAINS',
                'Sejarah': 'SEJ',
                'Pendidikan Islam': 'PAI',
                'Moral': 'PM',
                'RBT': 'RBT',
                'Bahasa Arab': 'AR',
                'PSV': 'PSV',
                'Muzik': 'PMZ',
                'PJPK': 'PJPK'
              };
              const expectedAbbr = headerMapping[sub];
              if (expectedAbbr) {
                 foundKey = Object.keys(row).find(k => k.trim().toUpperCase() === expectedAbbr);
              }
            }
            
            if (foundKey && row[foundKey]) {
              const rawValue = String(row[foundKey]).toUpperCase().replace('TP', '').trim();
              const val = parseInt(rawValue);
              if (!isNaN(val) && val >= 1 && val <= 6) {
                mpScores[sub] = val;
              }
            }
          });

          return {
            id: `${Date.now()}-${idx}`,
            pbdType,
            tahap: activeTahap,
            kelas: selectedClass,
            nama: name,
            mataPelajaran: mpScores
          };
        });

        await uploadPBDData(newStudents);
        e.target.value = ''; // clear
      } catch (err) {
        console.error("Error parsing excel:", err);
        alert("Ralat semasa membaca fail excel. Sila pastikan format betul (Pengepala: Nama, Bahasa Melayu, dll).");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const computeClassStats = () => {
    if (!isDataUploaded) return null;
    
    // For each subject, find top TP and lowest TP students
    return subjects.map(sub => {
      const validStudents = existingData.filter(s => s.mataPelajaran[sub] !== undefined);
      if (validStudents.length === 0) return null;

      let highestTP = -1;
      let lowestTP = 7;

      validStudents.forEach(s => {
        const val = s.mataPelajaran[sub];
        if (val > highestTP) highestTP = val;
        if (val < lowestTP) lowestTP = val;
      });

      const bestStudents = validStudents.filter(s => s.mataPelajaran[sub] === highestTP).map(s => s.nama);
      const needHelpStudents = validStudents.filter(s => s.mataPelajaran[sub] === lowestTP).map(s => s.nama);

      return {
        subject: sub,
        highestTP,
        lowestTP,
        bestStudents,
        needHelpStudents,
        totalTakers: validStudents.length
      };
    }).filter(Boolean);
  };

  const stats = computeClassStats();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6 mb-8">
        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Tetapan Sistem</h2>
          <p className="text-slate-500">Muat naik dan urus pangkalan data markah Tahap Penguasaan (TP) mengikut sesi PBD.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Sesi PBD Untuk Dimuat Naik</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPbdType('PBD1')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                pbdType === 'PBD1' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              PBD Pertengahan
            </button>
            <button
              onClick={() => setPbdType('PBD2')}
              className={`py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                pbdType === 'PBD2' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              PBD Akhir
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-4">Kawalan Sistem Pengisian (Borang Intervensi)</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">PBD Pertengahan</span>
                <button
                  onClick={togglePbd1}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pbdControl.pbd1Open ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`${pbdControl.pbd1Open ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
              </div>
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-sm font-semibold text-slate-700">PBD Akhir</span>
                <button
                  onClick={togglePbd2}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${pbdControl.pbd2Open ? 'bg-emerald-500' : 'bg-slate-300'}`}
                >
                  <span className={`${pbdControl.pbd2Open ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {(['Tahap 1', 'Tahap 2'] as const).map(tahap => (
          <button
            key={tahap}
            onClick={() => setActiveTahap(tahap)}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors ${
              activeTahap === tahap 
                ? 'border-gold-500 text-blue-900' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tahap}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Class Selector Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="font-bold text-slate-700 mb-4 px-2">Pilih Kelas</h3>
          {classes.map(c => {
             const hasData = studentsPBD.some(s => s.pbdType === pbdType && s.kelas === c);
             return (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between ${
                  selectedClass === c
                    ? 'bg-blue-900 text-white shadow-md'
                    : hasData 
                      ? 'bg-blue-50 text-blue-900 hover:bg-blue-100' 
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {c}
                {hasData && (
                  <span className={`w-2 h-2 rounded-full ${selectedClass === c ? 'bg-gold-400' : 'bg-blue-500'}`} />
                )}
              </button>
             )
          })}
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[200px]">
            {isDataUploaded ? (
              <div className="w-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Data Kelas: {selectedClass}</h3>
                    <p className="text-slate-500 text-sm">Jumlah rekod: {existingData.length} orang murid</p>
                  </div>
                  {isAdmin && (
                    <button 
                      onClick={() => deletePBDClass(pbdType, selectedClass)}
                      className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Batal Muat Naik
                    </button>
                  )}
                </div>

                {stats && stats.length > 0 ? (
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Analisis Tertinggi & Terendah</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.map((s: any) => (
                        <div key={s.subject} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <h5 className="font-bold text-blue-900 mb-3">{s.subject}</h5>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center gap-2 text-emerald-700 text-sm font-bold mb-1">
                                <Trophy className="w-4 h-4" /> 
                                TP {s.highestTP} (Tertinggi)
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {s.bestStudents.length > 0 ? s.bestStudents.join(', ') : 'Tiada data'}
                              </p>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 text-red-600 text-sm font-bold mb-1">
                                <ArrowDown className="w-4 h-4" /> 
                                TP {s.lowestTP} (Terendah)
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-2">
                                {s.needHelpStudents.length > 0 ? s.needHelpStudents.join(', ') : 'Tiada data'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-amber-50 text-amber-800 rounded-xl">
                    Sistem tidak menjumpai lajur subjek di dalam fail excel untuk kelas ini. Sila pastikan pengepala (header) mempunyai nama subjek yang tepat (cth: Bahasa Melayu).
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center w-full max-w-md mx-auto">
                {isAdmin ? (
                  <>
                    <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Muat Naik Data {selectedClass}</h3>
                    <p className="text-sm text-slate-500 mb-6">Sila muat naik fail excel (.xlsx, .xls) yang mengandungi senarai nama dan markah TP bagi mata pelajaran.</p>
                    
                    <label className="cursor-pointer inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-md transition-all">
                      <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                      />
                      <span>{isUploading ? "Memuat Naik..." : "Pilih Fail Excel"}</span>
                    </label>

                    <div className="mt-8 text-left bg-slate-50 p-4 rounded-xl text-xs text-slate-600 space-y-2 border border-slate-100">
                      <p className="font-bold text-slate-800">Format Excel yang disokong:</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li>Baris pertama mesti mengandungi tajuk lajur (Header).</li>
                        <li>Wajib ada lajur: <b>Nama</b> (atau NAMA).</li>
                        <li>Lajur markah menggunakan nama subjek penuh (cth: <b>Bahasa Melayu</b>) atau singkatan (cth: <b>BM, BI, MM, SAINS</b>).</li>
                        <li>Isi data kelas bagi murid dengan nombor TP (1 hingga 6) atau format (<b>TP1 hingga TP6</b>).</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="py-12">
                    <h3 className="font-bold text-lg text-slate-900 mb-2">Tiada Rekod Data PBD</h3>
                    <p className="text-slate-500">Data untuk kelas ini belum dimuat naik oleh pentadbir (Admin).</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
