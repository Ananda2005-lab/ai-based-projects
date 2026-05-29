import { useState } from "react";

interface Skill {
  skill: string;
  level: number;
  status: "strength" | "developing" | "missing";
}

const STATUS_COLOR: Record<string, string> = {
  strength: "#34d399",
  developing: "#22d3ee",
  missing: "#f472b6",
};

export function SkillRadar({ skills, onSelect, selected }: { skills: Skill[]; onSelect: (s: Skill) => void; selected?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const size = 320;
  const c = size / 2;
  const maxR = c - 46;
  const n = Math.max(skills.length, 3);

  const pt = (i: number, r: number) => {
    const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(angle) * r, y: c + Math.sin(angle) * r };
  };

  const polygon = skills
    .map((s, i) => {
      const p = pt(i, (s.level / 100) * maxR);
      return `${p.x},${p.y}`;
    })
    .join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`} className="max-w-[360px]">
        {/* grid rings */}
        {rings.map((r, i) => (
          <circle key={i} cx={c} cy={c} r={maxR * r} fill="none" stroke="rgba(120,170,255,0.08)" strokeWidth={1} />
        ))}
        {/* axes */}
        {skills.map((_s, i) => {
          const p = pt(i, maxR);
          return <line key={i} x1={c} y1={c} x2={p.x} y2={p.y} stroke="rgba(120,170,255,0.08)" strokeWidth={1} />;
        })}

        {/* skill area */}
        <polygon
          points={polygon}
          fill="url(#radarFill)"
          stroke="#22d3ee"
          strokeWidth={1.5}
          style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.5))" }}
          className="scale-in"
        />

        {/* points + labels */}
        {skills.map((s, i) => {
          const p = pt(i, (s.level / 100) * maxR);
          const lp = pt(i, maxR + 22);
          const isSel = selected === s.skill || hover === s.skill;
          const color = STATUS_COLOR[s.status];
          const anchor = Math.abs(lp.x - c) < 10 ? "middle" : lp.x > c ? "start" : "end";
          return (
            <g key={i} className="cursor-pointer" onClick={() => onSelect(s)} onMouseEnter={() => setHover(s.skill)} onMouseLeave={() => setHover(null)}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isSel ? 6 : 4}
                fill={color}
                stroke="#04070f"
                strokeWidth={1.5}
                style={{ filter: `drop-shadow(0 0 ${isSel ? 6 : 3}px ${color})`, transition: "r 0.2s" }}
              />
              <text
                x={lp.x}
                y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={9}
                fill={isSel ? "#fff" : "#94a3b8"}
                fontWeight={isSel ? 700 : 500}
                style={{ transition: "fill 0.2s" }}
              >
                {s.skill.length > 16 ? s.skill.slice(0, 14) + "…" : s.skill}
              </text>
            </g>
          );
        })}

        <defs>
          <radialGradient id="radarFill">
            <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="100%" stopColor="rgba(168,85,247,0.12)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
