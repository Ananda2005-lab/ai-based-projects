from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import quote_plus

import httpx

from app.agent.safety import classify_text_risk
from app.agent.tools import TOOLS
from app.models import RiskLevel, ToolCall


OLLAMA_URL = "http://localhost:11434/api/chat"
DEFAULT_MODEL = "llama3.1"


SYSTEM_PROMPT = """You are a local PC automation assistant.
Return JSON only with this shape:
{"response":"short user-facing reply","tool_calls":[{"tool_name":"open_app","arguments":{"app_name":"notepad"}}, ...]}
Available tools:
open_app(app_name), media_control(action), volume_control(action,steps), window_control(action), device_power(action), play_youtube_song(query), play_spotify_song(query), open_url(url), search_web(query), create_folder(path), write_text_file(path,text), write_desktop_note(title,text), type_text(text), press_hotkey(keys), click(x,y), screenshot(), list_files(path), delete_file(path).
Use no tool if a normal chat answer is enough.
Dangerous actions must still be represented as tool calls; the backend will request approval.
Prefer open_app for installed apps. Prefer play_youtube_song when the user asks to play a song/video.
"""


class OllamaClient:
    def __init__(self, model: str = DEFAULT_MODEL, url: str = OLLAMA_URL) -> None:
        self.model = model
        self.url = url

    async def plan(self, message: str) -> tuple[str, list[ToolCall]]:
        deterministic = self._deterministic_plan(message)
        if deterministic is not None:
            return deterministic
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.post(
                    self.url,
                    json={
                        "model": self.model,
                        "stream": False,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": message},
                        ],
                    },
                )
                response.raise_for_status()
                content = response.json()["message"]["content"]
                parsed = self._parse_plan(content, message)
                return self._repair_plan(parsed, message)
        except Exception:
            return self._fallback_plan(message)

    def _normalized_text(self, message: str) -> str:
        text = message.lower()
        replacements = {
            "यूट्यूब म्यूजिक": "youtube music",
            "यूट्यूब": "youtube",
            "गाना": "song",
            "बजाओ": "play",
            "चलाओ": "play",
            "खोलो": "open",
            "खोल": "open",
            "youtube இசை": "youtube music",
            "யூடியூப் மியூசிக்": "youtube music",
            "யூடியூப்": "youtube",
            "பாடல்": "song",
            "இசை": "music",
            "ப்ளே": "play",
            "youtube సంగీతం": "youtube music",
            "యూట్యూబ్ మ్యూజిక్": "youtube music",
            "యూట్యూబ్": "youtube",
            "పాట": "song",
            "ప్లే": "play",
            "ୟୁଟ୍ୟୁବ ମ୍ୟୁଜିକ": "youtube music",
            "ୟୁଟ୍ୟୁବ": "youtube",
            "ଗୀତ": "song",
            "you tube": "youtube",
            "you-tube": "youtube",
            "youtub": "youtube",
            "yt": "youtube",
            "ytmusic": "youtube music",
            "you tube music": "youtube music",
            "vs code": "vscode",
            "visual studio code": "vscode",
            "v s code": "vscode",
            "gogle": "google",
            "crome": "chrome",
            "chrom": "chrome",
            "notpad": "notepad",
            "calci": "calculator",
            "calculater": "calculator",
            "whats app": "whatsapp",
            "awaz": "volume",
            "volume badhao": "volume up",
            "volume kam": "volume down",
            "aawaz badhao": "volume up",
            "aawaz kam": "volume down",
            "band karo": "close",
            "desktop dikhao": "show desktop",
            "screen dikhao": "show desktop",
            "agla gana": "next song",
            "pichla gana": "previous song",
            "rok do": "pause",
            "chalu karo": "play",
        }
        for source, target in replacements.items():
            text = re.sub(rf"\b{re.escape(source)}\b", target, text)
        return re.sub(r"\s+", " ", text).strip()

    def _youtube_query(self, message: str) -> str:
        cleaned = self._normalized_text(message)
        cleaned = re.sub(
            r"\b(open|play|search|find|from|on|in|music|song|video|youtube|spotify|par|pe|mein|me|se|karo|karna|please)\b",
            " ",
            cleaned,
        )
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned or "music"

    def _song_query(self, message: str, service: str) -> str:
        cleaned = self._normalized_text(message)
        cleaned = re.sub(
            rf"\b(open|play|search|find|from|on|in|music|song|video|{service}|par|pe|mein|me|se|karo|karna|please)\b",
            " ",
            cleaned,
        )
        cleaned = re.sub(r"\s+", " ", cleaned).strip()
        return cleaned or "music"

    def _youtube_search_url(self, message: str) -> str:
        query = self._youtube_query(message)
        return f"https://www.youtube.com/results?search_query={quote_plus(query)}"

    def _deterministic_plan(self, message: str) -> tuple[str, list[ToolCall]] | None:
        lowered = self._normalized_text(message)
        if "volume" in lowered:
            if any(word in lowered for word in ("up", "increase", "badhao", "raise", "louder")):
                return "Increasing volume.", [ToolCall(tool_name="volume_control", arguments={"action": "up", "steps": 5})]
            if any(word in lowered for word in ("down", "decrease", "kam", "lower")):
                return "Decreasing volume.", [ToolCall(tool_name="volume_control", arguments={"action": "down", "steps": 5})]
            if "mute" in lowered:
                return "Muting volume.", [ToolCall(tool_name="volume_control", arguments={"action": "mute"})]
        if any(phrase in lowered for phrase in ("pause", "rok do")):
            return "Toggling media playback.", [ToolCall(tool_name="media_control", arguments={"action": "pause"})]
        if re.search(r"\b(play|resume|chalu)\b", lowered) and not any(service in lowered for service in ("youtube", "spotify")):
            return "Toggling media playback.", [ToolCall(tool_name="media_control", arguments={"action": "play"})]
        if any(phrase in lowered for phrase in ("next song", "next track", "agla gana")):
            return "Skipping to next track.", [ToolCall(tool_name="media_control", arguments={"action": "next"})]
        if any(phrase in lowered for phrase in ("previous song", "previous track", "pichla gana")):
            return "Going to previous track.", [ToolCall(tool_name="media_control", arguments={"action": "previous"})]
        if any(phrase in lowered for phrase in ("show desktop", "desktop dikhao", "minimize all")):
            return "Showing desktop.", [ToolCall(tool_name="window_control", arguments={"action": "show_desktop"})]
        if any(phrase in lowered for phrase in ("switch window", "alt tab", "next window")):
            return "Switching window.", [ToolCall(tool_name="window_control", arguments={"action": "switch"})]
        if any(phrase in lowered for phrase in ("close window", "close app", "band karo")):
            return "Closing active window.", [ToolCall(tool_name="window_control", arguments={"action": "close"})]
        if any(phrase in lowered for phrase in ("lock device", "lock laptop", "lock screen")):
            return "Locking device.", [ToolCall(tool_name="device_power", arguments={"action": "lock"}, risk_level=RiskLevel.HIGH)]
        if any(phrase in lowered for phrase in ("shutdown", "shut down", "restart", "sleep")):
            action = "restart" if "restart" in lowered else "sleep" if "sleep" in lowered else "shutdown"
            return f"{action.title()} requires approval.", [ToolCall(tool_name="device_power", arguments={"action": action}, risk_level=RiskLevel.HIGH)]
        if "settings" in lowered:
            return "Opening Settings.", [ToolCall(tool_name="open_app", arguments={"app_name": "settings"})]
        if "spotify" in lowered:
            if any(word in lowered for word in ("play", "song", "search", "find", "bajao", "chalao")):
                return (
                    "Opening Spotify and playing/searching that song.",
                    [ToolCall(tool_name="play_spotify_song", arguments={"query": self._song_query(message, "spotify")})],
                )
            return "Opening Spotify.", [ToolCall(tool_name="open_app", arguments={"app_name": "spotify"})]
        if "youtube music" in lowered:
            if any(word in lowered for word in ("play", "song", "search", "find", "bajao", "chalao")):
                return (
                    "Opening YouTube app and playing/searching that song.",
                    [ToolCall(tool_name="play_youtube_song", arguments={"query": self._youtube_query(message)})],
                )
            return "Opening YouTube Music.", [ToolCall(tool_name="open_app", arguments={"app_name": "YouTube Music"})]
        if "youtube" in lowered:
            if any(word in lowered for word in ("play", "song", "search", "find", "bajao", "chalao")):
                return (
                    "Opening YouTube app and playing/searching.",
                    [ToolCall(tool_name="play_youtube_song", arguments={"query": self._youtube_query(message)})],
                )
            return "Opening YouTube app.", [ToolCall(tool_name="open_app", arguments={"app_name": "YouTube"})]
        if "gmail" in lowered:
            return "Opening Gmail.", [ToolCall(tool_name="open_url", arguments={"url": "https://mail.google.com"})]
        if "whatsapp" in lowered:
            return "Opening WhatsApp Web.", [ToolCall(tool_name="open_url", arguments={"url": "https://web.whatsapp.com"})]
        if "vscode" in lowered:
            return "Opening Visual Studio Code.", [ToolCall(tool_name="open_app", arguments={"app_name": "vscode"})]
        open_match = re.match(r"^(?:open|launch|start|run|khol|kholo)\s+(.+)$", lowered)
        if open_match:
            app_name = open_match.group(1).strip()
            if app_name:
                return f"Opening {app_name}.", [ToolCall(tool_name="open_app", arguments={"app_name": app_name})]
        return None

    def _parse_plan(self, content: str, original_message: str) -> tuple[str, list[ToolCall]]:
        payload = self._extract_json(content)
        response = str(payload.get("response", "I can help with that."))
        tool_calls: list[ToolCall] = []
        for raw_call in payload.get("tool_calls", []):
            if not isinstance(raw_call, dict):
                continue
            name = str(raw_call.get("tool_name", ""))
            if name not in TOOLS:
                continue
            definition = TOOLS[name]
            risk = definition.risk_level
            text_risk = classify_text_risk(original_message)
            if text_risk == RiskLevel.HIGH:
                risk = RiskLevel.HIGH
            tool_calls.append(
                ToolCall(
                    tool_name=name,
                    arguments=dict(raw_call.get("arguments", {})),
                    risk_level=risk,
                )
            )
        return response, tool_calls

    def _repair_plan(
        self,
        parsed: tuple[str, list[ToolCall]],
        original_message: str,
    ) -> tuple[str, list[ToolCall]]:
        response, tool_calls = parsed
        repaired: list[ToolCall] = []
        for call in tool_calls:
            app_name = str(call.arguments.get("app_name", "")).lower()
            combined = self._normalized_text(f"{original_message} {app_name}")
            if call.tool_name == "open_app" and "youtube music" in combined:
                if any(word in combined for word in ("play", "song", "search", "find")):
                    repaired.append(ToolCall(tool_name="play_youtube_song", arguments={"query": self._youtube_query(original_message)}))
                else:
                    repaired.append(ToolCall(tool_name="open_app", arguments={"app_name": "YouTube Music"}))
                continue
            if call.tool_name == "open_app" and "youtube" in combined:
                if any(word in combined for word in ("play", "song", "search", "find")):
                    repaired.append(ToolCall(tool_name="play_youtube_song", arguments={"query": self._youtube_query(original_message)}))
                else:
                    repaired.append(ToolCall(tool_name="open_app", arguments={"app_name": "YouTube"}))
                continue
            if call.tool_name == "open_app" and "gmail" in combined:
                repaired.append(ToolCall(tool_name="open_url", arguments={"url": "https://mail.google.com"}))
                continue
            if call.tool_name == "open_app" and "whatsapp" in combined:
                repaired.append(ToolCall(tool_name="open_url", arguments={"url": "https://web.whatsapp.com"}))
                continue
            if call.tool_name == "open_app" and "vscode" in combined:
                call.arguments["app_name"] = "vscode"
            if call.tool_name == "open_app" and "spotify" in combined:
                if any(word in combined for word in ("play", "song", "search", "find")):
                    repaired.append(ToolCall(tool_name="play_spotify_song", arguments={"query": self._song_query(original_message, "spotify")}))
                    continue
                call.arguments["app_name"] = "spotify"
            repaired.append(call)
        return response, repaired


    def _extract_json(self, content: str) -> dict[str, Any]:
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", content, flags=re.DOTALL)
            if not match:
                raise
            return json.loads(match.group(0))

    def _fallback_plan(self, message: str) -> tuple[str, list[ToolCall]]:
        deterministic = self._deterministic_plan(message)
        if deterministic is not None:
            return deterministic
        lowered = self._normalized_text(message)
        desktop = str(__import__("pathlib").Path.home() / "Desktop")
        if any(word in lowered for word in ("search", "google", "find on web", "internet par")):
            query = re.sub(r"^(search|google|find on web|internet par)\s+", "", message, flags=re.IGNORECASE).strip()
            query = query or message
            return f"Searching for: {query}", [ToolCall(tool_name="search_web", arguments={"query": query})]
        if "youtube" in lowered:
            return "Opening YouTube.", [ToolCall(tool_name="open_url", arguments={"url": "https://www.youtube.com"})]
        if "gmail" in lowered:
            return "Opening Gmail.", [ToolCall(tool_name="open_url", arguments={"url": "https://mail.google.com"})]
        if "whatsapp" in lowered:
            return "Opening WhatsApp Web.", [ToolCall(tool_name="open_url", arguments={"url": "https://web.whatsapp.com"})]
        if "create folder" in lowered or "folder banao" in lowered:
            folder_name = "Assistant Folder"
            match = re.search(r"(?:called|named|naam|name)\s+([\w .-]+)", message, flags=re.IGNORECASE)
            if match:
                folder_name = match.group(1).strip()
            return (
                f"Creating folder on Desktop: {folder_name}",
                [ToolCall(tool_name="create_folder", arguments={"path": f"{desktop}\\{folder_name}"})],
            )
        if "note" in lowered or "txt" in lowered:
            text = message
            match = re.search(r"(?:note|txt)(?:\s+likho|\s+write)?[:\- ]+(.*)", message, flags=re.IGNORECASE)
            if match:
                text = match.group(1).strip()
            return (
                "Creating a note on your Desktop.",
                [ToolCall(tool_name="write_desktop_note", arguments={"title": "assistant-note", "text": text})],
            )
        if "list" in lowered and ("desktop" in lowered or "files" in lowered):
            return "Listing Desktop files.", [ToolCall(tool_name="list_files", arguments={"path": desktop})]
        if "notepad" in lowered:
            return "Opening Notepad.", [ToolCall(tool_name="open_app", arguments={"app_name": "notepad"})]
        if "edge" in lowered:
            return "Opening Edge.", [ToolCall(tool_name="open_app", arguments={"app_name": "edge"})]
        if "calculator" in lowered or "calc" in lowered:
            return "Opening Calculator.", [ToolCall(tool_name="open_app", arguments={"app_name": "calculator"})]
        if "explorer" in lowered or "file manager" in lowered:
            return "Opening File Explorer.", [ToolCall(tool_name="open_app", arguments={"app_name": "explorer"})]
        if "chrome" in lowered:
            return "Opening Chrome.", [ToolCall(tool_name="open_app", arguments={"app_name": "chrome"})]
        if "screenshot" in lowered:
            return "Capturing a screenshot.", [ToolCall(tool_name="screenshot")]
        if "delete" in lowered:
            return (
                "This looks risky. I need approval before deleting anything.",
                [ToolCall(tool_name="delete_file", arguments={"path": ""}, risk_level=RiskLevel.HIGH)],
            )
        return "I am ready. Tell me the exact PC task you want me to perform.", []
