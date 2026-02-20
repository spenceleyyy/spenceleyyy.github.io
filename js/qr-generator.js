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
    const useNeuroLogo = document.getElementById('use-neuro-logo');
    const useCustomLogo = document.getElementById('use-custom-logo');
    const customLogoUpload = document.getElementById('custom-logo-upload');
    const customLogoArea = document.getElementById('custom-logo-area');
    const customLogoName = document.getElementById('custom-logo-name');
    const qrDisplayContent = document.getElementById('qr-display-content'); 
    const qrDownloads = document.getElementById('qr-download-controls');
    const roundedCornersToggle = document.getElementById('rounded-corners');
    const backgroundColorInput = document.getElementById('qr-bg-color');
    const heroScrollBtn = document.querySelector('[data-scroll-target="generator"]');
    const revealSections = document.querySelectorAll('.reveal');
    const playToggle = document.getElementById('play-toggle');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionReduced = motionMediaQuery.matches;
    
    const DEFAULT_LOGO_PATH = "/logos/RSlogoUPDATEd.pdf";
    const DEFAULT_LOGO_FALLBACK = "/logos/RSlogoUPDATED.png";
    const NEURO_LOGO_PATH = "/logos/NeuroErgoHead.png";
    const QR_SIZE = 600; 
    const DEFAULT_BACKGROUND_COLOR = '#ffffff';
    const OUTER_RADIUS_RATIO = 0.06;
    const PDF_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";

    if (window.pdfjsLib) {
        try {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
        } catch (err) {
            console.warn("PDF.js worker setup failed:", err);
        }
    }
    
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
        const handleLogoChoiceChange = () => {
            toggleCustomArea();
            if (customLogoName && !useCustomLogo.checked) {
                customLogoName.style.display = 'none';
                customLogoName.textContent = '';
            }
            rerenderIfNeeded();
        };
        useRsLogo.addEventListener('change', handleLogoChoiceChange);
        useCustomLogo.addEventListener('change', handleLogoChoiceChange);
        if (useNeuroLogo) {
            useNeuroLogo.addEventListener('change', handleLogoChoiceChange);
        }
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
                    rerenderIfNeeded();
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (roundedCornersToggle) {
        roundedCornersToggle.addEventListener('change', rerenderIfNeeded);
    }

    if (backgroundColorInput) {
        if (!backgroundColorInput.value) {
            backgroundColorInput.value = DEFAULT_BACKGROUND_COLOR;
        }
        backgroundColorInput.addEventListener('input', rerenderIfNeeded);
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
        const backgroundColor = (backgroundColorInput && backgroundColorInput.value) || DEFAULT_BACKGROUND_COLOR;
        const roundedModules = !!(roundedCornersToggle && roundedCornersToggle.checked);
        const renderOptions = {
            rounded: roundedModules,
            backgroundColor,
        };
        lastPayload = text;
        qrcodeDiv.innerHTML = '';
        qrcodeDiv.style.width = `${targetSize}px`;
        qrcodeDiv.style.height = `${targetSize}px`;

        try {
            const canvas = buildQRCodeCanvas(text, targetSize, renderOptions);
            qrcodeDiv.appendChild(canvas);
            currentQRCanvas = canvas;
            if (includeLogoCheckbox && includeLogoCheckbox.checked) {
                addLogoToQR(canvas, backgroundColor);
            }
            playAssemblyAnimation();
        } catch (error) {
            console.error('Failed to draw QR code canvas:', error);
        }
    }

    function buildQRCodeCanvas(text, size, options = {}) {
        const {
            rounded = false,
            backgroundColor = DEFAULT_BACKGROUND_COLOR,
        } = options;
        const tempContainer = document.createElement('div');
        const generator = new QRCode(tempContainer, {
            text: '',
            width: size,
            height: size,
            colorDark: '#000000',
            colorLight: backgroundColor,
            correctLevel: QRCode.CorrectLevel.H,
        });
        generator.clear();
        generator.makeCode(text);

        const qrMatrix = generator._oQRCode;
        if (!qrMatrix) {
            throw new Error('QR matrix unavailable');
        }

        const moduleCount = qrMatrix.moduleCount || qrMatrix.getModuleCount?.();
        if (!moduleCount) {
            throw new Error('QR module count undefined');
        }

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const outerRadius = rounded ? Math.min(size * OUTER_RADIUS_RATIO, size / 5) : 0;
        const beginRoundedPath = () => {
            ctx.beginPath();
            const r = outerRadius;
            ctx.moveTo(r, 0);
            ctx.lineTo(size - r, 0);
            ctx.quadraticCurveTo(size, 0, size, r);
            ctx.lineTo(size, size - r);
            ctx.quadraticCurveTo(size, size, size - r, size);
            ctx.lineTo(r, size);
            ctx.quadraticCurveTo(0, size, 0, size - r);
            ctx.lineTo(0, r);
            ctx.quadraticCurveTo(0, 0, r, 0);
            ctx.closePath();
        };

        if (rounded) {
            ctx.save();
            beginRoundedPath();
            ctx.fillStyle = backgroundColor;
            ctx.fill();
            ctx.clip();
        } else {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, size, size);
        }

        const tile = size / moduleCount;
        ctx.fillStyle = '#000000';
        for (let row = 0; row < moduleCount; row += 1) {
            for (let col = 0; col < moduleCount; col += 1) {
                if (!qrMatrix.isDark(row, col)) continue;
                const x = Math.round(col * tile);
                const y = Math.round(row * tile);
                const w = Math.ceil((col + 1) * tile) - Math.round(col * tile);
                const h = Math.ceil((row + 1) * tile) - Math.round(row * tile);
                ctx.fillRect(x, y, w, h);
            }
        }

        if (rounded) {
            ctx.restore();
        }

        return canvas;
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
    
    function addLogoToQR(canvas, backgroundColor = DEFAULT_BACKGROUND_COLOR) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        const logoMaxSize = Math.round(canvasSize * 0.35);
        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;

        const logoChoice = (useCustomLogo && useCustomLogo.checked && customLogoDataUrl)
            ? { primary: customLogoDataUrl, fallback: null }
            : (useNeuroLogo && useNeuroLogo.checked
                ? { primary: NEURO_LOGO_PATH, fallback: null }
                : { primary: DEFAULT_LOGO_PATH, fallback: DEFAULT_LOGO_FALLBACK });
        const logoToUse = logoChoice.primary;
        const logoFallback = logoChoice.fallback;

        const renderLogoCommon = (sourceWidth, sourceHeight, draw) => {
            const renderSize = Math.min(logoMaxSize, sourceWidth, sourceHeight);
            const logoRadius = renderSize / 2;
            const inset = Math.max(2, renderSize * 0.05);

            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
            ctx.fillStyle = backgroundColor;
            ctx.fill();
            ctx.clip();
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            draw(
                centerX - logoRadius + inset,
                centerY - logoRadius + inset,
                renderSize - inset * 2,
                renderSize - inset * 2,
            );
            ctx.restore();
        };

        const renderLogoFromImage = (img) => {
            const naturalW = img.naturalWidth || logoMaxSize;
            const naturalH = img.naturalHeight || logoMaxSize;
            renderLogoCommon(naturalW, naturalH, (x, y, w, h) => ctx.drawImage(img, x, y, w, h));
        };

        const renderLogoFromCanvas = (sourceCanvas) => {
            const w = sourceCanvas.width || logoMaxSize;
            const h = sourceCanvas.height || logoMaxSize;
            renderLogoCommon(w, h, (x, y, width, height) => ctx.drawImage(sourceCanvas, x, y, width, height));
        };

        const renderFallback = () => {
            const renderSize = Math.min(logoMaxSize, canvasSize * 0.28);
            const logoRadius = renderSize / 2;
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
            ctx.fillStyle = backgroundColor;
            ctx.fill();
            ctx.clip();
            ctx.fillStyle = 'black';
            ctx.font = `bold ${renderSize / 3}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('RS', centerX, centerY);
            ctx.restore();
        };

        const renderFromPdf = async (pdfUrl) => {
            if (!window.pdfjsLib) {
                throw new Error('PDF.js not available');
            }
            const pdf = await window.pdfjsLib.getDocument(pdfUrl).promise;
            const page = await pdf.getPage(1);
            const viewport = page.getViewport({ scale: 1 });
            const scale = logoMaxSize / Math.max(viewport.width, viewport.height);
            const scaledViewport = page.getViewport({ scale });
            const pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = scaledViewport.width;
            pdfCanvas.height = scaledViewport.height;
            const pdfCtx = pdfCanvas.getContext('2d');
            await page.render({ canvasContext: pdfCtx, viewport: scaledViewport }).promise;
            return pdfCanvas;
        };

        const tryRenderImage = (src, fallback) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => renderLogoFromImage(img);
            img.onerror = (e) => {
                console.error("Failed to load logo image:", e);
                if (fallback) {
                    tryRenderImage(fallback, null);
                } else {
                    renderFallback();
                }
            };
            img.src = src;
        };

        if (!logoToUse) {
            renderFallback();
            return;
        }

        const isPdfLogo = typeof logoToUse === 'string' && logoToUse.toLowerCase().endsWith('.pdf');
        if (isPdfLogo) {
            renderFromPdf(logoToUse)
                .then((pdfCanvas) => renderLogoFromCanvas(pdfCanvas))
                .catch((err) => {
                    console.error("Failed to render PDF logo:", err);
                    if (logoFallback) {
                        tryRenderImage(logoFallback, null);
                    } else {
                        renderFallback();
                    }
                });
            return;
        }

        tryRenderImage(logoToUse, logoFallback);
    }

    // Download QR Code
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentQRCanvas) {
                alert('Please generate a QR code first');
                return;
            }

            const format = qrFormatSelect.value;
            try {
                if (format === 'pdf') {
                    const pdfBlob = buildPdfFromCanvas(currentQRCanvas);
                    if (!pdfBlob) throw new Error('PDF generation failed');
                    const link = document.createElement('a');
                    link.download = 'qrcode.pdf';
                    link.href = URL.createObjectURL(pdfBlob);
                    link.click();
                    URL.revokeObjectURL(link.href);
                } else {
                    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
                    const dataUrl = currentQRCanvas.toDataURL(mimeType);
                    const link = document.createElement('a');
                    link.download = `qrcode.${format}`;
                    link.href = dataUrl;
                    link.click();
                }
            } catch (e) {
                alert("Download failed. A security or loading error occurred.");
                console.error("Download error:", e);
            }
        });
    }

    function buildPdfFromCanvas(canvas) {
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        const base64 = jpegDataUrl.split(',')[1];
        const imgBytes = base64ToUint8Array(base64);
        const width = canvas.width;
        const height = canvas.height;

        const header = '%PDF-1.4\n';
        const catalog = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
        const pages = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
        const page = `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Contents 4 0 R /Resources << /XObject << /Im0 5 0 R >> /ProcSet [/PDF /ImageC] >> >>
endobj
`;
        const contentStream = `q
${width} 0 0 ${height} 0 0 cm
/Im0 Do
Q
`;
        const content = `4 0 obj
<< /Length ${contentStream.length} >>
stream
${contentStream}endstream
endobj
`;
        const imageHeader = `5 0 obj
<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>
stream
`;
        const imageFooter = '\nendstream\nendobj\n';
        const xrefEntries = [];

        // Build xref offsets (correct absolute positions)
        const fullParts = [];
        let cursor = 0;
        const pushPart = (part) => {
            fullParts.push(part);
            cursor += part.length;
        };

        pushPart(header);
        const catalogOffset = cursor;
        pushPart(catalog);
        const pagesOffset = cursor;
        pushPart(pages);
        const pageOffset = cursor;
        pushPart(page);
        const contentOffset = cursor;
        pushPart(content);
        const imageOffset = cursor;
        pushPart(imageHeader);
        pushPart(imgBytes);
        pushPart(imageFooter);

        const xref = [];
        xref.push('xref\n');
        xref.push('0 6\n');
        xref.push('0000000000 65535 f \n');
        const pad = (n) => n.toString().padStart(10, '0');
        [catalogOffset, pagesOffset, pageOffset, contentOffset, imageOffset].forEach((offset) => {
            xref.push(`${pad(offset)} 00000 n \n`);
        });

        const trailer = `trailer
<< /Size 6 /Root 1 0 R >>
startxref
${cursor}
%%EOF`;

        const pdfParts = fullParts.concat(xref.join(''), trailer);
        const pdfBytes = concatToUint8Array(pdfParts);
        return new Blob([pdfBytes], { type: 'application/pdf' });
    }

    function base64ToUint8Array(base64) {
        const binary = atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i += 1) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function concatToUint8Array(chunks) {
        let total = 0;
        const normalized = chunks.map((chunk) => {
            if (typeof chunk === 'string') {
                const encoder = new TextEncoder();
                const encoded = encoder.encode(chunk);
                total += encoded.length;
                return encoded;
            }
            total += chunk.length;
            return chunk;
        });
        const result = new Uint8Array(total);
        let offset = 0;
        normalized.forEach((chunk) => {
            result.set(chunk, offset);
            offset += chunk.length;
        });
        return result;
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
        if (motionReduced) {
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

    initSquishyCircles();
    
    function initSquishyCircles() {
        const canvas = document.getElementById('squishy-canvas');
        if (!canvas || motionReduced) return;

        // Wait a bit for nav to load if needed
        const startAnimation = () => {
            const navCheck = document.querySelector('nav');
            if (!navCheck) {
                // Nav not loaded yet, wait and try again
                setTimeout(startAnimation, 100);
                return;
            }
            runSquishyCircles();
        };

        startAnimation();
    }

    function runSquishyCircles() {
        const canvas = document.getElementById('squishy-canvas');
        const ctx = canvas.getContext('2d');
        const circles = [];
        const colors = ['rgba(17,17,17,0.25)', 'rgba(232,144,190,0.35)', 'rgba(199,125,255,0.35)', 'rgba(154,140,152,0.3)'];
        const channelBlueprints = [
            { start: 0.2, width: 0.12 },
            { start: 0.62, width: 0.12 },
        ];
        let channels = [];
        const maxCircles = 20;
        const gravity = 0.05;
        const damping = 0.75;
        const slowSpawnInterval = 220;
        let slowSpawnTicker = 0;
        const obstacleSelectors = ['nav', '.hero-panel', '.panel', '.detail-card', '.qr-shell'];
        const navElement = document.querySelector('nav');
        const detailsSection = document.querySelector('.details');
        let width = window.innerWidth;
        let height = window.innerHeight;
        let obstacles = [];
        let navBottom = 0; // Will be calculated properly
        let gameActive = false;
        let bricks = [];
        let lockedBricksY = null; // Store canvas Y position
        let initialScrollY = 0; // Track scroll position when game starts
        const paddle = { width: 160, height: 16, x: 0, y: 0 };

        const updateChannels = () => {
            channels = channelBlueprints.map(({ start, width: ratio }) => ({
                min: start * width,
                max: (start + ratio) * width,
            }));
        };

        const updateNavBottom = () => {
            if (navElement) {
                const rect = navElement.getBoundingClientRect();
                navBottom = rect.bottom;
            } else {
                navBottom = 0;
            }
        };

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            updateChannels();
            updateNavBottom();
            updatePaddleMetrics();
            if (gameActive && bricks.length === 0) {
                createBricks();
            }
        };

        const updatePaddleMetrics = () => {
            paddle.width = Math.max(110, width * 0.18);
            paddle.height = 16;
            if (!gameActive) {
                paddle.y = height - 70;
            } else if (lockedBricksY !== null) {
                const rows = 3;
                const padding = 10;
                const brickHeight = 22;
                const totalBrickHeight = rows * (brickHeight + padding);
                // Position paddle much further down - about 250px below bricks
                const currentBrickY = lockedBricksY - window.scrollY;
                paddle.y = currentBrickY + totalBrickHeight + 250;
            }
            if (!Number.isFinite(paddle.x) || paddle.x === 0) {
                paddle.x = (width - paddle.width) / 2;
            }
            paddle.x = Math.max(0, Math.min(paddle.x, width - paddle.width));
        };

        const refreshObstacles = () => {
            updateNavBottom();
            obstacles = obstacleSelectors
                .map((selector) => Array.from(document.querySelectorAll(selector)))
                .flat()
                .filter(Boolean)
                .map((el) => {
                    const rect = el.getBoundingClientRect();
                    return {
                        left: rect.left,
                        right: rect.right,
                        top: rect.top,
                        bottom: rect.bottom,
                    };
                });
        };

        const spawnCircle = (forceSlow = false) => {
            // Update nav position before spawning
            updateNavBottom();
            
            const radius = 12 + Math.random() * 18;
            const useChannel = channels.length && (forceSlow || Math.random() < 0.65);
            const channel = useChannel ? channels[Math.floor(Math.random() * channels.length)] : null;
            const x = channel ? channel.min + Math.random() * (channel.max - channel.min) : Math.random() * width;
            const slow = forceSlow || Math.random() < 0.35;
            
            // Spawn at the very top of the viewport (just below nav bar)
            const spawnY = navBottom + radius + 5;
            
            return {
                x,
                y: spawnY,
                r: radius,
                vx: (Math.random() - 0.5) * (slow ? 0.4 : 0.8),
                vy: slow ? 0.15 + Math.random() * 0.3 : 0.6 + Math.random() * 1.1,
                color: colors[Math.floor(Math.random() * colors.length)],
                squish: 0,
                squishAxis: 'y',
                gravityFactor: slow ? 0.45 : 1,
                activated: false,
                bypassObstacles: Math.random() < 0.7, // 70% chance to bypass obstacles
            };
        };

        const createBricks = () => {
            const rows = 3;
            const cols = Math.min(6, Math.max(4, Math.floor(width / 140)));
            const padding = 10;
            const brickHeight = 22;
            
            // Lock the Y position in canvas coordinates when bricks are first created
            if (lockedBricksY === null) {
                initialScrollY = window.scrollY;
                if (detailsSection) {
                    const rect = detailsSection.getBoundingClientRect();
                    // Convert viewport position to canvas position
                    lockedBricksY = Math.max(navBottom + 120, rect.bottom + window.scrollY);
                } else {
                    lockedBricksY = navBottom + window.scrollY + 200;
                }
            }
            
            const offsetLeft = 30;
            const brickWidth = width - offsetLeft * 2 - (cols - 1) * padding;
            const actualWidth = brickWidth / cols;
            
            // Calculate current brick Y position accounting for scroll
            const currentBrickY = lockedBricksY - window.scrollY;
            
            bricks = [];
            for (let r = 0; r < rows; r += 1) {
                for (let c = 0; c < cols; c += 1) {
                    bricks.push({
                        x: offsetLeft + c * (actualWidth + padding),
                        y: currentBrickY + r * (brickHeight + padding),
                        width: actualWidth,
                        height: brickHeight,
                        alive: true,
                        color: colors[(r + c) % colors.length],
                    });
                }
            }
            
            updatePaddleMetrics();
        };

        const ensureCircles = () => {
            // Reduce spawn rate by 50% when game is not active
            const targetMax = gameActive ? maxCircles : Math.floor(maxCircles / 2);
            const spawnInterval = gameActive ? slowSpawnInterval : slowSpawnInterval * 2;
            
            if (circles.length < targetMax) {
                circles.push(spawnCircle());
            }
            slowSpawnTicker += 1;
            if (slowSpawnTicker >= spawnInterval) {
                if (circles.length < targetMax) {
                    circles.push(spawnCircle(true));
                }
                slowSpawnTicker = 0;
            }
        };

        const updateCircle = (circle) => {
            circle.prevY = circle.y;
            circle.vy += gravity * circle.gravityFactor;
            circle.x += circle.vx;
            circle.y += circle.vy;

            // Wall collisions - only squish if moving fast enough
            if (circle.x - circle.r <= 0) {
                circle.x = circle.r;
                const impactSpeed = Math.abs(circle.vx);
                circle.vx *= -damping;
                if (impactSpeed > 1.5) {
                    circle.squish = Math.min(0.4, impactSpeed * 0.1);
                    circle.squishAxis = 'x';
                }
            } else if (circle.x + circle.r >= width) {
                circle.x = width - circle.r;
                const impactSpeed = Math.abs(circle.vx);
                circle.vx *= -damping;
                if (impactSpeed > 1.5) {
                    circle.squish = Math.min(0.4, impactSpeed * 0.1);
                    circle.squishAxis = 'x';
                }
            }

            const circleBottom = circle.y + circle.r;
            const circleTop = circle.y - circle.r;
            const circleLeft = circle.x - circle.r;
            const circleRight = circle.x + circle.r;
            const isInsideChannel = channels.some((channel) => circle.x >= channel.min && circle.x <= channel.max);

            // Nav collision - keep dots from going above the nav, only squish on impact
            if (circle.y - circle.r <= navBottom) {
                circle.y = navBottom + circle.r;
                const impactSpeed = Math.abs(circle.vy);
                circle.vy = Math.abs(circle.vy) * damping;
                if (impactSpeed > 2) {
                    circle.squish = Math.min(0.45, impactSpeed * 0.12);
                    circle.squishAxis = 'y';
                }
                if (channels.length) {
                    let attempt = 0;
                    while (attempt < 3 && !channels.some((channel) => circle.x >= channel.min && circle.x <= channel.max)) {
                        const newChannel = channels[Math.floor(Math.random() * channels.length)];
                        circle.x = newChannel.min + Math.random() * (newChannel.max - newChannel.min);
                        attempt += 1;
                    }
                }
            }

            // Obstacle collisions - with bypass capability and impact-based squishing
            for (const obstacle of obstacles) {
                // If circle is set to bypass obstacles and is in a channel, skip most obstacles
                const shouldBypass = circle.bypassObstacles && isInsideChannel && obstacle.top > navBottom + 60;
                if (shouldBypass) {
                    continue;
                }
                
                if (
                    circleRight > obstacle.left &&
                    circleLeft < obstacle.right &&
                    circleBottom > obstacle.top &&
                    circleTop < obstacle.bottom
                ) {
                    const overlapTop = circleBottom - obstacle.top;
                    const overlapBottom = obstacle.bottom - circleTop;
                    const overlapLeft = circleRight - obstacle.left;
                    const overlapRight = obstacle.right - circleLeft;
                    const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

                    if (minOverlap === overlapTop) {
                        circle.y = obstacle.top - circle.r;
                        const impactSpeed = Math.abs(circle.vy);
                        circle.vy = -Math.abs(circle.vy) * damping;
                        if (impactSpeed > 2.5) {
                            circle.squish = Math.min(0.5, impactSpeed * 0.13);
                            circle.squishAxis = 'y';
                        }
                    } else if (minOverlap === overlapBottom) {
                        circle.y = obstacle.bottom + circle.r;
                        const impactSpeed = Math.abs(circle.vy);
                        circle.vy = Math.abs(circle.vy) * damping;
                        if (impactSpeed > 2) {
                            circle.squish = Math.min(0.4, impactSpeed * 0.1);
                            circle.squishAxis = 'y';
                        }
                    } else if (minOverlap === overlapLeft) {
                        circle.x = obstacle.left - circle.r;
                        const impactSpeed = Math.abs(circle.vx);
                        circle.vx = -Math.abs(circle.vx) * damping;
                        if (impactSpeed > 1.8) {
                            circle.squish = Math.min(0.4, impactSpeed * 0.12);
                            circle.squishAxis = 'x';
                        }
                    } else {
                        circle.x = obstacle.right + circle.r;
                        const impactSpeed = Math.abs(circle.vx);
                        circle.vx = Math.abs(circle.vx) * damping;
                        if (impactSpeed > 1.8) {
                            circle.squish = Math.min(0.4, impactSpeed * 0.12);
                            circle.squishAxis = 'x';
                        }
                    }

                    circle.vx += (Math.random() - 0.5) * 0.15;
                }
            }

            // Game mode collisions
            if (gameActive) {
                // Paddle collision with speed boost
                if (
                    circleBottom >= paddle.y &&
                    circleTop <= paddle.y + paddle.height &&
                    circle.x >= paddle.x &&
                    circle.x <= paddle.x + paddle.width &&
                    circle.vy > 0
                ) {
                    circle.y = paddle.y - circle.r;
                    const impactSpeed = Math.abs(circle.vy);
                    // Speed amplifier: multiply velocity by 1.15 on each paddle hit
                    circle.vy = -Math.abs(circle.vy) * 0.9 * 1.15;
                    circle.vx *= 1.15; // Also amplify horizontal velocity
                    const offset = (circle.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    circle.vx += offset * 0.8;
                    if (impactSpeed > 1.5) {
                        circle.squish = Math.min(0.5, impactSpeed * 0.15);
                        circle.squishAxis = 'y';
                    }
                    circle.activated = true;
                }

                // Brick collisions (only for activated circles)
                for (const brick of bricks) {
                    if (!brick.alive || !circle.activated) continue;
                    
                    if (
                        circleRight > brick.x &&
                        circleLeft < brick.x + brick.width &&
                        circleBottom > brick.y &&
                        circleTop < brick.y + brick.height
                    ) {
                        brick.alive = false;
                        const overlapTop = circleBottom - brick.y;
                        const overlapBottom = brick.y + brick.height - circleTop;
                        const overlapLeft = circleRight - brick.x;
                        const overlapRight = brick.x + brick.width - circleLeft;
                        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

                        if (minOverlap === overlapTop) {
                            circle.y = brick.y - circle.r;
                            const impactSpeed = Math.abs(circle.vy);
                            circle.vy = -Math.abs(circle.vy) * damping;
                            if (impactSpeed > 2) {
                                circle.squish = Math.min(0.45, impactSpeed * 0.12);
                                circle.squishAxis = 'y';
                            }
                        } else if (minOverlap === overlapBottom) {
                            circle.y = brick.y + brick.height + circle.r;
                            const impactSpeed = Math.abs(circle.vy);
                            circle.vy = Math.abs(circle.vy) * damping;
                            if (impactSpeed > 2) {
                                circle.squish = Math.min(0.45, impactSpeed * 0.12);
                                circle.squishAxis = 'y';
                            }
                        } else if (minOverlap === overlapLeft) {
                            circle.x = brick.x - circle.r;
                            const impactSpeed = Math.abs(circle.vx);
                            circle.vx = -Math.abs(circle.vx) * damping;
                            if (impactSpeed > 1.5) {
                                circle.squish = Math.min(0.4, impactSpeed * 0.12);
                                circle.squishAxis = 'x';
                            }
                        } else {
                            circle.x = brick.x + brick.width + circle.r;
                            const impactSpeed = Math.abs(circle.vx);
                            circle.vx = Math.abs(circle.vx) * damping;
                            if (impactSpeed > 1.5) {
                                circle.squish = Math.min(0.4, impactSpeed * 0.12);
                                circle.squishAxis = 'x';
                            }
                        }
                        break;
                    }
                }

                // Regenerate bricks when all destroyed
                if (bricks.length && bricks.every((brick) => !brick.alive)) {
                    createBricks();
                }
            }

            // Squish decay
            if (circle.squish > 0) {
                circle.squish = Math.max(0, circle.squish - 0.02);
            }

            // Remove circles that fall off screen
            const fallLimit = height + 400;
            if (circle.y - circle.r > fallLimit) {
                const index = circles.indexOf(circle);
                if (index > -1) {
                    circles.splice(index, 1);
                }
            }
        };

        const drawCircle = (circle) => {
            ctx.save();
            ctx.translate(circle.x, circle.y);
            const squishFactor = circle.squish;
            const scaleX = circle.squishAxis === 'x' ? 1 + squishFactor : 1 - squishFactor * 0.8;
            const scaleY = circle.squishAxis === 'y' ? 1 + squishFactor : 1 - squishFactor * 0.8;
            ctx.scale(scaleX, scaleY);
            ctx.beginPath();
            ctx.fillStyle = circle.color;
            ctx.arc(0, 0, circle.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        const drawBricks = () => {
            bricks.forEach((brick) => {
                if (!brick.alive) return;
                ctx.fillStyle = brick.color;
                ctx.globalAlpha = 0.85;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                ctx.globalAlpha = 1;
            });
        };

        const drawPaddle = () => {
            ctx.fillStyle = '#111111';
            ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
        };

        const setPaddlePosition = (clientX) => {
            const rect = canvas.getBoundingClientRect();
            const relativeX = clientX - rect.left;
            paddle.x = Math.max(0, Math.min(relativeX - paddle.width / 2, width - paddle.width));
        };

        const handlePointer = (event) => {
            if (!gameActive) return;
            if (event.touches && event.touches.length) {
                setPaddlePosition(event.touches[0].clientX);
            } else {
                setPaddlePosition(event.clientX);
            }
        };

        window.addEventListener('pointermove', handlePointer, { passive: true });
        window.addEventListener('touchmove', handlePointer, { passive: true });

        const startPlayMode = () => {
            if (gameActive) return;
            gameActive = true;
            createBricks();
            if (playToggle) {
                playToggle.classList.add('active');
                playToggle.textContent = 'Stop Brick Break';
            }
        };

        const stopPlayMode = () => {
            if (!gameActive) return;
            gameActive = false;
            bricks = [];
            lockedBricksY = null; // Reset the locked position
            updatePaddleMetrics();
            if (playToggle) {
                playToggle.classList.remove('active');
                playToggle.textContent = 'Play Brick Break';
            }
        };

        if (playToggle) {
            playToggle.addEventListener('click', () => {
                if (gameActive) {
                    stopPlayMode();
                } else {
                    startPlayMode();
                }
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            refreshObstacles();
            ensureCircles();
            
            // Update brick positions if game is active and scrolling
            if (gameActive && lockedBricksY !== null && bricks.length > 0) {
                const currentBrickY = lockedBricksY - window.scrollY;
                const rows = 3;
                const padding = 10;
                const brickHeight = 22;
                
                bricks.forEach((brick, index) => {
                    const row = Math.floor(index / Math.min(6, Math.max(4, Math.floor(width / 140))));
                    brick.y = currentBrickY + row * (brickHeight + padding);
                });
                
                // Update paddle position based on current brick position - 250px below
                const totalBrickHeight = rows * (brickHeight + padding);
                paddle.y = currentBrickY + totalBrickHeight + 250;
            }
            
            circles.forEach((circle) => {
                updateCircle(circle);
                drawCircle(circle);
            });
            if (gameActive) {
                drawBricks();
                drawPaddle();
            }
            requestAnimationFrame(animate);
        };

        resizeCanvas();
        refreshObstacles();
        updateNavBottom(); // Initialize navBottom
        window.addEventListener('resize', () => {
            resizeCanvas();
            refreshObstacles();
        });
        animate();
    }
});
