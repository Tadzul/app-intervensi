export interface Teacher {
  id: string;
  name: string;
  email: string;
}

export interface TeacherSubject {
  id: string;
  teacherId: string;
  tahap: string;
  kelas: string;
  mataPelajaran: string;
  pbdType: 'PBD Pertengahan' | 'PBD Akhir';
}

export interface Intervention {
  id: string;
  date: string; // ISO date string
  teacherId: string;
  tahap: string;
  kelas: string;
  mataPelajaran: string;
  pbdType: 'PBD Pertengahan' | 'PBD Akhir';
  tp1: number;
  tp2: number;
  tp3: number;
  tp4: number;
  tp5: number;
  tp6: number;
  tajukBelumDikuasai: string;
  punca: string[];
  puncaLain: string;
  isu: string;
  pelanIntervensi: string;
  pelanIntervensiLain: string;
  catatan: string;
}

export interface StudentPBD {
  id: string;
  pbdType: 'PBD Pertengahan' | 'PBD Akhir';
  tahap: string;
  kelas: string;
  nama: string;
  mataPelajaran: Record<string, number>;
}

export const TAHAP1_CLASSES = [
  "1 Bitara", "1 Dinamik", "1 Intelek", "1 Pintar",
  "2 Bitara", "2 Dinamik", "2 Intelek", "2 Pintar",
  "3 Bitara", "3 Dinamik", "3 Intelek", "3 Pintar"
];

export const TAHAP2_CLASSES = [
  "4 Bitara", "4 Dinamik", "4 Intelek", "4 Pintar",
  "5 Bitara", "5 Dinamik", "5 Intelek", "5 Pintar",
  "6 Bitara", "6 Dinamik", "6 Intelek", "6 Pintar", "6 Mahir"
];

export const TAHAP1_SUBJECTS = [
  "Bahasa Melayu", "Bahasa Inggeris", "Matematik", "Sains", "PSV", 
  "Bahasa Arab", "PJPK", "Moral", "Muzik", "Pendidikan Islam"
];

export const TAHAP2_SUBJECTS = [
  "Bahasa Melayu", "Bahasa Inggeris", "Matematik", "Sains", "PSV", 
  "Bahasa Arab", "PJPK", "Moral", "Muzik", "Pendidikan Islam", "RBT", "Sejarah"
];

export const PANITIA_LIST = [
  "PANITIA BAHASA MELAYU",
  "PANITIA BAHASA INGGERIS",
  "PANITIA SAINS",
  "PANITIA MATEMATIK",
  "PANITIA SEJARAH",
  "PANITIA AGAMA ISLAM",
  "PANITIA PJPK",
  "PANITIA MUZIK",
  "PANITIA RBT",
  "PANITIA BAHASA ARAB",
  "PANITIA PSV",
  "PANITIA MORAL"
] as const;

export function canonicalSubjectName(subject: string): string {
  if (!subject) return '';
  const s = subject.toLowerCase().trim().replace(/\s+/g, ' ');

  if (s === 'bm' || s.includes('bahasa melayu') || s.includes('bahasa malaysia') || s === 'b.melayu' || s === 'b melayu') {
    return 'Bahasa Melayu';
  }
  if (s === 'bi' || s.includes('bahasa inggeris') || s.includes('english') || s === 'b.inggeris' || s === 'b inggeris') {
    return 'Bahasa Inggeris';
  }
  if (s === 'mt' || s.includes('matematik') || s.includes('math')) {
    return 'Matematik';
  }
  if (s === 'sn' || s.includes('sains') || s.includes('science')) {
    return 'Sains';
  }
  if (s === 'ba' || s.includes('bahasa arab') || s === 'b.arab' || s === 'b arab') {
    return 'Bahasa Arab';
  }
  if (s === 'pi' || s === 'pa' || s.includes('pendidikan islam') || s.includes('agama islam') || s.includes('pend islam')) {
    return 'Pendidikan Islam';
  }
  if (s === 'pjpk' || s === 'pjk' || s === 'pj' || s === 'pk' || s.includes('jasmani') || s.includes('kesihatan')) {
    return 'PJPK';
  }
  if (s === 'psv' || s.includes('seni') || s.includes('visual') || s === 'p.seni') {
    return 'PSV';
  }
  if (s === 'rbt' || s.includes('reka bentuk')) {
    return 'RBT';
  }
  if (s === 'sej' || s.includes('sejarah')) {
    return 'Sejarah';
  }
  if (s === 'muzik' || s.includes('muzik') || s === 'mz') {
    return 'Muzik';
  }
  if (s === 'moral' || s.includes('moral')) {
    return 'Moral';
  }

  return subject.trim();
}

export function isSameSubject(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a.toLowerCase().trim() === b.toLowerCase().trim()) return true;
  return canonicalSubjectName(a) === canonicalSubjectName(b);
}

export function getSubjectTP(
  mataPelajaranMap: Record<string, number> | undefined, 
  targetSubject: string
): number | undefined {
  if (!mataPelajaranMap || typeof mataPelajaranMap !== 'object') return undefined;

  if (mataPelajaranMap[targetSubject] !== undefined) {
    const val = Number(mataPelajaranMap[targetSubject]);
    if (!isNaN(val) && val > 0) return val;
  }

  const targetClean = targetSubject.toLowerCase().trim();
  const targetCanon = canonicalSubjectName(targetSubject);
  const keys = Object.keys(mataPelajaranMap);

  for (const k of keys) {
    if (k.toLowerCase().trim() === targetClean) {
      const val = Number(mataPelajaranMap[k]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  for (const k of keys) {
    if (canonicalSubjectName(k) === targetCanon) {
      const val = Number(mataPelajaranMap[k]);
      if (!isNaN(val) && val > 0) return val;
    }
  }

  return undefined;
}

export function matchesPanitia(subjectName: string, panitiaName: string): boolean {
  if (!subjectName) return false;
  if (!panitiaName || panitiaName === "Semua Panitia") return true;

  const s = subjectName.toLowerCase().trim();
  const p = panitiaName.toUpperCase().trim();

  if (p === "PANITIA BAHASA MELAYU") {
    return s.includes("bahasa melayu") || s === "bm";
  }
  if (p === "PANITIA BAHASA INGGERIS") {
    return s.includes("bahasa inggeris") || s === "bi" || s.includes("english");
  }
  if (p === "PANITIA SAINS") {
    return s.includes("sains") || s === "sn" || s.includes("science");
  }
  if (p === "PANITIA MATEMATIK") {
    return s.includes("matematik") || s === "mt" || s.includes("math");
  }
  if (p === "PANITIA SEJARAH") {
    return s.includes("sejarah") || s === "sej";
  }
  if (p === "PANITIA AGAMA ISLAM") {
    return s.includes("pendidikan islam") || s.includes("agama islam") || s.includes("pi") || s === "pa";
  }
  if (p === "PANITIA PJPK") {
    return s.includes("pjpk") || s.includes("pj") || s.includes("pk") || s.includes("jasmani") || s.includes("kesihatan");
  }
  if (p === "PANITIA MUZIK") {
    return s.includes("muzik");
  }
  if (p === "PANITIA RBT") {
    return s.includes("rbt") || s.includes("reka bentuk");
  }
  if (p === "PANITIA BAHASA ARAB") {
    return s.includes("bahasa arab") || s === "ba";
  }
  if (p === "PANITIA PSV") {
    return s.includes("psv") || s.includes("seni") || s.includes("visual");
  }
  if (p === "PANITIA MORAL") {
    return s.includes("moral");
  }

  const cleanP = p.replace("PANITIA ", "").toLowerCase();
  return s.includes(cleanP) || cleanP.includes(s);
}

export function resolveTeacherName(
  teacherId: string, 
  teachers: Teacher[], 
  subjects?: TeacherSubject[], 
  interventions?: Intervention[]
): string {
  if (!teacherId) return 'Guru Tidak Dinyatakan';
  const tid = String(teacherId).trim();
  
  // 1. Match by ID
  const byId = teachers.find(t => String(t.id).trim() === tid);
  if (byId && byId.name) return byId.name;
  
  // 2. Match by Name
  const tidLower = tid.toLowerCase();
  const byName = teachers.find(t => t.name.toLowerCase().trim() === tidLower);
  if (byName && byName.name) return byName.name;

  // 3. Match by Email
  const byEmail = teachers.find(t => t.email && t.email.toLowerCase().trim() === tidLower);
  if (byEmail && byEmail.name) return byEmail.name;

  // 4. Cross reference subjects if provided
  if (subjects && subjects.length > 0) {
    const subMatch = subjects.find(s => String(s.teacherId).trim() === tid);
    if (subMatch) {
      const t = teachers.find(x => String(x.id).trim() === String(subMatch.teacherId).trim() || x.name.toLowerCase().trim() === String(subMatch.teacherId).toLowerCase().trim());
      if (t && t.name) return t.name;
    }
  }

  // 5. Cross reference interventions if provided
  if (interventions && interventions.length > 0) {
    const invMatch = interventions.find(i => String(i.teacherId).trim() === tid);
    if (invMatch) {
      // Check if another teacher in `teachers` list matches this intervention's mataPelajaran and kelas from subjects
      if (subjects && subjects.length > 0) {
        const matchingSubject = subjects.find(s => s.kelas === invMatch.kelas && s.mataPelajaran === invMatch.mataPelajaran);
        if (matchingSubject) {
          const t = teachers.find(x => String(x.id).trim() === String(matchingSubject.teacherId).trim() || x.name.toLowerCase().trim() === String(matchingSubject.teacherId).toLowerCase().trim());
          if (t && t.name) return t.name;
        }
      }
    }
  }

  // 6. If tid is a numeric string (like timestamp 1782317403029)
  if (/^\d+$/.test(tid)) {
    // Check if any teacher in `teachers` list has a partial ID match
    const partialMatch = teachers.find(t => String(t.id).trim().includes(tid) || tid.includes(String(t.id).trim()));
    if (partialMatch && partialMatch.name) return partialMatch.name;
  }

  // 7. Fallback: Return tid
  return tid;
}

export function isInterventionByTeacher(inv: Intervention, teacher: Teacher, subjects?: TeacherSubject[]): boolean {
  if (!inv || !teacher) return false;
  const invTid = String(inv.teacherId || '').trim();
  if (!invTid) return false;

  const tId = String(teacher.id).trim();
  const tName = teacher.name.toLowerCase().trim();
  const tEmail = teacher.email ? teacher.email.toLowerCase().trim() : '';

  if (invTid === tId) return true;
  if (invTid.toLowerCase() === tName) return true;
  if (tEmail && invTid.toLowerCase() === tEmail) return true;

  // Cross reference with subjects if available
  if (subjects && subjects.length > 0) {
    const teacherSubjects = subjects.filter(s => String(s.teacherId).trim() === tId || s.teacherId.toLowerCase().trim() === tName);
    const isSubjectMatch = teacherSubjects.some(s => s.kelas === inv.kelas && isSameSubject(s.mataPelajaran, inv.mataPelajaran));
    if (isSubjectMatch) return true;
  }

  return false;
}

export const PUNCA_OPTIONS = [
  "Kehadiran Murid Rendah",
  "Tidak Menyiapkan Latihan",
  "Kurang Motivasi",
  "Masalah Membaca",
  "Masalah Menulis",
  "Masalah Mengira",
  "Kurang Sokongan Ibu Bapa",
  "Tidak Fokus",
  "Faktor Kesihatan",
  "Penguasaan Asas Lemah",
  "Faktor Bahasa"
];

export const PELAN_OPTIONS = [
  "Kelas Pemulihan",
  "Bimbingan Individu",
  "Program Mentor Mentee",
  "Latih Tubi",
  "Modul Khas"
];
