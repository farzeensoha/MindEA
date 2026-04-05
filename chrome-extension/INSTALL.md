# MindEase Chrome Extension - Quick Start Guide



## Installation Steps

### Step 1: Prepare Icons (One-time setup)
Before loading the extension, you need icon files. Quick method:

```bash
cd /app/chrome-extension/icons

# Create simple placeholder icons (requires Python with PIL)
python3 << 'EOF'
from PIL import Image, ImageDraw

for size in [16, 48, 128]:
    img = Image.new('RGB', (size, size), color='#4a7c59')
    draw = ImageDraw.Draw(img)
    # Add a simple circle
    margin = size // 4
    draw.ellipse([margin, margin, size-margin, size-margin], fill='#c6f6d5')
    img.save(f'icon{size}.png')
    print(f'Created icon{size}.png')
EOF
```

**Alternative:** Download any 3 PNG images, rename them to `icon16.png`, `icon48.png`, `icon128.png` and place in `/app/chrome-extension/icons/`

### Step 2: Load Extension in Chrome

1. **Open Chrome Extensions Page:**
   - Visit `chrome://extensions/` in your browser
   - OR: Menu (⋮) → More Tools → Extensions

2. **Enable Developer Mode:**
   - Toggle "Developer mode" switch in top-right corner

3. **Load the Extension:**
   - Click "Load unpacked" button
   - Navigate to `/app/chrome-extension/` folder
   - Click "Select Folder"

4. **Verify Installation:**
   - Extension "MindEase - Digital Wellness Companion" should appear
   - Icon should be visible in Chrome toolbar
   - Status should show "Enabled"

### Step 3: Connect to Web App

1. **Get Your Access Token:**
   - Open https://digital-wellness-13.preview.emergentagent.com
   - Log in to your account
   - Open browser DevTools (F12)
   - Go to Console tab
   - Type: `localStorage.getItem('mindease-token')`
   - Copy the token (long string starting with `eyJ...`)

2. **Configure Extension:**
   - Click MindEase extension icon in toolbar
   - Click "Settings" at bottom
   - Paste token in "API Access Token" field
   - Click "Connect to Web App"
   - You should see "Successfully connected!" message

### Step 4: Verify It's Working

1. **Check Popup:**
   - Click extension icon
   - Should show stats (initially 0)
   - Status should say "Extension active and monitoring"

2. **Test Tracking:**
   - Browse a few websites
   - Wait 1-2 minutes
   - Click extension icon again
   - "Sites Visited" should increment

3. **Test Doomscroll Detection:**
   - Open any long webpage (news site, social media)
   - Scroll rapidly up and down 10+ times
   - Should see intervention overlay appear

4. **Check Dashboard:**
   - Open https://digital-wellness-13.preview.emergentagent.com/dashboard
   - After 5 minutes, stats should sync and display

## Features to Test

### 1. Activity Tracking
- Automatically tracks time on each website
- View stats in popup
- Data syncs to dashboard every 5 minutes

### 2. Toxicity Detection
- Visit news sites with negative headlines
- Should receive notification if toxic content detected
- Counter increases in popup

### 3. Doomscrolling Prevention
- Scroll rapidly on any page
- Intervention overlay appears with suggestions
- Try the mini memory game

### 4. Crisis Detection
- (Test with caution) Extension detects crisis keywords
- Shows intervention with helpline numbers
- Offers to open wellness chatbot

### 5. Greyscale Mode
- Set screen time limit to 1 hour in settings
- After 1 hour of browsing, greyscale activates
- Page turns black and white automatically

### 6. Screen Time Stats
- Click extension icon to see daily totals
- View breakdown by site in future versions
- Resets at midnight

## Troubleshooting

### Extension Not Loading
**Error:** "Manifest file is missing or unreadable"
- Solution: Ensure you selected the `/app/chrome-extension/` folder, not a subfolder

**Error:** "Could not load icon"
- Solution: Create icon files following Step 1

### Tracking Not Working
- Verify "Enable Tracking" is ON in settings
- Check extension is enabled in `chrome://extensions/`
- Reload extension: Toggle switch OFF then ON

### Sync Failing
- Ensure token is correctly copied (no extra spaces)
- Check backend is running: Visit `https://digital-wellness-13.preview.emergentagent.com/api/`
- Try disconnecting and reconnecting

### Overlays Not Appearing
- Check browser console (F12) for errors
- Reload the webpage
- Some sites may block content scripts (rare)

### Greyscale Not Activating
- Verify screen time limit is reached
- Check "Enable Greyscale Mode" is ON
- Refresh current tab

## Customization

### Adjust Screen Time Limit:
Settings → Daily Screen Time Limit → Drag slider (1-12 hours)

### Disable Specific Features:
Settings → Activity Tracking → Toggle individual features OFF

### Change Doomscroll Sensitivity:
Edit `/app/chrome-extension/background.js`:
```javascript
DOOMSCROLL_THRESHOLD: 10  // Change to 15 for less sensitivity
```

### Add Custom Toxic Keywords:
Edit `/app/chrome-extension/background.js`:
```javascript
TOXIC_KEYWORDS: ['your', 'keywords', 'here']
```

## Uninstallation

1. Go to `chrome://extensions/`
2. Find "MindEase"
3. Click "Remove"
4. Confirm removal
5. All local data will be cleared

## Privacy Notice

**Data Collected:**
- Website URLs and domains
- Time spent on each site
- Scroll frequency
- Detected toxic content events

**Data NOT Collected:**
- Page content or screenshots
- Passwords or form inputs
- Personal messages or emails
- Payment information

**Data Storage:**
- Stored locally in Chrome
- Only synced when you provide token
- You can disconnect anytime

## Support

For help:
- Check logs: `chrome://extensions/` → MindEase → "Inspect views"
- View README: `/app/chrome-extension/README.md`
- Contact: support@mindease.com
- Dashboard: Settings → Help

## Next Steps

1. Explore all features
2. Customize settings to your preferences
3. Monitor your digital wellness journey
4. Share feedback for improvements

Happy mindful browsing! 🧘
