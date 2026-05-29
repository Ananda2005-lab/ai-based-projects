import { useState } from "react";
import { runAI, type RunResult } from "../lib/ai";
import { addGoal, bumpStreak, saveItem, syncMilestones, toggleMilestone, useMemory } from "../lib/memory";
import { Field, GlowButton, Input, Panel, Pill, SectionHeader, SourceBadge, Spinner, EmptyState } from "../components/ui";
import { PhaseTracker } from "../components/PhaseTracker";

const EXAMPLES = ["I want to become an AI Engineer", "Frontend Developer", "Cybersecurity Engineer", "Data Scientist"];

export function Roadmap() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);
  const [open, setOpen] = useState<number | null>(0);
  const mem = useMemory();
  const doneSet = new Set(mem.milestones.filter((m) => m.done).map((m) => m.label));
  const milestoneId = (skill: string) => mem.milestones.find((m) => m.label === skill)?.id;

  async function generate(g?: string) {
    const target = (g ?? goal).trim();
    if (!target) return;
    setGoal(target);
    setLoading(true);
    setRes(null);
    const r = await runAI("roadmap", { goal: target });
    setRes(r);
    setLoading(false);
    addGoal(target);
    bumpStreak();
    const all = (r.data.phases || []).flatMap((p: any) => p.milestones.map((m: any) => ({ label: `${m.skill}` })));
    syncMilestones(all);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        kicker="Module 01"
        title="Career Roadmap Generator"
        desc="Describe your destination. NEXUS engineers a living, milestone-based path to get you there."
      />

      <Panel className="p-5 rise-in">
        <Field label="Your career goal" hint="e.g. 'I want to become an AI Engineer'">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder="I want to become a…"
            />
            <GlowButton onClick={() => generate()} disabled={loading}>
              ✦ Generate Path
            </GlowButton>
          </div>
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => generate(e)}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
            >
              {e}
            </button>
          ))}
        </div>
      </Panel>

      {loading && <Spinner label="Charting your career trajectory…" />}

      {!loading && !res && (
        <EmptyState icon="🧭" title="No roadmap yet" desc="Enter a goal above and NEXUS will architect your full progression." />
      )}

      {!loading && res && (
        <div className="space-y-6 scale-in">
          <Panel className="p-5 glow-cyan">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">{res.data.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{res.data.summary}</p>
              </div>
              <GlowButton
                variant="outline"
                onClick={() => saveItem({ type: "roadmap", title: res.data.title, data: res.data })}
              >
                ☆ Save
              </GlowButton>
            </div>
            <SourceBadge source={res.source} note={res.note} />
          </Panel>

          {/* Live progress tracker */}
          {res.data.phases?.length > 0 && <PhaseTracker phases={res.data.phases} />}

          {/* Timeline */}
          <div className="relative space-y-4 pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-cyan-400/60 via-violet-400/40 to-transparent" />
            {res.data.phases?.map((phase: any, idx: number) => (
              <div key={phase.id} className="relative rise-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                <div className="absolute -left-[18px] top-5 h-3.5 w-3.5 rounded-full bg-cyan-400 glow-cyan" />
                <Panel className="overflow-hidden hover-lift">
                  <button
                    className="flex w-full items-center justify-between gap-3 p-5 text-left"
                    onClick={() => setOpen(open === idx ? null : idx)}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{phase.title}</span>
                        <Pill tone="violet">{phase.timeline}</Pill>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">
                        {phase.milestones.filter((m: any) => doneSet.has(m.skill)).length}/{phase.milestones.length} milestones complete
                      </p>
                    </div>
                    <span className={`text-cyan-300 transition-transform ${open === idx ? "rotate-180" : ""}`}>▾</span>
                  </button>
                  {open === idx && (
                    <div className="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-2 fade-in">
                      {phase.milestones.map((m: any, i: number) => {
                        const id = milestoneId(m.skill);
                        const done = doneSet.has(m.skill);
                        return (
                          <div
                            key={i}
                            className={`rounded-xl border p-4 transition hover-lift ${done ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/10 bg-white/[0.03]"}`}
                          >
                            <div className="flex items-start gap-2">
                              <button
                                onClick={() => id && toggleMilestone(id)}
                                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs transition ${
                                  done ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : "border-white/25 text-transparent hover:border-cyan-400"
                                }`}
                                aria-label="Toggle milestone"
                              >
                                ✓
                              </button>
                              <span className={`font-semibold ${done ? "text-slate-400 line-through" : "text-white"}`}>{m.skill}</span>
                            </div>
                            <p className="mt-1.5 pl-7 text-xs text-slate-400">{m.objective}</p>
                            <div className="mt-2 pl-7">
                              <Pill tone="cyan">🚀 {m.project}</Pill>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Panel>
              </div>
            ))}
          </div>

          {res.data.nextProjects?.length > 0 && (
            <Panel className="p-5">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Recommended Projects</h4>
              <div className="grid gap-3 sm:grid-cols-3">
                {res.data.nextProjects.map((p: any, i: number) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover-lift">
                    <Pill tone="emerald">{p.level}</Pill>
                    <h5 className="mt-2 font-semibold text-white">{p.title}</h5>
                    <p className="mt-1 text-xs text-slate-400">{p.desc}</p>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}
    </div>
  );
}
