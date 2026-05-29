import { useApp } from "../context/AppContext";

export function History() {
  const { history, clearHistory, pushToast } = useApp();

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] opacity-60 mb-1">Library</div>
          <h1 className="font-display text-3xl md:text-4xl font-black">Remake History</h1>
          <p className="opacity-70 mt-1">Every forged track, in one place.</p>
        </div>
        {history.length > 0 && (
          <button
            className="btn-ghost"
            onClick={() => {
              clearHistory();
              pushToast({ type: "info", title: "History cleared" });
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl mb-4 flex items-center justify-center"
               style={{ background: "linear-gradient(135deg,var(--accent),var(--accent-2))" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8v4l3 2M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
            </svg>
          </div>
          <h3 className="font-display text-xl font-bold">No remakes yet</h3>
          <p className="opacity-60 mt-1 text-sm">Your forged tracks will appear here.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {history.map((h) => (
            <div key={h.id} className="glass p-4 rounded-2xl group">
              <div className="relative rounded-xl overflow-hidden h-40 mb-3" style={{ background: h.cover }}>
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  <button className="btn-neon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5Z" /></svg>
                    Play
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 chip bg-black/50 border-white/20">{h.style}</div>
              </div>
              <div className="font-semibold truncate">{h.songTitle}</div>
              <div className="text-xs opacity-60 truncate">{h.artist}</div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span className="chip">{h.speaker}</span>
                <span className="chip">{h.emotion}</span>
                <span className="chip ml-auto">{h.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
