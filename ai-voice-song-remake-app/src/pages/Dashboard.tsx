import { useApp } from "../context/AppContext";

function Particles() {
  const items = Array.from({ length: 18 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((_, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${(i * 53) % 100}%`,
            bottom: "-10px",
            animationDelay: `${(i * 0.6) % 8}s`,
            animationDuration: `${6 + ((i * 13) % 6)}s`,
            background: i % 3 === 0 ? "var(--accent-2)" : "var(--accent)",
            boxShadow: i % 3 === 0 ? "0 0 10px var(--accent-2)" : "0 0 10px var(--accent)",
          }}
        />
      ))}
    </div>
  );
}

function HeroWaveform() {
  const bars = Array.from({ length: 60 });
  return (
    <div className="relative h-32 w-full flex items-end justify-center gap-[3px] opacity-80">
      {bars.map((_, i) => {
        const h = 20 + Math.abs(Math.sin(i / 3.5)) * 80 + ((i * 7) % 20);
        return (
          <span
            key={i}
            className="w-[3px] rounded-t"
            style={{
              height: `${h}%`,
              background: `linear-gradient(180deg, var(--accent), var(--accent-2))`,
              opacity: 0.5 + ((i * 17) % 50) / 100,
              animation: `wave ${1 + ((i % 7) * 0.15)}s ease-in-out ${-i * 0.08}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}

export function Dashboard() {
  const { setPage, history } = useApp();

    const stats = [
    { label: "Processing", value: "100%", delta: "In-browser · no server" },
    { label: "Remakes Generated", value: history.length.toString(), delta: "This session" },
    { label: "Song Library", value: "∞", delta: "iTunes Search API" },
    { label: "Supported Formats", value: "29+", delta: "Any audio/video ffmpeg handles" },
  ];

  const features = [
    { title: "Real Audio Previews", desc: "Speaker previews play actual audio from your uploaded file — decoded in-browser with Web Audio API.", icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3Zm0 13a8 8 0 0 1-6-2.7 6 6 0 0 1 12 0 8 8 0 0 1-6 2.7Z" },
    { title: "Real Song Search", desc: "Millions of songs via iTunes Search API with real 30-second preview clips you can play instantly.", icon: "M12 2v20M2 12h20" },
    { title: "Live Mic Recording", desc: "Record directly from your microphone using MediaRecorder API — no upload needed.", icon: "m21 21-4.3-4.3M10 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z" },
    { title: "Emotion + Style Control", desc: "Happy, Sad, Lo-fi, Rock — shape the vibe before generation.", icon: "M12 2 4 7l8 5 8-5-8-5ZM4 17l8 5 8-5M4 12l8 5 8-5" },
  ];

  return (
    <div className="fade-in space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl glass p-8 md:p-12 min-h-[420px] flex items-center">
        <Particles />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(circle, var(--accent), transparent 70%)" }} />
        <div className="absolute bottom-0 left-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(circle, var(--accent-2), transparent 70%)" }} />

        <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center w-full">
          <div>
            <div className="inline-flex items-center gap-2 chip mb-5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
              v1.0 · Neural Audio Engine
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-black leading-[1.05] mb-4">
              Create AI Songs<br />
              in <span style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2),var(--accent-3))", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>Any Voice</span>
            </h1>
            <p className="text-base md:text-lg opacity-70 max-w-xl mb-6 leading-relaxed">
              Upload a voice recording. We separate every speaker. Pick one. Search any song.
              Our AI engine recreates the song in the selected speaker's voice.
            </p>
            <div className="mt-4 p-4 rounded-xl text-sm" style={{ background: "rgba(251,191,36,0.1)", border: "1px solid #fbbf24" }}>
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <div className="font-semibold mb-1">Browser Demo vs Full Backend</div>
                  <div className="opacity-70 text-xs leading-relaxed">
                    This browser version applies voice characteristics (EQ, filters, reverb) to the song. 
                    For <b>true AI voice conversion</b> where the speaker actually sings the song, 
                    you need the Python backend with RVC/So-VITS-SVC. 
                    See <button onClick={() => setPage("backend")} className="underline font-semibold">Backend Guide</button> for complete setup.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="btn-neon" onClick={() => setPage("upload")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v12m0-12L8 8m4-4 4 4M4 20h16" />
                </svg>
                Start Forging
              </button>
              <button className="btn-ghost" onClick={() => setPage("studio")}>Open Studio</button>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-xs opacity-60">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Web Audio API</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> iTunes Search API</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> MediaRecorder API</span>
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-pink-400" /> 100% Browser-Side</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-3xl" style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.15), transparent 60%)" }} />
            <div className="relative glass-2 p-6 rounded-2xl overflow-hidden">
              <div className="scan-line" />
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-display text-xs tracking-widest opacity-70">LIVE · NEURAL FEED</span>
              </div>
              <HeroWaveform />
              <div className="mt-3 flex items-center justify-between text-xs opacity-60">
                <span>00:00</span>
                <span>Speaker 1 · 94% confidence</span>
                <span>00:42</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass p-5 rounded-2xl relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl"
                 style={{ background: "var(--accent)" }} />
            <div className="text-xs opacity-60 uppercase tracking-wider">{s.label}</div>
            <div className="font-display text-3xl md:text-4xl font-black mt-2">{s.value}</div>
            <div className="text-xs opacity-50 mt-1">{s.delta}</div>
          </div>
        ))}
      </section>

      {/* FEATURES */}
      <section>
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Capabilities</div>
            <h2 className="font-display text-2xl md:text-3xl font-bold">Built for creators</h2>
          </div>
          <button className="btn-ghost" onClick={() => setPage("backend")}>View Backend</button>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <div key={f.title} className="glass p-6 rounded-2xl hover:-translate-y-1 transition-transform relative overflow-hidden group">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                   style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{f.desc}</p>
              <div className="absolute inset-x-0 bottom-0 h-[2px] scale-x-0 group-hover:scale-x-100 transition-transform origin-left"
                   style={{ background: "linear-gradient(90deg,var(--accent),var(--accent-2))" }} />
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <section className="relative overflow-hidden py-6 glass rounded-2xl">
        <div className="marquee text-xs md:text-sm uppercase tracking-[0.3em] opacity-60">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12 shrink-0">
              <span>◆ Multi-Speaker AI</span>
              <span>◆ Neural Voice Conversion</span>
              <span>◆ Real-Time Waveform</span>
              <span>◆ Lo-fi · Rock · Acoustic</span>
              <span>◆ Cinematic Output</span>
              <span>◆ Local Processing</span>
              <span>◆ Privacy First</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
