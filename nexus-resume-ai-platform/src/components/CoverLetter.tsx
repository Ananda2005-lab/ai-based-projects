import { useState } from "react";
import { useStore } from "../store";
import { useAI } from "../lib/useAI";
import { Field, Area, Btn } from "./ui";
import { useToast } from "./AIToast";

export default function CoverLetter() {
  const { active } = useStore();
  const ai = useAI();
  const toast = useToast();
  const [company, setCompany] = useState("");
  const [role, setRole] = useState(active.data.targetRole);
  const [jd, setJd] = useState("");
  const [tone, setTone] = useState("Confident");
  const [out, setOut] = useState("");

  const generate = async () => {
    const text = await ai.coverLetter(
      active.data.contact.fullName, role || active.data.targetRole, company, active.data.summary, jd ? `Tone: ${tone}. ${jd}` : `Tone: ${tone}.`,
    );
    setOut(text);
  };

  return (
    <div className="space-y-4">
      <div className="nx-glass rounded-2xl p-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-200">✉ Cover Letter Generator</h3>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Inc." />
          <Field label="Role" value={role} onChange={(e) => setRole(e.target.value)} />
        </div>
        <div className="mt-2.5">
          <span className="mb-1 block text-[11px] font-medium text-slate-400">Tone</span>
          <div className="flex gap-1.5">
            {["Confident", "Warm", "Formal", "Bold"].map((t) => (
              <button key={t} onClick={() => setTone(t)} className={`rounded-lg px-3 py-1.5 text-[12px] transition ${tone === t ? "nx-btn-glow text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}>{t}</button>
            ))}
          </div>
        </div>
        <Area label="Job description (optional)" rows={4} className="mt-2.5" value={jd} onChange={(e) => setJd(e.target.value)} placeholder="Paste to tailor the letter…" />
        <Btn variant="primary" className="mt-3 w-full" onClick={generate} disabled={ai.busy === "cover"}>
          {ai.busy === "cover" ? "Writing…" : "Generate Cover Letter"}
        </Btn>
      </div>

      {out && (
        <div className="nx-fade-up nx-glass rounded-2xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-cyan-300">Your Cover Letter</h4>
            <Btn variant="soft" onClick={() => { navigator.clipboard.writeText(out); toast("Copied to clipboard", "ok"); }}>Copy</Btn>
          </div>
          <Area rows={14} value={out} onChange={(e) => setOut(e.target.value)} className="font-[ui-serif] text-[13px] leading-relaxed" />
        </div>
      )}
    </div>
  );
}
