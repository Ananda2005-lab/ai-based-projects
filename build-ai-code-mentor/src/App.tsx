import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar, AppMode } from './components/Sidebar';
import { IntelligenceTimeline } from './components/IntelligenceTimeline';
import { FileUploadPanel } from './components/FileUploadPanel';
import { ExplainMode } from './components/modes/ExplainMode';
import { BugFinderMode } from './components/modes/BugFinderMode';
import { GeneratorMode } from './components/modes/GeneratorMode';
import { DebugMode } from './components/modes/DebugMode';
import { RefactorMode } from './components/modes/RefactorMode';
import { RoadmapMode } from './components/modes/RoadmapMode';
import { QuizMode } from './components/modes/QuizMode';
import { ProjectIdeasMode } from './components/modes/ProjectIdeasMode';
import { MemoryMode } from './components/modes/MemoryMode';
import { SettingsMode } from './components/modes/SettingsMode';
import { useMemory } from './hooks/useMemory';
import { useFileUpload } from './hooks/useFileUpload';
import { AIProvider } from './utils/aiProviders';
import { Activity, Cpu, Zap, FileCode } from 'lucide-react';

/* Modes where file upload is useful */
const FILE_MODES: AppMode[] = ['explain', 'bugfinder', 'debug', 'refactor'];

export default function App() {
  const [activeMode, setActiveMode] = useState<AppMode>('explain');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('groq');
  const [model, setModel] = useState('llama-3.1-70b');

  const { memory, addSession, addGoal, removeGoal, toggleLanguage, clearSessions } = useMemory();
  const fileUpload = useFileUpload();

  const handleProviderChange = useCallback((p: AIProvider, m: string) => {
    setProvider(p); setModel(m);
  }, []);

  const handleSession = useCallback((title: string, mode: string, language?: string) => {
    addSession({ type: 'session', title, content: '', mode, language });
  }, [addSession]);

  /* Switch mode AND keep file selected */
  const handleFileAction = useCallback((mode: AppMode) => {
    setActiveMode(mode);
  }, []);

  const renderMode = () => {
    const props = {
      provider,
      model,
      onProviderChange: handleProviderChange,
      onSession: handleSession,
      activeFile: fileUpload.activeFile,
    };
    switch (activeMode) {
      case 'explain':    return <ExplainMode    {...props} />;
      case 'bugfinder':  return <BugFinderMode  {...props} />;
      case 'generator':  return <GeneratorMode  {...props} />;
      case 'debug':      return <DebugMode       {...props} />;
      case 'refactor':   return <RefactorMode   {...props} />;
      case 'roadmap':    return <RoadmapMode    {...props} />;
      case 'quiz':       return <QuizMode       {...props} />;
      case 'projects':   return <ProjectIdeasMode {...props} />;
      case 'memory':
        return (
          <MemoryMode
            memory={memory}
            onAddGoal={addGoal}
            onRemoveGoal={removeGoal}
            onToggleLanguage={toggleLanguage}
            onClearSessions={clearSessions}
          />
        );
      case 'settings':
        return <SettingsMode provider={provider} model={model} onProviderChange={handleProviderChange} />;
      default:
        return <ExplainMode {...props} />;
    }
  };

  const showFilePanel = FILE_MODES.includes(activeMode);

  return (
    <div className="h-screen w-screen bg-[#0a0e1a] text-slate-200 overflow-hidden flex">
      {/* ── Grid Background ── */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
      <div className="fixed top-0 right-0 w-[600px] h-[600px] bg-purple-500/[0.03] rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

      {/* ── Left Sidebar (nav) ── */}
      <Sidebar
        activeMode={activeMode}
        onModeChange={setActiveMode}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(v => !v)}
      />

      {/* ── Main Column ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* ── Top Bar ── */}
        <header className="h-14 glass-strong border-b border-white/[0.06] flex items-center justify-between px-5 z-10 flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider hidden sm:block">System Online</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">{provider}</span>
            </div>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider truncate max-w-[120px]">{model}</span>
            </div>
            {fileUpload.activeFile && (
              <>
                <div className="w-px h-4 bg-white/[0.06]" />
                <div className="flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px] text-cyan-400 font-semibold truncate max-w-[110px]">
                    {fileUpload.activeFile.name}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">{memory.totalQueries} queries</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <span className="text-[10px] text-slate-400">{memory.streakDays}d streak</span>
            </div>
            {fileUpload.files.length > 0 && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15">
                <FileCode className="w-3 h-3 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 font-semibold">{fileUpload.files.length} file{fileUpload.files.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </header>

        {/* ── Content Row ── */}
        <div className="flex-1 flex min-h-0">

          {/* ══ Middle Column ══ */}
          <main className="flex-1 overflow-y-auto min-w-0">
            <div className="p-5 h-full flex flex-col">

              {/* File Upload Panel — prominent, always on top for file-capable modes */}
              <AnimatePresence>
                {showFilePanel && (
                  <motion.div
                    key="file-panel"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FileUploadPanel
                      files={fileUpload.files}
                      activeFileId={fileUpload.activeFileId}
                      onSelectFile={fileUpload.setActiveFileId}
                      onRemoveFile={fileUpload.removeFile}
                      onClearFiles={fileUpload.clearFiles}
                      onFileSelect={fileUpload.handleFileSelect}
                      onDrop={fileUpload.handleDrop}
                      formatSize={fileUpload.formatSize}
                      onAction={handleFileAction}
                      currentMode={activeMode}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Active Mode */}
              <div className="flex-1 min-h-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeMode}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                    className="h-full"
                  >
                    {renderMode()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </main>

          {/* ══ Right Panel — Timeline (hidden on small screens) ══ */}
          {activeMode !== 'memory' && (
            <aside className="w-60 border-l border-white/[0.06] p-4 overflow-y-auto hidden xl:flex flex-col gap-4 flex-shrink-0">
              <IntelligenceTimeline sessions={memory.recentSessions} />

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-xs font-semibold text-white">Quick Stats</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Sessions',  val: memory.recentSessions.length },
                    { label: 'Goals',     val: memory.learningGoals.length },
                    { label: 'Languages', val: memory.favoriteLanguages.length },
                    { label: 'Files',     val: fileUpload.files.length },
                  ].map(row => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-slate-500">{row.label}</span>
                      <span className="text-slate-300 font-medium">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-white">Languages</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {memory.favoriteLanguages.map(lang => (
                    <span key={lang} className="text-[10px] px-2 py-1 rounded bg-cyan-500/5 text-cyan-400 border border-cyan-500/10">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
