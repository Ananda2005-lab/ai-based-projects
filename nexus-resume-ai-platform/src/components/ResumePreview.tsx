import type { ReactElement } from "react";
import type { ResumeData, TemplateId, SectionKey } from "../types";
import { SECTION_LABELS } from "../lib/templates";

interface Props {
  data: ResumeData;
  template: TemplateId;
  accent: string;
}

function hasContent(d: ResumeData, k: SectionKey): boolean {
  switch (k) {
    case "summary": return !!d.summary.trim();
    case "experience": return d.experience.length > 0;
    case "education": return d.education.length > 0;
    case "skills": return d.skills.length > 0;
    case "projects": return d.projects.length > 0;
    case "certifications": return d.certifications.length > 0;
    case "achievements": return d.achievements.length > 0;
    case "languages": return d.languages.length > 0;
  }
}

export default function ResumePreview({ data, template, accent }: Props) {
  const order = data.sectionOrder.filter((k) => hasContent(data, k));
  const Comp = RENDERERS[template] ?? RENDERERS.modern;
  return <Comp data={data} accent={accent} order={order} />;
}

type R = (p: { data: ResumeData; accent: string; order: SectionKey[] }) => ReactElement;

const link = (s: string) => s.replace(/^https?:\/\//, "");

/* ---------- shared section body renderers ---------- */
function Body({ data, k, accent, mono }: { data: ResumeData; k: SectionKey; accent: string; mono?: boolean }) {
  switch (k) {
    case "summary":
      return <p className="leading-relaxed text-[10.5px] text-gray-700">{data.summary}</p>;
    case "experience":
      return (
        <div className="space-y-3">
          {data.experience.map((e) => (
            <div key={e.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-gray-900 text-[11px]">{e.role}</span>
                <span className="text-[9.5px] text-gray-500 whitespace-nowrap">{e.start} – {e.current ? "Present" : e.end}</span>
              </div>
              <div className="text-[10px] font-medium" style={{ color: accent }}>{e.company}{e.location ? ` · ${e.location}` : ""}</div>
              <ul className="mt-1 space-y-0.5">
                {e.bullets.filter(Boolean).map((b, i) => (
                  <li key={i} className="flex gap-1.5 text-[10px] text-gray-700">
                    <span style={{ color: accent }}>▸</span><span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    case "education":
      return (
        <div className="space-y-2">
          {data.education.map((e) => (
            <div key={e.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-gray-900 text-[11px]">{e.degree}</span>
                <span className="text-[9.5px] text-gray-500">{e.start} – {e.end}</span>
              </div>
              <div className="text-[10px]" style={{ color: accent }}>{e.school}{e.location ? ` · ${e.location}` : ""}</div>
              {e.details && <p className="text-[9.5px] text-gray-600">{e.details}</p>}
            </div>
          ))}
        </div>
      );
    case "skills":
      return (
        <div className="flex flex-wrap gap-1.5">
          {data.skills.map((s, i) => (
            <span
              key={i}
              className={mono ? "text-[9.5px] px-1.5 py-0.5 rounded border" : "text-[9.5px] px-2 py-0.5 rounded-full"}
              style={mono
                ? { borderColor: accent, color: accent, fontFamily: "ui-monospace, monospace" }
                : { background: accent + "22", color: "#374151" }}
            >{s}</span>
          ))}
        </div>
      );
    case "projects":
      return (
        <div className="space-y-2">
          {data.projects.map((p) => (
            <div key={p.id}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-gray-900 text-[11px]">{p.name}</span>
                {p.link && <span className="text-[9px]" style={{ color: accent }}>{link(p.link)}</span>}
              </div>
              {p.tech && <div className="text-[9px] text-gray-500" style={{ fontFamily: "ui-monospace, monospace" }}>{p.tech}</div>}
              <p className="text-[10px] text-gray-700">{p.description}</p>
            </div>
          ))}
        </div>
      );
    case "certifications":
      return (
        <ul className="space-y-1">
          {data.certifications.map((c) => (
            <li key={c.id} className="text-[10px] text-gray-700 flex justify-between">
              <span><span className="font-medium text-gray-900">{c.name}</span>{c.issuer ? ` — ${c.issuer}` : ""}</span>
              <span className="text-gray-500">{c.year}</span>
            </li>
          ))}
        </ul>
      );
    case "achievements":
      return (
        <ul className="space-y-0.5">
          {data.achievements.filter(Boolean).map((a, i) => (
            <li key={i} className="flex gap-1.5 text-[10px] text-gray-700"><span style={{ color: accent }}>★</span><span>{a}</span></li>
          ))}
        </ul>
      );
    case "languages":
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {data.languages.map((l) => (
            <span key={l.id} className="text-[10px] text-gray-700"><span className="font-medium text-gray-900">{l.name}</span> · {l.level}</span>
          ))}
        </div>
      );
  }
}

function Heading({ children, accent, variant }: { children: string; accent: string; variant?: string }) {
  if (variant === "bar")
    return (
      <h3 className="text-[10px] font-bold uppercase tracking-wider mb-1.5 inline-block px-2 py-0.5 rounded text-white" style={{ background: accent }}>{children}</h3>
    );
  if (variant === "underline")
    return (
      <h3 className="text-[11px] font-bold uppercase tracking-wider mb-1.5 pb-1 border-b-2" style={{ color: "#111827", borderColor: accent }}>{children}</h3>
    );
  if (variant === "plain")
    return <h3 className="text-[11px] font-bold uppercase tracking-wide mb-1.5 text-gray-900">{children}</h3>;
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center gap-1.5" style={{ color: accent }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />{children}
    </h3>
  );
}

/* ----------------------------- TEMPLATES ----------------------------- */

const Modern: R = ({ data, accent, order }) => (
  <div className="p-9 text-gray-800">
    <header className="mb-5">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{data.contact.fullName || "Your Name"}</h1>
      <p className="text-[12px] font-medium" style={{ color: accent }}>{data.contact.title}</p>
      <ContactLine data={data} sep="·" />
    </header>
    <div className="space-y-4">
      {order.map((k) => (
        <section key={k}><Heading accent={accent}>{SECTION_LABELS[k]}</Heading><Body data={data} k={k} accent={accent} /></section>
      ))}
    </div>
  </div>
);

const Corporate: R = ({ data, accent, order }) => {
  const sidebar: SectionKey[] = order.filter((k) => ["skills", "languages", "certifications"].includes(k));
  const main = order.filter((k) => !sidebar.includes(k));
  return (
    <div className="text-gray-800">
      <header className="px-9 py-5 text-white" style={{ background: accent }}>
        <h1 className="text-2xl font-bold tracking-tight">{data.contact.fullName || "Your Name"}</h1>
        <p className="text-[12px] opacity-90">{data.contact.title}</p>
      </header>
      <div className="px-9 py-2 text-[9px] text-gray-600 border-b border-gray-200"><ContactLine data={data} sep="·" /></div>
      <div className="grid grid-cols-3 gap-6 p-9">
        <div className="col-span-2 space-y-4">
          {main.map((k) => <section key={k}><Heading accent={accent} variant="underline">{SECTION_LABELS[k]}</Heading><Body data={data} k={k} accent={accent} /></section>)}
        </div>
        <div className="space-y-4">
          {sidebar.map((k) => <section key={k}><Heading accent={accent} variant="underline">{SECTION_LABELS[k]}</Heading><Body data={data} k={k} accent={accent} /></section>)}
        </div>
      </div>
    </div>
  );
};

const Developer: R = ({ data, accent, order }) => (
  <div className="p-9 text-gray-800" style={{ fontFamily: "ui-sans-serif, system-ui" }}>
    <header className="mb-5 border-l-4 pl-3" style={{ borderColor: accent }}>
      <h1 className="text-2xl font-bold text-gray-900">{data.contact.fullName || "Your Name"}</h1>
      <p className="text-[11px]" style={{ color: accent, fontFamily: "ui-monospace, monospace" }}>// {data.contact.title}</p>
      <ContactLine data={data} sep="/" mono />
    </header>
    <div className="space-y-4">
      {order.map((k) => (
        <section key={k}>
          <Heading accent={accent} variant="plain">{`# ${SECTION_LABELS[k]}`}</Heading>
          <Body data={data} k={k} accent={accent} mono={k === "skills"} />
        </section>
      ))}
    </div>
  </div>
);

const Creative: R = ({ data, accent, order }) => (
  <div className="text-gray-800">
    <header className="p-9 pb-6" style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}05)` }}>
      <div className="inline-block px-3 py-1 rounded-full text-white text-[9px] mb-2" style={{ background: accent }}>HELLO, I'M</div>
      <h1 className="text-3xl font-black text-gray-900 leading-none">{data.contact.fullName || "Your Name"}</h1>
      <p className="text-[13px] font-semibold mt-1" style={{ color: accent }}>{data.contact.title}</p>
      <ContactLine data={data} sep="·" />
    </header>
    <div className="p-9 pt-5 space-y-4">
      {order.map((k) => <section key={k}><Heading accent={accent} variant="bar">{SECTION_LABELS[k]}</Heading><Body data={data} k={k} accent={accent} /></section>)}
    </div>
  </div>
);

const ATS: R = ({ data, order }) => (
  <div className="p-10 text-gray-900" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
    <header className="mb-4 text-center">
      <h1 className="text-2xl font-bold uppercase tracking-wide">{data.contact.fullName || "Your Name"}</h1>
      <p className="text-[11px]">{data.contact.title}</p>
      <ContactLine data={data} sep="|" center />
    </header>
    <div className="space-y-3">
      {order.map((k) => (
        <section key={k}>
          <h3 className="text-[11px] font-bold uppercase border-b border-gray-800 mb-1">{SECTION_LABELS[k]}</h3>
          <Body data={data} k={k} accent="#374151" />
        </section>
      ))}
    </div>
  </div>
);

const Futuristic: R = ({ data, accent, order }) => {
  const sidebar: SectionKey[] = order.filter((k) => ["skills", "languages", "certifications", "achievements"].includes(k));
  const main = order.filter((k) => !sidebar.includes(k));
  return (
    <div className="flex text-gray-800 min-h-full">
      <aside className="w-[34%] p-6 text-white" style={{ background: `linear-gradient(160deg, #0f172a, ${accent}cc)` }}>
        <h1 className="text-xl font-bold leading-tight">{data.contact.fullName || "Your Name"}</h1>
        <p className="text-[10px] opacity-90 mb-4">{data.contact.title}</p>
        <div className="space-y-1 text-[9px] opacity-90 mb-4">
          {data.contact.email && <div>✉ {data.contact.email}</div>}
          {data.contact.phone && <div>☎ {data.contact.phone}</div>}
          {data.contact.location && <div>⌖ {data.contact.location}</div>}
          {data.contact.website && <div>◍ {link(data.contact.website)}</div>}
          {data.contact.linkedin && <div>in {link(data.contact.linkedin)}</div>}
          {data.contact.github && <div>⌗ {link(data.contact.github)}</div>}
        </div>
        <div className="space-y-4">
          {sidebar.map((k) => (
            <section key={k}>
              <h3 className="text-[9px] font-bold uppercase tracking-widest mb-1.5 opacity-80">{SECTION_LABELS[k]}</h3>
              <div className="[&_*]:!text-white/90 [&_li>span:first-child]:!text-white">
                <Body data={data} k={k} accent="#ffffff" />
              </div>
            </section>
          ))}
        </div>
      </aside>
      <div className="flex-1 p-7 space-y-4">
        {main.map((k) => <section key={k}><Heading accent={accent}>{SECTION_LABELS[k]}</Heading><Body data={data} k={k} accent={accent} /></section>)}
      </div>
    </div>
  );
};

function ContactLine({ data, sep, mono, center }: { data: ResumeData; sep: string; mono?: boolean; center?: boolean }) {
  const items = [
    data.contact.email,
    data.contact.phone,
    data.contact.location,
    link(data.contact.website),
    link(data.contact.linkedin),
    link(data.contact.github),
  ].filter(Boolean);
  return (
    <div
      className={`mt-1 text-[9px] text-gray-600 flex flex-wrap gap-x-2 gap-y-0.5 ${center ? "justify-center" : ""}`}
      style={mono ? { fontFamily: "ui-monospace, monospace" } : undefined}
    >
      {items.map((it, i) => (
        <span key={i}>{it}{i < items.length - 1 ? ` ${sep}` : ""}</span>
      ))}
    </div>
  );
}

const RENDERERS: Record<TemplateId, R> = {
  modern: Modern,
  corporate: Corporate,
  developer: Developer,
  creative: Creative,
  ats: ATS,
  futuristic: Futuristic,
};
