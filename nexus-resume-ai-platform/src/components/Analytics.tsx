import { useMemo } from "react";
import { useStore } from "../store";
import { computeATS } from "../lib/ats";

function scoreColor(s: number) {
  if (s >= 80) return "#10b981";
  if (s >= 55) return "#f59e0b";
  return "#ef4444";
}

export function Ring({ value, label, size = 84 }: { value: number; label: string; size?: number }) {
  const r = size / 2 - 7;
  const c = 2 * Math.PI * r;
  const col = scoreColor(value);
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (value / 100) * c} style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(0.16,1,0.3,1)" }} />
      </svg>
      <div className="-mt-[58px] mb-[20px] text-center" style={{ width: size }}>
        <div className="text-xl font-bold" style={{ color: col }}>{value}</div>
        <div className="text-[9px] text-slate-500">/ 100</div>
      </div>
      <div className="text-[11px] font-medium text-slate-300">{label}</div>
    </div>
  );
}

function Radar({ metrics }: { metrics: Record<string, number> }) {
  const keys = Object.keys(metrics);
  const n = keys.length;
  const cx = 95, cy = 95, R = 70;
  const pt = (i: number, val: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rr = (val / 100) * R;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const poly = keys.map((k, i) => pt(i, metrics[k]).join(",")).join(" ");
  const labels: Record<string, string> = { readability: "Readability", impact: "Impact", completeness: "Complete", keywords: "Keywords" };
  const labelPt = (i: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + (R + 12) * Math.cos(a), cy + (R + 12) * Math.sin(a)];
  };
  return (
    <svg width={190} height={190} viewBox="-12 -8 214 206" className="mx-auto">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <polygon key={g} points={keys.map((_, i) => pt(i, g * 100).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.07)" />
      ))}
      {keys.map((_, i) => { const [x, y] = pt(i, 100); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.07)" />; })}
      <polygon points={poly} fill="rgba(34,211,238,0.18)" stroke="#22d3ee" strokeWidth={1.5} />
      {keys.map((k, i) => { const [x, y] = labelPt(i); return <text key={k} x={x} y={y} fontSize={8.5} fill="#94a3b8" textAnchor="middle" dominantBaseline="middle">{labels[k] || k}</text>; })}
    </svg>
  );
}


export default function Analytics() {
  const { active } = useStore();
  const ats = useMemo(() => computeATS(active.data), [active.data]);

  return (
    <div className="space-y-4">
      <div className="nx-glass rounded-2xl p-5">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Live ATS Score</h3>
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">real-time</span>
        </div>
        <div className="flex items-center justify-around">
          <Ring value={ats.score} label="ATS Readiness" size={104} />
          <div className="flex-1">
            <Radar metrics={ats.metrics} />
          </div>
        </div>
      </div>

      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">Optimization Checklist</h3>
        <div className="space-y-2">
          {ats.checks.map((c, i) => (
            <div key={i} className="flex items-start gap-2.5 text-[12px]">
              <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full text-[9px] ${c.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/15 text-rose-400"}`}>{c.ok ? "✓" : "!"}</span>
              <div>
                <div className={c.ok ? "text-slate-300" : "text-slate-200"}>{c.label}</div>
                {!c.ok && <div className="text-[11px] text-amber-400/80">{c.hint}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-200">Skills Coverage</h3>
        <div className="mb-1 flex justify-between text-[11px] text-slate-400">
          <span>{active.data.skills.length} skills listed</span>
          <span>{Math.min(100, active.data.skills.length * 8)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-700" style={{ width: `${Math.min(100, active.data.skills.length * 8)}%` }} />
        </div>
        <p className="mt-3 text-[11px] text-slate-500">
          Tip: 10+ relevant, role-specific keywords maximize ATS parsing. Use the Skills "Suggest" button in the editor.
        </p>
      </div>
    </div>
  );
}
