# PDF Q&A Flask App with Ollama

A complete Flask app that lets a user upload a PDF and ask questions answered from the PDF content using a local Ollama model.

## File Structure

```text
pdf-qa-flask/
+-- app.py
+-- requirements.txt
+-- README.md
+-- uploads/
|   +-- .gitkeep
+-- services/
|   +-- __init__.py
|   +-- ollama_client.py
|   +-- pdf_store.py
|   +-- text_utils.py
+-- static/
|   +-- styles.css
+-- templates/
    +-- index.html
```

## Prerequisites

Install and run Ollama:

```powershell
ollama pull gemma:2b
ollama serve
```

If Ollama is already running as a background service, you do not need to run `ollama serve`.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
python app.py
```

Open:

```text
http://127.0.0.1:5000
```

## Configuration

You can override these with environment variables or a `.env` file:

```text
FLASK_SECRET_KEY=change-me
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma:2b
MAX_CONTENT_LENGTH_MB=25
```

## How It Works

1. The user uploads a PDF.
2. The app extracts text from the PDF with `pypdf`.
3. The text is split into overlapping chunks.
4. A simple keyword scoring retriever selects the most relevant chunks for each question.
5. The selected PDF context and question are sent to Ollama.
6. The answer is displayed in the browser.

This version intentionally avoids external vector databases so it is easy to run locally. For larger PDFs, replace the keyword retriever in `services/pdf_store.py` with embeddings.
