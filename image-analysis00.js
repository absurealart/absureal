// image-analysis.js
const ImageAnalyzer = (function() {
    // DOM Elements
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const modelSelect = document.getElementById('analysisModelSelect');
    const questionInput = document.getElementById('questionInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const generatePromptBtn = document.getElementById('generatePromptBtn');
    const generateCharacterBtn = document.getElementById('generateCharacterBtn');
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const analysisPromptText = document.getElementById('analysisPromptText');
    const characterJson = document.getElementById('characterJson');
    const loadingIndicator = document.getElementById('analysisLoadingIndicator');
    const copyBtn = document.getElementById('copyBtn');
    const analysisModelInfo = document.getElementById('analysisModelInfo');
    const modelUsed = document.getElementById('model-used');
    const resultTabs = document.getElementById('resultTabs');
    const analysisTab = document.getElementById('analysisTab');
    const promptTab = document.getElementById('promptTab');
    const characterTab = document.getElementById('characterTab');
    const analysisContent = document.getElementById('analysisContent');
    const promptContent = document.getElementById('promptContent');
    const characterContent = document.getElementById('characterContent');
    const resultTitle = document.getElementById('resultTitle');

    // Model details
    const modelDetails = {
        'gpt-4.1': {
            name: 'GPT-4.1',
            description: 'Enhanced reasoning capabilities for complex analysis'
        }
    };

    // Initialize
    function init() {
        setupEventListeners();
        console.log("Image Analyzer initialized");
    }

    function setupEventListeners() {
        // Drag and drop handlers
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        uploadArea.addEventListener('click', () => imageInput.click());
        imageInput.addEventListener('change', handleImageSelection);

        // Tab switching
        [analysisTab, promptTab, characterTab].forEach(tab => {
            tab.addEventListener('click', switchTab);
        });

        // Action buttons
        analyzeBtn.addEventListener('click', analyzeImageHandler);
        generatePromptBtn.addEventListener('click', generatePromptHandler);
        generateCharacterBtn.addEventListener('click', generateCharacterHandler);
        copyBtn.addEventListener('click', copyResults);

        console.log("Event listeners set up");
    }

    function handleDragOver(e) {
        e.preventDefault();
        uploadArea.classList.add('border-indigo-500', 'bg-gray-100');
    }

    function handleDragLeave() {
        uploadArea.classList.remove('border-indigo-500', 'bg-gray-100');
    }

    function handleDrop(e) {
        e.preventDefault();
        uploadArea.classList.remove('border-indigo-500', 'bg-gray-100');
        
        if (e.dataTransfer.files.length) {
            imageInput.files = e.dataTransfer.files;
            handleImageSelection();
        }
    }

    function handleImageSelection() {
        const file = imageInput.files[0];
        console.log("File selected:", file);

        if (!file) {
            console.log("No file selected");
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, WEBP)');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Image must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
            
            // Enable all buttons
            analyzeBtn.disabled = false;
            generatePromptBtn.disabled = false;
            generateCharacterBtn.disabled = false;
            
            // Reset results display
            resultDiv.style.display = 'none';
            resultTabs.style.display = 'none';
            
            console.log("Image loaded successfully");
        };
        reader.readAsDataURL(file);
    }

    function switchTab(e) {
        const tab = e.currentTarget;
        
        // Set active tab
        [analysisTab, promptTab, characterTab].forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Show corresponding content
        analysisContent.style.display = 'none';
        promptContent.style.display = 'none';
        characterContent.style.display = 'none';
        
        switch(tab.dataset.tab) {
            case 'analysis':
                analysisContent.style.display = 'block';
                resultTitle.textContent = 'Analysis Results';
                break;
            case 'prompt':
                promptContent.style.display = 'block';
                resultTitle.textContent = 'Image Prompt';
                break;
            case 'character':
                characterContent.style.display = 'block';
                resultTitle.textContent = 'Character Details';
                break;
        }
    }

    async function analyzeImageHandler() {
        const file = imageInput.files[0];
        const question = questionInput.value.trim() || "What's in this image?";
        const model = modelSelect.value;
        const modelName = modelDetails[model].name;
        
        if (!file) {
            alert('Please upload an image first');
            return;
        }
        
        showLoadingState(modelName);
        
        try {
            const analysis = await analyzeImage(file, question, model);
            resultText.textContent = analysis;
            modelUsed.textContent = `Analyzed with ${modelName}`;
            
            // Show only analysis tab
            resultTabs.style.display = 'flex';
            analysisTab.click();
            resultDiv.style.display = 'block';
        } catch (error) {
            console.error("Analysis error:", error);
            resultText.textContent = `Error: ${error.message}`;
            resultDiv.style.display = 'block';
        } finally {
            hideLoadingState();
        }
    }

    async function generatePromptHandler() {
        const file = imageInput.files[0];
        const model = modelSelect.value;
        const modelName = modelDetails[model].name;
        
        if (!file) {
            alert('Please upload an image first');
            return;
        }
        
        showLoadingState(modelName);
        
        try {
            const prompt = await generateImagePrompt(file, model);
            analysisPromptText.textContent = prompt;
            
            modelUsed.textContent = `Generated with ${modelName}`;
            
            // Show prompt tab
            resultTabs.style.display = 'flex';
            promptTab.click();
            resultDiv.style.display = 'block';
        } catch (error) {
            console.error("Prompt generation error:", error);
            // Show error in the prompt content area
            analysisPromptText.textContent = `Error: ${error.message}`;
            resultTabs.style.display = 'flex';
            promptTab.click();
            resultDiv.style.display = 'block';
        } finally {
            hideLoadingState();
        }
    }

    async function generateCharacterHandler() {
        const file = imageInput.files[0];
        const model = modelSelect.value;
        const modelName = modelDetails[model].name;
        
        if (!file) {
            alert('Please upload an image first');
            return;
        }
        
        showLoadingState(modelName);
        
        try {
            const characterDetails = await generateCharacterDetails(file, model);
            characterJson.textContent = characterDetails;
            
            modelUsed.textContent = `Generated with ${modelName}`;
            
            // Show character tab
            resultTabs.style.display = 'flex';
            characterTab.click();
            resultDiv.style.display = 'block';
        } catch (error) {
            console.error("Character generation error:", error);
            resultText.textContent = `Error: ${error.message}`;
            resultDiv.style.display = 'block';
        } finally {
            hideLoadingState();
        }
    }

    function showLoadingState(modelName) {
        loadingIndicator.style.display = 'block';
        analysisModelInfo.textContent = `Using ${modelName} model...`;
        analyzeBtn.disabled = true;
        generatePromptBtn.disabled = true;
        generateCharacterBtn.disabled = true;
        resultDiv.style.display = 'none';
        resultTabs.style.display = 'none';
    }

    function hideLoadingState() {
        loadingIndicator.style.display = 'none';
        analyzeBtn.disabled = false;
        generatePromptBtn.disabled = false;
        generateCharacterBtn.disabled = false;
    }

    // ===== API Functions =====
    async function analyzeImage(imageFile, question, model = "gpt-4.1") {
        try {
            const base64Image = await fileToBase64(imageFile);
            
            const payload = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: question },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 1500
            };

            const response = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to analyze image');
            }

            const result = await response.json();
            return result.choices[0].message.content;
        } catch (error) {
            console.error("Error analyzing image:", error);
            throw new Error("Failed to analyze image. Please try again.");
        }
    }

    async function generateImagePrompt(imageFile, model = "gpt-4.1") {
        try {
            const base64Image = await fileToBase64(imageFile);
            
            const payload = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Generate a detailed image generation prompt in JSON format with these properties: 
                                "description" (detailed scene description), 
                                "style" (art style, e.g., photorealistic, anime, oil painting), 
                                "composition" (layout and framing), 
                                "lighting" (type and quality of lighting), 
                                "color_palette" (dominant colors), 
                                "mood" (overall atmosphere). 
                                Ensure the response is a valid JSON object with no additional commentary.` 
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 1000
            };

            const response = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("API Error Response:", errorText);
                throw new Error('Failed to generate prompt. API returned an error.');
            }

            const result = await response.json();
            
            // Check if response has valid content
            if (!result.choices || !result.choices[0] || !result.choices[0].message || !result.choices[0].message.content) {
                throw new Error('Invalid response structure from API');
            }
            
            const jsonContent = result.choices[0].message.content;
            
            // Parse and pretty-print JSON
            const parsedJson = JSON.parse(jsonContent);
            return JSON.stringify(parsedJson, null, 2);
        } catch (error) {
            console.error("Error generating prompt:", error);
            throw new Error("Failed to generate image prompt. " + error.message);
        }
    }

    async function generateCharacterDetails(imageFile, model = "gpt-4.1") {
        try {
            const base64Image = await fileToBase64(imageFile);
            
            const payload = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { 
                                type: "text", 
                                text: `Describe the character in this image as a detailed JSON object with these properties:
                                "general_description" (overall description of the character),
                                "subject": {
                                    "gender",
                                    "age_range",
                                    "expression" (detailed description of facial expression),
                                    "facial_features": {
                                        "hair": {
                                            "color",
                                            "texture",
                                            "style"
                                        },
                                        "eyes": {
                                            "shape",
                                            "gaze_direction",
                                            "characteristics" (other notable features)
                                        },
                                        "eyebrows": {
                                            "shape",
                                            "texture"
                                        },
                                        "nose": {
                                            "shape",
                                            "characteristics"
                                        },
                                        "mouth": {
                                            "shape",
                                            "characteristics",
                                            "expression_details"
                                        },
                                        "facial_hair": {
                                            "mustache",
                                            "beard"
                                        },
                                        "skin_texture": (description of skin texture and complexion)
                                    }
                                },
                                "environment": {
                                    "background",
                                    "lighting"
                                },
                                "clothing": (description of clothing and accessories)
                                Respond with only a valid JSON object, no additional commentary.` 
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64Image,
                                    detail: "high"
                                }
                            }
                        ]
                    }
                ],
                response_format: { type: "json_object" },
                max_tokens: 1500
            };

            const response = await fetch('https://text.pollinations.ai/openai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to generate character details');
            }

            const result = await response.json();
            const jsonContent = result.choices[0].message.content;
            
            // Format JSON for better display
            return JSON.stringify(JSON.parse(jsonContent), null, 2);
        } catch (error) {
            console.error("Error generating character details:", error);
            throw new Error("Failed to generate character details. Please try again.");
        }
    }

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function copyResults() {
        let textToCopy = '';
        if (analysisTab.classList.contains('active')) {
            textToCopy = resultText.textContent;
        } else if (promptTab.classList.contains('active')) {
            textToCopy = analysisPromptText.textContent;
        } else if (characterTab.classList.contains('active')) {
            textToCopy = characterJson.textContent;
        }

        navigator.clipboard.writeText(textToCopy).then(() => {
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Copied!';
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = '<i class="fas fa-copy mr-1"></i> Copy';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy text. Please try again.');
        });
    }

    // Public API
    return {
        init
    };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    ImageAnalyzer.init();
});