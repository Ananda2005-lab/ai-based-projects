// Built-in offline career intelligence engine.
// Produces rich, structured JSON for every module without an API key.

export type TaskKind =
  | "roadmap"
  | "skillgap"
  | "resume"
  | "resume_analyze"
  | "interview"
  | "interview_feedback"
  | "learning"
  | "projects";

interface KnownRole {
  keys: string[];
  skills: string[];
  tools: string[];
  projects: { title: string; level: string; desc: string }[];
}

const ROLES: Record<string, KnownRole> = {
  "AI Engineer": {
    keys: ["ai engineer", "ai", "machine learning engineer", "ml engineer", "ml"],
    skills: ["Python", "Linear Algebra & Statistics", "Machine Learning", "Deep Learning", "PyTorch / TensorFlow", "Data Engineering", "MLOps & Deployment", "LLMs & Prompt Engineering", "Vector Databases", "Model Evaluation"],
    tools: ["Python", "PyTorch", "Hugging Face", "Docker", "FastAPI", "AWS / GCP", "Weights & Biases"],
    projects: [
      { title: "RAG Knowledge Assistant", level: "Intermediate", desc: "Build a retrieval-augmented chatbot over your own documents with embeddings + a vector DB." },
      { title: "Image Classifier + API", level: "Beginner", desc: "Train a CNN and serve it via FastAPI with a small web UI." },
      { title: "Fine-tuned LLM Agent", level: "Advanced", desc: "Fine-tune an open model and deploy a tool-using agent with monitoring." },
    ],
  },
  "Frontend Developer": {
    keys: ["frontend", "front end", "front-end developer", "web developer", "ui developer"],
    skills: ["HTML & Semantics", "CSS & Responsive Design", "JavaScript (ES2023)", "TypeScript", "React", "State Management", "Accessibility (a11y)", "Performance Optimization", "Testing", "Build Tooling"],
    tools: ["VS Code", "React", "Vite", "Tailwind CSS", "TypeScript", "Git", "Playwright"],
    projects: [
      { title: "Animated Portfolio", level: "Beginner", desc: "A responsive portfolio with motion, dark mode and a contact form." },
      { title: "Realtime Dashboard", level: "Intermediate", desc: "Charts + websocket data with optimistic UI and caching." },
      { title: "Design System Library", level: "Advanced", desc: "Reusable component library with docs, tokens and tests." },
    ],
  },
  "Cybersecurity Engineer": {
    keys: ["cyber", "security", "cybersecurity", "infosec", "pentester"],
    skills: ["Networking Fundamentals", "Linux & Bash", "Threat Modeling", "Cryptography", "Web App Security (OWASP)", "Penetration Testing", "SIEM & Monitoring", "Incident Response", "Cloud Security", "Scripting (Python)"],
    tools: ["Kali Linux", "Wireshark", "Burp Suite", "Nmap", "Metasploit", "Splunk", "Python"],
    projects: [
      { title: "Home SOC Lab", level: "Intermediate", desc: "Set up a virtual lab with SIEM, generate attacks and detect them." },
      { title: "Vuln Scanner CLI", level: "Beginner", desc: "Script a port + basic vulnerability scanner in Python." },
      { title: "Red Team Engagement", level: "Advanced", desc: "Full pentest of a deliberately vulnerable network with reporting." },
    ],
  },
  "UI Designer": {
    keys: ["ui designer", "ux", "ui/ux", "product designer", "designer"],
    skills: ["Design Principles", "Typography", "Color Theory", "Layout & Grids", "Figma Mastery", "Design Systems", "Prototyping", "User Research", "Interaction Design", "Handoff to Devs"],
    tools: ["Figma", "Framer", "Adobe CC", "Notion", "Maze", "Spline"],
    projects: [
      { title: "Mobile App Redesign", level: "Beginner", desc: "Pick an app you use and redesign 3 core flows with rationale." },
      { title: "Component Design System", level: "Intermediate", desc: "Build tokens, components and documentation in Figma." },
      { title: "End-to-end Product Case", level: "Advanced", desc: "Research → wireframe → hi-fi → prototype → usability test." },
    ],
  },
  "Game Developer": {
    keys: ["game developer", "game dev", "gamedev", "unity", "unreal"],
    skills: ["Programming (C# / C++)", "Game Math & Physics", "Game Engine (Unity/Unreal)", "Gameplay Programming", "Graphics & Shaders", "Animation Systems", "Game Design", "Optimization", "Multiplayer Networking", "Audio"],
    tools: ["Unity", "Unreal Engine", "C#", "Blender", "Git LFS", "Visual Studio"],
    projects: [
      { title: "2D Platformer", level: "Beginner", desc: "A complete level with movement, enemies, collectibles and UI." },
      { title: "Top-down Shooter", level: "Intermediate", desc: "Enemy AI, weapons, score system and juicy game feel." },
      { title: "Multiplayer Arena", level: "Advanced", desc: "Networked combat with matchmaking and server authority." },
    ],
  },
  "Data Scientist": {
    keys: ["data scientist", "data science", "data analyst", "analytics"],
    skills: ["Python & Pandas", "Statistics & Probability", "SQL", "Data Visualization", "Machine Learning", "Feature Engineering", "Experimentation (A/B)", "Storytelling with Data", "Big Data Tools", "Communication"],
    tools: ["Python", "Jupyter", "Pandas", "scikit-learn", "SQL", "Tableau", "Spark"],
    projects: [
      { title: "EDA + Insights Report", level: "Beginner", desc: "Analyze a public dataset and present clear, visual insights." },
      { title: "Predictive Model", level: "Intermediate", desc: "Build, evaluate and explain a model with a clean pipeline." },
      { title: "End-to-end ML Product", level: "Advanced", desc: "From data ingestion to a deployed prediction service." },
    ],
  },
  "Doctor": {
    keys: ["doctor", "medical doctor", "physician", "mbbs", "medicine", "surgeon", "cardiologist", "dentist", "nurse", "medical"],
    skills: ["Biology & Human Anatomy", "Chemistry & Physics", "Medical Entrance Preparation", "Medical School Foundations", "Clinical Diagnosis", "Patient Communication", "Pharmacology", "Clinical Rotations", "Ethics & Professionalism", "Specialization Pathway"],
    tools: ["NCERT / Core science texts", "Anatomy atlas", "Clinical case studies", "Medical journals", "Hospital rotations", "Exam question banks"],
    projects: [
      { title: "Human Body Systems Study Map", level: "Beginner", desc: "Create visual notes for anatomy, physiology and pathology systems." },
      { title: "Clinical Case Logbook", level: "Intermediate", desc: "Document symptoms, differential diagnosis and treatment reasoning for practice cases." },
      { title: "Community Health Research Project", level: "Advanced", desc: "Analyze a real public-health problem and propose an evidence-based intervention." },
    ],
  },
  "Chartered Accountant": {
    keys: ["ca", "chartered accountant", "accountant", "finance professional", "auditor", "tax consultant"],
    skills: ["Accounting Fundamentals", "Business Law", "Taxation", "Cost & Management Accounting", "Auditing", "Financial Reporting", "Corporate Finance", "Excel & Financial Modeling", "Compliance", "Case-based Problem Solving"],
    tools: ["Excel", "Tally / ERP", "Tax portals", "Accounting standards", "Audit checklists", "Financial statements"],
    projects: [
      { title: "Company Financial Statement Analysis", level: "Beginner", desc: "Analyze a listed company's balance sheet, P&L and cash-flow statement." },
      { title: "Tax Planning Case Study", level: "Intermediate", desc: "Prepare a compliant tax strategy for a realistic individual or business case." },
      { title: "Audit Simulation File", level: "Advanced", desc: "Create working papers, risk assessment and audit observations for a sample company." },
    ],
  },
  "Lawyer": {
    keys: ["lawyer", "advocate", "law", "legal", "judge", "clat"],
    skills: ["Legal Reasoning", "Constitutional Law", "Contract Law", "Criminal Law", "Civil Procedure", "Legal Research", "Drafting & Pleading", "Moot Court Advocacy", "Client Counseling", "Ethics"],
    tools: ["Bare acts", "Case law databases", "Legal citation tools", "Moot memorials", "Court judgments", "Drafting templates"],
    projects: [
      { title: "Case Brief Portfolio", level: "Beginner", desc: "Summarize landmark cases with facts, issues, reasoning and judgment." },
      { title: "Moot Court Memorial", level: "Intermediate", desc: "Draft arguments, authorities and oral submissions for a mock case." },
      { title: "Legal Aid Clinic Project", level: "Advanced", desc: "Research and prepare practical legal guidance for a community issue." },
    ],
  },
  "Civil Engineer": {
    keys: ["civil engineer", "civil engineering", "structural engineer", "construction engineer"],
    skills: ["Engineering Mathematics", "Mechanics", "Structural Analysis", "Concrete & Steel Design", "Surveying", "Geotechnical Engineering", "Transportation Engineering", "AutoCAD / BIM", "Project Management", "Site Safety"],
    tools: ["AutoCAD", "Revit", "STAAD.Pro", "MS Project", "Survey equipment", "Excel"],
    projects: [
      { title: "Residential Building Plan", level: "Beginner", desc: "Create drawings, load assumptions and material estimates for a small structure." },
      { title: "Structural Design Case", level: "Intermediate", desc: "Model and analyze beams, columns and slabs with design checks." },
      { title: "Smart Construction Plan", level: "Advanced", desc: "Plan cost, timeline, safety and sustainability for a real construction scenario." },
    ],
  },
  "Teacher": {
    keys: ["teacher", "educator", "professor", "teaching", "lecturer"],
    skills: ["Subject Mastery", "Pedagogy", "Lesson Planning", "Classroom Management", "Assessment Design", "Communication", "Learning Psychology", "EdTech Tools", "Inclusive Teaching", "Mentoring"],
    tools: ["Google Classroom", "Canva", "Slides", "LMS", "Assessment rubrics", "Interactive quizzes"],
    projects: [
      { title: "Lesson Plan Portfolio", level: "Beginner", desc: "Create complete lesson plans with objectives, activities and assessments." },
      { title: "Micro-teaching Session", level: "Intermediate", desc: "Record and evaluate a short teaching session using a rubric." },
      { title: "Digital Learning Module", level: "Advanced", desc: "Build an interactive unit with quizzes, resources and learner feedback." },
    ],
  },
  "Pilot": {
    keys: ["pilot", "commercial pilot", "aviation", "airline pilot"],
    skills: ["Physics & Mathematics", "Aviation Regulations", "Navigation", "Meteorology", "Aircraft Systems", "Radio Communication", "Flight Planning", "Simulator Practice", "Crew Resource Management", "Safety Procedures"],
    tools: ["Flight simulator", "Navigation charts", "DGCA / FAA materials", "Weather tools", "Checklists", "Logbook"],
    projects: [
      { title: "Flight Theory Notebook", level: "Beginner", desc: "Document aviation concepts, formulas and regulations in a structured way." },
      { title: "Simulator Route Practice", level: "Intermediate", desc: "Plan and fly simulated routes while logging procedures and errors." },
      { title: "Safety Case Study", level: "Advanced", desc: "Analyze an aviation incident and extract procedural lessons." },
    ],
  },
};

function matchRole(input: string): { name: string; role: KnownRole } {
  const q = normalizeGoal(input);
  for (const [name, role] of Object.entries(ROLES)) {
    if (role.keys.some((k) => q.includes(k))) return { name, role };
  }
  // Adaptive fallback role: generate a role-specific plan from the user's exact goal
  // instead of forcing the user into the preset option list.
  const name = titleCase(q) || "Your Target Role";
  return {
    name,
    role: createAdaptiveRole(name),
  };
}

function titleCase(s: string) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function normalizeGoal(input: string) {
  return (input || "")
    .toLowerCase()
    .replace(/\bi\s+(want|wish|would like|plan|need)\s+to\s+(become|be)\s+(an?|the)?\s*/g, "")
    .replace(/\bhow\s+to\s+(become|be)\s+(an?|the)?\s*/g, "")
    .replace(/\broadmap\b|\bcareer\b|\bpath\b|\bplan\b/g, "")
    .replace(/[^a-z0-9 +#./-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function createAdaptiveRole(name: string): KnownRole {
  const lower = name.toLowerCase();
  const domain = lower.includes("engineer")
    ? "engineering"
    : lower.includes("designer") || lower.includes("artist")
      ? "creative"
      : lower.includes("manager") || lower.includes("business") || lower.includes("entrepreneur")
        ? "business"
        : lower.includes("scientist") || lower.includes("research")
          ? "research"
          : "professional";

  const domainSkills: Record<string, string[]> = {
    engineering: ["Mathematics & Core Theory", "Technical Tools", "System Design", "Testing & Validation"],
    creative: ["Design Fundamentals", "Portfolio Craft", "Creative Tools", "Critique & Iteration"],
    business: ["Market Understanding", "Strategy", "Finance Basics", "Operations"],
    research: ["Scientific Method", "Data Collection", "Literature Review", "Research Communication"],
    professional: ["Domain Fundamentals", "Industry Tools", "Practical Workflows", "Professional Communication"],
  };

  return {
    keys: [lower],
    skills: [
      `${name} Fundamentals`,
      ...domainSkills[domain],
      `${name} Tools & Methods`,
      "Hands-on Practice",
      "Portfolio / Proof of Work",
      "Internship or Apprenticeship Readiness",
      "Interview & Application Strategy",
    ],
    tools: ["Official syllabus / documentation", "Industry case studies", "Mentor feedback", "Practice projects", "Portfolio notebook", "Professional communities"],
    projects: [
      { title: `${name} Foundation Portfolio`, level: "Beginner", desc: `Create structured notes, exercises and examples that prove your grasp of ${name} fundamentals.` },
      { title: `${name} Applied Case Study`, level: "Intermediate", desc: `Solve a realistic ${name} problem and document your process, decisions and outcomes.` },
      { title: `${name} Capstone Showcase`, level: "Advanced", desc: `Build a polished, career-ready showcase project that demonstrates practical readiness for ${name} roles.` },
    ],
  };
}

const RESOURCES = [
  "Official documentation",
  "freeCodeCamp / YouTube deep dives",
  "A focused Udemy/Coursera course",
  "Hands-on practice platform",
  "Open-source repos to read",
  "A community (Discord / Reddit)",
];

// Live ATS scorer used for real-time feedback while editing a resume.
export function liveAtsScore(resume: {
  summary?: string;
  skills?: string[];
  experience?: string[];
  contact?: string;
}): { score: number; checks: { label: string; ok: boolean; weight: number }[] } {
  const exp = (resume.experience || []).join("\n");
  const summary = resume.summary || "";
  const skills = resume.skills || [];
  const allText = `${summary}\n${exp}`;
  const checks = [
    { label: "Has 5+ skills listed", ok: skills.filter(Boolean).length >= 5, weight: 18 },
    { label: "Summary is substantial (20+ words)", ok: summary.split(/\s+/).filter(Boolean).length >= 20, weight: 16 },
    { label: "Quantified impact (numbers / %)", ok: /\d+%|\$\d|\b\d{2,}\b/.test(allText), weight: 22 },
    { label: "Strong action verbs", ok: /\b(led|built|designed|improved|launched|created|optimized|delivered|architected)\b/i.test(allText), weight: 18 },
    { label: "Multiple experience bullets", ok: (resume.experience || []).filter(Boolean).length >= 2, weight: 14 },
    { label: "Contact info present", ok: (resume.contact || "").length > 5, weight: 12 },
  ];
  const score = Math.round(checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0));
  return { score: Math.min(100, score), checks };
}

export function simulate(kind: TaskKind, payload: any): any {
  switch (kind) {
    case "roadmap":
      return simRoadmap(payload.goal);
    case "skillgap":
      return simSkillGap(payload.role, payload.current);
    case "resume":
      return simResume(payload);
    case "resume_analyze":
      return simResumeAnalyze(payload.text, payload.role);
    case "interview":
      return simInterview(payload.role, payload.difficulty, payload.type);
    case "interview_feedback":
      return simFeedback(payload.question, payload.answer);
    case "learning":
      return simLearning(payload.goal, payload.weeks);
    case "projects":
      return simProjects(payload.role);
    default:
      return {};
  }
}

function simRoadmap(goal: string) {
  const { name, role } = matchRole(goal || "");
  const phases = roadmapPhasesFor(name, role);
  return {
    title: `${name} Roadmap`,
    summary: roadmapSummary(name),
    phases: phases.map((p, i) => ({
      id: i,
      title: p.label,
      timeline: p.span,
      milestones: p.pick.filter(Boolean).map((s) => ({
        skill: s,
        objective: objectiveFor(name, s),
        project: role.projects[Math.min(i, role.projects.length - 1)]?.title || "Mini project",
      })),
    })),
    nextProjects: role.projects,
  };
}

function roadmapPhasesFor(name: string, role: KnownRole) {
  const lower = name.toLowerCase();
  if (lower.includes("doctor")) {
    return [
      { label: "Science Foundation", span: "Class 11-12 / 12-18 months", pick: role.skills.slice(0, 3) },
      { label: "Entrance & Admission", span: "6-12 months", pick: ["Medical Entrance Preparation", "Mock Tests & Revision", "College Admission Strategy"] },
      { label: "Medical School Core", span: "Years 1-3", pick: role.skills.slice(3, 7) },
      { label: "Clinical Practice & Specialization", span: "Years 4-6+", pick: role.skills.slice(7).concat(["Internship", "Residency / PG Pathway"]) },
    ];
  }
  if (lower.includes("chartered accountant")) {
    return [
      { label: "Foundation", span: "4-6 months", pick: role.skills.slice(0, 3) },
      { label: "Intermediate", span: "8-12 months", pick: role.skills.slice(3, 6) },
      { label: "Articleship & Practical Work", span: "24-36 months", pick: ["Auditing", "Taxation", "Financial Reporting"] },
      { label: "Final & Career Launch", span: "6-12 months", pick: ["Corporate Finance", "Compliance", "Interview & Application Strategy"] },
    ];
  }
  if (lower.includes("lawyer")) {
    return [
      { label: "Entrance & Legal Foundation", span: "6-12 months", pick: role.skills.slice(0, 3) },
      { label: "Law School Core", span: "Years 1-3", pick: role.skills.slice(3, 6) },
      { label: "Moots, Internships & Drafting", span: "Years 2-5", pick: role.skills.slice(6, 9) },
      { label: "Practice Area & Bar Readiness", span: "Final year +", pick: ["Ethics", "Bar Exam Prep", "Client Counseling"] },
    ];
  }
  if (lower.includes("pilot")) {
    return [
      { label: "Eligibility & Theory", span: "3-6 months", pick: role.skills.slice(0, 4) },
      { label: "Ground School", span: "6-9 months", pick: role.skills.slice(4, 7) },
      { label: "Simulator & Flight Hours", span: "12-18 months", pick: role.skills.slice(7, 9) },
      { label: "License & Airline Readiness", span: "6-12 months", pick: ["Safety Procedures", "Type Rating", "Interview & Application Strategy"] },
    ];
  }
  return [
    { label: "Foundations", span: "Months 1-2", pick: role.skills.slice(0, 3) },
    { label: "Core Skills", span: "Months 3-5", pick: role.skills.slice(3, 6) },
    { label: "Advanced & Specialization", span: "Months 6-8", pick: role.skills.slice(6, 8).concat(role.skills.slice(0, 1)) },
    { label: "Portfolio & Job Ready", span: "Months 9-12", pick: ["Capstone Projects", "Resume & Portfolio", "Interview Prep"] },
  ];
}

function roadmapSummary(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("doctor")) return "A realistic medical career pathway covering science foundation, entrance preparation, medical school, clinical rotations, internship and specialization.";
  if (lower.includes("chartered accountant")) return "A structured CA pathway from foundation to intermediate, articleship, final preparation and professional launch.";
  if (lower.includes("lawyer")) return "A legal career pathway covering entrance preparation, law school fundamentals, internships, drafting, moots and practice readiness.";
  if (lower.includes("pilot")) return "A practical aviation pathway covering eligibility, ground school, simulator work, flight hours, licensing and airline readiness.";
  return `A role-specific progression to become a job-ready ${name}, built around practical milestones, proof-of-work and career launch steps.`;
}

function objectiveFor(name: string, skill: string) {
  const lower = name.toLowerCase();
  if (lower.includes("doctor")) return `Build exam-ready and clinically relevant understanding of ${skill}.`;
  if (lower.includes("chartered accountant")) return `Develop problem-solving confidence in ${skill} through case practice and past papers.`;
  if (lower.includes("lawyer")) return `Practice ${skill} through case reading, drafting and argument structure.`;
  if (lower.includes("pilot")) return `Master ${skill} to meet safety, licensing and real-flight readiness standards.`;
  return `Reach working proficiency in ${skill} through study, practice and a portfolio artifact.`;
}

function simSkillGap(role: string, current: string) {
  const { name, role: r } = matchRole(role || "");
  const have = (current || "")
    .split(/[,\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const analyzed = r.skills.map((skill) => {
    const matched = have.some((h) => skill.toLowerCase().includes(h) || h.includes(skill.toLowerCase().split(" ")[0]));
    const level = matched ? 60 + Math.floor(Math.random() * 35) : Math.floor(Math.random() * 25);
    return { skill, level, status: matched ? "strength" : level > 15 ? "developing" : "missing" };
  });
  const missing = analyzed.filter((a) => a.status === "missing");
  return {
    role: name,
    overall: Math.round(analyzed.reduce((s, a) => s + a.level, 0) / analyzed.length),
    skills: analyzed,
    priorities: missing.slice(0, 4).map((m, i) => ({
      skill: m.skill,
      priority: i === 0 ? "Critical" : i < 2 ? "High" : "Medium",
      action: `Spend 2–3 focused weeks on ${m.skill} with one hands-on project.`,
    })),
    strategy: `Lock in your strengths, then attack the ${missing.length} missing skills from highest priority down. Pair each new skill with a small build so it sticks.`,
  };
}

function simResume(p: any) {
  const { name } = matchRole(p.role || "");
  const skills = (p.skills || "").split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
  return {
    name: p.fullName || "Your Name",
    role: name,
    contact: p.contact || "you@email.com · linkedin.com/in/you · github.com/you",
    summary:
      p.summary ||
      `Results-driven ${name} with a passion for building impactful products. Combines strong fundamentals with hands-on project experience to deliver measurable results.`,
    skills: skills.length ? skills : ["Add your skills"],
    experience: (p.experience || "Company — Role (2023–Present)\n• Delivered key outcomes\n• Improved a metric").split("\n").filter(Boolean),
    education: p.education || "Degree / Certification — Institution (Year)",
    atsScore: Math.min(96, 70 + skills.length * 2),
  };
}

function simResumeAnalyze(text: string, role: string) {
  const { name, role: r } = matchRole(role || "");
  const lower = (text || "").toLowerCase();
  const keywords = r.skills.concat(r.tools);
  const found = keywords.filter((k) => lower.includes(k.toLowerCase().split(" ")[0]));
  const missing = keywords.filter((k) => !found.includes(k)).slice(0, 8);
  const len = (text || "").split(/\s+/).filter(Boolean).length;
  const hasMetrics = /\d+%|\$\d|\b\d{2,}\b/.test(text || "");
  const atsScore = Math.max(35, Math.min(95, 40 + found.length * 4 + (hasMetrics ? 10 : 0) + (len > 150 ? 8 : 0)));
  return {
    role: name,
    atsScore,
    foundKeywords: found.slice(0, 10),
    missingKeywords: missing,
    sections: [
      { name: "Keyword Match", score: Math.min(100, found.length * 9), tip: `Add: ${missing.slice(0, 4).join(", ") || "more role keywords"}.` },
      { name: "Quantified Impact", score: hasMetrics ? 85 : 40, tip: hasMetrics ? "Good use of numbers." : "Add metrics (%, $, counts) to bullet points." },
      { name: "Length & Detail", score: len > 400 ? 60 : len > 150 ? 90 : 50, tip: len < 150 ? "Resume looks thin — add detail." : len > 400 ? "Consider tightening to 1 page." : "Good length." },
      { name: "Action Verbs", score: /led|built|designed|improved|launched|created/i.test(text || "") ? 88 : 45, tip: "Start bullets with strong verbs: Built, Led, Launched, Optimized." },
    ],
    improvements: [
      `Weave in missing keywords: ${missing.slice(0, 5).join(", ") || "role-specific terms"}.`,
      "Quantify every achievement with a number.",
      "Keep formatting simple — ATS struggles with tables and columns.",
      "Tailor the summary to the exact role you're applying for.",
    ],
  };
}

function simInterview(role: string, difficulty: string, type: string) {
  const { name, role: r } = matchRole(role || "");
  const tech = [
    `Explain how you would approach building a feature using ${r.tools[0]}.`,
    `What is the difference between two key concepts in ${name.toLowerCase()} work?`,
    `Walk me through debugging a tricky issue you faced.`,
    `How would you optimize performance in a ${name.toLowerCase()} project?`,
    `Design a small system relevant to ${name}. What are the trade-offs?`,
  ];
  const behavioral = [
    "Tell me about a time you overcame a difficult challenge.",
    "Describe a project you're proud of and your specific contribution.",
    "How do you handle disagreement within a team?",
    "Tell me about a time you failed and what you learned.",
    "Where do you see your career in 3 years?",
  ];
  const pool = type === "behavioral" ? behavioral : type === "technical" ? tech : [...tech.slice(0, 3), ...behavioral.slice(0, 2)];
  const diffNote = difficulty === "hard" ? " Go deep and expect follow-ups." : difficulty === "easy" ? " Keep it conversational." : "";
  return {
    role: name,
    difficulty,
    type,
    questions: pool.map((q, i) => ({
      id: i,
      question: q,
      hint: `Use the STAR method.${diffNote}`,
      idealPoints: ["Clear structure", "A concrete example", "Measurable result", "Reflection / learning"],
    })),
  };
}

function simFeedback(_question: string, answer: string) {
  const words = (answer || "").split(/\s+/).filter(Boolean).length;
  const hasExample = /(when|time|project|once|example|at my)/i.test(answer || "");
  const hasResult = /(result|increased|reduced|improved|achieved|led to|\d)/i.test(answer || "");
  let score = 40;
  if (words > 30) score += 15;
  if (words > 80) score += 10;
  if (hasExample) score += 20;
  if (hasResult) score += 15;
  score = Math.min(98, score);
  return {
    score,
    strengths: [
      words > 30 ? "Good amount of detail." : null,
      hasExample ? "Included a concrete example." : null,
      hasResult ? "Mentioned an outcome/result." : null,
    ].filter(Boolean),
    improvements: [
      !hasExample ? "Add a specific real example (Situation → Task → Action → Result)." : null,
      !hasResult ? "End with a measurable result or what you learned." : null,
      words < 30 ? "Expand your answer — it feels too short." : null,
      words > 200 ? "Tighten your answer; it's a bit long." : null,
    ].filter(Boolean),
    summary: score > 80 ? "Strong answer — interview ready." : score > 60 ? "Solid, with room to sharpen." : "Needs more structure and specifics.",
  };
}

function simLearning(goal: string, weeks: number) {
  const { name, role } = matchRole(goal || "");
  const w = Math.max(1, Math.min(24, weeks || 12));
  const skills = role.skills;
  const out = [];
  for (let i = 0; i < w; i++) {
    const skill = skills[i % skills.length];
    out.push({
      week: i + 1,
      focus: skill,
      goal: `Reach working comfort with ${skill}.`,
      daily: [
        `Study ${skill} fundamentals (1h)`,
        `Hands-on practice / exercises (1.5h)`,
        `Mini build applying ${skill} (1h)`,
        `Review & notes (30m)`,
      ],
      resource: RESOURCES[i % RESOURCES.length],
    });
  }
  return { role: name, weeks: w, plan: out };
}

function simProjects(role: string) {
  const { name, role: r } = matchRole(role || "");
  const more = [
    { title: `${name} CLI Tool`, level: "Beginner", desc: "A small command-line utility that solves a real annoyance.", stack: r.tools.slice(0, 2) },
    { title: `${name} SaaS Clone`, level: "Intermediate", desc: "Recreate a product you love to learn the full stack.", stack: r.tools.slice(0, 3) },
    { title: `${name} Open-source Contribution`, level: "Advanced", desc: "Fix a real issue in a popular repo and get it merged.", stack: r.tools.slice(0, 2) },
  ];
  return {
    role: name,
    projects: r.projects.map((p) => ({ ...p, stack: r.tools.slice(0, 3) })).concat(more),
  };
}
