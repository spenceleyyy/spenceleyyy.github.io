document.addEventListener('DOMContentLoaded', () => {
    const qrInput = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-qr');
    const downloadBtn = document.getElementById('download-qr');
    const qrcodeDiv = document.getElementById('qrcode');
    const qrcodeWrapper = document.getElementById('qrcode-wrapper');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const qrDownloadControls = document.getElementById('qr-download-controls');
    const qrFormatSelect = document.getElementById('qr-format');
    const includeLogoCheckbox = document.getElementById('include-logo');
    const logoOptions = document.getElementById('logo-options');
    const useRsLogo = document.getElementById('use-rs-logo');
    const useCustomLogo = document.getElementById('use-custom-logo');
    const customLogoUpload = document.getElementById('custom-logo-upload');
    const customLogoArea = document.getElementById('custom-logo-area');
    const customLogoName = document.getElementById('custom-logo-name');
    const qrDisplayContent = document.getElementById('qr-display-content'); 
    
    const DEFAULT_LOGO_PATH = "/logos/RSlogoUPDATED.png";
    
    let currentQRCanvas = null;
    let customLogoDataUrl = null;

    // Show/hide logo options
    if (includeLogoCheckbox) {
        includeLogoCheckbox.addEventListener('change', () => {
            if (logoOptions) {
                logoOptions.style.display = includeLogoCheckbox.checked ? 'block' : 'none';
            }
        });
    }

    // Handle logo choice
    if (useRsLogo && useCustomLogo && customLogoArea) {
        useRsLogo.addEventListener('change', () => {
            if (useRsLogo.checked) {
                customLogoArea.style.display = 'none';
            }
        });
        
        useCustomLogo.addEventListener('change', () => {
            if (useCustomLogo.checked) {
                customLogoArea.style.display = 'block';
            }
        });
    }

    // Handle custom logo upload
    if (customLogoUpload) {
        customLogoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (customLogoName) {
                    customLogoName.textContent = file.name;
                }
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    customLogoDataUrl = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // Generate QR Code using Canvas API directly
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const text = qrInput.value.trim();
            
            if (!text) {
                alert('Please enter text or URL');
                return;
            }

            console.log('Generating QR code for:', text);

            // Clear previous QR code
            qrcodeDiv.innerHTML = '';
            
            // Show QR code and controls
            if (qrPlaceholder) qrPlaceholder.style.display = 'none';
            if (qrDisplayContent) qrDisplayContent.style.display = 'flex'; 
            if (qrcodeWrapper) qrcodeWrapper.style.display = 'flex';
            if (qrDownloadControls) qrDownloadControls.style.display = 'flex';

            // Create canvas for QR code
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 300;
            qrcodeDiv.appendChild(canvas);
            currentQRCanvas = canvas;

            // Generate QR code using API
            generateQRCodeFromAPI(text, canvas);
        });
    }

    function generateQRCodeFromAPI(text, canvas) {
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 300, 300);
            
            // Overlay logo if requested
            if (includeLogoCheckbox && includeLogoCheckbox.checked) {
                addLogoToQR(canvas);
            }
        };
        img.onerror = () => {
            alert('Failed to generate QR code. Please try again.');
            console.error('QR code generation failed');
        };
        img.src = qrApiUrl;
    }

    // Updated logic for adding the logo: No circle, bigger, and higher quality
    function addLogoToQR(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        
        // --- LOGO SIZE ADJUSTMENT ---
        // Let the logo take up a larger portion, e.g., 25-30% of the QR code width.
        // This is a common practice to make it visible but not obscure too much of the code.
        const logoTargetSize = Math.round(canvasSize * 0.28); // Increased size (e.g., 28% of QR code)
        // ----------------------------

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const logoX = centerX - (logoTargetSize / 2);
        const logoY = centerY - (logoTargetSize / 2);

        // Determine which logo to use
        let logoToUse = null;

        if (useCustomLogo && useCustomLogo.checked && customLogoDataUrl) {
            logoToUse = customLogoDataUrl;
        } else {
            logoToUse = DEFAULT_LOGO_PATH;
        }

        if (logoToUse) {
            const img = new Image();
            img.onload = () => {
                // --- NO CIRCLE BACKGROUND/BORDER ---
                // We no longer draw any circles, so the logo will be directly on the QR code.
                // You might want to uncomment the white rectangle below if the logo needs a solid background
                // to stand out, but for now, it's removed as requested.
                // ctx.fillStyle = 'white'; 
                // ctx.fillRect(logoX, logoY, logoTargetSize, logoTargetSize);
                // ----------------------------------

                // --- IMPROVED LOGO QUALITY & SIZE ---
                // Draw the image at its natural resolution if available, then scale it down.
                // For optimal quality, the source image should be high resolution.
                // If the source image is already small, drawing it larger will still be pixelated.
                // Assuming the source `DEFAULT_LOGO_PATH` or `customLogoDataUrl` is reasonably sized,
                // this will now draw it at the `logoTargetSize`.
                ctx.drawImage(img, logoX, logoY, logoTargetSize, logoTargetSize);
                // ------------------------------------
            };
            img.onerror = (e) => {
                console.error("Failed to load logo image:", e);
                // Fallback to text if image fails to load
                ctx.fillStyle = 'black'; 
                ctx.font = 'bold 30px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('RS', centerX, centerY);
            };
            img.src = logoToUse;
            // Handle cross-origin issues for the default logo if hosted externally
            // Note: If /logos/RSlogoUPDATED.png is on the same domain, crossOrigin='anonymous' is not strictly needed
            // but harmless. If it's on a different domain, it's crucial.
            if (logoToUse === DEFAULT_LOGO_PATH) {
                img.crossOrigin = 'anonymous'; 
            }
        }
    }

    // Download QR Code
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentQRCanvas) {
                alert('Please generate a QR code first');
                return;
            }

            const format = qrFormatSelect.value;
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            
            try {
                const dataUrl = currentQRCanvas.toDataURL(mimeType);
                const link = document.createElement('a');
                link.download = `qrcode.${format}`;
                link.href = dataUrl;
                link.click();
            } catch (e) {
                alert("Download failed. This is likely due to CORS policy on the generated QR code image (the image is from a different domain).");
                console.error("Download error:", e);
            }
        });
    }
});
