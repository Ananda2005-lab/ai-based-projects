from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.models import (
    ApprovalRequest,
    ApprovalResponse,
    ChatRequest,
    ChatResponse,
    EventKind,
    TaskStatus,
    VoiceTranscriptionResponse,
)
from app.services.ollama import OllamaClient
from app.services.tasks import TaskStore, ToolExecutor


app = FastAPI(title="Local AI Assistant Agent", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

task_store = TaskStore()
ollama = OllamaClient()
executor = ToolExecutor(task_store)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    task = task_store.create(request.message)
    response_text, tool_calls = await ollama.plan(request.message)
    task_store.add_event(task, EventKind.ASSISTANT, response_text)
    if tool_calls:
        task_store.add_event(task, EventKind.PLAN, f"Planned {len(tool_calls)} tool action(s).")

    for tool_call in tool_calls:
        result = executor.run_or_pause(task, tool_call)
        if task.status == TaskStatus.WAITING_APPROVAL:
            return ChatResponse(task_id=task.id, response=response_text, status=task.status)
        if result and not result.ok:
            return ChatResponse(task_id=task.id, response=result.message, status=task.status)

    task.status = TaskStatus.COMPLETED
    return ChatResponse(task_id=task.id, response=response_text, status=task.status)


@app.get("/task/{task_id}/events")
def task_events(task_id: str):
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"task_id": task.id, "status": task.status, "events": task.events}


@app.post("/task/{task_id}/approve", response_model=ApprovalResponse)
def approve_task(task_id: str, request: ApprovalRequest) -> ApprovalResponse:
    task = task_store.get(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.pending_tool is None:
        raise HTTPException(status_code=400, detail="No pending approval")

    if request.decision == "reject":
        task.status = TaskStatus.CANCELLED
        task_store.add_event(task, EventKind.APPROVAL, "User rejected the pending action.")
        task.pending_tool = None
        return ApprovalResponse(task_id=task.id, status=task.status, message="Action rejected.")

    tool_call = task.pending_tool
    task.pending_tool = None
    task.status = TaskStatus.RUNNING
    task_store.add_event(task, EventKind.APPROVAL, f"User approved {tool_call.tool_name}.")
    result = executor.execute(task, tool_call)
    if result.ok:
        task.status = TaskStatus.COMPLETED
    return ApprovalResponse(task_id=task.id, status=task.status, message=result.message)


@app.post("/voice/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_voice(file: UploadFile = File(...)) -> VoiceTranscriptionResponse:
    await file.read()
    return VoiceTranscriptionResponse(
        text="",
        provider="stub",
        message="Voice upload received. Configure a local speech provider to enable transcription.",
    )
