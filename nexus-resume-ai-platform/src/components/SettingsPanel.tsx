import { useState } from "react";
import { useStore } from "../store";
import { Field, Btn } from "./ui";
import { useToast } from "./AIToast";
import type { AIProvider } from "../types";

const PROVIDERS: { id: AIProvider; name: string; defaultModel: string; note: string }[] = [
  { id: "groq", name: "Groq", defaultModel: "llama-3.3-70b-versatile", note: "Fast & free tier. Get a key at console.groq.com" },
  { id: "openrouter", name: "OpenRouter", defaultModel: "openai/gpt-4o-mini", note: "Many models via one key. openrouter.ai" },
  { id: "ollama", name: "Ollama (Local)", defaultModel: "llama3.1", note: "Runs locally, no key. Needs CORS enabled." },
  { id: "custom", name: "Custom / OpenAI-compatible", defaultModel: "gpt-4o-mini", note: "Any OpenAI-compatible endpoint." },
];

export default function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { ai, setAI, versions, restoreSnapshot, saveSnapshot } = useStore();
  const toast = useToast();
  const [draft, setDraft] = useState(ai);

  const save = () => { setAI(draft); toast("AI settings saved", "ok"); onClose(); };

  return (
    <div className="nx-no-print fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="nx-glass-strong nx-fade-up nx-scroll max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">AI Provider</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          {PROVIDERS.map((p) => (
            <button key={p.id} onClick={() => setDraft({ ...draft, provider: p.id, model: p.defaultModel })}
              className={`rounded-xl border p-3 text-left transition ${draft.provider === p.id ? "border-cyan-400/50 bg-cyan-400/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}>
              <div className="text-[13px] font-semibold text-slate-200">{p.name}</div>
              <div className="mt-0.5 text-[10.5px] text-slate-500">{p.note}</div>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {draft.provider !== "ollama" && (
            <Field label="API Key" type="password" value={draft.apiKey} onChange={(e) => setDraft({ ...draft, apiKey: e.target.value })} placeholder="Stored locally in your browser only" />
          )}
          <Field label="Model" value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} />
          {(draft.provider === "ollama" || draft.provider === "custom") && (
            <Field label="Base URL" value={draft.baseUrl} onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })} placeholder={draft.provider === "ollama" ? "http://localhost:11434" : "https://api.example.com/v1"} />
          )}
        </div>
        <p className="mt-3 rounded-lg bg-amber-400/10 p-2.5 text-[11px] text-amber-300/90">
          ⓘ No key configured? The studio still works — AI features fall back to a built-in offline writer.
        </p>
        <div className="mt-4 flex gap-2">
          <Btn variant="primary" className="flex-1" onClick={save}>Save Settings</Btn>
          <Btn onClick={onClose}>Cancel</Btn>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Version History</h3>
            <Btn variant="soft" onClick={() => { saveSnapshot(); toast("Snapshot saved", "ok"); }}>+ Snapshot now</Btn>
          </div>
          {versions.length === 0 && <p className="text-[12px] text-slate-500">No snapshots yet.</p>}
          <div className="space-y-1.5">
            {versions.map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                <span className="text-[12px] text-slate-300">{v.label}</span>
                <button className="text-[11px] text-cyan-400 hover:underline" onClick={() => { restoreSnapshot(v.id); toast("Restored", "ok"); }}>Restore</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
