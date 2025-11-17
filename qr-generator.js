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
    const playToggle = document.getElementById('play-toggle');
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const motionReduced = motionMediaQuery.matches;
    
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
                    rerenderIfNeeded();
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
    
    function addLogoToQR(canvas) {
        const ctx = canvas.getContext('2d');
        const canvasSize = canvas.width;
        
        const logoTargetSize = Math.round(canvasSize * 0.35); 
        const logoRadius = logoTargetSize / 2;

        const centerX = canvasSize / 2;
        const centerY = canvasSize / 2;
        const logoX = centerX - logoRadius;
        const logoY = centerY - logoRadius;
        
        // Create the circular cutout
        ctx.save(); 
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'white'; 
        ctx.fill(); 
        ctx.closePath();
        ctx.restore(); 

        // Determine which logo to use
        let logoToUse = null;

        if (useCustomLogo && useCustomLogo.checked && customLogoDataUrl) {
            logoToUse = customLogoDataUrl;
        } else {
            logoToUse = DEFAULT_LOGO_PATH;
        }

        // Draw the Logo Image inside the cutout
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
                ctx.font = `bold ${logoTargetSize / 4}px Arial`;
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
        let navBottom = navElement ? navElement.getBoundingClientRect().bottom : 0;
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
                navBottom = navElement.getBoundingClientRect().bottom;
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
            const radius = 12 + Math.random() * 18;
            const useChannel = channels.length && (forceSlow || Math.random() < 0.65);
            const channel = useChannel ? channels[Math.floor(Math.random() * channels.length)] : null;
            const x = channel ? channel.min + Math.random() * (channel.max - channel.min) : Math.random() * width;
            const slow = forceSlow || Math.random() < 0.35;
            
            // Spawn at absolute top position (accounting for scroll)
            const spawnY = navBottom + window.scrollY - radius - Math.random() * 10;
            
            return {
                x,
                y: spawnY - window.scrollY, // Convert to canvas coordinates
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
            if (circles.length < maxCircles) {
                circles.push(spawnCircle());
            }
            slowSpawnTicker += 1;
            if (slowSpawnTicker >= slowSpawnInterval) {
                circles.push(spawnCircle(true));
                slowSpawnTicker = 0;
            }
        };

        const updateCircle = (circle) => {
            circle.prevY = circle.y;
            circle.vy += gravity * circle.gravityFactor;
            circle.x += circle.vx;
            circle.y += circle.vy;

            // Wall collisions
            if (circle.x - circle.r <= 0) {
                circle.x = circle.r;
                circle.vx *= -damping;
                circle.squish = 0.3;
                circle.squishAxis = 'x';
            } else if (circle.x + circle.r >= width) {
                circle.x = width - circle.r;
                circle.vx *= -damping;
                circle.squish = 0.3;
                circle.squishAxis = 'x';
            }

            const circleBottom = circle.y + circle.r;
            const circleTop = circle.y - circle.r;
            const circleLeft = circle.x - circle.r;
            const circleRight = circle.x + circle.r;
            const isInsideChannel = channels.some((channel) => circle.x >= channel.min && circle.x <= channel.max);

            // Nav collision - account for scroll position
            const currentNavBottom = navBottom + window.scrollY - window.scrollY;
            if (circle.y - circle.r <= currentNavBottom) {
                circle.y = currentNavBottom + circle.r;
                circle.vy = Math.abs(circle.vy) * damping;
                circle.squish = 0.35;
                circle.squishAxis = 'y';
                if (channels.length) {
                    let attempt = 0;
                    while (attempt < 3 && !channels.some((channel) => circle.x >= channel.min && circle.x <= channel.max)) {
                        const newChannel = channels[Math.floor(Math.random() * channels.length)];
                        circle.x = newChannel.min + Math.random() * (newChannel.max - newChannel.min);
                        attempt += 1;
                    }
                }
            }

            // Obstacle collisions - with bypass capability
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
                        circle.vy = -Math.abs(circle.vy) * damping;
                        circle.squish = 0.45;
                        circle.squishAxis = 'y';
                    } else if (minOverlap === overlapBottom) {
                        circle.y = obstacle.bottom + circle.r;
                        circle.vy = Math.abs(circle.vy) * damping;
                        circle.squish = 0.35;
                        circle.squishAxis = 'y';
                    } else if (minOverlap === overlapLeft) {
                        circle.x = obstacle.left - circle.r;
                        circle.vx = -Math.abs(circle.vx) * damping;
                        circle.squish = 0.35;
                        circle.squishAxis = 'x';
                    } else {
                        circle.x = obstacle.right + circle.r;
                        circle.vx = Math.abs(circle.vx) * damping;
                        circle.squish = 0.35;
                        circle.squishAxis = 'x';
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
                    // Speed amplifier: multiply velocity by 1.15 on each paddle hit
                    circle.vy = -Math.abs(circle.vy) * 0.9 * 1.15;
                    circle.vx *= 1.15; // Also amplify horizontal velocity
                    const offset = (circle.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                    circle.vx += offset * 0.8;
                    circle.squish = 0.4;
                    circle.squishAxis = 'y';
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
                            circle.vy = -Math.abs(circle.vy) * damping;
                            circle.squish = 0.35;
                            circle.squishAxis = 'y';
                        } else if (minOverlap === overlapBottom) {
                            circle.y = brick.y + brick.height + circle.r;
                            circle.vy = Math.abs(circle.vy) * damping;
                            circle.squish = 0.35;
                            circle.squishAxis = 'y';
                        } else if (minOverlap === overlapLeft) {
                            circle.x = brick.x - circle.r;
                            circle.vx = -Math.abs(circle.vx) * damping;
                            circle.squish = 0.35;
                            circle.squishAxis = 'x';
                        } else {
                            circle.x = brick.x + brick.width + circle.r;
                            circle.vx = Math.abs(circle.vx) * damping;
                            circle.squish = 0.35;
                            circle.squishAxis = 'x';
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
        window.addEventListener('resize', () => {
            resizeCanvas();
            refreshObstacles();
        });
        animate();
    }
});