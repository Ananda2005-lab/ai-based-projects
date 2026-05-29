# SONICFORGE · AI Voice Song Remake Studio

A full-stack futuristic web app for uploading a voice recording, detecting & separating speakers, picking one, searching a song, and generating an AI remake in the chosen voice.

This repository contains:

- **Frontend** — the React + Vite + Tailwind app in this sandbox (cinematic glassmorphism + neon UI).
- **Backend reference** — a complete Flask + Python stack you can deploy locally. Every file is viewable inside the app under **Backend Guide** and is also reproduced below.

> ⚠️ This project is for **personal / private use only**. Respect copyright and voice-privacy laws.

---

## 📁 Project Structure

```
sonicforge/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Upload limits, paths
│   ├── requirements.txt
│   ├── services/
│   │   ├── audio.py        # ffmpeg helpers
│   │   ├── diarize.py      # pyannote speaker detection
│   │   ├── separate.py     # per-speaker track export
│   │   ├── song_search.py  # iTunes + yt-dlp + Demucs
│   │   └── convert.py      # RVC voice conversion
│   ├── routes/
│   │   ├── upload.py
│   │   ├── analyze.py
│   │   ├── speakers.py
│   │   ├── songs.py
│   │   └── generate.py
│   ├── uploads/ processed/ results/
└── frontend/               # this React/Vite app
```

---

## 🚀 Quick Setup

### 1. Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Create a .env with your HuggingFace token (pyannote needs it)
echo "HF_TOKEN=hf_xxxx" > .env

python app.py     # http://localhost:5000
```

You also need **ffmpeg** installed (`brew install ffmpeg` / `sudo apt install ffmpeg`).

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

The frontend calls `http://localhost:5000/api/*` via the Vite dev proxy (already configured in `vite.config.ts`).

---

## 🔌 API Routes

| Method | Route                      | Purpose                                |
|--------|----------------------------|----------------------------------------|
| GET    | `/api/health`              | Health check                           |
| POST   | `/api/upload`              | Upload audio / video (max 30 MB)       |
| POST   | `/api/analyze`             | Detect speakers + produce previews     |
| GET    | `/api/speakers/<file_id>`  | List speakers + preview clip URLs      |
| GET    | `/api/preview/<id>/<name>` | Stream a speaker preview               |
| GET    | `/api/songs/search?q=`     | Search songs                           |
| POST   | `/api/songs/select`        | Download & split song into stems       |
| POST   | `/api/generate`            | Produce final AI remake                |
| GET    | `/api/download/<filename>` | Download the generated track           |

All endpoints return JSON. See full Python code inside the **Backend Guide** page in the app.

---

## 🎨 Frontend Features

- **5 switchable themes** — Dark, Light, Neon, Purple, Spotify-style (saved to localStorage)
- **Sidebar + responsive mobile nav**
- **Drag & drop upload** with live progress and format validation
- **Speaker cards** with per-speaker waveform preview, confidence %, and select action
- **Spotify-style song search** with cover art, genre chips, and selection
- **Animated AI pipeline overlay** — 7 steps with glowing loaders and progress bar
- **Emotion + Style** selectors (Happy / Sad / Romantic / Energetic × Original / Lo-fi / Rock / ...)
- **Final result player** — custom waveform seekbar, save-to-library, download
- **Toast notifications** for success / error / info
- **History library** with all past remakes

---

## 🛠 Tech Stack

**Backend**

- Python 3.10 + Flask
- pyannote.audio (diarization)
- Demucs (source separation)
- Whisper (optional transcription)
- RVC / So-VITS-SVC (voice conversion)
- ffmpeg + pydub (audio processing)
- yt-dlp + iTunes Search API (song discovery)

**Frontend**

- React 19 + Vite
- Tailwind CSS 4
- Custom glassmorphism + neon design system

---

## 📜 License

MIT — for personal, educational use. Do not redistribute remakes of copyrighted material.
