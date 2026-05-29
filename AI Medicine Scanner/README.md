# AI Medicine Scanner & Explainer

A full-stack Flask web app that lets users upload medicine photos, extracts visible text with OCR, detects expiry status, explains medicine details in simple language, checks possible interactions, saves scan history, supports reminders, and includes an AI-style chat assistant.

> Medical safety note: this project is for educational and informational use only. It does not diagnose, prescribe, or replace advice from a doctor or pharmacist.

## Folder Structure

```text
ai-medicine-scanner/
+-- app.py
+-- requirements.txt
+-- README.md
+-- medicine_scanner.db       # created automatically
+-- uploads/                  # created automatically
+-- templates/
|   +-- index.html
+-- static/
    +-- css/
    |   +-- styles.css
    +-- js/
        +-- app.js
```

## Features

- Multi-image upload for `jpg`, `jpeg`, and `png` up to 20 MB total
- OCR extraction with EasyOCR or Tesseract when installed
- AI-first medicine name, composition, batch, manufacturing date, and expiry detection
- Expiry status: Safe, Near Expiry, or Expired
- Simple-language explanations, precautions, side effects, storage tips, and alternatives
- Interaction checker for multiple selected medicines
- Scan history, favorites, reminders, and chatbot APIs
- Voice explanation using the browser Web Speech API
- English, Hindi, Odia, and Bengali report/chat language selection
- Responsive futuristic healthcare dashboard with multiple saved themes, including Aurora Glass, Emerald Luxe, Royal Violet, and Black Gold

## Setup

1. Create and activate a virtual environment.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If Windows says `python` is not recognized or the `py` launcher says no Python is installed, install Python 3.11+ from [python.org](https://www.python.org/downloads/) and enable **Add python.exe to PATH** during installation.

2. Install dependencies.

```powershell
pip install -r requirements.txt
```

3. Optional OCR setup:

- For Tesseract, install the Tesseract app and ensure it is available on your system path.
- EasyOCR can work from Python, but it may download model files the first time it runs.
- If neither OCR engine is available, the app still runs with a demo-safe fallback parser.

4. Optional local AI setup with Ollama:

Install Ollama, then pull and run the default model:

```powershell
ollama pull llama3.1:8b
ollama pull llava:7b
ollama serve
```

The backend calls `http://127.0.0.1:11434/api/generate`. When Ollama is running, medicine reports use the vision model (`llava:7b`) plus OCR text, and chatbot/interaction checks use the text model (`llama3.1:8b`). You can change them with `OLLAMA_VISION_MODEL` and `OLLAMA_MODEL`. If Ollama is not running, the app falls back to cautious parser-based output instead of pretending to know everything.

5. Start the Flask server.

```powershell
python app.py
```

6. Open the app:

```text
http://127.0.0.1:5000
```

## API Routes

- `POST /api/upload` uploads a medicine image and runs OCR + explanation
- `POST /api/scan` scans an already uploaded file path
- `GET /api/details/<scan_id>` returns a saved scan
- `POST /api/check-expiry` checks expiry date text
- `POST /api/check-interactions` checks multiple medicines
- `GET /api/history` returns previous scans
- `POST /api/favorites` toggles a medicine favorite
- `GET /api/favorites` lists favorites
- `GET /api/reminders` lists reminders
- `POST /api/reminders` creates reminders
- `DELETE /api/reminders/<reminder_id>` deletes a reminder
- `POST /api/chatbot` answers medicine questions in simple language

## Beginner Notes

- `app.py` contains the Flask backend, database setup, OCR helpers, and API logic.
- Clear images give better OCR, but unclear images still get a low-confidence report with a retake warning.
- For best results, upload 3-4 angles: front brand label, back composition label, expiry/batch close-up, and tablet/strip close-up.
- `templates/index.html` is the main user interface.
- `static/css/styles.css` controls the futuristic healthcare design and themes.
- `static/js/app.js` connects the frontend to the Flask APIs.
