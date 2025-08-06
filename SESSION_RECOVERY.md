# Session Recovery Guide

*For when the session gets disconnected and you need to bring Claude back up to speed quickly.*

## 🚀 **Quick Start Checklist**

### **1. Project Status** (30 seconds)
```bash
# Check what's been modified
git status

# Check recent commits
git log --oneline -5

# Check current branch
git branch
```

### **2. Read Key Files** (2 minutes)
1. **`PROJECT_BACKLOG.md`** - Current TODO list and priorities
2. **`CORE-BLOCKING-FEATURES.md`** - Business-critical missing features
3. **`TODO-FEATURES.md`** - Complete feature breakdown
4. **`README.md`** - Project overview and setup

### **3. Test Current Functionality** (1 minute)
1. Start server: `node src/server/index.js`
2. Open http://localhost:3001
3. Login and test note editing (current main feature)

## 📋 **Current Project State** *(As of January 2025)*

### **✅ COMPLETED - Phase 1D: Note Editing System**
- Rich text editor (Quill.js) - local files for offline
- Edit existing notes (extracted from uploads)
- Create manual notes from scratch
- Save/update notes to database
- Comprehensive notes management interface

### **⚠️ KNOWN ISSUES**
1. **State Management**: UI doesn't update instantly after saves (need page refresh)
2. **No Payments**: Stripe integration missing - can't monetize
3. **Limited Search**: No way to find content in large collections

### **🎯 NEXT PRIORITIES**
1. **Centralized State Management** (architectural fix for real-time updates)
2. **Stripe Payment Integration** (business requirement for Pro upgrades)
3. **Search & Organization** (user experience improvement)

## 🏗️ **Architecture Overview**

### **Tech Stack:**
- **Frontend**: Vue 3, Tailwind CSS, Quill.js (rich text)
- **Backend**: Node.js, Express, SQLite3
- **AI**: OpenAI API + Ollama (offline fallback)
- **Auth**: JWT tokens, bcrypt hashing
- **Files**: Multer uploads, OCR processing

### **Key Components:**
- `NoteEditorModal.js` - Rich text editing interface
- `NotesView.js` - Complete notes management
- `usage-service.js` - Subscription limits tracking
- `auth-middleware.js` - JWT token validation
- `store-simplified.js` - Basic state management (needs overhaul)

### **Database Schema:**
- **users**: authentication and subscription info
- **subjects**: predefined study subjects
- **topics**: user-created study topics
- **notes**: extracted/manual study content
- **questions**: AI-generated practice questions
- **practice_sessions**: user practice history
- **user_usage**: monthly usage tracking

## 🔧 **Common Issues & Fixes**

### **Server Won't Start:**
```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001
# Kill process if needed
taskkill /PID <PID> /F
```

### **Quill.js Not Loading:**
- Files are now local: `/lib/quill/quill.min.js` & `quill.snow.css`
- Check browser console for loading errors
- Verify CSP allows local file loading

### **Database Errors:**
- Database file: `/data/study_ai_simplified.db`
- Auto-created on first run
- Check permissions and disk space

### **AI Services Not Working:**
- OpenAI: Check API key in environment
- Ollama: Check if running locally on port 11434
- Service auto-selects best available option

## 🎯 **Development Workflow**

### **Making Changes:**
1. Create feature branch if major change
2. Test locally (especially auth flows)
3. Update relevant `.md` files if architecture changes
4. Update this file if major milestones reached

### **Testing Checklist:**
- [ ] User registration/login works
- [ ] File upload and OCR extraction works
- [ ] Note editing and saving works
- [ ] AI question generation works
- [ ] Practice sessions work
- [ ] Usage limits enforce properly

### **Before Committing:**
- [ ] Test in private/incognito window (fresh auth state)
- [ ] Check console for errors
- [ ] Verify no sensitive data in commits
- [ ] Update documentation if needed

## 📚 **Key Commands**

### **Development:**
```bash
# Start server
node src/server/index.js

# Install dependencies (if needed)
npm install

# Check logs
# (Server logs print to console)
```

### **Database:**
```bash
# View database (if sqlite3 installed)
sqlite3 data/study_ai_simplified.db
.tables
.schema notes
```

### **Git:**
```bash
# Quick status
git status

# See what's changed
git diff

# Check recent work
git log --oneline -10
```

## 🚨 **Emergency Recovery**

If everything is broken:

1. **Check git status** - see what files changed
2. **Revert recent changes**: `git checkout -- filename.js`
3. **Restart fresh**: Delete `data/` folder to reset database
4. **Check this file** for last known good state
5. **Look at error logs** in console for specific issues

---

*Keep this file updated after major sessions or architecture changes.*