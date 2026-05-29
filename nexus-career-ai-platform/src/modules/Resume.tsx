import { useState } from "react";
import { runAI, type RunResult } from "../lib/ai";
import { bumpStreak, saveItem } from "../lib/memory";
import { Bar, Field, GlowButton, Input, Panel, Pill, ScoreRing, SectionHeader, SourceBadge, Spinner, EmptyState, Textarea } from "../components/ui";
import { cn } from "../utils/cn";
import { liveAtsScore } from "../lib/simulation";

const ACCENTS = [
  { id: "cyan", label: "Cyan", color: "#0891b2" },
  { id: "violet", label: "Violet", color: "#7c3aed" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "slate", label: "Slate", color: "#334155" },
];

export function Resume() {
  const [tab, setTab] = useState<"build" | "analyze">("build");
  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 04" title="Resume Intelligence" desc="Build an ATS-optimized resume, or analyze an existing one for instant scoring." />
      <div className="inline-flex rounded-xl border border-white/10 p-1">
        {(["build", "analyze"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-lg px-5 py-2 text-sm font-semibold capitalize transition", tab === t ? "tab-active text-white" : "text-slate-400 hover:text-white")}
          >
            {t === "build" ? "🛠 Builder" : "🔍 Analyzer"}
          </button>
        ))}
      </div>
      {tab === "build" ? <Builder /> : <Analyzer />}
    </div>
  );
}

interface ResumeDoc {
  name: string;
  role: string;
  contact: string;
  summary: string;
  skills: string[];
  experience: string[];
  education: string;
}

function Builder() {
  const [form, setForm] = useState({ fullName: "", role: "AI Engineer", contact: "", summary: "", skills: "", experience: "", education: "" });
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState<ResumeDoc | null>(null);
  const [source, setSource] = useState<RunResult | null>(null);
  const [accent, setAccent] = useState(ACCENTS[0]);

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.value });

  async function build() {
    setLoading(true);
    setDoc(null);
    const r = await runAI("resume", form);
    setSource(r);
    setDoc({
      name: r.data.name,
      role: r.data.role,
      contact: r.data.contact,
      summary: r.data.summary,
      skills: r.data.skills,
      experience: r.data.experience,
      education: r.data.education,
    });
    setLoading(false);
    bumpStreak();
  }

  // Live edit handlers (after generation)
  const setDocField = (k: keyof ResumeDoc, v: any) => doc && setDoc({ ...doc, [k]: v });
  const live = doc ? liveAtsScore(doc) : null;
  const accentColor = accent.color;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left: generator OR live editor */}
      {!doc ? (
        <Panel className="space-y-4 p-5 rise-in">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={form.fullName} onChange={set("fullName")} placeholder="Jordan Rivera" /></Field>
            <Field label="Target role"><Input value={form.role} onChange={set("role")} placeholder="AI Engineer" /></Field>
          </div>
          <Field label="Contact"><Input value={form.contact} onChange={set("contact")} placeholder="email · linkedin · github" /></Field>
          <Field label="Professional summary" hint="Leave blank to let AI write it"><Textarea rows={2} value={form.summary} onChange={set("summary")} /></Field>
          <Field label="Skills" hint="Comma separated"><Textarea rows={2} value={form.skills} onChange={set("skills")} placeholder="Python, PyTorch, Docker…" /></Field>
          <Field label="Experience" hint="One bullet per line"><Textarea rows={3} value={form.experience} onChange={set("experience")} /></Field>
          <Field label="Education"><Input value={form.education} onChange={set("education")} /></Field>
          <GlowButton onClick={build} disabled={loading} className="w-full">✦ Generate Resume</GlowButton>
        </Panel>
      ) : (
        <Panel className="space-y-4 p-5 rise-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-cyan-200/70">Live Editor</h4>
            <button onClick={() => setDoc(null)} className="text-xs text-slate-400 hover:text-cyan-300">↺ New resume</button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name"><Input value={doc.name} onChange={(e) => setDocField("name", e.target.value)} /></Field>
            <Field label="Role"><Input value={doc.role} onChange={(e) => setDocField("role", e.target.value)} /></Field>
          </div>
          <Field label="Contact"><Input value={doc.contact} onChange={(e) => setDocField("contact", e.target.value)} /></Field>
          <Field label="Summary"><Textarea rows={3} value={doc.summary} onChange={(e) => setDocField("summary", e.target.value)} /></Field>
          <Field label="Skills" hint="Comma separated"><Textarea rows={2} value={doc.skills.join(", ")} onChange={(e) => setDocField("skills", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} /></Field>
          <Field label="Experience" hint="One bullet per line"><Textarea rows={4} value={doc.experience.join("\n")} onChange={(e) => setDocField("experience", e.target.value.split("\n"))} /></Field>
          <Field label="Education"><Input value={doc.education} onChange={(e) => setDocField("education", e.target.value)} /></Field>

          {/* Live ATS checklist */}
          {live && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200/70">Live ATS Checks</p>
              <div className="space-y-1.5">
                {live.checks.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={c.ok ? "text-emerald-400" : "text-slate-500"}>{c.ok ? "✓" : "○"}</span>
                    <span className={c.ok ? "text-slate-300" : "text-slate-500"}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Panel>
      )}

      {/* Right: preview */}
      <div>
        {loading && <Panel className="p-5"><Spinner label="Composing your resume…" /></Panel>}
        {!loading && !doc && <Panel className="p-5"><EmptyState icon="📄" title="Live preview" desc="Fill the form and generate to see an ATS-ready resume here." /></Panel>}
        {!loading && doc && live && (
          <div className="space-y-4 scale-in">
            <Panel className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <ScoreRing score={live.score} size={70} label="ATS" />
                <div>
                  <p className="text-sm font-semibold text-white">Dynamic ATS Score</p>
                  <p className="text-xs text-slate-400">Updates live as you edit</p>
                  {source && <SourceBadge source={source.source} note={source.note} />}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <GlowButton variant="outline" onClick={() => window.print()}>⬇ Print / PDF</GlowButton>
                <GlowButton variant="outline" onClick={() => saveItem({ type: "resume", title: `${doc.role} resume`, data: { ...doc, atsScore: live.score } })}>☆ Save</GlowButton>
              </div>
            </Panel>

            {/* Accent theme picker */}
            <Panel className="flex items-center gap-3 p-3">
              <span className="text-xs text-slate-400">Accent</span>
              {ACCENTS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccent(a)}
                  className={cn("h-6 w-6 rounded-full border-2 transition", accent.id === a.id ? "scale-110 border-white" : "border-transparent")}
                  style={{ background: a.color }}
                  aria-label={a.label}
                />
              ))}
            </Panel>

            <div id="resume-print" className="rounded-2xl bg-white p-8 text-slate-800 shadow-2xl">
              <div className="border-b-2 pb-3" style={{ borderColor: accentColor }}>
                <h2 className="text-2xl font-bold text-slate-900">{doc.name}</h2>
                <p className="text-sm font-semibold" style={{ color: accentColor }}>{doc.role}</p>
                <p className="mt-1 text-xs text-slate-500">{doc.contact}</p>
              </div>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Summary</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{doc.summary}</p>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Skills</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {doc.skills.map((s, i) => (
                  <span key={i} className="rounded px-2 py-0.5 text-xs text-slate-700" style={{ background: `${accentColor}1a` }}>{s}</span>
                ))}
              </div>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Experience</h3>
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {doc.experience.filter(Boolean).map((e, i) => (
                  <li key={i}>{e.startsWith("•") ? e : `• ${e}`}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-xs font-bold uppercase tracking-widest" style={{ color: accentColor }}>Education</h3>
              <p className="mt-1 text-sm text-slate-700">{doc.education}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Analyzer() {
  const [text, setText] = useState("");
  const [role, setRole] = useState("AI Engineer");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);

  async function analyze() {
    if (!text.trim()) return;
    setLoading(true);
    setRes(null);
    const r = await runAI("resume_analyze", { text, role });
    setRes(r);
    setLoading(false);
    bumpStreak();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel className="space-y-4 p-5 rise-in">
        <Field label="Target role"><Input value={role} onChange={(e) => setRole(e.target.value)} /></Field>
        <Field label="Paste your resume text" hint="Copy from your PDF/DOC and paste here">
          <Textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste resume content…" />
        </Field>
        <GlowButton onClick={analyze} disabled={loading} className="w-full">🔍 Analyze Resume</GlowButton>
      </Panel>

      <div>
        {loading && <Panel className="p-5"><Spinner label="Running ATS scan…" /></Panel>}
        {!loading && !res && <Panel className="p-5"><EmptyState icon="🔍" title="No analysis yet" desc="Paste a resume to get ATS scoring, keyword gaps and fixes." /></Panel>}
        {!loading && res && (
          <div className="space-y-4 scale-in">
            <Panel className="flex items-center gap-4 p-5">
              <ScoreRing score={res.data.atsScore} label="ATS" />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white">ATS Readiness</h3>
                  <Pill tone={res.data.atsScore >= 80 ? "emerald" : res.data.atsScore >= 55 ? "cyan" : "rose"}>
                    {res.data.atsScore >= 80 ? "Strong" : res.data.atsScore >= 55 ? "Needs work" : "At risk"}
                  </Pill>
                </div>
                <p className="text-xs text-slate-400">vs. {res.data.role} requirements</p>
                <SourceBadge source={res.source} note={res.note} />
              </div>
            </Panel>
            <Panel className="space-y-3 p-5">
              {res.data.sections.map((s: any, i: number) => (
                <div key={i}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-slate-200">{s.name}</span>
                    <span className="text-cyan-300">{s.score}%</span>
                  </div>
                  <Bar value={s.score} />
                  <p className="mt-1 text-xs text-slate-500">{s.tip}</p>
                </div>
              ))}
            </Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <Panel className="p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-300/70">Found Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {res.data.foundKeywords.map((k: string, i: number) => <Pill key={i} tone="emerald">{k}</Pill>)}
                </div>
              </Panel>
              <Panel className="p-4">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-rose-300/70">Missing Keywords</h4>
                <div className="flex flex-wrap gap-1.5">
                  {res.data.missingKeywords.map((k: string, i: number) => <Pill key={i} tone="rose">{k}</Pill>)}
                </div>
              </Panel>
            </div>
            <Panel className="p-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200/70">Improvements</h4>
              <ul className="space-y-2">
                {res.data.improvements.map((im: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-cyan-400">→</span>{im}</li>
                ))}
              </ul>
            </Panel>
          </div>
        )}
      </div>
    </div>
  );
}
