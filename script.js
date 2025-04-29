// Variables globales
let emails = [];
let checkedEmails = new Set();

// Función para guardar el estado
function saveState() {
  localStorage.setItem('emails', JSON.stringify(emails));
  localStorage.setItem('checkedEmails', JSON.stringify(Array.from(checkedEmails)));
}

// Función para cargar el estado
function loadState() {
  const savedEmails = localStorage.getItem('emails');
  const savedCheckedEmails = localStorage.getItem('checkedEmails');
  
  emails = savedEmails ? JSON.parse(savedEmails) : [];
  checkedEmails = new Set(savedCheckedEmails ? JSON.parse(savedCheckedEmails) : []);
  displayEmails();
}

// Función para copiar al clipboard
async function copyToClipboard(text, emailDiv) {
  try {
    await navigator.clipboard.writeText(text);
    
    emailDiv.classList.add('copied');
    setTimeout(() => {
      emailDiv.classList.remove('copied');
    }, 500);

    emailDiv.classList.add('checked');
    checkedEmails.add(text);
    saveState();
    
    const counterElement = document.getElementById('emailCounter');
    counterElement.textContent = `${checkedEmails.size}/${emails.length} emails checked`;
  } catch (err) {
    console.error('Error copying:', err);
  }
}

// Función para mostrar los correos
function displayEmails() {
  const emailListDiv = document.getElementById('emailList');
  emailListDiv.innerHTML = '';

  emails.forEach(email => {
    const emailDiv = document.createElement('div');
    emailDiv.className = 'email-item';
    if (checkedEmails.has(email)) {
      emailDiv.classList.add('checked');
    }
    
    const emailText = document.createElement('span');
    emailText.className = 'email-text';
    emailText.textContent = email;
    
    const checkIcon = document.createElement('span');
    checkIcon.className = 'check-icon';
    checkIcon.innerHTML = '✓';
    
    emailDiv.appendChild(emailText);
    emailDiv.appendChild(checkIcon);
    
    emailDiv.addEventListener('click', () => {
      copyToClipboard(email, emailDiv);
    });
    
    emailListDiv.appendChild(emailDiv);
  });

  const counterElement = document.getElementById('emailCounter');
  counterElement.textContent = `${checkedEmails.size}/${emails.length} emails checked`;
}

// Función para procesar el archivo
function processFile(file) {
  if (file.name.endsWith('.csv')) {
    // Procesar CSV como antes
    const reader = new FileReader();
    reader.onload = function(event) {
      const csvData = event.target.result;
      emails = csvData.split(/\r?\n/).filter(email => email.trim());
      saveState();
      displayEmails();
    };
    reader.readAsText(file);
  } else if (file.name.endsWith('.xlsx')) {
    // Procesar Excel
    const reader = new FileReader();
    reader.onload = function(event) {
      const data = new Uint8Array(event.target.result);
      const workbook = XLSX.read(data, {type: 'array'});
      
      // Obtener la primera hoja
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      
      // Convertir a array de valores
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});
      
      // Extraer emails (asumiendo que están en la primera columna)
      emails = jsonData
        .flat() // Aplanar el array por si hay múltiples columnas
        .filter(email => email && typeof email === 'string' && email.trim()) // Filtrar valores válidos
        .map(email => email.trim());
      
      saveState();
      displayEmails();
    };
    reader.readAsArrayBuffer(file);
  }
}

// Función para limpiar la lista
function clearEmailsList() {
  if (confirm('Are you sure you want to clear the emails list?')) {
    emails = [];
    checkedEmails.clear();
    saveState();
    displayEmails();
  }
}

// Función para extraer el ID de la spreadsheet del URL de Google Sheets
function extractSpreadsheetId(url) {
  const matches = url.match(/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return matches ? matches[1] : null;
}

// Función para obtener datos de Google Sheets
async function fetchGoogleSheetsData(url) {
  try {
    const spreadsheetId = extractSpreadsheetId(url);
    if (!spreadsheetId) {
      throw new Error('Invalid Google Sheets URL');
    }

    const API_KEY = 'AIzaSyBG1SANUiU_OTLdgguTDmC3jFb70nZn4Hk';
    // Intentemos obtener todas las hojas primero
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${API_KEY}`
    );

    if (!sheetsResponse.ok) {
      const errorData = await sheetsResponse.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const sheetsData = await sheetsResponse.json();
    const firstSheetName = sheetsData.sheets[0].properties.title;

    // Ahora obtenemos los datos usando el nombre correcto de la hoja
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${firstSheetName}!A:A?key=${API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.values || !data.values.length) {
      throw new Error('No data found in spreadsheet');
    }

    // Extraer emails de los valores (solo columna A)
    emails = data.values
      .map(row => row[0]) // Tomar solo el primer elemento de cada fila
      .filter(email => email && typeof email === 'string' && email.trim()) // Filtrar valores válidos
      .map(email => email.trim());

    if (emails.length === 0) {
      throw new Error('No valid emails found in spreadsheet');
    }

    saveState();
    displayEmails();
    
  } catch (error) {
    console.error('Detailed error:', error);
    alert('Error loading Google Sheet: ' + error.message);
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  document.getElementById('redirectButton').addEventListener('click', () => {
    window.open('https://usen.oshireq.com/song/6547677', '_blank');
  });

  document.getElementById('clearEmailsButton').addEventListener('click', clearEmailsList);

  document.getElementById('csvFile').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    } else {
      alert('Please upload a valid file');
    }
  });

  document.getElementById('loadSheets').addEventListener('click', () => {
    const url = document.getElementById('sheetsUrl').value;
    if (url) {
      fetchGoogleSheetsData(url);
    } else {
      alert('Please enter a Google Sheets URL');
    }
  });
}); 