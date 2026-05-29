from __future__ import annotations

from app.models import RiskLevel, ToolCall


RISKY_TOOL_NAMES = {
    "delete_file",
    "send_message",
    "submit_form",
    "install_software",
    "uninstall_software",
    "run_shell",
    "change_system_setting",
    "device_power",
}

RISKY_KEYWORDS = {
    "delete",
    "remove",
    "send",
    "pay",
    "purchase",
    "buy",
    "install",
    "uninstall",
    "submit",
    "password",
    "settings",
    "registry",
    "shutdown",
    "restart",
    "sleep",
}


def classify_text_risk(text: str) -> RiskLevel:
    lowered = text.lower()
    if any(keyword in lowered for keyword in RISKY_KEYWORDS):
        return RiskLevel.HIGH
    return RiskLevel.LOW


def requires_confirmation(tool_call: ToolCall) -> bool:
    if tool_call.tool_name in RISKY_TOOL_NAMES:
        return True
    if tool_call.risk_level == RiskLevel.HIGH:
        return True
    return False
