import { useRef, useState } from "react";
import { useApp, type UploadedFileInfo } from "../context/AppContext";

const KINDS: { id: UploadedFileInfo["kind"]; label: string; desc: string; icon: string }[] = [
  { id: "voice", label: "Voice Recording", desc: "Any recorded voice clip", icon: "M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 11a7 7 0 0 1-14 0M12 18v4M8 22h8" },
  { id: "call", label: "Call Recording", desc: "Phone call with multiple speakers", icon: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2 4.2 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" },
  { id: "video", label: "Video Audio", desc: "Extract audio from video files", icon: "m22 8-6 4 6 4V8ZM14 6H2v12h12V6Z" },
  { id: "live", label: "Live Recording", desc: "Record directly from your mic", icon: "M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.2 16.2l2.9 2.9M2 12h4M18 12h4M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9" },
];

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const MAX_BYTES = 30 * 1024 * 1024;
const AUDIO_EXTS = ["mp3", "wav", "m4a", "ogg", "oga", "flac", "aac", "wma", "opus", "weba", "aiff", "aif", "amr", "caf", "pcm"];
const VIDEO_EXTS = ["mp4", "m4v", "mov", "webm", "mkv", "avi", "wmv", "flv", "3gp", "mpg", "mpeg", "ts"];
const ALL_EXTS = [...AUDIO_EXTS, ...VIDEO_EXTS];
const ACCEPTED = ["audio/*", "video/*", ...ALL_EXTS.map((e) => `.${e}`)];

function isLikelyMedia(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ALL_EXTS.includes(ext)) return true;
  if (/^(audio|video)\//.test(file.type)) return true;
  return false;
}

export function Upload() {
  const { setUploadedFile, setUploadedFileRaw, uploadedFile, setPage, pushToast } = useApp();
  const [selectedKind, setSelectedKind] = useState<UploadedFileInfo["kind"]>("voice");
  const [dragOver, setDragOver] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleFile = (file: File, kind: UploadedFileInfo["kind"]) => {
    if (file.size > MAX_BYTES) {
      pushToast({ type: "error", title: "File too large", desc: "Maximum allowed size is 30 MB." });
      return;
    }
    if (!isLikelyMedia(file)) {
      pushToast({ type: "error", title: "Unsupported format", desc: "Please upload an audio or video file." });
      return;
    }

    setProgress(0);
    const blobUrl = URL.createObjectURL(file);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          const info: UploadedFileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            kind,
            blobUrl,
          };
          setUploadedFile(info);
          setUploadedFileRaw(file);
          pushToast({ type: "success", title: "Upload complete", desc: file.name });
          setPage("studio");
          return 100;
        }
        return p + 7;
      });
    }, 80);
  };

  const startLiveRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `live-recording-${Date.now()}.webm`, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        handleFile(file, "live");
      };

      recorder.start();
      setRecording(true);
      setRecordTime(0);
      timerRef.current = window.setInterval(() => setRecordTime((t) => t + 1), 1000);
    } catch {
      pushToast({ type: "error", title: "Mic access denied", desc: "Please allow microphone access." });
    }
  };

  const stopLiveRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="fade-in max-w-5xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Step 01 · Input</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Upload your voice source</h1>
        <p className="opacity-70 mt-2 max-w-2xl">Pick the type of source. All processing happens in your browser — nothing is uploaded to any server.</p>
      </div>

      {/* Source Kind */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {KINDS.map((k) => {
          const active = selectedKind === k.id;
          return (
            <button key={k.id} onClick={() => setSelectedKind(k.id)}
              className={`glass p-5 rounded-2xl text-left transition-all hover:-translate-y-0.5 relative overflow-hidden ${active ? "ring-2" : ""}`}
              style={{ borderColor: active ? "var(--accent)" : undefined, boxShadow: active ? "var(--glow)" : undefined }}>
              <div className="w-10 h-10 rounded-lg mb-3 flex items-center justify-center"
                   style={{ background: active ? "linear-gradient(135deg,var(--accent),var(--accent-2))" : "rgba(255,255,255,0.06)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active ? "#000" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={k.icon} />
                </svg>
              </div>
              <div className="font-semibold text-sm">{k.label}</div>
              <div className="text-xs opacity-60 mt-1">{k.desc}</div>
              {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />}
            </button>
          );
        })}
      </div>

      {/* Drop area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f, selectedKind); }}
        className="glass p-8 md:p-12 rounded-3xl text-center relative overflow-hidden border-2 border-dashed"
        style={{ borderColor: dragOver ? "var(--accent)" : "var(--border)" }}>
        <div className="absolute inset-0 opacity-40 pointer-events-none"
             style={{ background: "radial-gradient(400px 200px at 50% 0%, var(--accent), transparent)" }} />
        <div className="relative">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-5"
               style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "var(--glow)" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v12m0-12L8 8m4-4 4 4M4 20h16" />
            </svg>
          </div>
          <h3 className="font-display text-2xl font-bold">{dragOver ? "Release to upload" : "Drop your file here"}</h3>
          <p className="opacity-60 mt-1 text-sm">or click below to browse · Max 30 MB</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button className="btn-neon" onClick={() => inputRef.current?.click()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0-12L8 8m4-4 4 4M4 20h16" /></svg>
              Choose File
            </button>
            {selectedKind === "live" && !recording && (
              <button className="btn-ghost" onClick={startLiveRecording}>
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Start Live Mic
              </button>
            )}
            {recording && (
              <button className="btn-ghost" onClick={stopLiveRecording}>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Stop · {mmss(recordTime)}
              </button>
            )}
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-2 text-[11px] opacity-60">
            {[".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac", ".opus", ".amr", ".mp4", ".mov", ".webm", ".mkv", ".avi", ".wmv"].map((ext) => (
              <span key={ext} className="chip">{ext}</span>
            ))}
            <span className="chip" style={{ color: "var(--accent)", borderColor: "var(--accent)" }}>+ any audio/video</span>
          </div>

          <input ref={inputRef} type="file" accept={ACCEPTED.join(",")} className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f, selectedKind); e.target.value = ""; }} />
        </div>
      </div>

      {/* Upload progress */}
      {progress > 0 && progress < 100 && (
        <div className="glass p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2 text-sm"><span>Uploading…</span><span className="opacity-70">{progress}%</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      {uploadedFile && progress >= 100 && (
        <div className="glass p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{uploadedFile.name}</div>
            <div className="text-xs opacity-60">{formatSize(uploadedFile.size)} · {uploadedFile.kind.toUpperCase()} · Ready for analysis</div>
          </div>
          <button className="btn-neon" onClick={() => setPage("studio")}>Open Studio →</button>
        </div>
      )}

      {/* Tips */}
      <div className="glass-2 p-5 rounded-2xl grid md:grid-cols-3 gap-4 text-sm">
        <div><div className="font-semibold mb-1 flex items-center gap-2"><span className="text-emerald-400">✓</span> 100% Browser Processing</div><p className="opacity-70 text-xs leading-relaxed">Audio is decoded and split entirely in your browser. No server upload needed.</p></div>
        <div><div className="font-semibold mb-1 flex items-center gap-2"><span className="text-emerald-400">✓</span> Real Previews</div><p className="opacity-70 text-xs leading-relaxed">Speaker previews play actual audio from your uploaded file.</p></div>
        <div><div className="font-semibold mb-1 flex items-center gap-2"><span className="text-emerald-400">✓</span> Real Songs</div><p className="opacity-70 text-xs leading-relaxed">Song search uses iTunes API — millions of tracks with real 30-sec previews.</p></div>
      </div>
    </div>
  );
}
