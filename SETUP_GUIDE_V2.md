# MindEase v2.0 - Complete Local Setup Guide

## 🆕 What's New in v2.0

### Major Updates:
1. **Social Bubble** - New first-class feature for private social circles
2. **Enhanced Content Moderation** - Semantic AI-powered moderation with Gemini
3. **Direct Gemini API Integration** - Replaced Emergent LLM with Google Gemini Free API
4. **Weekly Challenges** - Gamified wellness challenges with growth tokens
5. **Improved Privacy** - No likes, no metrics, no public counters

---

## 📋 Prerequisites

### Required Software

| Software | Minimum Version | Download Link | Purpose |
|----------|----------------|---------------|---------|
| **Node.js** | v18.0.0+ | https://nodejs.org | Frontend development |
| **Yarn** | v1.22.0+ | https://yarnpkg.com | Frontend package manager |
| **Python** | v3.11.0+ | https://python.org | Backend development |
| **pip** | v23.0.0+ | Included with Python | Python package manager |
| **MongoDB** | v6.0.0+ | https://www.mongodb.com/try/download/community | Database |
| **Google Chrome** | Latest | https://www.google.com/chrome | For extension testing |

### Verify Installations

```bash
# Check versions
node --version  # Should be v18.0.0+
yarn --version  # Should be v1.22.0+
python3 --version  # Should be v3.11.0+
mongod --version  # Should be v6.0.0+
```

---

## 🔑 Get Your Gemini API Key (FREE)

**This is REQUIRED for the app to work!**

### Step 1: Visit Google AI Studio
1. Go to https://aistudio.google.com/
2. Sign in with your Google account
3. Accept the terms of service

### Step 2: Generate API Key
1. Click "Get API Key" in the top navigation
2. Click "Create API Key"
3. Select "Create API key in new project"
4. Copy the generated key (starts with `AIza...`)
5. Save it securely - you'll need it in Step 3 of backend setup

### Important Notes:
- **Free tier limits**: ~15-20 requests per minute for Gemini 2.0 Flash
- No credit card required for free tier
- API key is tied to your Google account
- Do NOT share your API key publicly

---

## 🚀 Step-by-Step Setup

### Step 1: Start MongoDB

**Option A: As a Service (Recommended)**
```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Windows
# Start from Services or run:
"C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe"
```

**Option B: Docker**
```bash
docker run -d -p 27017:27017 --name mindease-mongo mongo:6.0
```

**Verify MongoDB:**
```bash
mongosh  # Should connect successfully
exit
```

---

### Step 2: Backend Setup

#### 2.1 Navigate to Backend
```bash
cd backend
```

#### 2.2 Create Virtual Environment (Recommended)
```bash
# Create venv
python3 -m venv venv

# Activate
# macOS/Linux:
source venv/bin/activate

# Windows:
venv\Scripts\activate

# Prompt should show (venv)
```

#### 2.3 Install Dependencies
```bash
pip install -r requirements.txt

# This installs:
# - FastAPI, Uvicorn
# - google-generativeai (Gemini SDK)
# - Motor (MongoDB async)
# - JWT, bcrypt (auth)
# - And more...
```

#### 2.4 Configure Environment Variables

**Edit `backend/.env` with your Gemini API key:**

```env
# MongoDB
MONGO_URL="mongodb://localhost:27017"
DB_NAME="mindease_db"

# CORS
CORS_ORIGINS="*"

# ⚠️ IMPORTANT: Add your Gemini API key here!
GEMINI_API_KEY=AIzaSyYOUR_API_KEY_HERE

# JWT Auth
JWT_SECRET=mindease_secret_key_2025_change_in_production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

**🚨 CRITICAL:** Replace `AIzaSyYOUR_API_KEY_HERE` with your actual Gemini API key from Google AI Studio!

#### 2.5 Start Backend Server
```bash
# Make sure venv is activated
uvicorn server:app --host 0.0.0.0 --port 8001 --reload

# You should see:
# INFO: Uvicorn running on http://0.0.0.0:8001
# INFO: Application startup complete.
```

**Test Backend:**
```bash
# In new terminal:
curl http://localhost:8001/api/

# Expected response:
# {"message":"MindEase API v2.0","status":"active","ai_provider":"Google Gemini"}
```

**Keep this terminal running!**

---

### Step 3: Frontend Setup

#### 3.1 Open New Terminal
```bash
cd frontend
```

#### 3.2 Install Dependencies
```bash
yarn install

# Installs React 19, Tailwind, Shadcn, etc.
# Takes 2-3 minutes
```

#### 3.3 Verify Environment Variables

**Check `frontend/.env`:**

```env
REACT_APP_BACKEND_URL=http://localhost:8001
WDS_SOCKET_PORT=3000
REACT_APP_ENABLE_VISUAL_EDITS=false
ENABLE_HEALTH_CHECK=false
```

**Important:** `REACT_APP_BACKEND_URL` should be `http://localhost:8001` (no trailing slash)

#### 3.4 Start Frontend
```bash
yarn start

# Browser opens at http://localhost:3000
# Should see: "Compiled successfully!"
```

**Keep this terminal running!**

---

### Step 4: Chrome Extension Setup

#### 4.1 Verify Icons Exist
```bash
cd chrome-extension/icons
ls -la

# Should see: icon16.png, icon48.png, icon128.png
```

If missing, create them:
```bash
python3 << 'EOF'
from PIL import Image, ImageDraw
for size in [16, 48, 128]:
    img = Image.new('RGB', (size, size), (74, 124, 89))
    draw = ImageDraw.Draw(img)
    m = size // 4
    draw.ellipse([m, m, size-m, size-m], fill=(198, 246, 213))
    img.save(f'icon{size}.png')
    print(f'Created icon{size}.png')
EOF
```

#### 4.2 Load Extension in Chrome

1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode" (toggle top-right)
3. Click "Load unpacked"
4. Select `chrome-extension/` folder
5. Extension should appear enabled

#### 4.3 Connect Extension to App

1. **Sign up in the web app:**
   - Go to http://localhost:3000
   - Create account

2. **Get your JWT token:**
   - Open DevTools (F12)
   - Console tab
   - Run: `localStorage.getItem('mindease-token')`
   - Copy the token

3. **Configure extension:**
   - Click extension icon
   - Click "Settings"
   - Paste token
   - Click "Connect to Web App"
   - Should see success message

---

## 🎯 Testing the Complete System

### Test 1: Basic Features
```bash
1. Sign up at http://localhost:3000
2. Navigate to Dashboard - should load
3. Go to Wellness - chat with AI bot
4. Go to Community - create a post
5. Go to Learning - generate flashcards
```

### Test 2: Social Bubble (NEW!)
```bash
1. Navigate to Social Bubble
2. Click "New Bubble"
3. Create a bubble
4. Click "Post" button
5. Add caption (try including #detox)
6. Post should appear in feed
7. Check if challenge completed (growth tokens +1)
```

### Test 3: Enhanced Moderation (NEW!)
```bash
# Test positive content:
1. Post: "you're fucking amazing!" → Should be allowed (PROFANITY_ONLY)
2. Post: "great work!" → Should be allowed (SAFE)

# Test toxic content:
3. Post: "you're an idiot" → Should be BLOCKED (TOXIC)
4. Post: "I hate all [group]" → Should be BLOCKED (HATE)

# Test ambiguous content:
5. Post: "whatever" → May ask for clarification (AMBIGUOUS)
```

### Test 4: AI with Gemini
```bash
# Wellness Chat:
1. Go to Wellness page
2. Type: "I'm feeling stressed"
3. Should get empathetic response (2-4 second delay)

# Flashcard Generation:
1. Go to Learning
2. Topic: "Python"
3. Content: "Python is a programming language..."
4. Click Generate
5. Should create 5 flashcards

# Content Moderation:
1. Try posting toxic content
2. Should be blocked with AI-generated reason
```

### Test 5: Extension Integration
```bash
1. Browse 3-4 websites with extension active
2. Wait 5 minutes
3. Check Dashboard
4. Screen time should sync from extension
5. Extension icon shows stats
```

---

## ❌ Troubleshooting

### Error: "Gemini API Key Not Configured"

**Problem:** Backend can't access Gemini API

**Solution:**
```bash
# 1. Check backend/.env has your key
grep GEMINI_API_KEY backend/.env

# 2. Should show: GEMINI_API_KEY=AIzaSy...
# 3. If empty, add your key from Google AI Studio
# 4. Restart backend:
# Ctrl+C then restart uvicorn
```

### Error: "Rate limit exceeded" or "429 Error"

**Problem:** Hit Gemini free tier limit (~15 req/min)

**Solution:**
```bash
# Wait 60 seconds before retrying
# Free tier resets every minute

# Check your quota at:
# https://aistudio.google.com/app/apikey
```

### Error: MongoDB Connection Failed

**Solution:**
```bash
# Check if MongoDB running:
pgrep mongod  # Should return PID

# If not running:
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Docker: docker start mindease-mongo
```

### Error: Port Already in Use

**Backend (8001):**
```bash
lsof -i :8001  # Find PID
kill -9 <PID>
# Or use different port: uvicorn server:app --port 8002
```

**Frontend (3000):**
```bash
lsof -i :3000
kill -9 <PID>
# Or accept different port when prompted
```

### Error: Module Not Found

**Backend:**
```bash
# Activate venv first!
source venv/bin/activate
pip install -r requirements.txt
```

**Frontend:**
```bash
rm -rf node_modules yarn.lock
yarn install
```

### Social Bubble Not Loading

**Check:**
```bash
# 1. Backend logs for errors
# Look at terminal running uvicorn

# 2. Browser console (F12)
# Look for network errors

# 3. Test API directly:
curl http://localhost:8001/api/bubbles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Extension Not Syncing

**Solution:**
```bash
# 1. Get fresh token:
localStorage.getItem('mindease-token')

# 2. Re-enter in extension settings
# 3. Check extension console:
chrome://extensions/ → MindEase → Inspect views
```

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Landing Page** | http://localhost:3000 | Public homepage |
| **Dashboard** | http://localhost:3000/dashboard | Analytics overview |
| **Wellness** | http://localhost:3000/wellness | AI chat & exercises |
| **Community** | http://localhost:3000/community | Hope Notes feed |
| **Social Bubble** 🆕 | http://localhost:3000/social-bubble | Private social circles |
| **Learning** | http://localhost:3000/learning | Flashcard generator |
| **Settings** | http://localhost:3000/settings | User preferences |
| **API Status** | http://localhost:8001/api/ | Backend health check |
| **API Docs** | http://localhost:8001/docs | Swagger UI |

---

## 📊 New Features Guide

### Social Bubble Features

**Creating a Bubble:**
1. Click "New Bubble" button
2. Enter name and description
3. Bubble is private by default
4. Only you are a member initially

**Inviting Members:**
1. Select your bubble
2. Click "Invite" button
3. Enter friend's email (must be registered)
4. They'll be added to your bubble

**Posting in Bubble:**
1. Click "Post" button
2. Write caption (required)
3. Add image URL (optional)
4. Post visible only to bubble members
5. No likes, no public metrics

**Weekly Challenge:**
1. Challenge appears at top of feed
2. Post with the challenge tag (e.g., #detox)
3. Automatically marks challenge as complete
4. Earn 1 growth token (private)
5. New challenge every Monday

**Growth Tokens:**
- Displayed in top-right corner
- Private to you only
- No leaderboards or comparisons
- Used for future premium features

### Enhanced Moderation

**How it Works:**
- AI analyzes intent, not just keywords
- Context-aware (understands sarcasm)
- Handles obfuscated text (l33tspeak)
- 6 categories: SAFE, AMBIGUOUS, PROFANITY_ONLY, NEGATIVE, TOXIC, HATE

**User Experience:**
- **TOXIC/HATE:** Blocked immediately with AI reason
- **AMBIGUOUS:** Suggests clearer wording
- **PROFANITY_ONLY:** Allowed if positive intent ("fucking amazing")
- **SAFE/NEGATIVE:** Allowed through

---

## 📖 API Documentation

### New Endpoints

**Social Bubble:**
```bash
GET  /api/bubbles                    # Get my bubbles
POST /api/bubbles                    # Create bubble
POST /api/bubbles/invite             # Invite member
DELETE /api/bubbles/{id}/leave       # Leave bubble
GET  /api/bubbles/{id}/posts         # Get bubble posts
POST /api/bubbles/posts              # Create post
POST /api/bubbles/posts/{id}/reply   # Add reply
```

**Challenges:**
```bash
GET /api/challenges/current          # This week's challenge
GET /api/challenges/my-completions   # My completion history
```

### Updated Endpoints

**All endpoints now use Gemini instead of Emergent LLM:**
- `/api/wellness/chat` - AI chatbot
- `/api/community/posts` - Enhanced moderation
- `/api/learning/flashcards/generate` - Flashcard generation

---

## 🔒 Privacy & Security Notes

### Social Bubble Privacy:
- ✅ All bubbles are invite-only
- ✅ No public discovery or search
- ✅ Posts only visible to bubble members
- ✅ No likes, reactions, or public metrics
- ✅ Growth tokens are private (not visible to others)
- ✅ Can leave any bubble anytime

### Gemini API Usage:
- ⚠️ Free tier data may train Google's models
- ⚠️ Don't send sensitive personal information
- ⚠️ Rate limited to ~15 requests/minute
- ✅ API key is private, never exposed to frontend

---

## 🎓 Development Tips

### Adding a New Feature:
```bash
1. Add model to backend/server.py
2. Create API endpoints
3. Test with curl or Postman
4. Create frontend page
5. Add route to App.js
6. Update navigation in Layout.js
7. Test end-to-end
```

### Debugging:
```bash
# Backend logs:
# Look at terminal running uvicorn

# Frontend logs:
# Browser console (F12)

# Database:
mongosh
use mindease_db
db.bubbles.find().pretty()

# Extension:
chrome://extensions/ → Inspect views
```

### Database Collections:
```javascript
users              // User accounts
bubbles            // Social bubbles
bubble_posts       // Posts in bubbles
weekly_challenges  // Challenge data
challenge_completions // User completions
chat_messages      // Wellness chat history
community_posts    // Hope Notes
flashcards         // Learning flashcards
quotes             // Inspirational quotes
extension_data     // Extension sync data
extension_logs     // Extension events
```

---

## 🆘 Getting Help

### Check Logs:
```bash
# Backend: Look at uvicorn terminal
# Frontend: Browser DevTools (F12) → Console
# Extension: chrome://extensions/ → Inspect
# MongoDB: mongosh → use mindease_db → db.collection.find()
```

### Common Issues:
1. **90% of issues:** Environment variables not set
2. **Check:** All `.env` files configured correctly
3. **Verify:** MongoDB running, correct ports
4. **Test:** API responds at http://localhost:8001/api/

### Clean Slate:
```bash
# Stop all services (Ctrl+C)

# Reset database:
mongosh
use mindease_db
db.dropDatabase()
exit

# Clear browser:
# Chrome → Settings → Privacy → Clear browsing data

# Restart all services
```

---

## ✅ Quick Start Checklist

- [ ] MongoDB running
- [ ] Gemini API key obtained from Google AI Studio
- [ ] Backend `.env` has GEMINI_API_KEY
- [ ] Backend running (port 8001)
- [ ] Frontend running (port 3000)
- [ ] Extension loaded in Chrome
- [ ] Account created and logged in
- [ ] Token added to extension
- [ ] Test Social Bubble feature
- [ ] Test enhanced moderation

---

## 🎉 You're All Set!

Visit **http://localhost:3000** and enjoy MindEase v2.0!

### What to Try First:
1. Create your first bubble
2. Post with this week's challenge tag
3. Earn your first growth token
4. Chat with the AI wellness bot
5. Generate flashcards
6. Test the content moderation

**Have fun and stay mindful! 🧘**
