import { motion } from 'framer-motion';
import { FileCode, X, BookOpen, Bug, Wrench, Zap, ArrowRight } from 'lucide-react';
import { UploadedFile } from '../hooks/useFileUpload';
import { AppMode } from './Sidebar';

interface FileActionBarProps {
  activeFile: UploadedFile | null;
  onClearActiveFile: () => void;
  onAction: (mode: AppMode) => void;
  currentMode: AppMode;
}

const ACTIONS: { mode: AppMode; label: string; icon: React.ElementType; color: string }[] = [
  { mode: 'explain', label: 'Explain', icon: BookOpen, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  { mode: 'bugfinder', label: 'Find Bugs', icon: Bug, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { mode: 'debug', label: 'Debug', icon: Wrench, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  { mode: 'refactor', label: 'Refactor', icon: Zap, color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
];

export function FileActionBar({ activeFile, onClearActiveFile, onAction, currentMode }: FileActionBarProps) {
  if (!activeFile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="glass-card rounded-xl p-3 mb-4 border-l-2 border-l-cyan-500/40"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <FileCode className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">{activeFile.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.04]">
                {activeFile.language}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Select an action to perform on this file</p>
          </div>
        </div>
        <button
          onClick={onClearActiveFile}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
        >
          <X className="w-4 h-4 text-slate-500 hover:text-red-400" />
        </button>
      </div>

      <div className="flex gap-2 mt-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          const isCurrent = currentMode === action.mode;
          return (
            <button
              key={action.mode}
              onClick={() => onAction(action.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isCurrent
                  ? `${action.color} border`
                  : 'bg-white/[0.03] text-slate-400 border border-white/[0.04] hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              <Icon className="w-3 h-3" />
              {action.label}
              {isCurrent && <ArrowRight className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
