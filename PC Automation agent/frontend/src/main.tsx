import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Check, FolderPlus, Globe2, Mic, Monitor, NotebookPen, Send, ShieldAlert, Sparkles, Square, X } from "lucide-react";
import { approveTask, fetchEvents, sendChat, transcribeVoice } from "./lib/api";
import type { ChatMessage, TaskEvent, TaskStatus } from "./lib/types";
import "./styles.css";

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Local assistant ready. Try: open Notepad, take a screenshot, or open Chrome.",
    },
  ]);
  const [input, setInput] = useState("");
  const [taskId, setTaskId] = useState<string | null>(null);
  const [status, setStatus] = useState<TaskStatus>("completed");
  const [events, setEvents] = useState<TaskEvent[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [voiceMessage, setVoiceMessage] = useState("Choose a language and tap the voice bubble.");
  const [voiceLanguage, setVoiceLanguage] = useState("hi-IN");
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [voiceConfidence, setVoiceConfidence] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const quickTasks = [
    { label: "Open Chrome", prompt: "open Chrome", icon: Globe2 },
    { label: "Desktop Note", prompt: "create note: Meeting ideas and next actions", icon: NotebookPen },
    { label: "New Folder", prompt: "create folder named AI Work", icon: FolderPlus },
    { label: "Search Web", prompt: "search latest AI automation ideas", icon: Sparkles },
    { label: "Play Song", prompt: "play saiyaara song from yt music", icon: Mic },
  ];
  const voiceLanguages = [
    { label: "Hindi", value: "hi-IN" },
    { label: "English", value: "en-IN" },
    { label: "Odia", value: "or-IN" },
    { label: "Tamil", value: "ta-IN" },
    { label: "Telugu", value: "te-IN" },
    { label: "Bengali", value: "bn-IN" },
    { label: "Marathi", value: "mr-IN" },
    { label: "Gujarati", value: "gu-IN" },
    { label: "Kannada", value: "kn-IN" },
    { label: "Malayalam", value: "ml-IN" },
    { label: "Punjabi", value: "pa-IN" },
    { label: "Urdu", value: "ur-IN" },
  ];

  const pendingApproval = useMemo(
    () => status === "waiting_approval" && events.some((event) => event.kind === "approval"),
    [events, status],
  );

  useEffect(() => {
    if (!taskId) return;
    const timer = window.setInterval(async () => {
      const next = await fetchEvents(taskId);
      setStatus(next.status);
      setEvents(next.events);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [taskId]);

  async function submitMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    setMessages((current) => [...current, { role: "user", content: trimmed }]);
    setInput("");
    setIsSending(true);
    try {
      const response = await sendChat(trimmed);
      setTaskId(response.task_id);
      setStatus(response.status);
      setMessages((current) => [...current, { role: "assistant", content: response.response }]);
      const next = await fetchEvents(response.task_id);
      setEvents(next.events);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: error instanceof Error ? error.message : "Request failed." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleApproval(decision: "approve" | "reject") {
    if (!taskId) return;
    const response = await approveTask(taskId, decision);
    setStatus(response.status);
    setMessages((current) => [...current, { role: "assistant", content: response.message }]);
    const next = await fetchEvents(taskId);
    setEvents(next.events);
  }

  async function handleVoice(file: File | null) {
    if (!file) return;
    const result = await transcribeVoice(file);
    setVoiceMessage(result.message);
    if (result.text) {
      setInput(result.text);
    }
  }

  function toggleListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceMessage("Speech recognition is not supported in this browser. Try Chrome or Edge.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = voiceLanguage;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;
    setLiveTranscript("");
    setVoiceConfidence(null);
    setIsListening(true);
    setVoiceMessage("Listening carefully...");

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        const confidence = event.results[index][0].confidence;
        if (typeof confidence === "number") {
          setVoiceConfidence(confidence);
        }
        if (event.results[index].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      const spoken = (finalText || interimText).trim();
      setLiveTranscript(spoken);
      if (finalText.trim()) {
        const command = finalText.trim();
        setInput(command);
        setVoiceMessage(`Recognized: ${command}`);
        recognition.stop();
        void submitMessage(command);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setVoiceMessage("Voice recognition failed. Try again or switch language.");
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setVoiceMessage((current) => (current === "Listening carefully..." ? "No speech detected. Try again." : current));
    };

    recognition.start();
  }

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Local Windows Agent</p>
            <h1>AI Assistant</h1>
            <p className="subtitle">Control apps, browser, files, notes, and approvals from one command center.</p>
          </div>
          <div className={`status-pill ${status}`}>
            <Monitor size={16} />
            <span>{status.replace("_", " ")}</span>
          </div>
        </header>

        <section className={`voice-stage ${isListening ? "listening" : ""}`} aria-label="Voice assistant">
          <div className="voice-halo" />
          <button type="button" className="voice-orb" onClick={toggleListening} title="Start voice command">
            <Mic size={42} />
            <span />
          </button>
          <div className="voice-stage-copy">
            <p className="eyebrow">Multilingual Voice Core</p>
            <h2>{isListening ? "I am listening" : "Tap the orb and speak"}</h2>
            <p>{liveTranscript || voiceMessage}</p>
          </div>
          <div className="voice-controls">
            <select
              value={voiceLanguage}
              onChange={(event) => setVoiceLanguage(event.target.value)}
              aria-label="Voice language"
            >
              {voiceLanguages.map((language) => (
                <option key={language.value} value={language.value}>
                  {language.label}
                </option>
              ))}
            </select>
            <span>{voiceConfidence === null ? "Ready" : `${Math.round(voiceConfidence * 100)}% confidence`}</span>
          </div>
        </section>

        <div className="main-grid">
          <section className="chat-panel" aria-label="Assistant chat">
            <div className="quick-strip" aria-label="Quick tasks">
              {quickTasks.map((task) => {
                const Icon = task.icon;
                return (
                  <button key={task.label} type="button" onClick={() => void submitMessage(task.prompt)}>
                    <Icon size={16} />
                    {task.label}
                  </button>
                );
              })}
            </div>
            <div className="messages">
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`message ${message.role}`}>
                  {message.content}
                </article>
              ))}
            </div>

            <form
              className="composer"
              onSubmit={(event) => {
                event.preventDefault();
                void submitMessage(input);
              }}
            >
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask me to control this PC..."
                aria-label="Command"
              />
              <label className="icon-button" title="Upload voice note">
                <Mic size={18} />
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(event) => void handleVoice(event.target.files?.[0] ?? null)}
                />
              </label>
              <button className="icon-button primary" type="submit" disabled={isSending} title="Send command">
                <Send size={18} />
              </button>
            </form>
            <p className="voice-note">{voiceMessage}</p>
          </section>

          <aside className="side-panel" aria-label="Task timeline">
            <section className="capability-card">
              <div>
                <Sparkles size={18} />
                <strong>Now handles</strong>
              </div>
              <div className="capability-grid">
                <span>Apps</span>
                <span>Browser</span>
                <span>Voice</span>
                <span>Volume</span>
                <span>Media</span>
                <span>Folders</span>
                <span>Notes</span>
                <span>Files</span>
                <span>Approvals</span>
              </div>
            </section>
            {pendingApproval && (
              <section className="approval-box">
                <div>
                  <ShieldAlert size={20} />
                  <strong>Approval required</strong>
                </div>
                <p>A risky action is paused until you approve or reject it.</p>
                <div className="approval-actions">
                  <button type="button" onClick={() => void handleApproval("approve")}>
                    <Check size={16} />
                    Approve
                  </button>
                  <button type="button" onClick={() => void handleApproval("reject")}>
                    <X size={16} />
                    Reject
                  </button>
                </div>
              </section>
            )}

            <section className="timeline">
              <div className="panel-heading">
                <h2>Timeline</h2>
                <button type="button" className="stop-button" disabled={!taskId || status !== "running"}>
                  <Square size={15} />
                  Stop
                </button>
              </div>
              {events.length === 0 ? (
                <p className="empty">No task events yet.</p>
              ) : (
                <ol>
                  {events.map((event) => (
                    <li key={event.id}>
                      <span>{event.kind}</span>
                      <p>{event.message}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
