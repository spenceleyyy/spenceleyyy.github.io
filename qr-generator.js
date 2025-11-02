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
    const qrDisplayContent = document.getElementById('qr-display-content'); // New selection
    
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

    // Generate QR Code using Canvas API directly (no external library needed!)
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
            
            // Hide placeholder, show QR code and controls
            if (qrPlaceholder) qrPlaceholder.style.display = 'none';
            // FIX: Ensure the main output container is visible
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
        // Use QR code API to generate the image
        // NOTE: The API image is not CORS safe, so we must load it via a proxy to avoid issues with toDataURL.
        // Using a standard public API like api.qrserver.com often results in CORS errors when trying to read the canvas.
        // The current implementation uses 'anonymous' crossOrigin which might fail depending on your hosting setup.
        // For a reliable solution, you should proxy the image through your own backend or use a CORS-friendly API.
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;
        
        const img = new Image();
        img.crossOrigin = 'anonymous'; 
        img.onload = () => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 300, 300);
            
            // If logo is requested, overlay it after QR generation
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

    // New logic for adding the circular logo with a border
    function addLogoToQR(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        
        // Logo will be approximately 20% of the QR code size
        const logoDiameter = Math.round(canvasSize * 0.20); 
        const logoRadius = logoDiameter / 2;
        
        // Outer ring size (e.g., 25% of QR code size)
        const outerDiameter = Math.round(canvasSize * 0.25);
        const outerRadius = outerDiameter / 2;

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const logoX = centerX - logoRadius;
        const logoY = centerY - logoRadius;

        // 1. Draw the Outer Green Ring (Border)
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#1D724D'; // Starbucks-like green for border
        ctx.fill();
        ctx.closePath();

        // 2. Draw the Inner White Circle (Background)
        // Make the inner circle slightly smaller than the outer to create the border effect
        const innerRadius = outerRadius - 4; // 4px border
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.closePath();

        // 3. Draw the Logo
        if (useCustomLogo && useCustomLogo.checked && customLogoDataUrl) {
            // Use custom logo: Draw it, but clip it to the inner circle
            const img = new Image();
            img.onload = () => {
                // Set a clipping region to make the logo circular
                ctx.save();
                ctx.beginPath();
                // Clip to the inner white circle, so the logo image doesn't bleed out
                ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2); 
                ctx.clip(); 
                
                // Draw the custom image centered within the inner circle size
                ctx.drawImage(img, logoX, logoY, logoDiameter, logoDiameter);
                ctx.restore(); // Restore context to remove clipping path
            };
            img.src = customLogoDataUrl;
        } else {
            // Use RS text logo: Draw it directly on the inner white circle
            ctx.fillStyle = '#e890be'; // Your custom color
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RS', centerX, centerY);
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
            
            // Check for potential CORS issue before downloading
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
