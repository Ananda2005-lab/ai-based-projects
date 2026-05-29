export type Provider = "simulation" | "groq" | "openrouter" | "ollama";

export interface AISettings {
  provider: Provider;
  apiKey: string;
  model: string;
  baseUrl: string; // for ollama / custom
}

const KEY = "nexus.ai.settings";

export const PROVIDER_PRESETS: Record<
  Provider,
  { label: string; defaultModel: string; defaultBaseUrl: string; needsKey: boolean; note: string }
> = {
  simulation: {
    label: "Built-in Intelligence (offline)",
    defaultModel: "nexus-core-v1",
    defaultBaseUrl: "",
    needsKey: false,
    note: "Works instantly with no API key. Deterministic career intelligence engine.",
  },
  groq: {
    label: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    needsKey: true,
    note: "Ultra-fast inference. Get a free key at console.groq.com.",
  },
  openrouter: {
    label: "OpenRouter",
    defaultModel: "meta-llama/llama-3.1-70b-instruct",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    needsKey: true,
    note: "Access hundreds of models through one key.",
  },
  ollama: {
    label: "Ollama (local)",
    defaultModel: "llama3.1",
    defaultBaseUrl: "http://localhost:11434/v1",
    needsKey: false,
    note: "Run models locally on your machine. No data leaves your device.",
  },
};

export function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...defaults(), ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaults();
}

export function saveSettings(s: AISettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function defaults(): AISettings {
  return {
    provider: "simulation",
    apiKey: "",
    model: PROVIDER_PRESETS.simulation.defaultModel,
    baseUrl: "",
  };
}
