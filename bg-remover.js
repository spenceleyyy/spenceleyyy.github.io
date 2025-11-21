document.addEventListener('DOMContentLoaded', () => {
    const pacmanCanvas = document.getElementById('pacman-canvas');
    const pacmanStartBtn = document.getElementById('pacman-start');
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

    class PacmanGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas?.getContext('2d');
            if (!this.ctx) return;
            // Hardcoded, evenly spaced maze to guarantee clear paths.
            this.map = [
                '####################',
                '#oooooooo..oooooooo#',
                '#o####o##..##o####o#',
                '#o#..#o#....#o#..#o#',
                '#o####o#....#o####o#',
                '#oooooooo..oooooooo#',
                '#o####o######o####o#',
                '#o....o#....#o....o#',
                '#o####o#....#o####o#',
                '#oooooo......oooooo#',
                '#o####o######o####o#',
                '#o....o#....#o....o#',
                '#o####o#....#o####o#',
                '#oooooooo..oooooooo#',
                '#o####o##..##o####o#',
                '#o#..#o#....#o#..#o#',
                '#o####o#....#o####o#',
                '#oooooooo..oooooooo#',
                '####################'
            ];

            this.tileSize = 22;
            this.lastTime = performance.now();
            this.offsetX = 0;
            this.offsetY = 0;
            this.pacman = { x: 10.5, y: 17.5, dir: { x: 0, y: -1 }, pending: { x: 0, y: 0 }, speed: 5.2 };
            this.ghosts = [
                { x: 9.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#e890be', mode: 'chase' },
                { x: 10.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#9ad7ff', mode: 'chase' },
                { x: 8.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#ffce76', mode: 'chase' },
                { x: 9.5, y: 9.5, dir: { x: 0, y: 1 }, color: '#73ffa0', mode: 'chase' }
            ];
            this.pellets = new Set();
            this.powerTimer = 0;
            this.running = false;
            this.frame = null;
            this.resize();
            this.seedPellets();
            this.bindControls();
            this.renderStatic();
            window.addEventListener('resize', () => this.resize());
        }

        start() {
            this.resetRound();
            this.running = true;
            this.lastTime = performance.now();
            if (this.frame) cancelAnimationFrame(this.frame);
            this.frame = requestAnimationFrame((t) => this.loop(t));
        }

        resetRound() {
            this.pacman = { x: 10.5, y: 17.5, dir: { x: 0, y: -1 }, pending: { x: 0, y: 0 }, speed: 5.2 };
            this.ghosts = [
                { x: 9.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#e890be', mode: 'chase' },
                { x: 10.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#9ad7ff', mode: 'chase' },
                { x: 8.5, y: 8.5, dir: { x: 0, y: 1 }, color: '#ffce76', mode: 'chase' },
                { x: 9.5, y: 9.5, dir: { x: 0, y: 1 }, color: '#73ffa0', mode: 'chase' }
            ];
            this.powerTimer = 0;
            this.seedPellets();
            this.renderStatic();
        }

        renderStatic() {
            this.drawBoard();
            this.drawEntities(performance.now());
        }

        bindControls() {
            const handleKeys = (e) => {
                const key = (e.key || '').toLowerCase();
                const isArrowKey = ['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key);
                const isWasd = ['w', 'a', 's', 'd'].includes(key);
                if (!isArrowKey && !isWasd) return;
                e.preventDefault();
                e.stopPropagation();
                this.running = true;
                if (key === 'arrowup' || key === 'w') this.pacman.pending = { x: 0, y: -1 };
                if (key === 'arrowdown' || key === 's') this.pacman.pending = { x: 0, y: 1 };
                if (key === 'arrowleft' || key === 'a') this.pacman.pending = { x: -1, y: 0 };
                if (key === 'arrowright' || key === 'd') this.pacman.pending = { x: 1, y: 0 };
            };
            window.addEventListener('keydown', handleKeys, { passive: false, capture: true });
            document.addEventListener('keydown', handleKeys, { passive: false, capture: true });
        }

        resize() {
            if (!this.canvas) return;
            const cols = this.map[0].length;
            const rows = this.map.length;
            const scaleX = window.innerWidth / cols;
            const scaleY = window.innerHeight / rows;
            this.tileSize = Math.max(20, Math.max(scaleX, scaleY));
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            const mapWidth = cols * this.tileSize;
            const mapHeight = rows * this.tileSize;
            this.offsetX = Math.min(0, (this.canvas.width - mapWidth) / 2);
            this.offsetY = Math.min(0, (this.canvas.height - mapHeight) / 2);
        }

        seedPellets() {
            this.pellets.clear();
            this.map.forEach((row, y) => {
                row.split('').forEach((cell, x) => {
                    if (cell === '.' || cell === 'o') {
                        this.pellets.add(`${x},${y}`);
                    }
                });
            });
        }

        isWall(x, y) {
            const row = this.map[Math.floor(y)];
            if (!row) return true;
            return row[Math.floor(x)] === '#';
        }

        canMove(x, y, dir) {
            const nextX = x + dir.x * 0.35;
            const nextY = y + dir.y * 0.35;
            return !this.isWall(nextX, nextY);
        }

        tryTurn() {
            const { pacman } = this;
            const cx = Math.round(pacman.x);
            const cy = Math.round(pacman.y);
            const aligned = Math.abs(pacman.x - cx) < 0.3 && Math.abs(pacman.y - cy) < 0.3;
            if (!aligned) return;
            if (this.canMove(cx, cy, pacman.pending)) {
                pacman.dir = { ...pacman.pending };
                pacman.x = cx;
                pacman.y = cy;
            }
        }

        wrapPosition(entity) {
            if (entity.x < 0) entity.x = this.map[0].length - 1;
            if (entity.x > this.map[0].length - 1) entity.x = 0;
        }

        updatePacman(dt) {
            this.tryTurn();
            const { pacman } = this;
            const speed = pacman.speed * dt;
            const nextX = pacman.x + pacman.dir.x * speed;
            const nextY = pacman.y + pacman.dir.y * speed;
            if (!this.isWall(nextX, nextY)) {
                pacman.x = nextX;
                pacman.y = nextY;
                // Snap to corridor center (half-tiles) to avoid drift.
                if (pacman.dir.x !== 0) {
                    pacman.y = Math.round(pacman.y * 2) / 2;
                } else if (pacman.dir.y !== 0) {
                    pacman.x = Math.round(pacman.x * 2) / 2;
                }
            }
            this.wrapPosition(pacman);
            this.eatPellets();
        }

        eatPellets() {
            const key = `${Math.round(this.pacman.x)},${Math.round(this.pacman.y)}`;
            if (this.pellets.has(key)) {
                this.pellets.delete(key);
                if (this.map[Math.round(this.pacman.y)][Math.round(this.pacman.x)] === 'o') {
                    this.powerTimer = 7;
                }
            }
        }

        chooseDirection(ghost) {
            const dirs = [
                { x: 1, y: 0 },
                { x: -1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: -1 }
            ];
            const opposite = { x: -ghost.dir.x, y: -ghost.dir.y };
            const target = this.powerTimer > 0 ? { x: 1, y: 1 } : this.pacman;
            const options = dirs
                .filter((d) => d.x !== opposite.x || d.y !== opposite.y)
                .filter((d) => !this.isWall(ghost.x + d.x * 0.8, ghost.y + d.y * 0.8))
                .map((d) => {
                    const tx = ghost.x + d.x;
                    const ty = ghost.y + d.y;
                    const dist = Math.hypot(tx - target.x, ty - target.y);
                    return { d, dist };
                })
                .sort((a, b) => a.dist - b.dist);
            if (options.length === 0) return ghost.dir;
            if (this.powerTimer > 0) {
                return options.pop().d;
            }
            return options[0].d;
        }

        updateGhosts(dt) {
            this.ghosts.forEach((ghost) => {
                const gx = Math.round(ghost.x);
                const gy = Math.round(ghost.y);
                const aligned = Math.abs(ghost.x - gx) < 0.1 && Math.abs(ghost.y - gy) < 0.1;
                if (aligned) {
                    ghost.dir = this.chooseDirection(ghost);
                    ghost.x = gx;
                    ghost.y = gy;
                }
                const speed = (this.powerTimer > 0 ? 3.6 : 4.4) * dt;
                const nextX = ghost.x + ghost.dir.x * speed;
                const nextY = ghost.y + ghost.dir.y * speed;
                if (!this.isWall(nextX, nextY)) {
                    ghost.x = nextX;
                    ghost.y = nextY;
                }
                this.wrapPosition(ghost);
            });
        }

        handleCollisions() {
            this.ghosts.forEach((ghost) => {
                if (Math.hypot(ghost.x - this.pacman.x, ghost.y - this.pacman.y) < 0.5) {
                    if (this.powerTimer > 0) {
                        ghost.x = 9.5;
                        ghost.y = 8.5;
                        ghost.dir = { x: 0, y: 1 };
                    } else {
                        this.pacman.x = 9.5;
                        this.pacman.y = 14.5;
                        this.pacman.dir = { x: 1, y: 0 };
                    }
                }
            });
        }

        drawBoard() {
            const { ctx, tileSize } = this;
            ctx.save();
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            const bgGrad = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            bgGrad.addColorStop(0, '#050608');
            bgGrad.addColorStop(0.5, '#0c0c14');
            bgGrad.addColorStop(1, '#050608');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.strokeStyle = 'rgba(232, 144, 190, 0.6)';
            ctx.shadowColor = 'rgba(232, 144, 190, 0.45)';
            ctx.shadowBlur = 12;
            ctx.lineWidth = 3.5;

            this.map.forEach((row, y) => {
                row.split('').forEach((cell, x) => {
                    const px = this.offsetX + x * tileSize + tileSize / 2;
                    const py = this.offsetY + y * tileSize + tileSize / 2;
                    if (cell === '#') {
                        ctx.strokeRect(px - tileSize / 2, py - tileSize / 2, tileSize, tileSize);
                    }
                });
            });

            this.pellets.forEach((key) => {
                const [x, y] = key.split(',').map(Number);
                const px = this.offsetX + x * tileSize + tileSize / 2;
                const py = this.offsetY + y * tileSize + tileSize / 2;
                const pelletGlow = ctx.createRadialGradient(px, py, 0, px, py, tileSize * 0.6);
                pelletGlow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
                pelletGlow.addColorStop(0.4, 'rgba(232, 144, 190, 0.7)');
                pelletGlow.addColorStop(1, 'rgba(232, 144, 190, 0)');
                ctx.fillStyle = pelletGlow;
                ctx.beginPath();
                ctx.arc(px, py, tileSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.fillStyle = 'rgba(232, 144, 190, 0.9)';
            this.map.forEach((row, y) => {
                row.split('').forEach((cell, x) => {
                    if (cell === 'o') {
                        const px = this.offsetX + x * tileSize + tileSize / 2;
                        const py = this.offsetY + y * tileSize + tileSize / 2;
                        ctx.beginPath();
                        ctx.arc(px, py, tileSize * 0.22, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            });
            ctx.restore();
        }

        drawEntities(elapsed) {
            const { ctx, tileSize } = this;
            const mouth = (Math.sin(elapsed / 90) + 1) / 4;
            const pacX = this.offsetX + this.pacman.x * tileSize + tileSize / 2;
            const pacY = this.offsetY + this.pacman.y * tileSize + tileSize / 2;

            ctx.save();
            ctx.translate(pacX, pacY);
            const angle = Math.atan2(this.pacman.dir.y, this.pacman.dir.x);
            ctx.rotate(angle);
            const pacGrad = ctx.createRadialGradient(0, 0, tileSize * 0.15, 0, 0, tileSize * 0.55);
            pacGrad.addColorStop(0, '#ffe06a');
            pacGrad.addColorStop(1, '#f7c948');
            ctx.fillStyle = pacGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, tileSize * 0.45, mouth * Math.PI, (2 - mouth) * Math.PI);
            ctx.fill();
            ctx.restore();

            this.ghosts.forEach((ghost) => {
                const gx = this.offsetX + ghost.x * tileSize + tileSize / 2;
                const gy = this.offsetY + ghost.y * tileSize + tileSize / 2;
                ctx.save();
                const baseColor = this.powerTimer > 0 ? '#4bb2ff' : ghost.color;
                const bodyGrad = ctx.createLinearGradient(gx, gy - tileSize * 0.4, gx, gy + tileSize * 0.5);
                bodyGrad.addColorStop(0, baseColor);
                bodyGrad.addColorStop(1, '#0d0d15');
                ctx.fillStyle = bodyGrad;
                ctx.shadowColor = baseColor;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(gx, gy - tileSize * 0.1, tileSize * 0.38, Math.PI, 0);
                ctx.lineTo(gx + tileSize * 0.38, gy + tileSize * 0.35);
                ctx.lineTo(gx - tileSize * 0.38, gy + tileSize * 0.35);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(gx - tileSize * 0.15, gy - tileSize * 0.12, tileSize * 0.12, 0, Math.PI * 2);
                ctx.arc(gx + tileSize * 0.15, gy - tileSize * 0.12, tileSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#111';
                ctx.beginPath();
                ctx.arc(gx - tileSize * 0.15 + ghost.dir.x * 2, gy - tileSize * 0.12 + ghost.dir.y * 2, tileSize * 0.06, 0, Math.PI * 2);
                ctx.arc(gx + tileSize * 0.15 + ghost.dir.x * 2, gy - tileSize * 0.12 + ghost.dir.y * 2, tileSize * 0.06, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
        }

        loop(timestamp) {
            if (!this.ctx || !this.running) return;
            const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000);
            this.lastTime = timestamp;
            if (this.powerTimer > 0) this.powerTimer = Math.max(0, this.powerTimer - dt);

            this.updatePacman(dt);
            this.updateGhosts(dt);
            this.handleCollisions();
            this.drawBoard();
            this.drawEntities(timestamp);
            this.frame = requestAnimationFrame((t) => this.loop(t));
        }
    }

    let pacmanGame = null;
    if (pacmanCanvas) {
        pacmanGame = new PacmanGame(pacmanCanvas);
    }

    pacmanStartBtn?.addEventListener('click', () => {
        if (!pacmanGame) return;
        pacmanGame.start();
        pacmanStartBtn.querySelector('span').textContent = 'Restart Pac-Man';
    });

    // If we want immediate play without button, uncomment next two lines:
    // pacmanGame?.start();
    // pacmanStartBtn?.querySelector('span').textContent = 'Restart Pac-Man';

    const updateSensitivityDisplay = () => {
        if (bgSensitivity && bgSensitivityValue) {
            bgSensitivityValue.textContent = bgSensitivity.value;
        }
    };
    updateSensitivityDisplay();

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const rgbToLab = (r, g, b) => {
        const toLinear = (v) => {
            const s = v / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        const R = toLinear(r);
        const G = toLinear(g);
        const B = toLinear(b);

        const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
        const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
        const z = R * 0.0193 + G * 0.1192 + B * 0.9505;

        const xN = x / 0.95047;
        const yN = y / 1.0;
        const zN = z / 1.08883;

        const f = (t) => (t > 0.008856 ? t ** (1 / 3) : 7.787 * t + 16 / 116);

        const fx = f(xN);
        const fy = f(yN);
        const fz = f(zN);

        return {
            l: Math.max(0, 116 * fy - 16),
            a: 500 * (fx - fy),
            b: 200 * (fy - fz),
        };
    };

    const deltaE = (lab1, lab2) => {
        const dl = lab1.l - lab2.l;
        const da = lab1.a - lab2.a;
        const db = lab1.b - lab2.b;
        return Math.sqrt(dl * dl + da * da + db * db);
    };

    const sampleBackgroundColor = (imageData) => {
        const { data, width, height } = imageData;
        const samples = [];
        const stepX = Math.max(1, Math.floor(width / 40));
        const stepY = Math.max(1, Math.floor(height / 40));
        for (let x = 0; x < width; x += stepX) {
            const top = (0 * width + x) * 4;
            const bottom = ((height - 1) * width + x) * 4;
            samples.push([data[top], data[top + 1], data[top + 2]]);
            samples.push([data[bottom], data[bottom + 1], data[bottom + 2]]);
        }
        for (let y = 0; y < height; y += stepY) {
            const left = (y * width + 0) * 4;
            const right = (y * width + (width - 1)) * 4;
            samples.push([data[left], data[left + 1], data[left + 2]]);
            samples.push([data[right], data[right + 1], data[right + 2]]);
        }
        const channels = [[], [], []];
        samples.forEach(([r, g, b]) => {
            channels[0].push(r);
            channels[1].push(g);
            channels[2].push(b);
        });
        const median = (arr) => {
            const sorted = arr.slice().sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
        };
        return {
            r: median(channels[0]),
            g: median(channels[1]),
            b: median(channels[2]),
        };
    };

    const buildLumaMap = (data) => {
        const luma = new Float32Array(data.length / 4);
        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
            luma[p] = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
        }
        return luma;
    };

    const buildEdgeMap = (luma, width, height) => {
        const out = new Float32Array(luma.length);
        for (let y = 1; y < height - 1; y += 1) {
            for (let x = 1; x < width - 1; x += 1) {
                const i = y * width + x;
                const gx =
                    luma[i - width - 1] - luma[i - width + 1] +
                    2 * (luma[i - 1] - luma[i + 1]) +
                    luma[i + width - 1] - luma[i + width + 1];
                const gy =
                    luma[i - width - 1] - luma[i + width - 1] +
                    2 * (luma[i - width] - luma[i + width]) +
                    luma[i - width + 1] - luma[i + width + 1];
                const mag = Math.min(1, Math.hypot(gx, gy));
                out[i] = mag;
            }
        }
        return out;
    };

    const cleanMask = (alpha, width, height) => {
        const temp = new Uint8ClampedArray(alpha.length);
        const applyKernel = (source, target, type) => {
            for (let y = 0; y < height; y += 1) {
                for (let x = 0; x < width; x += 1) {
                    let extremum = type === 'dilate' ? 0 : 255;
                    for (let dy = -1; dy <= 1; dy += 1) {
                        const ny = y + dy;
                        if (ny < 0 || ny >= height) continue;
                        for (let dx = -1; dx <= 1; dx += 1) {
                            const nx = x + dx;
                            if (nx < 0 || nx >= width) continue;
                            const v = source[ny * width + nx];
                            extremum = type === 'dilate' ? Math.max(extremum, v) : Math.min(extremum, v);
                        }
                    }
                    target[y * width + x] = extremum;
                }
            }
        };
        applyKernel(alpha, temp, 'dilate');
        applyKernel(temp, alpha, 'erode');
    };

    const featherAlpha = (alpha, width, height) => {
        const kernel = [0.27901, 0.44198, 0.27901];
        const temp = new Float32Array(alpha.length);

        // horizontal
        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                let accum = 0;
                for (let k = -1; k <= 1; k += 1) {
                    const nx = clamp(x + k, 0, width - 1);
                    accum += alpha[y * width + nx] * kernel[k + 1];
                }
                temp[y * width + x] = accum;
            }
        }
        // vertical
        for (let x = 0; x < width; x += 1) {
            for (let y = 0; y < height; y += 1) {
                let accum = 0;
                for (let k = -1; k <= 1; k += 1) {
                    const ny = clamp(y + k, 0, height - 1);
                    accum += temp[ny * width + x] * kernel[k + 1];
                }
                alpha[y * width + x] = accum;
            }
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
        const clampedSensitivity = clamp(sensitivityValue, 30, 95);
        const bgColor = sampleBackgroundColor(imageData);
        const bgLab = rgbToLab(bgColor.r, bgColor.g, bgColor.b);
        const luma = buildLumaMap(data);
        const edgeMap = buildEdgeMap(luma, width, height);
        const bgLuma = (0.2126 * bgColor.r + 0.7152 * bgColor.g + 0.0722 * bgColor.b) / 255;

        const alphaMask = new Uint8ClampedArray(width * height);
        const hard = 10 + (clampedSensitivity / 100) * 35;
        const soft = hard * 1.9;

        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lab = rgbToLab(r, g, b);
            const colorDistance = deltaE(lab, bgLab);
            const lumaDistance = Math.abs(luma[p] - bgLuma) * 100;
            const score = colorDistance * 0.72 + lumaDistance * 0.38;

            let alpha = data[i + 3];
            const hardCutoff = hard * 0.85;
            if (score <= hardCutoff) {
                alpha = 0;
            } else if (score < soft) {
                const ratio = (score - hardCutoff) / (soft - hardCutoff);
                alpha = Math.round(alpha * ratio);
            }
            const edgeBoost = edgeMap[p];
            if (edgeBoost > 0.28) {
                alpha = Math.max(alpha, Math.min(255, edgeBoost * 320));
            }
            alphaMask[p] = alpha;
        }

        cleanMask(alphaMask, width, height);
        featherAlpha(alphaMask, width, height);

        for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
            data[i + 3] = alphaMask[p];
        }

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
