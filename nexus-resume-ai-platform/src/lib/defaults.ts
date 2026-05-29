import type { ResumeData, ResumeProfile, AISettings, SectionKey } from "../types";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const DEFAULT_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "achievements",
  "certifications",
  "languages",
];

export function emptyResume(): ResumeData {
  return {
    contact: {
      fullName: "Alex Rivera",
      title: "Senior Frontend Engineer",
      email: "alex.rivera@email.com",
      phone: "+1 (555) 014-2280",
      location: "San Francisco, CA",
      website: "alexrivera.dev",
      linkedin: "linkedin.com/in/alexrivera",
      github: "github.com/alexrivera",
    },
    summary:
      "Product-minded frontend engineer with 6+ years building performant, accessible web apps. Specialized in React, design systems, and turning ambiguous ideas into polished products that scale to millions of users.",
    experience: [
      {
        id: uid(),
        role: "Senior Frontend Engineer",
        company: "Northwind Labs",
        location: "San Francisco, CA",
        start: "2022",
        end: "Present",
        current: true,
        bullets: [
          "Led the rebuild of the analytics dashboard, cutting load time by 47% and lifting weekly active usage by 23%.",
          "Architected a TypeScript design system adopted by 5 product teams, reducing UI defects by 38%.",
          "Mentored 4 engineers and instituted code-review standards that improved merge throughput by 30%.",
        ],
      },
      {
        id: uid(),
        role: "Frontend Engineer",
        company: "Brightwave",
        location: "Remote",
        start: "2019",
        end: "2022",
        current: false,
        bullets: [
          "Shipped a real-time collaboration feature used by 120k+ users with sub-100ms sync latency.",
          "Improved Lighthouse performance score from 62 to 96 across core flows.",
        ],
      },
    ],
    education: [
      {
        id: uid(),
        degree: "B.S. Computer Science",
        school: "University of California, Berkeley",
        location: "Berkeley, CA",
        start: "2015",
        end: "2019",
        details: "Graduated with honors. Focus on HCI and distributed systems.",
      },
    ],
    skills: [
      "React",
      "TypeScript",
      "Next.js",
      "Tailwind CSS",
      "Node.js",
      "GraphQL",
      "Design Systems",
      "Accessibility",
      "Testing",
      "CI/CD",
    ],
    projects: [
      {
        id: uid(),
        name: "Lumen UI",
        tech: "React, TypeScript, Vite",
        link: "github.com/alexrivera/lumen",
        description:
          "Open-source component library with 3.2k stars focused on motion and accessibility primitives.",
      },
    ],
    certifications: [
      { id: uid(), name: "AWS Certified Developer", issuer: "Amazon", year: "2023" },
    ],
    achievements: [
      "Speaker at React Summit 2023 — “Designing for Motion”.",
      "Won internal hackathon for an AI-assisted onboarding tool.",
    ],
    languages: [
      { id: uid(), name: "English", level: "Native" },
      { id: uid(), name: "Spanish", level: "Fluent" },
    ],
    custom: [],
    sectionOrder: [...DEFAULT_ORDER],
    targetRole: "Senior Frontend Engineer",
  };
}

export function newBlankResume(): ResumeData {
  return {
    contact: {
      fullName: "",
      title: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
    },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    achievements: [],
    languages: [],
    custom: [],
    sectionOrder: [...DEFAULT_ORDER],
    targetRole: "",
  };
}

export function makeProfile(name: string, data?: ResumeData): ResumeProfile {
  return {
    id: uid(),
    name,
    data: data ?? newBlankResume(),
    template: "futuristic",
    accent: "#22d3ee",
    updatedAt: Date.now(),
  };
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: "groq",
  apiKey: "",
  model: "llama-3.3-70b-versatile",
  baseUrl: "",
};
