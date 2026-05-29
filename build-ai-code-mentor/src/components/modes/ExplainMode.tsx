import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Layers, GraduationCap, BrainCircuit, FileCode } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { CodeBlock } from '../CodeBlock';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

type ExplainLevel = 'linebyline' | 'logic' | 'beginner' | 'advanced';

interface ExplainModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

const LEVELS: { id: ExplainLevel; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'linebyline', label: 'Line by Line', icon: Layers, desc: 'Detailed per-line breakdown' },
  { id: 'logic', label: 'Logic Flow', icon: BrainCircuit, desc: 'Understand the algorithm' },
  { id: 'beginner', label: 'Beginner', icon: GraduationCap, desc: 'Simple explanations' },
  { id: 'advanced', label: 'Advanced', icon: BookOpen, desc: 'Deep technical dive' },
];

export function ExplainMode({ provider, model, onProviderChange, onSession, activeFile }: ExplainModeProps) {
  const [level, setLevel] = useState<ExplainLevel>('linebyline');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prefilledInput, setPrefilledInput] = useState('');

  // Pre-fill with active file content
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
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Explain this code (${level} mode):\n${input}` }],
      'explain'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Explain: ${input.slice(0, 40)}...`, 'explain', activeFile?.language);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            Code Explain
          </h2>
          <p className="text-sm text-slate-500 mt-1">Paste any code and get intelligent explanations</p>
        </div>
      </div>

      {/* Active File Indicator */}
      {activeFile && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/15 mb-4"
        >
          <FileCode className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-cyan-400">Using file: <span className="font-medium">{activeFile.name}</span></span>
          <span className="text-[10px] text-slate-600 ml-auto">{activeFile.language}</span>
        </motion.div>
      )}

      {/* Level Selector */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {LEVELS.map((l) => {
          const Icon = l.icon;
          const isActive = level === l.id;
          return (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={`relative p-3 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-cyan-500/10 border-cyan-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="explainLevel"
                  className="absolute inset-0 rounded-xl border-2 border-cyan-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{l.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{l.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Input */}
      <CommandBar
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={activeFile ? `Explain ${activeFile.name}...` : 'Paste code to explain...'}
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
        initialValue={prefilledInput}
      />

      {/* Response */}
      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-medium text-cyan-400 uppercase tracking-wider">AI Response</span>
              <span className="text-[10px] text-slate-600 ml-2">{level} mode</span>
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
                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold text-cyan-300 mt-4 mb-2">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/- (.*)/g, '<div class="flex items-start gap-2 my-1"><span class="text-cyan-400 mt-1">›</span><span>$1</span></div>')
                        .replace(/\d+\. \*\*(.*?)\*\*/g, '<div class="font-semibold text-white mt-3 mb-1">$1</div>')
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
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Analyzing code structure...</span>
          </div>
        </div>
      )}
    </div>
  );
}
