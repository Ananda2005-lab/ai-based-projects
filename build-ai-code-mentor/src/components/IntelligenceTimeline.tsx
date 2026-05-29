import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, BookOpen, Bug, Code2, Wrench, Route, HelpCircle, Lightbulb, Database } from 'lucide-react';
import { MemoryEntry } from '../hooks/useMemory';

const MODE_ICONS: Record<string, React.ElementType> = {
  explain: BookOpen,
  bugfinder: Bug,
  generator: Code2,
  debug: Wrench,
  refactor: Zap,
  roadmap: Route,
  quiz: HelpCircle,
  projects: Lightbulb,
  memory: Database,
};

const MODE_COLORS: Record<string, string> = {
  explain: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  bugfinder: 'text-red-400 bg-red-400/10 border-red-400/20',
  generator: 'text-green-400 bg-green-400/10 border-green-400/20',
  debug: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  refactor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  roadmap: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  quiz: 'text-pink-400 bg-pink-400/10 border-pink-400/20',
  projects: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
};

interface IntelligenceTimelineProps {
  sessions: MemoryEntry[];
}

export function IntelligenceTimeline({ sessions }: IntelligenceTimelineProps) {
  if (sessions.length === 0) {
    return (
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Intelligence Timeline</h3>
        </div>
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] flex items-center justify-center mx-auto mb-3">
            <Zap className="w-5 h-5 text-slate-600" />
          </div>
          <p className="text-sm text-slate-500">No activity yet. Start coding to build your timeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-semibold text-white">Intelligence Timeline</h3>
        <span className="ml-auto text-[10px] text-slate-500">{sessions.length} sessions</span>
      </div>
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
        <AnimatePresence>
          {sessions.slice(0, 20).map((session, index) => {
            const Icon = MODE_ICONS[session.mode || 'explain'] || Code2;
            const colorClass = MODE_COLORS[session.mode || 'explain'] || MODE_COLORS.explain;
            const time = new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group cursor-pointer"
              >
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-300 truncate group-hover:text-white transition-colors">
                    {session.title}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    {session.mode} {session.language && `· ${session.language}`}
                  </p>
                </div>
                <span className="text-[10px] text-slate-600 flex-shrink-0">{time}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
