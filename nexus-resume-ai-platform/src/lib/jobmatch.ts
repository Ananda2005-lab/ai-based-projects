import type { ResumeData } from "../types";

const STOP = new Set(
  "a an the and or but of to in on for with at by from as is are be we you our your their this that have has will need must should can able strong good great work working role job team teams etc using used use within across into over under more most who which what when where".split(
    /\s+/,
  ),
);

export interface JobMatchResult {
  score: number;
  matched: string[];
  missing: string[];
  totalKeywords: number;
}

function tokens(text: string): string[] {
  return (text.toLowerCase().match(/[a-z][a-z0-9+#.\-]{1,}/g) || []).filter(
    (w) => !STOP.has(w) && w.length > 2,
  );
}

function keywordsFrom(jd: string): string[] {
  const counts = new Map<string, number>();
  for (const t of tokens(jd)) counts.set(t, (counts.get(t) || 0) + 1);
  // prefer meaningful repeated/longer terms
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map((e) => e[0])
    .slice(0, 30);
}

export function matchJob(d: ResumeData, jd: string): JobMatchResult {
  const kws = keywordsFrom(jd);
  const resumeText = JSON.stringify(d).toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];
  for (const k of kws) {
    if (resumeText.includes(k)) matched.push(k);
    else missing.push(k);
  }
  const score = kws.length ? Math.round((matched.length / kws.length) * 100) : 0;
  return { score, matched, missing: missing.slice(0, 14), totalKeywords: kws.length };
}
