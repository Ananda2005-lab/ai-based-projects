// ============================================
// NEURAL STUDY AI - MAIN APPLICATION
// ============================================

// GLOBAL STATE
let currentMode = 'chat';
let currentModel = 'openai/gpt-4o-mini';
let chatHistory = [];
let isGenerating = false;

// MODE PROMPTS
const modePrompts = {
    chat: "You are Neural Study AI, a helpful, intelligent study companion. Answer anything the user asks with clear, accurate, and engaging explanations. Be conversational and supportive.",
    explain: "You are an expert teacher. Explain concepts at the appropriate level with clear examples, analogies, and step-by-step breakdowns. Make complex topics simple and memorable.",
    notes: "You are a note-taking expert. Create well-structured, comprehensive study notes. Use headings, bullet points, key terms, and summaries. Format for easy studying and revision.",
    quiz: "You are a quiz creator. Generate clear questions with correct answers and explanations. Include variety: MCQs, true/false, short answer. Always provide answer keys.",
    flashcards: "You are a flashcard expert. Create concise Q&A pairs perfect for spaced repetition. Front: clear question. Back: brief, memorable answer.",
    planner: "You are a study planner. Create detailed, realistic study schedules with daily tasks, time estimates, milestones, and review sessions. Be specific and actionable.",
    solve: "You are a problem-solving tutor. Solve step-by-step, explain your reasoning, show all work, and teach the method so the user can solve similar problems.",
    code: "You are a coding mentor. Write clean, well-commented code. Explain how it works, suggest improvements, and teach best practices. Support all programming languages."
};

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    setupModelSelector();
    setupEventListeners();
    document.getElementById('messageInput').focus();
});

function setupEventListeners() {
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('input', () => autoResize(input));
    }
}

// MODEL SELECTOR
function setupModelSelector() {
    document.querySelectorAll('.model-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.model-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const model = chip.dataset.model;
            const modelMap = {
                'gpt-4o-mini': 'openai/gpt-4o-mini',
                'claude-3-5-sonnet': 'anthropic/claude-3-5-sonnet',
                'gemini-1.5-flash': 'google/gemini-1.5-flash'
            };
            currentModel = modelMap[model] || 'openai/gpt-4o-mini';
        });
    });
}

// SWITCH MODE
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.mode === mode) item.classList.add('active');
    });

    const placeholders = {
        chat: "Ask anything... (e.g., 'Explain black holes' or 'Create notes on calculus')",
        explain: "What should I explain? (e.g., 'Explain photosynthesis')",
        notes: "What topic for notes? (e.g., 'Notes on World War 2')",
        quiz: "Quiz on what topic? (e.g., 'Quiz on algebra')",
        flashcards: "Flashcards for? (e.g., 'Spanish vocabulary')",
        planner: "What to plan? (e.g., '7-day Python plan')",
        solve: "What problem? (e.g., 'Solve x² + 5x + 6 = 0')",
        code: "What code do you need? (e.g., 'Python web scraper')"
    };
    
    document.getElementById('messageInput').placeholder = placeholders[mode];
    document.getElementById('messageInput').focus();
    toggleSidebar(false);
}

// USE PROMPT
function usePrompt(prompt) {
    document.getElementById('messageInput').value = prompt;
    autoResize(document.getElementById('messageInput'));
    sendMessage();
}

// AUTO RESIZE TEXTAREA
function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    document.getElementById('sendBtn').disabled = !textarea.value.trim() || isGenerating;
}

// HANDLE KEYDOWN
function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// SEND MESSAGE
async function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || isGenerating) return;

    // Hide welcome, show chat
    document.getElementById('welcomeScreen').classList.add('hidden');
    document.getElementById('chatMessages').classList.add('active');

    // Add user message
    addMessage('user', message);
    chatHistory.push({ role: 'user', content: message });

    // Clear input
    input.value = '';
    autoResize(input);
    input.focus();

    // Show typing
    isGenerating = true;
    document.getElementById('sendBtn').disabled = true;
    const typingId = addTypingIndicator();

    try {
        // Build prompt with mode context
        const systemPrompt = modePrompts[currentMode];
        const fullPrompt = `${systemPrompt}\n\nUser: ${message}`;

        // Call AI with streaming
        const response = await puter.ai.chat(fullPrompt, {
            model: currentModel,
            stream: true,
            temperature: 0.7,
            max_tokens: 2000
        });

        // Remove typing, add assistant message
        removeTypingIndicator(typingId);
        const messageId = addMessage('assistant', '');

        let fullResponse = '';
        for await (const part of response) {
            if (part?.text) {
                fullResponse += part.text;
                updateMessage(messageId, fullResponse);
            }
        }

        chatHistory.push({ role: 'assistant', content: fullResponse });
        saveHistory();

    } catch (error) {
        console.error('AI Error:', error);
        removeTypingIndicator(typingId);
        addMessage('assistant', '❌ Sorry, I encountered an error. Please try again. The AI service might be temporarily unavailable.');
    } finally {
        isGenerating = false;
        document.getElementById('sendBtn').disabled = false;
    }
}

// ADD MESSAGE
function addMessage(role, content) {
    const messagesDiv = document.getElementById('chatMessages');
    const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.id = messageId;
    
    const avatar = role === 'user' ? '👤' : '⚡';
    const roleName = role === 'user' ? 'You' : 'Neural AI';
    
    messageDiv.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <div class="message-role">${roleName}</div>
            <div class="message-text">${formatMessage(content)}</div>
        </div>
    `;
    
    messagesDiv.appendChild(messageDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return messageId;
}

// UPDATE MESSAGE (for streaming)
function updateMessage(messageId, content) {
    const messageDiv = document.getElementById(messageId);
    if (messageDiv) {
        const textDiv = messageDiv.querySelector('.message-text');
        textDiv.innerHTML = formatMessage(content);
        
        // Highlight code blocks
        textDiv.querySelectorAll('pre code').forEach(block => {
            if (window.hljs) {
                hljs.highlightElement(block);
            }
        });
        
        const messagesDiv = document.getElementById('chatMessages');
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
}

// FORMAT MESSAGE (Markdown)
function formatMessage(text) {
    if (!text) return '';
    
    // Use marked for markdown parsing
    if (window.marked) {
        marked.setOptions({
            breaks: true,
            gfm: true
        });
        return marked.parse(text);
    }
    
    // Fallback: simple formatting
    return text.replace(/\n/g, '<br>');
}

// TYPING INDICATOR
function addTypingIndicator() {
    const messagesDiv = document.getElementById('chatMessages');
    const typingId = 'typing-' + Date.now();
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant';
    typingDiv.id = typingId;
    typingDiv.innerHTML = `
        <div class="message-avatar">⚡</div>
        <div class="message-content">
            <div class="message-role">Neural AI</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    messagesDiv.appendChild(typingDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    return typingId;
}

function removeTypingIndicator(typingId) {
    const typingDiv = document.getElementById(typingId);
    if (typingDiv) typingDiv.remove();
}

// NEW CHAT
function newChat() {
    chatHistory = [];
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('chatMessages').classList.remove('active');
    document.getElementById('welcomeScreen').classList.remove('hidden');
    document.getElementById('messageInput').focus();
    toggleSidebar(false);
}

// CLEAR CHAT
function clearChat() {
    if (confirm('Clear current chat?')) {
        newChat();
    }
}

// EXPORT CHAT
function exportChat() {
    if (chatHistory.length === 0) {
        alert('No chat to export');
        return;
    }
    
    let exportText = 'NEURAL STUDY AI - CHAT EXPORT\n';
    exportText += '='.repeat(50) + '\n\n';
    exportText += `Date: ${new Date().toLocaleString()}\n`;
    exportText += `Mode: ${currentMode}\n\n`;
    
    chatHistory.forEach(msg => {
        exportText += `${msg.role.toUpperCase()}:\n${msg.content}\n\n${'-'.repeat(50)}\n\n`;
    });
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural-ai-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// SAVE HISTORY
function saveHistory() {
    if (chatHistory.length > 0) {
        const history = JSON.parse(localStorage.getItem('neuralAI_history') || '[]');
        const firstMessage = chatHistory[0]?.content?.substring(0, 50) || 'New Chat';
        
        history.unshift({
            id: Date.now(),
            title: firstMessage,
            preview: firstMessage,
            timestamp: new Date().toISOString(),
            messages: chatHistory
        });
        
        // Keep only last 20
        localStorage.setItem('neuralAI_history', JSON.stringify(history.slice(0, 20)));
        loadHistory();
    }
}

// LOAD HISTORY
function loadHistory() {
    const history = JSON.parse(localStorage.getItem('neuralAI_history') || '[]');
    const historyList = document.getElementById('historyList');
    
    if (!historyList) return;
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="history-item">No chats yet</div>';
        return;
    }
    
    historyList.innerHTML = history.map(item => `
        <div class="history-item" onclick="loadChat(${item.id})" title="${item.title}">
            ${item.title}
        </div>
    `).join('');
}

// LOAD CHAT
function loadChat(id) {
    const history = JSON.parse(localStorage.getItem('neuralAI_history') || '[]');
    const chat = history.find(h => h.id === id);
    
    if (chat) {
        chatHistory = chat.messages;
        document.getElementById('welcomeScreen').classList.add('hidden');
        document.getElementById('chatMessages').classList.add('active');
        document.getElementById('chatMessages').innerHTML = '';
        
        chat.messages.forEach(msg => {
            addMessage(msg.role, msg.content);
        });
        
        toggleSidebar(false);
    }
}

// TOGGLE SIDEBAR
function toggleSidebar(force) {
    const sidebar = document.getElementById('sidebar');
    if (typeof force === 'boolean') {
        sidebar.classList.toggle('open', force);
    } else {
        sidebar.classList.toggle('open');
    }
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.querySelector('.mobile-menu-btn');
    
    if (window.innerWidth <= 768 && 
        sidebar && sidebar.classList.contains('open') && 
        !sidebar.contains(e.target) && 
        menuBtn && !menuBtn.contains(e.target)) {
        toggleSidebar(false);
    }
});