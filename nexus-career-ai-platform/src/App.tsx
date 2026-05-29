import { useState } from "react";
import { cn } from "./utils/cn";
import { CareerCore } from "./components/CareerCore";
import { SettingsModal } from "./components/SettingsModal";
import { GlowButton, Pill } from "./components/ui";
import { useMemory, levelInfo } from "./lib/memory";
import { loadSettings, PROVIDER_PRESETS } from "./lib/settings";
import { Roadmap } from "./modules/Roadmap";
import { SkillGap } from "./modules/SkillGap";
import { Resume } from "./modules/Resume";
import { Interview } from "./modules/Interview";
import { Learning } from "./modules/Learning";
import { Projects } from "./modules/Projects";
import { KnowledgeGraph } from "./modules/KnowledgeGraph";
import { Progress } from "./modules/Progress";

type View =
  | "home"
  | "roadmap"
  | "skillgap"
  | "resume"
  | "interview"
  | "learning"
  | "projects"
  | "graph"
  | "progress";

const NAV: { id: View; label: string; icon: string }[] = [
  { id: "home", label: "Command", icon: "◈" },
  { id: "roadmap", label: "Roadmap", icon: "🧭" },
  { id: "skillgap", label: "Skill Gap", icon: "📊" },
  { id: "resume", label: "Resume", icon: "📄" },
  { id: "interview", label: "Interview", icon: "🎙" },
  { id: "learning", label: "Learning", icon: "📚" },
  { id: "projects", label: "Projects", icon: "🚀" },
  { id: "graph", label: "Knowledge", icon: "⟐" },
  { id: "progress", label: "Progress", icon: "📈" },
];

const FEATURES = [
  { id: "roadmap", icon: "🧭", title: "Career Roadmap", desc: "Living, milestone-based paths to any role.", tone: "cyan" },
  { id: "skillgap", icon: "📊", title: "Skill Gap Analyzer", desc: "See exactly what to learn next.", tone: "violet" },
  { id: "resume", icon: "📄", title: "Resume Intelligence", desc: "Build + analyze with ATS scoring.", tone: "cyan" },
  { id: "interview", icon: "🎙", title: "Interview Coach", desc: "Live mock interviews & feedback.", tone: "emerald" },
  { id: "learning", icon: "📚", title: "Learning Plans", desc: "Day-by-day study schedules.", tone: "violet" },
  { id: "projects", icon: "🚀", title: "Project Engine", desc: "Portfolio-worthy build ideas.", tone: "rose" },
  { id: "graph", icon: "⟐", title: "Knowledge Graph", desc: "Interactive career skill map.", tone: "cyan" },
  { id: "progress", icon: "📈", title: "Memory & Growth", desc: "Streaks, XP and saved intelligence.", tone: "emerald" },
];

export default function App() {
  const [view, setView] = useState<View>("home");
  const [showSettings, setShowSettings] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const mem = useMemory();
  const { level } = levelInfo(mem.xp);
  const settings = loadSettings();

  function go(v: View) {
    setView(v);
    setNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="relative min-h-screen">
      <div className="aurora" />
      <div className="grid-overlay" />

      {/* Sidebar (desktop) */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 flex-col border-r border-white/10 p-5 lg:flex">
        <Brand />
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((n) => (
            <NavItem key={n.id} item={n} active={view === n.id} onClick={() => go(n.id)} />
          ))}
        </nav>
        <ProviderCard onClick={() => setShowSettings(true)} provider={PROVIDER_PRESETS[settings.provider].label} level={level} streak={mem.streak.count} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#04070f]/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand small />
        <button onClick={() => setNavOpen(!navOpen)} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white">☰</button>
      </header>
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden fade-in" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/70" />
          <div className="glass-strong absolute right-0 top-0 h-full w-72 space-y-1 p-5 scale-in" onClick={(e) => e.stopPropagation()}>
            <Brand />
            <div className="mt-6 space-y-1">
              {NAV.map((n) => (
                <NavItem key={n.id} item={n} active={view === n.id} onClick={() => go(n.id)} />
              ))}
            </div>
            <div className="pt-4">
              <GlowButton variant="outline" className="w-full" onClick={() => { setShowSettings(true); setNavOpen(false); }}>⚙ AI Provider</GlowButton>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="relative z-10 lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
          {view === "home" ? (
            <Home go={go} onSettings={() => setShowSettings(true)} />
          ) : (
            <div className="fade-in">
              {view === "roadmap" && <Roadmap />}
              {view === "skillgap" && <SkillGap />}
              {view === "resume" && <Resume />}
              {view === "interview" && <Interview />}
              {view === "learning" && <Learning />}
              {view === "projects" && <Projects />}
              {view === "graph" && <KnowledgeGraph />}
              {view === "progress" && <Progress />}
            </div>
          )}
        </div>
      </main>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );

  function Home({ go, onSettings }: { go: (v: View) => void; onSettings: () => void }) {
    return (
      <div className="space-y-16">
        {/* Hero */}
        <section className="grid items-center gap-8 pt-4 lg:grid-cols-2">
          <div className="space-y-6 rise-in">
            <Pill tone="cyan">✦ Career Intelligence Operating System</Pill>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Engineer your <span className="text-gradient">career</span> like a system.
            </h1>
            <p className="max-w-lg text-base text-slate-400 sm:text-lg">
              NEXUS turns ambition into an executable plan — roadmaps, skill gaps, resumes, interviews and growth analytics, all powered by a flexible AI core.
            </p>
            <div className="flex flex-wrap gap-3">
              <GlowButton onClick={() => go("roadmap")}>🧭 Generate My Roadmap</GlowButton>
              <GlowButton variant="outline" onClick={onSettings}>⚙ Configure AI</GlowButton>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Pill tone="slate">Groq</Pill>
              <Pill tone="slate">OpenRouter</Pill>
              <Pill tone="slate">Ollama</Pill>
              <Pill tone="slate">Offline Engine</Pill>
            </div>
          </div>
          <div className="float">
            <CareerCore />
          </div>
        </section>

        {/* Feature grid */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300/70">The Platform</p>
            <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Nine intelligence modules</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <button
                key={f.id}
                onClick={() => go(f.id as View)}
                className="glass hover-lift group rounded-2xl p-5 text-left rise-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="text-3xl transition-transform group-hover:scale-110">{f.icon}</div>
                <h3 className="mt-3 font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{f.desc}</p>
                <span className="mt-3 inline-block text-xs font-semibold text-cyan-300 opacity-0 transition group-hover:opacity-100">Open →</span>
              </button>
            ))}
          </div>
        </section>

        {/* Stats strip */}
        <section className="glass-strong grid gap-4 rounded-2xl p-6 text-center sm:grid-cols-3">
          <Stat value={`Lv ${level}`} label="Your Level" />
          <Stat value={`${mem.streak.count} 🔥`} label="Day Streak" />
          <Stat value={`${mem.saved.length}`} label="Saved Intelligence" />
        </section>

        <footer className="pb-8 text-center text-xs text-slate-600">
          NEXUS CAREER AI · Provider-agnostic · Your data stays in your browser
        </footer>
      </div>
    );
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-black text-gradient">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">{label}</p>
    </div>
  );
}

function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 glow-cyan">
        <span className="text-lg">✦</span>
      </div>
      <div>
        <p className={cn("font-black tracking-tight text-white", small ? "text-base" : "text-lg")}>NEXUS</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">Career AI</p>
      </div>
    </div>
  );
}

function NavItem({ item, active, onClick }: { item: { label: string; icon: string }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
        active ? "tab-active text-white" : "text-slate-400 hover:bg-white/5 hover:text-white",
      )}
    >
      <span className="w-5 text-center">{item.icon}</span>
      {item.label}
    </button>
  );
}

function ProviderCard({ onClick, provider, level, streak }: { onClick: () => void; provider: string; level: number; streak: number }) {
  return (
    <button onClick={onClick} className="glass hover-lift mt-4 w-full rounded-xl p-3 text-left">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-cyan-200">⚙ AI Provider</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
      </div>
      <p className="mt-1 truncate text-xs text-slate-400">{provider}</p>
      <div className="mt-2 flex gap-2 text-[10px] text-slate-500">
        <span>Lv {level}</span>·<span>{streak}🔥</span>
      </div>
    </button>
  );
}
