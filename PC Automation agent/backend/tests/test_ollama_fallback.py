import asyncio

from app.services.ollama import OllamaClient


def test_fallback_plans_notepad_when_ollama_unavailable():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("open notepad"))
    assert "Notepad" in response
    assert calls[0].tool_name == "open_app"
    assert calls[0].arguments["app_name"] == "notepad"


def test_fallback_delete_requires_delete_tool():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("delete this file"))
    assert "approval" in response.lower()
    assert calls[0].tool_name == "delete_file"


def test_typo_youtube_opens_url_not_app():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("open youtub"))
    assert "youtube" in response.lower()
    assert calls[0].tool_name == "open_app"
    assert calls[0].arguments["app_name"] == "YouTube"


def test_yt_music_play_searches_youtube():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("play saiyaara song from yt music"))
    assert "youtube" in response.lower()
    assert calls[0].tool_name == "play_youtube_song"
    assert calls[0].arguments["query"] == "saiyaara"


def test_vscode_alias_opens_app():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("open vscode"))
    assert "visual studio code" in response.lower()
    assert calls[0].tool_name == "open_app"
    assert calls[0].arguments["app_name"] == "vscode"


def test_repairs_model_open_app_youtube_misroute():
    client = OllamaClient()
    response, calls = client._repair_plan(
        (
            "Opening YouTube",
            [__import__("app.models", fromlist=["ToolCall"]).ToolCall(tool_name="open_app", arguments={"app_name": "YouTube"})],
        ),
        "open YouTube",
    )
    assert response == "Opening YouTube"
    assert calls[0].tool_name == "open_app"
    assert calls[0].arguments["app_name"] == "YouTube"


def test_generic_open_command_routes_to_app_without_ollama():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("open spotify"))
    assert response == "Opening spotify."
    assert calls[0].tool_name == "open_app"
    assert calls[0].arguments["app_name"] == "spotify"


def test_spotify_song_routes_to_spotify_playback():
    client = OllamaClient(url="http://127.0.0.1:1/unavailable")
    response, calls = asyncio.run(client.plan("play humnava mere song from spotify"))
    assert "spotify" in response.lower()
    assert calls[0].tool_name == "play_spotify_song"
    assert calls[0].arguments["query"] == "humnava mere"
