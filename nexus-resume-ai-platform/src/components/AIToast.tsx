import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface Toast { id: number; msg: string; kind: "info" | "error" | "ok" }
const Ctx = createContext<(msg: string, kind?: Toast["kind"]) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, kind: Toast["kind"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="nx-no-print pointer-events-none fixed bottom-5 left-1/2 z-[200] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`nx-fade-up nx-glass-strong pointer-events-auto rounded-xl px-4 py-2 text-sm shadow-2xl ${
              t.kind === "error" ? "text-rose-300" : t.kind === "ok" ? "text-emerald-300" : "text-cyan-200"
            }`}
          >
            {t.kind === "error" ? "⚠ " : t.kind === "ok" ? "✓ " : "✦ "}{t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
