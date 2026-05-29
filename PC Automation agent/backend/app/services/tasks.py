from __future__ import annotations

from app.agent.safety import requires_confirmation
from app.agent.tools import get_tool
from app.models import EventKind, Task, TaskEvent, TaskStatus, ToolCall, ToolResult


class TaskStore:
    def __init__(self) -> None:
        self._tasks: dict[str, Task] = {}

    def create(self, user_message: str) -> Task:
        task = Task(user_message=user_message)
        task.events.append(TaskEvent(kind=EventKind.USER, message=user_message))
        self._tasks[task.id] = task
        return task

    def get(self, task_id: str) -> Task | None:
        return self._tasks.get(task_id)

    def add_event(self, task: Task, kind: EventKind, message: str, data: dict | None = None) -> None:
        task.events.append(TaskEvent(kind=kind, message=message, data=data or {}))


class ToolExecutor:
    def __init__(self, store: TaskStore) -> None:
        self.store = store

    def run_or_pause(self, task: Task, tool_call: ToolCall) -> ToolResult | None:
        tool = get_tool(tool_call.tool_name)
        if tool is None:
            result = ToolResult(ok=False, message=f"Unknown tool: {tool_call.tool_name}")
            self.store.add_event(task, EventKind.ERROR, result.message)
            return result

        tool_call.risk_level = tool_call.risk_level or tool.risk_level
        tool_call.requires_confirmation = requires_confirmation(tool_call)
        self.store.add_event(
            task,
            EventKind.TOOL,
            f"Prepared tool: {tool_call.tool_name}",
            tool_call.model_dump(),
        )

        if tool_call.requires_confirmation:
            task.status = TaskStatus.WAITING_APPROVAL
            task.pending_tool = tool_call
            self.store.add_event(
                task,
                EventKind.APPROVAL,
                f"Approval required for {tool_call.tool_name}.",
                tool_call.model_dump(),
            )
            return None

        return self.execute(task, tool_call)

    def execute(self, task: Task, tool_call: ToolCall) -> ToolResult:
        tool = get_tool(tool_call.tool_name)
        if tool is None:
            return ToolResult(ok=False, message=f"Unknown tool: {tool_call.tool_name}")
        try:
            result = tool.handler(tool_call.arguments)
        except Exception as exc:
            result = ToolResult(ok=False, message=str(exc))
        event_kind = EventKind.OBSERVATION if result.ok else EventKind.ERROR
        self.store.add_event(task, event_kind, result.message, result.data)
        if not result.ok:
            task.status = TaskStatus.FAILED
        return result
