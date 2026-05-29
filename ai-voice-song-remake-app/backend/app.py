# ============================================================
# SONICFORGE Backend - TRUE AI Voice Conversion
# ============================================================
# Ye backend ACTUALLY speaker ki awaaz mein song gaata hai
# using RVC (Retrieval-based Voice Conversion)
# ============================================================

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import uuid
from werkzeug.utils import secure_filename

# Import our services
from rvc_convert import convert_voice_with_rvc

app = Flask(__name__)
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# Config
UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
MODELS_FOLDER = "models"
MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["RESULTS_FOLDER"] = RESULTS_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Create folders
for folder in [UPLOAD_FOLDER, RESULTS_FOLDER, MODELS_FOLDER]:
    os.makedirs(folder, exist_ok=True)

ALLOWED_EXT = {".mp3", ".wav", ".m4a", ".ogg", ".flac", ".mp4", ".mov", ".webm"}

def allowed_file(filename):
    return os.path.splitext(filename)[1].lower() in ALLOWED_EXT

# ============================================================
# API Routes
# ============================================================

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "sonicforge-backend"}

@app.post("/api/upload")
def upload():
    """Upload audio/video file"""
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported format"}), 400
    
    # Save file
    ext = os.path.splitext(file.filename)[1].lower()
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    
    return jsonify({
        "ok": True,
        "file_id": filename,
        "path": filepath,
        "size": os.path.getsize(filepath),
    })

@app.post("/api/analyze")
def analyze():
    """
    Analyze uploaded file for speaker detection.
    In production, use pyannote.audio here.
    For demo, we'll simulate detection.
    """
    data = request.get_json()
    file_id = data.get("file_id")
    
    if not file_id:
        return jsonify({"error": "file_id required"}), 400
    
    # Simulate speaker detection (in production, use pyannote)
    speakers = [
        {"id": "sp1", "label": "Speaker 1", "duration": 30.5, "confidence": 0.94},
        {"id": "sp2", "label": "Speaker 2", "duration": 18.2, "confidence": 0.89},
    ]
    
    return jsonify({"ok": True, "speakers": speakers})

@app.post("/api/generate")
def generate():
    """
    Generate TRUE AI voice remake using RVC.
    Selected speaker ACTUALLY sings the song!
    """
    data = request.get_json()
    
    # Required fields
    required = ["file_id", "speaker_id", "song_id", "emotion", "style"]
    for field in required:
        if field not in data:
            return jsonify({"error": f"Missing {field}"}), 400
    
    file_id = data["file_id"]
    speaker_id = data["speaker_id"]
    song_id = data["song_id"]
    emotion = data["emotion"]
    style = data["style"]
    song_url = data.get("song_url")  # iTunes preview URL
    
    try:
        # Generate the remake using RVC
        output_file = convert_voice_with_rvc(
            file_id=file_id,
            speaker_id=speaker_id,
            song_id=song_id,
            emotion=emotion,
            style=style,
            song_url=song_url,
        )
        
        return jsonify({
            "ok": True,
            "filename": os.path.basename(output_file),
            "url": f"/api/download/{os.path.basename(output_file)}",
            "message": "Remake generated successfully! Speaker actually sings the song.",
        })
        
    except Exception as e:
        print(f"Generation error: {e}")
        return jsonify({
            "error": "Generation failed",
            "detail": str(e),
        }), 500

@app.get("/api/download/<filename>")
def download(filename):
    """Download generated remake"""
    return send_from_directory(RESULTS_FOLDER, filename, as_attachment=True)

@app.get("/api/models")
def list_models():
    """List available voice models"""
    models = []
    if os.path.exists(MODELS_FOLDER):
        for f in os.listdir(MODELS_FOLDER):
            if f.endswith(".pth"):
                models.append(f.replace(".pth", ""))
    return jsonify({"models": models})

# ============================================================
# Error Handlers
# ============================================================

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Max 30 MB."}), 413

@app.errorhandler(500)
def server_error(e):
    return jsonify({"error": "Server error", "detail": str(e)}), 500

# ============================================================
# Run Server
# ============================================================

if __name__ == "__main__":
    print("=" * 60)
    print("  SONICFORGE Backend - TRUE AI Voice Conversion")
    print("=" * 60)
    print(f"  Uploads:  {os.path.abspath(UPLOAD_FOLDER)}")
    print(f"  Results:  {os.path.abspath(RESULTS_FOLDER)}")
    print(f"  Models:   {os.path.abspath(MODELS_FOLDER)}")
    print("=" * 60)
    print("  Server running at: http://localhost:5000")
    print("=" * 60)
    print("\n  Next steps:")
    print("  1. Make sure RVC models are in models/ folder")
    print("  2. Run frontend: npm run dev")
    print("  3. Upload audio → Select speaker → Generate!")
    print("=" * 60)
    
    app.run(host="0.0.0.0", port=5000, debug=True)
