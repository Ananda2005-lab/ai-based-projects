from __future__ import annotations

import base64
import io
import json
import os
import re
import shutil
import subprocess
import time
import webbrowser
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Callable

from app.models import RiskLevel, ToolResult


ToolHandler = Callable[[dict[str, Any]], ToolResult]


@dataclass(frozen=True)
class ToolDefinition:
    name: str
    description: str
    risk_level: RiskLevel
    handler: ToolHandler


@dataclass(frozen=True)
class InstalledApp:
    name: str
    app_id: str


def _pyautogui():
    try:
        import pyautogui  # type: ignore
    except Exception as exc:  # pragma: no cover - depends on desktop environment
        raise RuntimeError(
            "pyautogui is required for desktop automation. Install backend requirements first."
        ) from exc
    return pyautogui


def _type_text_into_active_field(text: str) -> None:
    pyautogui = _pyautogui()
    try:
        import pyperclip  # type: ignore

        pyperclip.copy(text)
        pyautogui.hotkey("ctrl", "v")
    except Exception:
        pyautogui.write(text, interval=0.01)


def media_control(arguments: dict[str, Any]) -> ToolResult:
    action = str(arguments.get("action", "")).strip().lower()
    key_map = {
        "play_pause": "playpause",
        "play": "playpause",
        "pause": "playpause",
        "next": "nexttrack",
        "previous": "prevtrack",
        "prev": "prevtrack",
        "stop": "stop",
    }
    key = key_map.get(action)
    if key is None:
        return ToolResult(ok=False, message=f"Unsupported media action: {action}")
    _pyautogui().press(key)
    return ToolResult(ok=True, message=f"Media action performed: {action}")


def volume_control(arguments: dict[str, Any]) -> ToolResult:
    action = str(arguments.get("action", "")).strip().lower()
    steps = int(arguments.get("steps", 5))
    key_map = {
        "up": "volumeup",
        "increase": "volumeup",
        "down": "volumedown",
        "decrease": "volumedown",
        "mute": "volumemute",
        "unmute": "volumemute",
    }
    key = key_map.get(action)
    if key is None:
        return ToolResult(ok=False, message=f"Unsupported volume action: {action}")
    repeat = 1 if key == "volumemute" else max(1, min(20, steps))
    for _ in range(repeat):
        _pyautogui().press(key)
    return ToolResult(ok=True, message=f"Volume action performed: {action}")


def window_control(arguments: dict[str, Any]) -> ToolResult:
    action = str(arguments.get("action", "")).strip().lower()
    pyautogui = _pyautogui()
    if action == "show_desktop":
        pyautogui.hotkey("win", "d")
    elif action == "switch":
        pyautogui.hotkey("alt", "tab")
    elif action == "close":
        pyautogui.hotkey("alt", "f4")
    elif action == "maximize":
        pyautogui.hotkey("win", "up")
    elif action == "minimize":
        pyautogui.hotkey("win", "down")
    else:
        return ToolResult(ok=False, message=f"Unsupported window action: {action}")
    return ToolResult(ok=True, message=f"Window action performed: {action}")


def device_power(arguments: dict[str, Any]) -> ToolResult:
    action = str(arguments.get("action", "")).strip().lower()
    if action == "lock":
        subprocess.Popen(["rundll32.exe", "user32.dll,LockWorkStation"], shell=False)
        return ToolResult(ok=True, message="Device locked.")
    if action == "sleep":
        subprocess.Popen(["rundll32.exe", "powrprof.dll,SetSuspendState", "0,1,0"], shell=False)
        return ToolResult(ok=True, message="Device sleep requested.")
    if action == "shutdown":
        subprocess.Popen(["shutdown", "/s", "/t", "10"], shell=False)
        return ToolResult(ok=True, message="Shutdown scheduled in 10 seconds.")
    if action == "restart":
        subprocess.Popen(["shutdown", "/r", "/t", "10"], shell=False)
        return ToolResult(ok=True, message="Restart scheduled in 10 seconds.")
    return ToolResult(ok=False, message=f"Unsupported power action: {action}")


def _normalize_app_name(value: str) -> str:
    text = value.lower()
    replacements = {
        "you tube": "youtube",
        "you-tube": "youtube",
        "yt music": "youtube music",
        "ytmusic": "youtube music",
        "vs code": "vscode",
        "visual studio code": "vscode",
        "v s code": "vscode",
        "crome": "chrome",
        "chrom": "chrome",
        "notpad": "notepad",
        "calculater": "calculator",
        "calci": "calculator",
    }
    for source, target in replacements.items():
        text = re.sub(rf"\b{re.escape(source)}\b", target, text)
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


@lru_cache(maxsize=1)
def _installed_start_apps() -> tuple[InstalledApp, ...]:
    try:
        completed = subprocess.run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-StartApps | Select-Object Name,AppID | ConvertTo-Json -Compress",
            ],
            capture_output=True,
            text=True,
            timeout=4,
            check=False,
        )
    except OSError:
        return ()
    if completed.returncode != 0 or not completed.stdout.strip():
        return ()
    try:
        payload = json.loads(completed.stdout)
    except json.JSONDecodeError:
        return ()
    rows = payload if isinstance(payload, list) else [payload]
    apps: list[InstalledApp] = []
    for row in rows:
        if isinstance(row, dict) and row.get("Name") and row.get("AppID"):
            apps.append(InstalledApp(name=str(row["Name"]), app_id=str(row["AppID"])))
    return tuple(apps)


def _find_installed_app(app_name: str) -> InstalledApp | None:
    wanted = _normalize_app_name(app_name)
    if not wanted:
        return None
    apps = _installed_start_apps()
    exact = [app for app in apps if _normalize_app_name(app.name) == wanted]
    if exact:
        return exact[0]
    contains = [app for app in apps if wanted in _normalize_app_name(app.name)]
    if contains:
        return contains[0]
    wanted_words = set(wanted.split())
    if not wanted_words:
        return None
    scored = []
    for app in apps:
        app_words = set(_normalize_app_name(app.name).split())
        score = len(wanted_words & app_words)
        if score:
            scored.append((score, app))
    if not scored:
        return None
    scored.sort(key=lambda item: item[0], reverse=True)
    return scored[0][1]


def _open_installed_app(app_name: str) -> ToolResult | None:
    installed = _find_installed_app(app_name)
    if installed is None:
        return None
    subprocess.Popen(["explorer.exe", f"shell:AppsFolder\\{installed.app_id}"], shell=False)
    return ToolResult(
        ok=True,
        message=f"Opened app: {installed.name}",
        data={"app_id": installed.app_id, "matched_name": installed.name},
    )


def _app_path_from_registry(executable: str) -> str | None:
    try:
        import winreg
    except ImportError:
        return None

    subkey = rf"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\{executable}"
    roots = (winreg.HKEY_CURRENT_USER, winreg.HKEY_LOCAL_MACHINE)
    access_modes = (winreg.KEY_READ, winreg.KEY_READ | winreg.KEY_WOW64_32KEY, winreg.KEY_READ | winreg.KEY_WOW64_64KEY)
    for root in roots:
        for access in access_modes:
            try:
                with winreg.OpenKey(root, subkey, 0, access) as key:
                    value, _ = winreg.QueryValueEx(key, "")
                    if value and Path(value).exists():
                        return value
            except OSError:
                continue
    return None


def _candidate_app_paths(app_name: str) -> list[str]:
    normalized = app_name.strip().lower()
    local_app_data = os.environ.get("LOCALAPPDATA", "")
    aliases = {
        "chrome": [
            "chrome.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            str(Path(local_app_data) / "Google" / "Chrome" / "Application" / "chrome.exe"),
        ],
        "google chrome": [
            "chrome.exe",
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            str(Path(local_app_data) / "Google" / "Chrome" / "Application" / "chrome.exe"),
        ],
        "edge": [
            "msedge.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ],
        "microsoft edge": [
            "msedge.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        ],
        "notepad": ["notepad.exe"],
        "calculator": ["calc.exe"],
        "calc": ["calc.exe"],
        "file explorer": ["explorer.exe"],
        "explorer": ["explorer.exe"],
        "cmd": ["cmd.exe"],
        "powershell": ["powershell.exe"],
        "vs code": ["code.cmd", "code.exe"],
        "vscode": ["code.cmd", "code.exe"],
        "visual studio code": ["code.cmd", "code.exe"],
    }
    candidates = aliases.get(normalized, [app_name])
    executable = candidates[0] if candidates else app_name
    registry_path = _app_path_from_registry(executable)
    path_result = shutil.which(executable)
    discovered = [value for value in (registry_path, path_result) if value]
    return [*discovered, *candidates]


def _open_known_browser_alias(app_name: str) -> bool:
    normalized = app_name.strip().lower()
    browser_commands = {
        "chrome": "chrome",
        "google chrome": "chrome",
        "edge": "msedge",
        "microsoft edge": "msedge",
    }
    command = browser_commands.get(normalized)
    if command is None:
        return False
    subprocess.Popen(["cmd", "/c", "start", "", command], shell=False)
    return True


def open_app(arguments: dict[str, Any]) -> ToolResult:
    app_name = str(arguments.get("app_name", "")).strip()
    if not app_name:
        return ToolResult(ok=False, message="Missing app_name.")

    installed_result = _open_installed_app(app_name)
    if installed_result is not None:
        return installed_result

    errors: list[str] = []
    for candidate in _candidate_app_paths(app_name):
        candidate_path = Path(candidate)
        if candidate_path.is_absolute() and not candidate_path.exists():
            errors.append(f"Not found: {candidate}")
            continue
        try:
            subprocess.Popen([candidate], shell=False)
            return ToolResult(ok=True, message=f"Opened app: {app_name}")
        except OSError as exc:
            errors.append(str(exc))

    try:
        if _open_known_browser_alias(app_name):
            return ToolResult(ok=True, message=f"Opened app: {app_name}")
    except OSError as exc:
        errors.append(str(exc))

    return ToolResult(
        ok=False,
        message=f"Could not open app: {app_name}",
        data={"errors": errors},
    )


def play_youtube_song(arguments: dict[str, Any]) -> ToolResult:
    query = str(arguments.get("query", "")).strip()
    if not query:
        return ToolResult(ok=False, message="Missing song query.")

    app_result = _open_installed_app("YouTube Music") or _open_installed_app("YouTube")
    if app_result is None:
        url = f"https://music.youtube.com/search?q={query.replace(' ', '+')}"
        webbrowser.open(url)
        return ToolResult(
            ok=True,
            message=f"YouTube app was not found, opened YouTube Music search: {query}",
            data={"url": url, "fallback": "browser"},
        )

    pyautogui = _pyautogui()
    time.sleep(float(arguments.get("launch_wait", 4.5)))
    pyautogui.hotkey("win", "up")
    time.sleep(0.35)
    pyautogui.press("/")
    time.sleep(0.35)
    pyautogui.hotkey("ctrl", "a")
    time.sleep(0.15)
    _type_text_into_active_field(query)
    pyautogui.press("enter")
    time.sleep(float(arguments.get("search_wait", 3.2)))
    width, height = pyautogui.size()
    result_x = int(width * float(arguments.get("result_x_ratio", 0.34)))
    result_y = int(height * float(arguments.get("result_y_ratio", 0.38)))
    pyautogui.doubleClick(result_x, result_y, interval=0.12)
    time.sleep(0.4)
    pyautogui.press("enter")
    time.sleep(0.25)
    pyautogui.press("space")
    return ToolResult(
        ok=True,
        message=f"Opened YouTube app, searched, and clicked the first result: {query}",
        data={
            "query": query,
            "app": app_result.data,
            "search_shortcut": "/",
            "result_click": {"x": result_x, "y": result_y},
        },
    )


def play_spotify_song(arguments: dict[str, Any]) -> ToolResult:
    query = str(arguments.get("query", "")).strip()
    if not query:
        return ToolResult(ok=False, message="Missing song query.")

    encoded = query.replace(" ", "%20")
    subprocess.Popen(["cmd", "/c", "start", "", f"spotify:search:{encoded}"], shell=False)
    pyautogui = _pyautogui()
    time.sleep(float(arguments.get("launch_wait", 4.8)))
    pyautogui.hotkey("win", "up")
    time.sleep(0.8)
    width, height = pyautogui.size()
    result_points = [
        (
            int(width * float(arguments.get("result_x_ratio", 0.31))),
            int(height * float(arguments.get("result_y_ratio", 0.44))),
        ),
        (int(width * 0.24), int(height * 0.36)),
        (int(width * 0.42), int(height * 0.50)),
    ]
    for x, y in result_points:
        pyautogui.doubleClick(x, y, interval=0.12)
        time.sleep(0.55)
    pyautogui.press("enter")
    time.sleep(0.6)
    pyautogui.press("space")
    time.sleep(0.3)
    pyautogui.press("enter")
    return ToolResult(
        ok=True,
        message=f"Opened Spotify search and clicked likely song results: {query}",
        data={"query": query, "uri": f"spotify:search:{encoded}", "result_clicks": result_points},
    )


def open_url(arguments: dict[str, Any]) -> ToolResult:
    url = str(arguments.get("url", "")).strip()
    if not url:
        return ToolResult(ok=False, message="Missing url.")
    webbrowser.open(url)
    return ToolResult(ok=True, message=f"Opened URL: {url}")


def search_web(arguments: dict[str, Any]) -> ToolResult:
    query = str(arguments.get("query", "")).strip()
    if not query:
        return ToolResult(ok=False, message="Missing search query.")
    encoded = query.replace(" ", "+")
    url = f"https://www.google.com/search?q={encoded}"
    webbrowser.open(url)
    return ToolResult(ok=True, message=f"Searched the web for: {query}", data={"url": url})


def create_folder(arguments: dict[str, Any]) -> ToolResult:
    raw_path = str(arguments.get("path", "")).strip()
    if not raw_path:
        return ToolResult(ok=False, message="Missing folder path.")
    path = Path(raw_path).expanduser()
    path.mkdir(parents=True, exist_ok=True)
    return ToolResult(ok=True, message=f"Created folder: {path}", data={"path": str(path)})


def write_text_file(arguments: dict[str, Any]) -> ToolResult:
    raw_path = str(arguments.get("path", "")).strip()
    text = str(arguments.get("text", ""))
    if not raw_path:
        return ToolResult(ok=False, message="Missing file path.")
    path = Path(raw_path).expanduser()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return ToolResult(ok=True, message=f"Wrote text file: {path}", data={"path": str(path)})


def _safe_filename(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9._ -]+", "", value).strip()
    return cleaned or "assistant-note"


def write_desktop_note(arguments: dict[str, Any]) -> ToolResult:
    title = _safe_filename(str(arguments.get("title", "assistant-note")))
    text = str(arguments.get("text", ""))
    desktop = Path.home() / "Desktop"
    path = desktop / f"{title}.txt"
    path.write_text(text, encoding="utf-8")
    return ToolResult(ok=True, message=f"Created desktop note: {path}", data={"path": str(path)})


def type_text(arguments: dict[str, Any]) -> ToolResult:
    text = str(arguments.get("text", ""))
    if not text:
        return ToolResult(ok=False, message="Missing text.")
    _type_text_into_active_field(text)
    return ToolResult(ok=True, message="Typed text into the active field.")


def press_hotkey(arguments: dict[str, Any]) -> ToolResult:
    keys = arguments.get("keys", [])
    if not isinstance(keys, list) or not keys:
        return ToolResult(ok=False, message="Missing keys list.")
    _pyautogui().hotkey(*[str(key) for key in keys])
    return ToolResult(ok=True, message=f"Pressed hotkey: {'+'.join(keys)}")


def click(arguments: dict[str, Any]) -> ToolResult:
    x = arguments.get("x")
    y = arguments.get("y")
    if x is None or y is None:
        return ToolResult(ok=False, message="Missing x/y coordinates.")
    _pyautogui().click(int(x), int(y))
    return ToolResult(ok=True, message=f"Clicked at {x}, {y}.")


def screenshot(arguments: dict[str, Any]) -> ToolResult:
    image = _pyautogui().screenshot()
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return ToolResult(ok=True, message="Captured screenshot.", data={"image_base64": encoded})


def list_files(arguments: dict[str, Any]) -> ToolResult:
    raw_path = str(arguments.get("path", "."))
    path = Path(raw_path).expanduser()
    if not path.exists():
        return ToolResult(ok=False, message=f"Path does not exist: {path}")
    if not path.is_dir():
        return ToolResult(ok=False, message=f"Path is not a directory: {path}")
    files = [item.name for item in path.iterdir()]
    return ToolResult(ok=True, message=f"Listed {len(files)} files.", data={"files": files})


def delete_file(arguments: dict[str, Any]) -> ToolResult:
    path = Path(str(arguments.get("path", ""))).expanduser()
    if not path.exists():
        return ToolResult(ok=False, message=f"File does not exist: {path}")
    if path.is_dir():
        return ToolResult(ok=False, message="Directory deletion is not supported in v1.")
    path.unlink()
    return ToolResult(ok=True, message=f"Deleted file: {path}")


TOOLS: dict[str, ToolDefinition] = {
    "open_app": ToolDefinition("open_app", "Open a Windows app or executable.", RiskLevel.LOW, open_app),
    "media_control": ToolDefinition("media_control", "Control media playback.", RiskLevel.LOW, media_control),
    "volume_control": ToolDefinition("volume_control", "Control system volume.", RiskLevel.LOW, volume_control),
    "window_control": ToolDefinition("window_control", "Control active windows.", RiskLevel.MEDIUM, window_control),
    "device_power": ToolDefinition("device_power", "Lock, sleep, restart, or shut down the device.", RiskLevel.HIGH, device_power),
    "play_youtube_song": ToolDefinition("play_youtube_song", "Open YouTube app and play or search a song.", RiskLevel.MEDIUM, play_youtube_song),
    "play_spotify_song": ToolDefinition("play_spotify_song", "Open Spotify and play or search a song.", RiskLevel.MEDIUM, play_spotify_song),
    "open_url": ToolDefinition("open_url", "Open a URL in the default browser.", RiskLevel.LOW, open_url),
    "search_web": ToolDefinition("search_web", "Search the web in the default browser.", RiskLevel.LOW, search_web),
    "create_folder": ToolDefinition("create_folder", "Create a folder.", RiskLevel.LOW, create_folder),
    "write_text_file": ToolDefinition("write_text_file", "Write a text file.", RiskLevel.MEDIUM, write_text_file),
    "write_desktop_note": ToolDefinition("write_desktop_note", "Create a text note on the Desktop.", RiskLevel.LOW, write_desktop_note),
    "type_text": ToolDefinition("type_text", "Type text into the active field.", RiskLevel.LOW, type_text),
    "press_hotkey": ToolDefinition("press_hotkey", "Press a keyboard shortcut.", RiskLevel.LOW, press_hotkey),
    "click": ToolDefinition("click", "Click screen coordinates.", RiskLevel.MEDIUM, click),
    "screenshot": ToolDefinition("screenshot", "Capture the current screen.", RiskLevel.LOW, screenshot),
    "list_files": ToolDefinition("list_files", "List files in a folder.", RiskLevel.LOW, list_files),
    "delete_file": ToolDefinition("delete_file", "Delete a single file after approval.", RiskLevel.HIGH, delete_file),
}


def get_tool(name: str) -> ToolDefinition | None:
    return TOOLS.get(name)
