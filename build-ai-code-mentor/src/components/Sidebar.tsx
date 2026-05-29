import { motion } from 'framer-motion';
import {
  BookOpen, Bug, Code2, Wrench, Route,
  HelpCircle, Lightbulb, Database, Settings,
  Zap, ChevronRight
} from 'lucide-react';

export type AppMode =
  | 'explain' | 'bugfinder' | 'generator' | 'debug'
  | 'refactor' | 'roadmap' | 'quiz' | 'projects'
  | 'memory' | 'settings';

interface NavItem {
  id: AppMode;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'explain', label: 'Explain', icon: BookOpen, description: 'Line-by-line code explanation', color: 'text-cyan-400' },
  { id: 'bugfinder', label: 'Bug Finder', icon: Bug, description: 'Detect errors & code smells', color: 'text-red-400' },
  { id: 'generator', label: 'Generator', icon: Code2, description: 'Generate functions & projects', color: 'text-green-400' },
  { id: 'debug', label: 'Debug', icon: Wrench, description: 'Analyze errors & stack traces', color: 'text-orange-400' },
  { id: 'refactor', label: 'Refactor', icon: Zap, description: 'Improve readability & architecture', color: 'text-yellow-400' },
  { id: 'roadmap', label: 'Roadmap', icon: Route, description: 'Personalized learning paths', color: 'text-purple-400' },
  { id: 'quiz', label: 'Quiz', icon: HelpCircle, description: 'Coding challenges & MCQs', color: 'text-pink-400' },
  { id: 'projects', label: 'Projects', icon: Lightbulb, description: 'Project idea engine', color: 'text-emerald-400' },
];

const SECONDARY_ITEMS: NavItem[] = [
  { id: 'memory', label: 'Memory', icon: Database, description: 'Learning history & goals', color: 'text-blue-400' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'AI providers & preferences', color: 'text-slate-400' },
];

interface SidebarProps {
  activeMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeMode, onModeChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="h-full glass-strong flex flex-col border-r border-white/[0.06] z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <Code2 className="w-5 h-5 text-cyan-400" />
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="overflow-hidden"
          >
            <h1 className="text-sm font-bold tracking-wider text-white whitespace-nowrap">
              NEXUS<span className="text-cyan-400">AI</span>
            </h1>
            <p className="text-[10px] text-slate-500 tracking-widest uppercase whitespace-nowrap">
              Code Mentor
            </p>
          </motion.div>
        )}
        <button
          onClick={onToggleCollapse}
          className="ml-auto p-1 rounded hover:bg-white/5 transition-colors"
        >
          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className={`px-3 mb-2 ${collapsed ? 'hidden' : 'block'}`}>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">Intelligence</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activeMode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                isActive
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-cyan-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && (
                <div className="text-left overflow-hidden">
                  <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.label}
                  </div>
                  <div className="text-[10px] text-slate-600 truncate">{item.description}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Secondary Nav */}
      <div className="py-3 px-2 border-t border-white/[0.06]">
        <div className={`px-3 mb-2 ${collapsed ? 'hidden' : 'block'}`}>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider">System</span>
        </div>
        {SECONDARY_ITEMS.map((item) => {
          const isActive = activeMode === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onModeChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-cyan-500/10 border border-cyan-500/20'
                  : 'hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-300'}`} />
              {!collapsed && (
                <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </motion.aside>
  );
}
