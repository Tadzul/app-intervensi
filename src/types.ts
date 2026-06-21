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
  pbdType: 'PBD1' | 'PBD2';
}

export interface Intervention {
  id: string;
  date: string; // ISO date string
  teacherId: string;
  tahap: string;
  kelas: string;
  mataPelajaran: string;
  pbdType: 'PBD1' | 'PBD2';
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
  pbdType: 'PBD1' | 'PBD2';
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
