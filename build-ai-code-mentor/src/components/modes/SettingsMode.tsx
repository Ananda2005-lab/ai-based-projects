import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Key, Server, Globe, Cpu, Shield, Info } from 'lucide-react';
import { AIProvider, AI_PROVIDERS } from '../../utils/aiProviders';

interface SettingsModeProps {
  provider: AIProvider;
  model: string;
  onProviderChange: (p: AIProvider, m: string) => void;
}

export function SettingsMode({ provider, model, onProviderChange }: SettingsModeProps) {
  const [apiKey, setApiKey] = useState('');
  const [localEndpoint, setLocalEndpoint] = useState('http://localhost:11434');
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-400" />
            Settings
          </h2>
          <p className="text-sm text-slate-500 mt-1">Configure AI providers and preferences</p>
        </div>
      </div>

      <div className="space-y-4 max-w-2xl">
        {/* Provider Selection */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">AI Provider</h3>
          </div>
          <div className="space-y-3">
            {(Object.keys(AI_PROVIDERS) as AIProvider[]).map((p) => {
              const config = AI_PROVIDERS[p];
              const isActive = provider === p;
              return (
                <button
                  key={p}
                  onClick={() => onProviderChange(p, config.models[0])}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-cyan-500/10' : 'bg-white/[0.03]'
                      }`}>
                        {p === 'groq' && <Cpu className="w-4 h-4 text-cyan-400" />}
                        {p === 'openrouter' && <Globe className="w-4 h-4 text-purple-400" />}
                        {p === 'ollama' && <Server className="w-4 h-4 text-green-400" />}
                        {p === 'local' && <Shield className="w-4 h-4 text-orange-400" />}
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                          {config.name}
                        </div>
                        <div className="text-[10px] text-slate-500">{config.description}</div>
                      </div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-3 ml-11">
                    {config.models.map((m) => (
                      <button
                        key={m}
                        onClick={(e) => {
                          e.stopPropagation();
                          onProviderChange(p, m);
                        }}
                        className={`text-[10px] px-2 py-1 rounded ${
                          isActive && model === m
                            ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                            : 'bg-white/[0.03] text-slate-500 border border-white/[0.04]'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* API Key */}
        {AI_PROVIDERS[provider].requiresKey && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-semibold text-white">API Key</h3>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Enter ${AI_PROVIDERS[provider].name} API key...`}
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-yellow-500/30 transition-colors"
                />
              </div>
              <button
                onClick={() => setShowKey(!showKey)}
                className="px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 hover:text-white transition-colors"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </motion.div>
        )}

        {/* Local Endpoint */}
        {(provider === 'ollama' || provider === 'local') && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Server className="w-4 h-4 text-green-400" />
              <h3 className="text-sm font-semibold text-white">Local Endpoint</h3>
            </div>
            <input
              type="text"
              value={localEndpoint}
              onChange={(e) => setLocalEndpoint(e.target.value)}
              placeholder="http://localhost:11434"
              className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-green-500/30 transition-colors"
            />
            <p className="text-[10px] text-slate-600 mt-2">
              Default Ollama endpoint is http://localhost:11434. For LM Studio, use http://localhost:1234.
            </p>
          </motion.div>
        )}

        {/* About */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-semibold text-white">About NEXUS AI</h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            NEXUS CODE MENTOR AI is a developer intelligence system designed to accelerate your coding journey.
            All processing happens through your chosen AI provider. No code is stored on external servers.
          </p>
          <div className="flex gap-4 mt-3">
            <span className="text-[10px] text-slate-600">v1.0.0</span>
            <span className="text-[10px] text-slate-600">React + Vite + Tailwind</span>
            <span className="text-[10px] text-slate-600">Open Source</span>
          </div>
        </div>
      </div>
    </div>
  );
}
