import { useMemory, toggleMilestone, removeItem, removeGoal, levelInfo, clearAll } from "../lib/memory";
import { Bar, Panel, Pill, SectionHeader, ScoreRing, EmptyState } from "../components/ui";

const typeIcon: any = { roadmap: "🧭", skillgap: "📊", resume: "📄", learning: "📚", projects: "🚀", interview: "🎙" };

export function Progress() {
  const mem = useMemory();
  const { level, into } = levelInfo(mem.xp);
  const doneCount = mem.milestones.filter((m) => m.done).length;
  const completion = mem.milestones.length ? Math.round((doneCount / mem.milestones.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 08 · 09" title="Career Memory & Progress" desc="Everything NEXUS remembers about your journey — goals, saved intelligence, milestones and growth." />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Panel className="p-5 hover-lift">
          <p className="text-xs uppercase tracking-widest text-cyan-200/60">Level</p>
          <p className="mt-1 text-3xl font-bold text-white">{level}</p>
          <div className="mt-2"><Bar value={into} /></div>
          <p className="mt-1 text-xs text-slate-500">{mem.xp} XP total</p>
        </Panel>
        <Panel className="p-5 hover-lift">
          <p className="text-xs uppercase tracking-widest text-cyan-200/60">Streak</p>
          <p className="mt-1 text-3xl font-bold text-white">{mem.streak.count} 🔥</p>
          <p className="mt-2 text-xs text-slate-500">{mem.streak.lastActive ? `Last active ${mem.streak.lastActive}` : "Start today!"}</p>
        </Panel>
        <Panel className="p-5 hover-lift">
          <p className="text-xs uppercase tracking-widest text-cyan-200/60">Saved Items</p>
          <p className="mt-1 text-3xl font-bold text-white">{mem.saved.length}</p>
          <p className="mt-2 text-xs text-slate-500">{mem.goals.length} active goals</p>
        </Panel>
        <Panel className="flex items-center justify-center p-3 hover-lift">
          <ScoreRing score={completion} size={96} label="Done" />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Milestones */}
        <Panel className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-cyan-200/70">Milestones</h4>
            <Pill tone="emerald">{doneCount}/{mem.milestones.length}</Pill>
          </div>
          {mem.milestones.length === 0 ? (
            <EmptyState icon="🎯" title="No milestones" desc="Generate a roadmap to populate trackable milestones here." />
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {mem.milestones.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMilestone(m.id)}
                  className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left transition hover:border-cyan-400/40"
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${m.done ? "border-emerald-400 bg-emerald-400/20 text-emerald-300" : "border-white/20"}`}>
                    {m.done && "✓"}
                  </span>
                  <span className={`text-sm ${m.done ? "text-slate-500 line-through" : "text-slate-200"}`}>{m.label}</span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        {/* Goals */}
        <Panel className="p-5">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-widest text-cyan-200/70">Career Goals</h4>
          {mem.goals.length === 0 ? (
            <EmptyState icon="⭐" title="No goals saved" desc="Generate a roadmap and your goal will be remembered here." />
          ) : (
            <div className="space-y-2">
              {mem.goals.map((g) => (
                <div key={g} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  <span className="text-sm text-slate-200">🎯 {g}</span>
                  <button onClick={() => removeGoal(g)} className="text-xs text-slate-500 hover:text-rose-400">✕</button>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Saved library */}
      <Panel className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold uppercase tracking-widest text-cyan-200/70">Saved Intelligence Library</h4>
          {mem.saved.length > 0 && (
            <button onClick={clearAll} className="text-xs text-slate-500 hover:text-rose-400">Clear all data</button>
          )}
        </div>
        {mem.saved.length === 0 ? (
          <EmptyState icon="💾" title="Library empty" desc="Save any roadmap, resume, plan or analysis and it appears here." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {mem.saved.map((item) => (
              <div key={item.id} className="group rounded-xl border border-white/10 bg-white/[0.03] p-4 hover-lift">
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{typeIcon[item.type]}</span>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-slate-500 opacity-0 transition group-hover:opacity-100 hover:text-rose-400">✕</button>
                </div>
                <h5 className="mt-2 font-semibold text-white">{item.title}</h5>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                <div className="mt-2"><Pill tone="cyan">{item.type}</Pill></div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
