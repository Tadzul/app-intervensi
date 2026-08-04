import React, { useState, useEffect, useMemo } from 'react';
import { useDataStore } from '../store/useDataStore';
import { Plus, Trash2, Edit2, Save, X, Loader2, ChevronLeft, ChevronRight, Search, UserCheck } from 'lucide-react';

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

const CARD_THEMES = [
  { wrapper: "border-blue-100 hover:border-blue-300", header: "bg-gradient-to-r from-blue-50 to-white border-b-blue-100", title: "text-blue-900", body: "bg-blue-50/40" },
  { wrapper: "border-emerald-100 hover:border-emerald-300", header: "bg-gradient-to-r from-emerald-50 to-white border-b-emerald-100", title: "text-emerald-900", body: "bg-emerald-50/40" },
  { wrapper: "border-purple-100 hover:border-purple-300", header: "bg-gradient-to-r from-purple-50 to-white border-b-purple-100", title: "text-purple-900", body: "bg-purple-50/40" },
  { wrapper: "border-amber-100 hover:border-amber-300", header: "bg-gradient-to-r from-amber-50 to-white border-b-amber-100", title: "text-amber-900", body: "bg-amber-50/40" },
  { wrapper: "border-rose-100 hover:border-rose-300", header: "bg-gradient-to-r from-rose-50 to-white border-b-rose-100", title: "text-rose-900", body: "bg-rose-50/40" },
  { wrapper: "border-indigo-100 hover:border-indigo-300", header: "bg-gradient-to-r from-indigo-50 to-white border-b-indigo-100", title: "text-indigo-900", body: "bg-indigo-50/40" }
];

export default function TeacherRegistration() {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher, addSubject, deleteSubject, isAdmin } = useDataStore();
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [activeSubjectDropdown, setActiveSubjectDropdown] = useState<string | null>(null);

  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');

  const [sTahap, setSTahap] = useState('Tahap 1');
  const [sKelas, setSKelas] = useState('');
  const [sMatapel, setSMatapel] = useState('');
  const [sPbdType, setSPbdType] = useState<'PBD Pertengahan' | 'PBD Akhir'>('PBD Pertengahan');

  const [teacherList, setTeacherList] = useState<string[]>([]);
  const [isFetchingTeachers, setIsFetchingTeachers] = useState(false);
  const [activeNameDropdown, setActiveNameDropdown] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 60];

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    if (!searchQuery.trim()) return sortedTeachers;
    const q = searchQuery.toLowerCase().trim();
    return sortedTeachers.filter(t => {
      const nameMatch = (t.name || '').toLowerCase().includes(q);
      const emailMatch = (t.email || '').toLowerCase().includes(q);
      const teacherSubjs = subjects.filter(s => String(s.teacherId) === String(t.id));
      const subjMatch = teacherSubjs.some(s => 
        s.kelas.toLowerCase().includes(q) || 
        s.mataPelajaran.toLowerCase().includes(q)
      );
      return nameMatch || emailMatch || subjMatch;
    });
  }, [sortedTeachers, searchQuery, subjects]);

  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTeachers = filteredTeachers.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [filteredTeachers.length, currentPage, totalPages]);

  useEffect(() => {
    async function loadTeachers() {
      setIsFetchingTeachers(true);
      try {
        const res = await fetch(TEACHER_CSV_URL);
        const text = await res.text();
        const rows = text.split('\n').map(row => row.split(',')[0].trim()).filter(Boolean);
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
    
    // Check if the same subject is registered for the same class and same PBD by any teacher
    const exists = subjects.some(s => s.kelas === sKelas && s.mataPelajaran === sMatapel && s.pbdType === sPbdType);
    if (exists) {
      alert(`Mata pelajaran '${sMatapel}' untuk kelas '${sKelas}' pada sesi '${sPbdType}' telah didaftarkan. Anda tidak boleh daftar subjek yang sama dalam satu kelas untuk sesi yang sama.`);
      return;
    }

    addSubject({
      id: Date.now().toString(),
      teacherId,
      tahap: sTahap,
      kelas: sKelas,
      mataPelajaran: sMatapel,
      pbdType: sPbdType
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

      {/* Carian Guru & Pagination Limit Section */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari guru berdaftar (taip nama, emel, atau subjek)..."
            className="w-full pl-11 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-medium text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
              title="Kosongkan carian"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-end sm:self-center">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
            <span>Papar:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
            >
              {PAGE_SIZE_OPTIONS.map(size => (
                <option key={size} value={size}>{size} / ms</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-100">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>
              {searchQuery ? (
                <>Dijumpai: <strong className="text-amber-600">{filteredTeachers.length}</strong> daripada {teachers.length} guru</>
              ) : (
                <>Jumlah Guru: <strong className="text-slate-900">{teachers.length}</strong> orang</>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {currentTeachers.length === 0 && (
          <div className="bg-white p-10 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
            <Search className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-base">Tiada Guru Dijumpai</h4>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Tiada nama guru atau subjek yang sepadan dengan carian <span className="font-semibold text-slate-800">"{searchQuery}"</span>. Sila cuba kata kunci lain.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold text-xs rounded-xl transition-all"
            >
              Reset Carian
            </button>
          </div>
        )}

        {currentTeachers.map((teacher, index) => {
          const teacherSubjects = subjects.filter(s => String(s.teacherId) === String(teacher.id));
          const isEditing = String(editingTeacherId) === String(teacher.id);
          const theme = CARD_THEMES[index % CARD_THEMES.length];

          return (
            <div key={teacher.id} className={`bg-white rounded-2xl shadow-sm border overflow-visible transition-all duration-300 hover:shadow-md relative z-10 ${theme.wrapper}`}>
              {/* Teacher Header */}
              <div className={`p-5 sm:p-6 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-t-2xl ${theme.header}`}>
                <div>
                  <h3 className={`text-lg font-bold ${theme.title}`}>{teacher.name}</h3>
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
              <div className={`p-4 sm:p-6 rounded-b-2xl ${theme.body}`}>
                <h4 className="text-sm font-semibold text-slate-700 mb-4">Senarai Kelas & Subjek</h4>
                
                {teacherSubjects.length > 0 ? (
                  <div className="overflow-x-auto mb-6 rounded-lg border border-slate-200/60 bg-white/50 backdrop-blur-sm shadow-sm opacity-90">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-white/60 text-slate-600 uppercase border-b border-slate-200/60">
                        <tr>
                          <th className="px-4 py-3 font-medium">Sesi</th>
                          <th className="px-4 py-3 font-medium">Tahap</th>
                          <th className="px-4 py-3 font-medium">Kelas</th>
                          <th className="px-4 py-3 font-medium">Mata Pelajaran</th>
                          <th className="px-4 py-3 font-medium text-right">Tindakan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white/80">
                        {teacherSubjects.map(sub => (
                          <tr key={sub.id} className="hover:bg-white transition-colors">
                            <td className="px-4 py-3 font-medium text-blue-600">{sub.pbdType}</td>
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
                <div className="flex flex-col sm:flex-row gap-4 items-end p-5 mt-4 border border-slate-200/50 rounded-xl bg-white/40 shadow-sm backdrop-blur-sm">
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Sesi PBD</label>
                    <select 
                      value={sPbdType}
                      onChange={e => setSPbdType(e.target.value as 'PBD Pertengahan' | 'PBD Akhir')}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-500 focus:border-gold-500 bg-white shadow-sm"
                    >
                      <option value="PBD Pertengahan">PBD Pertengahan</option>
                      <option value="PBD Akhir">PBD Akhir</option>
                    </select>
                  </div>
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

        {filteredTeachers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 bg-white p-4 sm:px-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-wrap items-center gap-3 text-center sm:text-left">
              <span className="text-sm text-slate-500">
                Memaparkan <span className="font-bold text-slate-900">{filteredTeachers.length > 0 ? startIndex + 1 : 0}</span> hingga <span className="font-bold text-slate-900">{Math.min(startIndex + itemsPerPage, filteredTeachers.length)}</span> daripada <span className="font-bold text-slate-900">{filteredTeachers.length}</span> guru {searchQuery && `(daripada ${teachers.length} keseluruhan)`}
              </span>

              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Papar:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-amber-500"
                >
                  {PAGE_SIZE_OPTIONS.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 font-medium">rekod sehalaman</span>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center px-4 font-semibold text-sm text-slate-700 whitespace-nowrap">
                Halaman {currentPage} / {totalPages}
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
