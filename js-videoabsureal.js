// video.js - Complete Video Prompt Generator with Character Support, Voice and Dialogue

document.addEventListener('DOMContentLoaded', function() {
    initVideoPromptGenerator();
    populateVideoDropdowns();
    initVoiceOptions();
});

function initVideoPromptGenerator() {
    const modelDescriptions = {
        'openai-large': 'GPT-4.1 Video Pro - Optimal untuk prompt video kompleks',
        'openai': 'GPT-4.1 Standard - Versi seimbang untuk kebanyakan kebutuhan',
        'mirexa': 'Mirexa Video AI - Khusus tugas kreatif generasi video',
        'openai-fast': 'GPT-4.1 Express - Generasi cepat untuk iterasi cepat'
    };

    const videoStyles = {
        'none': 'Tidak ada gaya spesifik - gunakan pengaturan default',
        'cinematic': 'Gaya film Hollywood dengan lighting dramatis dan komposisi epik',
        'noir': 'Film noir klasik dengan high contrast dan bayangan tajam',
        'neo-noir': 'Versi modern film noir dengan elemen cyberpunk',
        'blockbuster': 'Produksi megah ala film studio besar',
        'indie-film': 'Estetika raw dan natural ala film independen',
        'anime': 'Animasi Jepang dengan warna vibrant dan ekspresi berlebihan',
        'disney': 'Gaya animasi klasik Disney dengan karakter ekspresif',
        'pixar': 'Animasi 3D berkualitas tinggi ala Pixar',
        'stop-motion': 'Estetika animasi stop-motion dengan tekstur tangible',
        'claymation': 'Animasi clay stop-motion dengan kesan handmade',
        'cyberpunk': 'Futuristik neon dengan atmosfer gelap dan teknologi tinggi',
        'steampunk': 'Teknologi Victorian dengan mesin uap dan gears',
        'fantasy': 'Dunia magis dengan efek sihir dan makhluk legenda',
        'sci-fi': 'Fiksi ilmiah dengan teknologi futuristik',
        'horror': 'Suasana mencekam dengan lighting gelap dan sudut kamera aneh',
        'documentary': 'Gaya dokumenter realistis dengan cinematography natural',
        'nature-doc': 'Dokumenter alam dengan slow motion dan macro shots',
        'travel-vlog': 'Gaya vlog perjalanan dengan stabilisasi smooth',
        'interview': 'Setting interview profesional dengan lighting tiga titik',
        'retro': 'Estetika vintage tahun 80/90an dengan grain film',
        'vintage': 'Tampilan klasik ala film tahun 50-60an',
        'silent-movie': 'Gaya film bisu era 1920an dengan speed adjusted',
        'old-tv': 'Efek televisi analog tahun 1970an dengan scan lines',
        'drone-footage': 'Rekaman udara stabil dengan gerakan halus',
        'first-person': 'Perspektif orang pertama (FPV)',
        'time-lapse': 'Percepatan waktu dengan perubahan visual dramatis',
        'hyperlapse': 'Time-lapse dengan gerakan kamera',
        'slow-motion': 'Gerakan ultra lambat dengan detail tinggi',
        'bullet-time': 'Efek matrix dengan kamera 360°',
        'music-video': 'Visual kreatif ala video musik',
        'lyric-video': 'Teks animasi dengan elemen grafis',
        'concert': 'Pencahayaan stage dramatis dengan multi-angle',
        'product-showcase': 'Presentasi produk dengan lighting studio',
        'fashion': 'Estetika video fashion dengan slow motion',
        'corporate': 'Video perusahaan profesional dengan grafis clean',
        'glitch': 'Efek digital corrupt dan artefak visual',
        'holographic': 'Tampilan hologram futuristik',
        'datamosh': 'Teknik kompresi video yang sengaja di-corrupt',
        'vaporwave': 'Estetika retro-futuristik dengan warna pastel'
    }; 

    // Initialize model selection
    const modelSelect = document.getElementById('videoModelSelect');
    if (modelSelect) {
        modelSelect.addEventListener('change', function(e) {
            document.getElementById('videoModelDescription').textContent = 
                modelDescriptions[e.target.value] || 'Pilih model untuk deskripsi';
        });
        document.getElementById('videoModelDescription').textContent = 
            modelDescriptions[modelSelect.value] || 'Pilih model untuk deskripsi';
    }
    
    // Initialize style selection
    const styleSelect = document.getElementById('videoStyleSelect');
    if (styleSelect) {
        styleSelect.innerHTML = Object.entries(videoStyles)
            .map(([value, desc]) => `<option value="${value}">${value} (${desc})</option>`)
            .join('');
        
        styleSelect.addEventListener('change', function(e) {
            document.getElementById('styleDescription').textContent = 
                videoStyles[e.target.value] || '';
        });
        document.getElementById('styleDescription').textContent = 
            videoStyles[styleSelect.value] || '';
    }
    
    // Initialize duration slider
    const durationSlider = document.getElementById('videoDuration');
    if (durationSlider) {
        durationSlider.addEventListener('input', function(e) {
            document.getElementById('durationValue').textContent = e.target.value;
        });
        document.getElementById('durationValue').textContent = durationSlider.value;
    }
    
    // Initialize camera technique tooltips
    document.querySelectorAll('.camera-technique').forEach(el => {
        el.addEventListener('mouseenter', function() {
            const technique = this.value;
            const tips = {
                'dolly': 'Gerakan kamera maju/mundur untuk efek dramatis',
                'pan': 'Putaran kamera horizontal',
                'tilt': 'Kemiringan kamera vertikal',
                'steadycam': 'Gerakan halus seperti mengambang',
                'handheld': 'Efek goyang alami',
                'drone': 'Pandangan udara yang luas'
            };
            document.getElementById('cameraTip').textContent = tips[technique] || '';
        });
    });
    
    // Initialize buttons
    document.getElementById('generateVideoPromptBtn')?.addEventListener('click', generateVideoPrompt);
    document.getElementById('regenerateVideoPromptBtn')?.addEventListener('click', generateVideoPrompt);
    document.getElementById('copyVideoPromptBtn')?.addEventListener('click', copyActivePrompt);
    document.getElementById('clearVideoHistoryBtn')?.addEventListener('click', clearVideoPromptHistory);
    
    // Load history and initialize tab
    loadVideoPromptHistory();
    document.getElementById('videoTab')?.addEventListener('click', loadVideoPromptHistory);
}

function initVoiceOptions() {
    // Add voice options to the UI
    const voiceOptions = {
        'none': 'No voice',
        'male-deep': 'Male (Deep)',
        'male-neutral': 'Male (Neutral)',
        'female-warm': 'Female (Warm)',
        'female-energetic': 'Female (Energetic)',
        'child': 'Child',
        'elderly': 'Elderly',
        'robot': 'Robot',
        'narrator': 'Narrator',
        'cartoon': 'Cartoon',
        'whisper': 'Whisper',
        'shout': 'Shout'
    };

    const voiceSelect = document.getElementById('videoVoiceSelect');
    if (voiceSelect) {
        voiceSelect.innerHTML = Object.entries(voiceOptions)
            .map(([value, text]) => `<option value="${value}">${text}</option>`)
            .join('');
    }

    // Add dialogue type options
    const dialogueOptions = {
        'none': 'No dialogue',
        'conversation': 'Conversation',
        'monologue': 'Monologue',
        'narration': 'Narration',
        'interview': 'Interview',
        'debate': 'Debate',
        'song': 'Song',
        'poem': 'Poem',
        'storytelling': 'Storytelling',
        'instruction': 'Instruction',
        'announcement': 'Announcement'
    };

    const dialogueSelect = document.getElementById('videoDialogueType');
    if (dialogueSelect) {
        dialogueSelect.innerHTML = Object.entries(dialogueOptions)
            .map(([value, text]) => `<option value="${value}">${text}</option>`)
            .join('');
    }
}

function populateVideoDropdowns() {
    const dropdownOptions = {
        'videoShotType': ['none','Close-up', 'Medium shot', 'Long shot', 'Extreme long shot', 'Over-the-shoulder', 'Point-of-view', 'Aerial shot', 'Dutch angle'],
        'videoSubjectType': ['none','Human', 'Animal', 'Vehicle', 'Building', 'Nature', 'Abstract', 'Machine', 'Fantasy creature'],
        'videoActionIntensity': ['none','Low (Subtle movements)', 'Medium (Normal activity)', 'High (Energetic actions)', 'Extreme (Intense motion)'],
        'videoLighting': ['none','Natural light', 'Studio lighting', 'Low-key', 'High-key', 'Rembrandt', 'Backlight', 'Silhouette', 'Neon lighting'],
        'videoMood': ['none','Happy', 'Sad', 'Mysterious', 'Epic', 'Romantic', 'Horror', 'Nostalgic', 'Futuristic'],
        'videoColorPalette': ['none','Warm tones', 'Cool tones', 'Monochromatic', 'Complementary', 'Analogous', 'Triadic', 'Pastel', 'Vibrant'],
        'videoSpecialEffects': ['None', 'Slow motion', 'Time-lapse', 'Particle effects', 'Light streaks', 'Lens flares', 'Chromatic aberration', 'Glitch effects'],
        'videoTransitions': ['none','Cut', 'Fade', 'Dissolve', 'Wipe', 'Split', 'Montage', 'Slide', 'Zoom', 'Morph', '3D rotation'],
        'videoSoundDesign': ['none','Natural sounds', 'Orchestral', 'Electronic', 'Ambient', 'No sound', 'Foley effects', 'Cinematic score', 'Custom mix'],
        'videoVoiceSelect': ['none','Male (Deep)', 'Male (Neutral)', 'Female (Warm)', 'Female (Energetic)', 'Child', 'Elderly', 'Robot', 'Narrator', 'Cartoon', 'Whisper', 'Shout'],
        'videoDialogueType': ['none','Conversation', 'Monologue', 'Narration', 'Interview', 'Debate', 'Song', 'Poem', 'Storytelling', 'Instruction', 'Announcement']
    };

    for (const [id, options] of Object.entries(dropdownOptions)) {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = options.map(opt => 
                `<option value="${opt.toLowerCase().replace(/[()]/g, '').split(' ')[0]}">${opt}</option>`
            ).join('');
        }
    }
}

async function generateVideoPrompt() {
    const components = {
        subject: document.getElementById('videoSubject').value.trim(),
        character1: document.getElementById('videoCharacter1').value.trim(),
        character2: document.getElementById('videoCharacter2').value.trim(),
        characterInteraction: document.getElementById('videoCharacterInteraction').value.trim(),
        action: document.getElementById('videoAction').value.trim(),
        style: document.getElementById('videoStyleSelect').value,
        background: document.getElementById('videoBackground').value.trim(),
        atmosphere: document.getElementById('videoAtmosphere').value.trim(),
        techniques: Array.from(document.querySelectorAll('input[name="cameraTechnique"]:checked')).map(el => el.value),
        duration: document.getElementById('videoDuration').value,
        details: document.getElementById('videoDetails').value.trim(),
        model: document.getElementById('videoModelSelect').value,
        shotType: document.getElementById('videoShotType').value,
        subjectType: document.getElementById('videoSubjectType').value,
        actionIntensity: document.getElementById('videoActionIntensity').value,
        lighting: document.getElementById('videoLighting').value,
        mood: document.getElementById('videoMood').value,
        colorPalette: document.getElementById('videoColorPalette').value,
        specialEffects: document.getElementById('videoSpecialEffects').value,
        transitions: document.getElementById('videoTransitions').value,
        soundDesign: document.getElementById('videoSoundDesign').value,
        voice: document.getElementById('videoVoiceSelect').value,
        dialogueType: document.getElementById('videoDialogueType').value,
        dialogueText: document.getElementById('videoDialogueText').value.trim()
    };

    // Validate either subject or both characters are filled
    if (!components.subject && !(components.character1 && components.character2)) {
        showVideoToast("Isi Subjek utama atau kedua karakter!");
        return;
    }

    const generateBtn = document.getElementById('generateVideoPromptBtn');
    const regenerateBtn = document.getElementById('regenerateVideoPromptBtn');
    const loadingEl = document.getElementById('videoPromptLoading');
    const outputContainer = document.getElementById('videoPromptOutputContainer');
    
    // Disable buttons and show loading
    generateBtn.disabled = true;
    regenerateBtn.disabled = true;
    loadingEl.style.display = 'block';
    outputContainer.innerHTML = '<div class="text-center py-4"><i class="fas fa-spinner fa-spin"></i> Generating prompts...</div>';

    try {
        const basePrompt = createBasePrompt(components);
        const enhancementInstruction = createEnhancementInstruction(basePrompt, components);
        
        const response = await fetch(
            `https://text.pollinations.ai/prompt/${encodeURIComponent(enhancementInstruction)}?model=${components.model}&safe=false`
        );
        
        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const enhancedPrompt = await response.text();
        const prompts = processGeneratedPrompts(enhancedPrompt, components);
        
        displayPromptCards(prompts, components);
        saveVideoPromptToHistory(components, prompts);
        showVideoToast("Prompt video berhasil dibuat!");
        
    } catch (error) {
        console.error("Video prompt error:", error);
        showVideoToast("Gagal membuat prompt. Coba lagi.");
        
        try {
            const fallbackPrompts = generateFallbackPrompts(components);
            displayPromptCards(fallbackPrompts, components);
            saveVideoPromptToHistory(components, fallbackPrompts);
            showVideoToast("Prompt dibuat secara lokal");
        } catch (fallbackError) {
            outputContainer.innerHTML = `
                <div class="text-red-500 p-4">
                    Error: ${error.message}<br>
                    Fallback failed: ${fallbackError.message}
                </div>`;
        }
    } finally {
        generateBtn.disabled = false;
        regenerateBtn.disabled = false;
        loadingEl.style.display = 'none';
    }
}

function createEnhancementInstruction(basePrompt, components) {
    let instruction = `
    Enhance this video prompt with:
    1. Cinematography terms
    2. Lighting: ${components.lighting}
    3. Camera: ${components.techniques.join(', ')}
    4. Mood: ${components.mood}
    5. Style: ${components.style}
    6. Technical specs
    7. Shot: ${components.shotType}
    8. Colors: ${components.colorPalette}
    9. Effects: ${components.specialEffects}
    10. Sound: ${components.soundDesign}`;

    // Add voice and dialogue instructions if specified
    if (components.voice !== 'none') {
        instruction += `\n11. Voice: ${components.voice}`;
    }
    
    if (components.dialogueType !== 'none') {
        instruction += `\n12. Dialogue type: ${components.dialogueType}`;
        
        if (components.dialogueText) {
            instruction += `\n13. Dialogue content: ${components.dialogueText.substring(0, 100)}...`;
        }
    }

    instruction += `
    
    Format:
    [ENGLISH]
    [detailed prompt]
    
    [INDONESIAN]
    [translated prompt]
    
    Original: "${basePrompt}"
    `;

    return instruction;
}

function createBasePrompt(components) {
    // Build the main subject description
    let mainSubject;
    
    if (components.character1 && components.character2) {
        mainSubject = `${components.character1} and ${components.character2}`;
        
        // Add interaction if provided
        if (components.characterInteraction) {
            mainSubject += ` ${components.characterInteraction}`;
        }
        
        // Add main action if provided
        if (components.action) {
            mainSubject += ` while ${components.action}`;
        }
    } else {
        // Fallback to regular subject + action
        mainSubject = `${components.subject} ${components.action}`;
    }

    // Build the prompt parts
    const promptParts = [
        `[${components.style.toUpperCase()} VIDEO] ${mainSubject}`,
        `in ${components.background}`,
        `with ${components.atmosphere} atmosphere.`,
        `Camera techniques: ${components.techniques.join(', ')}.`,
        `Shot type: ${components.shotType}.`,
        `Action intensity: ${components.actionIntensity}.`,
        `Lighting: ${components.lighting}.`,
        `Mood: ${components.mood}.`,
        `Color palette: ${components.colorPalette}.`,
        `Special effects: ${components.specialEffects}.`,
        `Transitions: ${components.transitions}.`,
        `Sound design: ${components.soundDesign}.`,
        `Duration: ${components.duration}s.`
    ];

    // Add voice and dialogue if specified
    if (components.voice !== 'none') {
        promptParts.push(`Voice: ${components.voice}.`);
    }
    
    if (components.dialogueType !== 'none') {
        promptParts.push(`Dialogue type: ${components.dialogueType}.`);
        
        if (components.dialogueText) {
            promptParts.push(`Dialogue content: "${components.dialogueText.substring(0, 50)}..."`);
        }
    }

    // Add additional details if any
    if (components.details) {
        promptParts.push(components.details);
    }

    return promptParts.join(' ');
}

function createIndonesianPrompt(components) {
    let mainSubject;
    
    if (components.character1 && components.character2) {
        mainSubject = `${components.character1} dan ${components.character2}`;
        
        if (components.characterInteraction) {
            mainSubject += ` ${components.characterInteraction}`;
        }
        
        if (components.action) {
            mainSubject += ` sambil ${components.action}`;
        }
    } else {
        mainSubject = `${components.subject} ${components.action}`;
    }

    const promptParts = [
        `[VIDEO ${components.style.toUpperCase()}] ${mainSubject}`,
        `di ${components.background}`,
        `dengan suasana ${components.atmosphere}.`,
        `Teknik kamera: ${components.techniques.join(', ')}.`,
        `Jenis shot: ${components.shotType}.`,
        `Intensitas aksi: ${components.actionIntensity}.`,
        `Pencahayaan: ${components.lighting}.`,
        `Suasana: ${components.mood}.`,
        `Palet warna: ${components.colorPalette}.`,
        `Efek khusus: ${components.specialEffects}.`,
        `Transisi: ${components.transitions}.`,
        `Desain suara: ${components.soundDesign}.`,
        `Durasi: ${components.duration} detik.`
    ];

    // Add voice and dialogue in Indonesian
    if (components.voice !== 'none') {
        promptParts.push(`Suara: ${components.voice}.`);
    }
    
    if (components.dialogueType !== 'none') {
        const dialogueTypes = {
            'conversation': 'Percakapan',
            'monologue': 'Monolog',
            'narration': 'Narasi',
            'interview': 'Wawancara',
            'debate': 'Debat',
            'song': 'Lagu',
            'poem': 'Puisi',
            'storytelling': 'Bercerita',
            'instruction': 'Instruksi',
            'announcement': 'Pengumuman'
        };
        
        promptParts.push(`Jenis dialog: ${dialogueTypes[components.dialogueType] || components.dialogueType}.`);
        
        if (components.dialogueText) {
            promptParts.push(`Isi dialog: "${components.dialogueText.substring(0, 50)}..."`);
        }
    }

    if (components.details) {
        promptParts.push(components.details);
    }

    return promptParts.join(' ');
}

function processGeneratedPrompts(text, components) {
    const englishMatch = text.match(/\[ENGLISH\]\s*(.+?)\s*(?=\[INDONESIAN\]|$)/is);
    const indonesianMatch = text.match(/\[INDONESIAN\]\s*(.+?)\s*$/is);
    
    if (englishMatch && indonesianMatch) {
        return {
            english: englishMatch[1].trim(),
            indonesian: indonesianMatch[1].trim()
        };
    }
    
    // Fallback if API response format doesn't match
    return {
        english: createBasePrompt(components) + " High-quality 4K video with professional cinematography.",
        indonesian: createIndonesianPrompt(components) + " Video berkualitas 4K dengan sinematografi profesional."
    };
}

function generateFallbackPrompts(components) {
    return {
        english: createBasePrompt(components) + " Cinematic 4K resolution, 24fps, professional lighting.",
        indonesian: createIndonesianPrompt(components) + " Resolusi 4K sinematik, 24fps, pencahayaan profesional."
    };
}

function displayPromptCards(prompts, components) {
    const outputContainer = document.getElementById('videoPromptOutputContainer');
    
    outputContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="prompt-card active neuromorphic p-4 rounded-lg cursor-pointer" onclick="setActivePromptCard(this)">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-semibold bg-primary/10 text-primary dark:text-primary-light px-2 py-1 rounded">ENGLISH</span>
                    <button class="text-gray-500 hover:text-primary dark:hover:text-primary-light" onclick="copyPromptCard(event, this.parentElement.parentElement)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="prompt-text text-sm text-gray-700 dark:text-gray-300">${prompts.english}</div>
                <div class="mt-3 flex justify-end space-x-2">
                    <button class="text-xs bg-primary/10 text-primary dark:text-primary-light px-2 py-1 rounded hover:bg-primary/20" onclick="copyPromptCard(event, this.parentElement.parentElement)">
                        <i class="fas fa-copy mr-1"></i>Copy
                    </button>
                </div>
            </div>
            
            <div class="prompt-card neuromorphic p-4 rounded-lg cursor-pointer" onclick="setActivePromptCard(this)">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-semibold bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded">INDONESIA</span>
                    <button class="text-gray-500 hover:text-green-600 dark:hover:text-green-400" onclick="copyPromptCard(event, this.parentElement.parentElement)">
                        <i class="fas fa-copy"></i>
                    </button>
                </div>
                <div class="prompt-text text-sm text-gray-700 dark:text-gray-300">${prompts.indonesian}</div>
                <div class="mt-3 flex justify-end space-x-2">
                    <button class="text-xs bg-green-500/10 text-green-600 dark:text-green-400 px-2 py-1 rounded hover:bg-green-500/20" onclick="copyPromptCard(event, this.parentElement.parentElement)">
                        <i class="fas fa-copy mr-1"></i>Copy
                    </button>
                </div>
            </div>
        </div>
        
        <div class="mt-4">
            <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prompt Details:</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                ${components.character1 ? `<div><span class="font-medium">Character 1:</span> ${components.character1}</div>` : ''}
                ${components.character2 ? `<div><span class="font-medium">Character 2:</span> ${components.character2}</div>` : ''}
                ${components.characterInteraction ? `<div><span class="font-medium">Interaction:</span> ${components.characterInteraction}</div>` : ''}
                <div><span class="font-medium">Style:</span> ${components.style}</div>
                <div><span class="font-medium">Shot:</span> ${components.shotType}</div>
                <div><span class="font-medium">Subject:</span> ${components.subjectType}</div>
                <div><span class="font-medium">Lighting:</span> ${components.lighting}</div>
                <div><span class="font-medium">Mood:</span> ${components.mood}</div>
                <div><span class="font-medium">Duration:</span> ${components.duration}s</div>
                ${components.voice !== 'none' ? `<div><span class="font-medium">Voice:</span> ${components.voice}</div>` : ''}
                ${components.dialogueType !== 'none' ? `<div><span class="font-medium">Dialogue:</span> ${components.dialogueType}</div>` : ''}
            </div>
        </div>`;
}

function saveVideoPromptToHistory(components, prompts) {
    let history = JSON.parse(localStorage.getItem('videoPromptHistory')) || [];
    const historyItem = {
        date: new Date().toISOString(),
        components: {
            ...components,
            // Ensure techniques is an array
            techniques: components.techniques || []
        },
        prompts
    };
    
    // Check for duplicates
    const exists = history.some(item => 
        JSON.stringify(item.prompts) === JSON.stringify(prompts)
    );
    
    if (!exists) {
        history.unshift(historyItem);
        if (history.length > 10) history = history.slice(0, 10);
        localStorage.setItem('videoPromptHistory', JSON.stringify(history));
        loadVideoPromptHistory();
    }
}

function loadVideoPromptHistory() {
    const history = JSON.parse(localStorage.getItem('videoPromptHistory')) || [];
    const historyContainer = document.getElementById('videoPromptHistory');
    const videoHistoryContainer = document.getElementById('videoHistoryContainer');
    
    if (history.length === 0) {
        const emptyMsg = '<p class="text-sm text-gray-500 dark:text-gray-400">No history yet</p>';
        if (historyContainer) historyContainer.innerHTML = emptyMsg;
        if (videoHistoryContainer) videoHistoryContainer.innerHTML = emptyMsg;
        return;
    }
    
    const historyHTML = history.map((item, index) => `
        <div class="neuromorphic p-3 rounded-lg mb-2 cursor-pointer hover:bg-primary/10 dark:hover:bg-primary/20 transition" onclick="loadVideoPromptFromHistory(${index})">
            <div class="flex justify-between items-center mb-1">
                <span class="text-xs font-medium text-primary dark:text-primary-light">
                    ${new Date(item.date).toLocaleString()}
                </span>
                <button class="text-xs text-red-500 hover:text-red-700" onclick="deleteVideoPromptFromHistory(event, ${index})">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
            <p class="text-sm text-gray-700 dark:text-gray-300 truncate">
                ${item.prompts.english.substring(0, 60)}...
            </p>
            <div class="flex flex-wrap gap-1 mt-1">
                ${item.components.character1 ? `<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.character1}</span>` : ''}
                ${item.components.character2 ? `<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.character2}</span>` : ''}
                <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.style}</span>
                <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.duration}s</span>
                ${item.components.voice !== 'none' ? `<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.voice}</span>` : ''}
                ${item.components.dialogueType !== 'none' ? `<span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">${item.components.dialogueType}</span>` : ''}
            </div>
        </div>
    `).join('');
    
    if (historyContainer) historyContainer.innerHTML = historyHTML;
    if (videoHistoryContainer) videoHistoryContainer.innerHTML = historyHTML;
}

function loadVideoPromptFromHistory(index) {
    const history = JSON.parse(localStorage.getItem('videoPromptHistory')) || [];
    if (index >= 0 && index < history.length) {
        const item = history[index];
        
        // Update all form fields
        const fields = {
            'videoSubject': item.components.subject || '',
            'videoCharacter1': item.components.character1 || '',
            'videoCharacter2': item.components.character2 || '',
            'videoCharacterInteraction': item.components.characterInteraction || '',
            'videoAction': item.components.action || '',
            'videoStyleSelect': item.components.style || 'openai',
            'videoBackground': item.components.background || '',
            'videoAtmosphere': item.components.atmosphere || '',
            'videoDuration': item.components.duration || '10',
            'videoDetails': item.components.details || '',
            'videoModelSelect': item.components.model || 'openai',
            'videoShotType': item.components.shotType || '',
            'videoSubjectType': item.components.subjectType || '',
            'videoActionIntensity': item.components.actionIntensity || '',
            'videoLighting': item.components.lighting || '',
            'videoMood': item.components.mood || '',
            'videoColorPalette': item.components.colorPalette || '',
            'videoSpecialEffects': item.components.specialEffects || '',
            'videoTransitions': item.components.transitions || '',
            'videoSoundDesign': item.components.soundDesign || '',
            'videoVoiceSelect': item.components.voice || 'none',
            'videoDialogueType': item.components.dialogueType || 'none',
            'videoDialogueText': item.components.dialogueText || ''
        };
        
        Object.entries(fields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = value;
        });
        
        // Update checkboxes
        document.querySelectorAll('input[name="cameraTechnique"]').forEach(checkbox => {
            checkbox.checked = (item.components.techniques || []).includes(checkbox.value);
        });
        
        // Update duration display
        document.getElementById('durationValue').textContent = item.components.duration || '10';
        
        // Display the prompts
        displayPromptCards(item.prompts, item.components);
        showVideoToast("Prompt dimuat dari riwayat");
    }
}

function deleteVideoPromptFromHistory(event, index) {
    event.stopPropagation();
    if (confirm("Delete this prompt from history?")) {
        let history = JSON.parse(localStorage.getItem('videoPromptHistory')) || [];
        if (index >= 0 && index < history.length) {
            history.splice(index, 1);
            localStorage.setItem('videoPromptHistory', JSON.stringify(history));
            loadVideoPromptHistory();
            showVideoToast("Prompt dihapus dari riwayat");
        }
    }
}

function clearVideoPromptHistory() {
    if (confirm("Clear ALL video prompt history?")) {
        localStorage.removeItem('videoPromptHistory');
        document.getElementById('videoPromptHistory').innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No history yet</p>';
        document.getElementById('videoHistoryContainer').innerHTML = '<p class="text-sm text-gray-500 dark:text-gray-400">No generation history yet</p>';
        showVideoToast("Semua riwayat prompt video dihapus");
    }
}

function setActivePromptCard(card) {
    document.querySelectorAll('.prompt-card').forEach(c => {
        c.classList.remove('active', 'ring-2', 'ring-primary');
    });
    card.classList.add('active', 'ring-2', 'ring-primary');
}

function copyPromptCard(event, card) {
    event.stopPropagation();
    const promptText = card.querySelector('.prompt-text').textContent;
    copyToClipboard(promptText);
}

function copyActivePrompt() {
    const outputContainer = document.getElementById('videoPromptOutputContainer');
    const activePrompt = outputContainer.querySelector('.prompt-card.active');
    if (activePrompt) {
        const promptText = activePrompt.querySelector('.prompt-text').textContent;
        copyToClipboard(promptText);
    }
}

function copyToClipboard(text) {
    if (!text) {
        showVideoToast("Tidak ada teks untuk disalin");
        return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
        showVideoToast("Tersalin ke clipboard!");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        showVideoToast("Gagal menyalin");
    });
}

function showVideoToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center';
    toast.innerHTML = `<i class="fas fa-info-circle mr-2"></i><span>${message}</span>`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make functions available globally
window.loadVideoPromptFromHistory = loadVideoPromptFromHistory;
window.deleteVideoPromptFromHistory = deleteVideoPromptFromHistory;
window.setActivePromptCard = setActivePromptCard;
window.copyPromptCard = copyPromptCard;
