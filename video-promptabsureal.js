// ===== Video Prompt Generator Functionality =====
// Model descriptions
const videoModelDescriptions = {
    'openai-large': 'GPT-4.1 Standard - Most capable version with full features',
    'openai': 'GPT-4.1 Mini - Lightweight version for faster responses',
    'mirexa': 'Mirexa AI - GPT-4.1 optimized for creative tasks',
    'openai-fast': 'GPT-4.1 Nano - Fastest response time with basic capabilities'
};

// Video type descriptions
const videoTypeDescriptions = {
    'cinematic': 'Film-like quality with dramatic lighting and composition',
    'animation': 'Animated style with creative character designs',
    'explainer': 'Clear, educational approach with visual aids',
    'vlog': 'Personal, conversational style with natural lighting',
    'commercial': 'Persuasive and attention-grabbing product showcase',
    'documentary': 'Informative and authentic storytelling'
};

// Initialize video prompt enhancement functionality
function initVideoPromptEnhancement() {
    // Set up model selector
    const modelSelect = document.getElementById('videoModelSelect');
    const modelDescription = document.getElementById('videoModelDescription');
    
    if (modelSelect && modelDescription) {
        // Set initial description
        modelDescription.textContent = videoModelDescriptions[modelSelect.value] || '';
        
        modelSelect.addEventListener('change', (e) => {
            modelDescription.textContent = videoModelDescriptions[e.target.value] || '';
        });
    }
    
    // Set up language tabs
    document.querySelectorAll('.video-language-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.video-language-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            updatePromptLanguage(this.dataset.lang);
        });
    });
    
    // Set up generate button
    const generateBtn = document.getElementById('generateVideoPromptBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateVideoPrompts);
    }
    
    // Set up clear prompt button
    const promptInput = document.getElementById('videoPrompt');
    const clearPromptBtn = document.getElementById('clearVideoPrompt');
    
    if (promptInput && clearPromptBtn) {
        promptInput.addEventListener('input', function() {
            clearPromptBtn.style.display = this.value.trim() ? 'flex' : 'none';
        });
        
        clearPromptBtn.addEventListener('click', function() {
            promptInput.value = '';
            this.style.display = 'none';
        });
    }
    
    // Open camera section by default
    const cameraSection = document.getElementById('videoCameraSection');
    const cameraBtn = document.querySelector('[onclick="toggleVideoSection(\'videoCameraSection\')"]');
    if(cameraSection && cameraBtn) {
        cameraSection.style.maxHeight = cameraSection.scrollHeight + 'px';
        cameraBtn.classList.add('collapsed');
    }
}

// Toggle video section collapse
function toggleVideoSection(sectionId) {
    const section = document.getElementById(sectionId);
    const btn = document.querySelector(`[onclick="toggleVideoSection('${sectionId}')"]`);
    
    if (!section || !btn) return;
    
    if (section.style.maxHeight && section.style.maxHeight !== '0px') {
        section.style.maxHeight = '0px';
        btn.classList.remove('collapsed');
    } else {
        section.style.maxHeight = section.scrollHeight + 'px';
        btn.classList.add('collapsed');
    }
}

// Generate video prompts
async function generateVideoPrompts() {
    const promptInput = document.getElementById('videoPrompt');
    const originalPrompt = promptInput?.value.trim();
    
    if (!originalPrompt) {
        showToast("Please enter a video concept first!");
        return;
    }

    const generateBtn = document.getElementById('generateVideoPromptBtn');
    const loadingEl = document.getElementById('videoPromptGeneratorLoading');
    const suggestionsEl = document.getElementById('videoPromptSuggestions');
    const selectedModel = document.getElementById('videoModelSelect')?.value;
    const videoType = document.getElementById('videoType')?.value;
    const videoDuration = document.getElementById('videoDuration')?.value;
    const subject = document.getElementById('videoSubject')?.value;
    const secondarySubjects = document.getElementById('videoSecondarySubjects')?.value;
    const shotTypes = Array.from(document.getElementById('videoShotTypes').selectedOptions).map(o => o.value);
    const cameraMovements = Array.from(document.getElementById('videoCameraMovements').selectedOptions).map(o => o.value);
    const cameraAngles = Array.from(document.getElementById('videoCameraAngles').selectedOptions).map(o => o.value);
    const focusTechniques = Array.from(document.getElementById('videoFocusTechniques').selectedOptions).map(o => o.value);
    const lightingStyle = document.getElementById('videoLightingStyle')?.value;
    const colorPalette = document.getElementById('videoColorPalette')?.value;
    const transitions = Array.from(document.getElementById('videoTransitions').selectedOptions).map(o => o.value);
    const voiceoverStyle = document.getElementById('videoVoiceoverStyle')?.value;
    const musicStyle = document.getElementById('videoMusicStyle')?.value;
    const dialogue = document.getElementById('videoDialogue')?.value;
    
    if (!generateBtn || !loadingEl || !suggestionsEl || !selectedModel) return;

    // Disable button and show loading
    generateBtn.disabled = true;
    loadingEl.style.display = 'block';
    suggestionsEl.innerHTML = '<div class="text-center py-4">Generating video prompts with Pollinations API...</div>';

    try {
        // Create the enhancement instruction for video prompts
        const enhancementInstruction = `
        Please generate THREE different detailed video production prompts in English and Indonesian based on these specifications:
        
        Video Type: ${videoType} (${videoTypeDescriptions[videoType]})
        Duration: ${videoDuration}
        Primary Subject: ${subject || 'Not specified'}
        Secondary Subjects: ${secondarySubjects || 'None'}
        
        Technical Specifications:
        - Shot Types: ${shotTypes.join(', ') || 'Not specified'}
        - Camera Movements: ${cameraMovements.join(', ') || 'Not specified'}
        - Camera Angles: ${cameraAngles.join(', ') || 'Not specified'}
        - Focus Techniques: ${focusTechniques.join(', ') || 'Not specified'}
        - Lighting: ${lightingStyle}
        - Color Palette: ${colorPalette || 'Not specified'}
        - Transitions: ${transitions.join(', ') || 'Not specified'}
        - Voiceover Style: ${voiceoverStyle}
        - Music Style: ${musicStyle}
        ${dialogue ? `- Sample Dialogue: ${dialogue}` : ''}
        
        For each variation (provide both English and Indonesian versions):
        1. Describe the visual sequence in detail
        2. Specify camera techniques and movements
        3. Include lighting and color directions
        4. Add audio/voiceover/music notes
        5. Keep each under 500 characters
        6. Make each variation distinctly different
        
        Original concept: "${originalPrompt}"
        
        Respond with the three enhanced prompts in this format:
        
        [ENGLISH VERSION]
        1. [Prompt 1 in English]
        2. [Prompt 2 in English]
        3. [Prompt 3 in English]
        
        [INDONESIAN VERSION]
        1. [Prompt 1 in Indonesian]
        2. [Prompt 2 in Indonesian]
        3. [Prompt 3 in Indonesian]
        `;
        
        // Call the Pollinations API with selected model
        const response = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(enhancementInstruction)}?model=${selectedModel}&safe=false`);
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const result = await response.text();
        const { englishPrompts, indonesianPrompts } = parsePromptResults(result);
        
        // Display the prompts
        showVideoPromptSuggestions(englishPrompts, indonesianPrompts);
        
    } catch (error) {
        console.error("Prompt generation error:", error);
        suggestionsEl.innerHTML = '<p class="text-center text-red-500 py-4">Failed to generate video prompts. Please try again.</p>';
        showToast("Failed to generate video prompts. Please try again.");
    } finally {
        generateBtn.disabled = false;
        loadingEl.style.display = 'none';
    }
}

// Parse the prompt results into English and Indonesian versions
function parsePromptResults(text) {
    const englishPrompts = [];
    const indonesianPrompts = [];
    let currentLanguage = null;
    
    const lines = text.split('\n');
    for (const line of lines) {
        if (line.includes('[ENGLISH VERSION]')) {
            currentLanguage = 'english';
            continue;
        }
        if (line.includes('[INDONESIAN VERSION]')) {
            currentLanguage = 'indonesian';
            continue;
        }
        
        if (currentLanguage === 'english' && (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. '))) {
            englishPrompts.push(line.substring(3).trim());
        } else if (currentLanguage === 'indonesian' && (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. '))) {
            indonesianPrompts.push(line.substring(3).trim());
        } else if (currentLanguage && line.trim().length > 0) {
            // Fallback for non-numbered lines
            if (currentLanguage === 'english' && englishPrompts.length < 3) {
                englishPrompts.push(line.trim());
            } else if (currentLanguage === 'indonesian' && indonesianPrompts.length < 3) {
                indonesianPrompts.push(line.trim());
            }
        }
    }
    
    // Ensure we have exactly 3 prompts for each language
    while (englishPrompts.length < 3) englishPrompts.push("Could not generate this English variation");
    while (indonesianPrompts.length < 3) indonesianPrompts.push("Tidak dapat menghasilkan variasi Indonesia ini");
    
    return {
        englishPrompts: englishPrompts.slice(0, 3),
        indonesianPrompts: indonesianPrompts.slice(0, 3)
    };
}

// Show video prompt suggestions
function showVideoPromptSuggestions(englishPrompts, indonesianPrompts) {
    const suggestionsEl = document.getElementById('videoPromptSuggestions');
    if (!suggestionsEl) return;
    
    suggestionsEl.innerHTML = '';
    
    if (englishPrompts.length === 0 || indonesianPrompts.length === 0) {
        suggestionsEl.innerHTML = '<p class="text-center text-gray-500 py-4">No suggestions could be generated. Please try again.</p>';
        return;
    }
    
    englishPrompts.forEach((prompt, index) => {
        const promptEl = document.createElement('div');
        promptEl.className = 'prompt-card bg-white p-4 rounded-lg shadow-md mb-4';
        promptEl.dataset.english = prompt;
        promptEl.dataset.indonesian = indonesianPrompts[index] || "Terjemahan tidak tersedia";
        promptEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <div class="font-medium text-gray-800">Video Concept ${index + 1} <span class="text-xs font-normal">(English)</span></div>
                <button class="copy-btn text-gray-500 hover:text-indigo-600" onclick="copyToClipboard(this, '${escapeHtml(prompt)}')">
                    <i class="far fa-copy"></i>
                </button>
            </div>
            <div class="prompt-content english text-gray-700">${prompt}</div>
            <div class="prompt-content indonesian hidden text-gray-700">${indonesianPrompts[index] || "Terjemahan tidak tersedia"}</div>
        `;
        
        suggestionsEl.appendChild(promptEl);
    });
}

// Update prompt language display
function updatePromptLanguage(lang) {
    document.querySelectorAll('#videoPromptSuggestions .prompt-card').forEach(card => {
        const englishContent = card.querySelector('.english');
        const indonesianContent = card.querySelector('.indonesian');
        const languageLabel = card.querySelector('.font-medium span');
        
        if (lang === 'en') {
            englishContent.classList.remove('hidden');
            indonesianContent.classList.add('hidden');
            languageLabel.textContent = '(English)';
        } else {
            englishContent.classList.add('hidden');
            indonesianContent.classList.remove('hidden');
            languageLabel.textContent = '(Indonesian)';
        }
    });
}

// Escape HTML for safe copying
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize the video prompt generator when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initVideoPromptEnhancement();
});

// Make functions available globally
window.copyToClipboard = copyToClipboard;
window.toggleVideoSection = toggleVideoSection;
window.generateVideoPrompts = generateVideoPrompts;
window.updatePromptLanguage = updatePromptLanguage;
