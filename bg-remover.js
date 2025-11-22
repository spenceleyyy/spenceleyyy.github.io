document.addEventListener('DOMContentLoaded', () => {
    // --- Math Helpers ---
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const toLinear = (v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };

    // Constants for Lab conversion
    const LAB_E = 0.008856;
    const LAB_K = 903.3;

    const labF = (t) => (t > LAB_E ? Math.cbrt(t) : (LAB_K * t + 16) / 116);

    const rgbToLabObj = (r, g, b) => {
        const R = toLinear(r), G = toLinear(g), B = toLinear(b);
        const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
        const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000;
        const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

        const fx = labF(x), fy = labF(y), fz = labF(z);

        return {
            l: Math.max(0, 116 * fy - 16),
            a: 500 * (fx - fy),
            b: 200 * (fy - fz)
        };
    };

    // --- Game Setup ---
    const pacmanCanvas = document.getElementById('pacman-canvas');
    const uiLayer = document.getElementById('ui-layer');

    let uploadedImage = null;
    let bgRemoverCard = null;

    class PacmanGame {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas?.getContext('2d');
            if (!this.ctx) return;

            // 32 Columns Wide - The "U" section is the UI void (18 cols wide)
            this.map = [
                "################################",
                "#............##................#",
                "#.####.#####.##.#####.####.###.#",
                "#o#  #.#   #....#   #.#..#.#..o#",
                "#.####.#####.##.#####.####.###.#",
                "#............##................#",
                "####.##.UUUUUUUUUUUUUUUUUU.##.##",
                "....#..#UUUUUUUUUUUUUUUUUU#..#..",
                ".####.##UUUUUUUUUUUUUUUUUU##.###",
                ".#....#UUUUUUUUUUUUUUUUUU#.....#",
                ".####.##UUUUUUUUUUUUUUUUUU##.###",
                "....#..#UUUUUUUUUUUUUUUUUU#..#..",
                "####.##.UUUUUUUUUUUUUUUUUU.##.##",
                "#............##................#",
                "#.####.#####.##.#####.####.###.#",
                "#o#..#.#   #....#   #.#..#.#..o#",
                "#.####.#####.##.#####.####.###.#",
                "#............##................#",
                "################################"
            ];

            // Detect UI Boundaries from Map
            this.uiBounds = { x: 0, y: 0, w: 0, h: 0 };
            this.detectUIBounds();

            this.tileSize = 25;
            this.lastTime = performance.now();
            this.offsetX = 0;
            this.offsetY = 0;

            // Spawn points adapted for new map layout
            this.pacman = { x: 15, y: 15, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, speed: 5.0 };
            this.ghosts = [
                { x: 2, y: 2, dir: { x: 1, y: 0 }, color: '#e890be', mode: 'chase' },   // Top Left
                { x: 29, y: 2, dir: { x: -1, y: 0 }, color: '#9ad7ff', mode: 'chase' }, // Top Right
                { x: 2, y: 16, dir: { x: 0, y: -1 }, color: '#ffce76', mode: 'chase' }, // Bottom Left
                { x: 29, y: 16, dir: { x: 0, y: -1 }, color: '#73ffa0', mode: 'chase' } // Bottom Right
            ];

            this.pellets = new Set();
            this.powerTimer = 0;
            this.running = true;
            this.frame = null;

            this.collisionRadius = 0.45;

            this.resize();
            this.seedPellets();
            this.bindControls();
            this.createUICard();
            this.placeUICard();

            window.addEventListener('resize', () => {
                this.resize();
                this.placeUICard();
            });

            this.start();
        }

        detectUIBounds() {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            let found = false;

            for (let y = 0; y < this.map.length; y++) {
                for (let x = 0; x < this.map[y].length; x++) {
                    if (this.map[y][x] === 'U') {
                        found = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }

            if (found) {
                this.uiBounds = {
                    x: minX,
                    y: minY,
                    w: maxX - minX + 1,
                    h: maxY - minY + 1
                };
            }
        }

        start() {
            this.running = true;
            this.lastTime = performance.now();
            if (this.frame) cancelAnimationFrame(this.frame);
            // Draw immediately to ensure visibility on load
            this.drawBoard();
            this.drawEntities(performance.now());
            this.frame = requestAnimationFrame((t) => this.loop(t));
        }

        placeUICard() {
            if (!bgRemoverCard || this.uiBounds.w === 0) return;

            const cardX = this.offsetX + this.uiBounds.x * this.tileSize;
            const cardY = this.offsetY + this.uiBounds.y * this.tileSize;
            const cardW = this.uiBounds.w * this.tileSize;
            const cardH = this.uiBounds.h * this.tileSize;

            bgRemoverCard.style.left = `${cardX}px`;
            bgRemoverCard.style.top = `${cardY}px`;
            bgRemoverCard.style.width = `${cardW}px`;
            bgRemoverCard.style.height = `${cardH}px`;
        }

        createUICard() {
            if (bgRemoverCard) return;

            const card = document.createElement('div');
            card.className = 'card';
            card.id = 'bg-remover-card';
            card.innerHTML = `
                <div class="card-header">
                    <h2 class="card-title">Background Remover</h2>
                </div>

                <label for="image-upload" class="upload-area" id="bg-upload-area">
                    <div class="upload-icon">📸</div>
                    <div class="upload-text">Click or drag image</div>
                    <div class="upload-subtext">JPG, PNG, WebP</div>
                </label>
                <input type="file" id="image-upload" accept="image/*">
                <div class="file-name" id="file-name"></div>

                <div class="controls" id="bg-controls">
                    <div class="control-group">
                        <div class="control-label">
                            <span>Sensitivity</span>
                            <span id="bg-sensitivity-value">65</span>
                        </div>
                        <input type="range" class="slider" id="bg-sensitivity" min="30" max="95" value="65">
                    </div>
                </div>

                <button class="btn btn-process" id="remove-bg" disabled>
                    Remove Background
                </button>

                <div class="processing" id="processing-container">
                    <div class="spinner"></div>
                    <p>Ghosting pixels...</p>
                </div>

                <div class="preview-container" id="preview-container">
                    <div class="preview-box">
                        <div class="preview-label">Original</div>
                        <img id="original-preview" class="preview-img" alt="Original">
                    </div>
                    <div class="preview-box">
                        <div class="preview-label">Result</div>
                        <canvas id="processed-canvas"></canvas>
                    </div>
                </div>

                <div class="output-section" id="bg-output">
                    <button class="btn btn-download" id="download-result">
                        Download Result
                    </button>
                </div>
            `;

            uiLayer.appendChild(card);
            bgRemoverCard = card;
            this.initializeCardHandlers();
        }

        initializeCardHandlers() {
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
            const bgControls = document.getElementById('bg-controls');
            const bgSensitivity = document.getElementById('bg-sensitivity');
            const bgSensitivityValue = document.getElementById('bg-sensitivity-value');

            const updateSensitivityDisplay = () => {
                if (bgSensitivity && bgSensitivityValue) {
                    bgSensitivityValue.textContent = bgSensitivity.value;
                }
            };
            updateSensitivityDisplay();

            const sampleBackgroundColor = (imageData) => {
                const { data, width, height } = imageData;
                const estimatedSamples = (Math.floor(width / 40) + 1) * 2 + (Math.floor(height / 40) + 1) * 2;
                const rSamples = new Uint8Array(estimatedSamples);
                const gSamples = new Uint8Array(estimatedSamples);
                const bSamples = new Uint8Array(estimatedSamples);

                let idx = 0;
                const stepX = Math.max(1, Math.floor(width / 40));
                const stepY = Math.max(1, Math.floor(height / 40));

                for (let x = 0; x < width; x += stepX) {
                    if (idx >= estimatedSamples) break;
                    let p = x * 4;
                    rSamples[idx] = data[p]; gSamples[idx] = data[p + 1]; bSamples[idx] = data[p + 2];
                    idx++;
                    p = ((height - 1) * width + x) * 4;
                    rSamples[idx] = data[p]; gSamples[idx] = data[p + 1]; bSamples[idx] = data[p + 2];
                    idx++;
                }

                for (let y = 0; y < height; y += stepY) {
                    if (idx >= estimatedSamples) break;
                    let p = y * width * 4;
                    rSamples[idx] = data[p]; gSamples[idx] = data[p + 1]; bSamples[idx] = data[p + 2];
                    idx++;
                    p = (y * width + width - 1) * 4;
                    rSamples[idx] = data[p]; gSamples[idx] = data[p + 1]; bSamples[idx] = data[p + 2];
                    idx++;
                }

                const median = (typedArr, length) => {
                    if (length === 0) return 0;
                    const sub = typedArr.subarray(0, length).sort();
                    const mid = Math.floor(length / 2);
                    return length % 2 === 0 ? (sub[mid - 1] + sub[mid]) / 2 : sub[mid];
                };

                return { r: median(rSamples, idx), g: median(gSamples, idx), b: median(bSamples, idx) };
            };

            const applyBackgroundRemoval = () => {
                if (!processedCanvas || !uploadedImage) return;
                try {
                    const ctx = processedCanvas.getContext('2d', { willReadFrequently: true });
                    processedCanvas.width = uploadedImage.width;
                    processedCanvas.height = uploadedImage.height;
                    ctx.drawImage(uploadedImage, 0, 0);

                    const imageData = ctx.getImageData(0, 0, processedCanvas.width, processedCanvas.height);
                    const data = imageData.data;
                    const sensitivityValue = bgSensitivity ? Number(bgSensitivity.value) : 65;
                    const clampedSensitivity = clamp(sensitivityValue, 30, 95);

                    const bgColor = sampleBackgroundColor(imageData);
                    const bgLab = rgbToLabObj(bgColor.r, bgColor.g, bgColor.b);

                    const threshold = 10 + (clampedSensitivity / 100) * 40;

                    const len = data.length;
                    for (let i = 0; i < len; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        const rs = r / 255;
                        const R = rs <= 0.04045 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
                        const gs = g / 255;
                        const G = gs <= 0.04045 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
                        const bs = b / 255;
                        const B = bs <= 0.04045 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

                        const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
                        const y = (R * 0.2126 + G * 0.7152 + B * 0.0722);
                        const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

                        const fx = x > 0.008856 ? Math.cbrt(x) : 7.787 * x + 0.137931;
                        const fy = y > 0.008856 ? Math.cbrt(y) : 7.787 * y + 0.137931;
                        const fz = z > 0.008856 ? Math.cbrt(z) : 7.787 * z + 0.137931;

                        const L = Math.max(0, 116 * fy - 16);
                        const A = 500 * (fx - fy);
                        const B_val = 200 * (fy - fz);

                        const dl = L - bgLab.l;
                        const da = A - bgLab.a;
                        const db = B_val - bgLab.b;

                        const dist = Math.sqrt(dl * dl + da * da + db * db);

                        if (dist < threshold) {
                            data[i + 3] = 0;
                        }
                    }

                    ctx.putImageData(imageData, 0, 0);
                } catch (e) {
                    console.error("Processing error", e);
                }
            };

            const processBackground = ({ skipLoader = false } = {}) => {
                if (!uploadedImage) return;
                const finalize = () => {
                    requestAnimationFrame(() => {
                        try {
                            applyBackgroundRemoval();
                            previewContainer.style.display = 'grid';
                            bgOutput.style.display = 'block';
                            processingContainer.style.display = 'none';
                        } catch (e) {
                            console.error("Animation frame error", e);
                            processingContainer.innerHTML = '<p style="color: #ff6b6b">Error processing image</p>';
                        }
                    });
                };

                if (skipLoader) {
                    finalize();
                    return;
                }

                processingContainer.style.display = 'block';
                previewContainer.style.display = 'none';
                bgOutput.style.display = 'none';

                setTimeout(finalize, 50);
            };

            const handleImageUpload = (file) => {
                if (!file || !file.type.startsWith('image/')) {
                    console.warn('Please upload a valid image file.');
                    return;
                }
                fileName.textContent = file.name;
                fileName.style.display = 'block';
                removeBgBtn.disabled = false;
                if (bgControls) bgControls.style.display = 'block';
                updateSensitivityDisplay();

                const reader = new FileReader();
                reader.onload = (e) => {
                    uploadedImage = new Image();
                    uploadedImage.onload = () => {
                        originalPreview.src = uploadedImage.src;
                        try {
                            const ctx = processedCanvas.getContext('2d', { willReadFrequently: true });
                            ctx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
                            previewContainer.style.display = 'none';
                            bgOutput.style.display = 'none';
                        } catch (err) {
                            console.error("Canvas init error", err);
                        }
                    };
                    uploadedImage.src = e.target.result;
                };
                reader.readAsDataURL(file);
            };

            imageUpload?.addEventListener('change', (event) => {
                const file = event.target.files?.[0];
                if (file) handleImageUpload(file);
            });

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
                    try {
                        imageUpload.files = event.dataTransfer.files;
                    } catch (e) {
                        console.log("Could not assign files to input, proceeding with handler");
                    }
                    handleImageUpload(file);
                }
            });

            removeBgBtn?.addEventListener('click', () => {
                if (!uploadedImage) {
                    console.warn('Upload an image before processing.');
                    return;
                }
                processBackground();
            });

            let sliderTimeout;
            bgSensitivity?.addEventListener('input', () => {
                updateSensitivityDisplay();
                if (uploadedImage && previewContainer.style.display === 'grid') {
                    clearTimeout(sliderTimeout);
                    sliderTimeout = setTimeout(() => {
                        processBackground({ skipLoader: true });
                    }, 50);
                }
            });

            downloadBtn?.addEventListener('click', () => {
                if (!processedCanvas) return;
                try {
                    const dataUrl = processedCanvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = 'background-removed.png';
                    link.href = dataUrl;
                    link.click();
                } catch (e) {
                    console.error("Download error", e);
                }
            });
        }

        bindControls() {
            const handleKey = (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
                    e.preventDefault();
                    const key = e.key.toLowerCase();
                    if (key === 'arrowup' || key === 'w') this.pacman.nextDir = { x: 0, y: -1 };
                    else if (key === 'arrowdown' || key === 's') this.pacman.nextDir = { x: 0, y: 1 };
                    else if (key === 'arrowleft' || key === 'a') this.pacman.nextDir = { x: -1, y: 0 };
                    else if (key === 'arrowright' || key === 'd') this.pacman.nextDir = { x: 1, y: 0 };
                }
            };
            document.addEventListener('keydown', handleKey, { passive: false });
        }

        resize() {
            if (!this.canvas) return;
            const cols = this.map[0].length;
            const rows = this.map.length;
            const scaleX = window.innerWidth / (cols + 2);
            const scaleY = window.innerHeight / (rows + 2);

            this.tileSize = Math.floor(Math.max(15, Math.min(scaleX, scaleY)));

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            const mapWidth = cols * this.tileSize;
            const mapHeight = rows * this.tileSize;
            this.offsetX = Math.floor((this.canvas.width - mapWidth) / 2);
            this.offsetY = Math.floor((this.canvas.height - mapHeight) / 2);
        }

        seedPellets() {
            this.pellets.clear();
            for (let y = 0; y < this.map.length; y++) {
                const row = this.map[y];
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === '.') {
                        this.pellets.add(`${x},${y}`);
                    }
                }
            }
        }

        isWall(x, y) {
            const ix = Math.floor(x);
            const iy = Math.floor(y);
            if (iy < 0 || iy >= this.map.length || ix < 0 || ix >= this.map[0].length) return true;
            const cell = this.map[iy][ix];
            return cell === '#' || cell === 'U';
        }

        canMoveTo(x, y) {
            const r = this.collisionRadius;
            if (this.isWall(x + r, y + r)) return false;
            if (this.isWall(x + r, y - r)) return false;
            if (this.isWall(x - r, y + r)) return false;
            if (this.isWall(x - r, y - r)) return false;
            return true;
        }

        canMove(x, y, dir) {
            const step = 0.15;
            return this.canMoveTo(x + dir.x * step, y + dir.y * step);
        }

        updatePacman(dt) {
            const { pacman } = this;

            if (pacman.nextDir.x !== pacman.dir.x || pacman.nextDir.y !== pacman.dir.y) {
                if (this.canMove(pacman.x, pacman.y, pacman.nextDir)) {
                    pacman.dir.x = pacman.nextDir.x;
                    pacman.dir.y = pacman.nextDir.y;
                }
            }

            const speed = pacman.speed * dt;
            const nextX = pacman.x + pacman.dir.x * speed;
            const nextY = pacman.y + pacman.dir.y * speed;

            if (this.canMoveTo(nextX, nextY)) {
                pacman.x = nextX;
                pacman.y = nextY;
            }

            const maxCols = this.map[0].length;
            if (pacman.x < 0) pacman.x = maxCols - 1;
            else if (pacman.x >= maxCols) pacman.x = 0;

            this.eatPellets();
        }

        eatPellets() {
            const gx = Math.floor(this.pacman.x + 0.5);
            const gy = Math.floor(this.pacman.y + 0.5);
            const key = `${gx},${gy}`;

            if (this.pellets.has(key)) {
                this.pellets.delete(key);
                const cellType = this.map[gy]?.[gx];
                if (cellType === 'o') {
                    this.powerTimer = 7;
                }
            }
        }

        chooseDirection(ghost) {
            const target = this.powerTimer > 0 ? { x: 15, y: 9 } : this.pacman;

            let bestDir = ghost.dir;
            let minDistance = Infinity;

            const dirs = [
                { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }
            ];

            for (let i = 0; i < 4; i++) {
                const d = dirs[i];
                if (d.x === -ghost.dir.x && d.y === -ghost.dir.y) continue;

                const nextX = Math.floor(ghost.x + d.x + 0.5);
                const nextY = Math.floor(ghost.y + d.y + 0.5);

                if (!this.isWall(nextX, nextY)) {
                    const tx = ghost.x + d.x;
                    const ty = ghost.y + d.y;
                    const dist = (tx - target.x) ** 2 + (ty - target.y) ** 2;

                    if (this.powerTimer > 0) {
                        if (dist > minDistance || minDistance === Infinity) {
                            minDistance = dist;
                            bestDir = d;
                        }
                    } else {
                        if (dist < minDistance) {
                            minDistance = dist;
                            bestDir = d;
                        }
                    }
                }
            }

            return bestDir;
        }

        updateGhosts(dt) {
            for (const ghost of this.ghosts) {
                const gx = Math.floor(ghost.x + 0.5);
                const gy = Math.floor(ghost.y + 0.5);

                const aligned = Math.abs(ghost.x - gx) < 0.1 && Math.abs(ghost.y - gy) < 0.1;

                if (aligned) {
                    ghost.x = gx;
                    ghost.y = gy;
                    ghost.dir = this.chooseDirection(ghost);
                }

                const speed = (this.powerTimer > 0 ? 2.5 : 3.5) * dt;
                const nextX = ghost.x + ghost.dir.x * speed;
                const nextY = ghost.y + ghost.dir.y * speed;

                if (!this.isWall(nextX, nextY)) {
                    ghost.x = nextX;
                    ghost.y = nextY;
                }
            }
        }

        handleCollisions() {
            const px = this.pacman.x;
            const py = this.pacman.y;
            const collisionDistSq = 0.36;

            for (let i = 0; i < this.ghosts.length; i++) {
                const ghost = this.ghosts[i];
                const distSq = (ghost.x - px) ** 2 + (ghost.y - py) ** 2;

                if (distSq < collisionDistSq) {
                    if (this.powerTimer > 0) {
                        const spawns = [{ x: 2, y: 2 }, { x: 29, y: 2 }, { x: 2, y: 16 }, { x: 29, y: 16 }];
                        ghost.x = spawns[i].x;
                        ghost.y = spawns[i].y;
                    } else {
                        this.pacman.x = 15;
                        this.pacman.y = 15;
                        this.pacman.dir = { x: 1, y: 0 };
                        this.pacman.nextDir = { x: 1, y: 0 };
                    }
                }
            }
        }

        drawBoard() {
            const { ctx, tileSize } = this;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            const bgGrad = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
            bgGrad.addColorStop(0, '#0b0b11');
            bgGrad.addColorStop(0.5, '#11111b');
            bgGrad.addColorStop(1, '#0b0b11');
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            ctx.strokeStyle = 'rgba(232, 144, 190, 0.85)';
            ctx.shadowColor = 'rgba(232, 144, 190, 0.65)';
            ctx.shadowBlur = 18;
            ctx.lineWidth = 4;

            ctx.beginPath();
            for (let y = 0; y < this.map.length; y++) {
                const row = this.map[y];
                for (let x = 0; x < row.length; x++) {
                    if (row[x] === '#') {
                        const px = this.offsetX + x * tileSize;
                        const py = this.offsetY + y * tileSize;
                        ctx.rect(px, py, tileSize, tileSize);
                    }
                }
            }
            ctx.stroke();

            ctx.shadowBlur = 0;
            for (const key of this.pellets) {
                const comma = key.indexOf(',');
                const x = parseInt(key.substring(0, comma));
                const y = parseInt(key.substring(comma + 1));

                const px = this.offsetX + x * tileSize + tileSize / 2;
                const py = this.offsetY + y * tileSize + tileSize / 2;

                ctx.fillStyle = 'rgba(232, 144, 190, 0.6)';
                ctx.beginPath();
                ctx.arc(px, py, tileSize * 0.12, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.fillStyle = 'rgba(232, 144, 190, 0.95)';
            for (let y = 0; y < this.map.length; y++) {
                for (let x = 0; x < this.map[y].length; x++) {
                    if (this.map[y][x] === 'o') {
                        if (!this.pellets.has(`${x},${y}`)) continue;
                        const px = this.offsetX + x * tileSize + tileSize / 2;
                        const py = this.offsetY + y * tileSize + tileSize / 2;
                        ctx.beginPath();
                        ctx.arc(px, py, tileSize * 0.22, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
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
            ctx.shadowColor = '#f7c948';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, tileSize * 0.48, mouth * Math.PI, (2 - mouth) * Math.PI);
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.stroke();
            ctx.restore();

            for (const ghost of this.ghosts) {
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
            }
        }

        loop(timestamp) {
            if (!this.running) return;
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

    if (pacmanCanvas) {
        new PacmanGame(pacmanCanvas);
    }
});
