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
    
    let currentQRCode = null;
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

    // Generate QR Code
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const text = qrInput.value.trim();
            
            if (!text) {
                alert('Please enter text or URL');
                return;
            }

            // Clear previous QR code
            qrcodeDiv.innerHTML = '';
            
            // Hide placeholder, show QR code
            if (qrPlaceholder) qrPlaceholder.style.display = 'none';
            if (qrcodeWrapper) qrcodeWrapper.style.display = 'flex';
            if (qrDownloadControls) qrDownloadControls.style.display = 'flex';

            // Generate QR code
            currentQRCode = new QRCode(qrcodeDiv, {
                text: text,
                width: 300,
                height: 300,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });

            // If logo is requested, overlay it after QR generation
            if (includeLogoCheckbox && includeLogoCheckbox.checked) {
                setTimeout(() => {
                    addLogoToQR();
                }, 100);
            }
        });
    }

    // Add logo to QR code
    function addLogoToQR() {
        const canvas = qrcodeDiv.querySelector('canvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const logoSize = 60; // Size of logo in center
        const x = (canvas.width - logoSize) / 2;
        const y = (canvas.height - logoSize) / 2;

        if (useCustomLogo && useCustomLogo.checked && customLogoDataUrl) {
            // Use custom logo
            const img = new Image();
            img.onload = () => {
                // White background for logo
                ctx.fillStyle = 'white';
                ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
                
                ctx.drawImage(img, x, y, logoSize, logoSize);
            };
            img.src = customLogoDataUrl;
        } else {
            // Use RS text logo
            ctx.fillStyle = 'white';
            ctx.fillRect(x - 5, y - 5, logoSize + 10, logoSize + 10);
            
            ctx.fillStyle = '#e890be';
            ctx.font = 'bold 40px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RS', canvas.width / 2, canvas.height / 2);
        }
    }

    // Download QR Code
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const canvas = qrcodeDiv.querySelector('canvas');
            if (!canvas) return;

            const format = qrFormatSelect.value;
            const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
            const dataUrl = canvas.toDataURL(mimeType);

            const link = document.createElement('a');
            link.download = `qrcode.${format}`;
            link.href = dataUrl;
            link.click();
        });
    }
});