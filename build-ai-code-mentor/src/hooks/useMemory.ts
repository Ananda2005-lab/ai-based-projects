import { useState, useEffect, useCallback } from 'react';

export interface MemoryEntry {
  id: string;
  type: 'session' | 'goal' | 'favorite' | 'project';
  title: string;
  content: string;
  language?: string;
  mode?: string;
  timestamp: number;
}

export interface UserMemory {
  learningGoals: string[];
  recentSessions: MemoryEntry[];
  favoriteLanguages: string[];
  totalQueries: number;
  streakDays: number;
  lastActive: number;
}

const STORAGE_KEY = 'nexus-memory';

const defaultMemory: UserMemory = {
  learningGoals: [],
  recentSessions: [],
  favoriteLanguages: ['JavaScript', 'Python'],
  totalQueries: 0,
  streakDays: 1,
  lastActive: Date.now(),
};

function loadMemory(): UserMemory {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultMemory, ...JSON.parse(stored) };
    }
  } catch {
    // ignore
  }
  return { ...defaultMemory };
}

function saveMemory(memory: UserMemory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function useMemory() {
  const [memory, setMemory] = useState<UserMemory>(loadMemory);

  useEffect(() => {
    saveMemory(memory);
  }, [memory]);

  const addSession = useCallback((entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => {
    const newEntry: MemoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };
    setMemory(prev => {
      const sessions = [newEntry, ...prev.recentSessions].slice(0, 50);
      const now = Date.now();
      const lastActive = prev.lastActive;
      const dayDiff = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
      const streakDays = dayDiff === 1 ? prev.streakDays + 1 : dayDiff > 1 ? 1 : prev.streakDays;
      return {
        ...prev,
        recentSessions: sessions,
        totalQueries: prev.totalQueries + 1,
        streakDays,
        lastActive: now,
      };
    });
  }, []);

  const addGoal = useCallback((goal: string) => {
    setMemory(prev => ({
      ...prev,
      learningGoals: [...prev.learningGoals, goal],
    }));
  }, []);

  const removeGoal = useCallback((index: number) => {
    setMemory(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.filter((_, i) => i !== index),
    }));
  }, []);

  const toggleLanguage = useCallback((lang: string) => {
    setMemory(prev => {
      const exists = prev.favoriteLanguages.includes(lang);
      return {
        ...prev,
        favoriteLanguages: exists
          ? prev.favoriteLanguages.filter(l => l !== lang)
          : [...prev.favoriteLanguages, lang],
      };
    });
  }, []);

  const clearSessions = useCallback(() => {
    setMemory(prev => ({ ...prev, recentSessions: [] }));
  }, []);

  return {
    memory,
    addSession,
    addGoal,
    removeGoal,
    toggleLanguage,
    clearSessions,
  };
}
