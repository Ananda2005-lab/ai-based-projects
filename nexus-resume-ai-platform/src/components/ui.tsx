import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export function Field({
  label,
  ...props
}: { label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-medium text-slate-400">{label}</span>}
      <input
        {...props}
        className={cn(
          "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition",
          "focus:border-cyan-400/60 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20",
          props.className,
        )}
      />
    </label>
  );
}

export function Area({
  label,
  ...props
}: { label?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-[11px] font-medium text-slate-400">{label}</span>}
      <textarea
        {...props}
        className={cn(
          "w-full resize-y rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 outline-none transition",
          "focus:border-cyan-400/60 focus:bg-white/10 focus:ring-2 focus:ring-cyan-400/20",
          props.className,
        )}
      />
    </label>
  );
}

export function Btn({
  children,
  variant = "ghost",
  className,
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "soft" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "nx-btn-glow text-white shadow-lg",
    ghost: "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10",
    soft: "bg-cyan-400/10 text-cyan-300 hover:bg-cyan-400/20 border border-cyan-400/20",
    danger: "bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20",
  };
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
        styles[variant],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AIButton({ loading, onClick, label = "AI" }: { loading?: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-500/20 to-purple-500/20 px-2 py-1 text-[11px] font-semibold text-cyan-200 transition hover:from-cyan-500/30 hover:to-purple-500/30 disabled:opacity-50"
    >
      <span className={loading ? "nx-spin" : ""}>{loading ? "◌" : "✦"}</span> {label}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("nx-glass rounded-2xl p-4", className)}>{children}</div>;
}
