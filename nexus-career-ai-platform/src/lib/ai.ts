import { loadSettings, PROVIDER_PRESETS, type AISettings } from "./settings";
import { simulate, type TaskKind } from "./simulation";

const SYSTEM = `You are NEXUS, an elite career intelligence engine. You ALWAYS respond with a single valid JSON object only — no markdown, no prose, no code fences. Follow the exact JSON shape requested.`;

const SHAPES: Record<TaskKind, string> = {
  roadmap: `{"title":string,"summary":string,"phases":[{"id":number,"title":string,"timeline":string,"milestones":[{"skill":string,"objective":string,"project":string}]}],"nextProjects":[{"title":string,"level":string,"desc":string}]}`,
  skillgap: `{"role":string,"overall":number,"skills":[{"skill":string,"level":number,"status":"strength"|"developing"|"missing"}],"priorities":[{"skill":string,"priority":string,"action":string}],"strategy":string}`,
  resume: `{"name":string,"role":string,"contact":string,"summary":string,"skills":string[],"experience":string[],"education":string,"atsScore":number}`,
  resume_analyze: `{"role":string,"atsScore":number,"foundKeywords":string[],"missingKeywords":string[],"sections":[{"name":string,"score":number,"tip":string}],"improvements":string[]}`,
  interview: `{"role":string,"difficulty":string,"type":string,"questions":[{"id":number,"question":string,"hint":string,"idealPoints":string[]}]}`,
  interview_feedback: `{"score":number,"strengths":string[],"improvements":string[],"summary":string}`,
  learning: `{"role":string,"weeks":number,"plan":[{"week":number,"focus":string,"goal":string,"daily":string[],"resource":string}]}`,
  projects: `{"role":string,"projects":[{"title":string,"level":string,"desc":string,"stack":string[]}]}`,
};

const PROMPTS: Record<TaskKind, (p: any) => string> = {
  roadmap: (p) => `Create a detailed 12-month career roadmap for someone whose goal is: "${p.goal}".`,
  skillgap: (p) => `Analyze the skill gap for target role "${p.role}". Current skills: "${p.current}". Rate each skill 0-100.`,
  resume: (p) => `Build an ATS-friendly resume from: ${JSON.stringify(p)}.`,
  resume_analyze: (p) => `Analyze this resume for the role "${p.role}". Resume text: """${p.text}""".`,
  interview: (p) => `Generate ${p.type} interview questions (${p.difficulty} difficulty) for a "${p.role}".`,
  interview_feedback: (p) => `Score and give feedback on this interview answer. Question: "${p.question}". Answer: """${p.answer}""".`,
  learning: (p) => `Create a ${p.weeks}-week learning plan for: "${p.goal}". Include daily tasks per week.`,
  projects: (p) => `Recommend portfolio projects for a "${p.role}", from beginner to advanced.`,
};

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fall through */
      }
    }
    throw new Error("Could not parse model response.");
  }
}

async function callOpenAICompatible(s: AISettings, kind: TaskKind, payload: any) {
  const preset = PROVIDER_PRESETS[s.provider];
  const baseUrl = s.baseUrl || preset.defaultBaseUrl;
  const model = s.model || preset.defaultModel;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (s.apiKey) headers["Authorization"] = `Bearer ${s.apiKey}`;
  if (s.provider === "openrouter") {
    headers["HTTP-Referer"] = "https://nexus-career.ai";
    headers["X-Title"] = "Nexus Career AI";
  }

  const body: any = {
    model,
    messages: [
      { role: "system", content: `${SYSTEM}\nReturn JSON matching exactly this shape: ${SHAPES[kind]}` },
      { role: "user", content: PROMPTS[kind](payload) },
    ],
    temperature: 0.7,
  };
  if (s.provider !== "ollama") body.response_format = { type: "json_object" };

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Provider error ${res.status}: ${t.slice(0, 160)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? "";
  return extractJson(content);
}

export interface RunResult<T = any> {
  data: T;
  source: "live" | "simulation";
  note?: string;
}

export async function runAI<T = any>(kind: TaskKind, payload: any): Promise<RunResult<T>> {
  const s = loadSettings();
  if (s.provider === "simulation") {
    await delay(450);
    return { data: simulate(kind, payload), source: "simulation" };
  }
  try {
    const data = await callOpenAICompatible(s, kind, payload);
    return { data, source: "live" };
  } catch (e: any) {
    // Graceful fallback so the product always works.
    return {
      data: simulate(kind, payload),
      source: "simulation",
      note: `Live provider failed (${e?.message || "unknown"}). Showing built-in intelligence instead.`,
    };
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
