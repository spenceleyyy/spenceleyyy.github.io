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
    const bgControls = document.getElementById('bg-controls');
    const bgSensitivity = document.getElementById('bg-sensitivity');
    const bgSensitivityValue = document.getElementById('bg-sensitivity-value');

    let uploadedImage = null;

    const updateSensitivityDisplay = () => {
        if (bgSensitivity && bgSensitivityValue) {
            bgSensitivityValue.textContent = bgSensitivity.value;
        }
    };
    updateSensitivityDisplay();

    const estimateBackgroundColor = (imageData) => {
        const { data, width, height } = imageData;
        const maxX = Math.max(0, width - 1);
        const maxY = Math.max(0, height - 1);
        const points = [
            [0, 0],
            [maxX, 0],
            [0, maxY],
            [maxX, maxY],
            [Math.floor(width / 2), 0],
            [0, Math.floor(height / 2)],
            [maxX, Math.floor(height / 2)],
            [Math.floor(width / 2), maxY],
        ];
        let r = 0;
        let g = 0;
        let b = 0;
        points.forEach(([x, y]) => {
            const clampedX = Math.min(Math.max(x, 0), maxX);
            const clampedY = Math.min(Math.max(y, 0), maxY);
            const index = (clampedY * width + clampedX) * 4;
            r += data[index];
            g += data[index + 1];
            b += data[index + 2];
        });
        const divisor = points.length || 1;
        return { r: r / divisor, g: g / divisor, b: b / divisor };
    };

    const featherAlpha = (data, width, height) => {
        const alpha = new Uint8ClampedArray(width * height);
        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
            alpha[p] = data[i + 3];
        }
        const blurred = new Uint8ClampedArray(alpha.length);
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let total = 0;
                let count = 0;
                for (let dy = -1; dy <= 1; dy += 1) {
                    const ny = y + dy;
                    if (ny < 0 || ny >= height) continue;
                    for (let dx = -1; dx <= 1; dx += 1) {
                        const nx = x + dx;
                        if (nx < 0 || nx >= width) continue;
                        total += alpha[ny * width + nx];
                        count += 1;
                    }
                }
                blurred[y * width + x] = total / count;
            }
        }
        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
            data[i + 3] = Math.round((alpha[p] + blurred[p]) / 2);
        }
    };

    const applyBackgroundRemoval = () => {
        if (!processedCanvas || !uploadedImage) return;
        const ctx = processedCanvas.getContext('2d');
        processedCanvas.width = uploadedImage.width;
        processedCanvas.height = uploadedImage.height;
        ctx.drawImage(uploadedImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
        const { data, width, height } = imageData;
        const sensitivityValue = bgSensitivity ? Number(bgSensitivity.value) : 65;
        const clampedSensitivity = Math.min(Math.max(sensitivityValue, 25), 95);
        const baseThreshold = 25 + (clampedSensitivity / 100) * 110;
        const bgColor = estimateBackgroundColor(imageData);

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const diff = Math.sqrt(
                (r - bgColor.r) ** 2 +
                (g - bgColor.g) ** 2 +
                (b - bgColor.b) ** 2
            );
            const brightness = (r + g + b) / 3 / 255;
            const adaptiveThreshold = baseThreshold * (1 - 0.25 * brightness);
            const hardCutoff = adaptiveThreshold * 0.55;
            const softCutoff = adaptiveThreshold;

            if (diff <= hardCutoff) {
                data[i + 3] = 0;
            } else if (diff < softCutoff) {
                const ratio = (diff - hardCutoff) / (softCutoff - hardCutoff);
                data[i + 3] = Math.round(ratio * data[i + 3]);
            }
        }

        featherAlpha(data, width, height);
        ctx.putImageData(imageData, 0, 0);
    };

    const processBackground = ({ skipLoader = false } = {}) => {
        if (!uploadedImage) return;

        const finalize = () => {
            applyBackgroundRemoval();
            previewContainer.style.display = 'grid';
            bgOutput.style.display = 'block';
            processingContainer.style.display = 'none';
        };

        if (skipLoader) {
            finalize();
            return;
        }

        processingContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        bgOutput.style.display = 'none';

        setTimeout(() => {
            finalize();
        }, 900);
    };

    const handleImageUpload = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            alert('Please upload a valid image file.');
            return;
        }

        fileName.textContent = file.name;
        fileName.style.display = 'block';
        removeBgBtn.disabled = false;
        if (bgControls) {
            bgControls.style.display = 'block';
        }
        updateSensitivityDisplay();

        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImage = new Image();
            uploadedImage.onload = () => {
                originalPreview.src = uploadedImage.src;
            };
            uploadedImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    if (imageUpload) {
        imageUpload.addEventListener('change', (event) => {
            const file = event.target.files?.[0];
            if (file) {
                handleImageUpload(file);
            }
        });
    }

    if (bgRemoverCard) {
        bgRemoverCard.addEventListener('dragover', (event) => {
            event.preventDefault();
            bgUploadArea.style.borderColor = 'var(--color-primary)';
            bgUploadArea.style.background = 'rgba(232, 144, 190, 0.1)';
        });

        bgRemoverCard.addEventListener('dragleave', (event) => {
            event.preventDefault();
            bgUploadArea.style.borderColor = 'rgba(232, 144, 190, 0.3)';
            bgUploadArea.style.background = 'rgba(23, 45, 51, 0.3)';
        });

        bgRemoverCard.addEventListener('drop', (event) => {
            event.preventDefault();
            bgUploadArea.style.borderColor = 'rgba(232, 144, 190, 0.3)';
            bgUploadArea.style.background = 'rgba(23, 45, 51, 0.3)';
            const file = event.dataTransfer?.files?.[0];
            if (file) {
                imageUpload.files = event.dataTransfer.files;
                handleImageUpload(file);
            }
        });
    }

    removeBgBtn?.addEventListener('click', () => {
        if (!uploadedImage) {
            alert('Upload an image before processing.');
            return;
        }
        processBackground();
    });

    bgSensitivity?.addEventListener('input', () => {
        updateSensitivityDisplay();
        if (uploadedImage && previewContainer.style.display === 'grid') {
            processBackground({ skipLoader: true });
        }
    });

    downloadBtn?.addEventListener('click', () => {
        if (!processedCanvas) return;
        const dataUrl = processedCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'background-removed.png';
        link.href = dataUrl;
        link.click();
    });
});
