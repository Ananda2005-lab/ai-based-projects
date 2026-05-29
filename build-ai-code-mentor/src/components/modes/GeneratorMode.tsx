import { useState } from 'react';
import { motion } from 'framer-motion';
import { Code2, FunctionSquare, AppWindow, FolderTree, MessageSquare } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { CodeBlock } from '../CodeBlock';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

type GenType = 'function' | 'app' | 'project' | 'comments';

interface GeneratorModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

const GEN_TYPES: { id: GenType; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'function', label: 'Function', icon: FunctionSquare, desc: 'Single function or method' },
  { id: 'app', label: 'App', icon: AppWindow, desc: 'Complete application' },
  { id: 'project', label: 'Project', icon: FolderTree, desc: 'Folder structure & setup' },
  { id: 'comments', label: 'Comments', icon: MessageSquare, desc: 'Docstrings & comments' },
];

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'HTML/CSS'];

export function GeneratorMode({ provider, model, onProviderChange, onSession, activeFile: _activeFile }: GeneratorModeProps) {
  const [genType, setGenType] = useState<GenType>('function');
  const [language, setLanguage] = useState('JavaScript');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (input: string, _p: AIProvider, _m: string) => {
    setIsLoading(true);
    setResponse('');
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Generate ${genType} in ${language}:\n${input}` }],
      'generator'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Generate ${genType}: ${input.slice(0, 40)}...`, 'generator', language);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-green-400" />
            Code Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">Generate functions, apps, projects, and documentation</p>
        </div>
      </div>

      {/* Type Selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {GEN_TYPES.map((t) => {
          const Icon = t.icon;
          const isActive = genType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setGenType(t.id)}
              className={`relative p-3 rounded-xl border transition-all duration-200 text-left ${
                isActive
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="genType"
                  className="absolute inset-0 rounded-xl border-2 border-green-500/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={`w-4 h-4 mb-2 ${isActive ? 'text-green-400' : 'text-slate-500'}`} />
              <div className={`text-xs font-medium ${isActive ? 'text-white' : 'text-slate-400'}`}>{t.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{t.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Language Selector */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              language === lang
                ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/[0.03] text-slate-500 border border-white/[0.04] hover:text-slate-300'
            }`}
          >
            {lang}
          </button>
        ))}
      </div>

      <CommandBar
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder={`Describe the ${genType} you want to generate...`}
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
      />

      {response && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Generated Code</span>
              <span className="text-[10px] text-slate-600 ml-2">{language}</span>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              {response.split('```').map((part, i) => {
                if (i % 2 === 1) {
                  const lines = part.split('\n');
                  const lang = lines[0].trim() || language.toLowerCase();
                  const code = lines.slice(1).join('\n');
                  return <CodeBlock key={i} code={code} language={lang} animate={i === 1} />;
                }
                return (
                  <div
                    key={i}
                    className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: part
                        .replace(/## (.*)/g, '<h3 class="text-lg font-bold text-white mt-6 mb-3">$1</h3>')
                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold text-green-300 mt-4 mb-2">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/- (.*)/g, '<div class="flex items-start gap-2 my-1"><span class="text-green-400 mt-1">›</span><span>$1</span></div>')
                        .replace(/✅/g, '<span class="text-green-400">✅</span>')
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
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Generating code...</span>
          </div>
        </div>
      )}
    </div>
  );
}
