// Prompt Enhancement Module
document.addEventListener('DOMContentLoaded', function() {
    // Model descriptions
    const modelDescriptions = {
        'openai-large': 'GPT-4.1 Standard - Most capable version with full features',
        'openai': 'GPT-4.1 Mini - Lightweight version for faster responses',
        'mirexa': 'Mirexa AI - GPT-4.1 optimized for creative tasks',
        'openai-fast': 'GPT-4.1 Nano - Fastest response time with basic capabilities'
    };

    // Initialize prompt enhancement functionality
    function initPromptEnhancement() {
        // Set up model selector
        document.getElementById('promptModelSelect')?.addEventListener('change', (e) => {
            document.getElementById('modelDescription').textContent = modelDescriptions[e.target.value];
        });
        
        // Set up generate button
        document.getElementById('generatePromptBtn')?.addEventListener('click', generateCreativePrompts);
        
        // Set up clear prompt button
        const promptInput = document.getElementById('prompt');
        const clearPromptBtn = document.getElementById('clearPrompt');
        
        if (promptInput && clearPromptBtn) {
            promptInput.addEventListener('input', function() {
                clearPromptBtn.style.display = this.value.trim() ? 'flex' : 'none';
            });
            
            clearPromptBtn.addEventListener('click', function() {
                promptInput.value = '';
                this.style.display = 'none';
            });
        }
        
        // Load last prompt if exists
        const promptHistory = JSON.parse(localStorage.getItem('telekboyoPromptHistory')) || [];
        if (promptHistory.length > 0 && promptInput && clearPromptBtn) {
            promptInput.value = promptHistory[0].original;
            if (promptHistory[0].original.trim()) {
                clearPromptBtn.style.display = 'flex';
            }
        }
    }

    // Show toast message
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Generate creative prompts
    async function generateCreativePrompts() {
        const promptInput = document.getElementById('prompt');
        const originalPrompt = promptInput?.value.trim();
        
        if (!originalPrompt) {
            showToast("Please enter a prompt first!");
            return;
        }

        const generateBtn = document.getElementById('generatePromptBtn');
        const loadingEl = document.getElementById('promptGeneratorLoading');
        const suggestionsEl = document.getElementById('promptSuggestions');
        const selectedModel = document.getElementById('promptModelSelect')?.value;
        
        if (!generateBtn || !loadingEl || !suggestionsEl || !selectedModel) return;

        generateBtn.disabled = true;
        loadingEl.style.display = 'block';
        suggestionsEl.innerHTML = '';

        try {
            // Create the enhancement instruction for 3 variations
            const enhancementInstruction = `
            Please generate THREE different enhanced versions of this image generation prompt using GPT-4.1 capabilities. 
            Each version should be more detailed, vivid, and optimized for high-quality AI image generation.
            
            For each variation:
            1. Add specific artistic styles (e.g., "hyper-realistic", "digital painting", "cinematic")
            2. Include detailed descriptions of lighting, colors, and atmosphere
            3. Specify composition and perspective if relevant
            4. Add relevant details about textures, materials, and environment
            5. Keep each enhanced version under 300 characters
            6. Make each variation distinctly different in style or focus
            
            
            Original prompt: "${originalPrompt}"
            
            Respond with ONLY the three enhanced prompts, each on a separate line, prefixed with "1. ", "2. ", "3. ".
            No additional commentary or explanation.
            `;
            
            // Call the API with selected GPT-4.1 model
            const response = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(enhancementInstruction)}?model=${selectedModel}&safe=false`);
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const result = await response.text();
            let variations = [];
            const lines = result.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                    variations.push(line.substring(3).trim());
                } else if (variations.length < 3 && line.trim().length > 0) {
                    // Fallback in case numbering isn't perfect
                    variations.push(line.trim());
                }
            }
            
            // Ensure we have exactly 3 variations
            while (variations.length < 3) {
                variations.push("Could not generate this variation");
            }
            variations = variations.slice(0, 3);
            
            // Display the 3 variations
            showPromptSuggestions(variations);
            saveToPromptHistory(originalPrompt, variations, selectedModel);
            
        } catch (error) {
            console.error("Prompt generation error:", error);
            showToast("Failed to generate prompts. Please try again.");
        } finally {
            generateBtn.disabled = false;
            loadingEl.style.display = 'none';
        }
    }

    // Show prompt suggestions
    function showPromptSuggestions(variations) {
        const suggestionsEl = document.getElementById('promptSuggestions');
        if (!suggestionsEl) return;
        
        suggestionsEl.innerHTML = '';
        
        if (variations.length === 0) {
            suggestionsEl.innerHTML = '<p class="text-center text-gray-500 dark:text-gray-400 py-4">No suggestions could be generated. Please try again.</p>';
            return;
        }
        
        variations.forEach((variation, index) => {
            const promptEl = document.createElement('div');
            promptEl.className = 'prompt-suggestion';
            promptEl.innerHTML = `
                <div class="prompt-suggestion-title">Variation ${index + 1}</div>
                <div class="prompt-suggestion-text">${variation}</div>
            `;
            
            promptEl.addEventListener('click', () => {
                const promptInput = document.getElementById('prompt');
                const clearPromptBtn = document.getElementById('clearPrompt');
                if (promptInput && clearPromptBtn) {
                    promptInput.value = variation;
                    clearPromptBtn.style.display = 'flex';
                }
            });
            
            suggestionsEl.appendChild(promptEl);
        });
    }

    // Save to prompt history
    function saveToPromptHistory(original, variations, model) {
        let promptHistory = JSON.parse(localStorage.getItem('telekboyoPromptHistory')) || [];
        
        // Remove if already exists
        promptHistory = promptHistory.filter(item => 
            item.original !== original
        );
        
        // Add to beginning of array
        promptHistory.unshift({
            original,
            variations,
            model,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 items
        if (promptHistory.length > 10) {
            promptHistory = promptHistory.slice(0, 10);
        }
        
        // Save to localStorage
        localStorage.setItem('telekboyoPromptHistory', JSON.stringify(promptHistory));
    }

    // Initialize the prompt enhancement module
    initPromptEnhancement();
});
