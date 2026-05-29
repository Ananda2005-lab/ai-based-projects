import { useState } from "react";
import { runAI, type RunResult } from "../lib/ai";
import { bumpStreak, saveItem } from "../lib/memory";
import { Field, GlowButton, Input, Panel, Pill, SectionHeader, SourceBadge, Spinner, EmptyState } from "../components/ui";

export function Learning() {
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(12);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);
  const [open, setOpen] = useState<number | null>(0);

  async function generate() {
    if (!goal.trim()) return;
    setLoading(true);
    setRes(null);
    const r = await runAI("learning", { goal, weeks });
    setRes(r);
    setLoading(false);
    bumpStreak();
  }

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 06" title="Learning Plan Generator" desc="Turn a goal into a day-by-day study schedule with weekly objectives and resources." />

      <Panel className="grid gap-4 p-5 sm:grid-cols-[2fr_1fr_auto] rise-in">
        <Field label="Goal" hint="e.g. '3 month Data Science roadmap'">
          <Input value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="3 month Data Science roadmap" onKeyDown={(e) => e.key === "Enter" && generate()} />
        </Field>
        <Field label="Weeks">
          <Input type="number" min={1} max={24} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} />
        </Field>
        <div className="flex items-end"><GlowButton onClick={generate} disabled={loading} className="w-full">✦ Build Plan</GlowButton></div>
      </Panel>

      {loading && <Spinner label="Scheduling your study plan…" />}
      {!loading && !res && <EmptyState icon="📚" title="No plan yet" desc="Describe a goal and timeframe to get a structured study schedule." />}

      {!loading && res && (
        <div className="space-y-4 scale-in">
          <Panel className="flex items-center justify-between p-5">
            <div>
              <h3 className="text-lg font-bold text-white">{res.data.role} · {res.data.weeks} weeks</h3>
              <SourceBadge source={res.source} note={res.note} />
            </div>
            <GlowButton variant="outline" onClick={() => saveItem({ type: "learning", title: `${res.data.role} plan`, data: res.data })}>☆ Save</GlowButton>
          </Panel>
          <div className="space-y-3">
            {res.data.plan.map((wk: any, i: number) => (
              <Panel key={i} className="overflow-hidden hover-lift rise-in" style={{ animationDelay: `${i * 0.03}s` } as any}>
                <button className="flex w-full items-center justify-between p-4 text-left" onClick={() => setOpen(open === i ? null : i)}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-violet-600/30 text-sm font-bold text-white">{wk.week}</span>
                    <div>
                      <span className="font-semibold text-white">Week {wk.week} · {wk.focus}</span>
                      <p className="text-xs text-slate-400">{wk.goal}</p>
                    </div>
                  </div>
                  <span className={`text-cyan-300 transition-transform ${open === i ? "rotate-180" : ""}`}>▾</span>
                </button>
                {open === i && (
                  <div className="border-t border-white/10 p-4 fade-in">
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {wk.daily.map((d: string, j: number) => (
                        <li key={j} className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-slate-300"><span className="text-cyan-400">▸</span>{d}</li>
                      ))}
                    </ul>
                    <div className="mt-3"><Pill tone="violet">📌 {wk.resource}</Pill></div>
                  </div>
                )}
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
