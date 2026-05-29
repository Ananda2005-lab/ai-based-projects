import { useState } from "react";
import { runAI, type RunResult } from "../lib/ai";
import { bumpStreak, saveItem } from "../lib/memory";
import { Bar, Field, GlowButton, Panel, Pill, ScoreRing, SectionHeader, Select, SourceBadge, Spinner, EmptyState, Textarea } from "../components/ui";
import { SkillRadar } from "../components/SkillRadar";

const ROLES = ["AI Engineer", "Frontend Developer", "Cybersecurity Engineer", "UI Designer", "Game Developer", "Data Scientist"];

export function SkillGap() {
  const [role, setRole] = useState("AI Engineer");
  const [current, setCurrent] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);
  const [selected, setSelected] = useState<any>(null);

  async function analyze() {
    setLoading(true);
    setRes(null);
    setSelected(null);
    const r = await runAI("skillgap", { role, current });
    setRes(r);
    if (r.data.skills?.length) setSelected(r.data.skills[0]);
    setLoading(false);
    bumpStreak();
  }

  const statusTone: any = { strength: "emerald", developing: "cyan", missing: "rose" };
  const count = (st: string) => (res?.data.skills || []).filter((s: any) => s.status === st).length;

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 02" title="Skill Gap Analyzer" desc="Map your current abilities against your target role and reveal exactly what to learn next." />

      <Panel className="grid gap-4 p-5 sm:grid-cols-2 rise-in">
        <Field label="Target role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
        </Field>
        <div className="sm:row-span-2">
          <Field label="Your current skills" hint="Comma or line separated">
            <Textarea
              rows={4}
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="Python, basic ML, SQL, Git…"
            />
          </Field>
        </div>
        <div className="flex items-end">
          <GlowButton onClick={analyze} disabled={loading} className="w-full sm:w-auto">
            ✦ Analyze Gap
          </GlowButton>
        </div>
      </Panel>

      {loading && <Spinner label="Scanning your skill matrix…" />}
      {!loading && !res && <EmptyState icon="📊" title="No analysis yet" desc="Select a role and list your skills to reveal your gap map." />}

      {!loading && res && (
        <div className="space-y-6 scale-in">
          <Panel className="flex flex-col items-center gap-6 p-6 sm:flex-row">
            <ScoreRing score={res.data.overall} label="Readiness" />
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">{res.data.role} Readiness</h3>
              <p className="mt-1 text-sm text-slate-400">{res.data.strategy}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="emerald">💪 {count("strength")} strengths</Pill>
                <Pill tone="cyan">📈 {count("developing")} developing</Pill>
                <Pill tone="rose">⚠ {count("missing")} missing</Pill>
              </div>
              <SourceBadge source={res.source} note={res.note} />
            </div>
            <GlowButton variant="outline" onClick={() => saveItem({ type: "skillgap", title: `${res.data.role} gap`, data: res.data })}>
              ☆ Save
            </GlowButton>
          </Panel>

          {/* Radar centerpiece + selected detail */}
          <div className="grid gap-6 lg:grid-cols-5">
            <Panel className="p-5 lg:col-span-3 scale-in glow-cyan">
              <h4 className="mb-2 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Competency Radar</h4>
              <p className="mb-2 text-xs text-slate-500">Click any point to inspect a skill.</p>
              <SkillRadar skills={res.data.skills} selected={selected?.skill} onSelect={setSelected} />
              <div className="mt-2 flex justify-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#34d399" }} /> Strength</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#22d3ee" }} /> Developing</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#f472b6" }} /> Missing</span>
              </div>
            </Panel>

            <Panel className="p-5 lg:col-span-2">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Skill Detail</h4>
              {selected ? (
                <div className="space-y-4 fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-white">{selected.skill}</span>
                    <Pill tone={statusTone[selected.status]}>{selected.status}</Pill>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-slate-400">
                      <span>Proficiency</span><span>{selected.level}%</span>
                    </div>
                    <Bar value={selected.level} color={selected.status === "strength" ? "from-emerald-400 to-cyan-400" : selected.status === "developing" ? "from-cyan-400 to-violet-400" : "from-rose-400 to-rose-600"} />
                  </div>
                  <p className="text-sm text-slate-400">
                    {selected.status === "strength"
                      ? "This is a confirmed strength — keep it sharp and showcase it in your portfolio."
                      : selected.status === "developing"
                        ? "You're partway there. A focused project will push this into a strength."
                        : "A gap to close. Prioritize dedicated study plus one hands-on build."}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Select a skill on the radar to view details.</p>
              )}

              <h4 className="mb-2 mt-5 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Skill Matrix</h4>
              <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                {res.data.skills.map((s: any, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelected(s)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${selected?.skill === s.skill ? "border-cyan-400/50 bg-cyan-400/5" : "border-white/10 hover:border-white/25"}`}
                  >
                    <span className="text-slate-200">{s.skill}</span>
                    <span className="text-xs" style={{ color: s.status === "strength" ? "#34d399" : s.status === "developing" ? "#22d3ee" : "#f472b6" }}>{s.level}%</span>
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-5">
            <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Learning Priorities</h4>
            <div className="grid gap-3 sm:grid-cols-2">
              {res.data.priorities.map((p: any, i: number) => (
                <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover-lift rise-in" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{p.skill}</span>
                    <Pill tone={p.priority === "Critical" ? "rose" : p.priority === "High" ? "violet" : "slate"}>{p.priority}</Pill>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-400">{p.action}</p>
                </div>
              ))}
              {res.data.priorities.length === 0 && (
                <p className="text-sm text-emerald-300">No critical gaps — you're in great shape! 🎉</p>
              )}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
