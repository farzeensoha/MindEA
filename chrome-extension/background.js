// MindEase Background Service Worker

const CONFIG = {
  API_URL: 'http://127.0.0.1:8001/api', // ✅ local backend
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
  DOOMSCROLL_THRESHOLD: 10, // scrolls per minute
  SCREEN_TIME_LIMIT: 4 * 60 * 60 * 1000, // 4 hours
  TOXIC_KEYWORDS: [
    'suicide',
    'kill myself',
    'sleeping pills',
    'end it all',
    'want to die', "numb", "die", "kill"
  ]
};


let activeTabData = {
  tabId: null,
  url: '',
  startTime: null,
  scrollCount: 0,
  lastScrollTime: null
};
// Store latest semantic data per tab
let semanticPageData = {};
let lastDoomscrollIntervention = 0;

let dailyStats = {
  totalScreenTime: 0,
  toxicContentDetected: 0,
  interventionsShown: 0,
  sitesVisited: [],
  date: new Date().toDateString()
};

async function loadSavedState() {
  const stored = await chrome.storage.local.get(['dailyStats', 'settings']);
  const today = new Date().toDateString();

  if (stored.dailyStats) {
    if (stored.dailyStats.date !== today) {
      dailyStats = {
        totalScreenTime: 0,
        toxicContentDetected: 0,
        interventionsShown: 0,
        sitesVisited: [],
        date: today
      };
      await chrome.storage.local.set({ dailyStats });
    } else {
      dailyStats = stored.dailyStats;
    }
  }

  if (!stored.settings) {
    await chrome.storage.local.set({
      settings: {
        enableTracking: true,
        enableToxicityDetection: true,
        enableDoomscrollDetection: true,
        enableGreyscale: true,
        screenTimeLimit: 4 * 60, // minutes
        apiToken: null
      }
    });
  }
}

loadSavedState();

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('MindEase extension installed');
  await loadSavedState();
  
  // Create alarms
  chrome.alarms.create('syncData', { periodInMinutes: 5 });
  chrome.alarms.create('checkScreenTime', { periodInMinutes: 1 });
  chrome.alarms.create('resetDaily', { when: getNextMidnight() });
});

chrome.runtime.onStartup.addListener(async () => {
  await loadSavedState();
});

function getNextMidnight() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

// Track active tab changes
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await saveCurrentTabTime();
  
  const tab = await chrome.tabs.get(activeInfo.tabId);
  startTrackingTab(tab);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    await saveCurrentTabTime();
    startTrackingTab(tab);
  }
});

function startTrackingTab(tab) {
  if (!tab.url || tab.url.startsWith('chrome://')) return;
  
  activeTabData = {
    tabId: tab.id,
    url: tab.url,
    startTime: Date.now(),
    scrollCount: 0,
    lastScrollTime: Date.now()
  };
  
  // Add to sites visited
  const domain = new URL(tab.url).hostname;
  if (!dailyStats.sitesVisited.includes(domain)) {
    dailyStats.sitesVisited.push(domain);
  }
}

async function saveCurrentTabTime() {
  if (activeTabData.startTime) {
    const timeSpent = Date.now() - activeTabData.startTime;
    dailyStats.totalScreenTime += timeSpent;
    await chrome.storage.local.set({ dailyStats });
  }
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCROLL_DETECTED') {
    handleScrollDetection(sender.tab.id);
  } else if (message.type === 'TOXIC_CONTENT_FOUND') {
    handleToxicContent(message.data, sender.tab);
  } else if (message.type === 'SENSITIVE_TEXT_DETECTED') {
    handleSensitiveText(message.data, sender.tab);
  } else if (message.type === 'GET_STATS') {
    sendResponse(dailyStats);
  } else if (message.type === 'SHOW_GAME') {
    showMiniGame(sender.tab.id);
  }
  else if (message.type === 'SEMANTIC_PAGE_DATA') {
  if (sender.tab && sender.tab.id) {
    semanticPageData[sender.tab.id] = message.data;
    console.log('Semantic data stored for tab:', sender.tab.id);
  }
}

  return true;
});

function handleScrollDetection(tabId) {
  const now = Date.now();
  
  if (activeTabData.tabId === tabId) {
    activeTabData.scrollCount++;
    
    // Check for doomscrolling (10+ scrolls per minute)
    const timeDiff = now - activeTabData.lastScrollTime;
    if (timeDiff < 60000) { // Within 1 minute
      const scrollRate = (activeTabData.scrollCount / timeDiff) * 60000;
      
      if (scrollRate > CONFIG.DOOMSCROLL_THRESHOLD) {
        showDoomscrollIntervention(tabId);
        activeTabData.scrollCount = 0; // Reset
      }
    }
    
    activeTabData.lastScrollTime = now;
  }
}

function handleToxicContent(data, tab) {
  dailyStats.toxicContentDetected++;
  chrome.storage.local.set({ dailyStats });
  
  chrome.tabs.sendMessage(tab.id, {
    type: 'SHOW_TOXIC_INTERVENTION',
    data: {
      keyword: data.type === 'text' ? data.patterns : data.type,
      message: 'Potentially harmful or toxic content was detected on this page. You might want to take a short break.',
      suggestions: [
        'Pause and breathe',
        'Visit your dashboard for support',
        'Read a calming article',
        'Take a short walk'
      ]
    }
  });
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Toxic Content Detected',
    message: 'MindEase detected potentially harmful content on this page. Consider taking a break.',
    priority: 2
  });
  
  // Log to backend
  logToBackend('toxic_content', {
    url: tab.url,
    domain: new URL(tab.url).hostname,
    contentType: data.type,
    timestamp: new Date().toISOString()
  });
}

function handleSensitiveText(data, tab) {
  // Immediate intervention for crisis keywords
  chrome.tabs.sendMessage(tab.id, {
    type: 'SHOW_CRISIS_INTERVENTION',
    data: {
      keyword: data.keyword,
      resources: [
        { name: 'National Suicide Prevention Lifeline', contact: '988' },
        { name: 'Crisis Text Line', contact: 'Text HOME to 741741' },
        { name: 'International Association for Suicide Prevention', url: 'https://www.iasp.info/resources/Crisis_Centres/' }
      ]
    }
  });
  
  dailyStats.interventionsShown++;
  chrome.storage.local.set({ dailyStats });
}

function showDoomscrollIntervention(tabId) {
  const now = Date.now();
  const DOOMSCROLL_COOLDOWN_MS = 2 * 60 * 1000;
  if (now - lastDoomscrollIntervention < DOOMSCROLL_COOLDOWN_MS) return;

  lastDoomscrollIntervention = now;
  dailyStats.interventionsShown++;
  chrome.storage.local.set({ dailyStats });
  
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_DOOMSCROLL_INTERVENTION',
    data: {
      message: 'You\'ve been scrolling a lot! Time for a mindful break?',
      suggestions: [
        'Take 5 deep breaths',
        'Play a quick mind game',
        'Check your MindEase dashboard',
        'Stand up and stretch'
      ]
    }
  });
}

function showMiniGame(tabId) {
  chrome.tabs.sendMessage(tabId, {
    type: 'SHOW_MINI_GAME'
  });
}

// Alarm handlers
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'syncData') {
    await syncDataToBackend();
  } else if (alarm.name === 'checkScreenTime') {
    await checkScreenTimeLimit();
  } else if (alarm.name === 'resetDaily') {
    await resetDailyStats();
    chrome.alarms.create('resetDaily', { when: getNextMidnight() });
  }
});

async function syncDataToBackend() {
  const { settings } = await chrome.storage.local.get('settings');
  
  if (!settings || !settings.apiToken) {
    console.log('No API token set, skipping sync');
    return;
  }
  
  try {
    await saveCurrentTabTime();
    
    const response = await fetch(`${CONFIG.API_URL}/extension/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        stats: dailyStats,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      console.log('Data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync data:', error);
  }
}

async function checkScreenTimeLimit() {
  const { settings } = await chrome.storage.local.get('settings');
  
  if (!settings || !settings.enableGreyscale) return;
  
  await saveCurrentTabTime();
  
  const limitMs = settings.screenTimeLimit * 60 * 1000;
  
  if (dailyStats.totalScreenTime >= limitMs) {
    // Enable greyscale mode
    const tabs = await chrome.tabs.query({ active: true });
    tabs.forEach(tab => {
      if (!tab.url.startsWith('chrome://')) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'ENABLE_GREYSCALE'
        });
      }
    });
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Screen Time Limit Reached',
      message: 'You\'ve reached your daily screen time limit. Greyscale mode enabled to encourage a break.',
      priority: 2
    });
  }
}

async function resetDailyStats() {
  await saveCurrentTabTime();
  
  // Archive old stats
  const { statsHistory = [] } = await chrome.storage.local.get('statsHistory');
  statsHistory.push({
    ...dailyStats,
    date: dailyStats.date
  });
  
  // Keep only last 30 days
  if (statsHistory.length > 30) {
    statsHistory.shift();
  }
  
  await chrome.storage.local.set({ statsHistory });
  
  // Reset daily stats
  dailyStats = {
    totalScreenTime: 0,
    toxicContentDetected: 0,
    interventionsShown: 0,
    sitesVisited: [],
    date: new Date().toDateString()
  };
  
  await chrome.storage.local.set({ dailyStats });
  
  // Disable greyscale for new day
  const tabs = await chrome.tabs.query({});
  tabs.forEach(tab => {
    if (!tab.url.startsWith('chrome://')) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'DISABLE_GREYSCALE'
      }).catch(() => {});
    }
  });
}

async function logToBackend(eventType, data) {
  const { settings } = await chrome.storage.local.get('settings');
  
  if (!settings || !settings.apiToken) return;
  
  try {
    await fetch(`${CONFIG.API_URL}/extension/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiToken}`
      },
      body: JSON.stringify({
        eventType,
        data,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Failed to log event:', error);
  }
}

// Handle extension icon click
// Handle extension icon click
chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'http://localhost:3000/dashboard' });
});
