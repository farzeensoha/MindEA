# MindEase Chrome Extension

## Overview
The MindEase Chrome Extension is a digital wellness companion that monitors your browsing activity, detects toxic content, prevents doomscrolling, and promotes mindful internet usage.

## Features

### 1. **Activity Tracking**
- Monitors active tab and time spent on each website
- Tracks total daily screen time
- Records sites visited (domains only, no sensitive data)
- Syncs data with MindEase web app every 5 minutes

### 2. **Toxicity Detection**
- Real-time analysis of page content for harmful patterns
- Detects hate speech, violence, self-harm content
- Filters negative headlines on news sites
- Shows notifications when toxic content is detected
- Automatic logging to backend for analytics

### 3. **Doomscrolling Prevention**
- Monitors scroll frequency (triggers at 10+ scrolls/minute)
- Shows intervention overlay with mindful suggestions
- Offers mini memory game as distraction
- Option to open wellness chat or dashboard

### 4. **Crisis Detection**
- Scans for sensitive keywords (suicide, self-harm, etc.)
- Immediately shows crisis intervention overlay
- Provides 24/7 helpline numbers and resources
- Offers direct link to wellness chatbot

### 5. **Greyscale Mode**
- Automatically enables when screen time limit is reached
- Visual deterrent to reduce engagement
- Resets daily at midnight
- Can be disabled in settings

### 6. **Mini Mind Game**
- Memory match game with nature emojis
- Provides mental break from scrolling
- Tracks moves and completion time
- Beautiful animations and feedback

## Installation

### For Development:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `/app/chrome-extension/` folder
5. Extension should now appear in your toolbar

### For Users:
(Once published to Chrome Web Store)
1. Visit Chrome Web Store
2. Search for "MindEase"
3. Click "Add to Chrome"

## Setup

### Connecting to Web App:
1. Log in to MindEase web app (https://digital-wellness-13.preview.emergentagent.com)
2. Go to Settings page
3. Copy your API access token (JWT token from localStorage: `mindease-token`)
4. Click MindEase extension icon
5. Click "Settings" in popup
6. Paste token in "API Access Token" field
7. Click "Connect to Web App"
8. Your extension data will now sync with dashboard

## Architecture

### Files Structure:
```
chrome-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── background.js          # Service worker (tracking, alarms, sync)
├── content.js            # Content script (page analysis, interventions)
├── content.css           # Styles for intervention overlays
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── options.html          # Settings page UI
├── options.js            # Settings logic
├── icons/                # Extension icons (16, 48, 128px)
└── README.md             # This file
```

### Data Flow:
1. **Content Script** → Analyzes page content, detects scrolling
2. **Background Worker** → Tracks time, manages alarms, handles storage
3. **Local Storage** → Stores daily stats, settings, history
4. **Backend API** → Syncs data every 5 minutes, logs events

### Storage Schema:
```javascript
{
  dailyStats: {
    totalScreenTime: number,      // milliseconds
    toxicContentDetected: number,
    interventionsShown: number,
    sitesVisited: string[],       // domains
    date: string
  },
  settings: {
    enableTracking: boolean,
    enableToxicityDetection: boolean,
    enableDoomscrollDetection: boolean,
    enableGreyscale: boolean,
    screenTimeLimit: number,      // minutes
    apiToken: string
  },
  statsHistory: Array<dailyStats> // Last 30 days
}
```

## Backend Integration

The extension communicates with two API endpoints:

### 1. Sync Endpoint (POST /api/extension/sync)
**Purpose:** Sync daily statistics to web app dashboard
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "stats": {
    "totalScreenTime": 14400000,
    "toxicContentDetected": 3,
    "interventionsShown": 2,
    "sitesVisited": ["example.com", "news.com"]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 2. Log Endpoint (POST /api/extension/log)
**Purpose:** Log specific events (toxic content, interventions)
**Headers:** `Authorization: Bearer <token>`
**Body:**
```json
{
  "eventType": "toxic_content",
  "data": {
    "url": "https://example.com/article",
    "domain": "example.com",
    "contentType": "text"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Privacy & Security

### Data Collection:
- **Collected:** URLs, domains, time spent, scroll frequency
- **NOT Collected:** Page content, passwords, form data, personal info
- **Storage:** All data stored locally in Chrome storage
- **Transmission:** Only synced to backend with explicit user consent (token)

### Permissions Used:
- `storage` - Store settings and statistics locally
- `tabs` - Monitor active tab changes
- `activeTab` - Access current tab URL
- `alarms` - Schedule periodic syncs and checks
- `scripting` - Inject content scripts for analysis
- `notifications` - Show alerts for toxic content
- `<all_urls>` - Analyze content on all websites

## Customization

### Adjustable Settings:
- Enable/disable each feature independently
- Screen time limit (1-12 hours)
- Toxicity detection sensitivity (code level)
- Doomscroll threshold (code level: `DOOMSCROLL_THRESHOLD`)

### Code Configuration (background.js):
```javascript
const CONFIG = {
  API_URL: 'https://your-backend.com/api',
  SYNC_INTERVAL: 5 * 60 * 1000,     // 5 minutes
  DOOMSCROLL_THRESHOLD: 10,          // scrolls/minute
  SCREEN_TIME_LIMIT: 4 * 60 * 60 * 1000, // 4 hours
  TOXIC_KEYWORDS: [...]              // Crisis keywords
};
```

## Troubleshooting

### Extension Not Tracking:
1. Check if extension is enabled in `chrome://extensions/`
2. Verify "Enable Tracking" is ON in settings
3. Reload the extension and refresh browser tabs

### Sync Not Working:
1. Ensure API token is correctly entered
2. Check internet connection
3. Verify backend is accessible
4. Check console for error messages

### Greyscale Not Activating:
1. Verify screen time limit is reached
2. Check "Enable Greyscale Mode" is ON
3. Reload current tab

### Interventions Not Showing:
1. Enable pop-ups for extension overlays
2. Check content script is injected (F12 → Console)
3. Verify detector settings are enabled

## Development

### Testing Locally:
```bash
# No build step required - pure vanilla JS
# Just load unpacked extension in Chrome

# To test background worker:
chrome://extensions/ → MindEase → "Inspect views: service worker"

# To test content script:
F12 on any webpage → Console tab
```

### Adding New Features:
1. **New Detection Pattern:** Add to `TOXIC_PATTERNS` in content.js
2. **New Intervention:** Create overlay function in content.js
3. **New Stat:** Update `dailyStats` schema in background.js
4. **New Setting:** Add UI in options.html and logic in options.js

## Future Enhancements

- [ ] ML-based toxicity detection (TensorFlow.js)
- [ ] Productivity mode (block distracting sites)
- [ ] Focus timer with Pomodoro technique
- [ ] Website whitelist/blacklist
- [ ] Weekly/monthly reports
- [ ] Export data as CSV/JSON
- [ ] Social features (compare with friends)
- [ ] Custom intervention messages
- [ ] Integration with screen time APIs

## License
MIT License - Part of MindEase Digital Wellness Platform

## Support
For issues or questions:
- GitHub: [Submit an issue]
- Email: support@mindease.com
- Web App: Settings → Help & Support
