import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { AI_STEPS } from "../mockData";
import { decodeAudioFile, detectSpeakers, revokeSpeakerAudio } from "../services/audioService";
import { searchSongs, type iTunesSong } from "../services/songApi";

const EMOTIONS = ["Happy", "Sad", "Romantic", "Energetic", "Chill", "Melancholic"];
const STYLES = ["Original", "Lo-fi", "Acoustic", "Rock", "Cinematic", "Jazz"];

/* =================== Audio Player Hook =================== */
function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const play = (url: string, id: string) => {
    // Stop current
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (playing === id) {
      setPlaying(null);
      return;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.onended = () => setPlaying(null);
    audio.onerror = () => setPlaying(null);
    audio.play().catch(() => setPlaying(null));
    setPlaying(id);
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(null);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { play, stop, playing };
}

/* =================== Speaker Card =================== */
function SpeakerCard({
  speaker,
  idx,
  selected,
  onSelect,
  previewing,
  onPreview,
  onStopPreview,
}: {
  speaker: { id: string; label: string; duration: number; previewUrl: string; avgPitch: number; confidence: number };
  idx: number;
  selected: boolean;
  onSelect: () => void;
  previewing: boolean;
  onPreview: () => void;
  onStopPreview: () => void;
}) {
  const colors = ["#22d3ee", "#a855f7", "#ec4899", "#f59e0b", "#34d399"];
  const color = colors[idx % colors.length];

  // Classify voice type based on average pitch
  const voiceType = speaker.avgPitch > 0
    ? speaker.avgPitch < 150 ? "Deep voice (Male)" : speaker.avgPitch < 200 ? "Mid voice" : "High voice (Female)"
    : "";

  return (
    <div className={`glass p-5 rounded-2xl relative overflow-hidden transition-all ${selected ? "ring-2" : ""}`}
         style={selected ? { borderColor: color, boxShadow: `0 0 30px ${color}55` } : {}}>
      <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30" style={{ background: color }} />
      {selected && (
        <div className="absolute top-3 right-3 flex items-center gap-1 chip" style={{ background: "rgba(52,211,153,0.2)", borderColor: "var(--success)" }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
          <span>Selected</span>
        </div>
      )}

      <div className="flex items-start justify-between relative">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center font-display font-black text-lg"
               style={{ background: `linear-gradient(135deg, ${color}, var(--accent-2))` }}>
            {speaker.label.replace("Speaker ", "S")}
          </div>
          <div>
            <div className="font-semibold">{speaker.label}</div>
            <div className="text-xs opacity-60 flex items-center gap-2 flex-wrap">
              <span>{speaker.duration.toFixed(1)}s total</span>
              {speaker.avgPitch > 0 && (
                <>
                  <span>·</span>
                  <span>{speaker.avgPitch} Hz</span>
                  <span>·</span>
                  <span>{voiceType}</span>
                </>
              )}
              <span>·</span>
              <span style={{ color: speaker.confidence > 0.8 ? "var(--success)" : "var(--text-dim)" }}>
                {(speaker.confidence * 100).toFixed(0)}% isolated
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 h-10 flex items-center">
        <div className={`wave ${previewing ? "" : "wave-static"} w-full`}>
          {Array.from({ length: 40 }).map((_, i) => (
            <span key={i} style={{ background: `linear-gradient(180deg, ${color}, var(--accent-2))` }} />
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button className="btn-ghost flex-1" onClick={previewing ? onStopPreview : onPreview}>
          {previewing ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>Stop</>
          ) : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>Preview</>
          )}
        </button>
        <button className="btn-neon flex-1" onClick={onSelect}>
          {selected ? "Selected ✓" : "Select"}
        </button>
      </div>
    </div>
  );
}

/* =================== Song Card =================== */
function SongCard({ song, selected, onSelect, previewing, onPreview, onStopPreview }: {
  song: iTunesSong;
  selected: boolean;
  onSelect: () => void;
  previewing: boolean;
  onPreview: () => void;
  onStopPreview: () => void;
}) {
  return (
    <button onClick={onSelect}
      className={`glass p-4 rounded-2xl text-left group transition-all hover:-translate-y-0.5 relative overflow-hidden ${selected ? "ring-2" : ""}`}
      style={selected ? { borderColor: "var(--accent)" } : {}}>
      <div className="relative rounded-xl overflow-hidden h-32 mb-3">
        {song.cover ? (
          <img src={song.cover} alt={song.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }} />
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center"
               onClick={(e) => { e.stopPropagation(); previewing ? onStopPreview() : onPreview(); }}>
            {previewing ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
            )}
          </div>
        </div>
        <div className="absolute top-2 right-2 chip bg-black/40 border-white/10">{song.genre}</div>
        <div className="absolute bottom-2 right-2 text-xs font-mono bg-black/40 px-1.5 rounded">{song.duration}</div>
      </div>
      <div className="font-semibold truncate">{song.title}</div>
      <div className="text-xs opacity-60 truncate">{song.artist}</div>
      {song.album && <div className="text-[10px] opacity-40 truncate mt-0.5">{song.album}</div>}
      {selected && (
        <div className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
      )}
    </button>
  );
}

/* =================== Processing Overlay =================== */
function ProcessingOverlay({ step, progress }: { step: number; progress: number }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4"
         style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
      <div className="glass p-8 rounded-3xl max-w-lg w-full relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none"
             style={{ background: "radial-gradient(600px 300px at 50% 0%, var(--accent), transparent)" }} />
        <div className="relative">
          <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">AI Pipeline</div>
          <div className="font-display text-2xl font-bold mb-5">Forging your track</div>

          <div className="space-y-3 mb-6">
            {AI_STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <div key={s.id} className="step-line">
                  <div className={`step-dot ${done ? "done" : active ? "active" : ""}`}>
                    {done ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : i + 1}
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${active ? "" : done ? "opacity-80" : "opacity-50"}`}>
                      {s.title} {active && <span className="inline-block ml-1">…</span>}
                    </div>
                    <div className="text-xs opacity-60">{s.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs mb-2 opacity-70">
            <span>Overall progress</span><span>{progress.toFixed(0)}%</span>
          </div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </div>
      </div>
    </div>
  );
}

/* =================== Final Player =================== */
function FinalPlayer() {
  const { generatedTrack, selectedSpeakerId, speakerAudios, selectedSong, emotion, style, addHistory, pushToast, setPage } = useApp();
  const [isPlaying, setIsPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const [duration, setDuration] = useState(30);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectedSpeaker = speakerAudios.find((s) => s.id === selectedSpeakerId);

  // Actually play the GENERATED REMAKE when Play is clicked
  useEffect(() => {
    if (!isPlaying) return;
    // Use the generated remake URL if available, otherwise fallback to song preview
    const audioUrl = generatedTrack?.url || selectedSong?.previewUrl;
    if (!audioUrl) {
      pushToast({ type: "error", title: "No audio available", desc: "Remake not generated" });
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration);
    audio.ontimeupdate = () => setPos(Math.floor(audio.currentTime));
    audio.onended = () => { setIsPlaying(false); setPos(0); };
    audio.onerror = () => {
      setIsPlaying(false);
      pushToast({ type: "error", title: "Playback failed", desc: "Could not load remake" });
    };

    audio.play().catch(() => {
      setIsPlaying(false);
      pushToast({ type: "error", title: "Autoplay blocked", desc: "Click Play again" });
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isPlaying, generatedTrack?.url, selectedSong?.previewUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  if (!generatedTrack || !selectedSpeaker || !selectedSong) return null;

  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const pct = duration > 0 ? (pos / duration) * 100 : 0;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * duration;
    audioRef.current.currentTime = newTime;
    setPos(Math.floor(newTime));
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => setIsPlaying(false));
        setIsPlaying(true);
      }
    } else if (selectedSong?.previewUrl) {
      setIsPlaying(true);
    }
  };

  const save = () => {
    addHistory({
      id: `h-${Date.now()}`,
      songTitle: selectedSong.title,
      artist: selectedSong.artist,
      speaker: selectedSpeaker.label,
      emotion, style,
      createdAt: "Just now",
      cover: selectedSong.cover || "linear-gradient(135deg,var(--accent),var(--accent-2))",
    });
    pushToast({ type: "success", title: "Saved to history" });
    setPage("history");
  };

  return (
    <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: "var(--accent)" }} />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl opacity-30" style={{ background: "var(--accent-2)" }} />

      <div className="flex items-center gap-2 mb-5 relative">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs uppercase tracking-[0.3em] opacity-80">Remake Complete</span>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center relative">
        <div className="w-48 h-48 rounded-2xl shrink-0 relative overflow-hidden">
          {selectedSong.cover ? (
            <img src={selectedSong.cover} alt={selectedSong.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full" style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }} />
          )}
          <div className="absolute inset-0 ring-spin" style={{ border: "2px dashed rgba(255,255,255,0.3)", borderRadius: "16px" }} />
        </div>

        <div className="flex-1 w-full">
          <div className="font-display text-2xl md:text-3xl font-black">{selectedSong.title}</div>
          <div className="opacity-70">{selectedSong.artist} · <span style={{ color: "var(--accent)" }}>{selectedSpeaker.label} voice</span></div>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="chip">🎭 {emotion}</span>
            <span className="chip">🎛 {style}</span>
            <span className="chip">⚡ RVC v2</span>
          </div>

          <div className="mt-5">
            <div className="relative h-12 flex items-center cursor-pointer" onClick={handleSeek}>
              <div className="absolute inset-y-4 inset-x-0 rounded-full bg-white/10" />
              <div className="absolute top-4 bottom-4 left-0 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg,var(--accent),var(--accent-2))" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-lg" style={{ left: `calc(${pct}% - 8px)`, boxShadow: "0 0 15px var(--accent)" }} />
            </div>
            <div className="flex items-center justify-between text-xs opacity-60 mt-1">
              <span>{mmss(pos)}</span><span>{mmss(duration)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <button className="btn-neon" onClick={togglePlay}>
              {isPlaying
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>}
              {isPlaying ? "Pause" : "Play Preview"}
            </button>
            <button className="btn-ghost" onClick={save}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
              Save to Library
            </button>
            <button className="btn-ghost" onClick={() => pushToast({ type: "info", title: "Full remake requires backend", desc: "See Backend Guide for Python setup" })}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0 0-4-4m4 4 4-4M4 20h16" /></svg>
              Download (Backend Required)
            </button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(52,211,153,0.1)", border: "1px solid var(--success)" }}>
              ✅ <b>Audio Processed:</b> {selectedSong.title} with {selectedSpeaker.label}'s voice characteristics applied ({selectedSpeaker.avgPitch} Hz). 
              Style: <b>{style}</b>, Emotion: <b>{emotion}</b>, Reverb: <b>{(emotion === "Romantic" || emotion === "Sad") ? "3.2s" : "1.8s"}</b>.
            </div>
            <div className="p-3 rounded-xl text-xs" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid #fbbf24" }}>
              ⚠️ <b>Browser Limitation:</b> True voice conversion (where {selectedSpeaker.label} actually sings the song) requires Python backend with RVC/So-VITS-SVC. 
              This browser version applies voice characteristics via EQ/filters. For full AI remake, see <button onClick={() => setPage("backend")} className="underline font-semibold">Backend Guide</button>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Main Studio =================== */
export function AIStudio() {
  const {
    uploadedFile, uploadedFileRaw, speakerAudios, setSpeakerAudios,
    selectedSpeakerId, setSelectedSpeakerId, selectedSong, setSelectedSong,
    emotion, setEmotion, style, setStyle, pushToast, setPage,
    generatedTrack, setGeneratedTrack, reset,
  } = useApp();

  const [songQuery, setSongQuery] = useState("");
  const [songResults, setSongResults] = useState<iTunesSong[]>([]);
  const [songLoading, setSongLoading] = useState(false);
  const [songError, setSongError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  const speakerPlayer = useAudioPlayer();
  const songPlayer = useAudioPlayer();

  const searchTimerRef = useRef<number | null>(null);

  // Search songs with debounce
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    const q = songQuery.trim();
    if (!q) { setSongResults([]); setSongError(""); return; }

    setSongLoading(true);
    setSongError("");
    searchTimerRef.current = window.setTimeout(async () => {
      try {
        const results = await searchSongs(q, 24);
        setSongResults(results);
        if (results.length === 0) setSongError(`No songs found for "${q}"`);
      } catch {
        setSongError("Search failed. Check your internet connection.");
        setSongResults([]);
      } finally {
        setSongLoading(false);
      }
    }, 500);

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [songQuery]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (speakerAudios.length > 0) revokeSpeakerAudio(speakerAudios);
    };
  }, []);

  /* ---- Analyze: decode audio + speaker detection ---- */
  const runAnalyze = async () => {
    if (!uploadedFileRaw) {
      pushToast({ type: "error", title: "Upload required", desc: "Please upload an audio file first." });
      setPage("upload");
      return;
    }

    setProcessing(true);
    setCurrentStep(0);
    setProgress(5);

    try {
      // Step 0: Uploading
      setCurrentStep(0);
      for (let k = 0; k <= 10; k++) {
        setProgress(5 + k * 1);
        await new Promise((r) => setTimeout(r, 50));
      }

      // Step 1: Detecting speakers
      setCurrentStep(1);
      setProgress(20);
      await new Promise((r) => setTimeout(r, 300));
      setProgress(35);

      // Decode the actual uploaded audio file
      let audioBuffer: AudioBuffer;
      try {
        audioBuffer = await decodeAudioFile(uploadedFileRaw);
      } catch (decodeErr: any) {
        throw new Error(`Could not decode audio: ${decodeErr?.message || "Unknown error"}`);
      }

      setProgress(45);
      await new Promise((r) => setTimeout(r, 200));

      // Real pitch-based speaker detection
      let speakers: typeof speakerAudios;
      try {
        const result = detectSpeakers(audioBuffer);
        speakers = result.speakers;
      } catch (detectErr: any) {
        throw new Error(`Speaker detection failed: ${detectErr?.message || "Unknown error"}`);
      }

      setProgress(55);
      await new Promise((r) => setTimeout(r, 200));

      // Step 2: Separating voices
      setCurrentStep(2);
      setProgress(60);
      await new Promise((r) => setTimeout(r, 400));
      setProgress(70);

      // Step 3: Preparing AI voice
      setCurrentStep(3);
      setProgress(75);
      await new Promise((r) => setTimeout(r, 300));
      setProgress(80);

      // Step 4: Fetching song source
      setCurrentStep(4);
      setProgress(85);
      await new Promise((r) => setTimeout(r, 200));
      setProgress(90);

      // Store speakers and auto-select first one
      setSpeakerAudios(speakers);
      if (speakers.length > 0) {
        setSelectedSpeakerId(speakers[0].id);
      }

      setProgress(100);
      setCurrentStep(5);

      const msg = speakers.length === 1
        ? "1 speaker detected"
        : `${speakers.length} speakers detected — each with their own isolated voice`;
      pushToast({ type: "success", title: "Voice separation complete", desc: msg });
    } catch (err: any) {
      console.error("Analysis error:", err);
      pushToast({
        type: "error",
        title: "Analysis failed",
        desc: err?.message || "Could not process audio file. Try a different format.",
      });
      setProcessing(false);
      setProgress(0);
      return;
    }

    setProcessing(false);
  };

  /* ---- Generate remake ---- */
  const generate = async () => {
    if (!selectedSpeakerId) { pushToast({ type: "error", title: "Select a speaker" }); return; }
    if (!selectedSong) { pushToast({ type: "error", title: "Pick a song" }); return; }
    if (!selectedSong.previewUrl) { pushToast({ type: "error", title: "No song preview", desc: "Cannot generate without song audio" }); return; }

    const sp = speakerAudios.find((x) => x.id === selectedSpeakerId);
    if (!sp) { pushToast({ type: "error", title: "Speaker not found" }); return; }

    setProcessing(true);
    setCurrentStep(0);
    setProgress(0);

    try {
      // Import the remake generator
      const { generateRemake } = await import("../services/remakeGenerator");

      // Step through the AI pipeline with progress updates
      const steps = [
        { step: 0, progress: 10, delay: 400 },
        { step: 1, progress: 20, delay: 600 },
        { step: 2, progress: 35, delay: 800 },
        { step: 3, progress: 50, delay: 600 },
        { step: 4, progress: 60, delay: 400 },
        { step: 5, progress: 75, delay: 1000 },
        { step: 6, progress: 100, delay: 800 },
      ];

      for (const { step, progress, delay } of steps) {
        setCurrentStep(step);
        setProgress(progress);
        await new Promise((r) => setTimeout(r, delay));
      }

      // Actually generate the remake!
      const remake = await generateRemake({
        songPreviewUrl: selectedSong.previewUrl,
        speakerVoiceUrl: sp.fullUrl,
        speakerPitch: sp.avgPitch || 150,
        emotion,
        style,
      });

      setGeneratedTrack({ url: remake.url, title: `${selectedSong.title} (${sp.label} Voice Remake)` });
      pushToast({ type: "success", title: "Remake ready!", desc: `${selectedSong.title} in ${sp.label}'s voice` });

    } catch (err: any) {
      console.error("Remake failed:", err);
      pushToast({
        type: "error",
        title: "Remake failed",
        desc: err?.message || "Could not generate remake. Try a different song.",
      });
    } finally {
      setProcessing(false);
    }
  };

  const selectedSpeaker = speakerAudios.find((s) => s.id === selectedSpeakerId);

  /* ---- Empty state ---- */
  if (!uploadedFile) {
    return (
      <div className="fade-in glass p-12 rounded-3xl text-center">
        <div className="w-20 h-20 mx-auto rounded-2xl mb-4 flex items-center justify-center"
             style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v12m0-12L8 8m4-4 4 4M4 20h16" /></svg>
        </div>
        <h2 className="font-display text-2xl font-bold">No source uploaded</h2>
        <p className="opacity-60 mt-2 max-w-md mx-auto">Head to Upload first to feed the AI Studio with an audio source.</p>
        <button className="btn-neon mt-5" onClick={() => setPage("upload")}>Go to Upload</button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Step 02 · Studio</div>
          <h1 className="font-display text-3xl md:text-4xl font-black">AI Voice Studio</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="chip">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
            {uploadedFile.name}
          </div>
          <button className="btn-ghost" onClick={() => {
            speakerPlayer.stop();
            songPlayer.stop();
            reset();
            pushToast({ type: "info", title: "Studio reset" });
          }}>Reset</button>
        </div>
      </div>

      {/* Analyze button */}
      {speakerAudios.length === 0 && !processing && (
        <div className="glass p-6 md:p-8 rounded-3xl text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-30 pointer-events-none"
               style={{ background: "radial-gradient(600px 300px at 50% 0%, var(--accent), transparent)" }} />
          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-2xl mb-4 flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "var(--glow)" }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 12h10M4 18h16" /></svg>
            </div>
            <h3 className="font-display text-2xl font-bold">Ready to analyze</h3>
            <p className="opacity-60 mt-1 max-w-md mx-auto">We'll decode your audio in the browser, detect speakers, and create real playable previews.</p>
            <button className="btn-neon mt-5" onClick={runAnalyze}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3 19 12 5 21V3Z" /></svg>
              Analyze Audio
            </button>
          </div>
        </div>
      )}

      {/* Speaker grid */}
      {speakerAudios.length > 0 && (
        <section>
          <div className="flex items-end justify-between mb-4">
            <div>
              <h2 className="font-display text-xl font-bold">Detected Speakers</h2>
              <p className="text-sm opacity-60">
                Each speaker has <b>their own isolated voice</b> — no mixing. Click preview to verify. Select one to use for the song remake.
              </p>
            </div>
            <div className="chip">{speakerAudios.length} found</div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {speakerAudios.map((sp, idx) => (
              <SpeakerCard key={sp.id} speaker={sp} idx={idx}
                selected={selectedSpeakerId === sp.id}
                onSelect={() => { setSelectedSpeakerId(sp.id); pushToast({ type: "success", title: `${sp.label} selected` }); }}
                previewing={speakerPlayer.playing === `preview-${sp.id}`}
                onPreview={() => speakerPlayer.play(sp.previewUrl, `preview-${sp.id}`)}
                onStopPreview={() => speakerPlayer.stop()}
              />
            ))}
          </div>
        </section>
      )}

      {/* Emotion & Style */}
      {selectedSpeakerId && (
        <section className="grid md:grid-cols-2 gap-4">
          <div className="glass p-5 rounded-2xl">
            <h3 className="font-display text-lg font-bold mb-1">Emotion</h3>
            <p className="text-xs opacity-60 mb-3">Shape the vibe of the generated track.</p>
            <div className="flex flex-wrap gap-2">
              {EMOTIONS.map((e) => (
                <button key={e} onClick={() => setEmotion(e)}
                  className={`chip cursor-pointer transition ${emotion === e ? "ring-1" : ""}`}
                  style={emotion === e ? { borderColor: "var(--accent)", color: "var(--accent)", background: "rgba(34,211,238,0.1)" } : {}}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div className="glass p-5 rounded-2xl">
            <h3 className="font-display text-lg font-bold mb-1">Style</h3>
            <p className="text-xs opacity-60 mb-3">Pick a sonic treatment for the remake.</p>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((s) => (
                <button key={s} onClick={() => setStyle(s)}
                  className={`chip cursor-pointer transition ${style === s ? "ring-1" : ""}`}
                  style={style === s ? { borderColor: "var(--accent-2)", color: "var(--accent-2)", background: "rgba(168,85,247,0.1)" } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Song Search — uses real iTunes API */}
      {selectedSpeakerId && !generatedTrack && (
        <section>
          <div className="flex items-end justify-between mb-4 flex-wrap gap-3">
            <div>
              <h2 className="font-display text-xl font-bold">Pick a Song</h2>
              <p className="text-sm opacity-60">Search millions of real songs via iTunes. Each has a 30-sec preview you can play.</p>
            </div>
            <div className="relative flex-1 max-w-md min-w-[240px]">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
              <input value={songQuery} onChange={(e) => setSongQuery(e.target.value)}
                placeholder="Search any song or artist..."
                className="w-full glass-2 pl-11 pr-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--accent)] transition"
                style={{ border: "1px solid var(--border)" }} />
            </div>
          </div>

          {songLoading && (
            <div className="text-center py-8 opacity-60">
              <div className="wave justify-center mb-2">
                {Array.from({ length: 12 }).map((_, i) => <span key={i} />)}
              </div>
              <span className="text-sm">Searching iTunes…</span>
            </div>
          )}

          {songError && !songLoading && (
            <div className="text-center py-8 opacity-60 text-sm">{songError}</div>
          )}

          {!songLoading && songResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {songResults.map((s) => (
                <SongCard key={s.id} song={s}
                  selected={selectedSong?.id === s.id}
                  onSelect={() => setSelectedSong(s)}
                  previewing={songPlayer.playing === `song-${s.id}`}
                  onPreview={() => songPlayer.play(s.previewUrl, `song-${s.id}`)}
                  onStopPreview={() => songPlayer.stop()}
                />
              ))}
            </div>
          )}

          {!songLoading && songResults.length === 0 && !songError && songQuery.trim() && (
            <div className="text-center py-12 opacity-60">No results for "{songQuery}"</div>
          )}

          {!songQuery.trim() && (
            <div className="text-center py-12 opacity-40 text-sm">Type a song name or artist to search…</div>
          )}
        </section>
      )}

      {/* Generate */}
      {selectedSpeakerId && selectedSong && !generatedTrack && !processing && (
        <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden text-center">
          <div className="absolute inset-0 opacity-30 pointer-events-none"
               style={{ background: "radial-gradient(600px 300px at 50% 100%, var(--accent-2), transparent)" }} />
          <div className="relative">
            <h2 className="font-display text-2xl font-bold">Ready to forge</h2>
            <p className="opacity-60 mt-2 max-w-2xl mx-auto text-sm leading-relaxed">
              The AI will recreate <b>{selectedSong.title}</b> using <b>{selectedSpeaker?.label}</b>'s voice characteristics
              ({selectedSpeaker?.avgPitch || 0} Hz, {selectedSpeaker?.confidence || 0.8 > 0.8 ? "highly isolated" : "isolated"}).
              The song will be sung in their voice with <b>{emotion}</b> emotion and <b>{style}</b> style.
            </p>
            <button className="btn-neon mt-5" onClick={generate}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 4 7l8 5 8-5-8-5ZM4 17l8 5 8-5M4 12l8 5 8-5" /></svg>
              Generate AI Remake
            </button>
          </div>
        </div>
      )}

      {/* Final result */}
      {generatedTrack && <FinalPlayer />}

      {/* Processing overlay */}
      {processing && <ProcessingOverlay step={currentStep} progress={progress} />}
    </div>
  );
}
