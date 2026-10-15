/**
 * Hero Galaxy - Multi-Depth Weightless Upward Drifting Gallery
 * Images slowly float upward across 3 distinct optical depth planes:
 * Background (blurry bokeh), Midground (soft focus), and Foreground (sharp in-focus).
 * Features collision-free staggered lanes, organic 3D rocking sway, and zero mouseover interference.
 */

(function () {
    class HeroGalaxy {
        constructor(options = {}) {
            this.container = typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container;

            if (!this.container) return;

            this.items = options.items || [];
            this.canvas = this.container.querySelector('#galaxy-underlay');
            this.cardsContainer = this.container.querySelector('#galaxy-cards-container');
            this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.isMobile = this.width < 768;

            this.isPlaying = true;
            this.speedMultiplier = 1.0;
            this.lastTime = performance.now();

            // Ambient background particles (drifting dust)
            this.particles = [];
            this.initParticles();

            // Weightless floating cards across 3 depth planes
            this.cards = [];
            this.initCards();

            // Bindings
            this.onResize = this.onResize.bind(this);
            this.render = this.render.bind(this);

            window.addEventListener('resize', this.onResize, { passive: true });
            this.onResize();
            requestAnimationFrame(this.render);
        }

        initParticles() {
            this.particles = [];
            const count = this.isMobile ? 35 : 70;
            for (let i = 0; i < count; i++) {
                this.particles.push({
                    x: Math.random() * this.width,
                    y: Math.random() * this.height,
                    radius: 0.8 + Math.random() * 1.6,
                    baseAlpha: 0.12 + Math.random() * 0.38,
                    vy: -(10 + Math.random() * 16),
                    vx: (Math.random() - 0.5) * 5,
                    pulsePhase: Math.random() * Math.PI * 2,
                    color: Math.random() < 0.4 ? '245, 180, 0' : '225, 229, 238'
                });
            }
        }

        initCards() {
            if (!this.cardsContainer || this.items.length === 0) return;
            this.cardsContainer.innerHTML = '';
            this.cards = [];

            const isMobile = this.isMobile;
            const baseW = isMobile ? 120 : 185;
            const baseH = isMobile ? 80 : 120;

            // 3 distinct optical depth tiers:
            // 1. Back: smaller, visibly blurred (5px bokeh), lower opacity/brightness, drifts slowest
            // 2. Mid: medium size, lightly softened (2px blur), medium drift
            // 3. Front: largest, crystal sharp in focus, full opacity & brightness, drifts fastest
            const tierConfigs = {
                back: {
                    tier: 'back',
                    scale: isMobile ? 0.60 : 0.62,
                    blur: 5.0,
                    opacity: 0.58,
                    brightness: 0.76,
                    speedY: 14,
                    zIndex: 5
                },
                mid: {
                    tier: 'mid',
                    scale: isMobile ? 0.80 : 0.86,
                    blur: 2.0,
                    opacity: 0.82,
                    brightness: 0.90,
                    speedY: 22,
                    zIndex: 15
                },
                front: {
                    tier: 'front',
                    scale: isMobile ? 1.02 : 1.12,
                    blur: 0.0,
                    opacity: 1.0,
                    brightness: 1.02,
                    speedY: 30,
                    zIndex: 30
                }
            };

            const margin = isMobile ? 16 : 48;
            const usableW = Math.max(160, this.width - margin * 2);
            const usableH = Math.max(200, this.height - 60);

            // Stratified multi-zone grid to ensure organic, balanced spread across entire viewport
            const cols = isMobile ? 3 : 5;
            const rows = isMobile ? 3 : 4;
            const colW = usableW / cols;
            const rowH = usableH / rows;

            // Generate full grid of spatial cells
            const cells = [];
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    cells.push({ col: c, row: r });
                }
            }

            // Fisher-Yates shuffle for non-linear, unpredictable spatial assignment
            for (let i = cells.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cells[i], cells[j]] = [cells[j], cells[i]];
            }

            // Shuffle project items so each visit features a fresh mix of artwork
            const shuffledItems = [...this.items];
            for (let i = shuffledItems.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffledItems[i], shuffledItems[j]] = [shuffledItems[j], shuffledItems[i]];
            }

            // Create balanced depth tier pool (equal proportion of background, midground, and foreground)
            const perTier = isMobile ? 3 : 6;
            const cardTierPool = [];
            ['back', 'mid', 'front'].forEach(t => {
                for (let k = 0; k < perTier; k++) {
                    cardTierPool.push(t);
                }
            });

            // Shuffle tiers so depths are organically intermingled across the screen
            for (let i = cardTierPool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [cardTierPool[i], cardTierPool[j]] = [cardTierPool[j], cardTierPool[i]];
            }

            const totalCards = Math.min(cardTierPool.length, cells.length);
            const centerX = this.width / 2;
            const centerY = this.height / 2;

            for (let i = 0; i < totalCards; i++) {
                const tierName = cardTierPool[i];
                const tier = tierConfigs[tierName];
                const cell = cells[i];
                const item = shuffledItems[i % shuffledItems.length];

                const width = baseW * tier.scale;
                const height = baseH * tier.scale;

                // Position within assigned spatial cell with organic intra-cell jitter
                const cellMinX = margin + cell.col * colW;
                const cellMinY = 20 + cell.row * rowH;
                const jitterRangeX = Math.max(6, colW - width);
                const jitterRangeY = Math.max(6, rowH - height);

                let startX = cellMinX + Math.random() * jitterRangeX;
                let startY = cellMinY + Math.random() * jitterRangeY;

                // Soft center clearance for sharp foreground cards to protect headline legibility
                if (tierName === 'front') {
                    const cardCenterX = startX + width / 2;
                    const cardCenterY = startY + height / 2;
                    const dx = cardCenterX - centerX;
                    const dy = cardCenterY - centerY;
                    if (Math.abs(dx) < 220 && Math.abs(dy) < 140) {
                        startX += (dx >= 0 ? 1 : -1) * (230 - Math.abs(dx));
                    }
                }

                // Bound strictly inside viewport margins
                startX = Math.max(margin, Math.min(this.width - margin - width, startX));
                startY = Math.max(-height * 0.2, Math.min(this.height - height * 0.8, startY));

                // Weightless harmonic lateral sway parameters
                const swayFreqX = 0.20 + Math.random() * 0.25;
                const swayAmpX = 14 + Math.random() * 18;
                const phaseX = Math.random() * Math.PI * 2;
                const phaseY = Math.random() * Math.PI * 2;

                // Weightless 3D tilt
                const baseRotZ = (Math.random() - 0.5) * 14; // -7 to +7 deg
                const rotZSpeed = 0.2 + Math.random() * 0.3;
                const rotZAmp = 1.5 + Math.random() * 2.5;
                const tiltFreqX = 0.22 + Math.random() * 0.25;
                const tiltFreqY = 0.22 + Math.random() * 0.25;

                const cardEl = document.createElement('div');
                cardEl.className = 'galaxy-card';
                cardEl.style.width = `${Math.round(width)}px`;
                cardEl.style.height = `${Math.round(height)}px`;
                cardEl.style.zIndex = tier.zIndex;

                // Optical depth of field blur & brightness
                if (tier.blur > 0) {
                    cardEl.style.filter = `blur(${tier.blur}px) brightness(${tier.brightness})`;
                } else {
                    cardEl.style.filter = `brightness(${tier.brightness})`;
                }

                // Pure image: no titles, no tags, zero hover interference
                cardEl.innerHTML = `
                    <div class="galaxy-card-inner">
                        <div class="galaxy-card-media" style="background-image: url('${item.image}')">
                            <div class="galaxy-card-overlay"></div>
                        </div>
                        <div class="galaxy-card-ticks">
                            <span class="tick tick-tl"></span>
                            <span class="tick tick-tr"></span>
                            <span class="tick tick-bl"></span>
                            <span class="tick tick-br"></span>
                        </div>
                    </div>
                `;

                this.cardsContainer.appendChild(cardEl);

                this.cards.push({
                    el: cardEl,
                    item,
                    tier: tier.tier,
                    baseX: startX,
                    currentY: startY,
                    driftSpeedY: tier.speedY + (Math.random() - 0.5) * 3,
                    swayFreqX,
                    swayAmpX,
                    phaseX,
                    phaseY,
                    baseRotZ,
                    rotZSpeed,
                    rotZAmp,
                    tiltFreqX,
                    tiltFreqY,
                    scale: tier.scale,
                    maxOpacity: tier.opacity,
                    blur: tier.blur,
                    brightness: tier.brightness,
                    width,
                    height
                });
            }
        }

        onResize() {
            const prevWidth = this.width;
            this.width = this.container.clientWidth || window.innerWidth;
            this.height = this.container.clientHeight || window.innerHeight;
            const wasMobile = this.isMobile;
            this.isMobile = this.width < 768;

            if (this.canvas) {
                this.canvas.width = Math.round(this.width * this.dpr);
                this.canvas.height = Math.round(this.height * this.dpr);
                this.canvas.style.width = `${this.width}px`;
                this.canvas.style.height = `${this.height}px`;
                if (this.ctx) {
                    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
                }
            }

            // Re-stratify cards if crossing breakpoint or substantial screen resizing
            if (wasMobile !== this.isMobile || Math.abs(prevWidth - this.width) > 250) {
                this.initCards();
            }
        }

        togglePlay() {
            this.isPlaying = !this.isPlaying;
            return this.isPlaying;
        }

        drawUnderlay(dt) {
            if (!this.ctx) return;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.width, this.height);

            const cx = this.width / 2;
            const cy = this.height / 2;

            // 1. Subtle concentric HUD coordinate circles
            ctx.save();
            ctx.strokeStyle = 'rgba(225, 229, 238, 0.035)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 12]);

            [240, 460, 720].forEach(r => {
                ctx.beginPath();
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                ctx.stroke();
            });
            ctx.restore();

            // 2. Ambient star dust particles drifting upward
            ctx.save();
            this.particles.forEach(p => {
                if (this.isPlaying) {
                    p.y += p.vy * dt;
                    p.x += p.vx * dt;
                    p.pulsePhase += dt * 1.5;

                    if (p.y < -10) {
                        p.y = this.height + 10;
                        p.x = Math.random() * this.width;
                    }
                    if (p.x < 0) p.x = this.width;
                    if (p.x > this.width) p.x = 0;
                }

                const alpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(p.pulsePhase));
                ctx.fillStyle = `rgba(${p.color}, ${alpha.toFixed(2)})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }

        render(timestamp) {
            const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
            this.lastTime = timestamp;

            const t = timestamp / 1000;

            // Draw ambient particles
            this.drawUnderlay(dt);

            // Update weightless upward floating cards
            const margin = this.isMobile ? 16 : 48;
            const usableW = Math.max(160, this.width - margin * 2);

            this.cards.forEach((card) => {
                if (this.isPlaying) {
                    card.currentY -= card.driftSpeedY * this.speedMultiplier * dt;

                    // Wrap-around when drifting past the top edge
                    if (card.currentY < -card.height - 40) {
                        card.currentY = this.height + 30 + Math.random() * 50;
                        // Dynamically re-randomize horizontal position for fresh, non-repeating flight paths
                        card.baseX = margin + Math.random() * Math.max(10, usableW - card.width);
                    }
                }

                // Weightless horizontal sway
                const swayX = Math.sin(t * card.swayFreqX + card.phaseX) * card.swayAmpX
                            + Math.sin(t * 0.12 + card.phaseY) * 8;

                const posX = card.baseX + swayX;
                const posY = card.currentY;

                // Subtle weightless 3D tilt & gentle rocking
                const rotZ = card.baseRotZ + Math.sin(t * card.rotZSpeed + card.phaseX) * card.rotZAmp;
                const rotX = Math.sin(t * card.tiltFreqX + card.phaseY) * 5;
                const rotY = Math.cos(t * card.tiltFreqY + card.phaseX) * 5;

                // Soft fade in at bottom, soft fade out at top
                let edgeAlpha = 1.0;
                const fadeZone = 130;

                if (posY < fadeZone) {
                    edgeAlpha = Math.max(0, (posY + card.height) / (fadeZone + card.height));
                } else if (posY > this.height - fadeZone) {
                    edgeAlpha = Math.max(0, (this.height - posY + 40) / fadeZone);
                }

                const finalOpacity = (card.maxOpacity * Math.min(1.0, edgeAlpha)).toFixed(2);

                card.el.style.opacity = finalOpacity;
                card.el.style.transform = `translate3d(${posX.toFixed(1)}px, ${posY.toFixed(1)}px, 0) rotateZ(${rotZ.toFixed(2)}deg) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
            });

            requestAnimationFrame(this.render);
        }

        destroy() {
            window.removeEventListener('resize', this.onResize);
        }
    }

    window.HeroGalaxy = HeroGalaxy;
})();
