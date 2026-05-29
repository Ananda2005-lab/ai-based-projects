import { useMemo, useState } from "react";
import { useStore } from "../store";
import { computeATS } from "../lib/ats";
import { TEMPLATES, ACCENTS } from "../lib/templates";
import { exportPDF, exportJSON, exportDOCX } from "../lib/export";
import { isConfigured } from "../lib/ai";
import ResumePreview from "./ResumePreview";
import Editor from "./Editor";
import Analytics from "./Analytics";
import JobMatch from "./JobMatch";
import Analyzer from "./Analyzer";
import CoverLetter from "./CoverLetter";
import ProfileOptimizer from "./ProfileOptimizer";
import SettingsPanel from "./SettingsPanel";
import { useToast } from "./AIToast";
import { Btn } from "./ui";

type Tab = "build" | "analytics" | "match" | "analyze" | "cover" | "profiles";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "build", label: "Builder", icon: "✎" },
  { id: "analytics", label: "ATS", icon: "◎" },
  { id: "match", label: "Job Match", icon: "🎯" },
  { id: "analyze", label: "Analyzer", icon: "🔍" },
  { id: "cover", label: "Cover Letter", icon: "✉" },
  { id: "profiles", label: "Profiles", icon: "🪄" },
];

export default function Studio() {
  const { active, ai, profiles, setActiveId, addProfile, duplicateProfile, deleteProfile, renameProfile, setTemplate, setAccent, saveSnapshot, lastSaved } = useStore();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("build");
  const [showSettings, setShowSettings] = useState(false);
  const [showTpl, setShowTpl] = useState(false);
  const [showProfiles, setShowProfiles] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [editName, setEditName] = useState(false);

  const ats = useMemo(() => computeATS(active.data), [active.data]);
  const tpl = TEMPLATES.find((t) => t.id === active.template)!;
  const configured = isConfigured(ai);

  const scoreColor = ats.score >= 80 ? "#10b981" : ats.score >= 55 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex h-screen flex-col overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="nx-blob h-[40vw] w-[40vw] -left-[10vw] -top-[10vw]" style={{ background: "#0891b2" }} />
        <div className="nx-blob h-[35vw] w-[35vw] right-0 top-[30vh]" style={{ background: "#7c3aed", animationDelay: "4s" }} />
        <div className="nx-blob h-[30vw] w-[30vw] left-[30vw] bottom-0" style={{ background: "#0e7490", animationDelay: "8s" }} />
      </div>

      {/* TOP TOOLBAR */}
      <header className="nx-glass-strong nx-no-print z-30 flex items-center gap-3 border-b border-white/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="nx-pulse flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 text-sm font-black text-white">N</div>
          <div className="leading-none">
            <div className="text-sm font-bold tracking-tight"><span className="nx-text-gradient">NEXUS</span> <span className="text-slate-200">RESUME AI</span></div>
            <div className="text-[9px] text-slate-500">Luxury Career Branding Studio</div>
          </div>
        </div>

        {/* profile switcher */}
        <div className="relative ml-2">
          <button onClick={() => setShowProfiles((s) => !s)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-slate-200 hover:bg-white/10">
            <span className="max-w-[120px] truncate">{active.name}</span><span className="text-slate-500">▾</span>
          </button>
          {showProfiles && (
            <div className="nx-glass-strong nx-fade-up absolute left-0 top-full z-40 mt-1 w-60 rounded-xl p-2">
              {profiles.map((p) => (
                <div key={p.id} className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] ${p.id === active.id ? "bg-cyan-400/10 text-cyan-200" : "text-slate-300 hover:bg-white/5"}`}>
                  <button className="flex-1 truncate text-left" onClick={() => { setActiveId(p.id); setShowProfiles(false); }}>{p.name}</button>
                  {profiles.length > 1 && <button className="opacity-0 group-hover:opacity-100 text-rose-400/70" onClick={() => deleteProfile(p.id)}>✕</button>}
                </div>
              ))}
              <div className="mt-1 flex gap-1 border-t border-white/10 pt-2">
                <Btn variant="soft" className="flex-1 text-[11px]" onClick={() => { addProfile("New Resume " + (profiles.length + 1)); setShowProfiles(false); }}>+ New</Btn>
                <Btn className="flex-1 text-[11px]" onClick={() => { duplicateProfile(); setShowProfiles(false); }}>Duplicate</Btn>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* scores */}
          <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-1 md:flex">
            <div className="text-center"><div className="text-[9px] text-slate-500">ATS</div><div className="text-sm font-bold leading-none" style={{ color: scoreColor }}>{ats.score}</div></div>
            <div className="h-6 w-px bg-white/10" />
            <div className="text-center"><div className="text-[9px] text-slate-500">Skills</div><div className="text-sm font-bold leading-none text-cyan-300">{active.data.skills.length}</div></div>
          </div>

          {/* template */}
          <div className="relative">
            <button onClick={() => setShowTpl((s) => !s)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[12px] text-slate-200 hover:bg-white/10">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: tpl.swatch }} /> {tpl.name} <span className="text-slate-500">▾</span>
            </button>
            {showTpl && (
              <div className="nx-glass-strong nx-fade-up absolute right-0 top-full z-40 mt-1 w-72 rounded-xl p-2">
                <div className="grid grid-cols-2 gap-1.5">
                  {TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => { setTemplate(t.id); setShowTpl(false); }}
                      className={`rounded-lg border p-2.5 text-left transition ${active.template === t.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
                      <span className="mb-1 block h-1.5 w-8 rounded-full" style={{ background: t.swatch }} />
                      <div className="text-[12px] font-semibold text-slate-200">{t.name}</div>
                      <div className="text-[10px] text-slate-500">{t.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 border-t border-white/10 pt-2">
                  <div className="mb-1.5 text-[10px] text-slate-500">Accent color</div>
                  <div className="flex gap-1.5">
                    {ACCENTS.map((c) => (
                      <button key={c} onClick={() => setAccent(c)} className={`h-6 w-6 rounded-full transition ${active.accent === c ? "ring-2 ring-white/60 ring-offset-2 ring-offset-slate-900" : ""}`} style={{ background: c }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Btn onClick={() => { saveSnapshot(); toast("Snapshot saved", "ok"); }}>💾 Save</Btn>

          <div className="relative">
            <Btn variant="primary" onClick={() => setShowExport((s) => !s)}>⤓ Export</Btn>
            {showExport && (
              <div className="nx-glass-strong nx-fade-up absolute right-0 top-full z-40 mt-1 w-44 rounded-xl p-1.5">
                {[
                  { l: "PDF (Print)", f: () => exportPDF() },
                  { l: "DOCX", f: () => exportDOCX(active) },
                  { l: "JSON Profile", f: () => exportJSON(active) },
                ].map((o) => (
                  <button key={o.l} onClick={() => { o.f(); setShowExport(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-[12px] text-slate-300 hover:bg-white/10">{o.l}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => setShowSettings(true)} className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10">
            ⚙
            <span className={`absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ${configured ? "bg-emerald-400" : "bg-amber-400"}`} title={configured ? "AI connected" : "Offline AI"} />
          </button>
        </div>
      </header>

      {/* MAIN SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT WORKSPACE */}
        <div className="nx-no-print flex w-full flex-col border-r border-white/10 lg:w-[46%] xl:w-[42%]">
          {/* tabs */}
          <div className="nx-scroll flex gap-1 overflow-x-auto border-b border-white/10 px-3 py-2">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${tab === t.id ? "bg-gradient-to-r from-cyan-500/25 to-purple-500/25 text-white" : "text-slate-400 hover:bg-white/5"}`}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
          <div className="nx-scroll flex-1 overflow-y-auto p-3">
            <div className="nx-fade-up" key={tab}>
              {tab === "build" && (
                <>
                  <div className="mb-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    {editName ? (
                      <input autoFocus defaultValue={active.name} onBlur={(e) => { renameProfile(e.target.value || active.name); setEditName(false); }}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        className="flex-1 rounded bg-transparent text-sm font-semibold text-slate-100 outline-none" />
                    ) : (
                      <button onClick={() => setEditName(true)} className="flex-1 text-left text-sm font-semibold text-slate-100">{active.name} <span className="text-[11px] text-slate-500">✎</span></button>
                    )}
                    <span className="text-[10px] text-slate-500">{lastSaved ? "Saved ✓" : "Autosaving…"}</span>
                  </div>
                  <Editor />
                </>
              )}
              {tab === "analytics" && <Analytics />}
              {tab === "match" && <JobMatch />}
              {tab === "analyze" && <Analyzer />}
              {tab === "cover" && <CoverLetter />}
              {tab === "profiles" && <ProfileOptimizer />}
            </div>
          </div>
        </div>

        {/* RIGHT PREVIEW */}
        <div className="nx-scroll relative flex-1 overflow-auto p-6 lg:p-8">
          <div className="mx-auto" style={{ maxWidth: 820 }}>
            <div className="nx-no-print mb-3 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest text-slate-500">Live Preview</span>
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[10px] text-slate-400">{tpl.name} · A4</span>
            </div>
            <div className="nx-print-area mx-auto overflow-hidden rounded-xl bg-white shadow-2xl shadow-black/50 ring-1 ring-black/10" style={{ width: "100%", aspectRatio: "0.773", minHeight: 0 }}>
              <ResumePreview data={active.data} template={active.template} accent={active.accent} />
            </div>
            <div className="nx-no-print mt-3 text-center text-[11px] text-slate-600">
              Tip: Export → PDF (Print) and choose "Save as PDF" for a pixel-perfect resume.
            </div>
          </div>
        </div>
      </div>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}
