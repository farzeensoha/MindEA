// MindEase Options Script

const API_URL = 'http://127.0.0.1:8001/api'; 

const DEFAULT_SETTINGS = {
  enableTracking: true,
  enableToxicityDetection: true,
  enableDoomscrollDetection: true,
  enableGreyscale: true,
  screenTimeLimit: 240, // minutes
  apiToken: null
};

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  const currentSettings = settings || DEFAULT_SETTINGS;
  
  // Load values
  document.getElementById('api-token').value = currentSettings.apiToken || '';
  document.getElementById('enable-tracking').checked = currentSettings.enableTracking;
  document.getElementById('enable-toxicity').checked = currentSettings.enableToxicityDetection;
  document.getElementById('enable-doomscroll').checked = currentSettings.enableDoomscrollDetection;
  document.getElementById('enable-greyscale').checked = currentSettings.enableGreyscale;
  document.getElementById('screen-time-limit').value = currentSettings.screenTimeLimit;
  
  updateLimitDisplay(currentSettings.screenTimeLimit);
}

function setupEventListeners() {
  // Screen time limit slider
  document.getElementById('screen-time-limit').addEventListener('input', (e) => {
    updateLimitDisplay(e.target.value);
  });
  
  // Save token
  document.getElementById('save-token').addEventListener('click', async () => {
    const token = document.getElementById('api-token').value.trim();
    if (!token) {
      showAlert('Please enter a token', 'error');
      return;
    }
    
    // Test token against LOCAL backend
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const { settings } = await chrome.storage.local.get('settings');
        await chrome.storage.local.set({
          settings: { ...settings, apiToken: token }
        });
        showAlert('Successfully connected to MindEase!', 'success');
      } else {
        showAlert('Invalid token. Please check and try again.', 'error');
      }
    } catch (error) {
      showAlert('Failed to connect to local backend. Is it running?', 'error');
    }
  });
  
  // Save all settings
  document.getElementById('save-settings').addEventListener('click', async () => {
    const settings = {
      enableTracking: document.getElementById('enable-tracking').checked,
      enableToxicityDetection: document.getElementById('enable-toxicity').checked,
      enableDoomscrollDetection: document.getElementById('enable-doomscroll').checked,
      enableGreyscale: document.getElementById('enable-greyscale').checked,
      screenTimeLimit: parseInt(document.getElementById('screen-time-limit').value),
      apiToken: document.getElementById('api-token').value.trim() || null
    };
    
    await chrome.storage.local.set({ settings });
    showAlert('Settings saved successfully!', 'success');
  });
  
  // Reset settings
  document.getElementById('reset-settings').addEventListener('click', async () => {
    if (confirm('Are you sure you want to reset all settings to defaults?')) {
      await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
      await loadSettings();
      showAlert('Settings reset to defaults', 'success');
    }
  });
}

function updateLimitDisplay(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  let display;
  if (hours > 0 && mins > 0) {
    display = `${hours}h ${mins}m`;
  } else if (hours > 0) {
    display = `${hours} hours`;
  } else {
    display = `${mins} minutes`;
  }
  
  document.getElementById('limit-value').textContent = display;
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.textContent = message;
  alert.className = `alert ${type} show`;
  
  setTimeout(() => {
    alert.classList.remove('show');
  }, 5000);
}
