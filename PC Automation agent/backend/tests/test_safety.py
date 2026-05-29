from app.agent.safety import classify_text_risk, requires_confirmation
from app.models import RiskLevel, ToolCall


def test_low_risk_text_is_low():
    assert classify_text_risk("open notepad") == RiskLevel.LOW


def test_delete_text_is_high_risk():
    assert classify_text_risk("delete this file") == RiskLevel.HIGH


def test_high_risk_tool_requires_confirmation():
    call = ToolCall(tool_name="delete_file", risk_level=RiskLevel.HIGH)
    assert requires_confirmation(call) is True


def test_low_risk_tool_does_not_require_confirmation():
    call = ToolCall(tool_name="open_app", risk_level=RiskLevel.LOW)
    assert requires_confirmation(call) is False
