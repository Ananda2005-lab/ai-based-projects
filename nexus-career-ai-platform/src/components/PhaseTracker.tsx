import { useMemory } from "../lib/memory";
import { Bar } from "./ui";

interface Phase {
  title: string;
  timeline: string;
  milestones: { skill: string }[];
}

// Computes completion for each phase by matching milestone labels against
// the global memory milestone store (which stores `skill` as the label).
export function PhaseTracker({ phases }: { phases: Phase[] }) {
  const mem = useMemory();
  const doneSet = new Set(mem.milestones.filter((m) => m.done).map((m) => m.label));

  const perPhase = phases.map((p) => {
    const total = p.milestones.length || 1;
    const done = p.milestones.filter((m) => doneSet.has(m.skill)).length;
    return { total, done, pct: Math.round((done / total) * 100) };
  });

  const totalAll = perPhase.reduce((s, p) => s + p.total, 0) || 1;
  const doneAll = perPhase.reduce((s, p) => s + p.done, 0);
  const overall = Math.round((doneAll / totalAll) * 100);

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-200/70">Journey Progress</h4>
        <span className="text-sm font-bold text-gradient">{overall}% complete</span>
      </div>

      {/* Horizontal beam tracker */}
      <div className="relative mb-5">
        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/10" />
        <div
          className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
          style={{ width: `${overall}%`, transition: "width 1s cubic-bezier(0.22,1,0.36,1)", boxShadow: "0 0 12px rgba(34,211,238,0.6)" }}
        />
        <div className="relative flex justify-between">
          {phases.map((p, i) => {
            const filled = perPhase[i].pct === 100;
            const active = perPhase[i].pct > 0;
            return (
              <div key={i} className="flex flex-col items-center" style={{ width: `${100 / phases.length}%` }}>
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition ${
                    filled
                      ? "border-emerald-400 bg-emerald-400/20 text-emerald-300"
                      : active
                        ? "border-cyan-400 bg-cyan-400/20 text-cyan-200"
                        : "border-white/20 bg-[#0a1426] text-slate-400"
                  }`}
                  style={filled ? { boxShadow: "0 0 12px rgba(52,211,153,0.6)" } : {}}
                >
                  {filled ? "✓" : i + 1}
                </span>
                <span className="mt-2 hidden text-center text-[10px] leading-tight text-slate-400 sm:block">{p.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-phase bars */}
      <div className="grid gap-3 sm:grid-cols-2">
        {phases.map((p, i) => (
          <div key={i}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-300">{p.title}</span>
              <span className="text-slate-500">{perPhase[i].done}/{perPhase[i].total}</span>
            </div>
            <Bar value={perPhase[i].pct} color={perPhase[i].pct === 100 ? "from-emerald-400 to-cyan-400" : "from-cyan-400 to-violet-500"} />
          </div>
        ))}
      </div>
    </div>
  );
}
