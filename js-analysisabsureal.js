// analysis.js - Image Analysis functionality
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const uploadArea = document.getElementById('uploadArea');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    const modelSelect = document.getElementById('modelSelect');
    const questionInput = document.getElementById('questionInput');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resultDiv = document.getElementById('result');
    const resultText = document.getElementById('resultText');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const copyBtn = document.getElementById('copyBtn');

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-primary', 'bg-gray-100', 'dark:bg-gray-800');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-primary', 'bg-gray-100', 'dark:bg-gray-800');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-primary', 'bg-gray-100', 'dark:bg-gray-800');
        
        if (e.dataTransfer.files.length) {
            imageInput.files = e.dataTransfer.files;
            handleImageSelection();
        }
    });

    // Handle click to browse
    uploadArea.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', handleImageSelection);

    function handleImageSelection() {
        const file = imageInput.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                analyzeBtn.disabled = false;
                resultDiv.style.display = 'none';
            };
            reader.readAsDataURL(file);
        }
    }

    // Copy functionality
    copyBtn.addEventListener('click', () => {
        const range = document.createRange();
        range.selectNode(resultText);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                copyBtn.classList.add('copied');
                copyBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyBtn.classList.remove('copied');
                    copyBtn.textContent = 'Copy';
                }, 2000);
            } else {
                alert('Failed to copy text. Please try again.');
            }
        } catch (err) {
            alert('Failed to copy text. Please try again.');
        }
        
        window.getSelection().removeAllRanges();
    });

    // Analyze button click
    analyzeBtn.addEventListener('click', async () => {
        const file = imageInput.files[0];
        const question = questionInput.value.trim() || "What's in this image?";
        const model = modelSelect.value;
        
        if (!file) return;
        
        loadingIndicator.style.display = 'block';
        analyzeBtn.disabled = true;
        resultDiv.style.display = 'none';
        
        try {
            const analysis = await analyzeImage(file, question, model);
            resultText.textContent = analysis;
            resultDiv.style.display = 'block';
        } catch (error) {
            resultText.textContent = `Error: ${error.message}`;
            resultDiv.style.display = 'block';
        } finally {
            loadingIndicator.style.display = 'none';
            analyzeBtn.disabled = false;
        }
    });

    // Image analysis function
    async function analyzeImage(imageFile, question = "What's in this image?", model = "openai") {
        const url = "https://text.pollinations.ai/" + model;

        try {
            const base64ImageDataUrl = await fileToBase64(imageFile);

            const payload = {
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: question },
                            {
                                type: "image_url",
                                image_url: {
                                    url: base64ImageDataUrl,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 500,
            };

            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
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

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
});
