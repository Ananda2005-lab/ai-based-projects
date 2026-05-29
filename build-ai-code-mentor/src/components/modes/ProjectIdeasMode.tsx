import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Sprout, TreePine, Mountain, Star, Clock, Wrench } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

interface ProjectIdeasModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

type Difficulty = 'beginner' | 'intermediate' | 'advanced';

const DIFFICULTIES: { id: Difficulty; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { id: 'beginner', label: 'Beginner', icon: Sprout, color: 'text-green-400', desc: 'Foundation projects' },
  { id: 'intermediate', label: 'Intermediate', icon: TreePine, color: 'text-cyan-400', desc: 'Skill-building' },
  { id: 'advanced', label: 'Advanced', icon: Mountain, color: 'text-purple-400', desc: 'Expert level' },
];

export function ProjectIdeasMode({ provider, model, onProviderChange, onSession, activeFile: _activeFile }: ProjectIdeasModeProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (input: string, _p: AIProvider, _m: string) => {
    setIsLoading(true);
    setResponse('');
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Generate ${difficulty} project ideas for: ${input}` }],
      'projects'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Projects (${difficulty}): ${input.slice(0, 40)}...`, 'projects');
  };

  const projects = response ? parseProjects(response) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-emerald-400" />
            Project Ideas
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate coding projects for every skill level</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {DIFFICULTIES.map((d) => {
          const Icon = d.icon;
          const isActive = difficulty === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              className={`relative p-3 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="difficulty"
                  className="absolute inset-0 rounded-xl border-2 border-emerald-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 mb-2 ${isActive ? d.color : 'text-slate-500'}`} />
              <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{d.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{d.desc}</div>
            </button>
          );
        })}
      </div>

      <CommandBar
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="What tech stack or domain? (e.g., 'React Node.js')"
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
      />

      {projects.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-3">
            {projects.map((project, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="glass-card rounded-xl p-4 hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    project.difficulty === 'Beginner' ? 'bg-green-500/10 border border-green-500/20' :
                    project.difficulty === 'Intermediate' ? 'bg-cyan-500/10 border border-cyan-500/20' :
                    'bg-purple-500/10 border border-purple-500/20'
                  }`}>
                    <Star className={`w-3.5 h-3.5 ${
                      project.difficulty === 'Beginner' ? 'text-green-400' :
                      project.difficulty === 'Intermediate' ? 'text-cyan-400' :
                      'text-purple-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{project.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{project.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {project.tech && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.04]">
                          {project.tech}
                        </span>
                      )}
                      {project.time && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <Clock className="w-3 h-3" />
                          {project.time}
                        </span>
                      )}
                      {project.difficulty && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-600">
                          <Wrench className="w-3 h-3" />
                          {project.difficulty}
                        </span>
                      )}
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
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Brainstorming projects...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function parseProjects(text: string): Array<{ title: string; description: string; tech?: string; time?: string; difficulty?: string }> {
  const projects: Array<{ title: string; description: string; tech?: string; time?: string; difficulty?: string }> = [];
  const lines = text.split('\n');
  let current: { title: string; description: string; tech?: string; time?: string; difficulty?: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.match(/^\*\*\d+\.\s+/) || trimmed.match(/^#{1,3}\s+\d+\./) || trimmed.match(/^#{1,3}\s+[^#].*Project/i)) {
      if (current) projects.push(current);
      const title = trimmed.replace(/^\*\*\d+\.\s+/, '').replace(/\*\*/g, '').replace(/^#{1,3}\s+/, '');
      current = { title, description: '' };
    } else if (trimmed.startsWith('- Tech:') || trimmed.startsWith('Tech:')) {
      if (current) current.tech = trimmed.replace(/^[-\s]*Tech:\s*/, '');
    } else if (trimmed.startsWith('- Time:') || trimmed.startsWith('Time:')) {
      if (current) current.time = trimmed.replace(/^[-\s]*Time:\s*/, '');
    } else if (trimmed.startsWith('- Difficulty:') || trimmed.startsWith('Difficulty:')) {
      if (current) current.difficulty = trimmed.replace(/^[-\s]*Difficulty:\s*/, '');
    } else if (trimmed.startsWith('- ') && current) {
      current.description += trimmed.replace(/^- /, '') + ' ';
    } else if (trimmed && current && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
      current.description += trimmed + ' ';
    }
  }

  if (current) projects.push(current);

  if (projects.length === 0) {
    return [{ title: 'Sample Project', description: text.slice(0, 200) + '...' }];
  }

  return projects;
}
