// ============================================
// NEURAL STUDY AI - AI INTEGRATION
// ============================================

/**
 * AI Service using Puter.js
 * Provides free, unlimited access to GPT-4o, Claude, and Gemini
 * No API key required
 */

class AIService {
    constructor() {
        this.defaultModel = 'openai/gpt-4o-mini';
        this.models = {
            'gpt-4o': 'openai/gpt-4o-mini',
            'claude': 'anthropic/claude-3-5-sonnet',
            'gemini': 'google/gemini-1.5-flash'
        };
    }

    /**
     * Send a chat message to AI
     * @param {string} prompt - The user's prompt
     * @param {Object} options - Configuration options
     * @returns {Promise<AsyncGenerator>} Streaming response
     */
    async chat(prompt, options = {}) {
        const {
            model = this.defaultModel,
            stream = true,
            temperature = 0.7,
            max_tokens = 2000
        } = options;

        try {
            // Check if Puter is available
            if (typeof puter === 'undefined' || !puter.ai) {
                throw new Error('Puter.js not loaded');
            }

            const response = await puter.ai.chat(prompt, {
                model,
                stream,
                temperature,
                max_tokens
            });

            return response;
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    /**
     * Get available models
     */
    getModels() {
        return Object.keys(this.models);
    }

    /**
     * Set default model
     */
    setModel(modelKey) {
        if (this.models[modelKey]) {
            this.defaultModel = this.models[modelKey];
            return true;
        }
        return false;
    }
}

// Create global AI instance
const aiService = new AIService();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}