// Mock data used for the simulated AI pipeline.
// In the real stack, all of this comes from the Flask backend.

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string; // e.g. "3:42"
  cover: string; // gradient CSS
  genre: string;
}

export interface Speaker {
  id: string;
  label: string;
  gender: "Male" | "Female" | "Unknown";
  confidence: number; // 0..1
  duration: number; // seconds of total speech
  color: string;
}

export interface HistoryItem {
  id: string;
  songTitle: string;
  artist: string;
  speaker: string;
  emotion: string;
  style: string;
  createdAt: string;
  cover: string;
}

export const MOCK_SONGS: Song[] = [
  { id: "s1", title: "Midnight Horizon", artist: "Luna Vega", duration: "3:42", genre: "Synthwave", cover: "linear-gradient(135deg,#22d3ee,#a855f7)" },
  { id: "s2", title: "Neon Heartbeat", artist: "Kairo", duration: "2:58", genre: "Pop", cover: "linear-gradient(135deg,#ec4899,#f59e0b)" },
  { id: "s3", title: "Crystal Rain", artist: "The Astrals", duration: "4:11", genre: "Indie", cover: "linear-gradient(135deg,#60a5fa,#34d399)" },
  { id: "s4", title: "Velvet Sky", artist: "Mira Cole", duration: "3:05", genre: "R&B", cover: "linear-gradient(135deg,#a855f7,#ec4899)" },
  { id: "s5", title: "Gravity Lost", artist: "NOVA", duration: "3:30", genre: "Electronic", cover: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  { id: "s6", title: "Paper Moons", artist: "Aria Blue", duration: "2:44", genre: "Acoustic", cover: "linear-gradient(135deg,#f472b6,#fbbf24)" },
  { id: "s7", title: "Static Dreams", artist: "Helix", duration: "4:02", genre: "Rock", cover: "linear-gradient(135deg,#ef4444,#f97316)" },
  { id: "s8", title: "Ocean of Stars", artist: "Selene", duration: "3:19", genre: "Ambient", cover: "linear-gradient(135deg,#0ea5e9,#22d3ee)" },
  { id: "s9", title: "Echoes of You", artist: "The Paper Kites", duration: "3:55", genre: "Folk", cover: "linear-gradient(135deg,#a78bfa,#f472b6)" },
  { id: "s10", title: "Solar Flare", artist: "ZENITH", duration: "2:27", genre: "EDM", cover: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { id: "s11", title: "Hologram", artist: "Cyra", duration: "3:08", genre: "Lo-fi", cover: "linear-gradient(135deg,#8b5cf6,#06b6d4)" },
  { id: "s12", title: "Afterglow", artist: "Juno Vale", duration: "4:33", genre: "Chill", cover: "linear-gradient(135deg,#f43f5e,#a855f7)" },
];

export const MOCK_SPEAKERS: Speaker[] = [
  { id: "sp1", label: "Speaker 1", gender: "Male", confidence: 0.94, duration: 38, color: "#22d3ee" },
  { id: "sp2", label: "Speaker 2", gender: "Female", confidence: 0.89, duration: 22, color: "#a855f7" },
  { id: "sp3", label: "Speaker 3", gender: "Unknown", confidence: 0.71, duration: 9, color: "#ec4899" },
];

export const INITIAL_HISTORY: HistoryItem[] = [
  {
    id: "h1",
    songTitle: "Midnight Horizon",
    artist: "Luna Vega",
    speaker: "Speaker 1",
    emotion: "Romantic",
    style: "Lo-fi",
    createdAt: "2 hours ago",
    cover: "linear-gradient(135deg,#22d3ee,#a855f7)",
  },
  {
    id: "h2",
    songTitle: "Neon Heartbeat",
    artist: "Kairo",
    speaker: "Speaker 2",
    emotion: "Energetic",
    style: "Original",
    createdAt: "Yesterday",
    cover: "linear-gradient(135deg,#ec4899,#f59e0b)",
  },
  {
    id: "h3",
    songTitle: "Crystal Rain",
    artist: "The Astrals",
    speaker: "Speaker 1",
    emotion: "Sad",
    style: "Acoustic",
    createdAt: "3 days ago",
    cover: "linear-gradient(135deg,#60a5fa,#34d399)",
  },
];

export const AI_STEPS = [
  { id: "upload", title: "Uploading audio", desc: "Securing your file and preparing for analysis." },
  { id: "detect", title: "Detecting speakers", desc: "Running pyannote.audio diarization pipeline." },
  { id: "separate", title: "Separating voices", desc: "Extracting isolated vocal tracks with Demucs." },
  { id: "prepare", title: "Preparing AI voice", desc: "Encoding selected speaker into RVC voice model." },
  { id: "search", title: "Fetching song source", desc: "Pulling original vocals and instrumentals." },
  { id: "generate", title: "Generating remake", desc: "Running neural voice conversion (So-VITS-SVC)." },
  { id: "finalize", title: "Finalizing audio", desc: "Mixing, mastering, and exporting." },
] as const;
