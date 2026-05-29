import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeName = "dark" | "light" | "neon" | "purple" | "spotify";

interface ThemeCtx {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themes: { id: ThemeName; label: string; swatch: string }[];
}

const ThemeContext = createContext<ThemeCtx | null>(null);

const THEMES: ThemeCtx["themes"] = [
  { id: "dark", label: "Dark", swatch: "linear-gradient(135deg,#05060d,#22d3ee)" },
  { id: "light", label: "Light", swatch: "linear-gradient(135deg,#f3f4fb,#0891b2)" },
  { id: "neon", label: "Neon", swatch: "linear-gradient(135deg,#000,#00ff9c)" },
  { id: "purple", label: "Purple", swatch: "linear-gradient(135deg,#0c0520,#c084fc)" },
  { id: "spotify", label: "Spotify", swatch: "linear-gradient(135deg,#121212,#1db954)" },
];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    try {
      const saved = localStorage.getItem("sf-theme");
      if (saved && THEMES.find((t) => t.id === saved)) return saved as ThemeName;
    } catch {}
    return "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("sf-theme", theme);
    } catch {}
  }, [theme]);

  const setTheme = (t: ThemeName) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
