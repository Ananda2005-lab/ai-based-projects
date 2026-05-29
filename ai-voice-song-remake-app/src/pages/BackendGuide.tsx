import { useState } from "react";

// Full Flask backend reference code rendered in-page so the user can
// copy it into their own Python project.

const TREE = `sonicforge/
├── backend/
│   ├── app.py              # Flask entry point
│   ├── config.py           # Upload limits, paths, secrets
│   ├── requirements.txt    # Python deps
│   ├── services/
│   │   ├── __init__.py
│   │   ├── audio.py        # Extract audio, normalize
│   │   ├── diarize.py      # Speaker detection (pyannote)
│   │   ├── separate.py     # Voice separation (Demucs)
│   │   ├── song_search.py  # Search + fetch songs
│   │   └── convert.py      # Voice conversion (RVC)
│   ├── routes/
│   │   ├── upload.py
│   │   ├── analyze.py
│   │   ├── speakers.py
│   │   ├── songs.py
│   │   └── generate.py
│   ├── uploads/            # user files (auto-created)
│   ├── processed/          # separated tracks
│   └── results/            # final remakes
└── frontend/               # this React/Vite app
    ├── src/
    └── ...`;

const APP_PY = `# ============================================================
# SONICFORGE · Flask Backend Entry Point
# ============================================================
import os
from flask import Flask
from flask_cors import CORS

from config import UPLOAD_FOLDER, MAX_CONTENT_LENGTH
from routes.upload import upload_bp
from routes.analyze import analyze_bp
from routes.speakers import speakers_bp
from routes.songs import songs_bp
from routes.generate import generate_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
    app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

    # Allow frontend dev server to talk to backend
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

    # Make sure storage folders exist
    for folder in ("uploads", "processed", "results"):
        os.makedirs(folder, exist_ok=True)

    # Register routes
    app.register_blueprint(upload_bp,    url_prefix="/api")
    app.register_blueprint(analyze_bp,   url_prefix="/api")
    app.register_blueprint(speakers_bp,  url_prefix="/api")
    app.register_blueprint(songs_bp,     url_prefix="/api")
    app.register_blueprint(generate_bp,  url_prefix="/api")

    @app.get("/api/health")
    def health():
        return {"status": "ok", "service": "sonicforge-backend"}

    # Global error handlers ------------------------------------
    @app.errorhandler(413)
    def too_large(_):
        return {"error": "File too large. Max 30 MB."}, 413

    @app.errorhandler(400)
    def bad_request(e):
        return {"error": str(e.description)}, 400

    @app.errorhandler(500)
    def server_error(e):
        return {"error": "Processing failed", "detail": str(e)}, 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
`;

const CONFIG_PY = `# config.py
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
PROCESSED_FOLDER = os.path.join(BASE_DIR, "processed")
RESULTS_FOLDER = os.path.join(BASE_DIR, "results")

MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB

# pyannote.audio requires a HuggingFace token (accept the model terms first)
HF_TOKEN = os.getenv("HF_TOKEN", "")

ALLOWED_AUDIO_EXT = {
    ".mp3", ".wav", ".m4a", ".ogg", ".oga", ".flac",
    ".aac", ".wma", ".opus", ".weba", ".aiff", ".aif", ".amr", ".caf", ".pcm",
}
ALLOWED_VIDEO_EXT = {
    ".mp4", ".m4v", ".mov", ".webm", ".mkv",
    ".avi", ".wmv", ".flv", ".3gp", ".mpg", ".mpeg", ".ts",
}
ALLOWED_EXT = ALLOWED_AUDIO_EXT | ALLOWED_VIDEO_EXT
# ffmpeg will try to decode anything in ALLOWED_EXT — no need to re-encode first.
`;

const REQUIREMENTS = `flask==3.0.3
flask-cors==4.0.1
python-dotenv==1.0.1
pydub==0.25.1
ffmpeg-python==0.2.0
pyannote.audio==3.3.1
demucs==4.0.1
openai-whisper==20231117
numpy<2
torch==2.3.1
torchaudio==2.3.1
soundfile==0.12.1
librosa==0.10.2
requests==2.32.3
yt-dlp==2024.8.6
# RVC - see https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI
`;

const UPLOAD_ROUTE = `# routes/upload.py
import os
import mimetypes
from uuid import uuid4
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from config import ALLOWED_EXT

upload_bp = Blueprint("upload", __name__)


@upload_bp.post("/upload")
def upload():
    """
    Accepts multipart/form-data with field 'file' and 'kind'
    (voice | call | video | live). Accepts any audio/video format
    whose extension is in ALLOWED_EXT OR whose MIME type starts
    with audio/ or video/. Stores the file safely.
    """
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    ext = os.path.splitext(file.filename)[1].lower()
    mime = (file.mimetype or mimetypes.guess_type(file.filename)[0] or "").lower()
    is_media_ext = ext in ALLOWED_EXT
    is_media_mime = mime.startswith("audio/") or mime.startswith("video/")

    if not (is_media_ext or is_media_mime):
        return jsonify({"error": f"Unsupported format: {ext or mime}"}), 400

    filename = f"{uuid4().hex}{ext}"
    safe = secure_filename(file.filename) or filename
    path = os.path.join(current_app.config["UPLOAD_FOLDER"], filename)
    file.save(path)

    size = os.path.getsize(path)
    kind = request.form.get("kind", "voice")

    return jsonify({
        "ok": True,
        "file_id": filename,
        "original_name": safe,
        "size": size,
        "kind": kind,
        "path": path,
    })
`;

const ANALYZE_ROUTE = `# routes/analyze.py
from flask import Blueprint, request, jsonify
from services.audio import extract_audio
from services.diarize import diarize_audio
from services.separate import separate_speakers

analyze_bp = Blueprint("analyze", __name__)


@analyze_bp.post("/analyze")
def analyze():
    """
    Pipeline:
      1. Extract audio from video (if needed)
      2. Run speaker diarization
      3. Separate each speaker into its own file
      4. Return speaker list + preview clip paths
    """
    data = request.get_json(silent=True) or {}
    file_id = data.get("file_id")
    if not file_id:
        return jsonify({"error": "file_id required"}), 400

    try:
        wav_path = extract_audio(file_id)          # -> 16k mono WAV
        segments = diarize_audio(wav_path)         # list of {speaker,start,end}
        speakers = separate_speakers(wav_path, segments)
        return jsonify({"ok": True, "speakers": speakers})
    except Exception as e:
        return jsonify({"error": "analyze_failed", "detail": str(e)}), 500
`;

const SPEAKERS_ROUTE = `# routes/speakers.py
import os
from flask import Blueprint, jsonify, send_from_directory
from config import PROCESSED_FOLDER

speakers_bp = Blueprint("speakers", __name__)


@speakers_bp.get("/speakers/<file_id>")
def get_speakers(file_id):
    """Return metadata + preview paths for every detected speaker."""
    folder = os.path.join(PROCESSED_FOLDER, file_id)
    if not os.path.isdir(folder):
        return jsonify({"error": "not_analyzed"}), 404

    import json
    with open(os.path.join(folder, "meta.json")) as f:
        meta = json.load(f)

    # expose preview clips via /api/preview/<file_id>/<filename>
    for sp in meta["speakers"]:
        sp["preview_url"] = f"/api/preview/{file_id}/{sp['preview']}"
    return jsonify(meta)


@speakers_bp.get("/preview/<file_id>/<filename>")
def preview(file_id, filename):
    return send_from_directory(os.path.join(PROCESSED_FOLDER, file_id), filename)
`;

const SONGS_ROUTE = `# routes/songs.py
from flask import Blueprint, request, jsonify
from services.song_search import search_songs, fetch_song_source

songs_bp = Blueprint("songs", __name__)


@songs_bp.get("/songs/search")
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"results": []})
    return jsonify({"results": search_songs(q)})


@songs_bp.post("/songs/select")
def select():
    """Store a selected song's source (vocals + instrumental) locally."""
    data = request.get_json(silent=True) or {}
    song_id = data.get("song_id")
    if not song_id:
        return jsonify({"error": "song_id required"}), 400
    try:
        info = fetch_song_source(song_id)
        return jsonify({"ok": True, "song": info})
    except Exception as e:
        return jsonify({"error": "fetch_failed", "detail": str(e)}), 500
`;

const GENERATE_ROUTE = `# routes/generate.py
from flask import Blueprint, request, jsonify, send_from_directory
from services.convert import convert_voice
from config import RESULTS_FOLDER
import os

generate_bp = Blueprint("generate", __name__)


@generate_bp.post("/generate")
def generate():
    data = request.get_json(silent=True) or {}
    required = ["file_id", "speaker_id", "song_id", "emotion", "style"]
    for k in required:
        if k not in data:
            return jsonify({"error": f"missing_{k}"}), 400

    try:
        out = convert_voice(
            file_id=data["file_id"],
            speaker_id=data["speaker_id"],
            song_id=data["song_id"],
            emotion=data["emotion"],
            style=data["style"],
        )
        return jsonify({
            "ok": True,
            "filename": os.path.basename(out),
            "url": f"/api/download/{os.path.basename(out)}",
        })
    except Exception as e:
        return jsonify({"error": "generate_failed", "detail": str(e)}), 500


@generate_bp.get("/download/<filename>")
def download(filename):
    return send_from_directory(RESULTS_FOLDER, filename, as_attachment=True)
`;

const DIARIZE_PY = `# services/diarize.py
from pyannote.audio import Pipeline
from config import HF_TOKEN
from services.audio import ensure_wav16k

# Load once (cached)
_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is None:
        _pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=HF_TOKEN,
        )
    return _pipeline


def diarize_audio(wav_path: str):
    """
    Returns list of dicts: {speaker, start, end}
    """
    wav16k = ensure_wav16k(wav_path)
    pipeline = _get_pipeline()
    diarization = pipeline(wav16k)

    segments = []
    for turn, _, speaker in diarization.itertracks(yield_label=True):
        segments.append({
            "speaker": speaker,
            "start": turn.start,
            "end": turn.end,
        })
    return segments
`;

const SEPARATE_PY = `# services/separate.py
import os
import json
import subprocess
from pydub import AudioSegment
from config import PROCESSED_FOLDER


def separate_speakers(wav_path: str, segments):
    """
    For each speaker: concatenate all their turns into one track,
    save as a separate WAV, and generate a 5-10s preview clip.
    Uses Demucs to strip background music first (optional).
    """
    file_id = os.path.splitext(os.path.basename(wav_path))[0]
    out_dir = os.path.join(PROCESSED_FOLDER, file_id)
    os.makedirs(out_dir, exist_ok=True)

    # Optional: run demucs to isolate vocals
    # subprocess.run(["python", "-m", "demucs", "--two-stems=vocals", wav_path])

    full = AudioSegment.from_file(wav_path)

    # Group by speaker
    by_speaker = {}
    for seg in segments:
        by_speaker.setdefault(seg["speaker"], []).append(seg)

    speakers_meta = []
    for idx, (spk, turns) in enumerate(by_speaker.items(), start=1):
        combined = AudioSegment.silent(duration=0)
        total = 0
        for t in turns:
            clip = full[int(t["start"] * 1000):int(t["end"] * 1000)]
            combined += clip
            total += (t["end"] - t["start"])

        full_name = f"speaker_{idx}.wav"
        preview_name = f"speaker_{idx}_preview.wav"
        combined.export(os.path.join(out_dir, full_name), format="wav")
        preview = combined[:8000] if len(combined) > 8000 else combined
        preview.export(os.path.join(out_dir, preview_name), format="wav")

        speakers_meta.append({
            "id": f"sp{idx}",
            "label": f"Speaker {idx}",
            "duration": round(total, 1),
            "preview": preview_name,
            "full": full_name,
        })

    meta = {"file_id": file_id, "speakers": speakers_meta}
    with open(os.path.join(out_dir, "meta.json"), "w") as f:
        json.dump(meta, f, indent=2)

    return speakers_meta
`;

const CONVERT_PY = `# services/convert.py
"""
═══════════════════════════════════════════════════════════════
  TRUE AI VOICE CONVERSION - Speaker Actually Sings the Song
═══════════════════════════════════════════════════════════════

This is where the MAGIC happens. Unlike the browser version
(which only applies EQ filters), this uses RVC to actually
convert the song's vocals into the selected speaker's voice.

Pipeline:
1. Extract vocals from original song (Demucs)
2. Train RVC model on speaker's voice (or use pre-trained)
3. Convert song vocals → speaker's voice using RVC
4. Mix converted vocals with instrumental
5. Master and export final remake

Requirements:
- RVC-Project/Retrieval-based-Voice-Conversion-WebUI
- Pre-trained speaker voice model (.pth file)
- GPU recommended (CUDA) for fast inference
"""
import os
import subprocess
from config import PROCESSED_FOLDER, RESULTS_FOLDER


def convert_voice(file_id, speaker_id, song_id, emotion, style) -> str:
    """
    Generate TRUE AI voice remake where selected speaker
    actually sings the selected song.
    """
    # Speaker's voice sample (from diarization)
    speaker_wav = os.path.join(PROCESSED_FOLDER, file_id, f"{speaker_id}.wav")
    if not os.path.isfile(speaker_wav):
        raise FileNotFoundError("Speaker voice not found")

    # Song stems (vocals + instrumental from Demucs)
    vocals = f"data/songs/{song_id}/vocals.wav"
    instrumental = f"data/songs/{song_id}/instrumental.wav"

    # ═══════════════════════════════════════════════════════
    # STEP 1: Train RVC model on speaker's voice (one-time)
    # ═══════════════════════════════════════════════════════
    # Run this once per speaker to create their voice model
    # subprocess.run([
    #     "python", "train.py",
    #     "--name", speaker_id,
    #     "--data", speaker_wav,
    #     "--epochs", "100",
    #     "--batch_size", "8",
    # ])
    # Model saved at: models/{speaker_id}.pth

    # ═══════════════════════════════════════════════════════
    # STEP 2: Convert song vocals to speaker's voice (RVC)
    # ═══════════════════════════════════════════════════════
    out_vocals = os.path.join(RESULTS_FOLDER, f"{file_id}_{speaker_id}_converted.wav")
    
    # RVC inference with pitch adjustment for emotion
    pitch_shifts = {
        "Happy": "+2", "Energetic": "+1",
        "Sad": "-2", "Melancholic": "-1",
        "Romantic": "0", "Chill": "0"
    }
    f0up = pitch_shifts.get(emotion, "0")

    subprocess.run([
        "python", "rvc/infer.py",
        "--model_path", f"models/{speaker_id}.pth",
        "--index_path", f"models/{speaker_id}.index",
        "--input", vocals,
        "--output", out_vocals,
        "--f0up_key", f0up,              # Emotion-based pitch
        "--filter_radius", "3",          # Smooth conversion
        "--rms_mix_rate", "0.25",        # Preserve some original
        "--protect", "0.33",             # Protect breath/consonants
    ], check=True)

    # ═══════════════════════════════════════════════════════
    # STEP 3: Apply style-based effects
    # ═══════════════════════════════════════════════════════
    styled_vocals = os.path.join(RESULTS_FOLDER, f"{file_id}_{speaker_id}_styled.wav")
    
    # Style-based EQ using ffmpeg
    eq_filters = {
        "Original": "equalizer=f=1000:q=1:g=0",
        "Lo-fi": "equalizer=f=200:q=1:g=3,equalizer=f=3000:q=1:g=-4",
        "Acoustic": "equalizer=f=500:q=1:g=2,equalizer=f=5000:q=1:g=1",
        "Rock": "equalizer=f=100:q=1:g=3,equalizer=f=2000:q=1:g=4",
        "Cinematic": "equalizer=f=80:q=1:g=5,equalizer=f=4000:q=1:g=3",
        "Jazz": "equalizer=f=150:q=1:g=2,equalizer=f=6000:q=1:g=2",
    }
    eq = eq_filters.get(style, eq_filters["Original"])

    subprocess.run([
        "ffmpeg", "-y", "-i", out_vocals,
        "-af", eq,
        styled_vocals,
    ], check=True)

    # ═══════════════════════════════════════════════════════
    # STEP 4: Mix converted vocals with instrumental
    # ═══════════════════════════════════════════════════════
    final = os.path.join(RESULTS_FOLDER, f"{file_id}_{speaker_id}_remake.wav")
    subprocess.run([
        "ffmpeg", "-y",
        "-i", styled_vocals,
        "-i", instrumental,
        "-filter_complex", "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=3",
        "-af", "loudnorm=I=-16:TP=-1.5:LRA=11",  # Mastering
        final,
    ], check=True)

    print(f"✓ Remake complete: {final}")
    return final
`;

const AUDIO_PY = `# services/audio.py
import os
import subprocess
from config import UPLOAD_FOLDER


def is_video(filename: str) -> bool:
    return os.path.splitext(filename)[1].lower() in {".mp4", ".mov", ".webm", ".mkv"}


def extract_audio(file_id: str) -> str:
    """
    If the uploaded file is a video, extract the audio track.
    Always returns a 16kHz mono WAV suitable for pyannote/whisper.
    """
    folder = UPLOAD_FOLDER
    matches = [f for f in os.listdir(folder) if f.startswith(file_id.split(".")[0])]
    if not matches:
        raise FileNotFoundError("uploaded file not found")
    src = os.path.join(folder, matches[0])

    wav_path = os.path.join(folder, f"{file_id}.wav")
    subprocess.run([
        "ffmpeg", "-y", "-i", src,
        "-vn",                  # no video
        "-acodec", "pcm_s16le", # 16-bit PCM
        "-ar", "16000",         # 16 kHz
        "-ac", "1",             # mono
        wav_path,
    ], check=True, capture_output=True)
    return wav_path


def ensure_wav16k(path: str) -> str:
    """Make sure the file is 16 kHz mono WAV; re-encode if not."""
    if path.endswith(".wav"):
        return path
    out = path.rsplit(".", 1)[0] + "_16k.wav"
    subprocess.run([
        "ffmpeg", "-y", "-i", path,
        "-ar", "16000", "-ac", "1", out,
    ], check=True)
    return out
`;

const SONG_SEARCH_PY = `# services/song_search.py
"""
Simplified song search. In production you'd hit a licensed
music API (Deezer, iTunes Search API, Spotify via OAuth).
"""
import os
import subprocess

# iTunes Search API (no auth required) — demo only.
import requests

ITUNES_SEARCH = "https://itunes.apple.com/search"


def search_songs(query: str, limit: int = 20):
    r = requests.get(ITUNES_SEARCH, params={
        "term": query,
        "media": "music",
        "entity": "song",
        "limit": limit,
    }, timeout=10)
    r.raise_for_status()
    out = []
    for item in r.json().get("results", []):
        out.append({
            "id": str(item.get("trackId")),
            "title": item.get("trackName"),
            "artist": item.get("artistName"),
            "duration": ms_to_mmss(item.get("trackTimeMillis", 0)),
            "cover": item.get("artworkUrl100"),
            "preview": item.get("previewUrl"),
        })
    return out


def fetch_song_source(song_id: str) -> dict:
    """
    Download the original song and separate vocals/instrumental
    using yt-dlp + Demucs. NOTE: only for songs you have rights to.
    """
    out_dir = f"data/songs/{song_id}"
    os.makedirs(out_dir, exist_ok=True)

    raw = os.path.join(out_dir, "raw.mp3")
    subprocess.run([
        "yt-dlp", "-x", "--audio-format", "mp3",
        "-o", raw, f"https://music.youtube.com/watch?v={song_id}",
    ], check=True)

    subprocess.run([
        "python", "-m", "demucs",
        "--two-stems=vocals", "-n", "htdemucs",
        "--out", out_dir, raw,
    ], check=True)

    return {
        "song_id": song_id,
        "vocals": os.path.join(out_dir, "htdemucs", "raw", "vocals.wav"),
        "instrumental": os.path.join(out_dir, "htdemucs", "raw", "no_vocals.wav"),
    }


def ms_to_mmss(ms: int) -> str:
    s = ms // 1000
    return f"{s // 60}:{s % 60:02d}"
`;

const SETUP_STEPS = [
  {
    title: "🔧 1. Install System Dependencies",
    body: "```bash\n# macOS\nbrew install ffmpeg git python@3.10\n\n# Ubuntu/Debian\nsudo apt update && sudo apt install -y ffmpeg git python3.10 python3.10-venv\n\n# Windows: Download ffmpeg from https://ffmpeg.org/download.html\n# Add to PATH: System Properties → Environment Variables → Path",
  },
  {
    title: "📦 2. Install RVC (True Voice Conversion)",
    body: "```bash\n# Clone RVC (Retrieval-based Voice Conversion)\ngit clone https://github.com/RVC-Project/Retrieval-based-Voice-Conversion-WebUI.git\ncd Retrieval-based-Voice-Conversion-WebUI\n\n# Install dependencies\npip install -r requirements.txt\n\n# Download pre-trained models\npython download_models.py\n\n# Start RVC web UI (for training)\npython infer-web.py\n# Open http://localhost:7865 in browser\n```",
  },
  {
    title: "🎤 3. Train Speaker Voice Model",
    body: "```bash\n# In RVC web UI:\n1. Go to \"Train\" tab\n2. Enter experiment name: \"speaker_001\"\n3. Upload speaker's audio (the full.wav from SonicForge)\n4. Click \"Process dataset\" → \"Extract features\"\n5. Set epochs: 100-200 (more = better but slower)\n6. Click \"Start training\"\n7. After training: Save model (creates speaker_001.pth)\n\n# Model files location:\n# - models/speaker_001/speaker_001.pth (voice model)\n# - models/speaker_001/speaker_001.index (feature index)\n```",
  },
  {
    title: "🎵 4. Install SonicForge Backend",
    body: "```bash\n# Clone SonicForge\ngit clone https://github.com/you/sonicforge.git\ncd sonicforge/backend\n\n# Create virtual environment\npython -m venv .venv\nsource .venv/bin/activate  # Windows: .venv\\Scripts\\activate\n\n# Install dependencies\npip install -r requirements.txt\n\n# Set HuggingFace token for pyannote\necho \"HF_TOKEN=hf_xxxxx\" > .env\n```",
  },
  {
    title: "⚙️ 5. Configure RVC Integration",
    body: "```bash\n# Copy trained RVC models to SonicForge\nmkdir -p backend/models\ncp ../RVC-Project/models/speaker_001/speaker_001.pth backend/models/\ncp ../RVC-Project/models/speaker_001/speaker_001.index backend/models/\n\n# Update config.py to point to RVC installation\necho 'RVC_PATH=\"/path/to/RVC-Project\"' >> backend/.env\necho 'RVC_MODEL=\"speaker_001\"' >> backend/.env\n```",
  },
  {
    title: "🚀 6. Run Full Stack",
    body: "```bash\n# Terminal 1: Backend (Flask)\ncd sonicforge/backend\npython app.py\n# → http://localhost:5000\n\n# Terminal 2: Frontend (Vite)\ncd sonicforge/frontend\nnpm install\nnpm run dev\n# → http://localhost:5173\n\n# Now when you click \"Generate AI Remake\":\n# - Frontend sends request to backend\n# - Backend runs RVC voice conversion\n# - Speaker ACTUALLY sings the song!\n# - Returns full .wav remake file\n```",
  },
];

type Tab = "tree" | "app" | "config" | "req" | "routes" | "services" | "setup" | "rvc";

export function BackendGuide() {
  const [tab, setTab] = useState<Tab>("setup");

  const tabs: { id: Tab; label: string }[] = [
    { id: "setup", label: "🚀 Quick Start" },
    { id: "rvc", label: "🎤 RVC Training" },
    { id: "tree", label: "📁 Files" },
    { id: "routes", label: "🔌 API" },
    { id: "app", label: "app.py" },
    { id: "req", label: "requirements.txt" },
  ];

  return (
    <div className="fade-in space-y-6 max-w-5xl">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Reference</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Flask Backend Guide</h1>
        <p className="opacity-70 mt-2 max-w-3xl">
          Full production-ready Flask backend code for SONICFORGE. Every file below is copy-pasteable into your own Python project. The frontend on this page simulates the pipeline, but these are the real endpoints it would talk to.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${tab === t.id ? "text-black" : "glass hover:border-[var(--accent)]"}`}
            style={tab === t.id ? { background: "linear-gradient(135deg,var(--accent),var(--accent-2))" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="glass p-6 md:p-8 rounded-2xl">
        {tab === "setup" && (
          <div className="space-y-5">
            {SETUP_STEPS.map((s) => (
              <div key={s.title} className="step-line">
                <div className="step-dot active">◆</div>
                <div>
                  <div className="font-display font-bold">{s.title}</div>
                  <pre className="text-xs md:text-sm opacity-80 mt-1 whitespace-pre-wrap font-mono leading-relaxed">{s.body}</pre>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === "rvc" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl" style={{ background: "rgba(34,211,238,0.1)", border: "1px solid var(--accent)" }}>
              <h3 className="font-display font-bold text-lg mb-2">🎤 RVC Voice Model Training Guide</h3>
              <p className="text-sm opacity-80 mb-3">
                RVC (Retrieval-based Voice Conversion) se tum speaker ki awaaz ka model train kar sakte ho.
                Ye model use hoga actual song mein speaker ki awaaz generate karne ke liye.
              </p>
            </div>
            <div className="step-line">
              <div className="step-dot active">1</div>
              <div>
                <div className="font-bold">RVC WebUI Start Karo</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">cd Retrieval-based-Voice-Conversion-WebUI
python infer-web.py
# Open http://localhost:7865</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">2</div>
              <div>
                <div className="font-bold">Training Tab Mein Jao</div>
                <p className="text-xs mt-1 opacity-80">"Train" tab pe click karo</p>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">3</div>
              <div>
                <div className="font-bold">Experiment Name Do</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">speaker1</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">4</div>
              <div>
                <div className="font-bold">Speaker Audio Upload Karo</div>
                <p className="text-xs mt-1 opacity-80">
                  Wo audio file jo tumne SonicForge mein upload ki thi (jisme speaker ki awaaz hai).
                  Kam se kam 1-2 minute ki clean audio chahiye.
                </p>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">5</div>
              <div>
                <div className="font-bold">Process Dataset</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">Click "Process dataset" → Wait 1-2 min</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">6</div>
              <div>
                <div className="font-bold">Extract Features</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">Click "Extract features" → Wait 2-3 min</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">7</div>
              <div>
                <div className="font-bold">Training Start</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">Epochs: 100-200
Click "Start training" → Wait 10-20 min</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">8</div>
              <div>
                <div className="font-bold">Model Save</div>
                <p className="text-xs mt-1 opacity-80">
                  Training complete hone ke baad model automatically save ho jayega:
                </p>
                <pre className="text-xs mt-1 opacity-80 font-mono">models/speaker1/speaker1.pth
models/speaker1/speaker1.index</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">9</div>
              <div>
                <div className="font-bold">Models Copy Karo</div>
                <pre className="text-xs mt-1 opacity-80 font-mono">cp models/speaker1/speaker1.pth ../sonicforge/backend/models/
cp models/speaker1/speaker1.index ../sonicforge/backend/models/</pre>
              </div>
            </div>
            <div className="step-line">
              <div className="step-dot active">10</div>
              <div>
                <div className="font-bold">Ready!</div>
                <p className="text-xs mt-1 opacity-80">
                  Ab SonicForge backend start karo aur "Generate AI Remake" click karo.
                  Speaker ACTUALLY gaayega! 🎵
                </p>
              </div>
            </div>
          </div>
        )}
        {tab === "tree" && <CodeBlock code={TREE} />}
        {tab === "app" && <CodeBlock code={APP_PY} lang="python" />}
        {tab === "config" && <CodeBlock code={CONFIG_PY} lang="python" />}
        {tab === "req" && <CodeBlock code={REQUIREMENTS} />}
        {tab === "routes" && (
          <div className="space-y-6">
            <Intro title="routes/upload.py" desc="POST /api/upload · multipart/form-data">
              <CodeBlock code={UPLOAD_ROUTE} lang="python" />
            </Intro>
            <Intro title="routes/analyze.py" desc="POST /api/analyze · runs full AI pipeline">
              <CodeBlock code={ANALYZE_ROUTE} lang="python" />
            </Intro>
            <Intro title="routes/speakers.py" desc="GET /api/speakers/&lt;file_id&gt;">
              <CodeBlock code={SPEAKERS_ROUTE} lang="python" />
            </Intro>
            <Intro title="routes/songs.py" desc="GET /api/songs/search?q= · POST /api/songs/select">
              <CodeBlock code={SONGS_ROUTE} lang="python" />
            </Intro>
            <Intro title="routes/generate.py" desc="POST /api/generate · produces final remake">
              <CodeBlock code={GENERATE_ROUTE} lang="python" />
            </Intro>
          </div>
        )}
        {tab === "services" && (
          <div className="space-y-6">
            <Intro title="services/audio.py" desc="Extract audio from video, normalize to 16k mono">
              <CodeBlock code={AUDIO_PY} lang="python" />
            </Intro>
            <Intro title="services/diarize.py" desc="Speaker detection via pyannote.audio">
              <CodeBlock code={DIARIZE_PY} lang="python" />
            </Intro>
            <Intro title="services/separate.py" desc="Split speakers into individual tracks + preview clips">
              <CodeBlock code={SEPARATE_PY} lang="python" />
            </Intro>
            <Intro title="services/convert.py" desc="Voice conversion with RVC + final mix with ffmpeg">
              <CodeBlock code={CONVERT_PY} lang="python" />
            </Intro>
            <Intro title="services/song_search.py" desc="iTunes search + yt-dlp + Demucs download">
              <CodeBlock code={SONG_SEARCH_PY} lang="python" />
            </Intro>
          </div>
        )}
      </div>

      <div className="glass-2 p-5 rounded-2xl text-sm opacity-80 leading-relaxed">
        <b>⚠️ Legal notice:</b> Voice cloning and song remakes must only be used with audio you own or have explicit rights to.
        Do not upload copyrighted music or third-party voices. This stack is provided for educational / personal use.
      </div>
    </div>
  );
}

function Intro({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-2 mb-2">
        <div className="font-display font-bold text-lg">{title}</div>
        <div className="text-xs opacity-60 font-mono">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {}
  };
  return (
    <div className="relative rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.35)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between px-4 py-2 text-[11px] uppercase tracking-widest opacity-60 border-b border-white/5">
        <span>{lang || "text"}</span>
        <button onClick={copy} className="opacity-70 hover:opacity-100 normal-case tracking-normal">Copy</button>
      </div>
      <pre className="p-4 overflow-x-auto text-[12.5px] md:text-[13px] leading-relaxed font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}
