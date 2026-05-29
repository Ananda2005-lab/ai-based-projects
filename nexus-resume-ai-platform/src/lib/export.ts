import type { ResumeProfile } from "../types";

export function exportPDF() {
  window.print();
}

export function exportJSON(profile: ResumeProfile) {
  const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
  download(blob, `${slug(profile.name)}.json`);
}

export function exportDOCX(profile: ResumeProfile) {
  const d = profile.data;
  const esc = (s: string) => (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const sections: string[] = [];
  const h = (t: string) => `<h2 style="color:#1a1a2e;border-bottom:1px solid #888;font-size:13pt;margin:14px 0 6px;text-transform:uppercase;">${esc(t)}</h2>`;

  if (d.summary) sections.push(h("Summary") + `<p>${esc(d.summary)}</p>`);
  if (d.experience.length)
    sections.push(h("Experience") + d.experience.map((e) =>
      `<p><b>${esc(e.role)}</b> — ${esc(e.company)} (${esc(e.start)}–${e.current ? "Present" : esc(e.end)})</p><ul>${e.bullets.filter(Boolean).map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`).join(""));
  if (d.projects.length)
    sections.push(h("Projects") + d.projects.map((p) => `<p><b>${esc(p.name)}</b> (${esc(p.tech)}) — ${esc(p.description)}</p>`).join(""));
  if (d.education.length)
    sections.push(h("Education") + d.education.map((e) => `<p><b>${esc(e.degree)}</b> — ${esc(e.school)} (${esc(e.start)}–${esc(e.end)})</p>`).join(""));
  if (d.skills.length) sections.push(h("Skills") + `<p>${d.skills.map(esc).join(" • ")}</p>`);
  if (d.achievements.length) sections.push(h("Achievements") + `<ul>${d.achievements.filter(Boolean).map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`);
  if (d.certifications.length) sections.push(h("Certifications") + `<ul>${d.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)} ${esc(c.year)}</li>`).join("")}</ul>`);
  if (d.languages.length) sections.push(h("Languages") + `<p>${d.languages.map((l) => `${esc(l.name)} (${esc(l.level)})`).join(" • ")}</p>`);

  const html = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${esc(d.contact.fullName)}</title></head>
  <body style="font-family:Calibri,Arial,sans-serif;color:#222;">
  <h1 style="margin:0;font-size:20pt;">${esc(d.contact.fullName)}</h1>
  <p style="margin:2px 0;color:#444;">${esc(d.contact.title)}</p>
  <p style="margin:2px 0;font-size:9pt;color:#666;">${[d.contact.email, d.contact.phone, d.contact.location, d.contact.website].filter(Boolean).map(esc).join(" | ")}</p>
  ${sections.join("")}
  </body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  download(blob, `${slug(profile.name)}.doc`);
}

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (s: string) => (s || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
