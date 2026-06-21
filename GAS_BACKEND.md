# Kemaskini Pangkalan Data (Google Sheets)

Sistem ini sudah menyokong sambungan ke Google Sheets sebagai pangkalan data utama secara langsung, serta mempunyai storan tempatan (local storage) sebagai sandaran (fallback).

Untuk menyambungkan sistem anda ke pangkalan data Google Sheets anda sendiri, sila ikuti langkah-langkah di bawah:

## Langkah-langkah Setup Apps Script:

1. Buat satu **Google Sheets** kosong baharu di Google Drive anda.
2. Salin **ID Google Sheet** daripada URL. (Contoh: Jika URL adalah `https://docs.google.com/spreadsheets/d/1aH1wgsZZDT8sLOkFD5PHSn1FHq7agY0j3mJ3f5qQEy8/edit`, maka ID adalah `1aH1wgsZZDT8sLOkFD5PHSn1FHq7agY0j3mJ3f5qQEy8`).
3. Pada menu Google Sheets, klik **Extensions (Sambungan) > Apps Script**.
4. Padam kod sedia ada (jika ada) dan salin SELURUH kod dari fail `google-apps-script/Code.gs` di dalam projek ini ke dalam editor Apps Script.
5. Pada baris ke-16 kod tersebut, gantikan ID pada `const SPREADSHEET_ID` dengan ID Google Sheet anda:
   ```javascript
   const SPREADSHEET_ID = 'URL_ID_ANDA_DI_SINI';
   ```
6. Simpan kod (ikon Save / Ctrl+S).
7. Klik butang **Deploy > New deployment** di penjuru atas kanan.
   - Klik ikon gear (⚙️) bersebelahan "Select type" dan pilih **Web app**.
   - **Description**: (Boleh letak "SAIAS Backend").
   - **Execute as**: Pilih **Me (emel@anda.com)**. *(Penting!)*
   - **Who has access**: Pilih **Anyone**. *(Penting!)*
8. Klik **Deploy**. Anda mungkin diminta memberikan kebenaran (Authorize access). Ikuti arahan untuk *Advanced* > *Go to (Unsafe)*.
9. Setelah berjaya, anda akan diberikan **Web app URL** yang panjang. Salin URL tersebut.

## Mengaktifkan Sambungan pada Sistem (Frontend)

1. Buka fail `.env` (atau jika letak pada bahagian *Secrets* di panel AI Studio).
2. Tetapkan nilai `VITE_GAS_WEB_APP_URL` dengan URL yang anda salin tadi:
   ```env
   VITE_GAS_WEB_APP_URL="TAMPAL_WEB_APP_URL_ANDA_DI_SINI"
   ```
3. Mulakan (restart) server pembangunan anda.
4. **Siap!** Anda tidak perlu mencipta nama sheet (tab) secara manual (seperti *Teachers*, *Subjects*). Skrip akan mencipta sheet tersebut secara automatik apabila sistem mula menghantar/menarik data.

## Logik Sistem Semasa (Penyelarasan Automatik):
- **Fetch Data**: Setiap kali sistem dimuat (load), ia akan mengambil data dari Google Sheets.
- **Simpanan Auto**: Sebarang tindakan (Tambah Guru, Tambah Kelas, Simpan Intervensi, Muat Naik PBD) akan dikemaskini secara waktu nyata (real-time) melalui POST request (di `src/lib/gasApi.ts`) dan disimpan dalam Sheet.
- **Cache Tempatan**: `useDataStore.ts` menggunakan *Local Storage* agar sistem kekal pantas sambil menunggu Google Sheets memproses data di belakang tabir.
