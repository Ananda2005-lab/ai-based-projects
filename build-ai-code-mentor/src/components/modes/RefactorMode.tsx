import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Eye, Layers, Gauge, Sparkles, FileCode } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { CodeBlock } from '../CodeBlock';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

type RefactorFocus = 'readability' | 'architecture' | 'performance' | 'clean';

interface RefactorModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

const FOCUS_OPTIONS: { id: RefactorFocus; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'readability', label: 'Readability', icon: Eye, desc: 'Clear naming & structure' },
  { id: 'architecture', label: 'Architecture', icon: Layers, desc: 'Design patterns & layers' },
  { id: 'performance', label: 'Performance', icon: Gauge, desc: 'Speed & efficiency' },
  { id: 'clean', label: 'Clean Code', icon: Sparkles, desc: 'Best practices' },
];

export function RefactorMode({ provider, model, onProviderChange, onSession, activeFile }: RefactorModeProps) {
  const [focus, setFocus] = useState<RefactorFocus>('readability');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledInput, setPrefilledInput] = useState('');

  useEffect(() => {
    if (activeFile) {
      setPrefilledInput(activeFile.content);
    } else {
      setPrefilledInput('');
    }
  }, [activeFile]);

  const handleSubmit = async (input: string, _p: AIProvider, _m: string) => {
    setIsLoading(true);
    setResponse('');
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Refactor this code focusing on ${focus}:\n${input}` }],
      'refactor'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Refactor (${focus}): ${input.slice(0, 40)}...`, 'refactor', activeFile?.language);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            AI Refactor
          </h2>
          <p className="text-sm text-slate-500 mt-1">Improve readability, architecture, and performance</p>
        </div>
      </div>

      {activeFile && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/15 mb-4"
        >
          <FileCode className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs text-yellow-400">Refactoring file: <span className="font-medium">{activeFile.name}</span></span>
          <span className="text-[10px] text-slate-600 ml-auto">{activeFile.language}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-6">
        {FOCUS_OPTIONS.map((f) => {
          const Icon = f.icon;
          const isActive = focus === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFocus(f.id)}
              className={`relative p-3 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="refactorFocus"
                  className="absolute inset-0 rounded-xl border-2 border-yellow-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-yellow-400' : 'text-slate-500'}`} />
              <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{f.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{f.desc}</div>
            </button>
          );
        })}
      </div>

      <CommandBar
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={activeFile ? `Refactor ${activeFile.name}...` : 'Paste code to refactor...'}
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
        initialValue={prefilledInput}
      />

      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-xs font-medium text-yellow-400 uppercase tracking-wider">Refactored Code</span>
              <span className="text-[10px] text-slate-600 ml-2">{focus} focus</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              {response.split('```').map((part, i) => {
                if (i % 2 === 1) {
                  const lines = part.split('\n');
                  const lang = lines[0].trim() || 'javascript';
                  const code = lines.slice(1).join('\n');
                  return <CodeBlock key={i} code={code} language={lang} animate={false} />;
                }
                return (
                  <div
                    key={i}
                    className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: part
                        .replace(/## (.*)/g, '<h3 class="text-lg font-bold text-white mt-6 mb-3">$1</h3>')
                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold text-yellow-300 mt-4 mb-2">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/- (.*)/g, '<div class="flex items-start gap-2 my-1"><span class="text-yellow-400 mt-1">›</span><span>$1</span></div>')
                        .replace(/\d+\. (.*)/g, '<div class="flex items-start gap-2 my-1"><span class="text-yellow-400 mt-1">$1.</span><span>$1</span></div>')
                    }}
                  />
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {isLoading && !response && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Refactoring code...</span>
          </div>
        </div>
      )}
    </div>
  );
}
