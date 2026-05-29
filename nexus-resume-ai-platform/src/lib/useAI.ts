import { useState } from "react";
import { useStore } from "../store";
import { useToast } from "../components/AIToast";
import {
  aiChat,
  isConfigured,
  offlineSummary,
  offlineBullets,
  offlineProjectDesc,
  offlineSkillSuggestions,
  offlineCoverLetter,
} from "./ai";

const SYS =
  "You are an elite resume writer. Be concise, professional, achievement-oriented, use strong action verbs, and quantify impact. Return ONLY the requested content with no preamble, headings, or markdown fences.";

export function useAI() {
  const { ai } = useStore();
  const toast = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const configured = isConfigured(ai);

  async function run(key: string, prompt: string, fallback: () => string): Promise<string> {
    setBusy(key);
    try {
      if (configured) {
        const out = await aiChat(ai, [
          { role: "system", content: SYS },
          { role: "user", content: prompt },
        ]);
        return out.trim();
      }
      toast("Using offline AI (add a provider key in Settings for live AI)", "info");
      return fallback();
    } catch (e) {
      toast((e as Error).message + " — using offline fallback", "error");
      return fallback();
    } finally {
      setBusy(null);
    }
  }

  return {
    busy,
    configured,
    async summary(role: string, skills: string[]) {
      return run(
        "summary",
        `Write a punchy 2-3 sentence professional resume summary for a ${role}. Skills: ${skills.join(", ")}.`,
        () => offlineSummary(role, skills),
      );
    },
    async bullets(raw: string, role: string): Promise<string[]> {
      const out = await run(
        "bullets",
        `Convert this rough description into 3 strong resume bullet points (one per line, no numbering, start with action verbs, quantify where possible). Role: ${role}. Description: "${raw}"`,
        () => offlineBullets(raw, role).join("\n"),
      );
      return out.split("\n").map((l) => l.replace(/^[-•▸*\d.\s]+/, "").trim()).filter(Boolean);
    },
    async projectDesc(name: string, tech: string) {
      return run(
        "project",
        `Write a 1-2 sentence resume project description. Name: ${name}. Tech: ${tech}.`,
        () => offlineProjectDesc(name, tech),
      );
    },
    async skills(role: string, existing: string[]): Promise<string[]> {
      const out = await run(
        "skills",
        `Suggest 8 missing, in-demand skills/keywords for a ${role} resume. Current skills: ${existing.join(", ")}. Return a comma-separated list only.`,
        () => offlineSkillSuggestions(role, existing).join(", "),
      );
      return out.split(/[,\n]/).map((s) => s.replace(/^[-•*\d.\s]+/, "").trim()).filter(Boolean).slice(0, 10);
    },
    async optimize(text: string, what: string) {
      return run(
        "optimize",
        `Rewrite/optimize this resume ${what} to be more impactful, concise, and ATS-friendly. Keep it truthful: "${text}"`,
        () => text,
      );
    },
    async coverLetter(name: string, role: string, company: string, summary: string, jd: string) {
      return run(
        "cover",
        `Write a personalized, confident cover letter (under 220 words). Candidate: ${name}, applying for ${role} at ${company}. Background: ${summary}. ${jd ? `Job description: ${jd}` : ""}`,
        () => offlineCoverLetter(name, role, company, summary),
      );
    },
    async generic(key: string, prompt: string, fb: () => string) {
      return run(key, prompt, fb);
    },
  };
}
