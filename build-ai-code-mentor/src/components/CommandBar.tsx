import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { AIProvider, AI_PROVIDERS } from '../utils/aiProviders';

interface CommandBarProps {
  onSubmit: (input: string, provider: AIProvider, model: string) => void;
  isLoading: boolean;
  placeholder?: string;
  provider: AIProvider;
  model: string;
  onProviderChange: (provider: AIProvider, model: string) => void;
  initialValue?: string;
}

export function CommandBar({
  onSubmit,
  isLoading,
  placeholder = 'Enter your code or question...',
  provider,
  model,
  onProviderChange,
  initialValue = '',
}: CommandBarProps) {
  const [input, setInput] = useState(initialValue);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(initialValue);
  }, [initialValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if (!input.trim() || isLoading) return;
    onSubmit(input, provider, model);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 200) + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  return (
    <div className="relative">
      <div className="glass-strong rounded-xl border border-white/[0.08] p-1">
        <div className="flex items-end gap-2 p-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoResize();
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none max-h-[200px] min-h-[44px] py-2.5 px-3 terminal"
            rows={1}
          />
          <div className="flex items-center gap-2 pb-1.5">
            {/* Provider Selector */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowProviderMenu(!showProviderMenu)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
              >
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-xs text-slate-400">{AI_PROVIDERS[provider].name}</span>
                <ChevronDown className="w-3 h-3 text-slate-600" />
              </button>
              <AnimatePresence>
                {showProviderMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full right-0 mb-2 w-64 glass-strong rounded-xl border border-white/[0.08] overflow-hidden z-50"
                  >
                    {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => {
                      const config = AI_PROVIDERS[p];
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            onProviderChange(p, config.models[0]);
                            setShowProviderMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors border-b border-white/[0.04] last:border-0 ${
                            provider === p ? 'bg-cyan-500/5' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-medium ${provider === p ? 'text-cyan-400' : 'text-slate-300'}`}>
                              {config.name}
                            </span>
                            {provider === p && (
                              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{config.description}</p>
                          <div className="flex gap-1 mt-1.5 flex-wrap">
                            {config.models.map((m) => (
                              <button
                                key={m}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onProviderChange(p, m);
                                }}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  provider === p && model === m
                                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                                    : 'bg-white/[0.04] text-slate-500 border border-white/[0.04] hover:text-slate-300'
                                }`}
                              >
                                {m}
                              </button>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-lg transition-all duration-200 ${
                input.trim() && !isLoading
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-navy-950 shadow-lg shadow-cyan-500/20'
                  : 'bg-white/[0.04] text-slate-600 cursor-not-allowed'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
