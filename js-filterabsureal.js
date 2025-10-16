/**
 * FILTER.JS - Fitur Filter Gambar untuk TELEKBOYO
 * 
 * Fitur ini menyediakan kontrol brightness dan contrast untuk gambar yang dihasilkan
 * dengan tampilan real-time dan reset otomatis saat gambar baru dibuat.
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Filter.js loaded - Ready to enhance your images!');
    
    // 1. Deklarasi Elemen DOM
    const brightnessSlider = document.getElementById('brightnessSlider');
    const brightnessValue = document.getElementById('brightnessValue');
    const contrastSlider = document.getElementById('contrastSlider');
    const contrastValue = document.getElementById('contrastValue');
    const imageContainer = document.getElementById('imageContainer');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    // 2. Variabel untuk menyimpan gambar asli
    let originalImageData = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 3. Fungsi Utama - Update Filter Gambar
    function updateImageFilters() {
        const generatedImage = imageContainer.querySelector('img');
        
        // Validasi jika gambar belum ada
        if (!generatedImage || !generatedImage.src || generatedImage.src === '') {
            console.log('No image available to filter');
            return;
        }

        // Ambil nilai dari slider
        const brightness = parseInt(brightnessSlider.value);
        const contrast = parseInt(contrastSlider.value);

        // Update tampilan nilai
        brightnessValue.textContent = brightness;
        contrastValue.textContent = contrast;

        // Jika nilai default, reset ke gambar asli
        if (brightness === 0 && contrast === 100) {
            generatedImage.style.filter = 'none';
            console.log('Filters reset to default');
            return;
        }

        // Terapkan filter CSS
        generatedImage.style.filter = `
            brightness(${(brightness + 100) / 100}) 
            contrast(${contrast}%)
        `;
        
        console.log(`Applied filters - Brightness: ${brightness}, Contrast: ${contrast}%`);
    }

    // 4. Fungsi Reset Filter
    function resetFilters() {
        brightnessSlider.value = 0;
        contrastSlider.value = 100;
        updateImageFilters();
        console.log('All filters have been reset');
    }

    // 5. Fungsi Setup untuk Gambar Baru
    function setupImageFilters() {
        const img = imageContainer.querySelector('img');
        
        if (img) {
            // Simpan gambar asli pertama kali
            if (!originalImageData) {
                saveOriginalImage(img);
            }
            
            resetFilters();
            console.log('New image detected, filters ready');
        }
    }

    // 6. Backup Gambar Asli (untuk fitur advanced)
    function saveOriginalImage(img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('Original image data saved for advanced processing');
    }

    // 7. Event Listeners
    brightnessSlider.addEventListener('input', function() {
        updateImageFilters();
        // Animasi nilai brightness
        brightnessValue.classList.add('animate-pulse');
        setTimeout(() => brightnessValue.classList.remove('animate-pulse'), 300);
    });

    contrastSlider.addEventListener('input', function() {
        updateImageFilters();
        // Animasi nilai contrast
        contrastValue.classList.add('animate-pulse');
        setTimeout(() => contrastValue.classList.remove('animate-pulse'), 300);
    });

    applyFiltersBtn.addEventListener('click', function() {
        updateImageFilters();
        // Feedback visual
        this.classList.add('bg-green-500', 'text-white');
        setTimeout(() => this.classList.remove('bg-green-500', 'text-white'), 300);
        console.log('Filters applied');
    });

    resetFiltersBtn.addEventListener('click', function() {
        resetFilters();
        // Feedback visual
        this.classList.add('bg-red-500', 'text-white');
        setTimeout(() => this.classList.remove('bg-red-500', 'text-white'), 300);
    });

    // 8. Mutation Observer untuk Deteksi Gambar Baru
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length) {
                setupImageFilters();
            }
        });
    });

    observer.observe(imageContainer, { 
        childList: true, 
        subtree: true 
    });

    // 9. Inisialisasi Awal
    if (imageContainer.querySelector('img')) {
        setupImageFilters();
    } else {
        console.log('Waiting for first image generation...');
    }

    // 10. Ekspos Fungsi Utama untuk Keperluan Debug
    window.imageFilters = {
        update: updateImageFilters,
        reset: resetFilters,
        getValues: () => ({
            brightness: parseInt(brightnessSlider.value),
            contrast: parseInt(contrastSlider.value)
        })
    };
});
