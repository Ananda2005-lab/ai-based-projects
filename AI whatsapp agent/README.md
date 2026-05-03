# AI WhatsApp Auto Message Sender

A simple Flask project that uses local Ollama to generate a WhatsApp message and `pywhatkit` to schedule it through WhatsApp Web.

## Folder Structure

```text
.
├── app.py
├── requirements.txt
├── README.md
└── templates
    └── index.html
```

## Requirements

- Python 3.10 or newer
- Ollama installed and running locally
- A local Ollama model, such as `llama3.2`
- WhatsApp Web access in your default browser

## Setup

1. Create a virtual environment:

   ```bash
   python -m venv venv
   ```

2. Activate the virtual environment.

   Windows PowerShell:

   ```powershell
   .\venv\Scripts\Activate.ps1
   ```

   macOS or Linux:

   ```bash
   source venv/bin/activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start Ollama:

   ```bash
   ollama serve
   ```

5. In another terminal, make sure your model is available:

   ```bash
   ollama pull gemma:2b
   ```

6. Run the Flask app:

   ```bash
   python app.py
   ```

7. Open the web app:

   ```text
   http://127.0.0.1:5000
   ```

## How to Use

1. Enter a message topic.
2. Enter the phone number with country code, for example `+919876543210`.
3. Choose a send time in 24-hour format.
4. Submit the form.
5. Keep your browser open and make sure WhatsApp Web is logged in.

## Optional Configuration

Use a different Ollama model:

```powershell
$env:OLLAMA_MODEL = "mistral"
python app.py
```

Use a different Ollama API URL:

```powershell
$env:OLLAMA_URL = "http://localhost:11434/api/generate"
python app.py
```

## Notes

- `pywhatkit` uses WhatsApp Web, so the first run may ask you to scan the WhatsApp QR code.
- The selected time must be at least 2 minutes in the future.
- If the selected time has already passed today, the app schedules it for tomorrow.
