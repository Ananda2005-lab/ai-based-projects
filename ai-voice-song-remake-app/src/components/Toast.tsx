import { useApp } from "../context/AppContext";

const ICONS: Record<string, string> = {
  success: "M20 6 9 17l-5-5",
  error: "M6 18 18 6M6 6l12 12",
  info: "M12 16v-4M12 8h.01",
};

export function ToastHost() {
  const { toasts, removeToast } = useApp();
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 w-[340px] max-w-[90vw]">
      {toasts.map((t) => (
        <div key={t.id} className="toast glass px-4 py-3 flex items-start gap-3 shadow-2xl">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background:
                t.type === "success"
                  ? "linear-gradient(135deg,#34d399,#22d3ee)"
                  : t.type === "error"
                  ? "linear-gradient(135deg,#f87171,#ec4899)"
                  : "linear-gradient(135deg,var(--accent),var(--accent-2))",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[t.type]} />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">{t.title}</div>
            {t.desc && <div className="text-xs opacity-70 mt-0.5 truncate">{t.desc}</div>}
          </div>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 text-lg leading-none">×</button>
        </div>
      ))}
    </div>
  );
}
