import { useEffect, useState } from "react";

export interface SavedItem {
  id: string;
  type: "roadmap" | "skillgap" | "resume" | "learning" | "projects" | "interview";
  title: string;
  createdAt: number;
  data: any;
}

export interface Milestone {
  id: string;
  label: string;
  done: boolean;
}

export interface MemoryState {
  goals: string[];
  saved: SavedItem[];
  milestones: Milestone[];
  streak: { count: number; lastActive: string };
  xp: number;
}

const KEY = "nexus.memory.v1";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function load(): MemoryState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { goals: [], saved: [], milestones: [], streak: { count: 0, lastActive: "" }, xp: 0 };
}

function save(s: MemoryState) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("nexus-memory-change"));
}

export function bumpStreak() {
  const s = load();
  const today = todayStr();
  if (s.streak.lastActive === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  s.streak.count = s.streak.lastActive === yesterday ? s.streak.count + 1 : 1;
  s.streak.lastActive = today;
  s.xp += 10;
  save(s);
}

export function addGoal(goal: string) {
  const s = load();
  if (goal && !s.goals.includes(goal)) {
    s.goals.unshift(goal);
    s.xp += 5;
    save(s);
  }
}

export function removeGoal(goal: string) {
  const s = load();
  s.goals = s.goals.filter((g) => g !== goal);
  save(s);
}

export function saveItem(item: Omit<SavedItem, "id" | "createdAt">) {
  const s = load();
  const full: SavedItem = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  s.saved.unshift(full);
  s.xp += 15;
  save(s);
  return full;
}

export function removeItem(id: string) {
  const s = load();
  s.saved = s.saved.filter((i) => i.id !== id);
  save(s);
}

export function syncMilestones(items: { label: string }[]) {
  const s = load();
  const existing = new Map(s.milestones.map((m) => [m.label, m]));
  items.forEach((it) => {
    if (!existing.has(it.label)) {
      s.milestones.push({ id: crypto.randomUUID(), label: it.label, done: false });
    }
  });
  save(s);
}

export function toggleMilestone(id: string) {
  const s = load();
  const m = s.milestones.find((x) => x.id === id);
  if (m) {
    m.done = !m.done;
    s.xp += m.done ? 20 : -20;
    if (s.xp < 0) s.xp = 0;
    save(s);
  }
}

export function clearAll() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new CustomEvent("nexus-memory-change"));
}

export function useMemory(): MemoryState {
  const [state, setState] = useState<MemoryState>(load);
  useEffect(() => {
    const handler = () => setState(load());
    window.addEventListener("nexus-memory-change", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("nexus-memory-change", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return state;
}

export function levelInfo(xp: number) {
  const level = Math.floor(xp / 100) + 1;
  const into = xp % 100;
  return { level, into, pct: into };
}
