document.addEventListener('DOMContentLoaded', () => {
    // --- Debug helper ---
    const DEBUG = true;
    let lastDebug = 0;
    const debugLog = (...args) => {
        if (!DEBUG) return;
        const now = performance.now();
        if (now - lastDebug > 250) { // throttle to avoid spam
            // eslint-disable-next-line no-console
            console.debug('[PACMAN]', ...args);
            lastDebug = now;
        }
    };

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
            // Layout is mirrored and fully connected to avoid tiny trapped pockets.
            this.map = [
                "################################",
                "#..............................#",
                "#.###.###..##..##..#...###..#..#",
                "#o##.###..###....###..###..##o##",
                "#.##.###..##........##..###.#..#",
                "#..............................#",
                "#.#.########################.#.#",
                "#.#.#UUUUUUUUUUUUUUUUUUUUUU#.#.#",
                "#.#.#U####################U#.#.#",
                "#.#.#U####################U#.#.#",
                "#.#.#U####################U#.#.#",
                "#.#.#U####################U#.#.#",
                "#.#.#U####################U#.#.#",
                "#.#.#UUUUUUUUUUUUUUUUUUUUUU#.#.#",
                "#.#.########################.#.#",
                "#..............................#",
                "#.##.###..##........##..###.#..#",
                "#o##.###..###....###..###..##o##",
                "#.###.###..##..##..#...###..#..#",
                "#..............................#",
                "################################"
            ];

            this.ghostSpawns = [
                { x: 1, y: 1, dir: { x: 1, y: 0 } },
                { x: 30, y: 1, dir: { x: -1, y: 0 } },
                { x: 1, y: 19, dir: { x: 1, y: 0 } },
                { x: 30, y: 19, dir: { x: -1, y: 0 } }
            ];

            // Detect UI Boundaries from Map
            this.uiBounds = { x: 0, y: 0, w: 0, h: 0 };
            this.detectUIBounds();

            this.tileSize = 25;
            this.lastTime = performance.now();
            this.offsetX = 0;
            this.offsetY = 0;

            // Spawn points adapted for new map layout
            // Center spawn placed on a fully open row for clean movement start.
            this.pacman = { x: 15, y: 15, dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 }, speed: 4.5 };
            this.lastSafePac = { x: this.pacman.x, y: this.pacman.y };
            const ghostColors = ['#e890be', '#9ad7ff', '#ffce76', '#73ffa0'];
            this.ghosts = this.ghostSpawns.map((spawn, idx) => {
                const safeSpawn = this.getSafeGhostSpawn(idx);
                return {
                    x: safeSpawn.x,
                    y: safeSpawn.y,
                    dir: { ...safeSpawn.dir },
                    color: ghostColors[idx % ghostColors.length],
                    mode: 'chase'
                };
            });
            this.ghostStartDelay = 5;

            this.pellets = new Set();
            this.powerTimer = 0;
            this.running = true;
            this.frame = null;

            this.collisionRadius = 0.06;

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
            this.canvas?.focus?.();
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
                <div class="card-header" style="justify-content: space-between; align-items: center;">
                    <h2 class="card-title">Background Remover</h2>
                    <button class="card-portal-btn" id="card-expand-btn">FULLSCREEN</button>
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
                    <div class="control-group">
                        <div class="control-label">
                            <span>Edge Feather</span>
                            <span id="bg-feather-value">2</span>
                        </div>
                        <input type="range" class="slider" id="bg-feather" min="0" max="6" value="2">
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
            this.initCardExpand();
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
            const bgFeather = document.getElementById('bg-feather');
            const bgFeatherValue = document.getElementById('bg-feather-value');

            const updateControlDisplays = () => {
                if (bgSensitivity && bgSensitivityValue) {
                    bgSensitivityValue.textContent = bgSensitivity.value;
                }
                if (bgFeather && bgFeatherValue) {
                    bgFeatherValue.textContent = bgFeather.value;
                }
            };
            updateControlDisplays();

            const sampleEdgeColors = (imageData) => {
                const { data, width, height } = imageData;
                const targetSamples = 60;
                const stepX = Math.max(1, Math.floor(width / targetSamples));
                const stepY = Math.max(1, Math.floor(height / targetSamples));
                const samples = [];

                const pushSample = (x, y) => {
                    const p = (y * width + x) * 4;
                    samples.push({ r: data[p], g: data[p + 1], b: data[p + 2] });
                };

                for (let x = 0; x < width; x += stepX) {
                    pushSample(x, 0);
                    if (height > 1) pushSample(x, height - 1);
                }

                for (let y = 0; y < height; y += stepY) {
                    pushSample(0, y);
                    if (width > 1) pushSample(width - 1, y);
                }

                return samples;
            };

            const minDistSqToPalette = (lab, palette) => {
                let best = Infinity;
                for (const center of palette) {
                    const dl = lab.l - center.l;
                    const da = lab.a - center.a;
                    const db = lab.b - center.b;
                    const dist = dl * dl + da * da + db * db;
                    if (dist < best) best = dist;
                }
                return best;
            };

            const buildBackgroundModel = (samples, maxClusters = 4) => {
                if (!samples.length) return { palette: [], sampleLabs: [] };
                const sampleLabs = samples.map((s) => rgbToLabObj(s.r, s.g, s.b));
                const clusterCount = Math.min(maxClusters, sampleLabs.length);
                const palette = [];

                palette.push({ ...sampleLabs[0] });
                for (let i = 1; i < clusterCount; i++) {
                    let bestIndex = 0;
                    let bestDist = -1;
                    for (let j = 0; j < sampleLabs.length; j++) {
                        const dist = minDistSqToPalette(sampleLabs[j], palette);
                        if (dist > bestDist) {
                            bestDist = dist;
                            bestIndex = j;
                        }
                    }
                    palette.push({ ...sampleLabs[bestIndex] });
                }

                for (let iter = 0; iter < 5; iter++) {
                    const sums = Array.from({ length: palette.length }, () => ({ l: 0, a: 0, b: 0, n: 0 }));
                    for (const lab of sampleLabs) {
                        let bestIndex = 0;
                        let bestDist = Infinity;
                        for (let i = 0; i < palette.length; i++) {
                            const dl = lab.l - palette[i].l;
                            const da = lab.a - palette[i].a;
                            const db = lab.b - palette[i].b;
                            const dist = dl * dl + da * da + db * db;
                            if (dist < bestDist) {
                                bestDist = dist;
                                bestIndex = i;
                            }
                        }
                        const sum = sums[bestIndex];
                        sum.l += lab.l;
                        sum.a += lab.a;
                        sum.b += lab.b;
                        sum.n += 1;
                    }

                    for (let i = 0; i < palette.length; i++) {
                        if (sums[i].n > 0) {
                            palette[i].l = sums[i].l / sums[i].n;
                            palette[i].a = sums[i].a / sums[i].n;
                            palette[i].b = sums[i].b / sums[i].n;
                        }
                    }
                }

                return { palette, sampleLabs };
            };

            const computeAdaptiveThreshold = (sampleLabs, palette, sensitivity) => {
                if (!sampleLabs.length || !palette.length) return 0;
                const distances = sampleLabs.map((lab) => Math.sqrt(minDistSqToPalette(lab, palette)));
                distances.sort((a, b) => a - b);
                const mid = distances[Math.floor(distances.length * 0.5)] ?? 0;
                const high = distances[Math.floor(distances.length * 0.85)] ?? mid;
                const variance = Math.max(0, high - mid);
                const sensitivityNorm = (sensitivity - 30) / 65;
                const threshold = mid + variance * 0.8 + 6 + sensitivityNorm * 20;
                return clamp(threshold, 6, 55);
            };

            const computeEdgeMap = (imageData) => {
                const { data, width, height } = imageData;
                const total = width * height;
                const lum = new Float32Array(total);
                for (let i = 0; i < total; i++) {
                    const p = i * 4;
                    lum[i] = 0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
                }

                const edge = new Float32Array(total);
                let maxEdge = 0;
                for (let y = 1; y < height - 1; y++) {
                    const row = y * width;
                    for (let x = 1; x < width - 1; x++) {
                        const idx = row + x;
                        const gx =
                            -lum[idx - width - 1] + lum[idx - width + 1]
                            - 2 * lum[idx - 1] + 2 * lum[idx + 1]
                            - lum[idx + width - 1] + lum[idx + width + 1];
                        const gy =
                            -lum[idx - width - 1] - 2 * lum[idx - width] - lum[idx - width + 1]
                            + lum[idx + width - 1] + 2 * lum[idx + width] + lum[idx + width + 1];
                        const value = Math.sqrt(gx * gx + gy * gy);
                        edge[idx] = value;
                        if (value > maxEdge) maxEdge = value;
                    }
                }
                return { edge, maxEdge };
            };

            const computeEdgeThreshold = (edge, maxEdge, sensitivityNorm, width, height) => {
                if (maxEdge <= 0) return 1;
                let sum = 0;
                let sumSq = 0;
                let count = 0;
                for (let y = 1; y < height - 1; y++) {
                    const row = y * width;
                    for (let x = 1; x < width - 1; x++) {
                        const idx = row + x;
                        const value = edge[idx] / maxEdge;
                        sum += value;
                        sumSq += value * value;
                        count++;
                    }
                }
                if (!count) return 1;
                const mean = sum / count;
                const variance = Math.max(0, sumSq / count - mean * mean);
                const std = Math.sqrt(variance);
                const factor = 0.8 + sensitivityNorm * 0.8;
                return clamp(mean + std * factor, 0.08, 0.6);
            };

            const dilateEdgeMap = (edge, width, height) => {
                const total = width * height;
                const out = new Float32Array(total);
                if (width < 3 || height < 3) {
                    out.set(edge);
                    return out;
                }
                for (let y = 1; y < height - 1; y++) {
                    const row = y * width;
                    for (let x = 1; x < width - 1; x++) {
                        let maxVal = 0;
                        for (let dy = -1; dy <= 1; dy++) {
                            const nRow = (y + dy) * width;
                            for (let dx = -1; dx <= 1; dx++) {
                                const value = edge[nRow + x + dx];
                                if (value > maxVal) maxVal = value;
                            }
                        }
                        out[row + x] = maxVal;
                    }
                }

                for (let x = 0; x < width; x++) {
                    out[x] = edge[x];
                    out[(height - 1) * width + x] = edge[(height - 1) * width + x];
                }
                for (let y = 0; y < height; y++) {
                    out[y * width] = edge[y * width];
                    out[y * width + width - 1] = edge[y * width + width - 1];
                }
                return out;
            };

            const labDistanceSqToPalette = (r, g, b, palette) => {
                const R = toLinear(r);
                const G = toLinear(g);
                const B = toLinear(b);
                const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
                const y = (R * 0.2126 + G * 0.7152 + B * 0.0722) / 1.00000;
                const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;

                const fx = labF(x);
                const fy = labF(y);
                const fz = labF(z);

                const L = Math.max(0, 116 * fy - 16);
                const A = 500 * (fx - fy);
                const B_val = 200 * (fy - fz);

                let best = Infinity;
                for (const center of palette) {
                    const dl = L - center.l;
                    const da = A - center.a;
                    const db = B_val - center.b;
                    const dist = dl * dl + da * da + db * db;
                    if (dist < best) best = dist;
                }
                return best;
            };

            const buildBackgroundMask = (imageData, palette, threshold, edge, maxEdge, edgeThreshold) => {
                const { data, width, height } = imageData;
                const total = width * height;
                const state = new Uint8Array(total);
                if (!palette.length || threshold <= 0) {
                    state.fill(2);
                    return state;
                }
                const thresholdSq = threshold * threshold;
                const queue = new Uint32Array(total);
                let qStart = 0;
                let qEnd = 0;

                const markPixel = (x, y, isBorder = false) => {
                    const idx = y * width + x;
                    if (state[idx] !== 0) return;
                    const p = idx * 4;
                    const distSq = labDistanceSqToPalette(data[p], data[p + 1], data[p + 2], palette);
                    const edgeStrength = maxEdge > 0 ? edge[idx] / maxEdge : 0;
                    if (distSq <= thresholdSq && (isBorder || edgeStrength <= edgeThreshold)) {
                        state[idx] = 1;
                        queue[qEnd++] = idx;
                    } else {
                        state[idx] = 2;
                    }
                };

                for (let x = 0; x < width; x++) {
                    markPixel(x, 0, true);
                    if (height > 1) markPixel(x, height - 1, true);
                }
                for (let y = 0; y < height; y++) {
                    markPixel(0, y, true);
                    if (width > 1) markPixel(width - 1, y, true);
                }

                while (qStart < qEnd) {
                    const idx = queue[qStart++];
                    const x = idx % width;
                    const y = (idx / width) | 0;
                    if (x > 0) markPixel(x - 1, y);
                    if (x < width - 1) markPixel(x + 1, y);
                    if (y > 0) markPixel(x, y - 1);
                    if (y < height - 1) markPixel(x, y + 1);
                }

                return state;
            };

            const boxBlurMask = (mask, width, height, radius) => {
                if (radius <= 0) return mask;
                const size = radius * 2 + 1;
                const tmp = new Uint32Array(width * height);
                const out = new Uint8ClampedArray(width * height);

                for (let y = 0; y < height; y++) {
                    let sum = 0;
                    for (let i = -radius; i <= radius; i++) {
                        const xi = clamp(i, 0, width - 1);
                        sum += mask[y * width + xi];
                    }
                    tmp[y * width] = sum;
                    for (let x = 1; x < width; x++) {
                        const addX = clamp(x + radius, 0, width - 1);
                        const subX = clamp(x - radius - 1, 0, width - 1);
                        sum += mask[y * width + addX] - mask[y * width + subX];
                        tmp[y * width + x] = sum;
                    }
                }

                const denom = size * size;
                for (let x = 0; x < width; x++) {
                    let sum = 0;
                    for (let i = -radius; i <= radius; i++) {
                        const yi = clamp(i, 0, height - 1);
                        sum += tmp[yi * width + x];
                    }
                    out[x] = Math.round(sum / denom);
                    for (let y = 1; y < height; y++) {
                        const addY = clamp(y + radius, 0, height - 1);
                        const subY = clamp(y - radius - 1, 0, height - 1);
                        sum += tmp[addY * width + x] - tmp[subY * width + x];
                        out[y * width + x] = Math.round(sum / denom);
                    }
                }

                return out;
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
                    const sensitivityNorm = (clampedSensitivity - 30) / 65;
                    const featherValue = bgFeather ? Number(bgFeather.value) : 2;
                    const featherRadius = clamp(Math.round(featherValue), 0, 6);

                    const samples = sampleEdgeColors(imageData);
                    const { palette, sampleLabs } = buildBackgroundModel(samples);
                    const threshold = computeAdaptiveThreshold(sampleLabs, palette, clampedSensitivity);
                    const { edge, maxEdge } = computeEdgeMap(imageData);
                    const edgeField = dilateEdgeMap(edge, processedCanvas.width, processedCanvas.height);
                    const edgeThreshold = computeEdgeThreshold(edgeField, maxEdge, sensitivityNorm, processedCanvas.width, processedCanvas.height);
                    const state = buildBackgroundMask(imageData, palette, threshold, edgeField, maxEdge, edgeThreshold);

                    const total = processedCanvas.width * processedCanvas.height;
                    const mask = new Uint8ClampedArray(total);
                    for (let i = 0; i < total; i++) {
                        mask[i] = state[i] === 1 ? 0 : 255;
                    }
                    const alphaMask = boxBlurMask(mask, processedCanvas.width, processedCanvas.height, featherRadius);

                    for (let i = 0; i < total; i++) {
                        data[i * 4 + 3] = alphaMask[i];
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
                updateControlDisplays();

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
                updateControlDisplays();
                if (uploadedImage && previewContainer.style.display === 'grid') {
                    clearTimeout(sliderTimeout);
                    sliderTimeout = setTimeout(() => {
                        processBackground({ skipLoader: true });
                    }, 50);
                }
            });
            bgFeather?.addEventListener('input', () => {
                updateControlDisplays();
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

        initCardExpand() {
            const expandBtn = document.getElementById('card-expand-btn');
            if (!expandBtn || !bgRemoverCard) return;

            expandBtn.addEventListener('click', () => {
                const expanded = bgRemoverCard.classList.toggle('card-expanded');
                expandBtn.textContent = expanded ? 'RETURN' : 'MEGA';

                if (expanded) {
                    // Clear inline positioning so fixed centering takes over
                    bgRemoverCard.style.left = '';
                    bgRemoverCard.style.top = '';
                    bgRemoverCard.style.width = '';
                    bgRemoverCard.style.height = '';
                } else {
                    // Restore placement within the maze void
                    this.placeUICard();
                }
            });
        }

        bindControls() {
            const handleKey = (e) => {
                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd', 'W', 'S', 'A', 'D'].includes(e.key)) {
                    e.preventDefault();
                    this.running = true;
                    const key = e.key.toLowerCase();
                    debugLog('key', key);
                    if (key === 'arrowup' || key === 'w') this.pacman.nextDir = { x: 0, y: -1 };
                    else if (key === 'arrowdown' || key === 's') this.pacman.nextDir = { x: 0, y: 1 };
                    else if (key === 'arrowleft' || key === 'a') this.pacman.nextDir = { x: -1, y: 0 };
                    else if (key === 'arrowright' || key === 'd') this.pacman.nextDir = { x: 1, y: 0 };
                }
            };
            document.addEventListener('keydown', handleKey, { passive: false });
            window.addEventListener('keydown', handleKey, { passive: false });
            if (this.canvas) {
                this.canvas.setAttribute('tabindex', '0');
                this.canvas.addEventListener('click', () => this.canvas.focus());
            }
        }

        resize() {
            if (!this.canvas) return;
            const navOffset = 72;
            const cols = this.map[0].length;
            const rows = this.map.length;
            const scaleX = window.innerWidth / (cols + 2);
            const scaleY = (window.innerHeight - navOffset) / (rows + 2);

            this.tileSize = Math.floor(Math.max(15, Math.min(scaleX, scaleY)));

            this.canvas.width = window.innerWidth;
            this.canvas.height = Math.max(200, window.innerHeight - navOffset);
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
            const ix = Math.round(x);
            const iy = Math.round(y);
            if (iy < 0 || iy >= this.map.length || ix < 0 || ix >= this.map[0].length) return true;
            const cell = this.map[iy][ix];
            return cell === '#' || cell === 'U';
        }

        getSafeGhostSpawn(index) {
            const base = this.ghostSpawns[index % this.ghostSpawns.length];
            const pacTileX = Math.round(this.pacman.x);
            const pacTileY = Math.round(this.pacman.y);
            const offsets = [
                { x: 0, y: 0 },
                { x: base.x === 1 ? 1 : -1, y: 0 },
                { x: 0, y: base.y === 1 ? 1 : -1 },
                { x: base.x === 1 ? 2 : -2, y: 0 },
                { x: 0, y: base.y === 1 ? 2 : -2 }
            ];

            for (const off of offsets) {
                const sx = base.x + off.x;
                const sy = base.y + off.y;
                if (this.isWall(sx, sy)) continue;
                if (sx === pacTileX && sy === pacTileY) continue;
                return { x: sx, y: sy, dir: { ...base.dir } };
            }

            return { x: base.x, y: base.y, dir: { ...base.dir } };
        }

        resetPacman() {
            this.pacman.x = 15;
            this.pacman.y = 15;
            this.pacman.dir = { x: 1, y: 0 };
            this.pacman.nextDir = { x: 1, y: 0 };
        }

        resetGhostsToCorners() {
            this.ghosts.forEach((ghost, idx) => {
                const spawn = this.getSafeGhostSpawn(idx);
                ghost.x = spawn.x;
                ghost.y = spawn.y;
                ghost.dir = { ...spawn.dir };
                ghost.mode = 'chase';
            });
            this.ghostStartDelay = 5;
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
            const step = 0.12;
            return this.canMoveTo(x + dir.x * step, y + dir.y * step);
        }

        updatePacman(dt) {
            const { pacman } = this;
            let moved = false;
            const alignEpsilon = 0.12;
            const snapEpsilon = 0.045;

            const gridX = Math.round(pacman.x);
            const gridY = Math.round(pacman.y);

            // Only nudge to grid when already nearly aligned; reduces jitter mid-path.
            if (Math.abs(pacman.dir.x) > 0 && Math.abs(pacman.y - gridY) < alignEpsilon) {
                pacman.y = gridY;
            } else if (Math.abs(pacman.dir.y) > 0 && Math.abs(pacman.x - gridX) < alignEpsilon) {
                pacman.x = gridX;
            }

            const alignedX = Math.abs(pacman.x - Math.round(pacman.x)) < alignEpsilon;
            const alignedY = Math.abs(pacman.y - Math.round(pacman.y)) < alignEpsilon;
            if (alignedX && alignedY) {
                const tryTileX = Math.round(pacman.x + pacman.nextDir.x);
                const tryTileY = Math.round(pacman.y + pacman.nextDir.y);
                if (!this.isWall(tryTileX, tryTileY)) {
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
                this.lastSafePac = { x: pacman.x, y: pacman.y };
                moved = true;
            } else {
                // Snap only when blocked to slide cleanly into the corridor center.
                if (Math.abs(pacman.x - gridX) < snapEpsilon) pacman.x = gridX;
                if (Math.abs(pacman.y - gridY) < snapEpsilon) pacman.y = gridY;
            }

            // If we ever overlap a wall, revert to last known safe spot and stop movement.
            if (!this.canMoveTo(pacman.x, pacman.y) || this.isWall(pacman.x, pacman.y)) {
                pacman.x = this.lastSafePac.x;
                pacman.y = this.lastSafePac.y;
                pacman.dir = { x: 0, y: 0 };
                pacman.nextDir = { x: 0, y: 0 };
                moved = false;
            }

            const maxCols = this.map[0].length;
            if (pacman.x < 0) pacman.x = maxCols - 1;
            else if (pacman.x >= maxCols) pacman.x = 0;

            this.eatPellets();

            if (!moved) {
                debugLog('Pac blocked', {
                    pos: { x: pacman.x.toFixed(2), y: pacman.y.toFixed(2) },
                    dir: pacman.dir
                });
            }
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
            if (this.ghostStartDelay > 0) {
                this.ghostStartDelay = Math.max(0, this.ghostStartDelay - dt);
                return;
            }

            for (const ghost of this.ghosts) {
                const gx = Math.floor(ghost.x + 0.5);
                const gy = Math.floor(ghost.y + 0.5);

                const aligned = Math.abs(ghost.x - gx) < 0.05 && Math.abs(ghost.y - gy) < 0.05;

                if (aligned) {
                    ghost.x = gx;
                    ghost.y = gy;
                    ghost.dir = this.chooseDirection(ghost);
                }

                const speed = (this.powerTimer > 0 ? 2.5 : 3.8) * dt;
                const nextX = ghost.x + ghost.dir.x * speed;
                const nextY = ghost.y + ghost.dir.y * speed;

                if (!this.isWall(nextX, nextY)) {
                    ghost.x = nextX;
                    ghost.y = nextY;
                } else if (aligned) {
                    ghost.dir = this.chooseDirection(ghost);
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
                        const spawnPoint = this.getSafeGhostSpawn(i);
                        ghost.x = spawnPoint.x;
                        ghost.y = spawnPoint.y;
                        ghost.dir = { ...spawnPoint.dir };
                    } else {
                        this.resetPacman();
                        this.resetGhostsToCorners();
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

                // Match nav text color (#FFFFED) for pellets
                ctx.fillStyle = '#FFFFED';
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
            const pacGrad = ctx.createRadialGradient(0, 0, tileSize * 0.12, 0, 0, tileSize * 0.45);
            pacGrad.addColorStop(0, '#ffe06a');
            pacGrad.addColorStop(1, '#f7c948');
            ctx.fillStyle = pacGrad;
            ctx.shadowColor = '#f7c948';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, tileSize * 0.4, mouth * Math.PI, (2 - mouth) * Math.PI);
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
            if (!this.canMoveTo(this.pacman.x, this.pacman.y) || this.isWall(this.pacman.x, this.pacman.y)) {
                this.resetPacman();
            }
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
