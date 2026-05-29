import { useState } from "react";
import { runAI, type RunResult } from "../lib/ai";
import { bumpStreak, saveItem } from "../lib/memory";
import { Field, GlowButton, Input, Panel, Pill, SectionHeader, SourceBadge, Spinner, EmptyState } from "../components/ui";

const levelTone: any = { Beginner: "emerald", Intermediate: "cyan", Advanced: "violet" };

export function Projects() {
  const [role, setRole] = useState("AI Engineer");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<RunResult | null>(null);

  async function generate() {
    setLoading(true);
    setRes(null);
    const r = await runAI("projects", { role });
    setRes(r);
    setLoading(false);
    bumpStreak();
  }

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 07" title="Project Recommendation Engine" desc="Get portfolio-worthy builds tailored to your target role, from first steps to advanced." />

      <Panel className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] rise-in">
        <Field label="Target role"><Input value={role} onChange={(e) => setRole(e.target.value)} placeholder="AI Engineer" onKeyDown={(e) => e.key === "Enter" && generate()} /></Field>
        <div className="flex items-end"><GlowButton onClick={generate} disabled={loading} className="w-full">🚀 Recommend Projects</GlowButton></div>
      </Panel>

      {loading && <Spinner label="Designing project ideas…" />}
      {!loading && !res && <EmptyState icon="🚀" title="No ideas yet" desc="Enter a role to receive tailored portfolio project ideas." />}

      {!loading && res && (
        <div className="space-y-4 scale-in">
          <Panel className="flex items-center justify-between p-4">
            <p className="text-sm text-slate-300">Projects for <span className="font-semibold text-white">{res.data.role}</span></p>
            <GlowButton variant="outline" onClick={() => saveItem({ type: "projects", title: `${res.data.role} projects`, data: res.data })}>☆ Save</GlowButton>
          </Panel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {res.data.projects.map((p: any, i: number) => (
              <Panel key={i} className="flex flex-col gap-2 p-5 hover-lift rise-in" style={{ animationDelay: `${i * 0.05}s` }}>
                <Pill tone={levelTone[p.level] || "slate"}>{p.level}</Pill>
                <h4 className="text-lg font-bold text-white">{p.title}</h4>
                <p className="flex-1 text-sm text-slate-400">{p.desc}</p>
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {(p.stack || []).map((s: string, j: number) => (
                    <span key={j} className="rounded bg-white/5 px-2 py-0.5 text-xs text-cyan-200">{s}</span>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
          <SourceBadge source={res.source} note={res.note} />
        </div>
      )}
    </div>
  );
}
