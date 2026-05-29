import { useState } from "react";
import { useStore } from "../store";
import { computeATS } from "../lib/ats";
import { Ring } from "./Analytics";
import { Area, Btn } from "./ui";
import { useAI } from "../lib/useAI";
import { useToast } from "./AIToast";

export default function Analyzer() {
  const { active } = useStore();
  const ai = useAI();
  const toast = useToast();
  const [text, setText] = useState("");
  const [report, setReport] = useState<string | null>(null);
  const ats = computeATS(active.data);

  const analyze = async () => {
    const content = text.trim() || JSON.stringify(active.data);
    const out = await ai.generic(
      "analyze",
      `Analyze this resume for ATS readiness, readability, weak sections, and missing skills. Give 5 concise, actionable bullet points: "${content.slice(0, 3000)}"`,
      () =>
        [
          `ATS readiness is ${ats.score}/100 — ${ats.score >= 80 ? "strong" : "needs work"}.`,
          ats.metrics.impact < 50 ? "Add quantified metrics (numbers, %, $) to experience bullets." : "Good use of quantified impact.",
          active.data.skills.length < 8 ? "Expand skills to 8–12 role-specific keywords." : "Skills coverage looks solid.",
          active.data.summary.length < 120 ? "Strengthen the professional summary (2–3 punchy sentences)." : "Summary length is good.",
          "Ensure consistent date formats and reverse-chronological ordering.",
        ].join("\n"),
    );
    setReport(out);
    toast("Analysis complete", "ok");
  };

  return (
    <div className="space-y-4">
      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">🔍 Resume Analyzer</h3>
        <p className="mb-3 text-[12px] text-slate-500">Analyze your current resume, or paste another resume's text to evaluate it.</p>
        <Area rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="(Optional) Paste resume text — leave empty to analyze your current resume…" />
        <Btn variant="primary" className="mt-3 w-full" onClick={analyze} disabled={ai.busy === "analyze"}>
          {ai.busy === "analyze" ? "Analyzing…" : "Run Analysis"}
        </Btn>
      </div>

      <div className="nx-glass flex items-center justify-around rounded-2xl p-5">
        <Ring value={ats.score} label="ATS" size={84} />
        <Ring value={ats.metrics.readability} label="Readability" size={84} />
        <Ring value={ats.metrics.impact} label="Impact" size={84} />
      </div>

      {report && (
        <div className="nx-fade-up nx-glass rounded-2xl p-5">
          <h4 className="mb-2 text-[13px] font-semibold text-cyan-300">✦ AI Findings</h4>
          <div className="space-y-1.5">
            {report.split("\n").filter(Boolean).map((l, i) => (
              <div key={i} className="flex gap-2 text-[12.5px] text-slate-300">
                <span className="text-cyan-400">▸</span><span>{l.replace(/^[-•*\d.\s]+/, "")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
