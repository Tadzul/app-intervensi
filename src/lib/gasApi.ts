import { Teacher, TeacherSubject, Intervention } from '../types';

export const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbx-_zGV8XwFiW6jiiBUYO5q4-ZLA1aVyuRhSMcu77LBcZkmOxRjE0Z-XBssaHs_tzxL/exec";
export const TEACHERS_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlI0JjpoVeIRm94wjOh3G_0zn-2lyZqFJ5x96O73YBpIejb6gcgPmCxjBEiY6BnUINmU71VgMlFfbn/pub?gid=1610694992&single=true&output=csv";

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result.map(s => s.replace(/^"|"$/g, '').trim());
}

export async function fetchTeachersCSV(): Promise<Teacher[]> {
  try {
    const res = await fetch(`${TEACHERS_CSV_URL}&_t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const text = await res.text();
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const teachers: Teacher[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length === 0) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h.trim().toLowerCase()] = values[idx] ? values[idx].trim() : '';
      });

      const name = row['name'] || row['nama'] || row['nama guru'] || row['nama_guru'] || values[1] || values[0] || '';
      const email = row['email'] || row['emel'] || row['email guru'] || row['email_guru'] || values[2] || '';
      const id = row['id'] || row['id_guru'] || String(i);

      if (name && name.toLowerCase() !== 'nama' && name.toLowerCase() !== 'nama guru') {
        teachers.push({
          id: String(id),
          name: name.trim(),
          email: email.trim()
        });
      }
    }
    return teachers;
  } catch (err) {
    console.error("Failed to fetch teachers CSV:", err);
    return [];
  }
}

export async function fetchSheetData(sheetName: string) {
  if (!GAS_URL) return [];
  try {
    const response = await fetch(`${GAS_URL}?action=get&sheetName=${sheetName}&_t=${Date.now()}`, {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const json = await response.json();
    if (json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
  } catch (error) {
    console.error(`Failed to fetch data for ${sheetName}:`, error);
  }
  return [];
}

export async function postSheetData(action: 'add' | 'update' | 'delete' | 'addBatch' | 'deleteClassPBD', sheetName: string, payloadData: any) {
  if (!GAS_URL) return null;
  try {
    let finalPayloadData = payloadData;
    
    // Stringify array fields if needed so they can be saved in Sheets
    if (action === 'add' || action === 'update') {
      const formattedData = { ...payloadData };
      if (formattedData.punca && Array.isArray(formattedData.punca)) {
        formattedData.punca = JSON.stringify(formattedData.punca);
      }
      // If mataPelajaran is an object
      if (formattedData.mataPelajaran && typeof formattedData.mataPelajaran === 'object') {
        formattedData.mataPelajaran = JSON.stringify(formattedData.mataPelajaran);
      }
      finalPayloadData = formattedData;
    } else if (action === 'addBatch') {
      finalPayloadData = payloadData.map((row: any) => {
        const formattedRow = { ...row };
        if (formattedRow.mataPelajaran && typeof formattedRow.mataPelajaran === 'object') {
          formattedRow.mataPelajaran = JSON.stringify(formattedRow.mataPelajaran);
        }
        return formattedRow;
      });
    }

    // payloadData might be { pbdType, kelas } for deleteClassPBD
    const bodyObj: any = {
      action,
      sheetName,
      ...((action === 'deleteClassPBD') ? payloadData : { data: finalPayloadData })
    };

    const response = await fetch(GAS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(bodyObj)
    });
    
    // GAS responds with JSON if we parse as JSON
    const json = await response.json();
    if (json.status === 'success') {
      return json.data;
    }
  } catch (error) {
    console.error(`Failed to post data for ${sheetName}:`, error);
  }
  return null;
}

// Function to fetch all database records initially
export async function loadInitialData(onProgress?: (progress: number, message: string) => void) {
  let completed = 0;
  const total = 5;

  const handleProgress = (message: string) => {
    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / total) * 100), message);
    }
  };

  if (onProgress) onProgress(5, "Memulakan sambungan ke database Google Sheets...");

  const [teachersRaw, subjectsRaw, interventionsRaw, pbdRaw, csvTeachers] = await Promise.all([
    fetchSheetData('Teachers').then(res => { handleProgress("Data Guru (API) dimuat turun."); return res; }),
    fetchSheetData('Subjects').then(res => { handleProgress("Data Mata Pelajaran dimuat turun."); return res; }),
    fetchSheetData('Interventions').then(res => { handleProgress("Data Intervensi dimuat turun."); return res; }),
    fetchSheetData('PBD_Data').then(res => { handleProgress("Data PBD dimuat turun."); return res; }),
    fetchTeachersCSV().then(res => { handleProgress("Data Guru (CSV Published) dimuat turun."); return res; })
  ]);

  // Robust header mapping for Teachers from GAS API
  const apiTeachersData: Teacher[] = teachersRaw.map((t: any, index: number) => {
    const id = t.id || t.ID || t.Id || t.id_guru || t.ID_Guru || t.idGuru || String(index + 1);
    const name = t.name || t.Name || t.nama || t.Nama || t.nama_guru || t.Nama_Guru || t['Nama Guru'] || t['NAMA GURU'] || t['NAMA'] || '';
    const email = t.email || t.Email || t.emel || t.Emel || t.email_guru || t['Emel Guru'] || t['EMEL'] || '';
    return {
      id: String(id),
      name: String(name).trim(),
      email: String(email).trim()
    };
  }).filter(t => t.name !== '');

  // Merge Teachers from both API and Published CSV
  const teachersMap = new Map<string, Teacher>();
  csvTeachers.forEach(t => {
    if (t.name) teachersMap.set(t.name.toLowerCase().trim(), t);
  });
  apiTeachersData.forEach(t => {
    if (t.name) teachersMap.set(t.name.toLowerCase().trim(), t);
  });
  const teachersData = Array.from(teachersMap.values());

  // Robust header mapping for Subjects
  const subjectsData: TeacherSubject[] = subjectsRaw.map((sub: any, index: number) => {
    const id = sub.id || sub.ID || sub.Id || String(index + 1);
    const teacherId = sub.teacherId || sub.teacherid || sub.TeacherId || sub.id_guru || sub.ID_Guru || sub.idGuru || sub.teacher_id || '';
    const tahap = sub.tahap || sub.Tahap || 'Tahap 1';
    const kelas = sub.kelas || sub.Kelas || '';
    const mataPelajaran = sub.mataPelajaran || sub.matapelajaran || sub['Mata Pelajaran'] || sub.subject || sub.Subject || '';
    const pbdVal = sub.pbdType || sub.pbdtype || sub.PBDType || sub.PbdType || sub['Sesi PBD'] || sub['pbd_type'] || 'PBD Pertengahan';
    return {
      id: String(id),
      teacherId: String(teacherId),
      tahap: String(tahap),
      kelas: String(kelas),
      mataPelajaran: String(mataPelajaran),
      pbdType: pbdVal
    };
  }).filter(s => s.teacherId !== '' || s.kelas !== '');

  // Decode array fields and normalize Interventions
  const interventionsData: Intervention[] = interventionsRaw.map((inter: any, index: number) => {
    let punca = [];
    try {
      if (typeof inter.punca === 'string') {
        punca = JSON.parse(inter.punca);
      } else if (Array.isArray(inter.punca)) {
        punca = inter.punca;
      }
    } catch(e) {
      if(inter.punca) punca = [String(inter.punca)];
    }
    const id = inter.id || inter.ID || inter.Id || String(index + 1);
    const teacherId = inter.teacherId || inter.teacherid || inter.TeacherId || inter.id_guru || inter.ID_Guru || inter.idGuru || '';
    const pbdVal = inter.pbdType || inter.pbdtype || inter.PBDType || inter.PbdType || inter['Sesi PBD'] || 'PBD Pertengahan';
    const date = inter.date || inter.Date || inter.tarikh || inter.Tarikh || new Date().toISOString().split('T')[0];
    const tahap = inter.tahap || inter.Tahap || '';
    const kelas = inter.kelas || inter.Kelas || '';
    const mataPelajaran = inter.mataPelajaran || inter.matapelajaran || inter['Mata Pelajaran'] || '';

    return {
      id: String(id),
      date: String(date),
      teacherId: String(teacherId),
      tahap: String(tahap),
      kelas: String(kelas),
      mataPelajaran: String(mataPelajaran),
      pbdType: pbdVal,
      tp1: Number(inter.tp1 || inter.TP1 || 0),
      tp2: Number(inter.tp2 || inter.TP2 || 0),
      tp3: Number(inter.tp3 || inter.TP3 || 0),
      tp4: Number(inter.tp4 || inter.TP4 || 0),
      tp5: Number(inter.tp5 || inter.TP5 || 0),
      tp6: Number(inter.tp6 || inter.TP6 || 0),
      tajukBelumDikuasai: inter.tajukBelumDikuasai || inter.tajuk || inter['Tajuk Belum Dikuasai'] || '',
      punca: Array.isArray(punca) ? punca : [],
      puncaLain: inter.puncaLain || inter['Punca Lain'] || '',
      isu: inter.isu || inter.Isu || inter['Isu'] || '',
      pelanIntervensi: inter.pelanIntervensi || inter['Pelan Intervensi'] || inter.pelan || '',
      pelanIntervensiLain: inter.pelanIntervensiLain || inter['Pelan Intervensi Lain'] || '',
      catatan: inter.catatan || inter.Catatan || ''
    };
  });

  // Decode PBD data
  const pbdData = pbdRaw.map((pbd: any, index: number) => {
    let mataPelajaran = {};
    try {
      if (typeof pbd.mataPelajaran === 'string') {
        mataPelajaran = JSON.parse(pbd.mataPelajaran);
      } else if (pbd.mataPelajaran && typeof pbd.mataPelajaran === 'object') {
        mataPelajaran = pbd.mataPelajaran;
      }
    } catch(e) {
      console.error('Failed parsing mataPelajaran mapping', e);
    }
    const id = pbd.id || pbd.ID || String(index + 1);
    const nama = pbd.nama || pbd.Nama || pbd.name || pbd.Name || pbd['Nama Murid'] || pbd['NAMA'] || '';
    const pbdVal = pbd.pbdType || pbd.pbdtype || pbd.PBDType || pbd.PbdType || pbd['Sesi PBD'] || 'PBD Pertengahan';
    const kelas = pbd.kelas || pbd.Kelas || '';
    const tahap = pbd.tahap || pbd.Tahap || '';

    return {
      id: String(id),
      nama: String(nama).trim(),
      tahap: String(tahap),
      kelas: String(kelas),
      mataPelajaran,
      pbdType: pbdVal
    };
  }).filter(p => p.nama !== '');

  return {
    teachers: teachersData,
    subjects: subjectsData,
    interventions: interventionsData,
    studentsPBD: pbdData
  };
}
