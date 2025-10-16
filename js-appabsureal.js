document.addEventListener('DOMContentLoaded', async () => {
    // ======================

    // ======================
    let currentSettings = {
        watermark: true,
        cfgScale: 7,
        sampler: 'euler_a',
        format: 'png',
        model: 'flux',
        enhancer: 'none'
    };

    let generationHistory = [];
    let appStyles = [];
    let appTechniques = [];

    // ======================
    // 2. DATA LOADING FUNCTIONS
    // ======================
    async function loadStyles() {
        try {
            const response = await fetch('./assets/styles.json');
            if (!response.ok) throw new Error('Failed to load styles');
            return await response.json();
        } catch (error) {
            console.error("Error loading styles:", error);
            // Fallback minimal styles if file fails to load
            return [
                {
                    "id": "realistic",
                    "name": "Realistic",
                    "prompt": "realistic, photorealistic, 8k, ultra detailed",
                    "negative": "cartoon, anime, painting"
                },
                {
                    "id": "anime",
                    "name": "Anime",
                    "prompt": "anime style, vibrant colors, cel shading",
                    "negative": "realistic, photorealistic"
                }
            ];
        }
    }

    async function loadTechniques() {
        try {
            const response = await fetch('./assets/techniques.json');
            if (!response.ok) throw new Error('Failed to load techniques');
            return await response.json();
        } catch (error) {
            console.error("Error loading techniques:", error);
            // Fallback minimal techniques if file fails to load
            return [
                {
                    "id": "brush-strokes",
                    "name": "Brush Strokes",
                    "prompt": "visible brush strokes, textured"
                },
                {
                    "id": "low-poly",
                    "name": "Low Poly",
                    "prompt": "low poly, geometric shapes"
                }
            ];
        }
    }

    async function loadData() {
        [appStyles, appTechniques] = await Promise.all([
            loadStyles(),
            loadTechniques()
        ]);
        
        populateDropdown('styleSelect', appStyles);
        populateDropdown('techniqueSelect', appTechniques);
    }

    function populateDropdown(elementId, items) {
        const select = document.getElementById(elementId);
        select.innerHTML = '<option value="">-- Select --</option>';
        
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }

    // ======================
    // 3. PROMPT GENERATOR FUNCTIONS
    // ======================
    async function generateCreativePrompts() {
        const promptInput = document.getElementById('prompt');
        const userInput = promptInput.value.trim();
        
        if (!userInput) {
            showToast("Please enter a basic prompt first!");
            return;
        }

        const generateBtn = document.getElementById('generatePromptBtn');
        const loadingEl = document.getElementById('promptGeneratorLoading');
        const suggestionsEl = document.getElementById('promptSuggestions');
        
        generateBtn.disabled = true;
        loadingEl.style.display = 'block';
        suggestionsEl.style.display = 'none';

        try {
            const isEnglish = /^[a-zA-Z0-9\s.,!?;:'"()\-]+$/.test(userInput);
            const targetLanguage = isEnglish ? 'en' : 'id';
            
            const instruction = targetLanguage === 'en' 
                ? `Generate 3 creative and detailed image prompts in English based on: "${userInput}". Each must include: 1. Art style 2. Lighting 3. Composition. Format as numbered list.`
                : `Buat 3 prompt gambar kreatif dalam Bahasa Indonesia berdasarkan: "${userInput}". Setiap prompt harus mencakup: 1. Gaya seni 2. Pencahayaan 3. Komposisi. Format sebagai daftar bernomor.`;
            
            const response = await fetch(`https://text.pollinations.ai/prompt/${encodeURIComponent(instruction)}?model=openai&safe=false&referer=telekboyo.my.id`);
            
            if (!response.ok) throw new Error(`API Error: ${response.status}`);
            
            const result = await response.text();
            const prompts = processPromptResults(result);
            showPromptSuggestions(prompts, targetLanguage);
            
        } catch (error) {
            console.error("Prompt generation error:", error);
            showToast("Failed to generate prompts. Please try again.");
        } finally {
            generateBtn.disabled = false;
            loadingEl.style.display = 'none';
        }
    }

    function processPromptResults(text) {
        return text.split('\n')
            .filter(line => line.trim().match(/^\d+\./))
            .map(line => line.replace(/^\d+\.\s*/, '').trim())
            .slice(0, 3);
    }

    function showPromptSuggestions(prompts, language) {
        const suggestionsEl = document.getElementById('promptSuggestions');
        suggestionsEl.innerHTML = '';
        
        prompts.forEach((prompt, index) => {
            const promptEl = document.createElement('div');
            promptEl.className = 'prompt-suggestion';
            promptEl.innerHTML = `
                <div class="prompt-suggestion-title">${language === 'en' ? 'Prompt' : 'Prompt'} ${index + 1}</div>
                <div class="prompt-suggestion-text">${prompt}</div>
            `;
            
            promptEl.addEventListener('click', () => {
                document.getElementById('prompt').value = prompt;
                suggestionsEl.style.display = 'none';
            });
            
            suggestionsEl.appendChild(promptEl);
        });
        
        suggestionsEl.style.display = 'block';
    }

    // ======================
    // 4. IMAGE GENERATION
    // ======================
    async function generateImage(isVariation) {
        const prompt = document.getElementById('prompt').value.trim();
        if (!prompt) {
            showToast("Please enter a prompt first!");
            return;
        }

        const container = document.getElementById('imageContainer');
        container.innerHTML = `
            <div class="loading-animation">
                <div class="loader">
                    <div class="circle"></div>
                    <div class="circle"></div>
                    <div class="circle"></div>
                    <div class="circle"></div>
                </div>
                <p class="loading-text">Generating image...</p>
                <p class="loading-subtext">Please wait</p>
            </div>
        `;

        let seed = isVariation ? Math.floor(Math.random() * 1000000) 
               : document.getElementById('seed').value || Math.floor(Math.random() * 1000000);
        document.getElementById('seed').value = isVariation ? '' : seed;

        let fullPrompt = prompt;
        
        const styleId = document.getElementById('styleSelect').value;
        if (styleId) {
            const style = appStyles.find(s => s.id === styleId);
            if (style) {
                fullPrompt += `, ${style.prompt}`;
                if (!document.getElementById('negativePrompt').value && style.negative) {
                    document.getElementById('negativePrompt').value = style.negative;
                }
            }
        }

        const techId = document.getElementById('techniqueSelect').value;
        if (techId) {
            const tech = appTechniques.find(t => t.id === techId);
            if (tech) fullPrompt += `, ${tech.prompt}`;
        }

        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const steps = document.getElementById('steps').value;
        const negative = document.getElementById('negativePrompt').value;
        const format = document.getElementById('format').value;
        const model = document.getElementById('model').value;
        const enhancer = document.getElementById('enhancer').value;

        let apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${width}&height=${height}&steps=${steps}&seed=${seed}&model=${model}&nologo=true&safe=false&referer=telekboyo.my.id`;
        
        if (negative) apiUrl += `&negative_prompt=${encodeURIComponent(negative)}`;
        if (format !== 'png') apiUrl += `&image=${format}`;
        apiUrl += `&cfg_scale=${currentSettings.cfgScale}`;
        apiUrl += `&sampler=${currentSettings.sampler}`;
        
        if (enhancer === 'upscale') apiUrl += '&upscale=true';
        else if (enhancer === 'hq') apiUrl += '&quality=high';
        else if (enhancer === 'ultra') apiUrl += '&quality=ultra&details=high';

        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            container.innerHTML = '';
            const imgWrapper = document.createElement('div');
            imgWrapper.className = 'relative w-full h-full';
            imgWrapper.appendChild(img);
            container.appendChild(imgWrapper);
            
            if (currentSettings.watermark) {
                const wm = document.createElement('div');
                wm.className = 'watermark';
                wm.textContent = 'Tboyo';
                imgWrapper.appendChild(wm);
            }
            
            addToHistory(fullPrompt, negative, img.src, seed, model);
        };
        
        img.onerror = () => {
            container.innerHTML = '<div class="error">Failed to generate image. Please try again.</div>';
        };
        
        img.src = apiUrl;
    }

    // ======================
    // 5. HISTORY MANAGEMENT
    // ======================
    function addToHistory(prompt, negativePrompt, imageUrl, seed, model) {
        const historyItem = {
            id: Date.now(),
            prompt,
            negativePrompt,
            imageUrl,
            seed,
            model,
            timestamp: new Date().toLocaleString(),
            settings: { ...currentSettings }
        };
        
        generationHistory.unshift(historyItem);
        if (generationHistory.length > 20) generationHistory = generationHistory.slice(0, 20);
        
        localStorage.setItem('telekboyoHistory', JSON.stringify(generationHistory));
        renderHistory();
    }

    function renderHistory() {
        const container = document.getElementById('historyContainer');
        container.innerHTML = '';
        
        generationHistory.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <img src="${item.imageUrl}" class="history-thumbnail" alt="Generated image" data-id="${item.id}">
                <div class="history-prompt" title="Model: ${item.model === 'flux' ? 'Flux (High Quality)' : 'Turbo (Fast)'}\nPrompt: ${item.prompt}">
                    ${item.prompt.substring(0, 50)}${item.prompt.length > 50 ? '...' : ''}
                </div>
                <div class="history-actions">
                    <button class="history-btn tooltip copy-prompt" data-prompt="${item.prompt}" title="Copy Prompt">
                        <i class="fas fa-copy"></i>
                        <span class="tooltiptext">Copy Prompt</span>
                    </button>
                    <button class="history-btn tooltip delete-history" data-id="${item.id}" title="Delete">
                        <i class="fas fa-trash"></i>
                        <span class="tooltiptext">Delete</span>
                    </button>
                </div>
            `;
            container.appendChild(historyItem);
        });
    }

    function loadHistory() {
        const saved = localStorage.getItem('telekboyoHistory');
        if (saved) {
            try {
                generationHistory = JSON.parse(saved);
                renderHistory();
            } catch (e) {
                console.error("Error loading history:", e);
            }
        }
    }

    function clearHistory() {
        generationHistory = [];
        localStorage.removeItem('telekboyoHistory');
        renderHistory();
        showToast('History cleared');
    }

    function deleteHistoryItem(id) {
        generationHistory = generationHistory.filter(item => item.id !== id);
        localStorage.setItem('telekboyoHistory', JSON.stringify(generationHistory));
        renderHistory();
        showToast('Item deleted');
    }

    // ======================
    // 6. UTILITY FUNCTIONS
    // ======================
    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }

    function setupImageZoom() {
        const modal = document.getElementById("imageModal");
        const modalImg = document.getElementById("zoomedImage");
        const span = document.getElementsByClassName("close")[0];

        span.onclick = () => modal.style.display = "none";
        window.onclick = (event) => {
            if (event.target == modal) modal.style.display = "none";
        };

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('history-thumbnail')) {
                modal.style.display = "block";
                modalImg.src = e.target.src;
            }
        });
    }

    function setupClearPromptButton() {
        const promptInput = document.getElementById('prompt');
        const clearButton = document.getElementById('clearPrompt');

        promptInput.addEventListener('input', function() {
            clearButton.style.display = this.value ? 'block' : 'none';
        });

        clearButton.addEventListener('click', function() {
            promptInput.value = '';
            this.style.display = 'none';
            promptInput.focus();
        });
    }

    function setupCopyPrompt() {
        document.addEventListener('click', async (e) => {
            if (e.target.closest('.copy-prompt')) {
                const button = e.target.closest('.copy-prompt');
                const prompt = button.getAttribute('data-prompt');
                
                try {
                    await navigator.clipboard.writeText(prompt);
                    const icon = button.querySelector('i');
                    const originalIcon = icon.className;
                    icon.className = 'fas fa-check';
                    
                    const tooltip = button.querySelector('.tooltiptext');
                    if (tooltip) tooltip.textContent = 'Copied!';
                    
                    setTimeout(() => {
                        icon.className = originalIcon;
                        if (tooltip) tooltip.textContent = 'Copy Prompt';
                    }, 2000);
                    
                } catch (err) {
                    console.error('Failed to copy:', err);
                    showToast('Failed to copy prompt');
                }
            }
        });
    }
    
    async function saveImage() {
    const container = document.getElementById('imageContainer');
    const img = container.querySelector('img');
    if (!img) {
        showToast('No image to save!');
        return;
    }

    try {
        // Dapatkan nilai filter yang aktif
        const brightness = parseInt(document.getElementById('brightnessSlider').value);
        const contrast = parseInt(document.getElementById('contrastSlider').value);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Gambar image ke canvas
        ctx.drawImage(img, 0, 0);
        
        // Terapkan filter secara manual ke canvas
        if (brightness !== 0 || contrast !== 100) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Faktor brightness dan contrast
            const brightnessFactor = (brightness + 100) / 100;
            const contrastFactor = contrast / 100;
            
            for (let i = 0; i < data.length; i += 4) {
                // Terapkan brightness
                data[i] = data[i] * brightnessFactor;
                data[i+1] = data[i+1] * brightnessFactor;
                data[i+2] = data[i+2] * brightnessFactor;
                
                // Terapkan contrast
                data[i] = ((data[i] / 255 - 0.5) * contrastFactor + 0.5) * 255;
                data[i+1] = ((data[i+1] / 255 - 0.5) * contrastFactor + 0.5) * 255;
                data[i+2] = ((data[i+2] / 255 - 0.5) * contrastFactor + 0.5) * 255;
                
                // Pastikan nilai dalam range 0-255
                data[i] = Math.max(0, Math.min(255, data[i]));
                data[i+1] = Math.max(0, Math.min(255, data[i+1]));
                data[i+2] = Math.max(0, Math.min(255, data[i+2]));
            }
            
            ctx.putImageData(imageData, 0, 0);
        }
        
        // Tambahkan watermark jika aktif
        if (currentSettings.watermark) {
            ctx.font = '24px "Dancing Script"';
            ctx.fillStyle = 'rgba(99, 102, 241, 0.7)';
            ctx.textAlign = 'right';
            ctx.fillText('Tboyo', canvas.width - 20, canvas.height - 20);
        }
        
        // Download gambar
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `telekboyo-${Date.now()}.${currentSettings.format}`;
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }, `image/${currentSettings.format}`);
        
    } catch (error) {
        console.error("Save error:", error);
        showToast('Failed to save image');
    }
            }
    function setupResetButton() {
        const btn = document.getElementById('resetBtn');
        
        btn.addEventListener('click', function() {
            if (!btn.classList.contains('confirm-mode')) {
                btn.innerHTML = '<i class="fas fa-check"></i> Confirm?';
                btn.classList.add('confirm-mode');
                
                setTimeout(() => {
                    if (btn.classList.contains('confirm-mode')) {
                        btn.innerHTML = '<i class="fas fa-undo"></i> Reset';
                        btn.classList.remove('confirm-mode');
                    }
                }, 2000);
            } else {
                const container = document.getElementById('imageContainer');
                container.style.transition = 'opacity 0.3s ease';
                container.style.opacity = '0';
                
                setTimeout(() => {
                    container.innerHTML = `
                        <div class="placeholder">
                            <svg viewBox="0 0 24 24" width="64" height="64" class="placeholder-icon">
                                <path fill="currentColor" d="M19,3H5C3.89,3 3,3.89 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5C21,3.89 20.1,3 19,3M19,19H5V5H19V19M13.96,12.29L11.21,15.83L9.25,13.47L6.5,17H17.5L13.96,12.29Z" />
                            </svg>
                            <p>Ready for new creation!</p>
                        </div>
                    `;
                    container.style.opacity = '1';
                    
                    document.getElementById('prompt').value = '';
                    document.getElementById('negativePrompt').value = '';
                    document.getElementById('seed').value = '';
                    document.getElementById('styleSelect').value = '';
                    document.getElementById('techniqueSelect').value = '';
                    document.getElementById('width').value = 512;
                    document.getElementById('height').value = 512;
                    document.getElementById('steps').value = 50;
                    
                    btn.innerHTML = '<i class="fas fa-undo"></i> Reset';
                    btn.classList.remove('confirm-mode');
                    
                    document.getElementById('prompt').focus();
                }, 300);
            }
        });
    }

    function loadSettings() {
        const saved = localStorage.getItem('telekboyoSettings');
        if (saved) {
            try {
                currentSettings = { ...currentSettings, ...JSON.parse(saved) };
                document.getElementById('watermarkToggle').checked = currentSettings.watermark;
                document.getElementById('cfgScale').value = currentSettings.cfgScale;
                document.getElementById('cfgScaleValue').textContent = currentSettings.cfgScale;
                document.getElementById('sampler').value = currentSettings.sampler;
                document.getElementById('format').value = currentSettings.format;
                document.getElementById('model').value = currentSettings.model;
                document.getElementById('enhancer').value = currentSettings.enhancer;
            } catch (e) {
                console.error("Error loading settings:", e);
            }
        }
    }

    // ======================
    // 7. EVENT LISTENERS
    // ======================
    function setupEventListeners() {
        document.getElementById('themeToggle').addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('darkMode', document.documentElement.classList.contains('dark'));
        });

        if (localStorage.getItem('darkMode') === 'true') {
            document.documentElement.classList.add('dark');
        }

        document.getElementById('settingsToggle').addEventListener('click', () => {
            const panel = document.getElementById('settingsPanel');
            const icon = document.getElementById('settingsIcon');
            
            panel.classList.toggle('open');
            icon.classList.toggle('rotate-180');
        });

        document.getElementById('generateBtn').addEventListener('click', () => generateImage(false));
        document.getElementById('variationBtn').addEventListener('click', () => generateImage(true));
        
        document.getElementById('saveBtn').addEventListener('click', saveImage);
        
        document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

        document.getElementById('generatePromptBtn').addEventListener('click', generateCreativePrompts);

        document.getElementById('watermarkToggle').addEventListener('change', (e) => {
            currentSettings.watermark = e.target.checked;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.getElementById('cfgScale').addEventListener('input', (e) => {
            currentSettings.cfgScale = e.target.value;
            document.getElementById('cfgScaleValue').textContent = e.target.value;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.getElementById('sampler').addEventListener('change', (e) => {
            currentSettings.sampler = e.target.value;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.getElementById('format').addEventListener('change', (e) => {
            currentSettings.format = e.target.value;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.getElementById('model').addEventListener('change', (e) => {
            currentSettings.model = e.target.value;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.getElementById('enhancer').addEventListener('change', (e) => {
            currentSettings.enhancer = e.target.value;
            localStorage.setItem('telekboyoSettings', JSON.stringify(currentSettings));
        });

        document.addEventListener('click', (e) => {
            if (e.target.closest('.delete-history')) {
                const id = parseInt(e.target.closest('.delete-history').getAttribute('data-id'));
                deleteHistoryItem(id);
            }
        });
    }

    // ======================
    // 8. INITIALIZATION
    // ======================
    async function init() {
        loadSettings();
        await loadData();
        loadHistory();
        setupClearPromptButton();
        setupImageZoom();
        setupCopyPrompt();
        setupResetButton();
        setupEventListeners();
    }

    init();
});
