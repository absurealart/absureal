// chat.js - AI Chat Assistant dengan TTS, UI Responsif, Memori Percakapan, dan Fitur Tambahan
document.addEventListener('DOMContentLoaded', () => {
    // ==================== DOM ELEMENTS ====================
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const modelSelect = document.getElementById('model-select');
    const newChatBtn = document.getElementById('new-chat');
    const historyList = document.getElementById('history-list');

    // ==================== STATE MANAGEMENT ====================
    let conversations = JSON.parse(localStorage.getItem('conversations')) || [];
    let currentConversationId = null;
    let messageCounter = 0;
    let ttsEnabled = localStorage.getItem('ttsEnabled') === 'true';
    let conversationContext = []; // Untuk menyimpan konteks percakapan

    // ==================== INITIALIZATION ====================
    function init() {
        loadConversations();
        if (conversations.length === 0) {
            createNewConversation();
        } else {
            loadConversation(conversations[0].id);
        }
        setupTTSToggle();
        setupUsageInfo();
    }

    function setupTTSToggle() {
        const ttsToggle = document.createElement('button');
        ttsToggle.id = 'tts-toggle';
        ttsToggle.className = 'neuromorphic-btn p-2 rounded-lg';
        ttsToggle.innerHTML = `
            <i class="fas ${ttsEnabled ? 'fa-volume-up' : 'fa-volume-mute'}"></i> 
            ${ttsEnabled ? 'TTS ON' : 'TTS OFF'}
        `;
        if (ttsEnabled) ttsToggle.classList.add('active');
        
        ttsToggle.addEventListener('click', toggleTTS);
        document.querySelector('.chat-controls')?.appendChild(ttsToggle) || 
            document.querySelector('.chat-input')?.insertAdjacentElement('beforebegin', ttsToggle);
    }

    function setupUsageInfo() {
        // Hapus info box yang sudah ada jika ada
        const existingInfo = document.querySelector('.history-info');
        if (existingInfo) existingInfo.remove();

        const infoBox = document.createElement('div');
        infoBox.className = 'history-info';
        infoBox.innerHTML = `
            <div class="info-content">
                <p><strong>Petunjuk Penggunaan:</strong></p>
                <p><medium>klik percakapan untuk menampilkan tombol aksi</medium></p>
                <ul>
                    <li><i class="fas fa-copy"></i> tombol untuk menyalin percakapn</li>
                    <li><i class="fas fa-volume-up"></i> tombol untuk mendengarkan pesan </li>
                    <li><i class="fas fa-download"></i> Tombol untuk menyimpan audio</li>
                </ul>
            </div>
        `;
        
        // Tempatkan info box di atas history list
        const historyContainer = historyList.closest('.conversation-history');
        if (historyContainer) {
            historyContainer.insertBefore(infoBox, historyList);
        } else {
            // Fallback jika container tidak ditemukan
            const chatContent = document.getElementById('chatContent');
            if (chatContent) {
                const conversationHistory = chatContent.querySelector('.conversation-history');
                if (conversationHistory) {
                    conversationHistory.insertBefore(infoBox, historyList);
                }
            }
        }
    }

    // ==================== CORE FUNCTIONS ====================
    function toggleTTS() {
        ttsEnabled = !ttsEnabled;
        localStorage.setItem('ttsEnabled', ttsEnabled);
        
        const ttsToggle = document.getElementById('tts-toggle');
        if (ttsEnabled) {
            ttsToggle.innerHTML = '<i class="fas fa-volume-up"></i> TTS ON';
            ttsToggle.classList.add('active');
        } else {
            ttsToggle.innerHTML = '<i class="fas fa-volume-mute"></i> TTS OFF';
            ttsToggle.classList.remove('active');
        }
    }

    function createNewConversation() {
        const newId = Date.now().toString();
        const newConversation = {
            id: newId,
            title: "New Chat",
            model: modelSelect.value,
            messages: [{
                id: generateMessageId(),
                sender: 'bot',
                text: "Hello! I'm your AI assistant. How can I help you today?",
                timestamp: new Date().toISOString()
            }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        conversations.unshift(newConversation);
        currentConversationId = newId;
        conversationContext = []; // Reset konteks untuk percakapan baru
        saveConversations();
        renderConversation(newConversation);
        updateHistoryList();
    }

    function loadConversation(conversationId) {
        const conversation = conversations.find(c => c.id === conversationId);
        if (conversation) {
            currentConversationId = conversation.id;
            modelSelect.value = conversation.model;
            
            // Bangun kembali konteks percakapan dari riwayat
            conversationContext = conversation.messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));
            
            renderConversation(conversation);
            highlightActiveConversation(conversationId);
        }
    }

    function renderConversation(conversation) {
        chatMessages.innerHTML = '';
        conversation.messages.forEach(msg => {
            addMessage(msg.text, msg.sender === 'user', msg.id);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // ==================== MESSAGE MANAGEMENT ====================
    function addMessage(text, isUser = false, messageId = null) {
        const id = messageId || generateMessageId();
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
        messageDiv.dataset.id = id;
        
        // Message Content
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        messageContent.textContent = text;
        messageDiv.appendChild(messageContent);

        // Action Buttons (Structured Layout)
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        actionsDiv.style.display = 'none'; // Sembunyikan secara default

        // TTS Button (Bot only)
        if (!isUser) {
            const ttsBtn = createActionButton(
                '<i class="fas fa-volume-up"></i>', 
                'tts-btn', 
                () => generateAudioGet(text)
            );
            
            // Download Audio Button
            const downloadBtn = createActionButton(
                '<i class="fas fa-download"></i>', 
                'download-btn', 
                () => downloadAudio(text)
            );
            
            actionsDiv.appendChild(ttsBtn);
            actionsDiv.appendChild(downloadBtn);
        }

        // Copy Button
        const copyBtn = createActionButton(
            '<i class="fas fa-copy"></i>', 
            'copy-btn', 
            (e) => copyToClipboard(text, e)
        );
        
        // Delete Button
        const deleteBtn = createActionButton(
            '<i class="fas fa-trash"></i>', 
            'delete-btn', 
            () => deleteMessage(id)
        );

        actionsDiv.appendChild(copyBtn);
        actionsDiv.appendChild(deleteBtn);
        messageDiv.appendChild(actionsDiv);
        
        // Add click event to show/hide actions
        messageContent.addEventListener('click', () => {
            // Hide all other action buttons first
            document.querySelectorAll('.message-actions').forEach(el => {
                el.style.display = 'none';
            });
            // Toggle current message's actions
            actionsDiv.style.display = actionsDiv.style.display === 'none' ? 'flex' : 'none';
        });
        
        // Add to DOM
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Save to conversation history
        if (currentConversationId && !messageId) {
            updateConversationWithNewMessage(id, text, isUser);
            
            // Tambahkan ke konteks percakapan
            conversationContext.push({
                role: isUser ? 'user' : 'assistant',
                content: text
            });
            
            // Auto-TTS for bot messages
            if (!isUser && ttsEnabled) {
                generateAudioGet(text);
            }
        }
        
        return id;
    }

    function updateConversationWithNewMessage(id, text, isUser) {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation) {
            conversation.messages.push({
                id,
                sender: isUser ? 'user' : 'bot',
                text,
                timestamp: new Date().toISOString()
            });
            
            // Update conversation title if first user message
            if (isUser && conversation.messages.filter(m => m.sender === 'user').length === 1) {
                conversation.title = text.length > 30 ? `${text.substring(0, 30)}...` : text;
            }
            
            conversation.updatedAt = new Date().toISOString();
            saveConversations();
            updateHistoryList();
        }
    }

    // ==================== UTILITY FUNCTIONS ====================
    function createActionButton(html, className, onClick) {
        const button = document.createElement('button');
        button.className = `message-action ${className}`;
        button.innerHTML = html;
        button.addEventListener('click', onClick);
        return button;
    }

    function generateMessageId() {
        return `msg-${Date.now()}-${++messageCounter}`;
    }

    function deleteMessage(messageId) {
        const conversation = conversations.find(c => c.id === currentConversationId);
        if (conversation) {
            // Hapus dari riwayat percakapan
            const deletedMsg = conversation.messages.find(m => m.id === messageId);
            conversation.messages = conversation.messages.filter(m => m.id !== messageId);
            
            // Hapus dari konteks percakapan jika ada
            if (deletedMsg) {
                conversationContext = conversationContext.filter(ctx => 
                    !(ctx.role === (deletedMsg.sender === 'user' ? 'user' : 'assistant') && 
                      ctx.content === deletedMsg.text)
                );
            }
            
            saveConversations();
            document.querySelector(`.message[data-id="${messageId}"]`)?.remove();
        }
    }

    function copyToClipboard(text, event) {
        navigator.clipboard.writeText(text).then(() => {
            const button = event.target.closest('.copy-btn');
            if (button) {
                const originalHTML = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => button.innerHTML = originalHTML, 2000);
            }
        }).catch(err => {
            console.error('Copy failed:', err);
            // Fallback method
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        });
    }

    // ==================== TTS FUNCTION ====================
    async function generateAudioGet(text, voice = "alloy") {
        try {
            const encodedText = encodeURIComponent(text);
            const params = new URLSearchParams({
                model: "openai-audio",
                voice: voice,
            });
            const url = `https://text.pollinations.ai/${encodedText}?${params.toString()}&referer=telekboyo.my.id`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            
            audio.play().catch(e => {
                console.error("Audio play failed:", e);
                alert("Couldn't play audio. Please check your browser permissions.");
            });
            
        } catch (error) {
            console.error("TTS Error:", error);
            alert("Failed to generate speech. Please try again.");
        }
    }

    // ==================== DOWNLOAD AUDIO FUNCTION ====================
    async function downloadAudio(text, voice = "alloy") {
        try {
            const encodedText = encodeURIComponent(text);
            const params = new URLSearchParams({
                model: "openai-audio",
                voice: voice,
            });
            const url = `https://text.pollinations.ai/${encodedText}?${params.toString()}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = audioUrl;
            a.download = `tts-${Date.now()}.mp3`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Revoke the object URL to free memory
            setTimeout(() => URL.revokeObjectURL(audioUrl), 100);
            
        } catch (error) {
            console.error("Download Audio Error:", error);
            alert("Failed to download audio. Please try again.");
        }
    }

    // ==================== HISTORY MANAGEMENT ====================
    function updateHistoryList() {
        historyList.innerHTML = '';
        conversations.forEach(conversation => {
            const item = document.createElement('div');
            item.className = `history-item ${conversation.id === currentConversationId ? 'active' : ''}`;
            item.dataset.id = conversation.id;
            
            item.innerHTML = `
                <span class="history-title">${conversation.title}</span>
                <span class="history-date">${formatDate(conversation.updatedAt)}</span>
                <span class="history-delete">&times;</span>
            `;
            
            item.querySelector('.history-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteConversation(conversation.id);
            });
            
            item.addEventListener('click', () => loadConversation(conversation.id));
            historyList.appendChild(item);
        });
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function highlightActiveConversation(conversationId) {
        document.querySelectorAll('.history-item').forEach(item => {
            item.classList.toggle('active', item.dataset.id === conversationId);
        });
    }

    function deleteConversation(conversationId) {
        conversations = conversations.filter(c => c.id !== conversationId);
        if (currentConversationId === conversationId) {
            currentConversationId = conversations[0]?.id || null;
            if (!currentConversationId) createNewConversation();
        }
        saveConversations();
        updateHistoryList();
    }

    function saveConversations() {
        localStorage.setItem('conversations', JSON.stringify(conversations));
    }

    function loadConversations() {
        const saved = localStorage.getItem('conversations');
        if (saved) conversations = JSON.parse(saved);
        updateHistoryList();
    }

    // ==================== API COMMUNICATION ====================
    async function handleUserInput() {
        const prompt = userInput.value.trim();
        if (!prompt) return;

        addMessage(prompt, true);
        userInput.value = '';
        showTypingIndicator();

        try {
            // Kirim seluruh konteks percakapan ke API
            const response = await fetchChatCompletion([
                ...conversationContext,
                { role: 'user', content: prompt }
            ], { model: modelSelect.value });
            
            addMessage(response);
        } catch (error) {
            console.error("Chat error:", error);
            addMessage("Sorry, I encountered an error. Please try again.");
        } finally {
            hideTypingIndicator();
        }
    }

    async function fetchChatCompletion(messages, params = {}) {
        const payload = {
            model: params.model || 'openai',
            messages: messages,
            max_tokens: 1000
        };

        const response = await fetch('https://text.pollinations.ai/openai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.textContent = 'AI is typing...';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function hideTypingIndicator() {
        document.querySelector('.typing-indicator')?.remove();
    }

    // ==================== EVENT LISTENERS ====================
    sendButton.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => e.key === 'Enter' && handleUserInput());
    newChatBtn.addEventListener('click', createNewConversation);
    modelSelect.addEventListener('change', () => {
        const conv = conversations.find(c => c.id === currentConversationId);
        if (conv) {
            conv.model = modelSelect.value;
            saveConversations();
        }
    });

    // Start the application
    init();
});
