import type { AISettings } from "../types";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function endpointFor(s: AISettings): { url: string; headers: Record<string, string> } {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  switch (s.provider) {
    case "groq":
      if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}`;
      return { url: "https://api.groq.com/openai/v1/chat/completions", headers };
    case "openrouter":
      if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}`;
      return { url: "https://openrouter.ai/api/v1/chat/completions", headers };
    case "ollama":
      return {
        url: (s.baseUrl || "http://localhost:11434") + "/v1/chat/completions",
        headers,
      };
    case "custom":
      if (s.apiKey) headers.Authorization = `Bearer ${s.apiKey}`;
      return {
        url: (s.baseUrl || "") + "/chat/completions",
        headers,
      };
  }
}

/** Provider-agnostic chat. Throws if not configured so callers can fall back. */
export async function aiChat(settings: AISettings, messages: ChatMessage[]): Promise<string> {
  const usable =
    settings.provider === "ollama" ||
    (settings.apiKey && settings.apiKey.trim().length > 0);
  if (!usable) throw new Error("AI provider not configured");

  const { url, headers } = endpointFor(settings);
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: settings.model,
      messages,
      temperature: 0.7,
      max_tokens: 900,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`AI request failed (${res.status}): ${t.slice(0, 160)}`);
  }
  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty AI response");
  return content as string;
}

export function isConfigured(s: AISettings): boolean {
  return s.provider === "ollama" || !!(s.apiKey && s.apiKey.trim());
}

/* ----------------------- Offline heuristic fallbacks ----------------------- */

const ACTION_VERBS = [
  "Led", "Built", "Architected", "Designed", "Delivered", "Shipped",
  "Optimized", "Drove", "Spearheaded", "Launched", "Scaled", "Automated",
];

export function offlineSummary(role: string, skills: string[]): string {
  const r = role || "professional";
  const top = skills.slice(0, 4).join(", ") || "modern tooling";
  return `Results-driven ${r} with a track record of delivering high-impact work using ${top}. Combines strong technical execution with clear communication to turn complex problems into measurable outcomes. Passionate about quality, collaboration, and continuous improvement.`;
}

export function offlineBullets(raw: string, role: string): string[] {
  const base = raw.trim() || `work as ${role || "a professional"}`;
  const v = (i: number) => ACTION_VERBS[i % ACTION_VERBS.length];
  const clause = base.replace(/^i\s+/i, "").replace(/\.$/, "");
  return [
    `${v(0)} ${clause}, improving key outcomes and reliability.`,
    `${v(3)} cross-functional collaboration to ship features on schedule.`,
    `${v(6)} processes and tooling, reducing manual effort by ~30%.`,
  ];
}

export function offlineProjectDesc(name: string, tech: string): string {
  return `${name || "Project"} — built with ${tech || "modern web tech"}; focused on performance, clean architecture, and a great user experience. Delivered measurable improvements and positive user feedback.`;
}

export function offlineSkillSuggestions(role: string, existing: string[]): string[] {
  const r = role.toLowerCase();
  const map: Record<string, string[]> = {
    frontend: ["React", "TypeScript", "Next.js", "Tailwind CSS", "Accessibility", "Vitest", "Webpack", "Figma"],
    backend: ["Node.js", "PostgreSQL", "Redis", "Docker", "Kubernetes", "REST", "GraphQL", "AWS"],
    data: ["Python", "Pandas", "SQL", "Spark", "Airflow", "dbt", "Tableau", "scikit-learn"],
    product: ["Roadmapping", "User Research", "A/B Testing", "Analytics", "Stakeholder Mgmt", "Figma"],
    design: ["Figma", "Design Systems", "Prototyping", "User Research", "Motion Design", "Accessibility"],
    devops: ["Terraform", "Kubernetes", "CI/CD", "Prometheus", "AWS", "Linux", "Bash", "Docker"],
  };
  let pool: string[] = [];
  for (const key of Object.keys(map)) if (r.includes(key)) pool = pool.concat(map[key]);
  if (pool.length === 0)
    pool = ["Communication", "Leadership", "Problem Solving", "Project Management", "Git", "Agile", "Data Analysis", "Public Speaking"];
  const have = new Set(existing.map((s) => s.toLowerCase()));
  return [...new Set(pool)].filter((s) => !have.has(s.toLowerCase())).slice(0, 8);
}

export function offlineCoverLetter(name: string, role: string, company: string, summary: string): string {
  return `Dear Hiring Manager,

I'm excited to apply for the ${role || "open"} role at ${company || "your company"}. ${summary || "My background blends strong technical skills with a focus on measurable impact."}

In my recent work I've consistently delivered results — shipping reliable products, collaborating across teams, and raising the quality bar. I'm drawn to ${company || "your team"} because of your ambition and the chance to do work that matters.

I'd welcome the opportunity to discuss how I can contribute. Thank you for your time and consideration.

Sincerely,
${name || "Your Name"}`;
}
