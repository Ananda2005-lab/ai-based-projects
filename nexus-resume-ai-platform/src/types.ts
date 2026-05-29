export interface ContactInfo {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  start: string;
  end: string;
  details: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  tech: string;
  link: string;
  description: string;
}

export interface CertItem {
  id: string;
  name: string;
  issuer: string;
  year: string;
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface CustomSection {
  id: string;
  title: string;
  items: string[];
}

export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages";

export interface ResumeData {
  contact: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects: ProjectItem[];
  certifications: CertItem[];
  achievements: string[];
  languages: LanguageItem[];
  custom: CustomSection[];
  sectionOrder: SectionKey[];
  targetRole: string;
}

export type TemplateId =
  | "modern"
  | "corporate"
  | "developer"
  | "creative"
  | "ats"
  | "futuristic";

export type AccentColor = string;

export interface ResumeProfile {
  id: string;
  name: string;
  data: ResumeData;
  template: TemplateId;
  accent: AccentColor;
  updatedAt: number;
}

export type AIProvider = "groq" | "openrouter" | "ollama" | "custom";

export interface AISettings {
  provider: AIProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
}
