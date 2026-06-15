# Sambungan Google Apps Script (GAS)
Sistem ini kini menggunakan storan tempatan (Local Storage) untuk memberikan pengalaman segera (prototaip) tanpa sela masa. Walau bagaimanapun, jika anda ingin menyambungkannya dengan pangkalan data Google Sheets secara langsung, anda boleh menggunakan kod di bawah.

## Langkah-langkah:
1. Buka Google Sheets baru.
2. Namakan sheet sebagai `GURU`, `SUBJEK_GURU`, dan `INTERVENSI`.
3. Klik **Extensions > Apps Script**.
4. Tampalkan kod di bawah dan klik **Deploy > New Deployment** sebagai Web App.

```javascript
// Code.gs

const SHEET_ID = 'MASUKKAN_ID_GOOGLE_SHEET_ANDA_DI_SINI';

function doGet(e) {
  return ContentService.createTextOutput("SAIAS API RUNNING")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    if (action === 'saveIntervention') {
      const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('INTERVENSI');
      sheet.appendRow([
        data.id,
        data.date,
        data.teacherId,
        data.tahap,
        data.kelas,
        data.mataPelajaran,
        data.tp1, data.tp2, data.tp3, data.tp4, data.tp5, data.tp6,
        data.jumlahMurid,
        data.tajukBelumDikuasai,
        data.punca.join(', '),
        data.isu,
        data.pelanIntervensi,
        data.catatan
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

Apabila Web App URL dijana, anda boleh memanggil URL tersebut melalui antaramuka menggunakan fungsi `fetch()` di dalam JavaScript.
