/**
 * KOD GOOGLE APPS SCRIPT (BACKEND)
 * 
 * Sila ikuti langkah di bawah untuk mendeploy kod ini:
 * 1. Buka Google Sheets anda.
 * 2. Klik Extensions (Sambungan) > Apps Script.
 * 3. Padam semua kod yang sedia ada dan tampal kod ini.
 * 4. Gantikan '1aH1wgsZZDT8sLOkFD5PHSn1FHq7agY0j3mJ3f5qQEy8' dengan ID dari URL Google Sheet anda.
 * 5. Klik Deploy > New deployment.
 * 6. Pilih type: Web app.
 * 7. Execute as: Me.
 * 8. Who has access: Anyone.
 * 9. Salin "Web app URL" dan tampal pada `.env` projek anda sebagai VITE_GAS_WEB_APP_URL.
 */

const SPREADSHEET_ID = '1aH1wgsZZDT8sLOkFD5PHSn1FHq7agY0j3mJ3f5qQEy8';

function doGet(e) {
  // Elakkan ralat jika klik "Run" secara manual dari dalam editor Apps Script
  if (!e) {
    return ContentService.createTextOutput("Ralat: Sila jalankan kod ini melalui 'Web App URL' dan bukan dengan menekan butang 'Run' di editor.");
  }

  const action = e.parameter.action;
  const sheetName = e.parameter.sheetName;

  try {
    if (action === 'get') {
      const data = getSheetData(sheetName);
      return createJsonResponse({ status: 'success', data: data });
    }
    return createJsonResponse({ status: 'error', message: 'Tindakan tidak sah atau tiada. Pastikan ada parameter ?action=get&sheetName=NamaSheet' });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

function doPost(e) {
  // Elakkan ralat jika klik "Run" secara manual dari dalam editor Apps Script
  if (!e) {
    return ContentService.createTextOutput("Ralat: Sila jalankan kod ini melalui 'Web App URL' dan bukan dengan menekan butang 'Run' di editor.");
  }

  try {
    // Apps Script akan menerima Body format string, kita perlu parse ke JSON
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;
    const sheetName = payload.sheetName;
    const data = payload.data; // Objek data row yang mahu dimasukkan

    if (action === 'add') {
      const result = addRow(sheetName, data);
      return createJsonResponse({ status: 'success', data: result });
    } else if (action === 'update') {
      const result = updateRow(sheetName, data);
      return createJsonResponse({ status: 'success', data: result });
    } else if (action === 'delete') {
      const result = deleteRow(sheetName, data);
      return createJsonResponse({ status: 'success', data: result });
    } else if (action === 'addBatch') {
      const result = addBatchRows(sheetName, data);
      return createJsonResponse({ status: 'success', data: result });
    } else if (action === 'deleteClassPBD') {
      const result = deleteClassPBDRows(sheetName, payload.pbdType, payload.kelas);
      return createJsonResponse({ status: 'success', data: result });
    }

    return createJsonResponse({ status: 'error', message: 'Tindakan doPost tidak disokong: ' + action });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * --------------------------------
 * HELPER FUNCTIONS
 * --------------------------------
 */

// Membina Response berformat JSON yang standard
function createJsonResponse(responseObject) {
  return ContentService
    .createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

// Mengambil semua data dalam Sheet dan menukarnya menjadi Objek Array
function getSheetData(sheetName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    // Jika sheet belum wujud, kita cuba buat
    try {
      SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(sheetName);
      return [];
    } catch(err) {
      throw new Error("Maklumat Sheet tidak dijumpai dan gagal dibuat: " + sheetName);
    }
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Kosong (hanya ada Header)

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    let obj = {};
    headers.forEach((header, index) => {
      // Kita hanya memproses kolum yang mempunyai nama header 
      if(header && header.toString().trim() !== "") {
         obj[header] = row[index];
      }
    });
    return obj;
  });
}

// Menambah rekod baharu ke dalam Sheet
function addRow(sheetName, objectData) {
  let sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(sheetName);
  }

  let values = sheet.getDataRange().getValues();
  let headers = values.length > 0 ? values[0] : [];

  // Jika tiada header, kita set dari properties objectData
  if (headers.length === 0 || (headers.length === 1 && String(headers[0]).trim() === "")) {
    headers = Object.keys(objectData);
    if (!headers.includes('timestamp')) {
      headers.push('timestamp');
    }
    sheet.appendRow(headers);
  }
  
  // Mapping data baru ke kolum yang betul
  const newRow = headers.map(header => {
    return objectData[header] !== undefined ? objectData[header] : "";
  });

  const timestampIndex = headers.findIndex(h => String(h).toLowerCase() === 'timestamp' || String(h).toLowerCase() === 'tarikh_masa');
  if (timestampIndex > -1) {
    newRow[timestampIndex] = new Date();
  }

  sheet.appendRow(newRow);
  return objectData;
}

// Mengemaskini rekod di dalam Sheet berdasarkan ID
function updateRow(sheetName, objectData) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error("Maklumat Sheet tidak dijumpai: " + sheetName);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return objectData;

  const headers = values[0];
  const idIndex = headers.findIndex(h => String(h).toLowerCase() === 'id');
  if (idIndex === -1) throw new Error("Tiada kolum 'id' dijumpa dalam sheet " + sheetName);

  const targetId = objectData.id;
  if (!targetId) throw new Error("Data tidak mengandungi ID untuk kemaskini");

  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idIndex]) === String(targetId)) {
      const updateRowValues = headers.map((header, colIndex) => {
        if (header.toLowerCase() === 'timestamp' || header.toLowerCase() === 'tarikh_masa') {
           return new Date();
        }
        return objectData[header] !== undefined ? objectData[header] : values[i][colIndex];
      });
      // values array indices start from 0, sheet rows start from 1. Row 0 is header (row 1).
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([updateRowValues]);
      break;
    }
  }

  return objectData;
}

// Memadam rekod di dalam Sheet berdasarkan ID
function deleteRow(sheetName, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return data;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return data;

  const headers = values[0];
  const idIndex = headers.findIndex(h => String(h).toLowerCase() === 'id');
  if (idIndex === -1) return data;

  const targetId = data.id;
  if (!targetId) return data;

  // Search from bottom up so deleting rows doesn't mess up indices
  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][idIndex]) === String(targetId)) {
      sheet.deleteRow(i + 1);
    }
  }

  return data;
}

function addBatchRows(sheetName, arrayData) {
  if(!arrayData || arrayData.length === 0) return [];
  let sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(SPREADSHEET_ID).insertSheet(sheetName);
  }

  let values = sheet.getDataRange().getValues();
  let headers = values.length > 0 ? values[0] : [];

  if (headers.length === 0 || (headers.length === 1 && String(headers[0]).trim() === "")) {
    headers = Object.keys(arrayData[0]);
    if (!headers.includes('timestamp')) {
      headers.push('timestamp');
    }
    sheet.appendRow(headers);
  }

  const newRows = arrayData.map(objectData => {
    const newRow = headers.map(header => {
      if(header.toLowerCase() === 'timestamp' || header.toLowerCase() === 'tarikh_masa') {
        return new Date();
      }
      return objectData[header] !== undefined ? objectData[header] : "";
    });
    return newRow;
  });

  sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length).setValues(newRows);
  return arrayData;
}

function deleteClassPBDRows(sheetName, targetPbdType, targetKelas) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) return false;

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return true;

  const headers = values[0];
  const typeIndex = headers.findIndex(h => String(h).toLowerCase() === 'pbdtype');
  const kelasIndex = headers.findIndex(h => String(h).toLowerCase() === 'kelas');
  
  if (typeIndex === -1 || kelasIndex === -1) return false;

  for (let i = values.length - 1; i >= 1; i--) {
    if (String(values[i][typeIndex]) === String(targetPbdType) && String(values[i][kelasIndex]) === String(targetKelas)) {
      sheet.deleteRow(i + 1);
    }
  }

  return true;
}
