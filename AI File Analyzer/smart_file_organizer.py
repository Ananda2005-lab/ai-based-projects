import json
import mimetypes
import re
import shutil
import threading
from dataclasses import dataclass
from pathlib import Path
from tkinter import END, BOTH, LEFT, RIGHT, Y, X, Button, Entry, Frame, Label, Listbox, StringVar, Tk, filedialog, messagebox

import requests


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


@dataclass
class FilePlan:
    source: Path
    target: Path
    category: str
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


def clean_filename(name: str, fallback: str) -> str:
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9._ -]+", "", name)
    name = re.sub(r"[\s_-]+", "_", name)
    name = name.strip("._-")
    return name or fallback


def unique_path(path: Path, reserved: set[Path] | None = None) -> Path:
    reserved = reserved or set()
    if not path.exists() and path not in reserved:
        return path
    stem = path.stem
    suffix = path.suffix
    counter = 2
    while True:
        candidate = path.with_name(f"{stem}_{counter}{suffix}")
        if not candidate.exists() and candidate not in reserved:
            return candidate
        counter += 1


def ask_ollama_for_file_plan(path: Path, model: str) -> tuple[str, str, str]:
    category_hint = extension_category(path)
    prompt = f"""
You rename and organize local files. Use only the visible filename and extension.
Return strict JSON with these keys:
- new_name: short, descriptive snake_case filename with the original extension
- category: one folder name from images, documents, spreadsheets, presentations, audio, video, archives, code, others
- reason: one short reason

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

    suggested_name = Path(str(data.get("new_name", path.name))).stem
    new_name = clean_filename(suggested_name, path.stem) + path.suffix.lower()

    category = clean_filename(str(data.get("category", category_hint)), category_hint)
    if category not in EXTENSION_FOLDERS and category not in {"others", "image", "audio", "video", "text", "application"}:
        category = category_hint
    if category == "image":
        category = "images"
    if category == "text":
        category = "documents"
    if category == "application":
        category = category_hint if category_hint != "application" else "others"

    reason = str(data.get("reason", "Organized by filename and extension.")).strip()
    return new_name, category, reason[:140]


def build_plan(folder: Path, model: str, use_ollama: bool = True) -> list[FilePlan]:
    plans: list[FilePlan] = []
    reserved_targets: set[Path] = set()
    for item in folder.iterdir():
        if not item.is_file():
            continue

        category = extension_category(item)
        new_name = clean_filename(item.stem, item.stem) + item.suffix.lower()
        reason = "Organized by extension."

        if use_ollama:
            try:
                new_name, category, reason = ask_ollama_for_file_plan(item, model)
            except Exception as exc:
                reason = f"Ollama unavailable; used extension fallback. {exc.__class__.__name__}"

        target_folder = folder / category
        target = unique_path(target_folder / new_name, reserved_targets)
        reserved_targets.add(target)
        plans.append(FilePlan(source=item, target=target, category=category, reason=reason))
    return plans


def apply_plan(plans: list[FilePlan]) -> None:
    for plan in plans:
        plan.target.parent.mkdir(exist_ok=True)
        shutil.move(str(plan.source), str(plan.target))


class SmartOrganizerApp:
    def __init__(self) -> None:
        self.root = Tk()
        self.root.title("Smart File Organizer")
        self.root.geometry("980x660")
        self.root.minsize(860, 560)
        self.root.configure(bg="#120925")

        self.folder_var = StringVar()
        self.model_var = StringVar(value=DEFAULT_MODEL)
        self.status_var = StringVar(value="Choose a folder to begin.")
        self.plans: list[FilePlan] = []

        self._build_ui()

    def _build_ui(self) -> None:
        hero = Frame(self.root, bg="#120925", padx=28, pady=24)
        hero.pack(fill=X)

        Label(hero, text="Smart File Organizer", fg="#fff7ff", bg="#120925", font=("Segoe UI", 28, "bold")).pack(anchor="w")
        Label(
            hero,
            text="Rename messy files with Ollama, preview every move, then organize them into clean folders.",
            fg="#bdb4ff",
            bg="#120925",
            font=("Segoe UI", 12),
        ).pack(anchor="w", pady=(6, 0))

        controls = Frame(self.root, bg="#1d1235", padx=22, pady=18, highlightthickness=1, highlightbackground="#6d4dff")
        controls.pack(fill=X, padx=28, pady=(0, 18))

        Label(controls, text="Folder", fg="#fdfbff", bg="#1d1235", font=("Segoe UI", 10, "bold")).grid(row=0, column=0, sticky="w")
        folder_entry = Entry(controls, textvariable=self.folder_var, bg="#281945", fg="#ffffff", insertbackground="#ffffff", relief="flat", font=("Segoe UI", 11))
        folder_entry.grid(row=1, column=0, sticky="ew", ipady=10, pady=(6, 14), padx=(0, 12))

        browse = self._glow_button(controls, "Browse", self.pick_folder, "#00d4ff")
        browse.grid(row=1, column=1, sticky="ew", pady=(6, 14))

        Label(controls, text="Ollama model", fg="#fdfbff", bg="#1d1235", font=("Segoe UI", 10, "bold")).grid(row=2, column=0, sticky="w")
        model_entry = Entry(controls, textvariable=self.model_var, bg="#281945", fg="#ffffff", insertbackground="#ffffff", relief="flat", font=("Segoe UI", 11))
        model_entry.grid(row=3, column=0, sticky="ew", ipady=10, padx=(0, 12))

        scan = self._glow_button(controls, "Scan + Preview", self.scan_folder, "#ff4ecd")
        scan.grid(row=3, column=1, sticky="ew")
        controls.columnconfigure(0, weight=1)

        body = Frame(self.root, bg="#120925", padx=28)
        body.pack(fill=BOTH, expand=True)

        list_frame = Frame(body, bg="#1a1030", padx=12, pady=12, highlightthickness=1, highlightbackground="#3e2e6f")
        list_frame.pack(side=LEFT, fill=BOTH, expand=True, padx=(0, 14))

        Label(list_frame, text="Preview", fg="#ffffff", bg="#1a1030", font=("Segoe UI", 14, "bold")).pack(anchor="w", pady=(0, 8))
        self.listbox = Listbox(list_frame, bg="#0e071d", fg="#f7efff", selectbackground="#7c3cff", relief="flat", font=("Consolas", 10), activestyle="none")
        self.listbox.pack(side=LEFT, fill=BOTH, expand=True)

        scrollbar = Frame(list_frame, bg="#5832e6", width=4)
        scrollbar.pack(side=RIGHT, fill=Y)

        side = Frame(body, bg="#25173d", padx=18, pady=18, width=260, highlightthickness=1, highlightbackground="#ff4ecd")
        side.pack(side=RIGHT, fill=Y)
        side.pack_propagate(False)

        Label(side, text="Actions", fg="#ffffff", bg="#25173d", font=("Segoe UI", 16, "bold")).pack(anchor="w")
        Label(side, textvariable=self.status_var, fg="#cfc5ff", bg="#25173d", wraplength=220, justify=LEFT, font=("Segoe UI", 10)).pack(anchor="w", pady=(8, 20))

        self.organize_button = self._glow_button(side, "Organize Files", self.organize_files, "#61ff9b")
        self.organize_button.pack(fill=X, ipady=6, pady=(0, 12))

        clear_button = self._glow_button(side, "Clear Preview", self.clear_preview, "#ffd166")
        clear_button.pack(fill=X, ipady=6)

        Label(
            side,
            text="Tip: keep Ollama running locally before scanning for the best names.",
            fg="#9f95c8",
            bg="#25173d",
            wraplength=220,
            justify=LEFT,
            font=("Segoe UI", 9),
        ).pack(side="bottom", anchor="w")

    def _glow_button(self, parent: Frame, text: str, command, color: str) -> Button:
        return Button(
            parent,
            text=text,
            command=command,
            bg=color,
            fg="#120925",
            activebackground="#ffffff",
            activeforeground="#120925",
            relief="flat",
            bd=0,
            cursor="hand2",
            font=("Segoe UI", 11, "bold"),
            padx=18,
            pady=10,
            highlightthickness=2,
            highlightbackground=color,
            highlightcolor=color,
        )

    def pick_folder(self) -> None:
        folder = filedialog.askdirectory()
        if folder:
            self.folder_var.set(folder)
            self.status_var.set("Folder selected. Ready to scan.")

    def scan_folder(self) -> None:
        folder = Path(self.folder_var.get()).expanduser()
        if not folder.is_dir():
            messagebox.showerror("Missing folder", "Please choose a valid folder.")
            return
        self.status_var.set("Scanning with Ollama...")
        self.listbox.delete(0, END)
        threading.Thread(target=self._scan_worker, args=(folder,), daemon=True).start()

    def _scan_worker(self, folder: Path) -> None:
        plans = build_plan(folder, self.model_var.get().strip() or DEFAULT_MODEL)
        self.root.after(0, lambda: self._show_plans(plans))

    def _show_plans(self, plans: list[FilePlan]) -> None:
        self.plans = plans
        self.listbox.delete(0, END)
        if not plans:
            self.status_var.set("No loose files found in that folder.")
            return
        for plan in plans:
            self.listbox.insert(END, f"{plan.source.name}  ->  {plan.category}\\{plan.target.name}  |  {plan.reason}")
        self.status_var.set(f"Preview ready: {len(plans)} file(s). Review, then organize.")

    def organize_files(self) -> None:
        if not self.plans:
            messagebox.showinfo("Nothing to organize", "Scan a folder first.")
            return
        if not messagebox.askyesno("Organize files", "Move and rename the previewed files now?"):
            return
        try:
            apply_plan(self.plans)
        except Exception as exc:
            messagebox.showerror("Could not organize files", str(exc))
            return
        self.status_var.set("Done. Files renamed and organized.")
        messagebox.showinfo("Complete", "Files were organized successfully.")
        self.clear_preview()

    def clear_preview(self) -> None:
        self.plans = []
        self.listbox.delete(0, END)
        self.status_var.set("Preview cleared.")

    def run(self) -> None:
        self.root.mainloop()


if __name__ == "__main__":
    SmartOrganizerApp().run()
