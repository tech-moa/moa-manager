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

// Función para procesar el CSV
function processCSV(file) {
  const reader = new FileReader();
  reader.onload = function(event) {
    const csvData = event.target.result;
    emails = csvData.split(/\r?\n/).filter(email => email.trim());
    saveState();
    displayEmails();
  };
  reader.readAsText(file);
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
      processCSV(file);
    } else {
      alert('Please upload a valid CSV file');
    }
  });
}); 