# 🤖 Ollama Setup Guide - Free Local AI for Jaquizy

## 💡 **Why Use Ollama?**

✅ **100% Free AI** - No API costs, unlimited questions  
✅ **Private & Secure** - Your data never leaves your computer  
✅ **Works Offline** - Study anywhere, anytime  
✅ **Fast & Reliable** - No internet dependency  

---

## 📥 **Quick Installation** (5 minutes)

### **Windows:**
1. Download from: [https://ollama.com/download/windows](https://ollama.com/download/windows)
2. Run the installer 
3. Ollama automatically starts on port **11434**

### **Mac:**
1. Download from: [https://ollama.com/download/mac](https://ollama.com/download/mac) 
2. Drag to Applications folder
3. Run Ollama app - it starts automatically

### **Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

---

## 🚀 **Setup for Jaquizy** (2 minutes)

### **1. Install Recommended Model:**
```bash
ollama pull llama3.2:3b
```
*This downloads a 2GB fast, accurate model*

### **2. Verify Installation:**
```bash
ollama list
```
*You should see `llama3.2:3b` listed*

### **3. Test Connection:**
Open: [http://localhost:11434](http://localhost:11434)  
*Should show "Ollama is running"*

---

## ✅ **Using with Jaquizy**

### **Automatic Detection:**
- Jaquizy **automatically detects** Ollama when running
- No configuration needed - just install and run!
- You'll see in Jaquizy logs: `✅ Selected: Ollama service (primary choice - local & private)`

### **Benefits You'll See:**
- ⚡ **Faster question generation** (no internet delay)
- 💰 **Zero costs** (no OpenAI API usage)  
- 🔒 **Complete privacy** (your notes stay local)
- 📱 **Works offline** (study anywhere)

---

## 🔧 **Custom Configuration**

### **Different Port:** 
If you run Ollama on a different port, update your `.env`:
```env
OLLAMA_URL=http://localhost:YOUR_PORT
```

### **Different Host:**
For remote Ollama installations:
```env
OLLAMA_URL=http://your-server-ip:11434
```

### **Different Model:**
Jaquizy uses `llama3.2:3b` by default. To use a different model:
1. Install it: `ollama pull your-model-name`
2. Update Jaquizy code (advanced users only)

---

## 🎯 **Recommended Models**

| Model | Size | Speed | Quality | Best For |
|-------|------|-------|---------|----------|
| `llama3.2:3b` | 2GB | ⚡ Fast | ⭐⭐⭐⭐ | **Recommended** - Perfect balance |
| `llama3.2:1b` | 1GB | ⚡⚡ Very Fast | ⭐⭐⭐ | Low-end computers |
| `llama3.1:8b` | 4.7GB | 🐌 Slow | ⭐⭐⭐⭐⭐ | High-end computers |

**Install command:**
```bash
ollama pull MODEL_NAME
```

---

## 🛠️ **Troubleshooting**

### **❌ "Ollama service unavailable"**
1. **Check if Ollama is running:**
   - Windows: Look for Ollama in system tray
   - Mac: Check Applications folder
   - Linux: `ps aux | grep ollama`

2. **Restart Ollama:**
   - Windows: Right-click tray icon → Restart
   - Mac: Quit and reopen Ollama app
   - Linux: `systemctl restart ollama`

3. **Check port 11434:**
   ```bash
   curl http://localhost:11434
   ```

### **❌ "No models available"**
```bash
ollama pull llama3.2:3b
ollama list
```

### **❌ "Connection refused"**
- Check firewall settings
- Ensure Ollama is bound to correct address
- Try: `ollama serve --host 0.0.0.0`

---

## 🎉 **Success! You're Now Using Free AI**

When Ollama is working correctly, you'll see:

```
🤖 AI Service Selector initialized - Ollama preferred, OpenAI fallback
✅ Ollama service is available with models: llama3.2:3b
🎯 Selected: Ollama service (primary choice - local & private)
🤖 Generating 5 questions using OLLAMA
✅ Successfully generated 5 questions using OLLAMA
```

**Enjoy unlimited free AI question generation with complete privacy!** 🚀

---

## 💰 **Cost Comparison**

| Method | Cost per 1000 questions | Privacy | Offline |
|--------|-------------------------|---------|---------|
| **Ollama** | **$0.00** ✅ | **100% Private** ✅ | **Yes** ✅ |
| OpenAI API | $0.50-2.00 | Sent to OpenAI | No |

*Switch to Ollama and never worry about AI costs again!*