import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Terminal } from 'lucide-react';
import { highlightCode, detectLanguage } from '../utils/syntaxHighlight';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  filename?: string;
  animate?: boolean;
}

export function CodeBlock({ code, language, filename, animate = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [displayedCode, setDisplayedCode] = useState(animate ? '' : code);
  const [isAnimating, setIsAnimating] = useState(animate);
  const detectedLang = language || detectLanguage(code);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayedCode(code);
      return;
    }
    setIsAnimating(true);
    setDisplayedCode('');
    let index = 0;
    const interval = setInterval(() => {
      index += 3;
      if (index >= code.length) {
        setDisplayedCode(code);
        setIsAnimating(false);
        clearInterval(interval);
      } else {
        setDisplayedCode(code.slice(0, index));
      }
    }, 8);
    return () => clearInterval(interval);
  }, [code, animate]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const highlighted = highlightCode(displayedCode, detectedLang);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0d1117]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#161b22] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
          </div>
          {filename && (
            <span className="ml-3 text-xs text-slate-400 font-mono">{filename}</span>
          )}
          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-500 font-mono uppercase">
            {detectedLang}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors group"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-green-400" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div ref={containerRef} className="overflow-x-auto">
        <pre className="p-4 text-sm leading-relaxed terminal">
          <code
            className="block"
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>

      {/* Typing indicator */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-3"
          >
            <div className="flex items-center gap-2">
              <Terminal className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span className="text-[10px] text-cyan-400/60">Generating response...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function InlineCode({ children }: { children: string }) {
  return (
    <code className="px-1.5 py-0.5 rounded bg-white/[0.06] text-cyan-300 text-sm font-mono border border-white/[0.06]">
      {children}
    </code>
  );
}
