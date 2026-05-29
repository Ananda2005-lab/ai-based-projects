from __future__ import annotations

from enum import Enum
from typing import Any, Literal
from uuid import uuid4

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    RUNNING = "running"
    WAITING_APPROVAL = "waiting_approval"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"


class EventKind(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    PLAN = "plan"
    TOOL = "tool"
    OBSERVATION = "observation"
    APPROVAL = "approval"
    ERROR = "error"


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)


class ChatResponse(BaseModel):
    task_id: str
    response: str
    status: TaskStatus


class ToolCall(BaseModel):
    tool_name: str
    arguments: dict[str, Any] = Field(default_factory=dict)
    risk_level: RiskLevel = RiskLevel.LOW
    requires_confirmation: bool = False


class ToolResult(BaseModel):
    ok: bool
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class TaskEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    kind: EventKind
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    status: TaskStatus = TaskStatus.RUNNING
    user_message: str
    events: list[TaskEvent] = Field(default_factory=list)
    pending_tool: ToolCall | None = None


class ApprovalRequest(BaseModel):
    decision: Literal["approve", "reject"]


class ApprovalResponse(BaseModel):
    task_id: str
    status: TaskStatus
    message: str


class VoiceTranscriptionResponse(BaseModel):
    text: str
    provider: str
    message: str
