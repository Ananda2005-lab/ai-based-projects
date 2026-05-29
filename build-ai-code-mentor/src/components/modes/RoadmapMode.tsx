import { useState } from 'react';
import { motion } from 'framer-motion';
import { Route, Target, Calendar, BookOpen, Code2, Rocket } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

interface RoadmapModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

export function RoadmapMode({ provider, model, onProviderChange, onSession, activeFile: _activeFile }: RoadmapModeProps) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (input: string, _p: AIProvider, _m: string) => {
    setIsLoading(true);
    setResponse('');
    await new Promise(r => setTimeout(r, 1200 + Math.random() * 1500));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Create a learning roadmap for: ${input}` }],
      'roadmap'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Roadmap: ${input.slice(0, 40)}...`, 'roadmap');
  };

  const phases = response ? parseRoadmap(response) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-purple-400" />
            Learning Roadmap
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate personalized learning paths and milestones</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Target, label: 'Goals', color: 'text-purple-400', desc: 'Set objectives' },
          { icon: Calendar, label: 'Timeline', color: 'text-cyan-400', desc: 'Schedule phases' },
          { icon: BookOpen, label: 'Resources', color: 'text-green-400', desc: 'Curated links' },
          { icon: Rocket, label: 'Projects', color: 'text-orange-400', desc: 'Build & learn' },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-xl p-3 flex items-center gap-3">
            <item.icon className={`w-4 h-4 ${item.color}`} />
            <div>
              <div className="text-xs font-medium text-white">{item.label}</div>
              <div className="text-[10px] text-slate-500">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <CommandBar
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="What do you want to learn? (e.g., 'Full-Stack JavaScript')"
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
      />

      {phases.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="space-y-4">
            {phases.map((phase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/30" />
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-purple-400">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white mb-2">{phase.title}</h3>
                    <div className="space-y-1.5">
                      {phase.items.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Code2 className="w-3 h-3 text-purple-400 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading && !response && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Building your roadmap...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function parseRoadmap(text: string): Array<{ title: string; items: string[] }> {
  const phases: Array<{ title: string; items: string[] }> = [];
  let currentPhase: { title: string; items: string[] } | null = null;

  text.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('### Phase') || trimmed.startsWith('### ') || trimmed.match(/^Phase \d/i)) {
      if (currentPhase) phases.push(currentPhase);
      currentPhase = { title: trimmed.replace(/#+ /, '').replace(/^Phase \d+:?\s*/i, ''), items: [] };
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('**') || trimmed.match(/^\d+\./)) {
      const clean = trimmed.replace(/^[-*\d.]+\s*/, '').replace(/\*\*/g, '');
      if (clean && currentPhase) currentPhase.items.push(clean);
    } else if (trimmed.startsWith('## ') && !currentPhase) {
      // Skip main title
    }
  });

  if (currentPhase) phases.push(currentPhase);

  if (phases.length === 0) {
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    return [{ title: 'Learning Path', items: lines.slice(0, 10).map(l => l.replace(/^[-*\d.]+\s*/, '').replace(/\*\*/g, '')) }];
  }

  return phases;
}
