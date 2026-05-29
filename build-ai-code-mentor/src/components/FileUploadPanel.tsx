import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileCode, X, Eye, ChevronDown, ChevronUp,
  BookOpen, Bug, Wrench, Zap, Sparkles, FolderOpen,
  Trash2, FilePlus
} from 'lucide-react';
import { UploadedFile } from '../hooks/useFileUpload';
import { highlightCode } from '../utils/syntaxHighlight';
import { AppMode } from './Sidebar';

interface FileUploadPanelProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onFileSelect: (files: FileList | null) => void;
  onDrop: (e: React.DragEvent) => void;
  formatSize: (bytes: number) => string;
  onAction: (mode: AppMode) => void;
  currentMode: AppMode;
}

const LANG_BADGE: Record<string, { label: string; color: string }> = {
  javascript: { label: 'JS', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  typescript: { label: 'TS', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  python:     { label: 'PY', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  java:       { label: 'JV', color: 'text-orange-400 bg-orange-400/10 border-orange-400/20' },
  cpp:        { label: 'C++', color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  go:         { label: 'GO', color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  rust:       { label: 'RS', color: 'text-red-400 bg-red-400/10 border-red-400/20' },
  html:       { label: 'HTML', color: 'text-pink-400 bg-pink-400/10 border-pink-400/20' },
  css:        { label: 'CSS', color: 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20' },
  json:       { label: 'JSON', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
};

const AI_ACTIONS: { mode: AppMode; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { mode: 'explain',   label: 'Explain',   icon: BookOpen, color: 'text-cyan-400',   bg: 'bg-cyan-400/10 border-cyan-400/25 hover:bg-cyan-400/20' },
  { mode: 'bugfinder', label: 'Bug Scan',  icon: Bug,      color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/25 hover:bg-red-400/20' },
  { mode: 'debug',     label: 'Debug',     icon: Wrench,   color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/25 hover:bg-orange-400/20' },
  { mode: 'refactor',  label: 'Refactor',  icon: Zap,      color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/25 hover:bg-yellow-400/20' },
];

export function FileUploadPanel({
  files,
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onClearFiles,
  onFileSelect,
  onDrop,
  formatSize,
  onAction,
  currentMode,
}: FileUploadPanelProps) {
  const [isDragOver, setIsDragOver]     = useState(false);
  const [previewFile, setPreviewFile]   = useState<UploadedFile | null>(null);
  const [panelOpen, setPanelOpen]       = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find(f => f.id === activeFileId) ?? null;

  /* ─── drag helpers ─── */
  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = ()                    => setIsDragOver(false);
  const handleDropWrap  = (e: React.DragEvent) => { setIsDragOver(false); onDrop(e); };

  return (
    <>
      {/* ══════════════════════════════════════════════
          UPLOAD PANEL CARD
      ══════════════════════════════════════════════ */}
      <div className="mb-5 glass-card rounded-2xl border border-white/[0.07] overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">File Upload</span>
            {files.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/25">
                {files.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"
            >
              <FilePlus className="w-3.5 h-3.5" />
              Upload File
            </button>
            {files.length > 0 && (
              <button
                onClick={onClearFiles}
                title="Clear all files"
                className="p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
              </button>
            )}
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-all"
            >
              {panelOpen
                ? <ChevronUp   className="w-3.5 h-3.5 text-slate-500" />
                : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.go,.rs,.html,.htm,.css,.scss,.sass,.json,.md,.yaml,.yml,.sh,.sql,.php,.rb,.swift,.kt,.dart,.txt"
            onChange={e => { onFileSelect(e.target.files); e.target.value = ''; }}
            className="hidden"
          />
        </div>

        {/* ── Collapsible body ── */}
        <AnimatePresence initial={false}>
          {panelOpen && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              {/* ── Drop Zone ── */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDropWrap}
                onClick={() => fileInputRef.current?.click()}
                className={`mx-4 mt-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all duration-200 select-none
                  ${isDragOver
                    ? 'border-cyan-400/60 bg-cyan-400/5 scale-[1.01]'
                    : 'border-white/[0.09] bg-white/[0.02] hover:border-cyan-500/30 hover:bg-cyan-500/[0.03]'}
                  ${files.length === 0 ? 'py-8' : 'py-4'}`}
              >
                <motion.div
                  animate={isDragOver ? { scale: 1.15, rotate: -6 } : { scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center"
                >
                  <Upload className={`w-5 h-5 ${isDragOver ? 'text-cyan-400' : 'text-slate-500'}`} />
                </motion.div>

                {isDragOver ? (
                  <p className="text-sm font-semibold text-cyan-400">Drop to upload!</p>
                ) : (
                  <>
                    <p className="text-xs font-medium text-slate-400">
                      {files.length === 0 ? 'Drop your code files here' : 'Drop more files'}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      .py .js .ts .java .cpp .go .rs .html .css ...
                    </p>
                  </>
                )}
              </div>

              {/* ── File List ── */}
              {files.length > 0 && (
                <div className="px-4 mt-3 space-y-1.5 max-h-48 overflow-y-auto pb-2">
                  {files.map(file => {
                    const badge  = LANG_BADGE[file.language] ?? { label: file.language.toUpperCase().slice(0,4), color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' };
                    const isActive = file.id === activeFileId;

                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 8 }}
                        onClick={() => onSelectFile(file.id)}
                        className={`group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-150 border
                          ${isActive
                            ? 'bg-cyan-500/10 border-cyan-500/25 shadow-sm shadow-cyan-500/10'
                            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/[0.09]'}`}
                      >
                        {/* Lang badge */}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.color} flex-shrink-0`}>
                          {badge.label}
                        </span>

                        {/* Filename */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs truncate font-medium ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                            {file.name}
                          </p>
                          <p className="text-[9px] text-slate-700">{formatSize(file.size)}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); setPreviewFile(file); }}
                            className="p-1 rounded-md hover:bg-white/[0.08] transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-3 h-3 text-slate-400 hover:text-cyan-400" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); onRemoveFile(file.id); }}
                            className="p-1 rounded-md hover:bg-red-500/10 transition-colors"
                            title="Remove"
                          >
                            <X className="w-3 h-3 text-slate-400 hover:text-red-400" />
                          </button>
                        </div>

                        {/* Active dot */}
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0 animate-pulse" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* ── AI Action Buttons (shown only when a file is active) ── */}
              <AnimatePresence>
                {activeFile && (
                  <motion.div
                    key="actions"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="mx-4 mt-3 mb-4 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                  >
                    {/* Active file label */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span className="text-[11px] text-slate-400">
                        AI Actions for&nbsp;
                        <span className="text-white font-semibold">{activeFile.name}</span>
                      </span>
                    </div>

                    {/* Action grid */}
                    <div className="grid grid-cols-2 gap-2">
                      {AI_ACTIONS.map(action => {
                        const Icon     = action.icon;
                        const isCurr   = currentMode === action.mode;
                        return (
                          <button
                            key={action.mode}
                            onClick={() => onAction(action.mode)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-150
                              ${isCurr
                                ? `${action.bg} ${action.color} shadow-sm`
                                : `bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:bg-white/[0.05]`}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isCurr ? action.color : ''}`} />
                            {action.label}
                            {isCurr && (
                              <span className="ml-auto text-[9px] font-bold uppercase tracking-wider opacity-70">Active</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="text-[10px] text-slate-700 mt-2 text-center">
                      File is pre-loaded — just hit Send ↑
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state hint */}
              {files.length === 0 && (
                <p className="text-center text-[10px] text-slate-700 pb-4 mt-2">
                  Supports .py .js .ts .java .cpp .go .rs .html .css and more
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════
          FILE PREVIEW MODAL
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewFile(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 12 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[82vh] flex flex-col glass-strong rounded-2xl border border-white/[0.09] overflow-hidden shadow-2xl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <FileCode className="w-4 h-4 text-cyan-400 ml-2" />
                  <span className="text-sm font-semibold text-white">{previewFile.name}</span>
                  {(() => {
                    const b = LANG_BADGE[previewFile.language];
                    return b ? (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${b.color}`}>{b.label}</span>
                    ) : null;
                  })()}
                  <span className="text-[11px] text-slate-500">{formatSize(previewFile.size)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { onSelectFile(previewFile.id); setPreviewFile(null); }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-all"
                  >
                    Use this file
                  </button>
                  <button
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg hover:bg-white/[0.07] transition-colors"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Code preview */}
              <div className="flex-1 overflow-auto bg-[#0d1117] p-5">
                <pre className="text-sm leading-relaxed terminal">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(previewFile.content, previewFile.language),
                    }}
                  />
                </pre>
              </div>

              {/* Footer actions */}
              <div className="px-5 py-3 border-t border-white/[0.07] bg-white/[0.02] flex items-center gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 mr-2">AI Actions:</span>
                {AI_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.mode}
                      onClick={() => { onSelectFile(previewFile.id); onAction(action.mode); setPreviewFile(null); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${action.bg} ${action.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {action.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
