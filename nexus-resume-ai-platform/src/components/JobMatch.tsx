import { useState } from "react";
import { useStore } from "../store";
import { matchJob, type JobMatchResult } from "../lib/jobmatch";
import { Ring } from "./Analytics";
import { Area, Btn } from "./ui";
import { useToast } from "./AIToast";

export default function JobMatch() {
  const { active, patchData } = useStore();
  const toast = useToast();
  const [jd, setJd] = useState("");
  const [result, setResult] = useState<JobMatchResult | null>(null);

  const run = () => {
    if (jd.trim().length < 40) { toast("Paste a fuller job description (40+ chars)", "error"); return; }
    setResult(matchJob(active.data, jd));
  };

  return (
    <div className="space-y-4">
      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">🎯 Job Match Engine</h3>
        <p className="mb-3 text-[12px] text-slate-500">Paste a job description to compare against your resume.</p>
        <Area rows={7} value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste the full job description here…" />
        <Btn variant="primary" className="mt-3 w-full" onClick={run}>Analyze Match</Btn>
      </div>

      {result && (
        <div className="nx-fade-up space-y-4">
          <div className="nx-glass flex items-center justify-around rounded-2xl p-5">
            <Ring value={result.score} label="Match Score" size={104} />
            <div className="text-[12px] text-slate-400">
              <div><span className="text-emerald-400 font-semibold">{result.matched.length}</span> matched</div>
              <div><span className="text-rose-400 font-semibold">{result.missing.length}</span> missing</div>
              <div className="mt-1 text-slate-500">{result.totalKeywords} keywords scanned</div>
            </div>
          </div>

          {result.missing.length > 0 && (
            <div className="nx-glass rounded-2xl p-5">
              <h4 className="mb-2 text-[13px] font-semibold text-rose-300">Missing keywords — add to your resume</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missing.map((m) => (
                  <button key={m} onClick={() => {
                      if (!active.data.skills.some((s) => s.toLowerCase() === m.toLowerCase())) {
                        patchData({ skills: [...active.data.skills, m] });
                        toast(`Added "${m}" to skills`, "ok");
                      }
                    }}
                    className="rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[12px] text-rose-200 hover:bg-rose-400/20">
                    + {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="nx-glass rounded-2xl p-5">
            <h4 className="mb-2 text-[13px] font-semibold text-emerald-300">Matched keywords</h4>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.map((m) => (
                <span key={m} className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[12px] text-emerald-200">✓ {m}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
