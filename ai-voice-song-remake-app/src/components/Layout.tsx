import { useApp, type Page } from "../context/AppContext";
import { useTheme, type ThemeName } from "../context/ThemeContext";

const NAV: { id: Page; label: string; icon: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: "M3 12 12 3l9 9M5 10v10h14V10" },
  { id: "upload", label: "Upload", icon: "M12 4v12m0-12L8 8m4-4 4 4M4 20h16" },
  { id: "studio", label: "AI Studio", icon: "M4 6h16M4 12h16M4 18h10" },
  { id: "history", label: "History", icon: "M12 8v4l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" },
  { id: "settings", label: "Settings", icon: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-3a7 7 0 0 1-.1 1.2l2 1.6-2 3.4-2.4-.9a7 7 0 0 1-2 1.2l-.4 2.5h-4l-.4-2.5a7 7 0 0 1-2-1.2l-2.4.9-2-3.4 2-1.6A7 7 0 0 1 5 12a7 7 0 0 1 .1-1.2l-2-1.6 2-3.4 2.4.9a7 7 0 0 1 2-1.2L10 3h4l.4 2.5a7 7 0 0 1 2 1.2l2.4-.9 2 3.4-2 1.6c.1.4.1.8.1 1.2Z" },
  { id: "backend", label: "Backend Guide", icon: "M4 6h16v4H4zM4 14h16v4H4zM7 8h.01M7 16h.01" },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-5">
      <div className="relative w-10 h-10 rounded-xl flex items-center justify-center"
           style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))", boxShadow: "var(--glow)" }}>
        <div className="absolute inset-0 rounded-xl ring-spin"
             style={{ border: "1.5px dashed rgba(255,255,255,0.35)" }} />
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div>
        <div className="font-display text-lg font-black tracking-wider">SONICFORGE</div>
        <div className="text-[10px] uppercase tracking-[0.2em] opacity-60">AI Voice Studio</div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { page, setPage } = useApp();
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col glass-2 m-3 mr-0 rounded-2xl border-r-0 overflow-hidden">
      <Brand />
      <nav className="flex-1 px-3 py-2 space-y-1">
        {NAV.map((n) => {
          const active = page === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setPage(n.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "text-black"
                  : "opacity-70 hover:opacity-100 hover:bg-white/5"
              }`}
              style={
                active
                  ? {
                      background: "linear-gradient(135deg,var(--accent),var(--accent-2))",
                      boxShadow: "var(--glow)",
                    }
                  : {}
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={n.icon} />
              </svg>
              {n.label}
            </button>
          );
        })}
      </nav>
      <div className="p-4 m-3 rounded-xl" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.15), rgba(168,85,247,0.15))", border: "1px solid var(--border)" }}>
        <div className="text-xs opacity-70 mb-1">Personal use only</div>
        <div className="text-xs leading-relaxed">Remakes are generated locally & never shared. Respect copyright laws.</div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const { page, setPage } = useApp();
  return (
    <div className="md:hidden sticky top-0 z-40 glass-2 rounded-none border-b border-t-0 px-2 py-2 flex overflow-x-auto gap-1">
      {NAV.map((n) => {
        const active = page === n.id;
        return (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium ${active ? "text-black" : "opacity-70"}`}
            style={active ? { background: "linear-gradient(135deg,var(--accent),var(--accent-2))" } : {}}
          >
            {n.label}
          </button>
        );
      })}
    </div>
  );
}

export function Topbar() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <header className="flex items-center justify-between gap-4 px-4 md:px-8 py-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.3em] opacity-60">Session</div>
        <div className="text-lg font-display font-bold">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 chip">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)", boxShadow: "0 0 8px var(--accent)" }} />
          <span>AI Engine online</span>
        </div>
        <ThemeSwitcher theme={theme} setTheme={setTheme} themes={themes} />
      </div>
    </header>
  );
}

function ThemeSwitcher({
  theme, setTheme, themes,
}: {
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  themes: { id: ThemeName; label: string; swatch: string }[];
}) {
  return (
    <div className="relative group">
      <button className="btn-ghost flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
        </svg>
        <span className="capitalize">{theme}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
      </button>
      <div className="absolute right-0 top-full mt-2 glass p-2 rounded-xl w-52 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-left transition ${
              theme === t.id ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <div className="w-6 h-6 rounded-md border border-white/20" style={{ background: t.swatch }} />
            <span className="flex-1">{t.label}</span>
            {theme === t.id && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="bg-fx" />
      <div className="grid-overlay" />
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <MobileNav />
        <Topbar />
        <main className="flex-1 px-4 md:px-8 pb-10">{children}</main>
      </div>
    </div>
  );
}
