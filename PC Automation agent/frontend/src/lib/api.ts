import type { ApprovalResponse, ChatResponse, TaskEventsResponse, VoiceResponse } from "./types";

const API_BASE = import.meta.env.VITE_AGENT_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...options?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function sendChat(message: string) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function fetchEvents(taskId: string) {
  return request<TaskEventsResponse>(`/task/${taskId}/events`);
}

export function approveTask(taskId: string, decision: "approve" | "reject") {
  return request<ApprovalResponse>(`/task/${taskId}/approve`, {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}

export function transcribeVoice(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<VoiceResponse>("/voice/transcribe", {
    method: "POST",
    body: form,
  });
}
