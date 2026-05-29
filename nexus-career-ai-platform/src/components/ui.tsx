import { cn } from "../utils/cn";
import type { ReactNode } from "react";

export function Panel({ className, children, style }: { className?: string; children: ReactNode; style?: React.CSSProperties }) {
  return <div className={cn("glass rounded-2xl", className)} style={style}>{children}</div>;
}

export function GlowButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  className,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "ghost" | "outline";
  className?: string;
  disabled?: boolean;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-cyan-500/90 to-violet-600/90 text-white hover:from-cyan-400 hover:to-violet-500 glow-cyan",
    ghost: "text-cyan-100/80 hover:text-white hover:bg-white/5",
    outline: "border border-cyan-400/30 text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-400/5",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-widest text-cyan-200/60">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400/70">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl bg-slate-900/60 border border-white/10 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/20";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputBase, "resize-y leading-relaxed", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputBase, "appearance-none cursor-pointer", props.className)}
    >
      {props.children}
    </select>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 fade-in">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
        <div className="absolute inset-0 rounded-full border-t-2 border-cyan-400 spin-slow" />
        <div className="absolute inset-2 rounded-full border-b-2 border-violet-400 spin-rev" />
        <div className="absolute inset-0 flex items-center justify-center text-lg pulse-core">✦</div>
      </div>
      <p className="text-sm text-cyan-200/70 tracking-wide">{label || "Synthesizing intelligence…"}</p>
    </div>
  );
}

export function SectionHeader({ kicker, title, desc }: { kicker: string; title: string; desc?: string }) {
  return (
    <div className="mb-6 rise-in">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300/70">{kicker}</p>
      <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h2>
      {desc && <p className="mt-2 max-w-2xl text-sm text-slate-400">{desc}</p>}
    </div>
  );
}

export function ScoreRing({ score, size = 120, label }: { score: number; size?: number; label?: string }) {
  const r = size / 2 - 10;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 80 ? "#34d399" : score >= 55 ? "#22d3ee" : "#f472b6";
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{score}</span>
        {label && <span className="text-[10px] uppercase tracking-widest text-slate-400">{label}</span>}
      </div>
    </div>
  );
}

export function Bar({ value, color = "from-cyan-400 to-violet-500" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r", color)}
        style={{ width: `${Math.max(2, Math.min(100, value))}%`, transition: "width 0.9s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>
  );
}

export function Pill({ children, tone = "cyan" }: { children: ReactNode; tone?: "cyan" | "violet" | "rose" | "emerald" | "slate" }) {
  const tones = {
    cyan: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
    violet: "bg-violet-500/15 text-violet-200 border-violet-400/30",
    rose: "bg-rose-500/15 text-rose-200 border-rose-400/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
    slate: "bg-white/5 text-slate-300 border-white/10",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <div className="text-4xl float">{icon}</div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="max-w-sm text-sm text-slate-400">{desc}</p>
    </div>
  );
}

export function SourceBadge({ source, note }: { source: "live" | "simulation"; note?: string }) {
  return (
    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
      <span className={cn("h-2 w-2 rounded-full", source === "live" ? "bg-emerald-400" : "bg-cyan-400")} />
      {source === "live" ? "Generated by live AI provider" : "Built-in intelligence engine"}
      {note && <span className="text-amber-300/70">· {note}</span>}
    </div>
  );
}
