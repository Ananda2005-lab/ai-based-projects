import { useMemo, useState } from "react";
import { Field, GlowButton, Input, Panel, SectionHeader } from "../components/ui";

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  level: number;
  parent?: string;
}

const TEMPLATES: Record<string, string[]> = {
  "AI Engineer": ["Python", "Machine Learning", "Deep Learning", "MLOps & Deploy", "LLMs", "Projects"],
  "Frontend Developer": ["HTML/CSS", "JavaScript", "TypeScript", "React", "Testing", "Performance"],
  "Cybersecurity Engineer": ["Networking", "Linux", "Web Security", "Pentesting", "SIEM", "Incident Response"],
  "Data Scientist": ["Python", "Statistics", "SQL", "Visualization", "Machine Learning", "Storytelling"],
};

function build(center: string, children: string[]): Node[] {
  const nodes: Node[] = [{ id: "root", label: center, x: 50, y: 50, level: 0 }];
  const R = 34;
  children.forEach((c, i) => {
    const angle = (i / children.length) * Math.PI * 2 - Math.PI / 2;
    nodes.push({ id: `c${i}`, label: c, x: 50 + Math.cos(angle) * R, y: 50 + Math.sin(angle) * R, level: 1, parent: "root" });
  });
  return nodes;
}

export function KnowledgeGraph() {
  const [role, setRole] = useState("AI Engineer");
  const [active, setActive] = useState("AI Engineer");
  const [selected, setSelected] = useState<string | null>(null);

  const nodes = useMemo(() => {
    const children = TEMPLATES[active] || ["Fundamentals", "Tools", "Practice", "Projects", "Advanced", "Portfolio"];
    return build(active, children);
  }, [active]);

  const root = nodes[0];

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 10" title="Career Knowledge Graph" desc="An interactive map of the skills that compose your target role. Click any node to explore." />

      <Panel className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] rise-in">
        <Field label="Career / role" hint="Try: AI Engineer, Frontend Developer, Data Scientist">
          <Input value={role} onChange={(e) => setRole(e.target.value)} onKeyDown={(e) => e.key === "Enter" && setActive(role)} />
        </Field>
        <div className="flex items-end"><GlowButton onClick={() => setActive(role)} className="w-full">⟐ Map It</GlowButton></div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel className="relative aspect-square overflow-hidden p-2 lg:col-span-2 scale-in">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {nodes.slice(1).map((n) => (
              <line key={`l${n.id}`} x1={root.x} y1={root.y} x2={n.x} y2={n.y} stroke="rgba(34,211,238,0.3)" strokeWidth={0.4} className="dash" />
            ))}
            {nodes.map((n) => {
              const isRoot = n.level === 0;
              const isSel = selected === n.label;
              return (
                <g key={n.id} className="cursor-pointer" onClick={() => setSelected(n.label)}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={isRoot ? 9 : isSel ? 6.5 : 5.5}
                    fill={isRoot ? "url(#core)" : isSel ? "#a855f7" : "#0f1d36"}
                    stroke={isRoot ? "#22d3ee" : "#22d3ee88"}
                    strokeWidth={isRoot ? 0.6 : 0.4}
                    style={{ filter: isRoot || isSel ? "drop-shadow(0 0 3px #22d3ee)" : "none", transition: "all 0.3s" }}
                  />
                  <text x={n.x} y={n.y + (isRoot ? 0.8 : 0.6)} textAnchor="middle" fontSize={isRoot ? 2.4 : 2} fill="#e6f1ff" fontWeight="600" style={{ pointerEvents: "none" }}>
                    {n.label.length > 14 ? n.label.slice(0, 12) + "…" : n.label}
                  </text>
                </g>
              );
            })}
            <defs>
              <radialGradient id="core">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#7c3aed" />
              </radialGradient>
            </defs>
          </svg>
        </Panel>

        <Panel className="p-5 scale-in">
          <h4 className="text-xs font-bold uppercase tracking-widest text-cyan-200/70">Node Detail</h4>
          {selected ? (
            <div className="mt-3 space-y-3 fade-in">
              <h3 className="text-xl font-bold text-white">{selected}</h3>
              <p className="text-sm text-slate-400">
                A core component of the <span className="text-cyan-300">{active}</span> path. Master this through focused study plus a hands-on project to lock it into your portfolio.
              </p>
              <ul className="space-y-1.5 text-sm text-slate-300">
                <li>◆ Learn the fundamentals first</li>
                <li>◆ Build a small project to apply it</li>
                <li>◆ Document it for your portfolio</li>
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Click a node in the graph to see how it fits your career path.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
