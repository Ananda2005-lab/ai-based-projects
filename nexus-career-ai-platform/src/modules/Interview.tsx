import { useState } from "react";
import { runAI } from "../lib/ai";
import { bumpStreak } from "../lib/memory";
import { Field, GlowButton, Input, Panel, Pill, ScoreRing, SectionHeader, Select, Spinner, EmptyState, Textarea } from "../components/ui";

interface QResult {
  questions: any[];
  role: string;
}

export function Interview() {
  const [role, setRole] = useState("AI Engineer");
  const [type, setType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<QResult | null>(null);
  const [idx, setIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [scoring, setScoring] = useState(false);
  const [scores, setScores] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  async function start() {
    setLoading(true);
    setSession(null);
    setDone(false);
    setScores([]);
    const r = await runAI<QResult>("interview", { role, type, difficulty });
    setSession(r.data);
    setIdx(0);
    setAnswer("");
    setFeedback(null);
    setLoading(false);
    bumpStreak();
  }

  async function submit() {
    if (!session || !answer.trim()) return;
    setScoring(true);
    const r = await runAI("interview_feedback", { question: session.questions[idx].question, answer });
    setFeedback(r.data);
    setScores((s) => [...s, r.data.score]);
    setScoring(false);
  }

  function next() {
    if (!session) return;
    if (idx + 1 >= session.questions.length) {
      setDone(true);
      return;
    }
    setIdx(idx + 1);
    setAnswer("");
    setFeedback(null);
  }

  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  return (
    <div className="space-y-6">
      <SectionHeader kicker="Module 05" title="AI Interview Coach" desc="Run a live mock interview with real-time scoring and structured feedback." />

      <Panel className="grid gap-4 p-5 sm:grid-cols-4 rise-in">
        <Field label="Role"><Input value={role} onChange={(e) => setRole(e.target.value)} /></Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="mixed">Mixed</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
          </Select>
        </Field>
        <Field label="Difficulty">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <GlowButton onClick={start} disabled={loading} className="w-full">🎙 Start Interview</GlowButton>
        </div>
      </Panel>

      {loading && <Spinner label="Preparing your interview…" />}
      {!loading && !session && <EmptyState icon="🎙" title="No active session" desc="Configure and start a mock interview to practice live." />}

      {!loading && session && !done && (
        <div className="grid gap-6 lg:grid-cols-5 scale-in">
          <Panel className="space-y-5 p-6 lg:col-span-3">
            <div className="flex items-center justify-between">
              <Pill tone="violet">Question {idx + 1} / {session.questions.length}</Pill>
              <div className="flex gap-1">
                {session.questions.map((_, i) => (
                  <span key={i} className={`h-1.5 w-6 rounded-full ${i < idx ? "bg-emerald-400" : i === idx ? "bg-cyan-400" : "bg-white/15"}`} />
                ))}
              </div>
            </div>
            <h3 className="text-xl font-semibold leading-snug text-white">{session.questions[idx].question}</h3>
            <p className="text-xs text-cyan-200/70">💡 {session.questions[idx].hint}</p>
            <Textarea rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer…" disabled={!!feedback} />
            {!feedback ? (
              <GlowButton onClick={submit} disabled={scoring || !answer.trim()}>{scoring ? "Scoring…" : "Submit Answer"}</GlowButton>
            ) : (
              <GlowButton onClick={next}>{idx + 1 >= session.questions.length ? "Finish ✓" : "Next Question →"}</GlowButton>
            )}
          </Panel>

          <div className="space-y-4 lg:col-span-2">
            <Panel className="p-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan-200/70">Ideal answer hits</h4>
              <ul className="space-y-1.5">
                {session.questions[idx].idealPoints.map((p: string, i: number) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="text-violet-400">◆</span>{p}</li>
                ))}
              </ul>
            </Panel>
            {scoring && <Panel className="p-5"><Spinner label="Evaluating your answer…" /></Panel>}
            {feedback && (
              <Panel className="space-y-3 p-5 scale-in glow-purple">
                <div className="flex items-center gap-4">
                  <ScoreRing score={feedback.score} size={80} label="Score" />
                  <p className="text-sm font-semibold text-white">{feedback.summary}</p>
                </div>
                {feedback.strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-emerald-300/70">Strengths</p>
                    <ul className="mt-1 space-y-1">{feedback.strengths.map((s: string, i: number) => <li key={i} className="text-sm text-slate-300">✓ {s}</li>)}</ul>
                  </div>
                )}
                {feedback.improvements.length > 0 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-rose-300/70">Improve</p>
                    <ul className="mt-1 space-y-1">{feedback.improvements.map((s: string, i: number) => <li key={i} className="text-sm text-slate-300">→ {s}</li>)}</ul>
                  </div>
                )}
              </Panel>
            )}
          </div>
        </div>
      )}

      {done && (
        <Panel className="flex flex-col items-center gap-4 p-10 text-center scale-in glow-cyan">
          <div className="text-4xl">🏆</div>
          <h3 className="text-2xl font-bold text-white">Interview Complete</h3>
          <ScoreRing score={avg} size={140} label="Average" />
          <p className="max-w-md text-sm text-slate-400">
            {avg >= 80 ? "Outstanding — you're interview ready." : avg >= 60 ? "Good work. Sharpen the weaker answers and run it again." : "Keep practicing — structure your answers with STAR and add concrete results."}
          </p>
          <GlowButton onClick={start}>↻ Run Again</GlowButton>
        </Panel>
      )}
    </div>
  );
}
