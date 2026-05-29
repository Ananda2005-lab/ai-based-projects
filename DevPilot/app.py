import os
import shutil
import subprocess
import uuid
import zipfile
import ast
import sqlite3
from datetime import datetime
from functools import wraps
from pathlib import Path

import requests
from flask import Flask, jsonify, redirect, render_template, request, session, url_for
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename


BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = BASE_DIR / "uploads"
EXTRACT_DIR = BASE_DIR / "extracted_projects"
DB_PATH = BASE_DIR / "ai_devops.db"
ALLOWED_EXTENSIONS = {"zip"}

GITHUB_API_URL = "https://api.github.com"
RENDER_API_URL = "https://api.render.com/v1"

def load_env_file(path):
    """Load KEY=value pairs from .env without requiring an extra package."""
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file(BASE_DIR / ".env")

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 250 * 1024 * 1024
app.secret_key = os.getenv("APP_SECRET_KEY") or "change-this-dev-secret-key"

UPLOAD_DIR.mkdir(exist_ok=True)
EXTRACT_DIR.mkdir(exist_ok=True)

# Beginner-friendly in-memory state. For production, use Redis or a database.
projects = {}
latest_project_id = None


def is_authenticated():
    return session.get("user_id") is not None


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if is_authenticated():
            return view(*args, **kwargs)
        if request.path.startswith(("/upload", "/analyze", "/push-github", "/deploy", "/status", "/config-status")):
            return jsonify({"ok": False, "error": "Login required."}), 401
        return redirect(url_for("login_page"))
    return wrapped_view


def get_login_credentials():
    return {
        "username": os.getenv("APP_USERNAME") or "admin",
        "password": os.getenv("APP_PASSWORD") or "admin123",
    }


def get_db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_auth_db():
    with get_db() as db:
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        credentials = get_login_credentials()
        existing = db.execute("SELECT id FROM users WHERE username = ?", (credentials["username"],)).fetchone()
        if not existing:
            db.execute(
                "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
                (credentials["username"], generate_password_hash(credentials["password"]), now()),
            )


def find_user_by_username(username):
    with get_db() as db:
        return db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()


def create_user(username, password):
    with get_db() as db:
        db.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (username, generate_password_hash(password), now()),
        )


def valid_username(username):
    return username and 3 <= len(username) <= 30 and all(char.isalnum() or char in "-_" for char in username)


def now():
    return datetime.utcnow().isoformat(timespec="seconds") + "Z"


init_auth_db()


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def create_project_state(zip_name):
    project_id = str(uuid.uuid4())
    projects[project_id] = {
        "id": project_id,
        "zip_name": zip_name,
        "status": "Uploading",
        "progress": 5,
        "project_type": None,
        "build_command": None,
        "start_command": None,
        "github_url": None,
        "render_url": None,
        "service_id": None,
        "deploy_status": None,
        "last_deploy_status": None,
        "render_poll_error": None,
        "zip_path": None,
        "extract_base_path": None,
        "project_path": None,
        "project_candidates": [],
        "selected_project_key": None,
        "logs": [f"[{now()}] Created upload job."],
        "error": None,
    }
    return project_id


def log(project_id, message):
    projects[project_id]["logs"].append(f"[{now()}] {message}")


def set_status(project_id, status, progress):
    projects[project_id]["status"] = status
    projects[project_id]["progress"] = progress
    log(project_id, status)


def clean_name(name):
    base = Path(name).stem.lower()
    safe = "".join(char if char.isalnum() or char == "-" else "-" for char in base)
    safe = "-".join(part for part in safe.split("-") if part)
    return safe[:70] or f"ai-devops-{uuid.uuid4().hex[:8]}"


def safe_extract(zip_ref, destination):
    destination = destination.resolve()
    for member in zip_ref.infolist():
        target = (destination / member.filename).resolve()
        if not str(target).startswith(str(destination)):
            raise ValueError("Unsafe zip file path detected.")
    zip_ref.extractall(destination)


def find_project_root(extract_path):
    entries = [item for item in extract_path.iterdir() if item.name != "__MACOSX"]
    if len(entries) == 1 and entries[0].is_dir():
        return entries[0]
    return extract_path


def has_project_markers(path):
    markers = ["requirements.txt", "package.json", "app.py", "wsgi.py", "manage.py"]
    return any((path / marker).exists() for marker in markers)


def score_candidate(path, root_path):
    depth = len(path.relative_to(root_path).parts)
    score = 0
    if (path / "requirements.txt").exists():
        score += 4
    if (path / "package.json").exists():
        score += 4
    if (path / "app.py").exists():
        score += 3
    if (path / "wsgi.py").exists():
        score += 2
    if (path / "templates").exists():
        score += 1
    if (path / "static").exists():
        score += 1
    return score - depth


def detect_project_candidates(root_path):
    candidates = []
    seen = set()

    search_paths = [root_path]
    for directory in root_path.rglob("*"):
        if not directory.is_dir():
            continue
        if any(part.startswith(".") for part in directory.parts if part not in root_path.parts):
            continue
        if any(part in {"__pycache__", "node_modules", ".git", ".venv", "venv", "instance"} for part in directory.parts):
            continue
        search_paths.append(directory)

    for path in search_paths:
        if not has_project_markers(path):
            continue
        resolved = str(path.resolve())
        if resolved in seen:
            continue
        seen.add(resolved)
        relative_path = "." if path == root_path else str(path.relative_to(root_path)).replace("\\", "/")
        candidates.append(
            {
                "key": relative_path,
                "label": path.name if path != root_path else root_path.name,
                "path": str(path),
                "relative_path": relative_path,
                "score": score_candidate(path, root_path),
            }
        )

    candidates.sort(key=lambda item: (-item["score"], len(item["relative_path"]), item["relative_path"]))
    return candidates


def set_selected_project(project, selected_key):
    candidates = project.get("project_candidates", [])
    match = next((candidate for candidate in candidates if candidate["key"] == selected_key), None)
    if not match:
        raise ValueError("Selected project folder was not found in the uploaded zip.")
    project["selected_project_key"] = match["key"]
    project["project_path"] = match["path"]
    return match


def get_repo_root(project):
    return Path(project.get("extract_base_path") or project["project_path"])


def analyze_project(project_path):
    requirements = project_path / "requirements.txt"
    package_json = project_path / "package.json"
    app_file = project_path / "app.py"
    wsgi_file = project_path / "wsgi.py"

    if requirements.exists():
        return {
            "project_type": "Flask/Python",
            "build_command": "pip install -r requirements.txt",
            "start_command": detect_python_start_command(project_path),
        }

    if app_file.exists() or wsgi_file.exists():
        generated_requirements = infer_python_requirements(project_path)
        requirements.write_text("\n".join(generated_requirements) + "\n", encoding="utf-8")
        return {
            "project_type": "Flask/Python",
            "build_command": "pip install -r requirements.txt",
            "start_command": detect_python_start_command(project_path),
        }

    if package_json.exists():
        return {
            "project_type": "Node/React",
            "build_command": "npm install && npm run build",
            "start_command": "npm start",
        }

    return {
        "project_type": "Unknown",
        "build_command": "",
        "start_command": "",
    }


def detect_python_start_command(project_path):
    app_file = project_path / "app.py"
    if not app_file.exists():
        return "gunicorn app:app"

    try:
        tree = ast.parse(app_file.read_text(encoding="utf-8"))
    except SyntaxError:
        return "gunicorn app:app"

    has_factory = any(isinstance(node, ast.FunctionDef) and node.name == "create_app" for node in tree.body)
    has_global_app = any(
        isinstance(node, (ast.Assign, ast.AnnAssign))
        and any(getattr(target, "id", None) == "app" for target in getattr(node, "targets", [getattr(node, "target", None)]))
        for node in tree.body
    )

    if has_factory and not has_global_app:
        return 'gunicorn "app:create_app()"'
    return "gunicorn app:app"


def infer_python_requirements(project_path):
    import_to_package = {
        "flask": "Flask",
        "flask_login": "Flask-Login",
        "flask_sqlalchemy": "Flask-SQLAlchemy",
        "flask_wtf": "Flask-WTF",
        "dotenv": "python-dotenv",
        "requests": "requests",
        "pandas": "pandas",
        "numpy": "numpy",
        "PIL": "Pillow",
    }
    packages = {"Flask", "gunicorn"}

    for py_file in project_path.rglob("*.py"):
        if "__pycache__" in py_file.parts or ".venv" in py_file.parts:
            continue
        try:
            tree = ast.parse(py_file.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, SyntaxError):
            continue

        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    module_name = alias.name.split(".", 1)[0]
                    if module_name in import_to_package:
                        packages.add(import_to_package[module_name])
            elif isinstance(node, ast.ImportFrom) and node.module:
                module_name = node.module.split(".", 1)[0]
                if module_name in import_to_package:
                    packages.add(import_to_package[module_name])

    return sorted(packages)


def run_command(command, cwd, project_id):
    display_command = " ".join(mask_secret(part) for part in command)
    log(project_id, f"Running: {display_command}")
    result = subprocess.run(
        command,
        cwd=cwd,
        text=True,
        capture_output=True,
        check=False,
    )
    if result.stdout.strip():
        log(project_id, result.stdout.strip())
    if result.stderr.strip():
        log(project_id, result.stderr.strip())
    if result.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(command)}")
    return result


def run_optional_command(command, cwd, project_id):
    try:
        run_command(command, cwd, project_id)
    except RuntimeError as exc:
        log(project_id, f"Skipping optional command: {exc}")


def mask_secret(value):
    if "x-access-token:" in value:
        return value.split("x-access-token:", 1)[0] + "x-access-token:***@github.com"
    return value


def render_headers(render_token):
    return {
        "Authorization": f"Bearer {render_token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def discover_render_owner_id(render_token, project_id):
    response = requests.get(
        f"{RENDER_API_URL}/owners",
        headers=render_headers(render_token),
        timeout=30,
    )
    if response.status_code != 200:
        raise RuntimeError(clean_api_error(response, "Unable to list Render workspaces."))

    data = response.json()
    owners = data if isinstance(data, list) else data.get("owners", [])
    if not owners:
        raise ValueError("No Render workspaces found for this API key.")

    first_owner = owners[0].get("owner", owners[0])
    owner_id = first_owner.get("id")
    owner_name = first_owner.get("name") or first_owner.get("email") or "Render workspace"
    if not owner_id:
        raise ValueError("Render owners response did not include an owner id.")

    log(project_id, f"Using Render owner {owner_name} ({owner_id}).")
    return owner_id


def resolve_render_owner_id(render_token, configured_owner_id, project_id):
    if configured_owner_id and configured_owner_id.startswith("srv-"):
        raise ValueError(
            "RENDER_OWNER_ID is currently a service id. Service ids start with srv-. "
            "Use a workspace owner id from Render's /owners API, usually starting with tea- or own-."
        )

    if configured_owner_id and configured_owner_id.startswith("usr-"):
        log(project_id, "RENDER_OWNER_ID looks like a user id. Auto-detecting the workspace owner id instead.")
        return discover_render_owner_id(render_token, project_id)

    if configured_owner_id:
        return configured_owner_id

    log(project_id, "RENDER_OWNER_ID is blank. Looking up Render owner from API key.")
    return discover_render_owner_id(render_token, project_id)


def read_latest_render_deploy(service_id, render_token):
    response = requests.get(
        f"{RENDER_API_URL}/services/{service_id}/deploys",
        headers=render_headers(render_token),
        timeout=30,
    )
    if response.status_code != 200:
        raise RuntimeError(clean_api_error(response, "Unable to read Render deploy status."))

    data = response.json()
    deploys = data if isinstance(data, list) else data.get("deploys", [])
    if not deploys:
        return None
    return deploys[0].get("deploy", deploys[0])


def refresh_render_status(project_id):
    project = projects[project_id]
    if project.get("status") not in ("Render Service Created", "Deploying", "Render Building"):
        return
    if not project.get("service_id"):
        return

    render_token = os.getenv("RENDER_API_KEY")
    if not render_token:
        return

    try:
        latest_deploy = read_latest_render_deploy(project["service_id"], render_token)
        if not latest_deploy:
            return

        deploy_status = latest_deploy.get("status") or "unknown"
        project["deploy_status"] = deploy_status
        if deploy_status != project.get("last_deploy_status"):
            project["last_deploy_status"] = deploy_status
            log(project_id, f"Render deploy status: {deploy_status}")

        if deploy_status in {"live", "succeeded"}:
            set_status(project_id, "Done", 100)
        elif deploy_status in {"build_failed", "update_failed", "failed", "canceled", "cancelled"}:
            project["status"] = "Error"
            project["error"] = f"Render deploy failed with status: {deploy_status}. Check Render service logs."
            log(project_id, project["error"])
        else:
            project["status"] = "Render Building"
            project["progress"] = 95
    except Exception as exc:
        project["render_poll_error"] = str(exc)
        if project.get("last_deploy_status") != "poll-error":
            project["last_deploy_status"] = "poll-error"
            log(project_id, f"Render status check error: {exc}")


def require_project(project_id):
    if not project_id or project_id not in projects:
        raise ValueError("Project not found. Upload a zip file first.")
    return projects[project_id]


@app.route("/")
@login_required
def index():
    return render_template("index.html")


@app.route("/login", methods=["GET", "POST"])
def login_page():
    if request.method == "GET":
        if is_authenticated():
            return redirect(url_for("index"))
        return render_template("login.html")

    data = request.form
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user = find_user_by_username(username)
    if user and check_password_hash(user["password_hash"], password):
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        return redirect(url_for("index"))

    return render_template("login.html", error="Invalid username or password."), 401


@app.route("/register", methods=["GET", "POST"])
def register_page():
    if request.method == "GET":
        if is_authenticated():
            return redirect(url_for("index"))
        return render_template("register.html")

    username = (request.form.get("username") or "").strip()
    password = request.form.get("password") or ""
    confirm_password = request.form.get("confirm_password") or ""

    if not valid_username(username):
        return render_template("register.html", error="Username must be 3-30 characters and use only letters, numbers, - or _."), 400
    if len(password) < 6:
        return render_template("register.html", error="Password must be at least 6 characters."), 400
    if password != confirm_password:
        return render_template("register.html", error="Passwords do not match."), 400
    if find_user_by_username(username):
        return render_template("register.html", error="Username already exists."), 409

    create_user(username, password)
    user = find_user_by_username(username)
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    return redirect(url_for("index"))


@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))


@app.route("/upload", methods=["POST"])
@login_required
def upload():
    global latest_project_id
    try:
        if "file" not in request.files:
            return jsonify({"ok": False, "error": "No file field found."}), 400

        uploaded_file = request.files["file"]
        if uploaded_file.filename == "":
            return jsonify({"ok": False, "error": "No file selected."}), 400
        if not allowed_file(uploaded_file.filename):
            return jsonify({"ok": False, "error": "Only .zip files are supported."}), 400

        filename = secure_filename(uploaded_file.filename)
        project_id = create_project_state(filename)
        latest_project_id = project_id
        project = projects[project_id]

        zip_path = UPLOAD_DIR / f"{project_id}-{filename}"
        extract_path = EXTRACT_DIR / project_id
        extract_path.mkdir(parents=True, exist_ok=True)

        uploaded_file.save(zip_path)
        project["zip_path"] = str(zip_path)
        set_status(project_id, "Uploading", 20)

        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            safe_extract(zip_ref, extract_path)

        project_root = find_project_root(extract_path)
        project["extract_base_path"] = str(project_root)
        project["project_candidates"] = detect_project_candidates(project_root)
        log(project_id, f"Extracted to {project_root}")

        if project["project_candidates"]:
            selected = project["project_candidates"][0]
            set_selected_project(project, selected["key"])
            if len(project["project_candidates"]) > 1:
                log(project_id, f"Detected {len(project['project_candidates'])} project folders. Defaulting to {selected['relative_path']}.")
            else:
                log(project_id, f"Detected project folder {selected['relative_path']}.")
        else:
            project["project_path"] = str(project_root)
            log(project_id, "No distinct project folders detected. Using extracted root.")
        set_status(project_id, "Uploaded", 30)

        return jsonify({"ok": True, "project_id": project_id, "status": public_project(project)})
    except Exception as exc:
        if latest_project_id in projects:
            projects[latest_project_id]["error"] = str(exc)
            projects[latest_project_id]["status"] = "Error"
            log(latest_project_id, f"Error: {exc}")
        return jsonify({"ok": False, "error": str(exc)}), 500


@app.route("/analyze", methods=["POST"])
@login_required
def analyze():
    try:
        data = request.get_json(silent=True) or {}
        project_id = data.get("project_id") or latest_project_id
        project = require_project(project_id)
        selected_key = data.get("selected_project_key")
        if selected_key:
            selected = set_selected_project(project, selected_key)
            log(project_id, f"Selected project folder {selected['relative_path']}.")

        set_status(project_id, "Analyzing", 45)
        analysis = analyze_project(Path(project["project_path"]))
        project.update(analysis)
        log(project_id, f"Detected {analysis['project_type']}.")
        set_status(project_id, "Analyzed", 55)
        return jsonify({"ok": True, "project_id": project_id, "analysis": analysis})
    except Exception as exc:
        return handle_route_error(project_id if "project_id" in locals() else None, exc)


@app.route("/push-github", methods=["POST"])
@login_required
def push_github():
    try:
        data = request.get_json(silent=True) or {}
        project_id = data.get("project_id") or latest_project_id
        project = require_project(project_id)

        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            raise ValueError("Missing GITHUB_TOKEN environment variable.")

        repo_name = data.get("repo_name") or f"{clean_name(project['zip_name'])}-{project_id[:8]}"
        private = bool(data.get("private", False))

        set_status(project_id, "GitHub Push", 65)
        repo_response = requests.post(
            f"{GITHUB_API_URL}/user/repos",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2026-03-10",
            },
            json={"name": repo_name, "private": private, "auto_init": False},
            timeout=30,
        )
        if repo_response.status_code != 201:
            raise RuntimeError(clean_api_error(repo_response, "GitHub repository creation failed."))

        repo_data = repo_response.json()
        html_url = repo_data["html_url"]
        clone_url = repo_data["clone_url"]
        authenticated_url = clone_url.replace("https://", f"https://x-access-token:{github_token}@")

        repo_root = get_repo_root(project)
        if not (repo_root / ".git").exists():
            run_command(["git", "init"], repo_root, project_id)

        run_command(["git", "config", "user.email", "ai-devops@example.com"], repo_root, project_id)
        run_command(["git", "config", "user.name", "AI DevOps Bot"], repo_root, project_id)
        run_command(["git", "branch", "-M", "main"], repo_root, project_id)
        run_command(["git", "add", "."], repo_root, project_id)
        run_command(["git", "commit", "-m", "Initial automated deployment"], repo_root, project_id)
        run_optional_command(["git", "remote", "remove", "origin"], repo_root, project_id)
        run_command(["git", "remote", "add", "origin", authenticated_url], repo_root, project_id)
        run_command(["git", "push", "-u", "origin", "main"], repo_root, project_id)

        project["github_url"] = html_url
        set_status(project_id, "GitHub Pushed", 78)
        return jsonify({"ok": True, "project_id": project_id, "github_url": html_url})
    except Exception as exc:
        return handle_route_error(project_id if "project_id" in locals() else None, exc)


@app.route("/deploy", methods=["POST"])
@login_required
def deploy():
    try:
        data = request.get_json(silent=True) or {}
        project_id = data.get("project_id") or latest_project_id
        project = require_project(project_id)

        render_token = os.getenv("RENDER_API_KEY")
        render_owner_id = os.getenv("RENDER_OWNER_ID")
        if not render_token:
            raise ValueError("Missing RENDER_API_KEY environment variable.")
        render_owner_id = resolve_render_owner_id(render_token, render_owner_id, project_id)
        if not project.get("github_url"):
            raise ValueError("Push to GitHub before deploying to Render.")
        if project.get("project_type") == "Unknown":
            raise ValueError("Project type is unknown. Add requirements.txt or package.json.")

        service_name = data.get("service_name") or f"{clean_name(project['zip_name'])}-{project_id[:8]}"
        selected_root = project.get("selected_project_key") or "."
        set_status(project_id, "Deploying", 88)
        log(project_id, f"Deploy target folder: {selected_root}")

        payload = {
            "type": "web_service",
            "name": service_name,
            "ownerId": render_owner_id,
            "repo": project["github_url"],
            "branch": "main",
            "autoDeploy": "yes",
            "serviceDetails": {
                "env": "python" if project["project_type"] == "Flask/Python" else "node",
                "envSpecificDetails": {
                    "buildCommand": project["build_command"],
                    "startCommand": project["start_command"],
                },
                "plan": "free",
                "region": "oregon",
            },
        }
        if selected_root != ".":
            payload["rootDir"] = selected_root

        render_response = requests.post(
            f"{RENDER_API_URL}/services",
            headers=render_headers(render_token),
            json=payload,
            timeout=45,
        )
        if render_response.status_code not in (200, 201, 202):
            raise RuntimeError(clean_api_error(render_response, "Render service creation failed."))

        render_data = render_response.json()
        service = render_data.get("service", render_data)
        service_id = service.get("id")
        service_slug = service.get("serviceDetails", {}).get("url") or service.get("url")
        render_url = service_slug or f"https://dashboard.render.com/web/{service_id}"

        project["service_id"] = service_id
        project["render_url"] = render_url
        set_status(project_id, "Render Service Created", 92)
        return jsonify({"ok": True, "project_id": project_id, "render_url": render_url, "service_id": service_id})
    except Exception as exc:
        return handle_route_error(project_id if "project_id" in locals() else None, exc)


@app.route("/status", methods=["GET"])
@login_required
def status():
    project_id = request.args.get("project_id") or latest_project_id
    if not project_id or project_id not in projects:
        return jsonify({"ok": True, "status": None})
    refresh_render_status(project_id)
    return jsonify({"ok": True, "status": public_project(projects[project_id])})


@app.route("/config-status", methods=["GET"])
@login_required
def config_status():
    return jsonify(
        {
            "ok": True,
            "username": session.get("username", "User"),
            "checks": [
                {"label": "GitHub token", "ready": bool(os.getenv("GITHUB_TOKEN"))},
                {"label": "Render API key", "ready": bool(os.getenv("RENDER_API_KEY"))},
                {"label": "Render owner", "ready": bool(os.getenv("RENDER_OWNER_ID")), "optional": True},
                {"label": "User account", "ready": True},
            ],
        }
    )


def handle_route_error(project_id, exc):
    if project_id and project_id in projects:
        projects[project_id]["error"] = str(exc)
        projects[project_id]["status"] = "Error"
        log(project_id, f"Error: {exc}")
    return jsonify({"ok": False, "error": str(exc)}), 500


def clean_api_error(response, fallback):
    try:
        details = response.json()
    except ValueError:
        details = response.text
    return f"{fallback} HTTP {response.status_code}: {details}"


def public_project(project):
    visible = project.copy()
    visible.pop("zip_path", None)
    visible.pop("project_path", None)
    visible.pop("extract_base_path", None)
    visible["project_candidates"] = [
        {
            "key": candidate["key"],
            "label": candidate["label"],
            "relative_path": candidate["relative_path"],
        }
        for candidate in project.get("project_candidates", [])
    ]
    return visible


@app.route("/cleanup", methods=["POST"])
@login_required
def cleanup():
    """Optional helper for local demos. Not used by the frontend."""
    data = request.get_json(silent=True) or {}
    project_id = data.get("project_id")
    require_project(project_id)
    shutil.rmtree(EXTRACT_DIR / project_id, ignore_errors=True)
    projects.pop(project_id, None)
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(debug=True)
