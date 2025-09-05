/**
 * Google Apps Script Backend untuk Sistem "What Can I Do For You?"
 * 
 * 
 * File: Code.gs 
 * Source Database: https://docs.google.com/spreadsheets/d/1B5EU2OLXF_7C9ZksUhlp3RAIFFOrKd53aPnrQziArrY/edit?usp=sharing
 */

// Konstanta untuk Spreadsheet
const SPREADSHEET_ID = '1B5EU2OLXF_7C9ZksUhlp3RAIFFOrKd53aPnrQziArrY';
const SHEET_NAME = 'MAIN_BUSINESS';
const LINKEDIN_URL = 'https://www.google.com/404';

/**
 * Fungsi untuk melayani halaman HTML
 * Ini adalah entry point untuk web app
 */
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('What Can I Do For You?')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Fungsi untuk menyertakan file CSS/JS eksternal jika diperlukan
 * @param {string} filename - nama file yang akan disertakan
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Fungsi utama untuk menangani submission form
 * @param {Object} formData - data dari form HTML
 * @return {Object} response object dengan status dan message
 */
function submitForm(formData) {
  try {
    // Validasi input data
    const validationResult = validateFormData(formData);
    if (!validationResult.isValid) {
      throw new Error(validationResult.message);
    }
    
    // Dapatkan spreadsheet dan sheet
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Jika sheet tidak ada, buat sheet baru
    if (!sheet) {
      const newSheet = spreadsheet.insertSheet(SHEET_NAME);
      setupSheetHeaders(newSheet);
    }
    
    // Setup header jika belum ada
    if (sheet.getRange('A1').getValue() === '') {
      setupSheetHeaders(sheet);
    }
    
    // Siapkan data untuk dimasukkan ke spreadsheet
    const rowData = prepareRowData(formData);
    
    // Tambahkan data ke baris baru
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    // Masukkan data ke spreadsheet
    sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
    
    // Format tanggal jika diperlukan
    formatNewRow(sheet, newRow);
    
    // Log aktivitas
    console.log(`Data berhasil ditambahkan ke baris ${newRow}:`, formData);
    
    return {
      success: true,
      message: 'Data berhasil disimpan',
      redirectUrl: LINKEDIN_URL,
      rowNumber: newRow,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error dalam submitForm:', error);
    return {
      success: false,
      message: `Terjadi kesalahan: ${error.message}`,
      error: error.toString()
    };
  }
}

/**
 * Fungsi untuk validasi data form
 * @param {Object} formData - data form yang akan divalidasi
 * @return {Object} hasil validasi
 */
function validateFormData(formData) {
  const requiredFields = [
    'yourName',
    'yourInstitutionType', 
    'yourInstitutionName',
    'yourPhoneNumber',
    'yourEmail',
    'yourCity',
    'whatIsYourReasonForContactingMe'
  ];
  
  // Cek field yang wajib diisi
  for (const field of requiredFields) {
    if (!formData[field] || formData[field].toString().trim() === '') {
      return {
        isValid: false,
        message: `Field ${field} harus diisi`
      };
    }
  }
  
  // Validasi email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.yourEmail)) {
    return {
      isValid: false,
      message: 'Format email tidak valid'
    };
  }
  
  // Validasi nomor telepon (hanya angka)
  if (!/^\d+$/.test(formData.yourPhoneNumber)) {
    return {
      isValid: false,
      message: 'Nomor telepon hanya boleh berisi angka'
    };
  }
  
  // Validasi panjang alasan (10-300 karakter)
  const reason = formData.whatIsYourReasonForContactingMe.trim();
  if (reason.length < 10 || reason.length > 300) {
    return {
      isValid: false,
      message: 'Alasan kontak harus antara 10-300 karakter'
    };
  }
  
  // Validasi tipe institusi
  const validInstitutionTypes = [
    'Government Institution',
    'Private Company',
    'University/School',
    'Personal'
  ];
  
  if (!validInstitutionTypes.includes(formData.yourInstitutionType)) {
    return {
      isValid: false,
      message: 'Tipe institusi tidak valid'
    };
  }
  
  return {
    isValid: true,
    message: 'Data valid'
  };
}

/**
 * Fungsi untuk setup header spreadsheet
 * @param {Sheet} sheet - sheet yang akan disetup headernya
 */
function setupSheetHeaders(sheet) {
  const headers = [
    'YourName',                           // A1
    'YourInstitutionType',               // B1
    'YourInstitutionName',               // C1
    'YourPhoneNumber',                   // D1
    'YourEmail',                         // E1
    'YourCity',                          // F1
    'Whatisyourreasonforcontactingme?',  // G1
    'Timestamp',                         // H1
    'Geolocation'                        // I1
  ];
  
  // Set header di baris pertama
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setHorizontalAlignment('center');
  
  // Auto-resize kolom
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
}

/**
 * Fungsi untuk menyiapkan data yang akan dimasukkan ke spreadsheet
 * @param {Object} formData - data dari form
 * @return {Array} array data untuk satu baris
 */
function prepareRowData(formData) {
  // Buat timestamp jika belum ada
  const timestamp = formData.timestamp || new Date().toISOString();
  
  // Siapkan data sesuai urutan kolom (A1 sampai I1)
  return [
    formData.yourName,                          // A - YourName
    formData.yourInstitutionType,              // B - YourInstitutionType  
    formData.yourInstitutionName,              // C - YourInstitutionName
    formData.yourPhoneNumber,                  // D - YourPhoneNumber
    formData.yourEmail,                        // E - YourEmail
    formData.yourCity,                         // F - YourCity
    formData.whatIsYourReasonForContactingMe,  // G - Whatisyourreasonforcontactingme?
    new Date(timestamp),                       // H - Timestamp
    formData.geolocation || 'Not provided'     // I - Geolocation
  ];
}

/**
 * Fungsi untuk memformat baris baru yang ditambahkan
 * @param {Sheet} sheet - sheet yang berisi data
 * @param {number} rowNumber - nomor baris yang akan diformat
 */
function formatNewRow(sheet, rowNumber) {
  const range = sheet.getRange(rowNumber, 1, 1, 9);
  
  // Set border
  range.setBorder(true, true, true, true, true, true);
  
  // Format timestamp column (H)
  const timestampCell = sheet.getRange(rowNumber, 8);
  timestampCell.setNumberFormat('dd/mm/yyyy hh:mm:ss');
  
  // Format phone number column (D) sebagai text
  const phoneCell = sheet.getRange(rowNumber, 4);
  phoneCell.setNumberFormat('@');
  
  // Auto-resize jika diperlukan
  sheet.autoResizeColumns(1, 9);
}

/**
 * Fungsi untuk mendapatkan semua data dari spreadsheet
 * Bisa digunakan untuk debugging atau laporan
 * @return {Array} array data dari spreadsheet
 */
function getAllData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Sheet tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    return {
      success: true,
      data: data,
      totalRows: data.length
    };
    
  } catch (error) {
    console.error('Error dalam getAllData:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Fungsi untuk mendapatkan statistik data
 * @return {Object} statistik data
 */
function getDataStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { error: 'Sheet tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return {
        totalSubmissions: 0,
        institutionTypes: {},
        cities: {}
      };
    }
    
    // Hitung statistik
    const submissions = data.slice(1); // Skip header
    const institutionTypes = {};
    const cities = {};
    
    submissions.forEach(row => {
      const institutionType = row[1]; // Column B
      const city = row[5]; // Column F
      
      institutionTypes[institutionType] = (institutionTypes[institutionType] || 0) + 1;
      cities[city] = (cities[city] || 0) + 1;
    });
    
    return {
      success: true,
      totalSubmissions: submissions.length,
      institutionTypes: institutionTypes,
      cities: cities,
      lastSubmission: submissions[submissions.length - 1][7] // Timestamp
    };
    
  } catch (error) {
    console.error('Error dalam getDataStatistics:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Fungsi untuk testing - bisa dihapus di production
 */
function testSubmission() {
  const testData = {
    yourName: 'Test User',
    yourInstitutionType: 'Personal',
    yourInstitutionName: 'Test Institution',
    yourPhoneNumber: '081234567890',
    yourEmail: 'test@example.com',
    yourCity: 'Jakarta',
    whatIsYourReasonForContactingMe: 'This is a test submission for the Google Frontend Developer competition.',
    timestamp: new Date().toISOString(),
    geolocation: '-6.2088, 106.8456'
  };
  
  const result = submitForm(testData);
  console.log('Test result:', result);
  return result;
}

