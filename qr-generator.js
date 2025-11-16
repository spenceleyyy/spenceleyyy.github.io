document.addEventListener('DOMContentLoaded', () => {
    const qrInput = document.getElementById('qr-input');
    const generateBtn = document.getElementById('generate-qr');
    const downloadBtn = document.getElementById('download-qr');
    const qrcodeDiv = document.getElementById('qrcode');
    const qrcodeWrapper = document.getElementById('qrcode-wrapper');
    const qrPlaceholder = document.getElementById('qr-placeholder');
    const qrFormatSelect = document.getElementById('qr-format');
    const includeLogoCheckbox = document.getElementById('include-logo');
    const logoOptions = document.getElementById('logo-options');
    const useRsLogo = document.getElementById('use-rs-logo');
    const useCustomLogo = document.getElementById('use-custom-logo');
    const customLogoUpload = document.getElementById('custom-logo-upload');
    const customLogoArea = document.getElementById('custom-logo-area');
    const customLogoName = document.getElementById('custom-logo-name');
    const qrDisplayContent = document.getElementById('qr-display-content'); 
    const qrDownloads = document.getElementById('qr-download-controls');
    const heroScrollBtn = document.querySelector('[data-scroll-target="generator"]');
    const revealSections = document.querySelectorAll('.reveal');
    
    const DEFAULT_LOGO_PATH = "/logos/RSlogoUPDATED.png";
    
    const QR_SIZE = 600; 
    
    let currentQRCanvas = null;
    let customLogoDataUrl = null;
    let lastPayload = '';
    let resizeTimeoutId = null;

    function rerenderIfNeeded() {
        if (lastPayload) {
            renderQRCode(lastPayload);
        }
    }

    // Show/hide logo options
    if (includeLogoCheckbox) {
        const toggleLogoOptions = () => {
            if (logoOptions) {
                logoOptions.style.display = includeLogoCheckbox.checked ? 'block' : 'none';
            }
            if (!includeLogoCheckbox.checked && customLogoName) {
                customLogoName.style.display = 'none';
                customLogoName.textContent = '';
            }
            rerenderIfNeeded();
        };
        includeLogoCheckbox.addEventListener('change', toggleLogoOptions);
        toggleLogoOptions();
    }

    // Handle logo choice
    if (useRsLogo && useCustomLogo && customLogoArea) {
        const toggleCustomArea = () => {
            customLogoArea.style.display = useCustomLogo.checked ? 'block' : 'none';
        };
        useRsLogo.addEventListener('change', toggleCustomArea);
        useCustomLogo.addEventListener('change', toggleCustomArea);
        toggleCustomArea();
    }

    // Handle custom logo upload
    if (customLogoUpload) {
        customLogoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (customLogoName) {
                    customLogoName.textContent = file.name;
                    customLogoName.style.display = 'block';
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
    const getTargetSize = () => {
        if (!qrcodeWrapper) return QR_SIZE;
        const wrapperWidth = qrcodeWrapper.clientWidth || QR_SIZE;
        return Math.min(wrapperWidth, 560);
    };

    function renderQRCode(text) {
        if (qrPlaceholder) qrPlaceholder.style.display = 'none';
        if (qrDisplayContent) qrDisplayContent.style.display = 'flex'; 
        if (qrcodeWrapper) qrcodeWrapper.style.display = 'flex';
        if (qrDownloads) qrDownloads.style.display = 'flex';

        const targetSize = getTargetSize();
        lastPayload = text;
        qrcodeDiv.innerHTML = '';
        qrcodeDiv.style.width = `${targetSize}px`;
        qrcodeDiv.style.height = `${targetSize}px`;

        new QRCode(qrcodeDiv, {
            text,
            width: targetSize,
            height: targetSize,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H,
        });

        setTimeout(() => {
            const canvas = qrcodeDiv.querySelector('canvas');
            if (canvas) {
                currentQRCanvas = canvas;
                if (includeLogoCheckbox && includeLogoCheckbox.checked) {
                    addLogoToQR(canvas);
                }
                playAssemblyAnimation();
            } else {
                console.error('QR Code library did not create a canvas element.');
            }
        }, 50);
    }

    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const text = qrInput.value.trim();
            
            if (!text) {
                alert('Please enter text or URL');
                return;
            }

            renderQRCode(text);
        });
    }
    
    // This function remains largely the same, but now it modifies the canvas
    // created by the library, which is better quality than the image API.
    function addLogoToQR(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        
        // LOGO SIZE ADJUSTMENT (35% for maximum size)
        const logoTargetSize = Math.round(canvasSize * 0.35); 
        const logoRadius = logoTargetSize / 2;

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
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                ctx.drawImage(img, logoX, logoY, logoTargetSize, logoTargetSize);
            };
            img.onerror = (e) => {
                console.error("Failed to load logo image:", e);
                // Fallback to text if image fails to load
                ctx.fillStyle = 'black'; 
                ctx.font = `bold ${logoTargetSize / 4}px Arial`; // Scale font size
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('RS', centerX, centerY);
            };
            img.src = logoToUse;
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
                // toDataURL works reliably with a canvas generated on the same domain
                const dataUrl = currentQRCanvas.toDataURL(mimeType);
                const link = document.createElement('a');
                link.download = `qrcode.${format}`;
                link.href = dataUrl;
                link.click();
            } catch (e) {
                alert("Download failed. A security or loading error occurred.");
                console.error("Download error:", e);
            }
        });
    }

    function playAssemblyAnimation() {
        if (!qrcodeWrapper) return;
        const overlay = document.createElement('div');
        overlay.className = 'qr-assembly-overlay';
        const tiles = 36;
        for (let i = 0; i < tiles; i += 1) {
            const cell = document.createElement('span');
            const delay = (i * 18) + Math.random() * 60;
            const tx = `${(Math.random() * 80 - 40).toFixed(1)}px`;
            const ty = `${(Math.random() * 80 - 40).toFixed(1)}px`;
            cell.style.setProperty('--delay', `${delay}ms`);
            cell.style.setProperty('--tx', tx);
            cell.style.setProperty('--ty', ty);
            overlay.appendChild(cell);
        }
        qrcodeWrapper.querySelectorAll('.qr-assembly-overlay').forEach((node) => node.remove());
        qrcodeWrapper.appendChild(overlay);
        const cleanup = () => overlay.remove();
        overlay.addEventListener('animationend', cleanup);
        setTimeout(cleanup, 1600);
    }

    window.addEventListener('resize', () => {
        if (!lastPayload) return;
        clearTimeout(resizeTimeoutId);
        resizeTimeoutId = setTimeout(() => {
            rerenderIfNeeded();
        }, 200);
    });

    if (heroScrollBtn) {
        heroScrollBtn.addEventListener('click', (event) => {
            event.preventDefault();
            const targetId = heroScrollBtn.dataset.scrollTarget;
            const section = document.getElementById(targetId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    if (revealSections.length) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            revealSections.forEach((section) => section.classList.add('visible'));
        } else {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
            revealSections.forEach((section) => observer.observe(section));
        }
    }
});
