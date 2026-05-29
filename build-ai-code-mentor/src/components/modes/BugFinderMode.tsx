import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bug, AlertTriangle, AlertCircle, Info, CheckCircle2, FileCode } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { CodeBlock } from '../CodeBlock';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

interface BugFinderModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

export function BugFinderMode({ provider, model, onProviderChange, onSession, activeFile }: BugFinderModeProps) {
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
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Find bugs in this code:\n${input}` }],
      'bugfinder'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Bug Finder: ${input.slice(0, 40)}...`, 'bugfinder', activeFile?.language);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-400" />
            Bug Finder
          </h2>
          <p className="text-sm text-slate-500 mt-1">Detect syntax errors, logic bugs, and code smells</p>
        </div>
      </div>

      {activeFile && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 mb-4"
        >
          <FileCode className="w-3.5 h-3.5 text-red-400" />
          <span className="text-xs text-red-400">Scanning file: <span className="font-medium">{activeFile.name}</span></span>
          <span className="text-[10px] text-slate-600 ml-auto">{activeFile.language}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: AlertTriangle, label: 'Syntax', color: 'text-red-400', desc: 'Parse errors' },
          { icon: AlertCircle, label: 'Logic', color: 'text-orange-400', desc: 'Runtime issues' },
          { icon: Info, label: 'Imports', color: 'text-yellow-400', desc: 'Missing deps' },
          { icon: CheckCircle2, label: 'Smells', color: 'text-emerald-400', desc: 'Anti-patterns' },
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
        placeholder={activeFile ? `Scan ${activeFile.name} for bugs...` : 'Paste code to analyze for bugs...'}
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
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-medium text-red-400 uppercase tracking-wider">Analysis Report</span>
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
                        .replace(/### (.*)/g, '<h4 class="text-sm font-semibold text-red-300 mt-4 mb-2">$1</h4>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>')
                        .replace(/🔴/g, '<span class="text-red-400">🔴</span>')
                        .replace(/🟡/g, '<span class="text-yellow-400">🟡</span>')
                        .replace(/✅/g, '<span class="text-green-400">✅</span>')
                        .replace(/❌/g, '<span class="text-red-400">❌</span>')
                        .replace(/⚠️/g, '<span class="text-yellow-400">⚠️</span>')
                        .replace(/- (.*)/g, '<div class="flex items-start gap-2 my-1"><span class="text-red-400 mt-1">›</span><span>$1</span></div>')
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
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Scanning for vulnerabilities...</span>
          </div>
        </div>
      )}
    </div>
  );
}
