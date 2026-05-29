import type { ResumeData } from "../types";

export interface ATSCheck {
  label: string;
  ok: boolean;
  weight: number;
  hint: string;
}

export interface ATSResult {
  score: number;
  checks: ATSCheck[];
  metrics: { readability: number; impact: number; completeness: number; keywords: number };
}

const QUANT = /\d|%|\$|million|thousand|users|x\b/i;
const WEAK = ["responsible for", "worked on", "helped with", "duties included", "tasked with"];

export function computeATS(d: ResumeData): ATSResult {
  const checks: ATSCheck[] = [];
  const add = (label: string, ok: boolean, weight: number, hint: string) =>
    checks.push({ label, ok, weight, hint });

  add("Contact email present", !!d.contact.email, 8, "Add a professional email address.");
  add("Phone number present", !!d.contact.phone, 5, "Recruiters often need a phone number.");
  add(
    "Professional summary",
    d.summary.trim().length >= 120,
    10,
    "Write a 2–3 sentence summary (120+ chars).",
  );
  add("Job title set", !!d.contact.title, 6, "Add your target/current title under your name.");
  add(
    "At least 1 experience entry",
    d.experience.length >= 1,
    14,
    "Add work experience with achievements.",
  );

  const allBullets = d.experience.flatMap((e) => e.bullets).filter(Boolean);
  const quantCount = allBullets.filter((b) => QUANT.test(b)).length;
  add(
    "Quantified achievements",
    quantCount >= Math.max(1, Math.ceil(allBullets.length * 0.3)),
    14,
    "Add numbers/metrics to bullets (e.g. 'cut load time 40%').",
  );

  const weakCount = allBullets.filter((b) => WEAK.some((w) => b.toLowerCase().includes(w))).length;
  add(
    "Strong action language",
    weakCount === 0 && allBullets.length > 0,
    8,
    "Avoid weak phrases like 'responsible for'. Start bullets with action verbs.",
  );

  add("Skills listed (6+)", d.skills.length >= 6, 12, "List at least 6 relevant skills/keywords.");
  add("Education present", d.education.length >= 1, 6, "Include education or relevant training.");
  add(
    "Has projects or certifications",
    d.projects.length + d.certifications.length >= 1,
    5,
    "Projects/certifications strengthen ATS keyword coverage.",
  );

  const totalLen = JSON.stringify(d).length;
  add("Sufficient content depth", totalLen > 1200, 6, "Resume looks thin — add more detail.");
  add("Not overly long", totalLen < 12000, 6, "Trim to keep it concise (1–2 pages).");

  const earned = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earned / total) * 100);

  const readability = clamp(
    100 - weakCount * 12 + (allBullets.length ? 10 : -10),
    0,
    100,
  );
  const impact = clamp(
    allBullets.length ? Math.round((quantCount / allBullets.length) * 100) : 0,
    0,
    100,
  );
  const completeness = Math.round(
    (([d.summary, d.contact.email, d.contact.phone].filter(Boolean).length +
      (d.experience.length ? 1 : 0) +
      (d.education.length ? 1 : 0) +
      (d.skills.length >= 6 ? 1 : 0)) /
      6) *
      100,
  );
  const keywords = clamp(d.skills.length * 8, 0, 100);

  return { score, checks, metrics: { readability, impact, completeness, keywords } };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
