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
    const gameArea = document.getElementById('game-area');
    const gameCanvas = document.getElementById('brickbreak-canvas');
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
    initBrickBreak();
    function initSquishyCircles() {
        const canvas = document.getElementById('squishy-canvas');
        if (!canvas || motionReduced) return;

        const ctx = canvas.getContext('2d');
        const circles = [];
        const colors = ['rgba(17,17,17,0.25)', 'rgba(232,144,190,0.35)', 'rgba(199,125,255,0.35)', 'rgba(154,140,152,0.3)'];
        const maxCircles = 12;
        const gravity = 0.05;
        const damping = 0.75;
        const obstacleSelectors = ['nav', '.hero-panel', '.panel', '.detail-card', '.qr-shell'];
        let width = window.innerWidth;
        let height = window.innerHeight;
        let obstacles = [];

        const resizeCanvas = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const refreshObstacles = () => {
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

        const spawnCircle = () => {
            const radius = 12 + Math.random() * 18;
            return {
                x: Math.random() * width,
                y: -radius,
                r: radius,
                vx: (Math.random() - 0.5) * 0.6,
                vy: Math.random() * 1,
                color: colors[Math.floor(Math.random() * colors.length)],
                prevY: -radius,
            };
        };

        const ensureCircles = () => {
            if (circles.length < maxCircles) {
                circles.push(spawnCircle());
            }
        };

        const updateCircle = (circle) => {
            circle.prevY = circle.y;
            circle.vy += gravity;
            circle.x += circle.vx;
            circle.y += circle.vy;

            // Bounce off screen edges
            if (circle.x - circle.r <= 0) {
                circle.x = circle.r;
                circle.vx *= -damping;
            } else if (circle.x + circle.r >= width) {
                circle.x = width - circle.r;
                circle.vx *= -damping;
            }

            // Collisions with obstacles
            const circleBottom = circle.y + circle.r;
            const circleTop = circle.y - circle.r;
            const circleLeft = circle.x - circle.r;
            const circleRight = circle.x + circle.r;

            for (const obstacle of obstacles) {
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
                    } else if (minOverlap === overlapBottom) {
                        circle.y = obstacle.bottom + circle.r;
                        circle.vy = Math.abs(circle.vy) * damping;
                    } else if (minOverlap === overlapLeft) {
                        circle.x = obstacle.left - circle.r;
                        circle.vx = -Math.abs(circle.vx) * damping;
                    } else {
                        circle.x = obstacle.right + circle.r;
                        circle.vx = Math.abs(circle.vx) * damping;
                    }

                    circle.vx += (Math.random() - 0.5) * 0.15;
                }
            }

            // Remove if far below viewport
            if (circle.y - circle.r > height + 200) {
                const index = circles.indexOf(circle);
                if (index > -1) {
                    circles.splice(index, 1);
                }
            }
        };

        const drawCircle = (circle) => {
            ctx.beginPath();
            ctx.fillStyle = circle.color;
            ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            refreshObstacles();
            ensureCircles();
            circles.forEach((circle) => {
                updateCircle(circle);
                drawCircle(circle);
            });
            requestAnimationFrame(animate);
        };

        resizeCanvas();
        refreshObstacles();
        window.addEventListener('resize', () => {
            resizeCanvas();
            refreshObstacles();
        });
        window.addEventListener('scroll', refreshObstacles, { passive: true });
        animate();
    }

    function initBrickBreak() {
        if (!playToggle || !gameArea || !gameCanvas) return;
        let instance = null;

        const stopGame = () => {
            gameArea.classList.remove('active');
            playToggle.textContent = 'Play Brick Break';
            instance?.stop();
        };

        const startGame = () => {
            gameArea.classList.add('active');
            playToggle.textContent = 'Stop Game';
            if (!instance) {
                instance = new BrickBreakGame(gameCanvas);
            }
            instance.start();
        };

        playToggle.addEventListener('click', () => {
            if (gameArea.classList.contains('active')) {
                stopGame();
            } else {
                startGame();
            }
        });
    }

    class BrickBreakGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.running = false;
            this.colors = ['#111111', '#e890be', '#c77dff', '#ffb4a2', '#9a8c98'];
            this.gravity = 0.12;
            this.maxBalls = 5;
            this.balls = [];
            this.bricks = [];
            this.spawnTimer = 0;
            this.paddleWidth = 120;
            this.paddleHeight = 14;
            this.paddleX = 0;
            this.paddleY = 0;
            this.frameId = null;

            this.animate = this.animate.bind(this);
            this.handlePointer = this.handlePointer.bind(this);
            this.handleResize = this.handleResize.bind(this);
        }

        start() {
            if (this.running) return;
            this.running = true;
            this.resize();
            this.reset();
            this.attachEvents();
            this.frameId = requestAnimationFrame(this.animate);
        }

        stop() {
            if (!this.running) return;
            cancelAnimationFrame(this.frameId);
            this.detachEvents();
            this.running = false;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        attachEvents() {
            this.canvas.addEventListener('pointermove', this.handlePointer);
            this.canvas.addEventListener('touchmove', this.handlePointer, { passive: true });
            window.addEventListener('resize', this.handleResize);
        }

        detachEvents() {
            this.canvas.removeEventListener('pointermove', this.handlePointer);
            this.canvas.removeEventListener('touchmove', this.handlePointer);
            window.removeEventListener('resize', this.handleResize);
        }

        handlePointer(event) {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const x = clientX - rect.left;
            this.paddleX = x - this.paddleWidth / 2;
            this.paddleX = Math.max(0, Math.min(this.paddleX, this.canvas.width - this.paddleWidth));
        }

        handleResize() {
            this.resize();
            this.createBricks();
        }

        resize() {
            const parent = this.canvas.parentElement;
            if (!parent) return;
            const parentWidth = parent.clientWidth || this.canvas.width || 600;
            const parentHeight = parent.clientHeight || 440;
            this.canvas.width = parentWidth;
            this.canvas.height = Math.min(520, Math.max(320, parentHeight - 16));
            this.paddleWidth = Math.max(90, this.canvas.width * 0.18);
            this.paddleY = this.canvas.height - 36;
            this.paddleX = (this.canvas.width - this.paddleWidth) / 2;
        }

        reset() {
            this.balls = [];
            for (let i = 0; i < 3; i += 1) {
                this.balls.push(this.spawnBall());
            }
            this.createBricks();
        }

        spawnBall() {
            const radius = 10 + Math.random() * 8;
            return {
                x: Math.random() * this.canvas.width,
                y: -radius,
                vx: (Math.random() - 0.5) * 1.5,
                vy: 1 + Math.random() * 1.5,
                radius,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
            };
        }

        createBricks() {
            const rows = 3;
            const cols = Math.min(6, Math.max(4, Math.floor(this.canvas.width / 120)));
            const padding = 10;
            const offsetTop = 36;
            const offsetLeft = 20;
            const brickWidth = (this.canvas.width - offsetLeft * 2 - (cols - 1) * padding) / cols;
            const brickHeight = 22;
            this.bricks = [];

            for (let r = 0; r < rows; r += 1) {
                for (let c = 0; c < cols; c += 1) {
                    this.bricks.push({
                        x: offsetLeft + c * (brickWidth + padding),
                        y: offsetTop + r * (brickHeight + padding),
                        width: brickWidth,
                        height: brickHeight,
                        alive: true,
                        color: this.colors[(r + c) % this.colors.length],
                    });
                }
            }
        }

        updateBalls() {
            if (!this.running) return;

            if (this.balls.length < this.maxBalls && this.spawnTimer <= 0) {
                this.balls.push(this.spawnBall());
                this.spawnTimer = 100;
            } else {
                this.spawnTimer -= 1;
            }

            this.balls.forEach((ball, index) => {
                ball.vy += this.gravity;
                ball.x += ball.vx;
                ball.y += ball.vy;

                if (ball.x - ball.radius <= 0) {
                    ball.x = ball.radius;
                    ball.vx = Math.abs(ball.vx) * 0.9;
                } else if (ball.x + ball.radius >= this.canvas.width) {
                    ball.x = this.canvas.width - ball.radius;
                    ball.vx = -Math.abs(ball.vx) * 0.9;
                }

                if (ball.y - ball.radius <= 0) {
                    ball.y = ball.radius;
                    ball.vy = Math.abs(ball.vy);
                }

                if (
                    ball.y + ball.radius >= this.paddleY &&
                    ball.y - ball.radius <= this.paddleY + this.paddleHeight &&
                    ball.x >= this.paddleX &&
                    ball.x <= this.paddleX + this.paddleWidth &&
                    ball.vy > 0
                ) {
                    ball.y = this.paddleY - ball.radius;
                    ball.vy = -Math.abs(ball.vy) * 0.95;
                    const offset = (ball.x - (this.paddleX + this.paddleWidth / 2)) / (this.paddleWidth / 2);
                    ball.vx += offset * 1.1;
                }

                this.bricks.forEach((brick) => {
                    if (!brick.alive) return;
                    if (
                        ball.x + ball.radius > brick.x &&
                        ball.x - ball.radius < brick.x + brick.width &&
                        ball.y + ball.radius > brick.y &&
                        ball.y - ball.radius < brick.y + brick.height
                    ) {
                        brick.alive = false;
                        const overlapTop = Math.abs(ball.y + ball.radius - brick.y);
                        const overlapBottom = Math.abs(brick.y + brick.height - (ball.y - ball.radius));
                        const overlapLeft = Math.abs(ball.x + ball.radius - brick.x);
                        const overlapRight = Math.abs(brick.x + brick.width - (ball.x - ball.radius));
                        const minOverlap = Math.min(overlapTop, overlapBottom, overlapLeft, overlapRight);

                        if (minOverlap === overlapTop || minOverlap === overlapBottom) {
                            ball.vy *= -1;
                        } else {
                            ball.vx *= -1;
                        }
                    }
                });

                if (ball.y - ball.radius > this.canvas.height + 60) {
                    this.balls[index] = this.spawnBall();
                }
            });
        }

        drawScene() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawBricks();
            this.drawPaddle();
            this.drawBalls();
        }

        drawBricks() {
            this.bricks.forEach((brick) => {
                if (!brick.alive) return;
                this.ctx.fillStyle = brick.color;
                this.ctx.globalAlpha = 0.9;
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
                this.ctx.globalAlpha = 1;
            });
        }

        drawPaddle() {
            this.ctx.fillStyle = '#111111';
            this.ctx.fillRect(this.paddleX, this.paddleY, this.paddleWidth, this.paddleHeight);
        }

        drawBalls() {
            this.balls.forEach((ball) => {
                this.ctx.beginPath();
                this.ctx.fillStyle = ball.color;
                this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
                this.ctx.fill();
            });
        }

        animate() {
            if (!this.running) return;
            this.updateBalls();
            this.drawScene();
            this.frameId = requestAnimationFrame(this.animate);
        }
    }
});
