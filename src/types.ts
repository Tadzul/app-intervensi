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
