import { useState } from "react";
import { useStore } from "../store";
import { useAI } from "../lib/useAI";
import { Btn } from "./ui";
import { useToast } from "./AIToast";

const TARGETS = [
  { key: "linkedin", label: "LinkedIn Headline + About", icon: "in" },
  { key: "github", label: "GitHub Bio", icon: "⌗" },
  { key: "portfolio", label: "Portfolio Tagline", icon: "◍" },
];

export default function ProfileOptimizer() {
  const { active } = useStore();
  const ai = useAI();
  const toast = useToast();
  const [results, setResults] = useState<Record<string, string>>({});

  const optimize = async (key: string, label: string) => {
    const d = active.data;
    const out = await ai.generic(
      "profile-" + key,
      `Write an optimized ${label} for ${d.contact.fullName || "a candidate"}, a ${d.targetRole || d.contact.title}. Skills: ${d.skills.join(", ")}. Summary: ${d.summary}. Make it keyword-rich and compelling.`,
      () => `${d.contact.title} | ${d.skills.slice(0, 4).join(" · ")} — passionate about building impactful products and shipping quality work.`,
    );
    setResults((r) => ({ ...r, [key]: out }));
  };

  return (
    <div className="space-y-4">
      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">🪄 Profile Optimizer</h3>
        <p className="text-[12px] text-slate-500">Generate keyword-rich copy for your professional profiles from your resume data.</p>
      </div>
      {TARGETS.map((t) => (
        <div key={t.key} className="nx-glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-[13px] font-semibold text-slate-200"><span className="text-cyan-400">{t.icon}</span>{t.label}</h4>
            <Btn variant="soft" disabled={ai.busy === "profile-" + t.key} onClick={() => optimize(t.key, t.label)}>
              {ai.busy === "profile-" + t.key ? "…" : "✦ Generate"}
            </Btn>
          </div>
          {results[t.key] && (
            <div className="nx-fade-up rounded-lg border border-white/5 bg-black/20 p-3">
              <p className="whitespace-pre-wrap text-[12.5px] leading-relaxed text-slate-300">{results[t.key]}</p>
              <button className="mt-2 text-[11px] text-cyan-400 hover:underline" onClick={() => { navigator.clipboard.writeText(results[t.key]); toast("Copied", "ok"); }}>Copy</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
