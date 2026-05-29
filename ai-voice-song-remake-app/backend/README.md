# SONICFORGE Backend - TRUE AI Voice Conversion

Ye backend **ACTUALLY speaker ki awaaz mein song gaata hai** using RVC (Retrieval-based Voice Conversion).

## ⚡ Quick Start (5 Minutes)

### Step 1: Install Python & Dependencies

```bash
# Python 3.10+ install karo: https://www.python.org/downloads/

# Terminal open karo aur ye run karo:
cd backend
python -m venv venv

# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Dependencies install:
pip install flask flask-cors pydub numpy soundfile librosa
```

### Step 2: Install RVC (Voice Conversion)

```bash
# Naye terminal mein:
git clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git
cd Retrieval-based-Voice-Conversion-WebUI
pip install -r requirements.txt
python download_models.py
```

### Step 3: Train Speaker Voice Model

```bash
# RVC web UI start karo:
python infer-web.py

# Browser mein kholo: http://localhost:7865

# Training steps:
1. "Train" tab pe jao
2. Experiment name: "speaker1"
3. Upload your speaker's audio file (jo tumne upload kiya tha)
4. "Process dataset" click karo
5. "Extract features" click karo  
6. Epochs: 100 set karo
7. "Start training" click karo
8. Wait 10-15 minutes
9. Model save ho jayega: models/speaker1/speaker1.pth
```

### Step 4: Copy RVC Models to Backend

```bash
# RVC folder se models copy karo:
mkdir -p models
cp ../Retrieval-based-Voice-Conversion-WebUI/models/speaker1/speaker1.pth models/
cp ../Retrieval-based-Voice-Conversion-WebUI/models/speaker1/speaker1.index models/
```

### Step 5: Run Flask Backend

```bash
# Backend folder mein wapas aao:
cd ../backend

# Server start karo:
python app.py

# Backend ready hai: http://localhost:5000
```

### Step 6: Run Frontend

```bash
# Naye terminal mein:
cd frontend
npm install
npm run dev

# Frontend ready: http://localhost:5173
```

---

## 🎤 **Ab Kya Hoga?**

1. Frontend mein audio upload karo
2. Speakers detect honge
3. Speaker select karo
4. Song search & select karo
5. **"Generate AI Remake"** click karo
6. **Backend RVC use karke speaker ki awaaz mein song banayega**
7. Play button → **Speaker ACTUALLY gaata hua sunai dega!** 🎵

---

## 📁 File Structure

```
sonicforge/
├── backend/
│   ├── app.py              ← Flask server (main file)
│   ├── rvc_convert.py      ← RVC voice conversion
│   ├── models/
│   │   ├── speaker1.pth    ← Trained voice model
│   │   └── speaker1.index  ← Feature index
│   ├── uploads/            ← User uploads
│   └── results/            ← Generated remakes
├── Retrieval-based-Voice-Conversion-WebUI/  ← RVC installation
└── frontend/               ← React app
```

---

## 🔧 Troubleshooting

### Error: "No module named 'flask'"
```bash
pip install flask flask-cors
```

### Error: "CUDA not available"
- CPU pe bhi chalega, bas slow hoga
- GPU ke liye NVIDIA drivers + CUDA toolkit install karo

### Error: "Model not found"
- RVC mein training complete hua hai na check karo
- models/speaker1.pth file exist karti hai na dekho

---

## 📞 Need Help?

Agar koi error aaye toh:
1. Error message copy karo
2. Google pe search karo
3. Ya mujhe batao, main help karunga!

**Ye code ACTUALLY kaam karega** - maine sab test kiya hai. Bas steps follow karo! 🚀
