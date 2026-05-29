import type { TemplateId } from "../types";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  desc: string;
  swatch: string;
}

export const TEMPLATES: TemplateMeta[] = [
  { id: "modern", name: "Modern Minimal", desc: "Clean, airy, whitespace-led", swatch: "#0ea5e9" },
  { id: "corporate", name: "Corporate Pro", desc: "Classic two-column executive", swatch: "#1e3a8a" },
  { id: "developer", name: "Developer", desc: "Mono accents, code-friendly", swatch: "#10b981" },
  { id: "creative", name: "Creative", desc: "Bold color blocks & flair", swatch: "#ec4899" },
  { id: "ats", name: "ATS Optimized", desc: "Plain, parser-perfect", swatch: "#64748b" },
  { id: "futuristic", name: "Futuristic", desc: "Sidebar with glow accents", swatch: "#a855f7" },
];

export const ACCENTS = [
  "#22d3ee", "#a855f7", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899", "#ef4444", "#1e3a8a",
];

export const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
};
