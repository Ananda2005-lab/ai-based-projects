export type TaskStatus = "running" | "waiting_approval" | "completed" | "cancelled" | "failed";

export type ChatResponse = {
  task_id: string;
  response: string;
  status: TaskStatus;
};

export type TaskEvent = {
  id: string;
  kind: "user" | "assistant" | "plan" | "tool" | "observation" | "approval" | "error";
  message: string;
  data: Record<string, unknown>;
};

export type TaskEventsResponse = {
  task_id: string;
  status: TaskStatus;
  events: TaskEvent[];
};

export type ApprovalResponse = {
  task_id: string;
  status: TaskStatus;
  message: string;
};

export type VoiceResponse = {
  text: string;
  provider: string;
  message: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};
