export type AIProvider = 'groq' | 'openrouter' | 'ollama' | 'local';

export interface AIProviderConfig {
  name: string;
  description: string;
  models: string[];
  requiresKey: boolean;
}

export const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  groq: {
    name: 'Groq',
    description: 'Ultra-fast inference with Llama, Mixtral, and Gemma models',
    models: ['llama-3.1-70b', 'mixtral-8x7b', 'gemma-2-9b'],
    requiresKey: true,
  },
  openrouter: {
    name: 'OpenRouter',
    description: 'Access GPT-4, Claude, and hundreds of models via one API',
    models: ['gpt-4o', 'claude-3.5-sonnet', 'deepseek-coder'],
    requiresKey: true,
  },
  ollama: {
    name: 'Ollama',
    description: 'Run models locally - codellama, mistral, llama3',
    models: ['codellama', 'mistral', 'llama3'],
    requiresKey: false,
  },
  local: {
    name: 'Local Model',
    description: 'Custom local endpoint or LM Studio',
    models: ['custom'],
    requiresKey: false,
  },
};

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIRequest {
  provider: AIProvider;
  model: string;
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  latency?: number;
}
