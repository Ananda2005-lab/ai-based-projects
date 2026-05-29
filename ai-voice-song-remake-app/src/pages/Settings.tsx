import { useTheme } from "../context/ThemeContext";
import { useApp } from "../context/AppContext";

export function Settings() {
  const { theme, setTheme, themes } = useTheme();
  const { pushToast } = useApp();

  return (
    <div className="fade-in max-w-4xl space-y-6">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Preferences</div>
        <h1 className="font-display text-3xl md:text-4xl font-black">Settings</h1>
      </div>

      <section className="glass p-6 rounded-2xl">
        <h2 className="font-display text-xl font-bold mb-1">Appearance</h2>
        <p className="text-sm opacity-60 mb-4">Choose the vibe of your studio.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {themes.map((t) => {
            const active = theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => { setTheme(t.id); pushToast({ type: "success", title: `Theme: ${t.label}` }); }}
                className={`glass-2 p-4 rounded-xl text-left transition ${active ? "ring-2" : ""}`}
                style={active ? { borderColor: "var(--accent)" } : {}}
              >
                <div className="h-12 rounded-lg mb-3" style={{ background: t.swatch }} />
                <div className="font-semibold text-sm">{t.label}</div>
                {active && <div className="text-xs mt-1" style={{ color: "var(--accent)" }}>● Active</div>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass p-6 rounded-2xl">
        <h2 className="font-display text-xl font-bold mb-1">AI Engine</h2>
        <p className="text-sm opacity-60 mb-4">Configure inference quality.</p>
        <div className="space-y-4">
          <ToggleRow label="High-quality mode (slower)" defaultOn />
          <ToggleRow label="GPU acceleration" defaultOn />
          <ToggleRow label="Auto-normalize audio" defaultOn />
          <ToggleRow label="Save processed tracks locally" />
        </div>
      </section>

      <section className="glass p-6 rounded-2xl">
        <h2 className="font-display text-xl font-bold mb-1">Privacy</h2>
        <p className="text-sm opacity-60 mb-4">SONICFORGE processes audio on-device / your private backend. Nothing is shared.</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div className="glass-2 p-4 rounded-xl">
            <div className="font-semibold">Uploads</div>
            <div className="opacity-60 text-xs mt-1">Encrypted, auto-deleted after session.</div>
          </div>
          <div className="glass-2 p-4 rounded-xl">
            <div className="font-semibold">Voice models</div>
            <div className="opacity-60 text-xs mt-1">Stored locally, never shared.</div>
          </div>
          <div className="glass-2 p-4 rounded-xl">
            <div className="font-semibold">Generated tracks</div>
            <div className="opacity-60 text-xs mt-1">For personal use only.</div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useState } from "react";

function ToggleRow({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <button
      onClick={() => setOn((v) => !v)}
      className="flex items-center justify-between gap-3 glass-2 p-4 rounded-xl cursor-pointer w-full text-left"
    >
      <span className="text-sm">{label}</span>
      <span
        className="relative w-11 h-6 rounded-full transition"
        style={
          on
            ? { background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }
            : { background: "rgba(255,255,255,0.1)" }
        }
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
          style={{ left: on ? "calc(100% - 1.375rem)" : "0.125rem" }}
        />
      </span>
    </button>
  );
}
