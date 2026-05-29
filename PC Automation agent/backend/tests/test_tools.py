from app.agent.tools import TOOLS
from app.models import RiskLevel


def test_tool_registry_contains_v1_tools():
    expected = {
        "open_app",
        "play_youtube_song",
        "open_url",
        "type_text",
        "press_hotkey",
        "click",
        "screenshot",
        "list_files",
        "delete_file",
    }
    assert expected.issubset(TOOLS)


def test_delete_file_is_high_risk():
    assert TOOLS["delete_file"].risk_level == RiskLevel.HIGH


def test_open_app_is_low_risk():
    assert TOOLS["open_app"].risk_level == RiskLevel.LOW


def test_play_youtube_song_is_medium_risk():
    assert TOOLS["play_youtube_song"].risk_level == RiskLevel.MEDIUM
