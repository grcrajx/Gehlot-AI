/**
 * GehlotAI - Static Version
 * Powered by Gemini API
 */

// --- Settings & Constants ---
// TO DEPLOY ON GITHUB PAGES: Paste your Gemini API Key below.
// Note: This key will be visible in the website source code.
const CONFIG = {
    GEMINI_API_KEY: "YOUR_API_KEY_HERE" 
};

const SUBJECT_PROMPTS = {
    General: "You are a helpful learning assistant.",
    Math: "You are a math tutor. Explain concepts clearly and show step-by-step solutions. Use LaTeX/Markdown for equations if necessary.",
    Science: "You are a science teacher. Use analogies and explain complex phenomena simply.",
    Coding: "You are a coding mentor. Provide clear code examples and explain logic.",
};

const SUBJECTS = ["General", "Math", "Science", "Coding"];

// --- State Management ---
let state = {
    view: 'landing',
    messages: JSON.parse(localStorage.getItem('messages') || '[]'),
    currentSubject: 'General',
    isLoading: false
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    renderSubjectList();
    loadMessages();
    setupEventListeners();
    
    // Auto-scroll to bottom of chat
    const chatMsgs = document.getElementById('chat-messages');
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
});

// --- View Switching ---
function switchView(viewName) {
    state.view = viewName;
    document.getElementById('landing-view').classList.toggle('hidden', viewName !== 'landing');
    document.getElementById('chat-view').classList.toggle('hidden', viewName !== 'chat');
    document.getElementById('developer-view').classList.toggle('hidden', viewName !== 'developer');
    
    if (viewName === 'chat') {
        const chatMsgs = document.getElementById('chat-messages');
        chatMsgs.scrollTop = chatMsgs.scrollHeight;
        document.getElementById('chat-input').focus();
    }
    
    // Close mobile menu if switching
    document.getElementById('mobile-menu').classList.add('hidden');
}

function startSubject(subject) {
    state.currentSubject = subject;
    document.getElementById('current-subject-title').innerText = subject + ' Tutor';
    switchView('chat');
}

function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// --- Chat Logic ---
function renderSubjectList() {
    const list = document.getElementById('subject-list');
    list.innerHTML = SUBJECTS.map(s => `
        <button onclick="startSubject('${s}')" class="w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${state.currentSubject === s ? 'bg-surface text-brand font-bold' : 'text-text-dim hover:text-white hover:bg-surface/50'}">
            ${s}
        </button>
    `).join('');
}

function loadMessages() {
    const container = document.getElementById('chat-messages');
    if (state.messages.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center p-12 space-y-4 opacity-50">
                <div class="w-20 h-20 bg-surface rounded-full flex items-center justify-center">
                    <i data-lucide="message-square" class="w-10 h-10"></i>
                </div>
                <h3 class="text-xl font-bold">No messages yet</h3>
                <p>Select a subject and start your first lesson!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    container.innerHTML = state.messages.map(m => createMessageHTML(m)).join('');
}

function createMessageHTML(message) {
    const isAi = message.role === 'assistant';
    return `
        <div class="flex ${isAi ? 'justify-start' : 'justify-end'} message-animate">
            <div class="max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-3 ${isAi ? 'bg-ai-bubble text-text-main shadow-lg' : 'bg-brand text-white shadow-brand/20 shadow-xl'}">
                <div class="prose prose-invert prose-sm max-w-none">
                    ${isAi ? marked.parse(message.content) : message.content}
                </div>
            </div>
        </div>
    `;
}

async function handleSend() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    
    if (!text || state.isLoading) return;
    
    // Add User Message
    const userMsg = { role: 'user', content: text };
    state.messages.push(userMsg);
    saveMessages();
    renderNewMessage(userMsg);
    
    input.value = '';
    input.style.height = 'auto';
    
    // Show AI Loading
    state.isLoading = true;
    showLoading();
    
    try {
        if (CONFIG.GEMINI_API_KEY === "YOUR_API_KEY_HERE" || !CONFIG.GEMINI_API_KEY) {
            throw new Error("Please set your Gemini API Key in script.js to make the chat work!");
        }

        const { GoogleGenAI } = await import('https://esm.run/@google/genai');
        
        const ai = new GoogleGenAI(CONFIG.GEMINI_API_KEY);
        const model = ai.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: SUBJECT_PROMPTS[state.currentSubject]
        });

        const result = await model.generateContent({
            contents: state.messages.map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))
        });
        
        const response = await result.response;
        const aiText = response.text();
        
        removeLoading();
        const aiMsg = { role: 'assistant', content: aiText };
        state.messages.push(aiMsg);
        saveMessages();
        renderNewMessage(aiMsg);
        
    } catch (err) {
        console.error(err);
        removeLoading();
        alert(err.message || "Something went wrong. Please check your API key and try again.");
    } finally {
        state.isLoading = false;
    }
}

function renderNewMessage(msg) {
    const container = document.getElementById('chat-messages');
    
    // Clear "No messages" if first message
    if (state.messages.length === 1) container.innerHTML = '';
    
    const div = document.createElement('div');
    div.innerHTML = createMessageHTML(msg);
    container.appendChild(div.firstElementChild);
    
    container.scrollTop = container.scrollHeight;
}

function showLoading() {
    const container = document.getElementById('chat-messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'ai-loading';
    loadingDiv.className = 'flex justify-start';
    loadingDiv.innerHTML = `
        <div class="bg-ai-bubble rounded-2xl px-5 py-3 flex items-center gap-1">
            <div class="w-1.5 h-1.5 bg-brand rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-brand rounded-full typing-dot"></div>
            <div class="w-1.5 h-1.5 bg-brand rounded-full typing-dot"></div>
        </div>
    `;
    container.appendChild(loadingDiv);
    container.scrollTop = container.scrollHeight;
}

function removeLoading() {
    const loading = document.getElementById('ai-loading');
    if (loading) loading.remove();
}

function saveMessages() {
    localStorage.setItem('messages', JSON.stringify(state.messages));
}

function clearChat() {
    if (confirm("Clear all history?")) {
        state.messages = [];
        saveMessages();
        loadMessages();
        switchView('landing');
    }
}

function explainI5() {
    if (state.messages.length === 0) return;
    const last = state.messages[state.messages.length - 1];
    if (last.role === 'assistant') {
        const input = document.getElementById('chat-input');
        input.value = "Explain what you just said more simply, like I'm 5 years old.";
        handleSend();
    }
}

// --- Expose to Window ---
window.switchView = switchView;
window.startSubject = startSubject;
window.toggleMobileMenu = toggleMobileMenu;
window.handleSend = handleSend;
window.clearChat = clearChat;
window.explainI5 = explainI5;

// --- Utils ---
function setupEventListeners() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    
    input.addEventListener('input', () => {
        input.style.height = 'auto';
        input.style.height = (input.scrollHeight) + 'px';
    });
    
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    
    sendBtn.addEventListener('click', handleSend);
}
