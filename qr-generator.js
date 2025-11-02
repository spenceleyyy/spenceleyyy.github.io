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
    
    // --- CANVAS RESOLUTION SETTING ---
    const QR_SIZE = 600; // Increased to 600x600 for better quality
    // ---------------------------------
    
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
            canvas.width = QR_SIZE;
            canvas.height = QR_SIZE;
            
            // IMPORTANT: Set a smaller display size in CSS for the wrapper to fit on the screen
            // The actual drawing resolution is 600x600, but we display it smaller.
            qrcodeDiv.style.width = '300px'; 
            qrcodeDiv.style.height = '300px'; 
            
            qrcodeDiv.appendChild(canvas);
            currentQRCanvas = canvas;

            // Generate QR code using API
            generateQRCodeFromAPI(text, canvas);
        });
    }

    function generateQRCodeFromAPI(text, canvas) {
        // Use the new QR_SIZE variable in the API call
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${QR_SIZE}x${QR_SIZE}&data=${encodeURIComponent(text)}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, QR_SIZE, QR_SIZE);
            
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

    // Updated logic: Create a circular cutout and place the logo in the center
    function addLogoToQR(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        
        // --- LOGO SIZE ADJUSTMENT (Increased to 35% for maximum size) ---
        const logoTargetSize = Math.round(canvasSize * 0.35); // Maxing out the size
        const logoRadius = logoTargetSize / 2;
        // -----------------------------------------------------------------

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const logoX = centerX - logoRadius;
        const logoY = centerY - logoRadius;
        
        // 1. Create the circular cutout (White Hole) ⚪
        ctx.save(); 
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; 
        ctx.fill(); 
        ctx.closePath();
        ctx.restore(); 

        // 2. Determine which logo to use
        let logoToUse = null;

        if (useCustomLogo && useCustomLogo.checked && customLogoDataUrl) {
            logoToUse = customLogoDataUrl;
        } else {
            logoToUse = DEFAULT_LOGO_PATH;
        }

        // 3. Draw the Logo Image inside the cutout
        if (logoToUse) {
            const img = new Image();
            img.onload = () => {
                // Drawing onto the 600x600 canvas ensures high clarity
                ctx.drawImage(img, logoX, logoY, logoTargetSize, logoTargetSize);
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
                // toDataURL will use the full 600x600 resolution for the download!
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
