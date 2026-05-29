import { useState } from "react";
import { loadSettings, saveSettings, PROVIDER_PRESETS, type Provider } from "../lib/settings";
import { Field, GlowButton, Input, Select } from "./ui";

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState(loadSettings());
  const preset = PROVIDER_PRESETS[s.provider];

  function changeProvider(p: Provider) {
    const pr = PROVIDER_PRESETS[p];
    setS({ provider: p, apiKey: p === s.provider ? s.apiKey : "", model: pr.defaultModel, baseUrl: pr.defaultBaseUrl });
  }

  function save() {
    saveSettings(s);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 fade-in" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="glass-strong relative z-10 w-full max-w-lg rounded-2xl p-6 scale-in glow-cyan" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">AI Provider</h3>
            <p className="text-xs text-slate-400">Provider-agnostic. Works offline by default.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="space-y-4">
          <Field label="Provider">
            <Select value={s.provider} onChange={(e) => changeProvider(e.target.value as Provider)}>
              {Object.entries(PROVIDER_PRESETS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </Select>
          </Field>

          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3 text-xs text-cyan-100/80">
            {preset.note}
          </div>

          {s.provider !== "simulation" && (
            <>
              <Field label="Model">
                <Input value={s.model} onChange={(e) => setS({ ...s, model: e.target.value })} placeholder={preset.defaultModel} />
              </Field>
              <Field label="Base URL" hint="OpenAI-compatible endpoint">
                <Input value={s.baseUrl} onChange={(e) => setS({ ...s, baseUrl: e.target.value })} placeholder={preset.defaultBaseUrl} />
              </Field>
              {preset.needsKey && (
                <Field label="API Key" hint="Stored only in your browser (localStorage)">
                  <Input type="password" value={s.apiKey} onChange={(e) => setS({ ...s, apiKey: e.target.value })} placeholder="sk-…" />
                </Field>
              )}
            </>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-xs text-slate-400">
            🔒 If a live provider fails, NEXUS automatically falls back to the built-in engine so the product never breaks.
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <GlowButton variant="ghost" onClick={onClose}>Cancel</GlowButton>
          <GlowButton onClick={save}>Save Configuration</GlowButton>
        </div>
      </div>
    </div>
  );
}
