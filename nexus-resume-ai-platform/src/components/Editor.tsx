import { useState } from "react";
import { useStore } from "../store";
import { useAI } from "../lib/useAI";
import { useToast } from "./AIToast";
import { Field, Area, Btn, AIButton } from "./ui";
import { SECTION_LABELS } from "../lib/templates";
import { uid } from "../lib/defaults";
import type { SectionKey } from "../types";

const ICONS: Record<string, string> = {
  contact: "👤", summary: "✎", experience: "💼", education: "🎓",
  skills: "⚡", projects: "🚀", certifications: "🏅", achievements: "★", languages: "🌐",
};

export default function Editor() {
  const { active, updateData, patchData } = useStore();
  const ai = useAI();
  const d = active.data;
  const [open, setOpen] = useState<Record<string, boolean>>({ contact: true, summary: true, experience: true });
  const [dragK, setDragK] = useState<SectionKey | null>(null);

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  function move(from: SectionKey, to: SectionKey) {
    if (from === to) return;
    const arr = [...d.sectionOrder];
    const fi = arr.indexOf(from);
    const ti = arr.indexOf(to);
    arr.splice(fi, 1);
    arr.splice(ti, 0, from);
    patchData({ sectionOrder: arr });
  }

  const Section = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div
      draggable={k !== "contact"}
      onDragStart={() => k !== "contact" && setDragK(k as SectionKey)}
      onDragOver={(e) => { if (dragK && k !== "contact") e.preventDefault(); }}
      onDrop={() => { if (dragK && k !== "contact") move(dragK, k as SectionKey); setDragK(null); }}
      className={`nx-glass overflow-hidden rounded-xl transition ${dragK === k ? "opacity-40" : ""}`}
    >
      <button
        onClick={() => toggle(k)}
        className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left hover:bg-white/5"
      >
        {k !== "contact" && <span className="cursor-grab text-slate-600 active:cursor-grabbing">⋮⋮</span>}
        <span className="text-base">{ICONS[k]}</span>
        <span className="flex-1 text-sm font-semibold text-slate-200">
          {k === "contact" ? "Contact & Header" : SECTION_LABELS[k]}
        </span>
        <span className={`text-slate-500 transition ${open[k] ? "rotate-90" : ""}`}>›</span>
      </button>
      {open[k] && <div className="border-t border-white/5 px-3.5 py-3.5">{children}</div>}
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Target role */}
      <div className="nx-glass rounded-xl p-3.5">
        <Field
          label="🎯 Target Role (powers AI & ATS)"
          value={d.targetRole}
          onChange={(e) => patchData({ targetRole: e.target.value })}
          placeholder="e.g. Senior Frontend Engineer"
        />
      </div>

      {/* Contact */}
      <Section k="contact">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Full Name" value={d.contact.fullName} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, fullName: e.target.value } }))} />
          <Field label="Title" value={d.contact.title} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, title: e.target.value } }))} />
          <Field label="Email" value={d.contact.email} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, email: e.target.value } }))} />
          <Field label="Phone" value={d.contact.phone} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, phone: e.target.value } }))} />
          <Field label="Location" value={d.contact.location} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, location: e.target.value } }))} />
          <Field label="Website" value={d.contact.website} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, website: e.target.value } }))} />
          <Field label="LinkedIn" value={d.contact.linkedin} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, linkedin: e.target.value } }))} />
          <Field label="GitHub" value={d.contact.github} onChange={(e) => updateData((x) => ({ ...x, contact: { ...x.contact, github: e.target.value } }))} />
        </div>
      </Section>

      {/* Dynamic ordered sections */}
      {d.sectionOrder.map((k) => (
        <Section key={k} k={k}>
          {k === "summary" && (
            <div>
              <div className="mb-1.5 flex justify-end">
                <AIButton loading={ai.busy === "summary"} label="Generate" onClick={async () => patchData({ summary: await ai.summary(d.targetRole, d.skills) })} />
              </div>
              <Area rows={4} value={d.summary} onChange={(e) => patchData({ summary: e.target.value })} placeholder="A concise, impactful professional summary…" />
              {d.summary && (
                <div className="mt-1.5 flex justify-end">
                  <AIButton loading={ai.busy === "optimize"} label="Optimize" onClick={async () => patchData({ summary: await ai.optimize(d.summary, "summary") })} />
                </div>
              )}
            </div>
          )}

          {k === "experience" && (
            <div className="space-y-3">
              {d.experience.map((exp, i) => (
                <div key={exp.id} className="rounded-lg border border-white/5 bg-black/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Role" value={exp.role} onChange={(e) => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], role: e.target.value }; return { ...x, experience: a }; })} />
                    <Field label="Company" value={exp.company} onChange={(e) => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], company: e.target.value }; return { ...x, experience: a }; })} />
                    <Field label="Start" value={exp.start} onChange={(e) => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], start: e.target.value }; return { ...x, experience: a }; })} />
                    <Field label="End" value={exp.end} disabled={exp.current} placeholder={exp.current ? "Present" : ""} onChange={(e) => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], end: e.target.value }; return { ...x, experience: a }; })} />
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-[12px] text-slate-400">
                    <input type="checkbox" checked={exp.current} onChange={(e) => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], current: e.target.checked }; return { ...x, experience: a }; })} />
                    Currently working here
                  </label>
                  <div className="mt-2">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">Bullets</span>
                      <AIButton loading={ai.busy === "bullets"} label="Smart Generate"
                        onClick={async () => {
                          const seed = exp.bullets[0] || `${exp.role} at ${exp.company}`;
                          const out = await ai.bullets(seed, d.targetRole || exp.role);
                          updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], bullets: out }; return { ...x, experience: a }; });
                        }} />
                    </div>
                    {exp.bullets.map((b, bi) => (
                      <div key={bi} className="mb-1.5 flex gap-1.5">
                        <Area rows={2} value={b} className="flex-1" onChange={(e) => updateData((x) => { const a = [...x.experience]; const bl = [...a[i].bullets]; bl[bi] = e.target.value; a[i] = { ...a[i], bullets: bl }; return { ...x, experience: a }; })} />
                        <button className="text-rose-400/70 hover:text-rose-400" onClick={() => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], bullets: a[i].bullets.filter((_, z) => z !== bi) }; return { ...x, experience: a }; })}>✕</button>
                      </div>
                    ))}
                    <Btn variant="soft" className="mt-1" onClick={() => updateData((x) => { const a = [...x.experience]; a[i] = { ...a[i], bullets: [...a[i].bullets, ""] }; return { ...x, experience: a }; })}>+ Bullet</Btn>
                  </div>
                  <div className="mt-2 text-right">
                    <Btn variant="danger" onClick={() => updateData((x) => ({ ...x, experience: x.experience.filter((_, z) => z !== i) }))}>Delete role</Btn>
                  </div>
                </div>
              ))}
              <Btn variant="primary" onClick={() => updateData((x) => ({ ...x, experience: [...x.experience, { id: uid(), role: "", company: "", location: "", start: "", end: "", current: false, bullets: [""] }] }))}>+ Add Experience</Btn>
            </div>
          )}

          {k === "education" && (
            <div className="space-y-3">
              {d.education.map((ed, i) => (
                <div key={ed.id} className="rounded-lg border border-white/5 bg-black/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Degree" value={ed.degree} onChange={(e) => updateData((x) => { const a = [...x.education]; a[i] = { ...a[i], degree: e.target.value }; return { ...x, education: a }; })} />
                    <Field label="School" value={ed.school} onChange={(e) => updateData((x) => { const a = [...x.education]; a[i] = { ...a[i], school: e.target.value }; return { ...x, education: a }; })} />
                    <Field label="Start" value={ed.start} onChange={(e) => updateData((x) => { const a = [...x.education]; a[i] = { ...a[i], start: e.target.value }; return { ...x, education: a }; })} />
                    <Field label="End" value={ed.end} onChange={(e) => updateData((x) => { const a = [...x.education]; a[i] = { ...a[i], end: e.target.value }; return { ...x, education: a }; })} />
                  </div>
                  <Area label="Details" rows={2} className="mt-2" value={ed.details} onChange={(e) => updateData((x) => { const a = [...x.education]; a[i] = { ...a[i], details: e.target.value }; return { ...x, education: a }; })} />
                  <div className="mt-2 text-right"><Btn variant="danger" onClick={() => updateData((x) => ({ ...x, education: x.education.filter((_, z) => z !== i) }))}>Delete</Btn></div>
                </div>
              ))}
              <Btn variant="primary" onClick={() => updateData((x) => ({ ...x, education: [...x.education, { id: uid(), degree: "", school: "", location: "", start: "", end: "", details: "" }] }))}>+ Add Education</Btn>
            </div>
          )}

          {k === "skills" && (
            <SkillsEditor />
          )}

          {k === "projects" && (
            <div className="space-y-3">
              {d.projects.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-white/5 bg-black/20 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Name" value={p.name} onChange={(e) => updateData((x) => { const a = [...x.projects]; a[i] = { ...a[i], name: e.target.value }; return { ...x, projects: a }; })} />
                    <Field label="Tech" value={p.tech} onChange={(e) => updateData((x) => { const a = [...x.projects]; a[i] = { ...a[i], tech: e.target.value }; return { ...x, projects: a }; })} />
                  </div>
                  <Field label="Link" className="mt-2" value={p.link} onChange={(e) => updateData((x) => { const a = [...x.projects]; a[i] = { ...a[i], link: e.target.value }; return { ...x, projects: a }; })} />
                  <div className="mt-2 mb-1 flex justify-end">
                    <AIButton loading={ai.busy === "project"} label="Describe" onClick={async () => { const desc = await ai.projectDesc(p.name, p.tech); updateData((x) => { const a = [...x.projects]; a[i] = { ...a[i], description: desc }; return { ...x, projects: a }; }); }} />
                  </div>
                  <Area rows={2} value={p.description} onChange={(e) => updateData((x) => { const a = [...x.projects]; a[i] = { ...a[i], description: e.target.value }; return { ...x, projects: a }; })} />
                  <div className="mt-2 text-right"><Btn variant="danger" onClick={() => updateData((x) => ({ ...x, projects: x.projects.filter((_, z) => z !== i) }))}>Delete</Btn></div>
                </div>
              ))}
              <Btn variant="primary" onClick={() => updateData((x) => ({ ...x, projects: [...x.projects, { id: uid(), name: "", tech: "", link: "", description: "" }] }))}>+ Add Project</Btn>
            </div>
          )}

          {k === "certifications" && (
            <div className="space-y-2">
              {d.certifications.map((c, i) => (
                <div key={c.id} className="flex gap-2">
                  <Field placeholder="Certification" value={c.name} onChange={(e) => updateData((x) => { const a = [...x.certifications]; a[i] = { ...a[i], name: e.target.value }; return { ...x, certifications: a }; })} />
                  <Field placeholder="Issuer" value={c.issuer} onChange={(e) => updateData((x) => { const a = [...x.certifications]; a[i] = { ...a[i], issuer: e.target.value }; return { ...x, certifications: a }; })} />
                  <Field placeholder="Year" className="w-20" value={c.year} onChange={(e) => updateData((x) => { const a = [...x.certifications]; a[i] = { ...a[i], year: e.target.value }; return { ...x, certifications: a }; })} />
                  <button className="text-rose-400/70" onClick={() => updateData((x) => ({ ...x, certifications: x.certifications.filter((_, z) => z !== i) }))}>✕</button>
                </div>
              ))}
              <Btn variant="primary" onClick={() => updateData((x) => ({ ...x, certifications: [...x.certifications, { id: uid(), name: "", issuer: "", year: "" }] }))}>+ Add Certification</Btn>
            </div>
          )}

          {k === "achievements" && (
            <ListEditor items={d.achievements} placeholder="Notable achievement…" onChange={(items) => patchData({ achievements: items })} />
          )}

          {k === "languages" && (
            <div className="space-y-2">
              {d.languages.map((l, i) => (
                <div key={l.id} className="flex gap-2">
                  <Field placeholder="Language" value={l.name} onChange={(e) => updateData((x) => { const a = [...x.languages]; a[i] = { ...a[i], name: e.target.value }; return { ...x, languages: a }; })} />
                  <Field placeholder="Level" value={l.level} onChange={(e) => updateData((x) => { const a = [...x.languages]; a[i] = { ...a[i], level: e.target.value }; return { ...x, languages: a }; })} />
                  <button className="text-rose-400/70" onClick={() => updateData((x) => ({ ...x, languages: x.languages.filter((_, z) => z !== i) }))}>✕</button>
                </div>
              ))}
              <Btn variant="primary" onClick={() => updateData((x) => ({ ...x, languages: [...x.languages, { id: uid(), name: "", level: "" }] }))}>+ Add Language</Btn>
            </div>
          )}
        </Section>
      ))}
      <p className="px-1 pb-6 text-center text-[11px] text-slate-600">Drag the ⋮⋮ handle to reorder sections · changes autosave</p>
    </div>
  );
}

function ListEditor({ items, onChange, placeholder }: { items: string[]; onChange: (i: string[]) => void; placeholder: string }) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="flex gap-1.5">
          <Area rows={1} value={it} className="flex-1" placeholder={placeholder} onChange={(e) => { const a = [...items]; a[i] = e.target.value; onChange(a); }} />
          <button className="text-rose-400/70" onClick={() => onChange(items.filter((_, z) => z !== i))}>✕</button>
        </div>
      ))}
      <Btn variant="soft" onClick={() => onChange([...items, ""])}>+ Add</Btn>
    </div>
  );
}

function SkillsEditor() {
  const { active, patchData } = useStore();
  const ai = useAI();
  const toast = useToast();
  const d = active.data;
  const [input, setInput] = useState("");
  const [suggest, setSuggest] = useState<string[]>([]);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (v && !d.skills.some((k) => k.toLowerCase() === v.toLowerCase()))
      patchData({ skills: [...d.skills, v] });
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {d.skills.map((s, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-cyan-400/10 px-2.5 py-1 text-[12px] text-cyan-200">
            {s}
            <button className="text-cyan-300/60 hover:text-rose-400" onClick={() => patchData({ skills: d.skills.filter((_, z) => z !== i) })}>✕</button>
          </span>
        ))}
        {d.skills.length === 0 && <span className="text-[12px] text-slate-500">No skills yet — add some below.</span>}
      </div>
      <div className="flex gap-2">
        <Field placeholder="Add a skill and press Enter" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { addSkill(input); setInput(""); } }} />
        <AIButton loading={ai.busy === "skills"} label="Suggest"
          onClick={async () => { const out = await ai.skills(d.targetRole, d.skills); setSuggest(out); if (!out.length) toast("No new suggestions", "info"); }} />
      </div>
      {suggest.length > 0 && (
        <div className="mt-2 rounded-lg border border-purple-400/20 bg-purple-400/5 p-2.5">
          <div className="mb-1.5 text-[11px] font-semibold text-purple-300">✦ AI Suggested skills (tap to add)</div>
          <div className="flex flex-wrap gap-1.5">
            {suggest.map((s) => (
              <button key={s} onClick={() => { addSkill(s); setSuggest((p) => p.filter((x) => x !== s)); }}
                className="rounded-full border border-purple-400/30 bg-purple-400/10 px-2.5 py-1 text-[12px] text-purple-200 transition hover:bg-purple-400/20">
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
