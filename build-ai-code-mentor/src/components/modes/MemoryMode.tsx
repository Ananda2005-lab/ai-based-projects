import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, Target, Heart, Trash2, Flame, TrendingUp, Code2 } from 'lucide-react';
import { UserMemory } from '../../hooks/useMemory';
import { IntelligenceTimeline } from '../IntelligenceTimeline';

interface MemoryModeProps {
  memory: UserMemory;
  onAddGoal: (goal: string) => void;
  onRemoveGoal: (index: number) => void;
  onToggleLanguage: (lang: string) => void;
  onClearSessions: () => void;
}

const ALL_LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML/CSS'];

export function MemoryMode({ memory, onAddGoal, onRemoveGoal, onToggleLanguage, onClearSessions }: MemoryModeProps) {
  const [newGoal, setNewGoal] = useState('');

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      onAddGoal(newGoal.trim());
      setNewGoal('');
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" />
            Memory System
          </h2>
          <p className="text-sm text-slate-500 mt-1">Your learning goals, history, and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <StatCard icon={TrendingUp} label="Total Queries" value={memory.totalQueries.toString()} color="text-cyan-400" />
        <StatCard icon={Flame} label="Day Streak" value={`${memory.streakDays}d`} color="text-orange-400" />
        <StatCard icon={Heart} label="Favorites" value={memory.favoriteLanguages.length.toString()} color="text-pink-400" />
        <StatCard icon={Code2} label="Sessions" value={memory.recentSessions.length.toString()} color="text-green-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Learning Goals */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Learning Goals</h3>
          </div>
          <div className="flex gap-2 mb-3">
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
              placeholder="Add a learning goal..."
              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:border-purple-500/30 transition-colors"
            />
            <button
              onClick={handleAddGoal}
              className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium hover:bg-purple-500/20 transition-colors"
            >
              Add
            </button>
          </div>
          <div className="space-y-2 overflow-y-auto flex-1">
            {memory.learningGoals.length === 0 && (
              <p className="text-xs text-slate-600 text-center py-4">No goals yet. Add your first learning goal!</p>
            )}
            {memory.learningGoals.map((goal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04] group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                <span className="text-xs text-slate-300 flex-1">{goal}</span>
                <button
                  onClick={() => onRemoveGoal(i)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/[0.06] transition-all"
                >
                  <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Favorite Languages */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-4 h-4 text-pink-400" />
            <h3 className="text-sm font-semibold text-white">Favorite Languages</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_LANGUAGES.map((lang) => {
              const isActive = memory.favoriteLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  onClick={() => onToggleLanguage(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                      : 'bg-white/[0.02] text-slate-500 border border-white/[0.04] hover:text-slate-300'
                  }`}
                >
                  {lang}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex-1">
            <IntelligenceTimeline sessions={memory.recentSessions} />
          </div>

          {memory.recentSessions.length > 0 && (
            <button
              onClick={onClearSessions}
              className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600 hover:text-red-400 transition-colors self-start"
            >
              <Trash2 className="w-3 h-3" />
              Clear history
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-3 flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <div>
        <div className="text-lg font-bold text-white">{value}</div>
        <div className="text-[10px] text-slate-500">{label}</div>
      </div>
    </div>
  );
}
