import json
import mimetypes
import re
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path
from tkinter import Tk, filedialog

import requests
from flask import Flask, flash, jsonify, redirect, render_template, request, url_for


OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "gemma:2b"

EXTENSION_FOLDERS = {
    "images": {".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".tiff", ".heic"},
    "documents": {".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt", ".md"},
    "spreadsheets": {".xls", ".xlsx", ".csv", ".tsv", ".ods"},
    "presentations": {".ppt", ".pptx", ".odp"},
    "audio": {".mp3", ".wav", ".aac", ".flac", ".m4a", ".ogg"},
    "video": {".mp4", ".mov", ".avi", ".mkv", ".webm", ".wmv"},
    "archives": {".zip", ".rar", ".7z", ".tar", ".gz"},
    "code": {".py", ".js", ".ts", ".html", ".css", ".json", ".java", ".cpp", ".c", ".cs", ".go", ".rs", ".php"},
}

app = Flask(__name__)
app.secret_key = "change-this-local-dev-secret"
LAST_PLAN: list[dict[str, str]] = []


@dataclass
class FilePlan:
    source: str
    target: str
    category: str
    old_name: str
    new_name: str
    reason: str


def extension_category(path: Path) -> str:
    suffix = path.suffix.lower()
    for category, suffixes in EXTENSION_FOLDERS.items():
        if suffix in suffixes:
            return category

    guessed_type, _ = mimetypes.guess_type(path.name)
    if guessed_type:
        mime_group = guessed_type.split("/", 1)[0]
        if mime_group == "image":
            return "images"
        if mime_group == "text":
            return "documents"
        if mime_group in {"audio", "video"}:
            return mime_group
    return "others"


def clean_name(value: str, fallback: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9._ -]+", "", value)
    value = re.sub(r"[\s_-]+", "_", value)
    value = value.strip("._-")
    return value or fallback


def unique_path(path: Path, reserved: set[Path]) -> Path:
    if not path.exists() and path not in reserved:
        return path

    counter = 2
    while True:
        candidate = path.with_name(f"{path.stem}_{counter}{path.suffix}")
        if not candidate.exists() and candidate not in reserved:
            return candidate
        counter += 1


def normalize_category(category: str, fallback: str) -> str:
    category = clean_name(category, fallback)
    if category == "image":
        return "images"
    if category == "text":
        return "documents"
    if category == "application":
        return fallback if fallback != "application" else "others"
    if category in EXTENSION_FOLDERS or category == "others":
        return category
    return fallback


def ask_ollama(path: Path, model: str) -> tuple[str, str, str]:
    category_hint = extension_category(path)
    prompt = f"""
You rename and organize local files. Use only the visible filename and extension.
Return strict JSON only with:
{{
  "new_name": "short_descriptive_snake_case{path.suffix.lower()}",
  "category": "images|documents|spreadsheets|presentations|audio|video|archives|code|others",
  "reason": "one short reason"
}}

File: {path.name}
Detected category hint: {category_hint}
"""
    response = requests.post(
        OLLAMA_URL,
        json={"model": model, "prompt": prompt, "stream": False, "format": "json"},
        timeout=60,
    )
    response.raise_for_status()
    raw = response.json().get("response", "{}")
    data = json.loads(raw)

    new_stem = clean_name(Path(str(data.get("new_name", path.name))).stem, path.stem)
    new_name = f"{new_stem}{path.suffix.lower()}"
    category = normalize_category(str(data.get("category", category_hint)), category_hint)
    reason = str(data.get("reason", "Organized by filename and extension.")).strip()[:140]
    return new_name, category, reason


def build_plan(folder: Path, model: str) -> list[FilePlan]:
    reserved: set[Path] = set()
    plans: list[FilePlan] = []

    for item in sorted(folder.iterdir()):
        if not item.is_file():
            continue

        category = extension_category(item)
        new_name = f"{clean_name(item.stem, item.stem)}{item.suffix.lower()}"
        reason = "Used extension fallback."

        try:
            new_name, category, reason = ask_ollama(item, model)
        except Exception as exc:
            reason = f"Ollama unavailable or invalid response; used fallback. {exc.__class__.__name__}"

        target = unique_path(folder / category / new_name, reserved)
        reserved.add(target)
        plans.append(
            FilePlan(
                source=str(item),
                target=str(target),
                category=category,
                old_name=item.name,
                new_name=target.name,
                reason=reason,
            )
        )

    return plans


def apply_plan(plan_rows: list[dict[str, str]]) -> int:
    moved = 0
    for row in plan_rows:
        source = Path(row["source"])
        target = Path(row["target"])
        if not source.exists() or not source.is_file():
            continue
        target.parent.mkdir(exist_ok=True)
        shutil.move(str(source), str(target))
        moved += 1
    return moved


@app.route("/choose-folder", methods=["POST"])
def choose_folder():
    root = Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    folder = filedialog.askdirectory(title="Choose a folder to organize")
    root.destroy()
    return jsonify({"folder": folder})


@app.route("/", methods=["GET", "POST"])
def index():
    global LAST_PLAN
    folder = request.form.get("folder", "")
    model = request.form.get("model", DEFAULT_MODEL).strip() or DEFAULT_MODEL

    if request.method == "POST":
        action = request.form.get("action")

        if action == "scan":
            folder_path = Path(folder).expanduser()
            if not folder_path.is_dir():
                flash("Please enter a valid folder path.", "error")
                LAST_PLAN = []
            else:
                plans = build_plan(folder_path, model)
                LAST_PLAN = [asdict(plan) for plan in plans]
                flash(f"Preview ready for {len(LAST_PLAN)} file(s).", "success")

        if action == "organize":
            moved = apply_plan(LAST_PLAN)
            LAST_PLAN = []
            flash(f"Done. Organized {moved} file(s).", "success")
            return redirect(url_for("index"))

    return render_template("index.html", model=model, folder=folder, plans=LAST_PLAN)


if __name__ == "__main__":
    app.run(debug=False, port=5000, use_reloader=False)
