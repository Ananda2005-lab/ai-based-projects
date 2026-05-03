# Smart File Organizer

A colorful Flask web app that scans a folder, asks local Ollama to understand messy filenames, previews safer names, and then organizes files into folders such as `images`, `documents`, `spreadsheets`, `audio`, `video`, `archives`, `code`, and `others`.

## Requirements

- Python 3.10+
- Ollama installed and running locally
- The `gemma:2b` Ollama model:

```powershell
ollama pull gemma:2b
ollama serve
```

Install Python dependencies:

```powershell
pip install -r requirements.txt
```

## Run

```powershell
python app.py
```

Then open:

```text
http://127.0.0.1:5000
```

## How It Works

1. Enter a folder path in the UI.
2. Click `Scan + Preview`.
3. The app sends each visible filename and extension to Ollama.
4. Ollama returns JSON with a better filename, a folder category, and a short reason.
5. The app shows a preview before changing anything.
6. Click `Organize Files` to rename and move the files.

If Ollama is not running, the app still creates a fallback plan using file extensions.

## Safety Notes

- The app only scans files directly inside the selected folder.
- It does not recursively reorganize subfolders.
- It previews all changes before moving files.
- If a target filename already exists, it automatically adds a number, such as `photo_2.jpg`.
