document.addEventListener('DOMContentLoaded', () => {
    const imageUpload = document.getElementById('image-upload');
    const bgUploadArea = document.getElementById('bg-upload-area');
    const fileName = document.getElementById('file-name');
    const removeBgBtn = document.getElementById('remove-bg');
    const processingContainer = document.getElementById('processing-container');
    const previewContainer = document.getElementById('preview-container');
    const originalPreview = document.getElementById('original-preview');
    const processedCanvas = document.getElementById('processed-canvas');
    const bgOutput = document.getElementById('bg-output');
    const downloadBtn = document.getElementById('download-result');
    const bgRemoverCard = document.getElementById('bg-remover-card');

    let uploadedImage = null;

    // Drag and drop
    if (bgRemoverCard) {
        bgRemoverCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            bgUploadArea.style.borderColor = 'var(--color-primary)';
            bgUploadArea.style.background = 'rgba(232, 144, 190, 0.1)';
        });

        bgRemoverCard.addEventListener('dragleave', (e) => {
            e.preventDefault();
            bgUploadArea.style.borderColor = 'rgba(232, 144, 190, 0.3)';
            bgUploadArea.style.background = 'rgba(23, 45, 51, 0.3)';
        });

        bgRemoverCard.addEventListener('drop', (e) => {
            e.preventDefault();
            bgUploadArea.style.borderColor = 'rgba(232, 144, 190, 0.3)';
            bgUploadArea.style.background = 'rgba(23, 45, 51, 0.3)';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                imageUpload.files = files;
                handleImageUpload(files[0]);
            }
        });
    }

    // File upload
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }

    function handleImageUpload(file) {
        fileName.textContent = file.name;
        fileName.style.display = 'block';
        removeBgBtn.disabled = false;

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                originalPreview.src = e.target.result;
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Remove background
    if (removeBgBtn) {
        removeBgBtn.addEventListener('click', () => {
            if (!uploadedImage) return;

            processingContainer.style.display = 'block';
            previewContainer.style.display = 'none';
            bgOutput.style.display = 'none';

            // Simulate processing
            setTimeout(() => {
                removeBackground(uploadedImage);
                processingContainer.style.display = 'none';
                previewContainer.style.display = 'grid';
                bgOutput.style.display = 'block';
            }, 1500);
        });
    }

    function removeBackground(img) {
        const canvas = processedCanvas;
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Simple background removal using color threshold
        // This is a basic implementation - real background removal is much more complex
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // If pixel is close to white or very light, make it transparent
            const brightness = (r + g + b) / 3;
            if (brightness > 200) {
                data[i + 3] = 0; // Make transparent
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Download result
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const dataUrl = processedCanvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = 'background-removed.png';
            link.href = dataUrl;
            link.click();
        });
    }
});