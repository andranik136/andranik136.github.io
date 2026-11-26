/**
 * Hero Slideshow - Full-Bleed 3D Art Ken Burns Background
 * Cycles through 3D Art renders full-width & full-height with subtle
 * Ken Burns pan/zoom motion and smooth crossfades (~4s per image).
 */

(function () {
    const KEN_BURNS_PRESETS = [
        { from: 'scale(1.00) translate3d(0%, 0%, 0)',      to: 'scale(1.085) translate3d(-1.4%, -0.9%, 0)' },
        { from: 'scale(1.085) translate3d(1.4%, -0.8%, 0)', to: 'scale(1.01) translate3d(-1.0%, 0.8%, 0)' },
        { from: 'scale(1.00) translate3d(-1.2%, 0.8%, 0)',  to: 'scale(1.08) translate3d(1.2%, -0.8%, 0)' },
        { from: 'scale(1.08) translate3d(0.8%, 1.0%, 0)',   to: 'scale(1.00) translate3d(-1.1%, -0.6%, 0)' }
    ];

    class HeroSlideshow {
        constructor(options = {}) {
            this.container = typeof options.container === 'string'
                ? document.querySelector(options.container)
                : options.container;

            if (!this.container) return;

            const rawItems = options.items || [];
            const filtered = rawItems.filter(item => !item.category || item.category === '3D Art');
            this.items = this.shuffle(filtered);

            if (this.items.length === 0) return;

            this.duration = options.duration || 4000;
            this.fadeDuration = options.fadeDuration || 1400;
            this.currentIndex = 0;
            this.activeSlot = 0;
            this.presetIndex = 0;
            this.timer = null;
            this.animations = [null, null];
            this.reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

            this.buildDOM();
            this.showSlide(0, true);
            this.preloadIndex(1);

            this.onVisibilityChange = this.onVisibilityChange.bind(this);
            document.addEventListener('visibilitychange', this.onVisibilityChange);

            this.start();
        }

        shuffle(list) {
            const arr = [...list];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        buildDOM() {
            this.container.innerHTML = '';

            this.slides = [0, 1].map(() => {
                const el = document.createElement('div');
                el.className = 'hero-slide';
                el.style.transitionDuration = `${this.fadeDuration}ms`;
                this.container.appendChild(el);
                return el;
            });
        }

        preloadIndex(idx) {
            if (this.items.length === 0) return;
            const item = this.items[idx % this.items.length];
            if (item && item.image) {
                const img = new Image();
                img.src = item.image;
            }
        }

        runKenBurns(el, slot) {
            if (this.animations[slot]) {
                this.animations[slot].cancel();
                this.animations[slot] = null;
            }

            if (this.reducedMotion || typeof el.animate !== 'function') {
                el.style.transform = 'scale(1.02)';
                return;
            }

            const preset = KEN_BURNS_PRESETS[this.presetIndex % KEN_BURNS_PRESETS.length];
            this.presetIndex++;

            // Keep motion running through the full hold + outgoing fade so it never freezes mid-dissolve
            const motionDuration = this.duration + this.fadeDuration + 500;
            this.animations[slot] = el.animate(
                [
                    { transform: preset.from },
                    { transform: preset.to }
                ],
                {
                    duration: motionDuration,
                    easing: 'linear',
                    fill: 'forwards'
                }
            );
        }

        showSlide(index, immediate = false) {
            const item = this.items[index];
            if (!item) return;

            const nextSlot = immediate ? 0 : (this.activeSlot === 0 ? 1 : 0);
            const incoming = this.slides[nextSlot];
            const outgoing = this.slides[this.activeSlot];

            incoming.style.backgroundImage = `url('${item.image}')`;
            incoming.dataset.title = item.title || '';

            if (immediate) {
                incoming.style.zIndex = '2';
                outgoing.style.zIndex = '1';
                incoming.classList.add('is-active');
                this.runKenBurns(incoming, nextSlot);
            } else {
                incoming.style.zIndex = '2';
                outgoing.style.zIndex = '1';

                // Start Ken Burns just before crossfade so incoming slide is already drifting
                this.runKenBurns(incoming, nextSlot);

                requestAnimationFrame(() => {
                    incoming.classList.add('is-active');
                    outgoing.classList.remove('is-active');
                });
            }

            this.activeSlot = nextSlot;
        }

        next() {
            if (this.items.length < 2) return;
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            this.showSlide(this.currentIndex, false);
            this.preloadIndex(this.currentIndex + 1);
        }

        start() {
            this.stop();
            if (this.items.length < 2) return;
            this.timer = setInterval(() => this.next(), this.duration);
        }

        stop() {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }

        onVisibilityChange() {
            if (document.hidden) {
                this.stop();
            } else {
                this.start();
            }
        }

        destroy() {
            this.stop();
            document.removeEventListener('visibilitychange', this.onVisibilityChange);
            this.animations.forEach(anim => anim && anim.cancel());
            this.animations = [null, null];
        }
    }

    window.HeroSlideshow = HeroSlideshow;
    window.HeroGalaxy = HeroSlideshow;
})();
