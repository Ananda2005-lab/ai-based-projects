import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, CheckCircle2, Trophy, Brain, Bug } from 'lucide-react';
import { CommandBar } from '../CommandBar';
import { CodeBlock } from '../CodeBlock';
import { AIProvider } from '../../utils/aiProviders';
import { generateMockResponse } from '../../utils/mockResponses';
import { UploadedFile } from '../../hooks/useFileUpload';

interface QuizModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
  onSession: (title: string, mode: string, language?: string) => void;
  activeFile: UploadedFile | null;
}

export function QuizMode({ provider, model, onProviderChange, onSession, activeFile: _activeFile }: QuizModeProps) {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const handleSubmit = async (input: string, _p: AIProvider, _m: string) => {
    setIsLoading(true);
    setResponse('');
    setRevealed(false);
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 1500));
    const mockResponse = generateMockResponse(
      [{ role: 'user', content: `Generate a coding quiz about: ${input}` }],
      'quiz'
    );
    setResponse(mockResponse);
    setIsLoading(false);
    onSession(`Quiz: ${input.slice(0, 40)}...`, 'quiz');
  };

  const quiz = response ? parseQuiz(response) : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-pink-400" />
            Coding Quiz
          </h2>
          <p className="text-sm text-slate-500 mt-1">MCQs, debug challenges, and algorithm questions</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Brain, label: 'MCQ', color: 'text-pink-400', desc: 'Multiple choice' },
          { icon: Bug, label: 'Debug', color: 'text-orange-400', desc: 'Find the bug' },
          { icon: Trophy, label: 'Algorithm', color: 'text-yellow-400', desc: 'Complexity & logic' },
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
        placeholder="What topic should the quiz cover? (e.g., 'JavaScript closures')"
        provider={provider}
        model={model}
        onProviderChange={onProviderChange}
      />

      {quiz && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex-1 overflow-y-auto"
        >
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-pulse" />
              <span className="text-xs font-medium text-pink-400 uppercase tracking-wider">Challenge</span>
            </div>

            {quiz.code && (
              <div className="mb-4">
                <CodeBlock code={quiz.code} animate={false} />
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-sm font-bold text-white mb-3">{quiz.question}</h3>
              {quiz.options.length > 0 && (
                <div className="space-y-2">
                  {quiz.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setRevealed(true)}
                      className="w-full text-left p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-pink-500/20 transition-all"
                    >
                      <span className="text-xs text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                      <span className="text-sm text-slate-300">{opt}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm font-bold text-green-400">Answer</span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{quiz.explanation}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!revealed && quiz.options.length === 0 && (
              <button
                onClick={() => setRevealed(true)}
                className="mt-2 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm font-medium hover:bg-pink-500/20 transition-colors"
              >
                Reveal Answer
              </button>
            )}
          </div>
        </motion.div>
      )}

      {isLoading && !response && (
        <div className="mt-6 flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="text-sm text-slate-500 ml-2">Crafting challenge...</span>
          </div>
        </div>
      )}
    </div>
  );
}

function parseQuiz(text: string): { question: string; options: string[]; code: string; explanation: string } {
  const lines = text.split('\n');
  let question = '';
  let code = '';
  let inCode = false;
  const options: string[] = [];
  let explanation = '';
  let inExplanation = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) {
      code += line + '\n';
      continue;
    }
    if (trimmed.startsWith('### Question') || trimmed.startsWith('## Question')) {
      continue;
    }
    if (trimmed.startsWith('### Options') || trimmed.startsWith('## Options')) {
      continue;
    }
    if (trimmed.startsWith('### Correct') || trimmed.startsWith('## Correct') || trimmed.startsWith('### Explanation') || trimmed.startsWith('## Explanation')) {
      inExplanation = true;
      continue;
    }
    if (trimmed.match(/^[A-D][.)]\s/) || trimmed.match(/^\d+[.)]\s/)) {
      options.push(trimmed.replace(/^[A-D\d][.)]\s*/, ''));
      continue;
    }
    if (!question && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      question = trimmed;
      continue;
    }
    if (inExplanation) {
      explanation += trimmed + ' ';
    }
  }

  if (!explanation) {
    explanation = text.split('### Explanation')[1] || text.split('## Explanation')[1] || 'Check the analysis above for the detailed explanation.';
  }

  return {
    question: question || 'What is the output of this code?',
    options: options.length > 0 ? options : ['Option A', 'Option B', 'Option C', 'Option D'],
    code: code.trim(),
    explanation: explanation.trim() || 'The correct answer is shown in the analysis.',
  };
}
