/**
 * Google Apps Script Backend untuk Sistem "What Can I Do For You?"
 * Lomba Google Frontend Developer
 * 
 * File: Code.gs
 * Version: 2.0 - Improved
 */

// Konstanta untuk Spreadsheet
const SPREADSHEET_ID = '1B5EU2OLXF_7C9ZksUhlp3RAIFFOrKd53aPnrQziArrY';
const SHEET_NAME = 'Sheet2';
const LINKEDIN_URL = 'https://www.linkedin.com/in/professional-umar/';

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
    // Log incoming data for debugging
    console.log('Received form data:', JSON.stringify(formData, null, 2));
    
    // Validasi input data
    const validationResult = validateFormData(formData);
    if (!validationResult.isValid) {
      throw new Error(validationResult.message);
    }
    
    // Dapatkan spreadsheet dan sheet dengan error handling
    let spreadsheet;
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (error) {
      throw new Error(`Tidak dapat mengakses spreadsheet: ${error.message}`);
    }
    
    let sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    // Jika sheet tidak ada, buat sheet baru
    if (!sheet) {
      console.log(`Sheet '${SHEET_NAME}' tidak ditemukan, membuat sheet baru...`);
      sheet = spreadsheet.insertSheet(SHEET_NAME);
      setupSheetHeaders(sheet);
    }
    
    // Setup header jika belum ada
    if (sheet.getRange('A1').getValue() === '') {
      console.log('Setting up sheet headers...');
      setupSheetHeaders(sheet);
    }
    
    // Siapkan data untuk dimasukkan ke spreadsheet
    const rowData = prepareRowData(formData);
    
    // Tambahkan data ke baris baru dengan error handling
    const lastRow = sheet.getLastRow();
    const newRow = lastRow + 1;
    
    try {
      // Masukkan data ke spreadsheet
      sheet.getRange(newRow, 1, 1, rowData.length).setValues([rowData]);
      
      // Format baris baru
      formatNewRow(sheet, newRow);
      
    } catch (error) {
      throw new Error(`Gagal menyimpan data ke spreadsheet: ${error.message}`);
    }
    
    // Log aktivitas
    console.log(`Data berhasil ditambahkan ke baris ${newRow}`);
    
    // Return success response
    return {
      success: true,
      message: 'Data berhasil disimpan',
      redirectUrl: LINKEDIN_URL,
      rowNumber: newRow,
      timestamp: new Date().toISOString(),
      submissionId: generateSubmissionId(newRow)
    };
    
  } catch (error) {
    console.error('Error dalam submitForm:', error);
    
    // Return error response with more details
    return {
      success: false,
      message: `Terjadi kesalahan: ${error.message}`,
      error: error.toString(),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Fungsi untuk validasi data form dengan improved validation
 * @param {Object} formData - data form yang akan divalidasi
 * @return {Object} hasil validasi
 */
function validateFormData(formData) {
  // Cek apakah formData ada
  if (!formData || typeof formData !== 'object') {
    return {
      isValid: false,
      message: 'Data form tidak valid atau kosong'
    };
  }
  
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
  
  // Validasi email format (improved regex)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!emailRegex.test(formData.yourEmail.trim())) {
    return {
      isValid: false,
      message: 'Format email tidak valid'
    };
  }
  
  // Validasi nomor telepon (allow + and spaces)
  const phoneRegex = /^[\d\s\+\-\(\)]+$/;
  if (!phoneRegex.test(formData.yourPhoneNumber.trim())) {
    return {
      isValid: false,
      message: 'Format nomor telepon tidak valid'
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
  
  // Validasi panjang nama (reasonable limits)
  if (formData.yourName.trim().length > 100) {
    return {
      isValid: false,
      message: 'Nama terlalu panjang (maksimal 100 karakter)'
    };
  }
  
  if (formData.yourInstitutionName.trim().length > 150) {
    return {
      isValid: false,
      message: 'Nama institusi terlalu panjang (maksimal 150 karakter)'
    };
  }
  
  if (formData.yourCity.trim().length > 50) {
    return {
      isValid: false,
      message: 'Nama kota terlalu panjang (maksimal 50 karakter)'
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
    'Geolocation',                       // I1
    'SubmissionID'                       // J1 - Added for tracking
  ];
  
  // Set header di baris pertama
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header dengan improved styling
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('white');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  headerRange.setWrap(true);
  
  // Auto-resize kolom
  sheet.autoResizeColumns(1, headers.length);
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  console.log('Sheet headers setup completed');
}

/**
 * Fungsi untuk menyiapkan data yang akan dimasukkan ke spreadsheet
 * @param {Object} formData - data dari form
 * @return {Array} array data untuk satu baris
 */
function prepareRowData(formData) {
  // Buat timestamp jika belum ada
  const timestamp = formData.timestamp ? new Date(formData.timestamp) : new Date();
  
  // Generate submission ID
  const submissionId = generateSubmissionId();
  
  // Siapkan data sesuai urutan kolom (A1 sampai J1)
  return [
    sanitizeText(formData.yourName),                          // A - YourName
    formData.yourInstitutionType,                            // B - YourInstitutionType  
    sanitizeText(formData.yourInstitutionName),              // C - YourInstitutionName
    sanitizeText(formData.yourPhoneNumber),                  // D - YourPhoneNumber
    formData.yourEmail.trim().toLowerCase(),                 // E - YourEmail
    sanitizeText(formData.yourCity),                         // F - YourCity
    sanitizeText(formData.whatIsYourReasonForContactingMe),  // G - Reason
    timestamp,                                               // H - Timestamp
    formData.geolocation || 'Not provided',                  // I - Geolocation
    submissionId                                             // J - SubmissionID
  ];
}

/**
 * Fungsi untuk membersihkan teks input
 * @param {string} text - teks yang akan dibersihkan
 * @return {string} teks yang sudah dibersihkan
 */
function sanitizeText(text) {
  if (!text) return '';
  return text.toString().trim().replace(/\s+/g, ' '); // Remove extra whitespaces
}

/**
 * Fungsi untuk generate submission ID
 * @param {number} rowNumber - nomor baris (optional)
 * @return {string} submission ID
 */
function generateSubmissionId(rowNumber = null) {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const row = rowNumber || '';
  return `SUB-${timestamp}-${random}${row}`;
}

/**
 * Fungsi untuk memformat baris baru yang ditambahkan
 * @param {Sheet} sheet - sheet yang berisi data
 * @param {number} rowNumber - nomor baris yang akan diformat
 */
function formatNewRow(sheet, rowNumber) {
  try {
    const range = sheet.getRange(rowNumber, 1, 1, 10); // Updated to 10 columns
    
    // Set border
    range.setBorder(true, true, true, true, true, true);
    
    // Format timestamp column (H)
    const timestampCell = sheet.getRange(rowNumber, 8);
    timestampCell.setNumberFormat('dd/mm/yyyy hh:mm:ss');
    
    // Format phone number column (D) sebagai text
    const phoneCell = sheet.getRange(rowNumber, 4);
    phoneCell.setNumberFormat('@');
    
    // Format email column (E) untuk lowercase
    const emailCell = sheet.getRange(rowNumber, 5);
    emailCell.setNumberFormat('@');
    
    // Auto-resize jika diperlukan
    sheet.autoResizeColumns(1, 10);
    
  } catch (error) {
    console.error('Error formatting new row:', error);
    // Don't throw error, just log it
  }
}

/**
 * Fungsi untuk mendapatkan semua data dari spreadsheet
 * Improved with better error handling
 * @return {Array} array data dari spreadsheet
 */
function getAllData() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { 
        success: false,
        error: 'Sheet tidak ditemukan' 
      };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        data: [],
        totalRows: 0,
        message: 'Tidak ada data'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    return {
      success: true,
      data: data,
      totalRows: data.length,
      headers: data[0],
      dataRows: data.slice(1)
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
 * Fungsi untuk mendapatkan statistik data - Enhanced version
 * @return {Object} statistik data
 */
function getDataStatistics() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { 
        success: false,
        error: 'Sheet tidak ditemukan' 
      };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        totalSubmissions: 0,
        institutionTypes: {},
        cities: {},
        message: 'Tidak ada data untuk statistik'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    const submissions = data.slice(1); // Skip header
    
    const institutionTypes = {};
    const cities = {};
    const monthlyStats = {};
    
    submissions.forEach(row => {
      const institutionType = row[1]; // Column B
      const city = row[5]; // Column F
      const timestamp = row[7]; // Column H
      
      // Count institution types
      institutionTypes[institutionType] = (institutionTypes[institutionType] || 0) + 1;
      
      // Count cities
      cities[city] = (cities[city] || 0) + 1;
      
      // Count monthly submissions
      if (timestamp instanceof Date) {
        const monthYear = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
        monthlyStats[monthYear] = (monthlyStats[monthYear] || 0) + 1;
      }
    });
    
    return {
      success: true,
      totalSubmissions: submissions.length,
      institutionTypes: institutionTypes,
      cities: cities,
      monthlyStats: monthlyStats,
      lastSubmission: submissions[submissions.length - 1][7], // Timestamp
      firstSubmission: submissions[0][7] // Timestamp
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
 * Fungsi untuk testing - Enhanced version
 */
function testSubmission() {
  const testData = {
    yourName: 'Test User Enhanced',
    yourInstitutionType: 'Personal',
    yourInstitutionName: 'Test Institution Enhanced',
    yourPhoneNumber: '+62 812-3456-7890',
    yourEmail: 'test.enhanced@example.com',
    yourCity: 'Jakarta',
    whatIsYourReasonForContactingMe: 'This is an enhanced test submission for the Google Frontend Developer competition with improved validation and error handling.',
    timestamp: new Date().toISOString(),
    geolocation: '-6.2088, 106.8456'
  };
  
  console.log('Starting enhanced test submission...');
  const result = submitForm(testData);
  console.log('Enhanced test result:', result);
  return result;
}

/**
 * Fungsi untuk cleanup data lama (optional utility)
 * @param {number} daysOld - hapus data lebih lama dari X hari
 */
function cleanupOldData(daysOld = 365) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
      return { success: false, error: 'Sheet tidak ditemukan' };
    }
    
    const data = sheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    let deletedRows = 0;
    
    // Loop from bottom to top to avoid index shifting
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = data[i][7]; // Column H
      if (timestamp instanceof Date && timestamp < cutoffDate) {
        sheet.deleteRow(i + 1);
        deletedRows++;
      }
    }
    
    return {
      success: true,
      deletedRows: deletedRows,
      message: `Deleted ${deletedRows} old records`
    };
    
  } catch (error) {
    console.error('Error in cleanupOldData:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}
