import React, { useState, useEffect } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Plus, Trash2, Edit2, Save, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const CLASSES = [
  "1 Bitara", "1 Dinamik", "1 Intelek", "1 Pintar",
  "2 Bitara", "2 Dinamik", "2 Intelek", "2 Pintar",
  "3 Bitara", "3 Dinamik", "3 Intelek", "3 Pintar",
  "4 Bitara", "4 Dinamik", "4 Intelek", "4 Pintar",
  "5 Bitara", "5 Dinamik", "5 Intelek", "5 Pintar",
  "6 Bitara", "6 Dinamik", "6 Intelek", "6 Pintar", "6 Mahir"
];

const SUBJECTS = [
  "Bahasa Melayu", "Bahasa Inggeris", "Matematik", "Sains",
  "Pendidikan Islam", "Bahasa Arab", "PSV", "Moral", "PJPK", "Jawi",
  "Muzik", "RBT", "Sejarah"
];

const TEACHER_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlI0JjpoVeIRm94wjOh3G_0zn-2lyZqFJ5x96O73YBpIejb6gcgPmCxjBEiY6BnUINmU71VgMlFfbn/pub?gid=1353344496&single=true&output=csv";

export default function TeacherRegistration() {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher, addSubject, deleteSubject, isAdmin } = useDataStore();
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [activeSubjectDropdown, setActiveSubjectDropdown] = useState<string | null>(null);

  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');

  const [sTahap, setSTahap] = useState('Tahap 1');
  const [sKelas, setSKelas] = useState('');
  const [sMatapel, setSMatapel] = useState('');

  const [teacherList, setTeacherList] = useState<string[]>([]);
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(false);
  const [activeNameDropdown, setActiveNameDropdown] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const totalPages = Math.ceil(teachers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const sortedTeachers = [...teachers].sort((a, b) => a.name.localeCompare(b.name));
  const currentTeachers = sortedTeachers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [teachers.length, currentPage, totalPages]);

  useEffect(() => {
    async function loadTeachers() {
      setIsFetchingTeachers(true);
      try {
        const res = await fetch(TEACHER_CSV_URL);
        const text = await res.text();
        // Assuming CSV is a single column or first column contains names
        // Splitting by newline and removing headers/empty rows
        const rows = text.split('\n').map(row => row.split(',')[0].trim()).filter(Boolean);
        // Remove header if exists, usually "Name" or "Nama"
        if (rows.length > 0 && (rows[0].toLowerCase() === 'name' || rows[0].toLowerCase() === 'nama')) {
          rows.shift();
        }
        setTeacherList(rows);
      } catch (error) {
        console.error("Gagal memuat turun senarai guru:", error);
      } finally {
        setIsFetchingTeachers(false);
      }
    }
    loadTeachers();
  }, []);

  const handleAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName) return;
    const newId = Date.now().toString();
    addTeacher({ id: newId, name: tName, email: tEmail });
    setTName('');
    setTEmail('');
    setActiveNameDropdown(false);
  };

  const handleAddSubject = (teacherId: string) => {
    if (!sKelas || !sMatapel) return;
    addSubject({
      id: Date.now().toString(),
      teacherId,
      tahap: sTahap,
      kelas: sKelas,
      mataPelajaran: sMatapel
    });
    setSKelas('');
    setSMatapel('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Pendaftaran Guru</h2>
        <p className="text-slate-500">Sila daftar maklumat guru dan subjek yang diajar sebelum mengisi borang.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible transition-all duration-300 hover:shadow-lg relative z-20">
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
          <h3 className="font-bold text-slate-800">Tambah Guru Baru</h3>
        </div>
        <form onSubmit={handleAddTeacher} className="p-6 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5 w-full relative">
            <label className="text-sm font-semibold text-slate-700">Nama Guru</label>
            <input 
              type="text" 
              required
              value={tName}
              onChange={e => {
                setTName(e.target.value);
                setActiveNameDropdown(true);
              }}
              onFocus={() => setActiveNameDropdown(true)}
              onBlur={() => setTimeout(() => setActiveNameDropdown(false), 200)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all"
              placeholder="Sila taip nama guru..."
            />
            {isFetchingTeachers && (
              <div className="absolute right-3 top-9">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}
            {activeNameDropdown && tName.length > 0 && teacherList.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto top-full left-0 hidden-scrollbar">
                {teacherList
                  .filter(name => name.toLowerCase().includes(tName.toLowerCase()))
                  .map((name, idx, arr) => (
                  <div 
                    key={idx}
                    className={`px-4 py-2.5 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors ${idx !== arr.length - 1 ? 'border-b border-slate-50' : ''}`}
                    onClick={() => {
                      setTName(name);
                      setActiveNameDropdown(false);
                    }}
                  >
                    {name}
                  </div>
                ))}
                {teacherList.filter(name => name.toLowerCase().includes(tName.toLowerCase())).length === 0 && (
                  <div className="px-4 py-3 text-sm text-slate-500 italic">Tiada padanan dengan '{tName}'</div>
                )}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1.5 w-full">
            <label className="text-sm font-semibold text-slate-700">Emel <span className="text-slate-400 font-normal">(Pilihan)</span></label>
            <input 
              type="email" 
              value={tEmail}
              onChange={e => setTEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold-500 focus:bg-white transition-all text-slate-600"
              placeholder="Contoh: ahmad@moe-dl.edu.my"
            />
          </div>
          <button 
            type="submit"
            className="w-full sm:w-auto px-8 py-2.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-700 font-semibold transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Daftar Guru
          </button>
        </form>
      </div>

      <div className="space-y-6">
        {currentTeachers.map(teacher => {
          const teacherSubjects = subjects.filter(s => String(s.teacherId) === String(teacher.id));
          const isEditing = String(editingTeacherId) === String(teacher.id);

          return (
            <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible transition-all duration-300 hover:shadow-md relative z-10">
              {/* Teacher Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{teacher.name}</h3>
                  <p className="text-sm text-slate-500">{teacher.email}</p>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => deleteTeacher(teacher.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-2 w-fit"
                  >
                    <Trash2 className="w-4 h-4" /> Padam Guru
                  </button>
                )}
              </div>

              {/* Subjects List & Add form */}
              <div className="p-4 sm:p-6 bg-slate-50/50 rounded-b-2xl">
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Senarai Kelas & Subjek</h4>
                
                {teacherSubjects.length > 0 ? (
                  <div className="overflow-x-auto mb-6 rounded-lg border border-slate-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-100 text-slate-600 uppercase">
                        <tr>
                          <th className="px-4 py-3 font-medium">Tahap</th>
                          <th className="px-4 py-3 font-medium">Kelas</th>
                          <th className="px-4 py-3 font-medium">Mata Pelajaran</th>
                          <th className="px-4 py-3 font-medium text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 bg-white">
                        {teacherSubjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3">{sub.tahap}</td>
                            <td className="px-4 py-3 font-medium">{sub.kelas}</td>
                            <td className="px-4 py-3">{sub.mataPelajaran}</td>
                            <td className="px-4 py-3 text-right">
                              {isAdmin && (
                                <button 
                                  onClick={() => deleteSubject(sub.id)}
                                  className="text-red-500 hover:text-red-700 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-6 italic">Belum ada kelas didaftarkan.</p>
                )}

                {/* Add Subject inline form */}
                <div className="flex flex-col sm:flex-row gap-4 items-end p-5 mt-4 border border-slate-100 rounded-xl bg-slate-50/50 shadow-inner">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tahap</label>
                    <select 
                      value={sTahap}
                      onChange={e => setSTahap(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white shadow-sm"
                    >
                      <option value="Tahap 1">Tahap 1</option>
                      <option value="Tahap 2">Tahap 2</option>
                    </select>
                  </div>
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tahun / Kelas</label>
                    <select 
                      value={sKelas}
                      onChange={e => setSKelas(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white shadow-sm"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {CLASSES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-full space-y-1.5 relative">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Mata Pelajaran</label>
                    <input 
                      type="text" 
                      value={sMatapel}
                      onChange={e => {
                        setSMatapel(e.target.value);
                        setActiveSubjectDropdown(teacher.id);
                      }}
                      onFocus={() => setActiveSubjectDropdown(teacher.id)}
                      onBlur={() => setTimeout(() => setActiveSubjectDropdown(null), 200)}
                      placeholder="Taip untuk cari subjek..."
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white shadow-sm"
                    />
                    {activeSubjectDropdown === teacher.id && sMatapel.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto top-full left-0 hidden-scrollbar">
                        {SUBJECTS.filter(s => s.toLowerCase().includes(sMatapel.toLowerCase())).map(sub => (
                          <div 
                            key={sub}
                            className="px-4 py-2 text-sm hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors"
                            onClick={() => {
                              setSMatapel(sub);
                              setActiveSubjectDropdown(null);
                            }}
                          >
                            {sub}
                          </div>
                        ))}
                        {SUBJECTS.filter(s => s.toLowerCase().includes(sMatapel.toLowerCase())).length === 0 && (
                          <div className="px-4 py-2 text-sm text-slate-500 italic">Tiada padanan</div>
                        )}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => handleAddSubject(teacher.id)}
                    disabled={!sKelas || !sMatapel}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2 text-sm"
                  >
                    <Plus className="w-4 h-4" /> Tambah Subjek
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 sm:px-6 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-sm text-slate-500 text-center sm:text-left">
              Memaparkan <span className="font-bold text-slate-900">{startIndex + 1}</span> hingga <span className="font-bold text-slate-900">{Math.min(startIndex + ITEMS_PER_PAGE, teachers.length)}</span> daripada <span className="font-bold text-slate-900">{teachers.length}</span> guru
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center px-4 font-semibold text-sm text-slate-700">
                {currentPage} / {totalPages}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Seterusnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
