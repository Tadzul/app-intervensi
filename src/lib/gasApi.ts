import { Teacher, TeacherSubject, Intervention } from '../types';

export const GAS_URL = import.meta.env.VITE_GAS_WEB_APP_URL || "https://script.google.com/macros/s/AKfycbwjk11mjN8n52naA2MSjDQGjdEjG6WQTokZXh-9ivQ5Lry3Sm-qC51eM_it6VcxkNKW/exec";

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
export async function loadInitialData() {
  const [teachersRaw, subjectsRaw, interventionsRaw, pbdRaw] = await Promise.all([
    fetchSheetData('Teachers'),
    fetchSheetData('Subjects'),
    fetchSheetData('Interventions'),
    fetchSheetData('PBD_Data')
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
    return { ...inter, punca };
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
    return { ...pbd, mataPelajaran };
  });

  return {
    teachers: teachersRaw as Teacher[],
    subjects: subjectsRaw as TeacherSubject[],
    interventions: interventionsData as Intervention[],
    studentsPBD: pbdData as any[]
  };
}
