import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ResumeProfile, ResumeData, AISettings, TemplateId } from "./types";
import { makeProfile, newBlankResume, DEFAULT_AI_SETTINGS, uid } from "./lib/defaults";

const LS_PROFILES = "nexus.profiles.v1";
const LS_ACTIVE = "nexus.active.v1";
const LS_AI = "nexus.ai.v1";

interface VersionSnapshot {
  id: string;
  label: string;
  ts: number;
  data: ResumeData;
}

interface StoreShape {
  profiles: ResumeProfile[];
  activeId: string;
  active: ResumeProfile;
  ai: AISettings;
  versions: VersionSnapshot[];
  lastSaved: number | null;

  setActiveId: (id: string) => void;
  updateData: (fn: (d: ResumeData) => ResumeData) => void;
  patchData: (patch: Partial<ResumeData>) => void;
  setTemplate: (t: TemplateId) => void;
  setAccent: (c: string) => void;
  addProfile: (name: string, blank?: boolean) => void;
  duplicateProfile: () => void;
  renameProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  setAI: (ai: AISettings) => void;
  saveSnapshot: (label?: string) => void;
  restoreSnapshot: (id: string) => void;
}

const Ctx = createContext<StoreShape | null>(null);

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<ResumeProfile[]>(() => {
    const saved = load<ResumeProfile[]>(LS_PROFILES, []);
    return saved.length ? saved : [makeProfile("My Resume", newBlankResume())];
  });
  const [activeId, setActiveId] = useState<string>(() =>
    load<string>(LS_ACTIVE, ""),
  );
  const [ai, setAIState] = useState<AISettings>(() =>
    load<AISettings>(LS_AI, DEFAULT_AI_SETTINGS),
  );
  const [versions, setVersions] = useState<VersionSnapshot[]>(() =>
    load<VersionSnapshot[]>("nexus.versions.v1", []),
  );
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // ensure activeId valid
  useEffect(() => {
    if (!profiles.find((p) => p.id === activeId)) {
      setActiveId(profiles[0]?.id ?? "");
    }
  }, [profiles, activeId]);

  const active = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? profiles[0],
    [profiles, activeId],
  );

  // autosave (debounced)
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
      localStorage.setItem(LS_ACTIVE, JSON.stringify(activeId));
      setLastSaved(Date.now());
    }, 600);
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [profiles, activeId]);

  useEffect(() => {
    localStorage.setItem(LS_AI, JSON.stringify(ai));
  }, [ai]);
  useEffect(() => {
    localStorage.setItem("nexus.versions.v1", JSON.stringify(versions));
  }, [versions]);

  const mutateActive = (fn: (p: ResumeProfile) => ResumeProfile) =>
    setProfiles((prev) =>
      prev.map((p) => (p.id === activeId ? { ...fn(p), updatedAt: Date.now() } : p)),
    );

  const store: StoreShape = {
    profiles,
    activeId: active?.id ?? "",
    active,
    ai,
    versions,
    lastSaved,
    setActiveId,
    updateData: (fn) => mutateActive((p) => ({ ...p, data: fn(p.data) })),
    patchData: (patch) => mutateActive((p) => ({ ...p, data: { ...p.data, ...patch } })),
    setTemplate: (t) => mutateActive((p) => ({ ...p, template: t })),
    setAccent: (c) => mutateActive((p) => ({ ...p, accent: c })),
    addProfile: (name) => {
      const prof = makeProfile(name || "Untitled", newBlankResume());
      setProfiles((prev) => [...prev, prof]);
      setActiveId(prof.id);
    },
    duplicateProfile: () => {
      if (!active) return;
      const copy = { ...active, id: uid(), name: active.name + " (copy)", updatedAt: Date.now() };
      copy.data = JSON.parse(JSON.stringify(active.data));
      setProfiles((prev) => [...prev, copy]);
      setActiveId(copy.id);
    },
    renameProfile: (name) => mutateActive((p) => ({ ...p, name })),
    deleteProfile: (id) =>
      setProfiles((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== id) : prev)),
    setAI: (s) => setAIState(s),
    saveSnapshot: (label) => {
      if (!active) return;
      setVersions((prev) =>
        [
          {
            id: uid(),
            label: label || new Date().toLocaleString(),
            ts: Date.now(),
            data: JSON.parse(JSON.stringify(active.data)),
          },
          ...prev,
        ].slice(0, 20),
      );
    },
    restoreSnapshot: (id) => {
      const snap = versions.find((v) => v.id === id);
      if (snap) mutateActive((p) => ({ ...p, data: JSON.parse(JSON.stringify(snap.data)) }));
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
