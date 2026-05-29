import { createContext, useContext, useState, type ReactNode } from "react";
import type { HistoryItem } from "../mockData";
import { INITIAL_HISTORY } from "../mockData";
import type { SpeakerAudio } from "../services/audioService";
import type { iTunesSong } from "../services/songApi";

export type Page = "dashboard" | "upload" | "studio" | "history" | "settings" | "backend";

export interface UploadedFileInfo {
  name: string;
  size: number;
  type: string;
  kind: "voice" | "call" | "video" | "live";
  blobUrl?: string; // for playback
}

interface AppState {
  page: Page;
  setPage: (p: Page) => void;

  // Upload
  uploadedFile: UploadedFileInfo | null;
  setUploadedFile: (f: UploadedFileInfo | null) => void;
  uploadedFileRaw: File | null;
  setUploadedFileRaw: (f: File | null) => void;

  // Speakers (with real audio blobs)
  speakerAudios: SpeakerAudio[];
  setSpeakerAudios: (s: SpeakerAudio[]) => void;
  selectedSpeakerId: string | null;
  setSelectedSpeakerId: (id: string | null) => void;

  // Songs (from iTunes API)
  selectedSong: iTunesSong | null;
  setSelectedSong: (s: iTunesSong | null) => void;

  // Options
  emotion: string;
  setEmotion: (e: string) => void;
  style: string;
  setStyle: (s: string) => void;

  // History
  history: HistoryItem[];
  addHistory: (h: HistoryItem) => void;
  clearHistory: () => void;

  // Result
  generatedTrack: { url: string; title: string } | null;
  setGeneratedTrack: (t: { url: string; title: string } | null) => void;

  // Reset
  reset: () => void;

  // Toasts
  toasts: { id: number; type: "success" | "error" | "info"; title: string; desc?: string }[];
  pushToast: (t: Omit<AppState["toasts"][number], "id">) => void;
  removeToast: (id: number) => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>("dashboard");
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null);
  const [uploadedFileRaw, setUploadedFileRaw] = useState<File | null>(null);
  const [speakerAudios, setSpeakerAudios] = useState<SpeakerAudio[]>([]);
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<iTunesSong | null>(null);
  const [emotion, setEmotion] = useState("Romantic");
  const [style, setStyle] = useState("Original");
  const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
  const [generatedTrack, setGeneratedTrack] = useState<{ url: string; title: string } | null>(null);
  const [toasts, setToasts] = useState<AppState["toasts"]>([]);

  const pushToast: AppState["pushToast"] = (t) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  };
  const removeToast = (id: number) => setToasts((prev) => prev.filter((x) => x.id !== id));

  const addHistory = (h: HistoryItem) => setHistory((prev) => [h, ...prev]);
  const clearHistory = () => setHistory([]);

  const reset = () => {
    setUploadedFile(null);
    setUploadedFileRaw(null);
    setSpeakerAudios([]);
    setSelectedSpeakerId(null);
    setSelectedSong(null);
    setGeneratedTrack(null);
    setEmotion("Romantic");
    setStyle("Original");
  };

  return (
    <AppContext.Provider
      value={{
        page, setPage,
        uploadedFile, setUploadedFile,
        uploadedFileRaw, setUploadedFileRaw,
        speakerAudios, setSpeakerAudios,
        selectedSpeakerId, setSelectedSpeakerId,
        selectedSong, setSelectedSong,
        emotion, setEmotion,
        style, setStyle,
        history, addHistory, clearHistory,
        generatedTrack, setGeneratedTrack,
        reset,
        toasts, pushToast, removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
