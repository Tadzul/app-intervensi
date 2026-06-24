import { Teacher, TeacherSubject, Intervention } from '../types';

export const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbx-_zGV8XwFiW6jiiBUYO5q4-ZLA1aVyuRhSMcu77LBcZkmOxRjE0Z-XBssaHs_tzxL/exec";

export async function fetchSheetData(sheetName: string) {
  if (!GAS_URL) return [];
  try {
    const response = await fetch(`${GAS_URL}?action=get&sheetName=${sheetName}`);
    if (!response.ok) throw new Error("Network response was not ok");
    const json = await response.json();
    if (json.status === 'success') {
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
  const total = 4;

  const handleProgress = (message: string) => {
    completed++;
    if (onProgress) {
      onProgress(Math.round((completed / total) * 100), message);
    }
  };

  if (onProgress) onProgress(5, "Memulakan sambungan ke pelayan...");

  const [teachersRaw, subjectsRaw, interventionsRaw, pbdRaw] = await Promise.all([
    fetchSheetData('Teachers').then(res => { handleProgress("Data Guru berjaya dimuat turun."); return res; }),
    fetchSheetData('Subjects').then(res => { handleProgress("Data Mata Pelajaran berjaya dimuat turun."); return res; }),
    fetchSheetData('Interventions').then(res => { handleProgress("Data Intervensi berjaya dimuat turun."); return res; }),
    fetchSheetData('PBD_Data').then(res => { handleProgress("Data PBD berjaya dimuat turun."); return res; })
  ]);

  // Decode array fields
  const interventionsData = interventionsRaw.map((inter: any) => {
    let punca = [];
    try {
      if (typeof inter.punca === 'string') {
        punca = JSON.parse(inter.punca);
      }
    } catch(e) {
      // fallback
      if(inter.punca) punca = [inter.punca];
    }
    const pbdVal = inter.pbdType || inter.pbdtype || inter.PBDType || inter.PbdType || inter['Sesi PBD'] || 'PBD Pertengahan';
    return { ...inter, punca, pbdType: pbdVal };
  });

  const pbdData = pbdRaw.map((pbd: any) => {
    let mataPelajaran = {};
    try {
      if (typeof pbd.mataPelajaran === 'string') {
        mataPelajaran = JSON.parse(pbd.mataPelajaran);
      }
    } catch(e) {
      console.error('Failed parsing mataPelajaran mapping', e);
    }
    const pbdVal = pbd.pbdType || pbd.pbdtype || pbd.PBDType || pbd.PbdType || pbd['Sesi PBD'] || 'PBD Pertengahan';
    return { ...pbd, mataPelajaran, pbdType: pbdVal };
  });

  const subjectsData = subjectsRaw.map((sub: any) => {
    const pbdVal = sub.pbdType || sub.pbdtype || sub.PBDType || sub.PbdType || sub['Sesi PBD'] || 'PBD Pertengahan';
    return {
      ...sub,
      pbdType: pbdVal
    };
  });

  return {
    teachers: teachersRaw as Teacher[],
    subjects: subjectsData as TeacherSubject[],
    interventions: interventionsData as Intervention[],
    studentsPBD: pbdData as any[]
  };
}
