document.addEventListener('DOMContentLoaded', () => {
    const converterUpload = document.getElementById('converter-upload');
    const converterUploadArea = document.getElementById('converter-upload-area');
    const converterFileName = document.getElementById('converter-file-name');
    const converterOptions = document.getElementById('converter-options');
    const outputFormat = document.getElementById('output-format');
    const qualityControl = document.getElementById('quality-control');
    const imageQuality = document.getElementById('image-quality');
    const qualityValue = document.getElementById('quality-value');
    const convertBtn = document.getElementById('convert-image');
    const converterPreview = document.getElementById('converter-preview');
    const converterOriginal = document.getElementById('converter-original');
    const originalFormat = document.getElementById('original-format');
    const originalSize = document.getElementById('original-size');
    const converterCanvas = document.getElementById('converter-canvas');
    const convertedFormat = document.getElementById('converted-format');
    const convertedSize = document.getElementById('converted-size');
    const converterOutput = document.getElementById('converter-output');
    const downloadBtn = document.getElementById('download-converted');

    let uploadedImage = null;
    let originalFile = null;
    let convertedDataUrl = null;

    // File upload
    if (converterUpload) {
        converterUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }

    function handleImageUpload(file) {
        originalFile = file;
        converterFileName.textContent = file.name;
        converterFileName.style.display = 'block';
        converterOptions.style.display = 'block';
        convertBtn.disabled = false;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                converterOriginal.src = e.target.result;
                originalFormat.textContent = file.type.split('/')[1].toUpperCase();
                originalSize.textContent = `Size: ${(file.size / 1024).toFixed(2)} KB`;
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Show/hide quality control based on format
    if (outputFormat) {
        outputFormat.addEventListener('change', () => {
            const format = outputFormat.value;
            qualityControl.style.display = (format === 'jpeg' || format === 'webp') ? 'block' : 'none';
        });
    }

    // Update quality value display
    if (imageQuality) {
        imageQuality.addEventListener('input', () => {
            qualityValue.textContent = imageQuality.value;
        });
    }

    // Convert image
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            if (!uploadedImage) return;

            const format = outputFormat.value;
            const quality = imageQuality.value / 100;

            const canvas = converterCanvas;
            const ctx = canvas.getContext('2d');

            canvas.width = uploadedImage.width;
            canvas.height = uploadedImage.height;

            ctx.drawImage(uploadedImage, 0, 0);

            let mimeType = '';
            if (format === 'png') {
                mimeType = 'image/png';
                convertedDataUrl = canvas.toDataURL(mimeType);
            } else if (format === 'jpeg') {
                mimeType = 'image/jpeg';
                convertedDataUrl = canvas.toDataURL(mimeType, quality);
            } else if (format === 'webp') {
                mimeType = 'image/webp';
                convertedDataUrl = canvas.toDataURL(mimeType, quality);
            }

            // Calculate converted size (approximate)
            const base64Length = convertedDataUrl.length - (convertedDataUrl.indexOf(',') + 1);
            const sizeInBytes = (base64Length * 3) / 4;
            
            convertedFormat.textContent = format.toUpperCase();
            convertedSize.textContent = `Size: ${(sizeInBytes / 1024).toFixed(2)} KB`;

            converterPreview.style.display = 'grid';
            converterOutput.style.display = 'block';
        });
    }

    // Download converted image
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!convertedDataUrl) return;

            const format = outputFormat.value;
            const link = document.createElement('a');
            link.download = `converted-image.${format}`;
            link.href = convertedDataUrl;
            link.click();
        });
    }
});