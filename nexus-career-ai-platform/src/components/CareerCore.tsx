const NODES = [
  { label: "Skills", r: 140, dur: 26, color: "#22d3ee", emoji: "⚡" },
  { label: "Roadmaps", r: 140, dur: 26, color: "#a855f7", emoji: "🧭", offset: 90 },
  { label: "Resume", r: 200, dur: 34, color: "#60a5fa", emoji: "📄", offset: 40 },
  { label: "Interview", r: 200, dur: 34, color: "#34d399", emoji: "🎙", offset: 160 },
  { label: "Projects", r: 200, dur: 34, color: "#f472b6", emoji: "🚀", offset: 260 },
  { label: "Growth", r: 140, dur: 26, color: "#fbbf24", emoji: "📈", offset: 220 },
];

export function CareerCore() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[460px] items-center justify-center">
      {/* rings */}
      <div className="absolute h-[280px] w-[280px] rounded-full border border-cyan-400/15 spin-slow" />
      <div className="absolute h-[400px] w-[400px] rounded-full border border-violet-400/10 spin-rev" />
      <div className="absolute h-[200px] w-[200px] rounded-full border border-white/5" />

      {/* glow core */}
      <div className="absolute h-44 w-44 rounded-full bg-gradient-to-br from-cyan-500/30 to-violet-600/30 blur-2xl pulse-core" />
      <div className="relative z-10 flex h-32 w-32 flex-col items-center justify-center rounded-full glass-strong glow-cyan pulse-core">
        <span className="text-2xl">🧠</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200">Career</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-200">Core</span>
      </div>

      {/* orbiting nodes */}
      {NODES.map((n) => (
        <div
          key={n.label}
          className="absolute left-1/2 top-1/2"
          style={{
            // @ts-expect-error custom prop
            "--r": `${n.r}px`,
            animation: `orbit ${n.dur}s linear infinite`,
            animationDelay: `${-(n.offset || 0) / 360 * n.dur}s`,
            marginLeft: -28,
            marginTop: -28,
          }}
        >
          <div
            className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl glass text-center hover-lift"
            style={{ boxShadow: `0 0 24px -6px ${n.color}` }}
          >
            <span className="text-lg">{n.emoji}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-200">{n.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
