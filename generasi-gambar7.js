// ===== Image Generator Module =====
const ImageGenerator = (function() {
    // DOM Elements
    const promptInput = document.getElementById('prompt');
    const negativePromptInput = document.getElementById('negativePrompt');
    const widthSelect = document.getElementById('width');
    const heightSelect = document.getElementById('height');
    const styleSelect = document.getElementById('style');
    const techniqueSelect = document.getElementById('technique');
    const stepsInput = document.getElementById('steps');
    const stepsValue = document.getElementById('stepsValue');
    const samplerSelect = document.getElementById('sampler');
    const imageFormatSelect = document.getElementById('imageFormat');
    const qualityEnhanceSelect = document.getElementById('qualityEnhance');
    const seedInput = document.getElementById('seed');
    const modelSelect = document.getElementById('model');
    const safeModeCheckbox = document.getElementById('safeMode');
    const generateBtn = document.getElementById('generateBtn');
    const generateBtnText = document.getElementById('generateBtnText');
    const generateSpinner = document.getElementById('generateSpinner');
    const downloadBtn = document.getElementById('downloadBtn');
    const randomizeBtn = document.getElementById('randomizeBtn');
    const generatedImage = document.getElementById('generatedImage');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const placeholder = document.getElementById('placeholder');
    const historyList = document.getElementById('historyList');
    const previewContainer = document.getElementById('previewContainer');
    const clearPromptBtn = document.getElementById('clearPrompt');
    const notification = document.getElementById('notification');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    const fullscreenOverlay = document.getElementById('fullscreenOverlay');
    const fullscreenTextarea = document.getElementById('fullscreenTextarea');
    const closeFullscreen = document.getElementById('closeFullscreen');
    const dallePresetBtn = document.getElementById('dallePresetBtn');

    // Data
    let techniquesData = [];
    let stylesData = [];
    let translationEngineLoaded = false;

    // State
    let generationHistory = JSON.parse(localStorage.getItem('generationHistory')) || [];
    let currentImageUrl = '';
    let currentGenerationParams = {};
    
    // Zoom State
    let currentZoomLevel = 1;
    const ZOOM_INCREMENT = 0.2;
    const MAX_ZOOM = 3;
    const MIN_ZOOM = 0.5;
    let zoomControlsContainer;
    let isDragging = false;
    let startX, startY, scrollLeft, scrollTop;

    // Preset DALL-E khusus untuk model konteks
    const DALLE_PRESET = {
        prompt: "highly detailed, vibrant colors, surreal composition, 4k resolution, cinematic lighting, ultra-realistic, professional photography",
        negativePrompt: "blurry, low quality, distorted, extra limbs, text, watermark, cartoon, deformed",
        steps: 70,
        sampler: "DPM++ 2M Karras",
        width: 1024,
        height: 1024,
        qualityEnhance: "2",
        cfgScale: 8
    };

    // Initialize
    async function init() {
        await loadExternalData();
        populateDropdowns();
        setupEventListeners();
        updateHistoryDisplay();
        await loadTranslationEngine();
        setupDallePresetButton();
        createZoomControls();
        setupImageDrag();
    }

    // Create zoom controls dynamically
    function createZoomControls() {
        if (!previewContainer) return;

        // Create container for zoom controls
        zoomControlsContainer = document.createElement('div');
        zoomControlsContainer.className = 'zoom-controls-container';
        Object.assign(zoomControlsContainer.style, {
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            display: 'flex',
            gap: '5px',
            zIndex: '10',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: '4px',
            padding: '4px'
        });

        // Create zoom in button
        const zoomInBtn = createZoomButton('+', 'Zoom In', zoomIn);
        
        // Create zoom out button
        const zoomOutBtn = createZoomButton('-', 'Zoom Out', zoomOut);
        
        // Create reset zoom button
        const resetZoomBtn = createZoomButton('↻', 'Reset Zoom', resetZoom);
        resetZoomBtn.disabled = true;

        // Append buttons to container
        zoomControlsContainer.appendChild(zoomInBtn);
        zoomControlsContainer.appendChild(zoomOutBtn);
        zoomControlsContainer.appendChild(resetZoomBtn);

        // Style preview container
        Object.assign(previewContainer.style, {
            position: 'relative',
            overflow: 'auto',
            cursor: 'grab'
        });

        // Style generated image
        if (generatedImage) {
            Object.assign(generatedImage.style, {
                transformOrigin: '0 0',
                transition: 'transform 0.1s ease-out',
                display: 'block',
                maxWidth: 'none'
            });
        }

        // Add to DOM
        previewContainer.appendChild(zoomControlsContainer);
    }

    function createZoomButton(text, title, clickHandler) {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.title = title;
        Object.assign(btn.style, {
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            width: '24px',
            height: '24px',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });
        btn.addEventListener('click', clickHandler);
        return btn;
    }

    function setupImageDrag() {
        if (!previewContainer) return;

        previewContainer.addEventListener('mousedown', (e) => {
            if (currentZoomLevel <= 1) return;
            
            isDragging = true;
            startX = e.pageX - previewContainer.offsetLeft;
            startY = e.pageY - previewContainer.offsetTop;
            scrollLeft = previewContainer.scrollLeft;
            scrollTop = previewContainer.scrollTop;
            previewContainer.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            const x = e.pageX - previewContainer.offsetLeft;
            const y = e.pageY - previewContainer.offsetTop;
            const walkX = (x - startX) * 2;
            const walkY = (y - startY) * 2;
            previewContainer.scrollLeft = scrollLeft - walkX;
            previewContainer.scrollTop = scrollTop - walkY;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            previewContainer.style.cursor = 'grab';
        });
    }

    function zoomIn() {
        if (currentZoomLevel >= MAX_ZOOM) return;
        currentZoomLevel = Math.min(currentZoomLevel + ZOOM_INCREMENT, MAX_ZOOM);
        applyZoom();
    }

    function zoomOut() {
        if (currentZoomLevel <= MIN_ZOOM) return;
        currentZoomLevel = Math.max(currentZoomLevel - ZOOM_INCREMENT, MIN_ZOOM);
        applyZoom();
    }

    function resetZoom() {
        currentZoomLevel = 1;
        applyZoom();
        if (previewContainer) {
            previewContainer.scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            });
        }
    }

    function applyZoom() {
        if (!generatedImage || !generatedImage.src) return;
        
        generatedImage.style.transform = `scale(${currentZoomLevel})`;
        updateZoomButtons();
        showNotification(`Zoom: ${Math.round(currentZoomLevel * 100)}%`);
    }

    function updateZoomButtons() {
        if (!zoomControlsContainer) return;
        
        const buttons = zoomControlsContainer.querySelectorAll('button');
        if (buttons.length >= 3) {
            buttons[0].disabled = currentZoomLevel >= MAX_ZOOM;
            buttons[1].disabled = currentZoomLevel <= MIN_ZOOM;
            buttons[2].disabled = currentZoomLevel === 1;
        }
    }

    // Load translation engine
    async function loadTranslationEngine() {
        if (window.Translate && window.Translate.Translate) {
            translationEngineLoaded = true;
            return;
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@translate-tools/core/dist/translate.min.js';
            script.onload = () => {
                translationEngineLoaded = true;
                resolve();
            };
            script.onerror = reject;
            document.head.appendChild(script);
        }).catch(error => {
            console.error('Failed to load translation engine:', error);
            translationEngineLoaded = false;
        });
    }

    async function loadExternalData() {
        try {
            // Load techniques data
            const techResponse = await fetch('techniques.json');
            if (techResponse.ok) {
                techniquesData = await techResponse.json();
            } else {
                console.error('Failed to load techniques.json, using fallback data');
                techniquesData = getDefaultTechniques();
            }

            // Load styles data
            const stylesResponse = await fetch('styles.json');
            if (stylesResponse.ok) {
                stylesData = await stylesResponse.json();
            } else {
                console.error('Failed to load styles.json, using fallback data');
                stylesData = getDefaultStyles();
            }
        } catch (error) {
            console.error('Error loading external data:', error);
            techniquesData = getDefaultTechniques();
            stylesData = getDefaultStyles();
        }
    }

    function getDefaultTechniques() {
        return [
            {
                "id": "hyper-detailed",
                "name": "Hyper Detailed",
                "prompt": "hyperdetailed, intricate details, sharp focus, 8k resolution, photorealistic, professional photography",
                "negativePrompt": "blurry, low quality, low resolution, simple, plain"
            },
            {
                "id": "cinematic",
                "name": "Cinematic",
                "prompt": "cinematic still, dramatic lighting, film grain, shallow depth of field, 35mm film",
                "negativePrompt": "flat lighting, video game, CGI render, digital art"
            },
            {
                "id": "minimalist",
                "name": "Minimalist",
                "prompt": "minimalist, simple composition, clean lines, negative space, monochromatic",
                "negativePrompt": "cluttered, busy, detailed, complex, colorful"
            }
        ];
    }

    function getDefaultStyles() {
        return [
            {
                "id": "photographic",
                "name": "Photographic",
                "prompt": "photorealistic, 35mm film, bokeh, natural lighting, professional photography",
                "negativePrompt": "illustration, drawing, painting, cartoon, CGI"
            },
            {
                "id": "anime",
                "name": "Anime",
                "prompt": "anime style, vibrant colors, expressive eyes, detailed background, studio ghibli",
                "negativePrompt": "realistic, photorealistic, western animation, 3D render"
            },
            {
                "id": "oil-painting",
                "name": "Oil Painting",
                "prompt": "oil painting, brush strokes, textured canvas, impasto technique, old master style",
                "negativePrompt": "digital art, smooth, photorealistic, vector art"
            }
        ];
    }

    function populateDropdowns() {
        // Populate technique dropdown
        techniqueSelect.innerHTML = '';
        const defaultTechOption = document.createElement('option');
        defaultTechOption.value = '';
        defaultTechOption.textContent = 'None';
        techniqueSelect.appendChild(defaultTechOption);
        
        techniquesData.forEach(tech => {
            const option = document.createElement('option');
            option.value = tech.id;
            option.textContent = tech.name;
            techniqueSelect.appendChild(option);
        });
        
        // Populate style dropdown
        styleSelect.innerHTML = '';
        const defaultStyleOption = document.createElement('option');
        defaultStyleOption.value = '';
        defaultStyleOption.textContent = 'None';
        styleSelect.appendChild(defaultStyleOption);
        
        stylesData.forEach(style => {
            const option = document.createElement('option');
            option.value = style.id;
            option.textContent = style.name;
            styleSelect.appendChild(option);
        });

        // Populate model dropdown
        modelSelect.innerHTML = '';
        const models = [
            { value: 'stable-diffusion-xl', name: 'SDXL' },
            { value: 'flux', name: 'Flux' },
            { value: 'turbo', name: 'Turbo' },
            { value: 'gptimage', name: 'GPTImage' }
        ];
        
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.value;
            option.textContent = model.name;
            modelSelect.appendChild(option);
        });
    }

    function setupEventListeners() {
        stepsInput.addEventListener('input', function() {
            stepsValue.textContent = this.value;
        });

        clearPromptBtn.addEventListener('click', function() {
            promptInput.value = '';
            promptInput.focus();
        });

        document.getElementById('clearNegativePrompt').addEventListener('click', function() {
            negativePromptInput.value = '';
            negativePromptInput.focus();
        });

        randomizeBtn.addEventListener('click', generateVariation);
        generateBtn.addEventListener('click', generateImage);
        downloadBtn.addEventListener('click', downloadImage);
        fullscreenBtn.addEventListener('click', openFullscreenEditor);
        closeFullscreen.addEventListener('click', closeFullscreenEditor);
    }

    function setupDallePresetButton() {
        if (!dallePresetBtn) return;
        
        dallePresetBtn.addEventListener('click', function() {
            if (modelSelect.value === 'stable-diffusion-xl') {
                promptInput.value = DALLE_PRESET.prompt;
                negativePromptInput.value = DALLE_PRESET.negativePrompt;
                stepsInput.value = DALLE_PRESET.steps;
                stepsValue.textContent = DALLE_PRESET.steps;
                samplerSelect.value = DALLE_PRESET.sampler;
                widthSelect.value = DALLE_PRESET.width;
                heightSelect.value = DALLE_PRESET.height;
                qualityEnhanceSelect.value = DALLE_PRESET.qualityEnhance;
                
                showNotification('DALL-E preset applied!');
            } else {
                showNotification('DALL-E preset only works with SDXL model');
            }
        });
    }

    async function translateToEnglish(text) {
        if (!text || !text.trim()) return text;
        
        const englishRegex = /[a-zA-Z]/;
        const nonEnglishRegex = /[\u0400-\u04FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/;
        
        if (englishRegex.test(text) && !nonEnglishRegex.test(text)) {
            return text;
        }
        
        if (!translationEngineLoaded) {
            console.warn('Translation engine not loaded, using original text');
            return text;
        }
        
        try {
            const translator = new TranslateTools.Translate();
            const result = await translator.translate(text, 'en');
            return result || text;
        } catch (error) {
            console.error('Translation error:', error);
            return text;
        }
    }

    async function generateImage() {
        let prompt = promptInput.value.trim();
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }
        
        generateBtn.disabled = true;
        generateBtnText.textContent = 'Translating...';
        generateSpinner.classList.remove('hidden');
        
        try {
            const translatedPrompt = await translateToEnglish(prompt);
            if (translatedPrompt && translatedPrompt !== prompt) {
                promptInput.value = translatedPrompt;
                prompt = translatedPrompt;
            }
        } catch (error) {
            console.error('Translation failed:', error);
        } finally {
            generateBtnText.textContent = 'Generate Image';
            generateSpinner.classList.add('hidden');
        }
        
        const selectedTechnique = techniquesData.find(t => t.id === techniqueSelect.value);
        const selectedStyle = stylesData.find(s => s.id === styleSelect.value);
        
        let fullPrompt = prompt;
        let fullNegativePrompt = negativePromptInput.value.trim() || "";
        
        if (selectedTechnique) {
            fullPrompt += `, ${selectedTechnique.prompt}`;
            if (selectedTechnique.negativePrompt) {
                fullNegativePrompt += fullNegativePrompt ? `, ${selectedTechnique.negativePrompt}` : selectedTechnique.negativePrompt;
            }
        }
        
        if (selectedStyle) {
            fullPrompt += `, ${selectedStyle.prompt}`;
            if (selectedStyle.negativePrompt) {
                fullNegativePrompt += fullNegativePrompt ? `, ${selectedStyle.negativePrompt}` : selectedStyle.negativePrompt;
            }
        }
        
        currentGenerationParams = {
            prompt,
            negativePrompt: negativePromptInput.value.trim(),
            fullPrompt,
            fullNegativePrompt,
            width: widthSelect.value,
            height: heightSelect.value,
            style: styleSelect.value,
            technique: techniqueSelect.value,
            steps: stepsInput.value,
            sampler: samplerSelect.value,
            imageFormat: imageFormatSelect.value,
            qualityEnhance: qualityEnhanceSelect.value,
            seed: seedInput.value || Math.floor(Math.random() * 1000000),
            model: modelSelect.value,
            safe: !safeModeCheckbox.checked
        };
        
        showLoadingState();
        
        let apiUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=${currentGenerationParams.width}&height=${currentGenerationParams.height}&steps=${currentGenerationParams.steps}&seed=${currentGenerationParams.seed}&model=${currentGenerationParams.model}&sampler=${currentGenerationParams.sampler}`;
        
        if (fullNegativePrompt) apiUrl += `&negative=${encodeURIComponent(fullNegativePrompt)}`;
        apiUrl += '&nologo=true';
        if (currentGenerationParams.safe) apiUrl += '&safe=false';
        if (currentGenerationParams.qualityEnhance !== '0') apiUrl += `&quality=${currentGenerationParams.qualityEnhance}`;
        if (currentGenerationParams.imageFormat !== 'jpg') apiUrl += `&imageFormat=${currentGenerationParams.imageFormat}`;
        apiUrl += `&t=${new Date().getTime()}`;
        
        currentImageUrl = apiUrl;
        generatedImage.onload = onImageGenerated;
        generatedImage.onerror = onImageError;
        generatedImage.src = apiUrl;
    }

    function showLoadingState() {
        generatedImage.style.display = 'none';
        placeholder.classList.add('hidden');
        loadingSpinner.classList.remove('hidden');
        generateBtn.disabled = true;
        randomizeBtn.disabled = true;
        downloadBtn.disabled = true;
        generateBtnText.textContent = 'Generating...';
        generateSpinner.classList.remove('hidden');
        resetZoom();
    }

    function onImageGenerated() {
        loadingSpinner.classList.add('hidden');
        generatedImage.style.display = 'block';
        generateBtn.disabled = false;
        randomizeBtn.disabled = false;
        downloadBtn.disabled = false;
        generateBtnText.textContent = 'Generate Image';
        generateSpinner.classList.add('hidden');
        
        addToHistory(
            currentGenerationParams.prompt, 
            currentGenerationParams.fullPrompt, 
            currentImageUrl
        );
        
        showNotification('Image generated successfully!');
    }

    function onImageError() {
        loadingSpinner.classList.add('hidden');
        placeholder.classList.remove('hidden');
        generateBtn.disabled = false;
        randomizeBtn.disabled = false;
        generateBtnText.textContent = 'Generate Image';
        generateSpinner.classList.add('hidden');
        alert('Error generating image. Please try again.');
    }

    function generateVariation() {
        if (Object.keys(currentGenerationParams).length === 0) {
            alert('Generate an image first before creating variations');
            return;
        }
        
        seedInput.value = Math.floor(Math.random() * 1000000);
        generateImage();
    }

    function downloadImage() {
        if (!currentImageUrl) return;
        
        const prompt = promptInput.value.trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
        const model = modelSelect.value;
        const seed = seedInput.value || 'random';
        const format = imageFormatSelect.value;
        
        const filename = `telekboyo-${model}-${prompt}-${seed}.${format}`;
        
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = currentImageUrl;
        
        showDownloadLoading();
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            const link = document.createElement('a');
            link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : format}`);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            resetDownloadButton();
        };
        
        img.onerror = function() {
            alert('Failed to load image for download');
            resetDownloadButton();
        };
    }

    function addToHistory(originalPrompt, fullPrompt, url) {
        if (generationHistory.length >= 20) {
            generationHistory.pop();
        }
        
        const historyItem = {
            id: Date.now(),
            originalPrompt,
            fullPrompt,
            url,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };
        
        generationHistory.unshift(historyItem);
        localStorage.setItem('generationHistory', JSON.stringify(generationHistory));
        updateHistoryDisplay();
    }

    function updateHistoryDisplay() {
        if (generationHistory.length === 0) {
            historyList.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">Your generation history will appear here</p>';
            return;
        }
        
        historyList.innerHTML = '';
        generationHistory.forEach((item) => {
            const originalPrompt = item.originalPrompt || item.prompt;
            const truncatedPrompt = originalPrompt.length > 50 
                ? originalPrompt.substring(0, 50) + '...' 
                : originalPrompt;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item neumorphic p-3 rounded-lg mb-2';
            historyItem.innerHTML = `
                <div class="history-item-content">
                    <img src="${item.url}" class="history-thumb" alt="History thumbnail">
                    <div class="history-text">
                        <div class="history-prompt">${truncatedPrompt}</div>
                        <div class="history-time">${item.timestamp} - ${item.date}</div>
                    </div>
                    <button class="neumorphic-btn p-2 rounded" data-id="${item.id}" title="Load Image">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                        </svg>
                    </button>
                </div>
            `;
            
            historyItem.querySelector('button').addEventListener('click', (e) => {
                e.stopPropagation();
                loadHistoryImage(item.url);
            });
            
            historyItem.addEventListener('click', function(e) {
                if (e.target.closest('button')) return;
                loadHistoryPrompt(item.originalPrompt, item.url);
            });
            
            historyList.appendChild(historyItem);
        });
    }

    function loadHistoryImage(url) {
        generatedImage.src = url;
        currentImageUrl = url;
        generatedImage.style.display = 'block';
        placeholder.classList.add('hidden');
        downloadBtn.disabled = false;
        resetZoom();
    }

    function loadHistoryPrompt(prompt, url) {
        promptInput.value = prompt;
        promptInput.focus();
        loadHistoryImage(url);
    }

    function openFullscreenEditor() {
        fullscreenTextarea.value = promptInput.value;
        fullscreenOverlay.classList.remove('hidden');
        fullscreenTextarea.focus();
    }

    function closeFullscreenEditor() {
        promptInput.value = fullscreenTextarea.value;
        fullscreenOverlay.classList.add('hidden');
    }

    function showNotification(message) {
        notification.textContent = message;
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }

    function showDownloadLoading() {
        const originalHtml = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `
            <span class="loading-text">
                <span class="loading-spinner"></span>
                Processing...
            </span>
        `;
        downloadBtn.disabled = true;
    }

    function resetDownloadButton() {
        downloadBtn.innerHTML = `
            <i class="fas fa-download"></i>
            <span class="hidden md:inline">Download</span>
        `;
        downloadBtn.disabled = false;
    }

    // Public API
    return {
        init
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ImageGenerator.init();
});