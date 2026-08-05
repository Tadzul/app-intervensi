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

function getRawVal(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return obj[k];
    }
  }
  const objKeys = Object.keys(obj);
  for (const k of keys) {
    const cleanK = k.toLowerCase().replace(/[\s_]/g, '');
    const foundKey = objKeys.find(ok => ok.toLowerCase().replace(/[\s_]/g, '') === cleanK);
    if (foundKey && obj[foundKey] !== undefined && obj[foundKey] !== null && String(obj[foundKey]).trim() !== '') {
      return obj[foundKey];
    }
  }
  return undefined;
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
    const id = getRawVal(t, ['id', 'ID', 'Id', 'id_guru', 'ID_Guru', 'idGuru']) || String(index + 1);
    const name = getRawVal(t, ['name', 'Name', 'nama', 'Nama', 'nama_guru', 'Nama_Guru', 'Nama Guru', 'NAMA GURU', 'NAMA']) || '';
    const email = getRawVal(t, ['email', 'Email', 'emel', 'Emel', 'email_guru', 'Emel Guru', 'EMEL']) || '';
    return {
      id: String(id),
      name: String(name).trim(),
      email: String(email).trim()
    };
  }).filter(t => t.name !== '');

  // Merge Teachers from API, Published CSV, Subjects, and Interventions
  const teachersMap = new Map<string, Teacher>();
  const addOrMergeTeacher = (id: string, name: string, email: string = '') => {
    if (!name || name.trim() === '') return;
    const cleanName = name.trim();
    const cleanId = String(id || cleanName).trim();
    const nameKey = cleanName.toLowerCase();

    const existing = teachersMap.get(nameKey) || teachersMap.get(cleanId);
    const finalObj: Teacher = {
      id: cleanId !== nameKey ? cleanId : (existing?.id || cleanId),
      name: cleanName,
      email: email || existing?.email || ''
    };

    teachersMap.set(nameKey, finalObj);
    teachersMap.set(cleanId, finalObj);
    if (existing && existing.id) {
      teachersMap.set(String(existing.id).trim(), finalObj);
    }
  };

  csvTeachers.forEach(t => {
    addOrMergeTeacher(t.id, t.name, t.email);
  });
  apiTeachersData.forEach(t => {
    addOrMergeTeacher(t.id, t.name, t.email);
  });

  // Also extract teachers from raw subjects and interventions if any are referenced
  subjectsRaw.forEach((sub: any) => {
    const rawTeacherId = getRawVal(sub, ['teacherId', 'teacherid', 'TeacherId', 'id_guru', 'ID_Guru', 'idGuru', 'teacher_id']);
    const rawTeacherName = getRawVal(sub, ['Nama Guru', 'nama_guru', 'Nama', 'guru', 'Guru', 'NAMA GURU']);
    if (rawTeacherName && rawTeacherName.trim()) {
      addOrMergeTeacher(rawTeacherId, rawTeacherName);
    }
  });

  interventionsRaw.forEach((inter: any) => {
    const rawTeacherId = getRawVal(inter, ['teacherId', 'teacherid', 'TeacherId', 'id_guru', 'ID_Guru', 'idGuru', 'ID Guru']);
    const rawTeacherName = getRawVal(inter, ['Nama Guru', 'nama_guru', 'namaGuru', 'NamaGuru', 'Nama', 'NAMA GURU', 'guru', 'Guru']);
    if (rawTeacherName && rawTeacherName.trim() && !/^\d+$/.test(rawTeacherName.trim())) {
      addOrMergeTeacher(rawTeacherId, rawTeacherName);
    }
  });

  // Deduplicate unique teacher objects
  const uniqueTeachers = new Set<Teacher>();
  teachersMap.forEach(t => uniqueTeachers.add(t));
  const teachersData = Array.from(uniqueTeachers);

  // Robust header mapping for Subjects
  const subjectsData: TeacherSubject[] = subjectsRaw.map((sub: any, index: number) => {
    const id = getRawVal(sub, ['id', 'ID', 'Id']) || String(index + 1);
    const teacherId = getRawVal(sub, ['teacherId', 'teacherid', 'TeacherId', 'id_guru', 'ID_Guru', 'idGuru', 'teacher_id', 'Nama Guru', 'nama_guru', 'Nama', 'guru']) || '';
    const tahap = getRawVal(sub, ['tahap', 'Tahap', 'TAHAP']) || 'Tahap 1';
    const kelas = getRawVal(sub, ['kelas', 'Kelas', 'KELAS']) || '';
    const mataPelajaran = getRawVal(sub, ['mataPelajaran', 'matapelajaran', 'Mata Pelajaran', 'subject', 'Subject', 'Subjek']) || '';
    const pbdVal = getRawVal(sub, ['pbdType', 'pbdtype', 'PBDType', 'PbdType', 'Sesi PBD', 'pbd_type']) || 'PBD Pertengahan';
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
    const rawPunca = getRawVal(inter, ['punca', 'Punca', 'puncaUtama', 'Punca Utama', 'PUNCA']);
    let punca: string[] = [];
    try {
      if (typeof rawPunca === 'string') {
        if (rawPunca.startsWith('[') && rawPunca.endsWith(']')) {
          punca = JSON.parse(rawPunca);
        } else if (rawPunca.includes(';')) {
          punca = rawPunca.split(';').map(s => s.trim()).filter(Boolean);
        } else if (rawPunca.includes(',')) {
          punca = rawPunca.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          punca = [rawPunca.trim()];
        }
      } else if (Array.isArray(rawPunca)) {
        punca = rawPunca;
      }
    } catch(e) {
      if (rawPunca) punca = [String(rawPunca)];
    }

    const rawId = getRawVal(inter, ['id', 'ID', 'Id', 'id_intervensi', 'ID_Intervensi', 'idIntervensi', 'ID Intervensi', 'no', 'bil']);
    const teacherId = getRawVal(inter, ['teacherId', 'teacherid', 'TeacherId', 'id_guru', 'ID_Guru', 'idGuru', 'ID Guru', 'Nama Guru', 'nama_guru', 'namaGuru', 'NamaGuru', 'Nama', 'NAMA GURU', 'guru', 'Guru', 'email_guru', 'Emel Guru', 'Emel']) || '';
    const pbdVal = getRawVal(inter, ['pbdType', 'pbdtype', 'PBDType', 'PbdType', 'pbd_type', 'Sesi PBD', 'SESI PBD', 'Sesi', 'PBD', 'sesiPBD']) || 'PBD Pertengahan';
    const date = getRawVal(inter, ['date', 'Date', 'tarikh', 'Tarikh', 'TARIKH', 'timestamp', 'Timestamp', 'tarikhMasa', 'Tarikh Masa']) || new Date().toISOString().split('T')[0];
    const tahap = getRawVal(inter, ['tahap', 'Tahap', 'TAHAP', 'Tahap Persekolahan']) || '';
    const kelas = getRawVal(inter, ['kelas', 'Kelas', 'KELAS', 'Nama Kelas', 'Tingkatan']) || '';
    const mataPelajaran = getRawVal(inter, ['mataPelajaran', 'matapelajaran', 'Mata Pelajaran', 'MATA PELAJARAN', 'subject', 'Subject', 'Subjek', 'SUBJEK', 'MataPelajaran', 'mp', 'MP']) || '';

    const tajukBelumDikuasai = getRawVal(inter, ['tajukBelumDikuasai', 'tajuk', 'Tajuk', 'Tajuk Belum Dikuasai', 'TAJUK BELUM DIKUASAI', 'tajuk_belum_dikuasai', 'Tajuk Lemah']) || '';
    const puncaLain = getRawVal(inter, ['puncaLain', 'Punca Lain', 'PUNCA LAIN', 'punca_lain']) || '';
    const isu = getRawVal(inter, ['isu', 'Isu', 'ISU', 'Isu Utama', 'ISU UTAMA', 'Isu / Punca']) || '';
    const pelanIntervensi = getRawVal(inter, ['pelanIntervensi', 'Pelan Intervensi', 'PELAN INTERVENSI', 'pelan', 'Pelan', 'Tindakan', 'TINDAKAN', 'Cadangan Intervensi', 'CADANGAN INTERVENSI', 'cadanganIntervensi', 'cadangan_intervensi']) || '';
    const pelanIntervensiLain = getRawVal(inter, ['pelanIntervensiLain', 'Pelan Intervensi Lain', 'PELAN INTERVENSI LAIN', 'pelan_lain', 'Pelan Lain']) || '';
    const catatan = getRawVal(inter, ['catatan', 'Catatan', 'CATATAN', 'Catatan Tambahan']) || '';

    // Generate unique collision-free ID if rawId is missing
    const finalId = rawId ? String(rawId) : `inv_${index + 1}_${kelas}_${mataPelajaran}_${pbdVal}`;

    return {
      id: finalId,
      date: String(date),
      teacherId: String(teacherId),
      tahap: String(tahap),
      kelas: String(kelas),
      mataPelajaran: String(mataPelajaran),
      pbdType: String(pbdVal),
      tp1: Number(getRawVal(inter, ['tp1', 'TP1', 'Tp1', 'TP 1', 'tp_1']) || 0),
      tp2: Number(getRawVal(inter, ['tp2', 'TP2', 'Tp2', 'TP 2', 'tp_2']) || 0),
      tp3: Number(getRawVal(inter, ['tp3', 'TP3', 'Tp3', 'TP 3', 'tp_3']) || 0),
      tp4: Number(getRawVal(inter, ['tp4', 'TP4', 'Tp4', 'TP 4', 'tp_4']) || 0),
      tp5: Number(getRawVal(inter, ['tp5', 'TP5', 'Tp5', 'TP 5', 'tp_5']) || 0),
      tp6: Number(getRawVal(inter, ['tp6', 'TP6', 'Tp6', 'TP 6', 'tp_6']) || 0),
      tajukBelumDikuasai: String(tajukBelumDikuasai),
      punca: Array.isArray(punca) ? punca : [],
      puncaLain: String(puncaLain),
      isu: String(isu),
      pelanIntervensi: String(pelanIntervensi),
      pelanIntervensiLain: String(pelanIntervensiLain),
      catatan: String(catatan)
    };
  }).filter(inv => inv.kelas !== '' || inv.mataPelajaran !== '' || inv.teacherId !== '' || inv.isu !== '' || inv.pelanIntervensi !== '');

  // Decode PBD data
  const pbdData = pbdRaw.map((pbd: any, index: number) => {
    let mataPelajaran = {};
    try {
      const rawMp = getRawVal(pbd, ['mataPelajaran', 'matapelajaran', 'Mata Pelajaran', 'subjects', 'MataPelajaran']);
      if (typeof rawMp === 'string') {
        mataPelajaran = JSON.parse(rawMp);
      } else if (rawMp && typeof rawMp === 'object') {
        mataPelajaran = rawMp;
      }
    } catch(e) {
      console.error('Failed parsing mataPelajaran mapping', e);
    }
    const id = getRawVal(pbd, ['id', 'ID', 'Id']) || String(index + 1);
    const nama = getRawVal(pbd, ['nama', 'Nama', 'name', 'Name', 'Nama Murid', 'NAMA']) || '';
    const pbdVal = getRawVal(pbd, ['pbdType', 'pbdtype', 'PBDType', 'PbdType', 'Sesi PBD']) || 'PBD Pertengahan';
    const kelas = getRawVal(pbd, ['kelas', 'Kelas', 'KELAS']) || '';
    const tahap = getRawVal(pbd, ['tahap', 'Tahap', 'TAHAP']) || '';

    return {
      id: String(id),
      nama: String(nama).trim(),
      tahap: String(tahap),
      kelas: String(kelas),
      mataPelajaran,
      pbdType: String(pbdVal)
    };
  }).filter(p => p.nama !== '');

  return {
    teachers: teachersData,
    subjects: subjectsData,
    interventions: interventionsData,
    studentsPBD: pbdData
  };
}
