import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen, FileCode, X, Upload, Trash2, ChevronRight,
  FileJson, FileType, Braces, FileText, Terminal
} from 'lucide-react';
import { UploadedFile } from '../hooks/useFileUpload';
import { highlightCode } from '../utils/syntaxHighlight';

interface FileExplorerProps {
  files: UploadedFile[];
  activeFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearFiles: () => void;
  onFileSelect: (files: FileList | null) => void;
  onDrop: (e: React.DragEvent) => void;
  formatSize: (bytes: number) => string;
}

const FILE_ICONS: Record<string, React.ElementType> = {
  javascript: Braces,
  typescript: Braces,
  python: Terminal,
  java: FileCode,
  cpp: FileCode,
  go: FileCode,
  rust: FileCode,
  html: FileText,
  css: FileType,
  json: FileJson,
};

export function FileExplorer({
  files,
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onClearFiles,
  onFileSelect,
  onDrop,
  formatSize,
}: FileExplorerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeFile = files.find((f) => f.id === activeFileId);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDropWrapper = (e: React.DragEvent) => {
    setIsDragOver(false);
    onDrop(e);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
          FILES
          <span className="text-[10px] text-slate-600 ml-1">({files.length})</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 rounded hover:bg-white/[0.06] transition-colors"
            title="Upload files"
          >
            <Upload className="w-3 h-3 text-slate-500 hover:text-cyan-400" />
          </button>
          {files.length > 0 && (
            <button
              onClick={onClearFiles}
              className="p-1 rounded hover:bg-white/[0.06] transition-colors"
              title="Clear all"
            >
              <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-400" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.h,.hpp,.go,.rs,.html,.htm,.css,.scss,.sass,.json,.md,.yaml,.yml,.sh,.sql,.php,.rb,.swift,.kt,.dart,.txt"
          onChange={(e) => onFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col flex-1 min-h-0"
          >
            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDropWrapper}
              onClick={() => files.length === 0 && fileInputRef.current?.click()}
              className={`mx-2 mt-2 p-3 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                isDragOver
                  ? 'border-cyan-500/40 bg-cyan-500/5'
                  : files.length === 0
                  ? 'border-white/[0.08] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.03]'
                  : 'border-white/[0.04] bg-transparent'
              }`}
            >
              {files.length === 0 ? (
                <div className="text-center py-4">
                  <Upload className="w-5 h-5 text-slate-600 mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-500">Drop code files here</p>
                  <p className="text-[9px] text-slate-700 mt-0.5">or click to browse</p>
                </div>
              ) : (
                <p className="text-[10px] text-slate-600 text-center">Drop more files here</p>
              )}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
              {files.map((file) => {
                const Icon = FILE_ICONS[file.language] || FileCode;
                const isActive = file.id === activeFileId;
                return (
                  <div
                    key={file.id}
                    onClick={() => {
                      onSelectFile(file.id);
                      setShowPreview(true);
                    }}
                    className={`group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all ${
                      isActive
                        ? 'bg-cyan-500/10 border border-cyan-500/20'
                        : 'hover:bg-white/[0.03] border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[11px] truncate ${isActive ? 'text-white' : 'text-slate-400'}`}>
                        {file.name}
                      </div>
                      <div className="text-[9px] text-slate-700">
                        {formatSize(file.size)} · {file.language}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveFile(file.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/[0.06] transition-all"
                    >
                      <X className="w-3 h-3 text-slate-600 hover:text-red-400" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Preview Modal */}
      <AnimatePresence>
        {showPreview && activeFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[80vh] glass-strong rounded-xl border border-white/[0.08] overflow-hidden flex flex-col"
            >
              {/* Preview Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-medium text-white">{activeFile.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500 border border-white/[0.04]">
                    {activeFile.language}
                  </span>
                  <span className="text-[10px] text-slate-600">{formatSize(activeFile.size)}</span>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-auto p-4">
                <pre className="text-sm leading-relaxed terminal">
                  <code
                    dangerouslySetInnerHTML={{
                      __html: highlightCode(activeFile.content, activeFile.language),
                    }}
                  />
                </pre>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
