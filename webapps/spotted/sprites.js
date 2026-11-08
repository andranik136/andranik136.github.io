/**
 * Spotted - Procedural Pixel Art Sprite Generator
 * Generates all 16-bit GBA style sprites onto offscreen canvases.
 * Includes rounded sidewalk corners, Area 51 containment pods, and live aliens!
 */
class SpottedSprites {
  constructor() {
    this.cache = {};
    this.tileSize = 32;
    this.init();
  }

  init() {
    this.generateWorldTiles();
    this.generateInteriorTiles();
    this.generatePlayerSprites();
    this.generateNpcSprites();
    this.generateItemIcons();
    this.generateArea51Sprites();
    this.generateCarSprites();
  }

  createCanvas(w = this.tileSize, h = this.tileSize) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  px(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  drawCobblestones(ctx, x = 0, y = 0, w = 32, h = 32) {
    // Base mortar tone
    ctx.fillStyle = '#b7b2a8';
    ctx.fillRect(x, y, w, h);

    // Staggered interlocking cobblestone pavers (Castelia City plaza paving)
    const stones = [
      // Row 0
      { x: 1, y: 1, w: 9, h: 5 },
      { x: 11, y: 1, w: 10, h: 5 },
      { x: 22, y: 1, w: 9, h: 5 },
      // Row 1
      { x: 0, y: 7, w: 5, h: 5 },
      { x: 6, y: 7, w: 10, h: 5 },
      { x: 17, y: 7, w: 9, h: 5 },
      { x: 27, y: 7, w: 5, h: 5 },
      // Row 2
      { x: 1, y: 13, w: 9, h: 5 },
      { x: 11, y: 13, w: 10, h: 5 },
      { x: 22, y: 13, w: 9, h: 5 },
      // Row 3
      { x: 0, y: 19, w: 6, h: 5 },
      { x: 7, y: 19, w: 9, h: 5 },
      { x: 17, y: 19, w: 10, h: 5 },
      { x: 28, y: 19, w: 4, h: 5 },
      // Row 4
      { x: 1, y: 25, w: 10, h: 6 },
      { x: 12, y: 25, w: 9, h: 6 },
      { x: 22, y: 25, w: 9, h: 6 }
    ];

    stones.forEach(s => {
      // Individual paver slab
      ctx.fillStyle = '#dfded8';
      ctx.fillRect(x + s.x, y + s.y, s.w, s.h);
      // Top & Left highlight bevel
      ctx.fillStyle = '#f3f1eb';
      ctx.fillRect(x + s.x, y + s.y, s.w, 1);
      ctx.fillRect(x + s.x, y + s.y, 1, s.h);
      // Bottom & Right shadow
      ctx.fillStyle = '#c5c0b5';
      ctx.fillRect(x + s.x, y + s.y + s.h - 1, s.w, 1);
      ctx.fillRect(x + s.x + s.w - 1, y + s.y, 1, s.h);
    });
  }

  // ==========================================
  // 1. WORLD EXTERIOR TILES (POKÉMON B&W CASTELIA STYLE)
  // ==========================================
  generateWorldTiles() {
    const T = this.tileSize;

    // Grass & Pocket Lawn
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#2e7d32');
      this.px(ctx, 2, 2, T - 4, T - 4, '#388e3c');
      const blades = [[4, 6], [12, 14], [22, 5], [18, 24], [8, 22], [26, 18], [2, 16], [14, 2]];
      blades.forEach(([x, y]) => {
        this.px(ctx, x, y, 2, 4, '#4caf50');
        this.px(ctx, x + 1, y - 1, 1, 2, '#81c784');
        this.px(ctx, x, y + 3, 2, 1, '#1b5e20');
      });
      this.px(ctx, 16, 12, 2, 2, '#fff59d');
      this.px(ctx, 17, 13, 1, 1, '#f57f17');
      this.cache['grass'] = canvas;
    }

    // Straight Cobblestone Sidewalk / Plaza
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.cache['sidewalk'] = canvas;
      this.cache['plaza_cobble'] = canvas;
    }

    // Sidewalk with Top Concrete Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 0, 0, T, 3, '#64748b');
      this.px(ctx, 0, 3, T, 1, '#94a3b8');
      this.cache['sidewalk_curb_t'] = canvas;
    }

    // Sidewalk with Bottom Concrete Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 0, T - 3, T, 3, '#64748b');
      this.px(ctx, 0, T - 4, T, 1, '#334155');
      this.cache['sidewalk_curb_b'] = canvas;
    }

    // --- ROUNDED SIDEWALK CURB CORNERS (Castelia Intersection Curbs) ---
    // Top-Left Rounded Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#31353c'); // asphalt base
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(T, 0);
      ctx.lineTo(T, T);
      ctx.lineTo(0, T);
      ctx.arcTo(0, 0, T, 0, 18);
      ctx.closePath();
      ctx.clip();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.restore();

      ctx.strokeStyle = '#787f8d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(18, 18, 18, Math.PI, Math.PI * 1.5);
      ctx.stroke();
      this.cache['sidewalk_corner_tl'] = canvas;
    }

    // Top-Right Rounded Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#31353c');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, T);
      ctx.lineTo(T, T);
      ctx.arcTo(T, 0, 0, 0, 18);
      ctx.closePath();
      ctx.clip();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.restore();

      ctx.strokeStyle = '#787f8d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(T - 18, 18, 18, Math.PI * 1.5, Math.PI * 2);
      ctx.stroke();
      this.cache['sidewalk_corner_tr'] = canvas;
    }

    // Bottom-Left Rounded Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#31353c');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(T, 0);
      ctx.lineTo(T, T);
      ctx.arcTo(0, T, 0, 0, 18);
      ctx.closePath();
      ctx.clip();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.restore();

      ctx.strokeStyle = '#787f8d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(18, T - 18, 18, Math.PI * 0.5, Math.PI);
      ctx.stroke();
      this.cache['sidewalk_corner_bl'] = canvas;
    }

    // Bottom-Right Rounded Curb
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#31353c');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, T);
      ctx.lineTo(0, 0);
      ctx.lineTo(T, 0);
      ctx.arcTo(T, T, 0, T, 18);
      ctx.closePath();
      ctx.clip();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.restore();

      ctx.strokeStyle = '#787f8d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(T - 18, T - 18, 18, 0, Math.PI * 0.5);
      ctx.stroke();
      this.cache['sidewalk_corner_br'] = canvas;
    }

    // Charcoal Asphalt Road
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#31353c');
      const spots = [[3, 5], [14, 9], [22, 18], [9, 25], [26, 7], [18, 28]];
      spots.forEach(([x, y]) => {
        this.px(ctx, x, y, 2, 1, '#3a3f47');
        this.px(ctx, x + 1, y + 1, 1, 1, '#272a30');
      });
      this.cache['asphalt'] = canvas;
    }

    // White Dashed Horizontal Road Line
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['asphalt'], 0, 0);
      this.px(ctx, 4, 14, 24, 3, '#eaeff2');
      this.px(ctx, 4, 17, 24, 1, '#94a3b8');
      this.cache['road_stripe_h'] = canvas;
    }

    // White Dashed Vertical Road Line
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['asphalt'], 0, 0);
      this.px(ctx, 14, 4, 3, 24, '#eaeff2');
      this.px(ctx, 17, 4, 1, 24, '#94a3b8');
      this.cache['road_stripe_v'] = canvas;
    }

    // Rounded Zebra Pedestrian Crosswalk
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['asphalt'], 0, 0);
      const drawRoundedStripe = (sy) => {
        ctx.fillStyle = '#eaeff2';
        ctx.beginPath();
        ctx.roundRect(4, sy, 24, 6, 3);
        ctx.fill();
        this.px(ctx, 4, sy + 5, 24, 1, '#cbd5e1');
      };
      drawRoundedStripe(4);
      drawRoundedStripe(14);
      drawRoundedStripe(24);
      this.cache['road_crosswalk'] = canvas;
    }

    // Japanese "止まれ" (Stop) Stencil Road Markings (from reference image)
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['asphalt'], 0, 0);
      this.px(ctx, 4, 3, 24, 2, '#eaeff2'); // stop bar
      // "止"
      this.px(ctx, 15, 7, 2, 8, '#eaeff2');
      this.px(ctx, 10, 10, 5, 2, '#eaeff2');
      this.px(ctx, 17, 12, 5, 2, '#eaeff2');
      this.px(ctx, 9, 14, 14, 2, '#eaeff2');
      // "ま"
      this.px(ctx, 10, 18, 12, 1, '#eaeff2');
      this.px(ctx, 11, 21, 10, 1, '#eaeff2');
      this.px(ctx, 15, 17, 2, 7, '#eaeff2');
      this.px(ctx, 13, 23, 4, 2, '#eaeff2');
      // "れ"
      this.px(ctx, 11, 26, 2, 5, '#eaeff2');
      this.px(ctx, 13, 26, 8, 1, '#eaeff2');
      this.px(ctx, 16, 27, 2, 3, '#eaeff2');
      this.px(ctx, 17, 29, 3, 2, '#eaeff2');
      this.cache['road_stop_kanji'] = canvas;
    }

    // Elevated Highway Overpass (from reference image)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#3b4149');
      this.px(ctx, 0, 2, T, 2, '#eaeff2');
      this.px(ctx, 0, T - 4, T, 2, '#eaeff2');
      this.px(ctx, 0, 15, T, 2, '#facc15');
      this.cache['overpass_road'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, 4, '#1e293b');
      this.px(ctx, 0, 4, T, 6, '#64748b');
      this.px(ctx, 0, 10, T, 3, '#94a3b8');
      this.px(ctx, 4, 2, 4, 12, '#334155');
      this.px(ctx, 20, 2, 4, 12, '#334155');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.fillRect(0, 14, T, 18);
      this.cache['overpass_rail'] = canvas;
    }

    // Waterfront Ocean & Harbor (from reference image)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1d4ed8');
      const waves = [
        [2, 6, 8], [14, 4, 12], [28, 7, 4],
        [6, 14, 10], [20, 13, 10],
        [1, 22, 12], [16, 21, 14],
        [8, 28, 14], [24, 27, 7]
      ];
      waves.forEach(([wx, wy, wl]) => {
        this.px(ctx, wx, wy, wl, 1, '#60a5fa');
        this.px(ctx, wx + 1, wy + 1, wl - 2, 1, '#93c5fd');
        this.px(ctx, wx + Math.floor(wl / 2), wy - 1, 1, 1, '#ffffff');
      });
      this.cache['water'] = canvas;
    }

    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 0, 0, T, 2, '#64748b');
      this.px(ctx, 0, 2, T, 1, '#94a3b8');
      this.cache['pier_stone'] = canvas;
    }

    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['water'], 0, 0);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.5)';
      ctx.beginPath();
      ctx.ellipse(16, 24, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 11, 6, 10, 18, '#78350f');
      this.px(ctx, 12, 6, 8, 18, '#92400e');
      this.px(ctx, 13, 6, 2, 18, '#b45309');
      ctx.fillStyle = '#a16207';
      ctx.beginPath();
      ctx.ellipse(16, 6, 5, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 10, 12, 12, 3, '#facc15');
      this.px(ctx, 11, 13, 10, 1, '#ca8a04');
      this.cache['pier_wood_post'] = canvas;
    }

    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, 8);
      this.px(ctx, 0, 8, T, 14, '#475569');
      this.px(ctx, 0, 8, T, 2, '#94a3b8');
      this.px(ctx, 8, 10, 2, 12, '#334155');
      this.px(ctx, 22, 10, 2, 12, '#334155');
      this.px(ctx, 0, 22, T, 10, '#1d4ed8');
      this.px(ctx, 0, 22, T, 2, '#93c5fd');
      this.px(ctx, 0, 24, T, 1, '#60a5fa');
      this.cache['pier_seawall'] = canvas;
    }

    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#64748b');
      this.px(ctx, 4, 2, 24, 7, '#e2e8f0');
      this.px(ctx, 4, 8, 24, 2, '#94a3b8');
      this.px(ctx, 4, 11, 24, 7, '#cbd5e1');
      this.px(ctx, 4, 17, 24, 2, '#64748b');
      this.px(ctx, 4, 20, 24, 7, '#94a3b8');
      this.px(ctx, 4, 26, 24, 2, '#475569');
      this.px(ctx, 2, 0, 2, T, '#1e293b');
      this.px(ctx, 28, 0, 2, T, '#1e293b');
      this.cache['pier_stairs'] = canvas;
    }

    // Modern High-Rise Skyscraper Glass Facade (Castelia Style)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#334155');
      this.px(ctx, 0, 0, T, 2, '#475569');
      this.px(ctx, 0, 15, T, 2, '#475569');
      this.px(ctx, 0, T - 2, T, 2, '#1e293b');

      const drawPane = (px, py, pw, ph) => {
        this.px(ctx, px, py, pw, ph, '#0284c7');
        this.px(ctx, px + 1, py + 1, pw - 2, ph - 2, '#38bdf8');
        this.px(ctx, px + 2, py + ph - 4, 2, 2, '#e0f2fe');
        this.px(ctx, px + 5, py + ph - 7, 3, 3, '#e0f2fe');
        this.px(ctx, px + pw - 4, py + 2, 2, 2, '#e0f2fe');
        this.px(ctx, px, py, pw, 1, '#0369a1');
        this.px(ctx, px, py, 1, ph, '#0369a1');
      };

      drawPane(2, 3, 13, 11);
      drawPane(17, 3, 13, 11);
      drawPane(2, 18, 13, 11);
      drawPane(17, 18, 13, 11);
      this.cache['skyscraper_glass'] = canvas;
      this.cache['brick_blue'] = canvas;
    }

    // Skyscraper Balcony
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      this.px(ctx, 0, 0, T, 16, '#334155');
      this.px(ctx, 0, 16, T, 2, '#94a3b8');
      this.px(ctx, 0, 24, T, 2, '#94a3b8');
      for (let x = 2; x < T; x += 6) {
        this.px(ctx, x, 16, 2, 10, '#64748b');
      }
      this.px(ctx, 0, 26, T, 6, '#475569');
      this.cache['skyscraper_balcony'] = canvas;
    }

    // Skyscraper Ground Base
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      this.px(ctx, 2, 2, T - 4, T - 4, '#334155');
      this.px(ctx, 4, 4, T - 8, T - 8, '#475569');
      this.px(ctx, 2, 2, T - 4, 1, '#94a3b8');
      this.px(ctx, 0, T - 3, T, 3, '#0f172a');
      this.cache['skyscraper_base'] = canvas;
      this.cache['brick_tan'] = canvas;
      this.cache['brick_red'] = canvas;
    }

    // Skyscraper Flat Gravel Roof
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#334155');
      const specks = [[4, 6], [12, 18], [22, 8], [16, 24], [26, 22], [8, 12]];
      specks.forEach(([sx, sy]) => {
        this.px(ctx, sx, sy, 2, 2, '#475569');
        this.px(ctx, sx + 1, sy + 1, 1, 1, '#1e293b');
      });
      this.px(ctx, 0, 0, T, 3, '#64748b');
      this.px(ctx, 0, 0, 3, T, '#64748b');
      this.px(ctx, T - 3, 0, 3, T, '#475569');
      this.px(ctx, 0, T - 3, T, 3, '#1e293b');
      this.cache['skyscraper_roof'] = canvas;
      this.cache['roof_slate'] = canvas;
    }

    // Traditional Kawara Curved Roof Tiles
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#374151');
      for (let y = 0; y < T; y += 8) {
        this.px(ctx, 0, y, T, 2, '#4b5563');
        this.px(ctx, 0, y + 2, T, 4, '#1f2937');
        this.px(ctx, 0, y + 6, T, 2, '#111827');
        for (let x = 0; x < T; x += 8) {
          ctx.fillStyle = '#4b5563';
          ctx.beginPath();
          ctx.arc(x + 4, y + 7, 3, 0, Math.PI);
          ctx.fill();
        }
      }
      this.cache['roof_kawara'] = canvas;
      this.cache['roof_terra'] = canvas;
    }

    // Rooftop AC Compressor Unit
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['skyscraper_roof'], 0, 0);
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(4, 6, 24, 20, 3);
      ctx.fill();
      this.px(ctx, 6, 8, 20, 16, '#475569');
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(16, 16, 7, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 15, 10, 2, 12, '#94a3b8');
      this.px(ctx, 10, 15, 12, 2, '#94a3b8');
      this.px(ctx, 22, 4, 3, 8, '#b45309');
      this.cache['roof_ac'] = canvas;
    }

    // Rooftop Satellite Dish
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.drawImage(this.cache['skyscraper_roof'], 0, 0);
      this.px(ctx, 15, 18, 2, 10, '#334155');
      this.px(ctx, 10, 26, 12, 2, '#334155');
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(16, 12, 11, 7, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(16, 12, 9, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 15, 8, 2, 6, '#475569');
      this.px(ctx, 14, 7, 4, 2, '#ef4444');
      this.cache['roof_satellite'] = canvas;
    }

    // Alien Medical Center (Pokecenter spoof with red roof & saucer emblem!)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#dc2626');
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(4, 2, T, T - 2, [12, 0, 0, 0]);
      ctx.fill();
      this.px(ctx, 0, T - 5, T, 5, '#ffffff');
      this.px(ctx, 0, T - 2, T, 2, '#cbd5e1');
      this.cache['pokecenter_roof_l'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#dc2626');
      this.px(ctx, 0, 2, T, T - 4, '#ef4444');
      this.px(ctx, 0, T - 5, T, 5, '#ffffff');
      this.px(ctx, 0, T - 2, T, 2, '#cbd5e1');

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(16, 15, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(16, 14, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16, 13, 3, Math.PI, 0);
      ctx.fillStyle = '#86efac';
      ctx.fill();
      this.cache['pokecenter_roof_m'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#dc2626');
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.roundRect(0, 2, T - 4, T - 2, [0, 12, 0, 0]);
      ctx.fill();
      this.px(ctx, 0, T - 5, T, 5, '#ffffff');
      this.px(ctx, 0, T - 2, T, 2, '#cbd5e1');
      this.cache['pokecenter_roof_r'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#f8fafc');
      this.px(ctx, 0, 4, T, 3, '#dc2626');
      this.px(ctx, 4, 8, 11, 24, '#38bdf8');
      this.px(ctx, 17, 8, 11, 24, '#38bdf8');
      this.px(ctx, 4, 8, 24, 2, '#0284c7');
      this.px(ctx, 15, 16, 2, 8, '#ffffff');
      this.cache['pokecenter_wall'] = canvas;
    }

    // Battle / Tech Tower (Indigo building from image)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#6d28d9');
      this.px(ctx, 2, 2, T - 4, T - 4, '#7c3aed');
      this.px(ctx, 0, T - 4, T, 4, '#4c1d95');
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(16, 14, 7, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 14, 11, 4, 6, '#ffffff');
      this.cache['tech_tower_roof'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e1b4b');
      this.px(ctx, 2, 2, 13, 26, '#312e81');
      this.px(ctx, 17, 2, 13, 26, '#312e81');
      this.px(ctx, 4, 4, 9, 22, '#6366f1');
      this.px(ctx, 19, 4, 9, 22, '#6366f1');
      this.cache['tech_tower_wall'] = canvas;
    }

    // Market Food / Souvenir Stall
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      for (let x = 2; x < T - 2; x += 6) {
        const isRed = ((x - 2) / 6) % 2 === 0;
        ctx.fillStyle = isRed ? '#dc2626' : '#ffffff';
        ctx.fillRect(x, 4, 6, 12);
        ctx.beginPath();
        ctx.arc(x + 3, 16, 3, 0, Math.PI);
        ctx.fill();
      }
      this.px(ctx, 4, 18, 24, 10, '#854d0e');
      this.px(ctx, 6, 20, 20, 6, '#a16207');
      this.px(ctx, 8, 17, 4, 3, '#ef4444');
      this.px(ctx, 14, 17, 4, 3, '#22c55e');
      this.px(ctx, 20, 17, 4, 3, '#eab308');
      this.cache['market_stall'] = canvas;
    }

    // Red Chinatown / Torii Street Archway
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 10, 0, 12, T, '#dc2626');
      this.px(ctx, 12, 0, 8, T, '#ef4444');
      this.px(ctx, 8, T - 6, 16, 6, '#475569');
      this.cache['archway_post'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 12, T, 8, '#dc2626');
      this.px(ctx, 0, 14, T, 4, '#ef4444');
      this.px(ctx, 0, 6, T, 6, '#ca8a04');
      this.px(ctx, 0, 4, T, 2, '#eab308');
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 24, 5, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 15, 20, 2, 3, '#dc2626');
      this.cache['archway_beam'] = canvas;
    }

    // Red Beverage Vending Machine
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(6, 4, 20, 26, 3);
      ctx.fill();
      this.px(ctx, 8, 6, 16, 4, '#ffffff');
      this.px(ctx, 10, 7, 12, 2, '#38bdf8');
      this.px(ctx, 8, 12, 16, 9, '#1e293b');
      this.px(ctx, 10, 14, 2, 3, '#ef4444');
      this.px(ctx, 14, 14, 2, 3, '#3b82f6');
      this.px(ctx, 18, 14, 2, 3, '#22c55e');
      this.px(ctx, 10, 18, 2, 2, '#eab308');
      this.px(ctx, 14, 18, 2, 2, '#ffffff');
      this.px(ctx, 18, 18, 2, 2, '#a855f7');
      this.px(ctx, 21, 23, 2, 3, '#475569');
      this.px(ctx, 9, 25, 10, 4, '#111827');
      this.cache['vending_machine_red'] = canvas;
    }

    // Blue Beverage Vending Machine
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.roundRect(6, 4, 20, 26, 3);
      ctx.fill();
      this.px(ctx, 8, 6, 16, 4, '#ffffff');
      this.px(ctx, 10, 7, 12, 2, '#ef4444');
      this.px(ctx, 8, 12, 16, 9, '#1e293b');
      this.px(ctx, 10, 14, 2, 3, '#38bdf8');
      this.px(ctx, 14, 14, 2, 3, '#60a5fa');
      this.px(ctx, 18, 14, 2, 3, '#93c5fd');
      this.px(ctx, 21, 23, 2, 3, '#475569');
      this.px(ctx, 9, 25, 10, 4, '#111827');
      this.cache['vending_machine_blue'] = canvas;
    }

    // Giant Rooftop Billboard with Alien Mascot Art!
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#334155');
      this.px(ctx, 2, 2, T - 4, T - 4, '#0f172a');
      this.px(ctx, 4, 4, T - 8, T - 8, '#1e293b');
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(16, 15, 7, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 12, 13, 2, 4, '#052e16');
      this.px(ctx, 18, 13, 2, 4, '#052e16');
      this.px(ctx, 13, 14, 1, 1, '#ffffff');
      this.px(ctx, 19, 14, 1, 1, '#ffffff');
      this.px(ctx, 6, 25, 20, 2, '#ef4444');
      this.cache['billboard_alien'] = canvas;
    }

    // Storefront Window (Glass pane)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#24323f');
      ctx.fillStyle = '#1b637d';
      ctx.beginPath();
      ctx.roundRect(2, 2, T - 4, T - 4, [6, 6, 2, 2]);
      ctx.fill();
      ctx.fillStyle = '#268ba8';
      ctx.beginPath();
      ctx.roundRect(4, 4, T - 8, T - 8, [5, 5, 1, 1]);
      ctx.fill();
      this.px(ctx, 6, 18, 3, 3, '#77d4ec');
      this.px(ctx, 12, 12, 4, 4, '#77d4ec');
      this.px(ctx, 18, 6, 3, 3, '#77d4ec');
      this.cache['store_window'] = canvas;
    }

    // Doors
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(4, 2, T - 8, T - 2, [5, 5, 0, 0]);
      ctx.fill();
      this.px(ctx, 7, 6, 8, 9, '#475569');
      this.px(ctx, 17, 6, 8, 9, '#475569');
      this.px(ctx, 7, 18, 8, 9, '#475569');
      this.px(ctx, 17, 18, 8, 9, '#475569');
      this.px(ctx, 23, 16, 3, 3, '#f5c531');
      this.cache['door_house'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(2, 2, T - 4, T - 2, [4, 4, 0, 0]);
      ctx.fill();
      this.px(ctx, 4, 4, 11, T - 6, '#38bdf8');
      this.px(ctx, 17, 4, 11, T - 6, '#38bdf8');
      this.px(ctx, 13, 13, 2, 7, '#d5dde2');
      this.px(ctx, 17, 13, 2, 7, '#d5dde2');
      this.cache['door_store'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(3, 2, T - 6, T - 2, [4, 4, 0, 0]);
      ctx.fill();
      this.px(ctx, 21, 14, 4, 6, '#222');
      this.px(ctx, 22, 15, 2, 2, '#ff3344');
      this.px(ctx, 3, T - 4, T - 6, 4, '#eedd22');
      this.cache['door_office'] = canvas;
    }

    // Awnings
    {
      const makeAwning = (c1, c2) => {
        const { canvas, ctx } = this.createCanvas();
        for (let x = 0; x < T; x += 8) {
          const col = (x / 8) % 2 === 0 ? c1 : c2;
          this.px(ctx, x, 0, 8, T - 6, col);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(x + 4, T - 4, 3.5, 0, Math.PI);
          ctx.fill();
        }
        this.px(ctx, 0, T - 2, T, 2, '#1a1f26');
        return canvas;
      };
      this.cache['awning_red'] = makeAwning('#dc3232', '#f3f4f6');
      this.cache['awning_blue'] = makeAwning('#2563eb', '#f3f4f6');
      this.cache['awning_green'] = makeAwning('#16a34a', '#f3f4f6');
      this.cache['awning_neon'] = makeAwning('#a855f7', '#22c55e');
    }

    // Puffy Round Pokémon-Style Segmented Tree
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 13, 18, 6, 12, '#5c381c');
      this.px(ctx, 11, 27, 10, 3, '#451a03');

      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(16, 13, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(15, 12, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(12, 9, 6, 0, Math.PI * 2);
      ctx.arc(19, 10, 6, 0, Math.PI * 2);
      ctx.arc(15, 14, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.arc(13, 7, 3, 0, Math.PI * 2);
      ctx.arc(17, 8, 3, 0, Math.PI * 2);
      ctx.fill();
      this.cache['tree'] = canvas;
    }

    // Tree in Sidewalk Stone Planter Box with Iron Grate
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 4, 4, 24, 24, '#94a3b8');
      this.px(ctx, 6, 6, 20, 20, '#451a03');
      this.px(ctx, 8, 8, 16, 16, '#334155');
      this.px(ctx, 13, 6, 6, 16, '#5c381c');
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(16, 10, 7, 0, Math.PI * 2);
      ctx.fill();
      this.cache['tree_planter'] = canvas;
    }

    // Cast-Iron Victorian Twin-Globe Streetlamp
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 14, 6, 4, 22, '#1e293b');
      this.px(ctx, 12, 26, 8, 4, '#0f172a');
      this.px(ctx, 8, 8, 16, 3, '#1e293b');
      const drawLantern = (lx) => {
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(lx, 11, 4.5, 0, Math.PI * 2);
        ctx.fill();
        this.px(ctx, lx - 4, 5, 8, 2, '#1e293b');
        this.px(ctx, lx - 2, 3, 4, 2, '#1e293b');
      };
      drawLantern(8);
      drawLantern(24);
      this.cache['street_lamp'] = canvas;
    }

    // Mint Green Park Bench
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 4, 18, 3, 9, '#1e293b');
      this.px(ctx, 25, 18, 3, 9, '#1e293b');
      this.px(ctx, 3, 12, 26, 3, '#10b981');
      this.px(ctx, 3, 16, 26, 3, '#10b981');
      this.px(ctx, 3, 20, 26, 4, '#059669');
      this.px(ctx, 3, 14, 2, 8, '#1e293b');
      this.px(ctx, 27, 14, 2, 8, '#1e293b');
      this.cache['bench'] = canvas;
    }

    // Circular Stop Sign on Post
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 15, 12, 2, 18, '#94a3b8');
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(16, 10, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      this.px(ctx, 11, 9, 10, 2, '#ffffff');
      this.cache['sign_stop'] = canvas;
    }

    // Fire Hydrant
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.fillStyle = '#d92c2c';
      ctx.beginPath();
      ctx.roundRect(10, 10, 12, 18, 3);
      ctx.fill();
      this.px(ctx, 8, 14, 16, 4, '#c02020');
      this.px(ctx, 8, 26, 16, 5, '#8c1616');
      this.cache['hydrant'] = canvas;
    }

    // Sidewalk Trash Can
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(8, 10, 16, 18, 3);
      ctx.fill();
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(6, 7, 20, 4, 2);
      ctx.fill();
      this.cache['trash_can'] = canvas;
    }

    // Sidewalk Newspaper Dispenser Box ("The Oakhaven Inquirer")
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      this.px(ctx, 10, 24, 12, 6, '#1e293b');
      this.px(ctx, 8, 28, 16, 3, '#0f172a');
      ctx.fillStyle = '#1e40af';
      ctx.beginPath();
      ctx.roundRect(6, 6, 20, 19, 3);
      ctx.fill();
      this.px(ctx, 11, 4, 10, 3, '#1d4ed8');
      this.px(ctx, 13, 3, 6, 2, '#3b82f6');
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(8, 9, 16, 11, 2);
      ctx.fill();
      this.px(ctx, 10, 11, 12, 8, '#f8fafc');
      this.px(ctx, 11, 12, 10, 2, '#dc2626');
      this.px(ctx, 11, 15, 8, 1, '#64748b');
      this.px(ctx, 11, 17, 9, 1, '#64748b');
      this.px(ctx, 19, 10, 3, 3, '#93c5fd');
      this.px(ctx, 13, 21, 6, 2, '#f59e0b');
      this.px(ctx, 15, 21, 2, 2, '#1e293b');
      this.cache['newspaper_box'] = canvas;
    }

    // Crop Circle & Slime
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, 16, 11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, 16, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#86efac';
      ctx.fill();
      this.cache['crop_circle'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.drawCobblestones(ctx, 0, 0, T, T);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(16, 16, 12, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.ellipse(16, 15, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      this.cache['slime_puddle'] = canvas;
    }
  }

  // ==========================================
  // 2. INTERIOR TILES & AREA 51
  // ==========================================
  generateInteriorTiles() {
    const T = this.tileSize;

    // Wood Floor
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#a0683a');
      this.px(ctx, 0, 0, T, 1, '#b87c4a');
      this.px(ctx, 0, 16, T, 1, '#b87c4a');
      this.cache['floor_wood'] = canvas;
    }
    // Diner Checker
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#e5e7eb');
      this.px(ctx, 0, 0, 16, 16, '#26292d');
      this.px(ctx, 16, 16, 16, 16, '#26292d');
      this.cache['floor_checker'] = canvas;
    }
    // Office Carpet
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#3b556e');
      this.px(ctx, 4, 4, 2, 2, '#486682');
      this.cache['floor_carpet'] = canvas;
    }
    // Gym Floor
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1f2429');
      this.px(ctx, 6, 8, 1, 1, '#3b82f6');
      this.cache['floor_gym'] = canvas;
    }
    // Area 51 High-Tech Metal Grate Floor
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      this.px(ctx, 0, 0, T, 1, '#334155');
      this.px(ctx, 0, 0, 1, T, '#334155');
      // Hazard diagonal yellow/black stripe at edges
      for (let i = 0; i < T; i += 8) {
        this.px(ctx, i, 0, 4, 2, '#eab308');
        this.px(ctx, i, T - 2, 4, 2, '#eab308');
      }
      this.cache['floor_area51'] = canvas;
    }
    // Area 51 High-Security Wall
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#0f172a');
      this.px(ctx, 2, 2, T - 4, T - 4, '#1e293b');
      // Glowing warning neon red conduit
      this.px(ctx, 0, 14, T, 3, '#ef4444');
      this.px(ctx, 0, 15, T, 1, '#fca5a5');
      this.cache['wall_area51'] = canvas;
    }

    // Standard Interior Wall
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T - 6, '#ded6c7');
      this.px(ctx, 0, T - 6, T, 6, '#6b4124');
      this.cache['wall_interior'] = canvas;
    }

    // Furniture
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 4, T, 12, '#93532a');
      this.px(ctx, 0, 16, T, 16, '#563017');
      this.cache['counter_wood'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 14, 14, 4, 14, '#9ca3af');
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(16, 12, 8, 0, Math.PI * 2);
      ctx.fill();
      this.cache['bar_stool'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(4, 6, 24, 18, 4);
      ctx.fill();
      this.px(ctx, 12, 10, 3, 6, '#dc2626');
      this.px(ctx, 17, 10, 3, 6, '#eab308');
      this.cache['diner_table'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 6, 28, 24, '#7c5234');
      this.px(ctx, 8, 8, 16, 12, '#d1d5db');
      this.px(ctx, 10, 10, 12, 8, '#0d1d13');
      this.px(ctx, 11, 11, 10, 6, '#22c55e');
      this.cache['office_desk'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 2, 24, 28, '#4b5563');
      this.px(ctx, 6, 4, 20, 7, '#6b7280');
      this.px(ctx, 6, 13, 20, 7, '#6b7280');
      this.px(ctx, 6, 22, 20, 7, '#6b7280');
      this.px(ctx, 18, 5, 6, 4, '#ef4444');
      this.cache['filing_cabinet'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 8, 14, 16, 16, '#e5e7eb');
      this.px(ctx, 10, 2, 12, 12, '#22c55e');
      this.px(ctx, 12, 4, 8, 8, '#86efac');
      this.cache['water_cooler'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 6, 20, 24, '#374151');
      this.px(ctx, 8, 8, 16, 20, '#111827');
      this.cache['treadmill'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 12, 24, 4, '#9ca3af');
      this.px(ctx, 6, 8, 4, 12, '#1f2937');
      this.px(ctx, 14, 8, 4, 12, '#1f2937');
      this.px(ctx, 22, 8, 4, 12, '#1f2937');
      this.cache['weight_rack'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 4, 28, 24, '#7c4a27');
      this.px(ctx, 5, 7, 22, 18, '#15803d');
      this.cache['pool_table'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 4, 20, 26, '#a855f7');
      this.px(ctx, 8, 6, 16, 8, '#ec4899');
      this.cache['jukebox'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 6, 24, 22, '#5c3317');
      this.px(ctx, 7, 9, 14, 12, '#d1d5db');
      this.px(ctx, 9, 2, 2, 5, '#9ca3af');
      this.px(ctx, 19, 2, 2, 5, '#9ca3af');
      this.cache['tv_static'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#1e6f5c';
      ctx.beginPath();
      ctx.roundRect(2, 8, 28, 18, 4);
      ctx.fill();
      this.cache['couch'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#5a341a');
      this.px(ctx, 4, 10, 24, 2, '#7e4b27');
      this.px(ctx, 4, 20, 24, 2, '#7e4b27');
      this.cache['bookshelf'] = canvas;
    }
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(2, 6, 28, 20, 4);
      ctx.fill();
      this.px(ctx, 14, 12, 4, 8, '#fef08a');
      this.cache['exit_mat'] = canvas;
    }

    // Diner Booth (Red leather tufted seat)
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(2, 4, 28, 26, 4);
      ctx.fill();
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(4, 6, 24, 22, 3);
      ctx.fill();
      for (let x = 6; x <= 22; x += 5) {
        this.px(ctx, x, 8, 2, 18, '#b91c1c');
      }
      this.px(ctx, 4, 26, 24, 2, '#cbd5e1');
      this.cache['diner_booth'] = canvas;
    }

    // Commercial Burger Grill with sizzling patties
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 2, T, T - 2, '#475569');
      this.px(ctx, 2, 4, 28, 24, '#334155');
      this.px(ctx, 4, 6, 24, 20, '#1e293b');
      const burgers = [[6, 8], [16, 8], [11, 16]];
      burgers.forEach(([bx, by]) => {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.ellipse(bx + 4, by + 3, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        this.px(ctx, bx + 2, by + 2, 2, 1, '#f59e0b');
        this.px(ctx, bx + 5, by + 4, 2, 1, '#ea580c');
      });
      this.cache['burger_grill'] = canvas;
    }

    // Diner Coffee Brewer Station
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 26, '#64748b');
      this.px(ctx, 6, 6, 20, 22, '#94a3b8');
      this.px(ctx, 8, 12, 7, 10, '#451a03');
      this.px(ctx, 17, 12, 7, 10, '#78350f');
      this.px(ctx, 9, 14, 2, 6, '#fde047');
      this.px(ctx, 8, 8, 3, 2, '#ef4444');
      this.px(ctx, 14, 8, 3, 2, '#22c55e');
      this.cache['coffee_brewer'] = canvas;
    }

    // Chalkboard Specials Menu
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#78350f');
      this.px(ctx, 4, 4, 24, 24, '#1e293b');
      this.px(ctx, 6, 8, 20, 2, '#fef08a');
      this.px(ctx, 6, 13, 14, 1, '#f8fafc');
      this.px(ctx, 6, 17, 18, 1, '#f8fafc');
      this.px(ctx, 6, 21, 10, 1, '#4ade80');
      this.cache['diner_chalkboard'] = canvas;
    }

    // Vintage Cash Register
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 16, 24, 14, '#78350f');
      this.px(ctx, 6, 6, 20, 12, '#94a3b8');
      this.px(ctx, 8, 4, 16, 4, '#cbd5e1');
      this.px(ctx, 10, 2, 12, 3, '#052e16');
      this.px(ctx, 11, 2, 10, 2, '#22c55e');
      this.px(ctx, 8, 10, 16, 6, '#334155');
      this.cache['cash_register'] = canvas;
    }

    // Condiments Caddy (Ketchup, Mustard, Napkins)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 16, 20, 12, '#475569');
      this.px(ctx, 8, 6, 5, 12, '#dc2626');
      this.px(ctx, 9, 3, 3, 3, '#ffffff');
      this.px(ctx, 15, 6, 5, 12, '#eab308');
      this.px(ctx, 16, 3, 3, 3, '#ffffff');
      this.px(ctx, 22, 8, 3, 10, '#f8fafc');
      this.cache['condiments_caddy'] = canvas;
    }

    // Retail Snack Gondola Shelf
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#475569');
      this.px(ctx, 4, 4, 24, 6, '#1e293b');
      this.px(ctx, 4, 13, 24, 6, '#1e293b');
      this.px(ctx, 4, 22, 24, 6, '#1e293b');
      const boxCols = ['#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
      for (let i = 0; i < 5; i++) {
        this.px(ctx, 5 + i * 4.5, 5, 3, 5, boxCols[i]);
        this.px(ctx, 5 + i * 4.5, 14, 3, 5, boxCols[(i + 2) % 5]);
        this.px(ctx, 5 + i * 4.5, 23, 3, 5, boxCols[(i + 4) % 5]);
      }
      this.cache['retail_shelf_snacks'] = canvas;
    }

    // Retail Beverage Cooler (Glass front with glowing cans)
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#0f172a');
      this.px(ctx, 4, 4, 24, 4, '#38bdf8');
      this.px(ctx, 4, 8, 24, 20, '#0284c7');
      this.px(ctx, 6, 10, 20, 16, '#0369a1');
      for (let y = 11; y <= 21; y += 6) {
        for (let x = 7; x <= 22; x += 5) {
          this.px(ctx, x, y, 3, 4, (x % 2 === 0) ? '#22c55e' : '#ef4444');
        }
      }
      this.px(ctx, 7, 9, 3, 17, '#e0f2fe');
      this.cache['retail_cooler_drinks'] = canvas;
    }

    // Magazine & Tabloid Wire Rack
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 4, 20, 26, '#334155');
      this.px(ctx, 8, 6, 16, 6, '#f8fafc');
      this.px(ctx, 9, 7, 14, 2, '#dc2626');
      this.px(ctx, 8, 14, 16, 6, '#fef08a');
      this.px(ctx, 9, 15, 14, 2, '#2563eb');
      this.px(ctx, 8, 22, 16, 6, '#86efac');
      this.px(ctx, 9, 23, 14, 2, '#052e16');
      this.cache['magazine_rack'] = canvas;
    }

    // Metal Wire Shopping Cart
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 8, 20, 16, '#94a3b8');
      this.px(ctx, 8, 10, 16, 12, '#cbd5e1');
      this.px(ctx, 4, 8, 3, 10, '#dc2626');
      this.px(ctx, 8, 24, 4, 4, '#0f172a');
      this.px(ctx, 20, 24, 4, 4, '#0f172a');
      this.cache['shopping_cart'] = canvas;
    }

    // Brass Draft Beer Taps
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 16, T, 16, '#5c3317');
      this.px(ctx, 8, 14, 16, 4, '#475569');
      this.px(ctx, 10, 6, 12, 10, '#ca8a04');
      this.px(ctx, 12, 3, 2, 4, '#111827');
      this.px(ctx, 15, 3, 2, 4, '#111827');
      this.px(ctx, 18, 3, 2, 4, '#111827');
      this.cache['beer_taps'] = canvas;
    }

    // Back-Bar Mirrored Liquor Shelves
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 0, T, T, '#1e293b');
      this.px(ctx, 2, 2, 28, 28, '#0f172a');
      const bCols = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
      for (let row = 0; row < 3; row++) {
        const ry = 6 + row * 8;
        this.px(ctx, 2, ry + 6, 28, 2, '#64748b');
        for (let col = 0; col < 5; col++) {
          this.px(ctx, 5 + col * 5, ry, 3, 6, bCols[(row + col) % bCols.length]);
          this.px(ctx, 6 + col * 5, ry - 1, 1, 1, '#f8fafc');
        }
      }
      this.cache['liquor_shelf'] = canvas;
    }

    // Retro Arcade Cabinet ("GALAXY")
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 2, 24, 28, '#0f172a');
      this.px(ctx, 6, 4, 20, 6, '#ec4899');
      this.px(ctx, 8, 5, 16, 4, '#fde047');
      this.px(ctx, 6, 11, 20, 11, '#0284c7');
      this.px(ctx, 14, 14, 4, 3, '#22c55e');
      this.px(ctx, 13, 17, 6, 2, '#22c55e');
      this.px(ctx, 6, 22, 20, 4, '#334155');
      this.px(ctx, 10, 21, 2, 3, '#ef4444');
      this.px(ctx, 18, 23, 2, 2, '#38bdf8');
      this.px(ctx, 21, 23, 2, 2, '#facc15');
      this.cache['arcade_cabinet'] = canvas;
    }

    // Bristle Dartboard
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 24, '#78350f');
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(16, 16, 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(16, 16, 2, 0, Math.PI * 2);
      ctx.fill();
      this.cache['dartboard'] = canvas;
    }

    // Pub Candle Table
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#5c3317';
      ctx.beginPath();
      ctx.arc(16, 16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 14, 12, 4, 5, '#ca8a04');
      this.px(ctx, 15, 10, 2, 3, '#fef08a');
      this.cache['candle_table'] = canvas;
    }

    // Heavy Vinyl Punching Bag
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 15, 0, 2, 8, '#94a3b8');
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(10, 8, 12, 22, 5);
      ctx.fill();
      this.px(ctx, 10, 10, 12, 3, '#111827');
      this.px(ctx, 12, 18, 8, 4, '#ffffff');
      this.cache['punching_bag'] = canvas;
    }

    // Olympic Bench Press with Barbell
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 12, 4, 8, 24, '#1f2937');
      this.px(ctx, 13, 6, 6, 20, '#374151');
      this.px(ctx, 4, 10, 24, 2, '#cbd5e1');
      this.px(ctx, 4, 7, 3, 8, '#0f172a');
      this.px(ctx, 25, 7, 3, 8, '#0f172a');
      this.cache['bench_press'] = canvas;
    }

    // Gym Blue Steel Lockers
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#1e3a8a');
      this.px(ctx, 4, 4, 11, 24, '#2563eb');
      this.px(ctx, 17, 4, 11, 24, '#2563eb');
      this.px(ctx, 6, 7, 7, 1, '#1e3a8a');
      this.px(ctx, 6, 9, 7, 1, '#1e3a8a');
      this.px(ctx, 19, 7, 7, 1, '#1e3a8a');
      this.px(ctx, 19, 9, 7, 1, '#1e3a8a');
      this.px(ctx, 12, 16, 2, 3, '#f59e0b');
      this.px(ctx, 25, 16, 2, 3, '#f59e0b');
      this.cache['lockers'] = canvas;
    }

    // Framed Gym Motivational Poster ("BELIEVE")
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 24, '#0f172a');
      this.px(ctx, 6, 6, 20, 20, '#1e293b');
      this.px(ctx, 10, 8, 12, 10, '#22c55e');
      this.px(ctx, 8, 20, 16, 2, '#facc15');
      this.cache['poster_gains'] = canvas;
    }

    // Rolled Out Yoga Mat & Water Bottle
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#7c3aed';
      ctx.beginPath();
      ctx.roundRect(4, 8, 24, 16, 3);
      ctx.fill();
      this.px(ctx, 6, 10, 20, 12, '#8b5cf6');
      this.px(ctx, 22, 12, 4, 8, '#38bdf8');
      this.cache['yoga_mat'] = canvas;
    }

    // Office Xerox Copier Machine
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 6, 24, 22, '#cbd5e1');
      this.px(ctx, 6, 8, 20, 18, '#94a3b8');
      this.px(ctx, 6, 4, 18, 3, '#64748b');
      this.px(ctx, 20, 6, 6, 4, '#22c55e');
      this.px(ctx, 2, 14, 4, 8, '#e2e8f0');
      this.cache['copier_machine'] = canvas;
    }

    // Conspiracy Corkboard with Red Yarn
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 2, 28, 28, '#78350f');
      this.px(ctx, 4, 4, 24, 24, '#d97706');
      this.px(ctx, 6, 6, 7, 7, '#f8fafc');
      this.px(ctx, 18, 7, 7, 7, '#f8fafc');
      this.px(ctx, 7, 18, 7, 7, '#f8fafc');
      this.px(ctx, 17, 17, 8, 7, '#fef08a');
      this.px(ctx, 9, 9, 12, 2, '#dc2626');
      this.px(ctx, 11, 10, 2, 10, '#dc2626');
      this.px(ctx, 11, 19, 10, 2, '#dc2626');
      this.cache['conspiracy_board'] = canvas;
    }

    // Office Cubicle Partition Wall
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 0, 4, T, 24, '#475569');
      this.px(ctx, 2, 6, 28, 20, '#64748b');
      this.px(ctx, 0, 26, T, 4, '#1e293b');
      this.cache['office_cubicle'] = canvas;
    }

    // Blinking Server Rack Tower
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 2, 24, 28, '#0f172a');
      this.px(ctx, 6, 4, 20, 24, '#1e293b');
      for (let y = 6; y <= 24; y += 4) {
        this.px(ctx, 8, y, 16, 2, '#334155');
        this.px(ctx, 9, y, 2, 2, (y % 8 === 0) ? '#22c55e' : '#ef4444');
        this.px(ctx, 13, y, 2, 2, (y % 6 === 0) ? '#38bdf8' : '#eab308');
        this.px(ctx, 17, y, 2, 2, '#22c55e');
      }
      this.cache['server_rack'] = canvas;
    }

    // Office Ficus Potted Plant
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 10, 18, 12, 12, '#ea580c');
      this.px(ctx, 8, 16, 16, 3, '#c2410c');
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(16, 11, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(13, 9, 5, 0, Math.PI * 2);
      ctx.arc(19, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      this.cache['potted_plant'] = canvas;
    }

    // Kitchen Refrigerator with Saucer Magnet
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 2, 24, 28, '#cbd5e1');
      this.px(ctx, 6, 4, 20, 10, '#f1f5f9');
      this.px(ctx, 6, 15, 20, 14, '#f1f5f9');
      this.px(ctx, 22, 7, 2, 4, '#94a3b8');
      this.px(ctx, 22, 18, 2, 6, '#94a3b8');
      this.px(ctx, 10, 17, 6, 3, '#22c55e');
      this.px(ctx, 12, 16, 2, 2, '#38bdf8');
      this.cache['kitchen_fridge'] = canvas;
    }

    // Kitchen Gas Stove & Oven
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 26, '#e2e8f0');
      this.px(ctx, 6, 6, 20, 6, '#1e293b');
      this.px(ctx, 8, 7, 3, 3, '#475569');
      this.px(ctx, 18, 7, 3, 3, '#475569');
      this.px(ctx, 6, 14, 20, 12, '#334155');
      this.px(ctx, 9, 16, 14, 8, '#0f172a');
      this.cache['kitchen_stove'] = canvas;
    }

    // Kitchen Sink with Chrome Faucet
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 26, '#cbd5e1');
      this.px(ctx, 8, 10, 16, 14, '#64748b');
      this.px(ctx, 10, 12, 12, 10, '#334155');
      this.px(ctx, 15, 4, 2, 7, '#f8fafc');
      this.px(ctx, 13, 4, 4, 2, '#f8fafc');
      this.cache['kitchen_sink'] = canvas;
    }

    // Cozy Bed with Pillow & Plaid Quilt
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 2, 24, 28, '#78350f');
      this.px(ctx, 6, 4, 20, 7, '#f8fafc');
      this.px(ctx, 6, 12, 20, 16, '#0f766e');
      for (let y = 14; y <= 26; y += 4) {
        this.px(ctx, 6, y, 20, 1, '#14b8a6');
      }
      this.cache['bed_cozy'] = canvas;
    }

    // Bedside Nightstand with Lamp
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 6, 12, 20, 18, '#78350f');
      this.px(ctx, 8, 14, 16, 6, '#92400e');
      this.px(ctx, 15, 17, 2, 2, '#facc15');
      this.px(ctx, 15, 6, 2, 6, '#ca8a04');
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.roundRect(11, 3, 10, 6, [3, 3, 0, 0]);
      ctx.fill();
      this.cache['nightstand'] = canvas;
    }

    // Braided Oval Floor Rug
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(16, 16, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.ellipse(16, 16, 11, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef3c7';
      ctx.beginPath();
      ctx.ellipse(16, 16, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      this.cache['rug_oval'] = canvas;
    }

    // Plush Leather Armchair
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(4, 6, 24, 22, 4);
      ctx.fill();
      ctx.fillStyle = '#92400e';
      ctx.beginPath();
      ctx.roundRect(7, 9, 18, 16, 3);
      ctx.fill();
      this.cache['armchair'] = canvas;
    }

    // Area 51 Yellow Biohazard Barrel
    {
      const { canvas, ctx } = this.createCanvas();
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(6, 4, 20, 24, 3);
      ctx.fill();
      this.px(ctx, 6, 9, 20, 2, '#ca8a04');
      this.px(ctx, 6, 19, 20, 2, '#ca8a04');
      this.px(ctx, 14, 13, 4, 4, '#0f172a');
      this.px(ctx, 12, 12, 2, 2, '#0f172a');
      this.px(ctx, 18, 12, 2, 2, '#0f172a');
      this.px(ctx, 10, 4, 3, 5, '#22c55e');
      this.cache['biohazard_barrel'] = canvas;
    }

    // Area 51 Autopsy Dissection Table
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 2, 8, 28, 18, '#94a3b8');
      this.px(ctx, 4, 10, 24, 14, '#cbd5e1');
      this.px(ctx, 6, 12, 20, 10, '#64748b');
      this.px(ctx, 15, 0, 2, 7, '#94a3b8');
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(16, 7, 4, 0, Math.PI * 2);
      ctx.fill();
      this.cache['autopsy_table'] = canvas;
    }

    // Area 51 Security Hazard Laser Emitter
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 10, 14, 12, 16, '#0f172a');
      this.px(ctx, 12, 8, 8, 8, '#475569');
      this.px(ctx, 14, 6, 4, 4, '#ef4444');
      this.px(ctx, 0, 7, T, 2, '#ef4444');
      this.px(ctx, 0, 8, T, 1, '#fca5a5');
      this.cache['hazard_laser'] = canvas;
    }

    // Area 51 Cathode Radar Console
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 26, '#14532d');
      this.px(ctx, 6, 6, 20, 18, '#052e16');
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(16, 15, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(16, 15, 4, 0, Math.PI * 2);
      ctx.stroke();
      this.px(ctx, 16, 9, 1, 12, '#22c55e');
      this.px(ctx, 10, 15, 12, 1, '#22c55e');
      this.px(ctx, 18, 12, 2, 2, '#86efac');
      this.px(ctx, 13, 17, 2, 2, '#86efac');
      this.cache['radar_console'] = canvas;
    }
  }

  // ==========================================
  // 3. AREA 51 CONTAINMENT POD & ALIEN
  // ==========================================
  generateArea51Sprites() {
    const T = this.tileSize;

    // Glowing Alien Cryo-Stasis Containment Pod (64x64 or 32x64)
    // We make a 32x32 top and 32x32 bottom tile
    // Top part of pod
    {
      const { canvas, ctx } = this.createCanvas();
      // Metal cap
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(4, 2, 24, 8, [6, 6, 0, 0]);
      ctx.fill();
      // Glowing green glass tube
      this.px(ctx, 6, 10, 20, 22, '#22c55e');
      this.px(ctx, 8, 12, 16, 20, '#86efac');
      // Live Alien Head silhouette floating in the pod!
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.ellipse(16, 24, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Glowing almond eyes
      this.px(ctx, 13, 23, 2, 3, '#052e16');
      this.px(ctx, 17, 23, 2, 3, '#052e16');
      this.px(ctx, 13, 23, 1, 1, '#4ade80');
      this.px(ctx, 17, 23, 1, 1, '#4ade80');
      this.cache['pod_top'] = canvas;
    }

    // Bottom part of pod
    {
      const { canvas, ctx } = this.createCanvas();
      // Glass body
      this.px(ctx, 6, 0, 20, 20, '#22c55e');
      this.px(ctx, 8, 0, 16, 20, '#86efac');
      // Alien torso floating
      this.px(ctx, 13, 0, 6, 12, '#14532d');
      // Bubbles
      this.px(ctx, 10, 8, 2, 2, '#ffffff');
      this.px(ctx, 18, 14, 2, 2, '#ffffff');
      // Heavy metal base with warning stripes
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(2, 20, 28, 12, [0, 0, 4, 4]);
      ctx.fill();
      this.px(ctx, 4, 24, 24, 4, '#eab308');
      this.px(ctx, 8, 24, 4, 4, '#1e293b');
      this.px(ctx, 16, 24, 4, 4, '#1e293b');
      this.cache['pod_bottom'] = canvas;
    }

    // High-tech terminal monitor
    {
      const { canvas, ctx } = this.createCanvas();
      this.px(ctx, 4, 4, 24, 24, '#1e293b');
      this.px(ctx, 6, 6, 20, 16, '#0f172a');
      this.px(ctx, 8, 8, 16, 12, '#22c55e');
      this.px(ctx, 9, 10, 14, 1, '#052e16');
      this.px(ctx, 9, 14, 10, 1, '#052e16');
      this.cache['terminal_area51'] = canvas;
    }
  }

  // ==========================================
  // 4. PLAYER SPRITES (Cole Welps - GBA Pokémon Style)
  // ==========================================
  generatePlayerSprites() {
    const directions = ['down', 'up', 'left', 'right'];
    const frames = [0, 1, 2, 3];

    directions.forEach(dir => {
      this.cache[`player_${dir}`] = [];
      frames.forEach(frame => {
        const { canvas, ctx } = this.createCanvas();
        this.renderPlayerFrame(ctx, dir, frame);
        this.cache[`player_${dir}`][frame] = canvas;
      });
    });
  }

  renderPlayerFrame(ctx, dir, frame) {
    const isWalk1 = (frame === 1);
    const isWalk2 = (frame === 3);
    const bob = (isWalk1 || isWalk2) ? 1 : 0;

    // Palette: Authentic GBA Pokémon Trainer Tones
    const c_out = '#1e1b18';      // Dark selective outline
    const c_skin = '#fcd39f';     // Anime peach skin
    const c_skin_mid = '#f5ba82'; // Skin shadow
    const c_skin_dark = '#dc9158';// Chin / neck shadow
    const c_hair = '#3d2516';     // Shaggy brown investigator hair
    const c_hair_hi = '#5e381f';  // Hair highlight
    const c_hat = '#a37042';      // Fedora felt base
    const c_hat_hi = '#c98e59';   // Fedora highlight
    const c_hat_sh = '#734724';   // Fedora shadow
    const c_band = '#1e293b';     // Hatband charcoal
    const c_pin = '#f1f5f9';      // Silver tin-foil pin/buckle
    const c_coat = '#d4b78f';     // Trenchcoat tan base
    const c_coat_hi = '#eed7b8';  // Trenchcoat highlight
    const c_coat_sh = '#a88960';  // Trenchcoat shadow
    const c_tie = '#1e3a8a';      // Navy blue necktie
    const c_shirt = '#ffffff';    // White collared shirt
    const c_satchel = '#78350f';  // Leather investigator satchel
    const c_satchel_sh = '#451a03';
    const c_brass = '#eab308';    // Brass button & satchel buckle
    const c_pants = '#334155';    // Charcoal slacks
    const c_pants_sh = '#1e293b';
    const c_shoe = '#452210';     // Leather oxford shoes
    const c_sole = '#0f172a';     // Dark shoe soles

    if (dir === 'down') {
      // --- LEGS & OXFORD SHOES ---
      const legY1 = 24 + (isWalk1 ? -1 : 0);
      const legY2 = 24 + (isWalk2 ? -1 : 0);
      // Left leg
      this.px(ctx, 10, legY1, 4, 3, c_pants);
      this.px(ctx, 10, legY1, 1, 3, c_pants_sh);
      this.px(ctx, 10, legY1 + 2, 4, 2, c_shoe);
      this.px(ctx, 9, legY1 + 3, 5, 1, c_sole);

      // Right leg
      this.px(ctx, 18, legY2, 4, 3, c_pants);
      this.px(ctx, 21, legY2, 1, 3, c_pants_sh);
      this.px(ctx, 18, legY2 + 2, 4, 2, c_shoe);
      this.px(ctx, 18, legY2 + 3, 5, 1, c_sole);

      // --- TRENCHCOAT TORSO ---
      const yT = 17 + bob;
      this.px(ctx, 8, yT, 16, 7, c_coat);
      this.px(ctx, 8, yT, 1, 7, c_out);
      this.px(ctx, 23, yT, 1, 7, c_out);
      this.px(ctx, 8, yT + 6, 16, 1, c_coat_sh);
      this.px(ctx, 9, yT + 1, 2, 5, c_coat_sh);
      this.px(ctx, 21, yT + 1, 2, 5, c_coat_sh);
      this.px(ctx, 11, yT + 2, 2, 4, c_coat_hi);

      // White collar & Navy tie in center
      this.px(ctx, 14, yT, 4, 2, c_shirt);
      this.px(ctx, 15, yT + 1, 2, 4, c_tie);
      this.px(ctx, 15, yT + 5, 2, 1, c_out);

      // Double-breasted brass buttons
      this.px(ctx, 13, yT + 3, 1, 1, c_brass);
      this.px(ctx, 13, yT + 5, 1, 1, c_brass);
      this.px(ctx, 18, yT + 3, 1, 1, c_brass);
      this.px(ctx, 18, yT + 5, 1, 1, c_brass);

      // Detective Satchel strap diagonally across chest (Lucas/Brendan style)
      this.px(ctx, 11, yT, 2, 1, c_satchel);
      this.px(ctx, 12, yT + 1, 2, 1, c_satchel);
      this.px(ctx, 14, yT + 2, 2, 1, c_brass); // brass buckle
      this.px(ctx, 16, yT + 3, 2, 1, c_satchel);
      this.px(ctx, 18, yT + 4, 2, 1, c_satchel);
      this.px(ctx, 20, yT + 5, 3, 2, c_satchel); // leather satchel bag peeking at hip

      // Hands at sides with walk swing
      const handOffset = isWalk1 ? -1 : (isWalk2 ? 1 : 0);
      this.px(ctx, 7, yT + 4 + handOffset, 2, 3, c_skin);
      this.px(ctx, 7, yT + 6 + handOffset, 2, 1, c_skin_mid);
      this.px(ctx, 23, yT + 4 - handOffset, 2, 3, c_skin);
      this.px(ctx, 23, yT + 6 - handOffset, 2, 1, c_skin_mid);

      // --- HEAD & FACE ---
      const yH = 9 + bob;
      // Shaggy hair behind face
      this.px(ctx, 8, yH + 3, 3, 5, c_hair);
      this.px(ctx, 21, yH + 3, 3, 5, c_hair);
      this.px(ctx, 9, yH + 4, 1, 3, c_hair_hi);
      this.px(ctx, 22, yH + 4, 1, 3, c_hair_hi);

      // Face skin & round cheeks
      this.px(ctx, 10, yH + 2, 12, 6, c_skin);
      this.px(ctx, 11, yH + 8, 10, 1, c_skin_dark); // chin
      this.px(ctx, 10, yH + 7, 12, 1, c_skin_mid);

      // GBA Anime Eyes & Spectacles
      // Left eye & frame
      this.px(ctx, 11, yH + 4, 3, 1, c_out);
      this.px(ctx, 11, yH + 6, 3, 1, c_out);
      this.px(ctx, 10, yH + 5, 1, 1, c_out);
      this.px(ctx, 14, yH + 5, 1, 1, c_out);
      this.px(ctx, 12, yH + 5, 1, 1, '#1e293b'); // pupil
      this.px(ctx, 11, yH + 5, 1, 1, '#ffffff'); // sclera
      this.px(ctx, 13, yH + 5, 1, 1, '#38bdf8'); // cyan glint

      // Glasses bridge
      this.px(ctx, 14, yH + 5, 4, 1, c_out);

      // Right eye & frame
      this.px(ctx, 18, yH + 4, 3, 1, c_out);
      this.px(ctx, 18, yH + 6, 3, 1, c_out);
      this.px(ctx, 17, yH + 5, 1, 1, c_out);
      this.px(ctx, 21, yH + 5, 1, 1, c_out);
      this.px(ctx, 19, yH + 5, 1, 1, '#1e293b'); // pupil
      this.px(ctx, 18, yH + 5, 1, 1, '#38bdf8'); // cyan glint
      this.px(ctx, 20, yH + 5, 1, 1, '#ffffff'); // sclera

      // Eyebrows
      this.px(ctx, 11, yH + 3, 3, 1, c_hair);
      this.px(ctx, 18, yH + 3, 3, 1, c_hair);

      // Determined detective mouth
      this.px(ctx, 15, yH + 7, 2, 1, '#b45309');

      // --- FEDORA HAT ---
      const yHat = 4 + bob;
      this.px(ctx, 11, yHat, 10, 1, c_out);
      this.px(ctx, 12, yHat + 1, 8, 4, c_hat);
      this.px(ctx, 14, yHat, 4, 2, c_hat_sh); // crown crease
      this.px(ctx, 12, yHat + 2, 2, 3, c_hat_hi);
      this.px(ctx, 18, yHat + 2, 2, 3, c_hat_sh);
      this.px(ctx, 11, yHat + 1, 1, 5, c_out);
      this.px(ctx, 20, yHat + 1, 1, 5, c_out);

      // Charcoal hatband with silver tin-foil pin
      this.px(ctx, 11, yHat + 5, 10, 2, c_band);
      this.px(ctx, 15, yHat + 5, 2, 2, c_pin);

      // Curved wide fedora brim
      this.px(ctx, 6, yHat + 7, 20, 2, c_hat);
      this.px(ctx, 6, yHat + 6, 2, 1, c_hat_hi);
      this.px(ctx, 24, yHat + 6, 2, 1, c_hat_hi);
      this.px(ctx, 5, yHat + 7, 1, 2, c_out);
      this.px(ctx, 26, yHat + 7, 1, 2, c_out);
      this.px(ctx, 6, yHat + 8, 20, 1, c_out);
      this.px(ctx, 7, yHat + 8, 18, 1, c_hat_sh);
    }
    else if (dir === 'up') {
      // --- BACK VIEW (Authentic Pokémon GBA style) ---
      const legY1 = 24 + (isWalk1 ? -1 : 0);
      const legY2 = 24 + (isWalk2 ? -1 : 0);
      this.px(ctx, 10, legY1, 4, 3, c_pants);
      this.px(ctx, 10, legY1 + 2, 4, 2, c_shoe);
      this.px(ctx, 9, legY1 + 3, 5, 1, c_sole);

      this.px(ctx, 18, legY2, 4, 3, c_pants);
      this.px(ctx, 18, legY2 + 2, 4, 2, c_shoe);
      this.px(ctx, 18, legY2 + 3, 5, 1, c_sole);

      // Torso & Trenchcoat Back
      const yT = 17 + bob;
      this.px(ctx, 8, yT, 16, 7, c_coat);
      this.px(ctx, 8, yT, 1, 7, c_out);
      this.px(ctx, 23, yT, 1, 7, c_out);
      this.px(ctx, 15, yT + 2, 1, 5, c_coat_sh); // back center vent
      this.px(ctx, 8, yT + 6, 16, 1, c_coat_sh);

      // Leather satchel bag on back!
      this.px(ctx, 12, yT + 2, 8, 5, c_satchel);
      this.px(ctx, 12, yT + 2, 8, 1, c_satchel_sh); // satchel flap
      this.px(ctx, 15, yT + 4, 2, 1, c_brass);      // brass clasp
      this.px(ctx, 10, yT, 3, 2, c_satchel_sh);     // shoulder strap
      this.px(ctx, 19, yT + 5, 3, 2, c_satchel_sh);

      // Arms swinging
      const handOffset = isWalk1 ? -1 : (isWalk2 ? 1 : 0);
      this.px(ctx, 7, yT + 3 + handOffset, 2, 4, c_coat_sh);
      this.px(ctx, 23, yT + 3 - handOffset, 2, 4, c_coat_sh);

      // Shaggy hair at nape of neck
      const yH = 9 + bob;
      this.px(ctx, 9, yH + 5, 14, 3, c_hair);
      this.px(ctx, 10, yH + 6, 12, 2, c_hair_hi);
      this.px(ctx, 8, yH + 6, 2, 3, c_hair);
      this.px(ctx, 22, yH + 6, 2, 3, c_hair);

      // Fedora from behind
      const yHat = 4 + bob;
      this.px(ctx, 11, yHat, 10, 1, c_out);
      this.px(ctx, 12, yHat + 1, 8, 5, c_hat);
      this.px(ctx, 14, yHat, 4, 2, c_hat_sh); // crown dent
      this.px(ctx, 11, yHat + 5, 10, 2, c_band);
      this.px(ctx, 6, yHat + 7, 20, 2, c_hat);
      this.px(ctx, 5, yHat + 7, 1, 2, c_out);
      this.px(ctx, 26, yHat + 7, 1, 2, c_out);
      this.px(ctx, 6, yHat + 8, 20, 1, c_out);
    }
    else if (dir === 'left') {
      // --- PROFILE VIEW (Facing Left) ---
      const xL1 = isWalk1 ? 8 : (isWalk2 ? 14 : 11);
      const xL2 = isWalk1 ? 16 : (isWalk2 ? 9 : 14);
      this.px(ctx, xL1, 24, 4, 3, c_pants);
      this.px(ctx, xL1, 26, 4, 2, c_shoe);
      this.px(ctx, xL1 - 1, 27, 5, 1, c_sole);

      this.px(ctx, xL2, 24, 4, 3, c_pants_sh);
      this.px(ctx, xL2, 26, 4, 2, c_shoe);
      this.px(ctx, xL2 - 1, 27, 5, 1, c_sole);

      const yT = 17 + bob;
      this.px(ctx, 10, yT, 12, 7, c_coat);
      this.px(ctx, 10, yT, 1, 7, c_out);
      this.px(ctx, 21, yT, 1, 7, c_out);
      this.px(ctx, 10, yT + 6, 12, 1, c_coat_sh);
      this.px(ctx, 10, yT, 2, 4, c_coat_hi);
      this.px(ctx, 12, yT + 1, 2, 2, c_tie);

      // Arm swing
      const armX = 13 + (isWalk1 ? -2 : (isWalk2 ? 2 : 0));
      this.px(ctx, armX, yT + 2, 4, 4, c_coat);
      this.px(ctx, armX - 1, yT + 5, 3, 2, c_skin);

      // Satchel bag on hip
      this.px(ctx, 16, yT + 3, 4, 4, c_satchel);
      this.px(ctx, 16, yT + 3, 4, 1, c_satchel_sh);
      this.px(ctx, 17, yT + 4, 1, 1, c_brass);

      // Face in profile
      const yH = 9 + bob;
      this.px(ctx, 10, yH + 3, 10, 5, c_skin);
      this.px(ctx, 18, yH + 3, 3, 5, c_hair);
      this.px(ctx, 10, yH + 7, 7, 1, c_skin_mid);

      // Single expressive eye & spectacle frame in profile
      this.px(ctx, 9, yH + 4, 3, 3, c_out);
      this.px(ctx, 10, yH + 5, 1, 1, '#1e293b');
      this.px(ctx, 11, yH + 5, 1, 1, '#38bdf8');
      this.px(ctx, 9, yH + 5, 1, 1, '#ffffff');
      this.px(ctx, 10, yH + 3, 3, 1, c_hair);

      // Fedora brim projecting forward
      const yHat = 4 + bob;
      this.px(ctx, 10, yHat, 8, 5, c_hat);
      this.px(ctx, 9, yHat + 5, 10, 2, c_band);
      this.px(ctx, 5, yHat + 7, 18, 2, c_hat);
      this.px(ctx, 4, yHat + 7, 1, 2, c_out);
      this.px(ctx, 5, yHat + 8, 18, 1, c_out);
      this.px(ctx, 22, yHat + 6, 2, 1, c_hat_hi);
    }
    else if (dir === 'right') {
      // --- PROFILE VIEW (Facing Right) ---
      const xL1 = isWalk1 ? 16 : (isWalk2 ? 10 : 13);
      const xL2 = isWalk1 ? 8 : (isWalk2 ? 15 : 10);
      this.px(ctx, xL1, 24, 4, 3, c_pants);
      this.px(ctx, xL1, 26, 4, 2, c_shoe);
      this.px(ctx, xL1, 27, 5, 1, c_sole);

      this.px(ctx, xL2, 24, 4, 3, c_pants_sh);
      this.px(ctx, xL2, 26, 4, 2, c_shoe);
      this.px(ctx, xL2, 27, 5, 1, c_sole);

      const yT = 17 + bob;
      this.px(ctx, 10, yT, 12, 7, c_coat);
      this.px(ctx, 10, yT, 1, 7, c_out);
      this.px(ctx, 21, yT, 1, 7, c_out);
      this.px(ctx, 10, yT + 6, 12, 1, c_coat_sh);
      this.px(ctx, 20, yT, 2, 4, c_coat_hi);
      this.px(ctx, 18, yT + 1, 2, 2, c_tie);

      const armX = 15 + (isWalk1 ? 2 : (isWalk2 ? -2 : 0));
      this.px(ctx, armX, yT + 2, 4, 4, c_coat);
      this.px(ctx, armX + 2, yT + 5, 3, 2, c_skin);

      this.px(ctx, 12, yT + 3, 4, 4, c_satchel);
      this.px(ctx, 12, yT + 3, 4, 1, c_satchel_sh);
      this.px(ctx, 14, yT + 4, 1, 1, c_brass);

      const yH = 9 + bob;
      this.px(ctx, 12, yH + 3, 10, 5, c_skin);
      this.px(ctx, 11, yH + 3, 3, 5, c_hair);
      this.px(ctx, 15, yH + 7, 7, 1, c_skin_mid);

      this.px(ctx, 20, yH + 4, 3, 3, c_out);
      this.px(ctx, 21, yH + 5, 1, 1, '#1e293b');
      this.px(ctx, 20, yH + 5, 1, 1, '#38bdf8');
      this.px(ctx, 22, yH + 5, 1, 1, '#ffffff');
      this.px(ctx, 19, yH + 3, 3, 1, c_hair);

      const yHat = 4 + bob;
      this.px(ctx, 14, yHat, 8, 5, c_hat);
      this.px(ctx, 13, yHat + 5, 10, 2, c_band);
      this.px(ctx, 9, yHat + 7, 18, 2, c_hat);
      this.px(ctx, 27, yHat + 7, 1, 2, c_out);
      this.px(ctx, 9, yHat + 8, 18, 1, c_out);
      this.px(ctx, 8, yHat + 6, 2, 1, c_hat_hi);
    }
  }

  // ==========================================
  // 5. NPC SPRITES (Authentic Pokémon GBA Trainer Classes)
  // ==========================================
  generateNpcSprites() {
    const npcs = [
      'agent', 'chef', 'waitress', 'tinfoil',
      'scientist', 'gymbro', 'alien_disguised', 'cow', 'alien_cat', 'informant',
      'fbi_agent', 'rude_local_m', 'rude_local_f',
      'businessman', 'shopper', 'hazmat', 'gymnast', 'dog'
    ];

    const dirs = ['down', 'up', 'left', 'right'];

    npcs.forEach(type => {
      dirs.forEach(dir => {
        const { canvas, ctx } = this.createCanvas();
        this.renderNpc(ctx, type, dir);
        this.cache[`npc_${type}_${dir}`] = canvas;
      });
      // Default to front-facing down sprite
      this.cache[`npc_${type}`] = this.cache[`npc_${type}_down`];
    });
  }

  renderNpc(ctx, type, dir = 'down') {
    const isBack = (dir === 'up');
    const isSide = (dir === 'left' || dir === 'right');
    const isRight = (dir === 'right');

    const c_out = '#1e1b18';
    const c_skin = '#fcd39f';
    const c_skin_mid = '#f5ba82';
    const c_skin_dark = '#dc9158';

    if (type === 'fbi_agent') {
      // Tactical FBI Takedown Agent
      const c_vest = '#1e293b';
      const c_navy = '#0f172a';
      const c_gold = '#eab308';

      // Boots & Cargo Legs
      this.px(ctx, 10, 24, 4, 3, c_navy);
      this.px(ctx, 18, 24, 4, 3, c_navy);
      this.px(ctx, 9, 26, 5, 2, '#020617');
      this.px(ctx, 18, 26, 5, 2, '#020617');

      // Tactical Armor Vest
      this.px(ctx, 8, 16, 16, 8, c_vest);
      this.px(ctx, 8, 16, 1, 8, c_out);
      this.px(ctx, 23, 16, 1, 8, c_out);
      this.px(ctx, 7, 19, 2, 4, '#0f172a'); // tactical gloves
      this.px(ctx, 23, 19, 2, 4, '#0f172a');

      if (!isBack) {
        // Gold "FBI" Block Letters
        this.px(ctx, 12, 18, 2, 3, c_gold);
        this.px(ctx, 15, 18, 2, 3, c_gold);
        this.px(ctx, 18, 18, 2, 3, c_gold);
        this.px(ctx, 11, 16, 2, 2, '#cbd5e1'); // shoulder radio mic
      } else {
        // Back of vest with large yellow FBI letters
        this.px(ctx, 11, 18, 10, 3, c_gold);
      }

      // Head & Peaked Tactical Cap
      this.px(ctx, 10, 10, 12, 6, c_skin);
      if (!isBack) {
        // Dark tactical sunglasses with white shine
        this.px(ctx, 11, 12, 10, 2, '#020617');
        this.px(ctx, 13, 12, 2, 1, '#ffffff');
        this.px(ctx, 18, 12, 2, 1, '#ffffff');
      }
      // Navy Tactical Cap
      this.px(ctx, 9, 6, 14, 4, c_navy);
      this.px(ctx, 8, 9, 16, 2, '#020617'); // cap visor
      if (!isBack) {
        this.px(ctx, 15, 7, 2, 2, c_gold); // badge emblem
      }
    }
    else if (type === 'agent') {
      // Classic Men-in-Black / Secret Service Agent
      // Black dress shoes
      this.px(ctx, 10, 24, 4, 3, '#111827');
      this.px(ctx, 18, 24, 4, 3, '#111827');
      this.px(ctx, 9, 26, 5, 2, '#030712');
      this.px(ctx, 18, 26, 5, 2, '#030712');

      // Tailored Black Suit
      this.px(ctx, 8, 16, 16, 8, '#181824');
      this.px(ctx, 8, 16, 1, 8, c_out);
      this.px(ctx, 23, 16, 1, 8, c_out);
      this.px(ctx, 7, 19, 2, 3, c_skin); // hands
      this.px(ctx, 23, 19, 2, 3, c_skin);

      if (!isBack) {
        this.px(ctx, 14, 16, 4, 2, '#ffffff'); // shirt collar
        this.px(ctx, 15, 17, 2, 4, '#09090f'); // thin black tie
        this.px(ctx, 11, 18, 1, 1, '#cbd5e1'); // silver lapel pin
      } else {
        this.px(ctx, 15, 18, 1, 5, '#09090f'); // center vent
      }

      // Head & Slick Dark Hair
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 6, 14, 5, '#181824');
      this.px(ctx, 10, 7, 12, 2, '#374151'); // comb shine

      if (!isBack) {
        // Iconic Black Shades with White Glint
        this.px(ctx, 11, 12, 10, 2, '#020617');
        this.px(ctx, 12, 12, 2, 1, '#ffffff');
        this.px(ctx, 18, 12, 2, 1, '#ffffff');
        // Earpiece wire
        this.px(ctx, 9, 13, 1, 3, '#cbd5e1');
      }
    }
    else if (type === 'chef') {
      // Chef Luigi (The Area Fifty-Bun)
      // Checkered gray kitchen trousers & black clogs
      this.px(ctx, 10, 24, 4, 3, '#475569');
      this.px(ctx, 18, 24, 4, 3, '#475569');
      this.px(ctx, 9, 26, 5, 2, '#1e293b');
      this.px(ctx, 18, 26, 5, 2, '#1e293b');

      // Double-breasted white coat & apron
      this.px(ctx, 8, 16, 16, 8, '#f8fafc');
      this.px(ctx, 8, 16, 1, 8, '#cbd5e1');
      this.px(ctx, 23, 16, 1, 8, '#cbd5e1');
      this.px(ctx, 7, 19, 2, 3, c_skin);
      this.px(ctx, 23, 19, 2, 3, c_skin);

      if (!isBack) {
        // Red neckerchief tied at collar
        this.px(ctx, 13, 16, 6, 2, '#ef4444');
        this.px(ctx, 15, 18, 2, 2, '#dc2626');
        // Black buttons
        this.px(ctx, 12, 19, 1, 1, '#1e293b');
        this.px(ctx, 12, 21, 1, 1, '#1e293b');
        this.px(ctx, 19, 19, 1, 1, '#1e293b');
        this.px(ctx, 19, 21, 1, 1, '#1e293b');
      } else {
        // Apron tie bow in back
        this.px(ctx, 14, 21, 4, 2, '#e2e8f0');
        this.px(ctx, 13, 22, 2, 3, '#cbd5e1');
        this.px(ctx, 17, 22, 2, 3, '#cbd5e1');
      }

      // Head & Bushy Mustache
      this.px(ctx, 10, 10, 12, 6, c_skin);
      if (!isBack) {
        // Eyes
        this.px(ctx, 12, 11, 1, 2, '#1e293b');
        this.px(ctx, 19, 11, 1, 2, '#1e293b');
        // Bushy brown curly mustache
        this.px(ctx, 11, 13, 10, 2, '#451a03');
        this.px(ctx, 10, 14, 2, 1, '#451a03');
        this.px(ctx, 20, 14, 2, 1, '#451a03');
      }

      // Tall White Pleated Toque
      this.px(ctx, 9, 3, 14, 7, '#ffffff');
      this.px(ctx, 8, 3, 16, 2, '#f1f5f9');
      this.px(ctx, 9, 9, 14, 2, '#e2e8f0'); // toque band
      this.px(ctx, 11, 4, 1, 4, '#cbd5e1'); // pleat folds
      this.px(ctx, 14, 4, 1, 4, '#cbd5e1');
      this.px(ctx, 17, 4, 1, 4, '#cbd5e1');
      this.px(ctx, 20, 4, 1, 4, '#cbd5e1');
    }
    else if (type === 'waitress') {
      // Waitress Flo (Retro Diner Uniform)
      // White stockings & black Mary Jane shoes
      this.px(ctx, 11, 24, 3, 3, '#f8fafc');
      this.px(ctx, 18, 24, 3, 3, '#f8fafc');
      this.px(ctx, 10, 26, 4, 2, '#0f172a');
      this.px(ctx, 18, 26, 4, 2, '#0f172a');

      // Retro Teal Dress with Frilly White Apron
      this.px(ctx, 8, 16, 16, 8, '#0d9488');
      this.px(ctx, 8, 23, 16, 1, '#0f766e'); // skirt flare
      this.px(ctx, 11, 17, 10, 6, '#f8fafc'); // white apron bib
      this.px(ctx, 10, 16, 2, 7, '#ffffff');  // apron straps
      this.px(ctx, 20, 16, 2, 7, '#ffffff');

      if (!isBack) {
        // Silver tray with coffee cup
        this.px(ctx, 5, 17, 5, 1, '#cbd5e1');
        this.px(ctx, 6, 15, 3, 2, '#ffffff'); // cup
        this.px(ctx, 7, 15, 1, 1, '#78350f'); // coffee
      } else {
        // Big apron bow in back
        this.px(ctx, 14, 20, 4, 2, '#ffffff');
        this.px(ctx, 13, 21, 2, 3, '#e2e8f0');
        this.px(ctx, 17, 21, 2, 3, '#e2e8f0');
      }

      // Head & Chestnut Bob
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 8, 7, 16, 5, '#6e3814'); // hair
      this.px(ctx, 9, 8, 14, 2, '#8d4d1d');
      // White ruffled waitress headband
      this.px(ctx, 10, 6, 12, 2, '#ffffff');
      this.px(ctx, 9, 7, 2, 1, '#cbd5e1');
      this.px(ctx, 21, 7, 2, 1, '#cbd5e1');

      if (!isBack) {
        // Expressive eyes & rosy blush
        this.px(ctx, 12, 12, 2, 2, '#0f172a');
        this.px(ctx, 12, 12, 1, 1, '#38bdf8');
        this.px(ctx, 18, 12, 2, 2, '#0f172a');
        this.px(ctx, 18, 12, 1, 1, '#38bdf8');
        this.px(ctx, 10, 13, 2, 1, '#f472b6'); // blush
        this.px(ctx, 20, 13, 2, 1, '#f472b6');
      }
    }
    else if (type === 'tinfoil') {
      // Mrs. Gable (Conspiracy Enthusiast with Pyramid Tin Foil Hat)
      this.px(ctx, 11, 24, 3, 3, '#4a044e');
      this.px(ctx, 18, 24, 3, 3, '#4a044e');
      this.px(ctx, 10, 26, 4, 2, '#451a03'); // sensible brown loafers
      this.px(ctx, 18, 26, 4, 2, '#451a03');

      // Plum Knit Cardigan & Plaid Skirt
      this.px(ctx, 8, 16, 16, 8, '#7e22ce');
      this.px(ctx, 8, 22, 16, 2, '#581c87'); // skirt
      this.px(ctx, 14, 16, 4, 5, '#faf5ff'); // floral blouse
      this.px(ctx, 13, 17, 6, 1, '#f1f5f9'); // pearl necklace

      // Lavender/Silver Curls
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 8, 7, 16, 4, '#c084fc');
      this.px(ctx, 8, 9, 3, 3, '#c084fc');
      this.px(ctx, 21, 9, 3, 3, '#c084fc');

      if (!isBack) {
        // Round spectacles & sweet smile
        this.px(ctx, 11, 11, 3, 3, '#cbd5e1');
        this.px(ctx, 12, 12, 1, 1, '#1e293b');
        this.px(ctx, 14, 12, 4, 1, '#cbd5e1'); // bridge
        this.px(ctx, 18, 11, 3, 3, '#cbd5e1');
        this.px(ctx, 19, 12, 1, 1, '#1e293b');
        this.px(ctx, 15, 14, 2, 1, '#e11d48'); // pink lips
      }

      // Iconic Folded Geometric Tin-Foil Pyramid Hat
      this.px(ctx, 14, 1, 4, 3, '#ffffff'); // tip
      this.px(ctx, 15, 0, 2, 2, '#cbd5e1'); // little antenna wire!
      this.px(ctx, 11, 3, 10, 3, '#f1f5f9');
      this.px(ctx, 7, 6, 18, 3, '#cbd5e1');
      this.px(ctx, 6, 7, 20, 2, '#94a3b8'); // folded brim
      this.px(ctx, 12, 4, 3, 4, '#ffffff'); // reflective light facet
    }
    else if (type === 'scientist') {
      // Area 51 Senior Researcher
      this.px(ctx, 10, 24, 4, 3, '#1e293b');
      this.px(ctx, 18, 24, 4, 3, '#1e293b');
      this.px(ctx, 9, 26, 5, 2, '#0f172a');
      this.px(ctx, 18, 26, 5, 2, '#0f172a');

      // White Lab Coat with Pen Pocket
      this.px(ctx, 8, 16, 16, 8, '#ffffff');
      this.px(ctx, 8, 16, 1, 8, '#cbd5e1');
      this.px(ctx, 23, 16, 1, 8, '#cbd5e1');
      this.px(ctx, 8, 23, 16, 1, '#cbd5e1');
      this.px(ctx, 10, 18, 2, 2, '#1e293b'); // pen pocket
      this.px(ctx, 10, 18, 1, 1, '#ef4444'); // red pen

      if (!isBack) {
        // Holding Bubbling Erlenmeyer Flask of Alien Slime!
        this.px(ctx, 22, 17, 3, 2, '#0d9488'); // teal rubber glove
        this.px(ctx, 23, 19, 2, 1, '#cbd5e1'); // flask neck
        this.px(ctx, 22, 20, 5, 4, '#22c55e'); // glowing green fluid!
        this.px(ctx, 23, 21, 2, 2, '#bbf7d0'); // bubbles
      }

      // Wild Spiky Einstein Hair & Green Lab Goggles
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 7, 5, 18, 6, '#e2e8f0'); // wild hair
      this.px(ctx, 6, 7, 3, 4, '#cbd5e1');
      this.px(ctx, 23, 7, 3, 4, '#cbd5e1');

      // Green Protective Goggles on Forehead
      this.px(ctx, 9, 7, 14, 3, '#059669');
      this.px(ctx, 11, 8, 3, 2, '#6ee7b7'); // lens glint
      this.px(ctx, 18, 8, 3, 2, '#6ee7b7');

      if (!isBack) {
        this.px(ctx, 12, 12, 2, 2, '#0f172a');
        this.px(ctx, 18, 12, 2, 2, '#0f172a');
        this.px(ctx, 14, 14, 4, 1, '#94a3b8'); // mustache/stubble
      }
    }
    else if (type === 'gymbro') {
      // Coach Rex (Fitness Athlete)
      this.px(ctx, 10, 24, 4, 3, '#1e293b');
      this.px(ctx, 18, 24, 4, 3, '#1e293b');
      this.px(ctx, 9, 26, 5, 2, '#ef4444'); // red sneakers
      this.px(ctx, 18, 26, 5, 2, '#ef4444');

      // Red Sleeveless Muscle Tank & Gym Towel
      this.px(ctx, 10, 16, 12, 8, '#dc2626');
      this.px(ctx, 7, 16, 3, 6, c_skin_mid);  // muscular tanned arms
      this.px(ctx, 22, 16, 3, 6, c_skin_mid);
      // White gym towel draped around neck
      this.px(ctx, 10, 16, 2, 7, '#f8fafc');
      this.px(ctx, 20, 16, 2, 7, '#f8fafc');

      // Spiky Dark Hair & Red Sweatband
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 5, 14, 5, '#3b1d11');
      this.px(ctx, 9, 8, 14, 2, '#ef4444'); // red headband

      if (!isBack) {
        this.px(ctx, 12, 11, 2, 2, '#1e293b');
        this.px(ctx, 18, 11, 2, 2, '#1e293b');
        this.px(ctx, 14, 13, 4, 1, '#ffffff'); // bright grin
      }
    }
    else if (type === 'gymnast') {
      // Female Track Runner
      this.px(ctx, 10, 24, 4, 3, '#0891b2');
      this.px(ctx, 18, 24, 4, 3, '#0891b2');
      this.px(ctx, 9, 26, 5, 2, '#ffffff'); // white running shoes
      this.px(ctx, 18, 26, 5, 2, '#ffffff');

      // Cyan Sports Top & Shorts
      this.px(ctx, 10, 16, 12, 5, '#06b6d4');
      this.px(ctx, 10, 21, 12, 1, c_skin); // athletic midriff
      this.px(ctx, 10, 22, 12, 2, '#1e3a8a'); // running shorts

      // Blonde Hair, High Ponytail & Sun Visor
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 6, 14, 5, '#facc15');
      this.px(ctx, 9, 8, 14, 2, '#ffffff'); // white visor band
      this.px(ctx, 7, 9, 18, 1, '#f1f5f9'); // visor brim

      // High ponytail swaying
      this.px(ctx, isRight ? 6 : 22, 6, 4, 7, '#eab308');
      this.px(ctx, isRight ? 7 : 21, 5, 2, 2, '#06b6d4'); // hair scrunchie

      if (!isBack) {
        this.px(ctx, 12, 12, 2, 2, '#0f172a');
        this.px(ctx, 12, 12, 1, 1, '#38bdf8');
        this.px(ctx, 18, 12, 2, 2, '#0f172a');
        this.px(ctx, 18, 12, 1, 1, '#38bdf8');
      }
    }
    else if (type === 'businessman') {
      // Walter the Executive
      this.px(ctx, 10, 24, 4, 3, '#1e3a8a');
      this.px(ctx, 18, 24, 4, 3, '#1e3a8a');
      this.px(ctx, 9, 26, 5, 2, '#0f172a');
      this.px(ctx, 18, 26, 5, 2, '#0f172a');

      // Navy Pinstripe Suit Jacket
      this.px(ctx, 8, 16, 16, 8, '#1e3a8a');
      this.px(ctx, 8, 16, 1, 8, '#172554');
      this.px(ctx, 23, 16, 1, 8, '#172554');

      if (!isBack) {
        this.px(ctx, 14, 16, 4, 2, '#ffffff'); // shirt
        this.px(ctx, 15, 17, 2, 5, '#dc2626'); // burgundy tie
        // Brown Leather Briefcase in right hand
        this.px(ctx, 23, 19, 6, 6, '#78350f');
        this.px(ctx, 25, 18, 2, 2, '#ca8a04'); // brass handle
        this.px(ctx, 24, 21, 4, 1, '#ca8a04'); // brass lock
      }

      // Neatly Combed Hair & Glasses
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 6, 14, 5, '#451a03');
      this.px(ctx, 10, 7, 12, 1, '#78350f'); // side part shine

      if (!isBack) {
        this.px(ctx, 11, 11, 3, 3, '#eab308'); // gold spectacles
        this.px(ctx, 12, 12, 1, 1, '#0f172a');
        this.px(ctx, 14, 12, 4, 1, '#eab308');
        this.px(ctx, 18, 11, 3, 3, '#eab308');
        this.px(ctx, 19, 12, 1, 1, '#0f172a');
      }
    }
    else if (type === 'shopper') {
      // Brenda with Groceries & Beanie
      this.px(ctx, 10, 24, 4, 3, '#334155');
      this.px(ctx, 18, 24, 4, 3, '#334155');
      this.px(ctx, 9, 26, 5, 2, '#78350f'); // warm boots
      this.px(ctx, 18, 26, 5, 2, '#78350f');

      // Emerald Green Woolen Toggle Coat
      this.px(ctx, 8, 16, 16, 8, '#059669');
      this.px(ctx, 8, 16, 1, 8, '#047857');
      this.px(ctx, 23, 16, 1, 8, '#047857');
      this.px(ctx, 14, 16, 4, 2, '#ef4444'); // red scarf

      if (!isBack) {
        // Brown Paper Grocery Bag with Baguette & Celery
        this.px(ctx, 4, 17, 6, 8, '#b45309');
        this.px(ctx, 4, 14, 2, 3, '#15803d'); // celery
        this.px(ctx, 7, 13, 2, 4, '#d97706'); // French baguette!
      }

      // Knit Pom-Pom Beanie
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 8, 7, 16, 5, '#f59e0b');
      this.px(ctx, 14, 4, 4, 3, '#fef08a'); // fluffy pom-pom on top!
      this.px(ctx, 8, 10, 3, 3, '#6e3814'); // hair curls
      this.px(ctx, 21, 10, 3, 3, '#6e3814');

      if (!isBack) {
        this.px(ctx, 12, 12, 2, 2, '#0f172a');
        this.px(ctx, 18, 12, 2, 2, '#0f172a');
        this.px(ctx, 10, 13, 2, 1, '#f87171'); // rosy cheeks
        this.px(ctx, 20, 13, 2, 1, '#f87171');
      }
    }
    else if (type === 'rude_local_m') {
      // Grumpy Arthur (Crossed Arms & Scowl)
      this.px(ctx, 10, 24, 4, 3, '#1e293b');
      this.px(ctx, 18, 24, 4, 3, '#1e293b');
      this.px(ctx, 9, 26, 5, 2, '#451a03');
      this.px(ctx, 18, 26, 5, 2, '#451a03');

      // Heavy Brown Work Jacket with Crossed Arms
      this.px(ctx, 8, 16, 16, 8, '#78350f');
      this.px(ctx, 8, 16, 1, 8, '#451a03');
      this.px(ctx, 23, 16, 1, 8, '#451a03');

      if (!isBack) {
        // Crossed Arms over Chest
        this.px(ctx, 10, 18, 12, 5, '#9a3412');
        this.px(ctx, 11, 20, 10, 2, '#7c2d12');
      }

      // Tweed Flat Cap & Scowl
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 5, 14, 5, '#57534e');
      this.px(ctx, 7, 8, 18, 2, '#44403c'); // cap brim

      if (!isBack) {
        // Angry Angled Eyebrows & Glare
        this.px(ctx, 11, 11, 3, 2, '#1c1917');
        this.px(ctx, 18, 11, 3, 2, '#1c1917');
        this.px(ctx, 12, 12, 1, 1, '#0f172a');
        this.px(ctx, 19, 12, 1, 1, '#0f172a');
        this.px(ctx, 14, 14, 4, 1, '#7f1d1d'); // frown
        this.px(ctx, 11, 14, 10, 1, '#d6d3d1'); // stubble shadow
      }
    }
    else if (type === 'rude_local_f') {
      // Stern Beatrice (Pink Hair Curlers & Handbag)
      this.px(ctx, 11, 24, 3, 3, '#155e75');
      this.px(ctx, 18, 24, 3, 3, '#155e75');
      this.px(ctx, 10, 26, 4, 2, '#0f172a');
      this.px(ctx, 18, 26, 4, 2, '#0f172a');

      // Teal Cardigan & Clutch Handbag
      this.px(ctx, 8, 16, 16, 8, '#0e7490');
      if (!isBack) {
        // Black handbag clutched with both hands
        this.px(ctx, 13, 19, 6, 5, '#0f172a');
        this.px(ctx, 15, 18, 2, 2, '#ca8a04'); // gold clasp
      }

      // Gray Hair with Pink Curlers!
      this.px(ctx, 10, 10, 12, 6, c_skin);
      this.px(ctx, 9, 6, 14, 5, '#94a3b8');
      this.px(ctx, 8, 4, 4, 4, '#f472b6'); // curler left
      this.px(ctx, 14, 3, 4, 4, '#f472b6'); // curler top
      this.px(ctx, 20, 4, 4, 4, '#f472b6'); // curler right

      if (!isBack) {
        // Cat-Eye Glasses & Stern Glare
        this.px(ctx, 11, 11, 3, 2, '#78350f');
        this.px(ctx, 18, 11, 3, 2, '#78350f');
        this.px(ctx, 12, 12, 1, 1, '#0f172a');
        this.px(ctx, 19, 12, 1, 1, '#0f172a');
        this.px(ctx, 14, 14, 4, 1, '#991b1b'); // pursed scowling lips
      }
    }
    else if (type === 'informant') {
      // Shady Informant (High Collar & Low Fedora)
      this.px(ctx, 10, 24, 4, 3, '#0f172a');
      this.px(ctx, 18, 24, 4, 3, '#0f172a');
      this.px(ctx, 9, 26, 5, 2, '#020617');
      this.px(ctx, 18, 26, 5, 2, '#020617');

      // Dark Slate Trenchcoat & High Collar
      this.px(ctx, 8, 16, 16, 8, '#1e293b');
      this.px(ctx, 8, 16, 1, 8, '#0f172a');
      this.px(ctx, 23, 16, 1, 8, '#0f172a');

      if (!isBack) {
        // Upturned collar concealing mouth
        this.px(ctx, 9, 14, 4, 4, '#334155');
        this.px(ctx, 19, 14, 4, 4, '#334155');
        // Glowing toothpick / match tip
        this.px(ctx, 17, 14, 2, 1, '#ef4444');
      }

      // Dark Fedora Pulled Low
      this.px(ctx, 10, 10, 12, 6, c_skin_mid);
      this.px(ctx, 9, 5, 14, 5, '#0f172a');
      this.px(ctx, 6, 8, 20, 2, '#020617'); // wide brim pulled down

      if (!isBack) {
        // Mysterious Eyes peering from deep shadow
        this.px(ctx, 12, 11, 2, 1, '#fbbf24');
        this.px(ctx, 18, 11, 2, 1, '#fbbf24');
      }
    }
    else if (type === 'alien_disguised') {
      // Hugh Mann (Extraterrestrial in Trenchcoat)
      const c_alien_skin = '#86efac';
      const c_alien_dark = '#22c55e';

      this.px(ctx, 10, 24, 4, 3, '#334155');
      this.px(ctx, 18, 24, 4, 3, '#334155');
      this.px(ctx, 9, 26, 5, 2, '#0f172a');
      this.px(ctx, 18, 26, 5, 2, '#0f172a');

      // Tan Trenchcoat
      this.px(ctx, 8, 16, 16, 8, '#ca8a04');
      this.px(ctx, 8, 16, 1, 8, '#a16207');
      this.px(ctx, 23, 16, 1, 8, '#a16207');

      // Pale Green Alien Head
      this.px(ctx, 10, 10, 12, 6, c_alien_skin);

      // Fedora with Holes for Antennae!
      this.px(ctx, 9, 6, 14, 5, '#78350f');
      this.px(ctx, 7, 9, 18, 2, '#451a03');

      // Two Springy Green Antennae with Glowing Bulbs!
      this.px(ctx, 11, 1, 2, 5, c_alien_dark);
      this.px(ctx, 10, 0, 4, 2, '#4ade80'); // glowing orb left
      this.px(ctx, 19, 1, 2, 5, c_alien_dark);
      this.px(ctx, 18, 0, 4, 2, '#4ade80'); // glowing orb right

      if (!isBack) {
        // Dark sunglasses failing to hide large alien eyes
        this.px(ctx, 11, 11, 10, 3, '#020617');
        this.px(ctx, 12, 12, 2, 1, '#22c55e'); // green alien reflection
        this.px(ctx, 18, 12, 2, 1, '#22c55e');
      }
    }
    else if (type === 'hazmat') {
      // Biohazard Containment Technician (Yellow Sealed Suit)
      const c_haz_y = '#eab308';
      const c_haz_hi = '#facc15';
      const c_haz_sh = '#ca8a04';

      this.px(ctx, 10, 24, 4, 3, c_haz_sh);
      this.px(ctx, 18, 24, 4, 3, c_haz_sh);
      this.px(ctx, 9, 26, 5, 2, '#854d0e'); // heavy boots
      this.px(ctx, 18, 26, 5, 2, '#854d0e');

      // Bulky Yellow Containment Suit
      this.px(ctx, 7, 15, 18, 9, c_haz_y);
      this.px(ctx, 7, 15, 1, 9, c_haz_sh);
      this.px(ctx, 24, 15, 1, 9, c_haz_sh);
      this.px(ctx, 6, 19, 2, 4, '#0f172a'); // heavy black gloves
      this.px(ctx, 24, 19, 2, 4, '#0f172a');

      // Domed Helmet
      this.px(ctx, 9, 6, 14, 9, c_haz_y);
      this.px(ctx, 10, 5, 12, 1, c_haz_hi);

      if (!isBack) {
        // Curved Glass Visor Reflecting Eerie Purple Glow
        this.px(ctx, 11, 8, 10, 5, '#1e1b4b');
        this.px(ctx, 12, 9, 8, 3, '#7e22ce');
        this.px(ctx, 13, 9, 4, 1, '#c084fc'); // visor glare
        // Chest air intake valve
        this.px(ctx, 15, 17, 2, 2, '#0f172a');
      } else {
        // Dual Oxygen Filtration Tanks on Back
        this.px(ctx, 10, 16, 4, 8, '#cbd5e1');
        this.px(ctx, 18, 16, 4, 8, '#cbd5e1');
        this.px(ctx, 14, 17, 4, 2, '#94a3b8'); // connecting manifold
      }
    }
    else if (type === 'dog') {
      // Buster the Golden Retriever (Classic Pokémon companion proportions)
      const c_fur = '#f59e0b';
      const c_fur_hi = '#fbbf24';
      const c_fur_sh = '#d97706';

      if (!isBack) {
        // Body & Paws
        this.px(ctx, 10, 17, 12, 8, c_fur);
        this.px(ctx, 10, 24, 3, 3, c_fur_sh); // front paws
        this.px(ctx, 19, 24, 3, 3, c_fur_sh);

        // Head
        this.px(ctx, 10, 9, 12, 8, c_fur);
        this.px(ctx, 12, 8, 8, 2, c_fur_hi);

        // Floppy Ears
        this.px(ctx, 8, 9, 3, 6, c_fur_sh);
        this.px(ctx, 21, 9, 3, 6, c_fur_sh);

        // Shiny Dark Eyes & Nose
        this.px(ctx, 12, 11, 2, 2, '#0f172a');
        this.px(ctx, 18, 11, 2, 2, '#0f172a');
        this.px(ctx, 14, 13, 4, 2, '#0f172a'); // nose

        // Happy Panting Pink Tongue
        this.px(ctx, 15, 15, 2, 2, '#f472b6');

        // Red Collar & Gold Tag
        this.px(ctx, 11, 16, 10, 2, '#dc2626');
        this.px(ctx, 15, 17, 2, 2, '#eab308');

        // Fluffy Wagging Tail
        this.px(ctx, 22, 18, 3, 3, c_fur);
        this.px(ctx, 24, 16, 2, 3, c_fur_hi);
      } else {
        // Back of Dog
        this.px(ctx, 10, 16, 12, 9, c_fur);
        this.px(ctx, 10, 9, 12, 8, c_fur);
        this.px(ctx, 8, 9, 3, 6, c_fur_sh);
        this.px(ctx, 21, 9, 3, 6, c_fur_sh);
        this.px(ctx, 11, 16, 10, 2, '#dc2626'); // collar
        // Wagging tail up!
        this.px(ctx, 15, 14, 3, 4, c_fur_hi);
      }
    }
    else if (type === 'cow') {
      // Bessie the Dairy Cow (Pokémon Miltank style)
      this.px(ctx, 6, 12, 20, 12, '#ffffff');
      this.px(ctx, 9, 14, 5, 5, '#0f172a'); // black spots
      this.px(ctx, 18, 13, 6, 6, '#0f172a');
      this.px(ctx, 7, 23, 4, 4, '#0f172a'); // hooves
      this.px(ctx, 21, 23, 4, 4, '#0f172a');

      // Head & Pink Muzzle
      this.px(ctx, 11, 7, 10, 8, '#ffffff');
      this.px(ctx, 12, 11, 8, 4, '#f472b6'); // pink snout
      this.px(ctx, 14, 12, 1, 1, '#9d174d'); // nostrils
      this.px(ctx, 17, 12, 1, 1, '#9d174d');

      // Horns & Ears
      this.px(ctx, 9, 5, 2, 3, '#ca8a04'); // horns
      this.px(ctx, 21, 5, 2, 3, '#ca8a04');
      this.px(ctx, 7, 8, 4, 2, '#ffffff'); // floppy ears
      this.px(ctx, 21, 8, 4, 2, '#ffffff');
      this.px(ctx, 6, 8, 2, 2, '#eab308'); // yellow ear tag!

      // Cowbell around neck
      this.px(ctx, 12, 15, 8, 2, '#78350f'); // leather collar
      this.px(ctx, 15, 17, 2, 3, '#eab308'); // brass bell
    }
    else if (type === 'alien_cat') {
      // Cosmo the 3-Eyed Cosmic Cat
      const c_cat = '#0f172a';
      // Body & Paws
      this.px(ctx, 11, 18, 10, 7, c_cat);
      this.px(ctx, 12, 24, 3, 2, '#1e293b');
      this.px(ctx, 17, 24, 3, 2, '#1e293b');

      // Pointed Alert Ears
      this.px(ctx, 11, 7, 3, 4, c_cat);
      this.px(ctx, 18, 7, 3, 4, c_cat);
      this.px(ctx, 12, 8, 1, 2, '#f472b6'); // pink inner ear
      this.px(ctx, 19, 8, 1, 2, '#f472b6');

      // Head
      this.px(ctx, 11, 10, 10, 8, c_cat);

      if (!isBack) {
        // Two Emerald Green Cat Eyes
        this.px(ctx, 12, 13, 2, 2, '#22c55e');
        this.px(ctx, 18, 13, 2, 2, '#22c55e');

        // Mystical Third Eye Glowing Cyan in Center of Forehead!
        this.px(ctx, 15, 10, 2, 2, '#38bdf8');
        this.px(ctx, 15, 10, 1, 1, '#ffffff'); // psychic highlight

        // Nose & Whiskers
        this.px(ctx, 15, 15, 2, 1, '#f472b6');
        this.px(ctx, 9, 14, 2, 1, '#ffffff');
        this.px(ctx, 21, 14, 2, 1, '#ffffff');
      }

      // Graceful Curving Tail with Glowing Cyan Tip
      this.px(ctx, 21, 19, 2, 4, c_cat);
      this.px(ctx, 23, 16, 2, 4, c_cat);
      this.px(ctx, 23, 15, 3, 2, '#38bdf8'); // glowing tip!
    }
  }


  // ==========================================
  // 6. ITEM & GADGET ICONS
  // ==========================================
  generateItemIcons() {
    const icons = [
      'emf', 'camera', 'tinfoil', 'dossier',
      'slime', 'donut', 'transceiver', 'clover', 'magnifier', 'badge',
      'keycard'
    ];

    icons.forEach(name => {
      const { canvas, ctx } = this.createCanvas();
      this.renderIcon(ctx, name);
      this.cache[`icon_${name}`] = canvas;
    });
  }

  renderIcon(ctx, name) {
    if (name === 'keycard') {
      // Area 51 Gold High-Security Clearance Keycard
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.roundRect(4, 6, 24, 20, 3);
      ctx.fill();
      this.px(ctx, 4, 10, 24, 4, '#dc2626'); // Red clearance stripe
      this.px(ctx, 8, 16, 8, 6, '#0f172a'); // chip
      this.px(ctx, 18, 17, 6, 2, '#ffffff'); // barcode
      this.px(ctx, 18, 20, 6, 1, '#ffffff');
    }
    else if (name === 'emf') {
      this.px(ctx, 8, 4, 16, 24, '#1f2937');
      this.px(ctx, 10, 6, 12, 10, '#111827');
      this.px(ctx, 11, 8, 2, 4, '#22c55e');
      this.px(ctx, 14, 8, 2, 4, '#eab308');
      this.px(ctx, 17, 8, 2, 4, '#ef4444');
      this.px(ctx, 15, 0, 2, 5, '#9ca3af');
    }
    else if (name === 'camera') {
      this.px(ctx, 4, 8, 24, 18, '#f3f4f6');
      this.px(ctx, 4, 16, 24, 2, '#e11d48');
      this.px(ctx, 4, 18, 24, 1, '#f59e0b');
      this.px(ctx, 4, 19, 24, 1, '#10b981');
      this.px(ctx, 4, 20, 24, 1, '#3b82f6');
      this.px(ctx, 12, 11, 8, 8, '#1f2937');
      this.px(ctx, 14, 13, 4, 4, '#60a5fa');
    }
    else if (name === 'tinfoil') {
      this.px(ctx, 4, 18, 24, 4, '#94a3b8');
      this.px(ctx, 8, 8, 16, 11, '#cbd5e1');
      this.px(ctx, 10, 4, 12, 6, '#e2e8f0');
      this.px(ctx, 13, 1, 6, 4, '#ffffff');
    }
    else if (name === 'dossier') {
      this.px(ctx, 4, 4, 24, 24, '#ca8a04');
      this.px(ctx, 4, 4, 12, 4, '#eab308');
      this.px(ctx, 6, 8, 20, 18, '#fef08a');
      this.px(ctx, 8, 14, 16, 6, '#dc2626');
      this.px(ctx, 10, 16, 12, 2, '#ffffff');
    }
    else if (name === 'slime') {
      this.px(ctx, 8, 8, 16, 18, '#ffffff');
      this.px(ctx, 10, 4, 12, 4, '#ca8a04');
      this.px(ctx, 10, 11, 12, 13, '#22c55e');
      this.px(ctx, 12, 13, 8, 8, '#86efac');
    }
    else if (name === 'donut') {
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(16, 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    else if (name === 'transceiver') {
      this.px(ctx, 9, 10, 14, 18, '#374151');
      this.px(ctx, 12, 2, 2, 9, '#9ca3af');
      this.px(ctx, 11, 13, 10, 6, '#10b981');
    }
    else if (name === 'clover') {
      this.px(ctx, 15, 14, 2, 14, '#15803d');
      this.px(ctx, 10, 8, 6, 6, '#22c55e');
      this.px(ctx, 16, 8, 6, 6, '#22c55e');
      this.px(ctx, 10, 14, 6, 6, '#22c55e');
      this.px(ctx, 16, 14, 6, 6, '#22c55e');
      this.px(ctx, 14, 12, 4, 4, '#86efac');
    }
    else if (name === 'magnifier') {
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(14, 12, 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(14, 12, 6, 0, Math.PI * 2);
      ctx.fill();
      this.px(ctx, 18, 18, 10, 10, '#78350f');
    }
    else if (name === 'badge') {
      this.px(ctx, 11, 4, 10, 24, '#eab308');
      this.px(ctx, 4, 11, 24, 10, '#eab308');
      this.px(ctx, 8, 8, 16, 16, '#facc15');
    }
  }

  // ==========================================
  // 7. RETRO CAR SPRITES & BUMP PARTICLES
  // ==========================================
  generateCarSprites() {
    const colors = {
      red: { body: '#dc2626', trim: '#b91c1c', roof: '#ef4444' },
      blue: { body: '#2563eb', trim: '#1d4ed8', roof: '#3b82f6' },
      yellow: { body: '#eab308', trim: '#ca8a04', roof: '#facc15' }, // Cab
      black: { body: '#181b20', trim: '#0f172a', roof: '#334155' }  // G-Man Cruiser
    };

    // Horizontal Cars: 48px wide x 28px tall
    Object.keys(colors).forEach(cName => {
      const c = colors[cName];

      // Moving Right (East)
      {
        const { canvas, ctx } = this.createCanvas(48, 28);
        // Rubber tires
        this.px(ctx, 6, 20, 8, 6, '#0f172a');
        this.px(ctx, 32, 20, 8, 6, '#0f172a');
        this.px(ctx, 8, 22, 4, 2, '#94a3b8'); // hubcap
        this.px(ctx, 34, 22, 4, 2, '#94a3b8');

        // Car Main Body
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(4, 10, 40, 12, [3, 6, 2, 2]);
        ctx.fill();

        // Cabin / Roof
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(14, 4, 20, 8, [4, 4, 0, 0]);
        ctx.fill();

        // Windows
        this.px(ctx, 16, 6, 6, 5, '#38bdf8'); // rear
        this.px(ctx, 24, 6, 8, 5, '#38bdf8'); // front windshield

        // Chrome Bumpers
        this.px(ctx, 2, 16, 3, 4, '#cbd5e1');
        this.px(ctx, 43, 16, 3, 4, '#cbd5e1');

        // Headlights (Right side)
        this.px(ctx, 42, 12, 2, 3, '#fef08a');
        // Taillights (Left side)
        this.px(ctx, 4, 12, 2, 3, '#ef4444');

        this.cache[`car_right_${cName}`] = canvas;
      }

      // Moving Left (West)
      {
        const { canvas, ctx } = this.createCanvas(48, 28);
        this.px(ctx, 8, 20, 8, 6, '#0f172a');
        this.px(ctx, 34, 20, 8, 6, '#0f172a');
        this.px(ctx, 10, 22, 4, 2, '#94a3b8');
        this.px(ctx, 36, 22, 4, 2, '#94a3b8');

        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(4, 10, 40, 12, [6, 3, 2, 2]);
        ctx.fill();

        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(14, 4, 20, 8, [4, 4, 0, 0]);
        ctx.fill();

        this.px(ctx, 16, 6, 8, 5, '#38bdf8'); // front windshield
        this.px(ctx, 26, 6, 6, 5, '#38bdf8'); // rear

        this.px(ctx, 2, 16, 3, 4, '#cbd5e1');
        this.px(ctx, 43, 16, 3, 4, '#cbd5e1');

        // Headlights (Left side)
        this.px(ctx, 4, 12, 2, 3, '#fef08a');
        // Taillights (Right side)
        this.px(ctx, 42, 12, 2, 3, '#ef4444');

        this.cache[`car_left_${cName}`] = canvas;
      }

      // Moving Down (South): 28px wide x 48px tall
      {
        const { canvas, ctx } = this.createCanvas(28, 48);
        // Tires on sides
        this.px(ctx, 1, 8, 4, 8, '#0f172a');
        this.px(ctx, 23, 8, 4, 8, '#0f172a');
        this.px(ctx, 1, 32, 4, 8, '#0f172a');
        this.px(ctx, 23, 32, 4, 8, '#0f172a');

        // Body
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(4, 4, 20, 40, [4, 4, 6, 6]);
        ctx.fill();

        // Roof
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(6, 14, 16, 18, 3);
        ctx.fill();

        // Front Windshield (Bottom)
        this.px(ctx, 7, 30, 14, 4, '#38bdf8');
        // Rear Windshield (Top)
        this.px(ctx, 7, 12, 14, 3, '#38bdf8');

        // Front Headlights
        this.px(ctx, 5, 42, 4, 2, '#fef08a');
        this.px(ctx, 19, 42, 4, 2, '#fef08a');
        // Rear Taillights
        this.px(ctx, 5, 4, 4, 2, '#ef4444');
        this.px(ctx, 19, 4, 4, 2, '#ef4444');

        this.cache[`car_down_${cName}`] = canvas;
      }

      // Moving Up (North): 28px wide x 48px tall
      {
        const { canvas, ctx } = this.createCanvas(28, 48);
        this.px(ctx, 1, 8, 4, 8, '#0f172a');
        this.px(ctx, 23, 8, 4, 8, '#0f172a');
        this.px(ctx, 1, 32, 4, 8, '#0f172a');
        this.px(ctx, 23, 32, 4, 8, '#0f172a');

        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(4, 4, 20, 40, [6, 6, 4, 4]);
        ctx.fill();

        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(6, 16, 16, 18, 3);
        ctx.fill();

        // Front Windshield (Top)
        this.px(ctx, 7, 14, 14, 4, '#38bdf8');
        // Rear Windshield (Bottom)
        this.px(ctx, 7, 33, 14, 3, '#38bdf8');

        // Front Headlights (Top)
        this.px(ctx, 5, 4, 4, 2, '#fef08a');
        this.px(ctx, 19, 4, 4, 2, '#fef08a');
        // Rear Taillights (Bottom)
        this.px(ctx, 5, 42, 4, 2, '#ef4444');
        this.px(ctx, 19, 42, 4, 2, '#ef4444');

        this.cache[`car_up_${cName}`] = canvas;
      }

      // Parked Car - Horizontal Left Half (32x32 on asphalt)
      {
        const { canvas, ctx } = this.createCanvas(32, 32);
        this.px(ctx, 0, 0, 32, 32, '#2b2f38');
        this.px(ctx, 4, 22, 28, 5, '#181b22');
        this.px(ctx, 8, 19, 8, 6, '#0f172a');
        this.px(ctx, 10, 21, 4, 2, '#94a3b8');
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(4, 9, 28, 12, [3, 0, 0, 2]);
        ctx.fill();
        this.px(ctx, 2, 15, 3, 4, '#cbd5e1');
        this.px(ctx, 4, 11, 2, 3, '#991b1b');
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(14, 3, 18, 8, [4, 0, 0, 0]);
        ctx.fill();
        this.px(ctx, 16, 5, 6, 5, '#38bdf8');
        this.cache[`car_parked_l_${cName}`] = canvas;
      }

      // Parked Car - Horizontal Right Half (32x32 on asphalt)
      {
        const { canvas, ctx } = this.createCanvas(32, 32);
        this.px(ctx, 0, 0, 32, 32, '#2b2f38');
        this.px(ctx, 0, 22, 28, 5, '#181b22');
        this.px(ctx, 14, 19, 8, 6, '#0f172a');
        this.px(ctx, 16, 21, 4, 2, '#94a3b8');
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(0, 9, 28, 12, [0, 6, 2, 0]);
        ctx.fill();
        this.px(ctx, 27, 15, 3, 4, '#cbd5e1');
        this.px(ctx, 26, 11, 2, 3, '#94a3b8');
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(0, 3, 14, 8, [0, 4, 0, 0]);
        ctx.fill();
        this.px(ctx, 2, 5, 8, 5, '#38bdf8');
        this.cache[`car_parked_r_${cName}`] = canvas;
      }

      // Parked Car - Vertical Top Half (32x32 on asphalt)
      {
        const { canvas, ctx } = this.createCanvas(32, 32);
        this.px(ctx, 0, 0, 32, 32, '#2b2f38');
        this.px(ctx, 4, 4, 24, 28, '#181b22');
        this.px(ctx, 3, 12, 3, 8, '#0f172a');
        this.px(ctx, 26, 12, 3, 8, '#0f172a');
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(6, 6, 20, 26, [6, 6, 0, 0]);
        ctx.fill();
        this.px(ctx, 6, 5, 20, 2, '#cbd5e1');
        this.px(ctx, 8, 6, 3, 2, '#94a3b8');
        this.px(ctx, 21, 6, 3, 2, '#94a3b8');
        this.px(ctx, 9, 18, 14, 5, '#38bdf8');
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(8, 23, 16, 9, [3, 3, 0, 0]);
        ctx.fill();
        this.cache[`car_parked_t_${cName}`] = canvas;
      }

      // Parked Car - Vertical Bottom Half (32x32 on asphalt)
      {
        const { canvas, ctx } = this.createCanvas(32, 32);
        this.px(ctx, 0, 0, 32, 32, '#2b2f38');
        this.px(ctx, 4, 0, 24, 26, '#181b22');
        this.px(ctx, 3, 8, 3, 8, '#0f172a');
        this.px(ctx, 26, 8, 3, 8, '#0f172a');
        ctx.fillStyle = c.body;
        ctx.beginPath();
        ctx.roundRect(6, 0, 20, 24, [0, 0, 4, 4]);
        ctx.fill();
        ctx.fillStyle = c.roof;
        ctx.beginPath();
        ctx.roundRect(8, 0, 16, 8, [0, 0, 3, 3]);
        ctx.fill();
        this.px(ctx, 9, 8, 14, 4, '#38bdf8');
        this.px(ctx, 7, 21, 3, 2, '#991b1b');
        this.px(ctx, 22, 21, 3, 2, '#991b1b');
        this.px(ctx, 6, 23, 20, 2, '#cbd5e1');
        this.cache[`car_parked_b_${cName}`] = canvas;
      }
    });

    // Dust Puff Cloud (Comic bump particle)
    {
      const { canvas, ctx } = this.createCanvas(32, 32);
      ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
      ctx.beginPath();
      ctx.arc(16, 16, 8, 0, Math.PI * 2);
      ctx.arc(10, 18, 6, 0, Math.PI * 2);
      ctx.arc(22, 18, 6, 0, Math.PI * 2);
      ctx.arc(14, 10, 5, 0, Math.PI * 2);
      ctx.fill();
      this.cache['dust_puff'] = canvas;
    }

    // Angry Comic Vein Icon
    {
      const { canvas, ctx } = this.createCanvas(20, 20);
      ctx.fillStyle = '#dc2626';
      // Comic cross/quad anger mark
      this.px(ctx, 3, 8, 14, 4, '#dc2626');
      this.px(ctx, 8, 3, 4, 14, '#dc2626');
      this.px(ctx, 5, 5, 10, 10, '#ef4444');
      this.cache['icon_angry'] = canvas;
    }
  }

  get(key) {
    return this.cache[key] || null;
  }
}

// Global sprites singleton
window.spottedSprites = new SpottedSprites();
