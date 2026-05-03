# Flask Ollama Research Report Generator

A small Python Flask app where a user enters a research topic and Ollama generates a detailed report with introduction, key points, analysis, and conclusion sections. Reports are saved in local history and can be deleted from the UI.

## File Structure

```text
flask-ollama-research-app/
+-- app.py
+-- reports_history.json
+-- requirements.txt
+-- README.md
+-- static/
|   +-- styles.css
+-- templates/
    +-- index.html
```

## Requirements

- Python 3.10+
- Ollama installed and running
- A local Ollama model: `gemma:2b`
- Flask, Requests, and Markdown Python packages from `requirements.txt`

## Setup

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Pull an Ollama model if you do not already have one:

```bash
ollama pull gemma:2b
```

Start Ollama:

```bash
ollama serve
```

Run the Flask app:

```bash
python app.py
```

Open the app at:

```text
http://127.0.0.1:5000
```

Generated reports are stored in `reports_history.json`. The file is created automatically after the first successful report.

## Configuration

The app uses these environment variables:

- `OLLAMA_URL`: Ollama generate API URL. Default: `http://localhost:11434/api/generate`
- `OLLAMA_MODEL`: Ollama model name. Default: `gemma:2b`

Example:

```bash
set OLLAMA_MODEL=gemma:2b
python app.py
```
