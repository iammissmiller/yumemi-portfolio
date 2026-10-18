// Yumemi's Snack Run: a little catch game that plays right inside the hero.
// Move her with the mouse, a finger, or the arrow keys (A / D). Catch the snacks, dodge the chillies,
// and grab the golden lantern for "wish time" (double points). Her best score is remembered.
import { store, reducedMotion } from './store.js';
import { sound } from './sound.js';

const ROUND = 45;                 // seconds per round
const SPEED = reducedMotion ? 0.7 : 1;
const BEST_KEY = 'yumemi-snack-best';

/* ---------- the snacks: little stickers drawn in SVG ---------- */
const INK = '#3d2c4f';
const face = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">
  <circle cx="-9" cy="0" r="3.4" fill="${INK}"/><circle cx="9" cy="0" r="3.4" fill="${INK}"/>
  <circle cx="-8" cy="-1.2" r="1.1" fill="#fff"/><circle cx="10" cy="-1.2" r="1.1" fill="#fff"/>
  <path d="M-4 5 q4 4 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <ellipse cx="-16" cy="6" rx="4.5" ry="2.8" fill="#ff8fb8" opacity=".75"/><ellipse cx="16" cy="6" rx="4.5" ry="2.8" fill="#ff8fb8" opacity=".75"/></g>`;

const SHAPES = {
  dumpling: `<path class="s" d="M12 68 Q12 30 50 22 Q88 30 88 68 Q88 82 50 82 Q12 82 12 68Z" fill="#fff6e6"/>
    <path d="M50 22 l-10 15 M50 22 l10 15 M50 22 l0 17 M50 22 l-19 11 M50 22 l19 11" stroke="#e5c79f" stroke-width="2.6" stroke-linecap="round" fill="none"/>
    ${face(50, 58)}`,
  onigiri: `<path class="s" d="M50 12 Q60 12 84 60 Q93 84 70 86 L30 86 Q7 84 16 60 Q40 12 50 12Z" fill="#ffffff"/>
    <rect class="s" x="35" y="62" width="30" height="24" rx="3" fill="#2f3d3a"/>
    ${face(50, 46, .9)}`,
  taiyaki: `<path class="s" d="M80 50 L97 33 L95 67Z" fill="#eaa24f"/>
    <path class="s" d="M14 50 Q26 22 60 26 Q80 29 86 50 Q80 71 60 74 Q26 78 14 50Z" fill="#eaa24f"/>
    <path d="M52 38 q6 5 0 10 M64 38 q6 5 0 10 M58 50 q6 5 0 10 M70 50 q6 5 0 10" stroke="#c4782c" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <circle cx="30" cy="45" r="4" fill="${INK}"/><circle cx="31" cy="43.6" r="1.3" fill="#fff"/>
    <path d="M18 54 q5 3 9 0" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
    <ellipse cx="34" cy="55" rx="4.5" ry="2.6" fill="#ff8fb8" opacity=".7"/>`,
  dango: `<path d="M50 4 L50 97" stroke="#c99a62" stroke-width="5" stroke-linecap="round"/>
    <circle class="s" cx="50" cy="24" r="16" fill="#ffb3cf"/>
    <circle class="s" cx="50" cy="50" r="16" fill="#fff8ef"/>
    <circle class="s" cx="50" cy="76" r="16" fill="#acd98c"/>
    ${face(50, 49, .62)}`,
  boba: `<path d="M57 4 L52 34" stroke="#ff8fc6" stroke-width="7" stroke-linecap="round"/>
    <path class="s" d="M26 34 L74 34 L67 88 Q50 93 33 88Z" fill="#f2d4b2"/>
    <path class="s" d="M22 34 Q50 25 78 34 Q50 42 22 34Z" fill="#ffffff"/>
    <circle cx="40" cy="80" r="4.4" fill="${INK}"/><circle cx="51" cy="83" r="4.4" fill="${INK}"/><circle cx="61" cy="79" r="4.4" fill="${INK}"/><circle cx="46" cy="72" r="4.4" fill="${INK}"/>
    ${face(50, 54, .85)}`,
  chilli: `<path class="s" d="M28 24 Q18 62 48 86 Q66 96 76 82 Q50 68 44 28Z" fill="#e33b3b"/>
    <path class="s" d="M26 26 Q30 10 46 14 L46 28 Q36 24 26 26Z" fill="#4caf50"/>
    <path d="M34 44 l8 4 M48 44 l-8 4" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>
    <circle cx="37" cy="52" r="2.8" fill="${INK}"/><circle cx="47" cy="52" r="2.8" fill="${INK}"/>
    <path d="M38 62 q4 -3 8 0" stroke="${INK}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
  lantern: `<path d="M50 82 L50 97" stroke="#c0392b" stroke-width="4" stroke-linecap="round"/>
    <rect class="s" x="39" y="14" width="22" height="10" rx="2" fill="#c0392b"/>
    <path class="s" d="M24 50 Q24 24 50 22 Q76 24 76 50 Q76 76 50 78 Q24 76 24 50Z" fill="#ffd24d"/>
    <path d="M50 23 Q38 50 50 77 M50 23 Q62 50 50 77 M50 23 L50 77" stroke="#f0a020" stroke-width="2.4" fill="none"/>
    <rect class="s" x="39" y="74" width="22" height="9" rx="2" fill="#c0392b"/>
    <path d="M84 16 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#fff6b0"/>`,
};
const GOOD = ['dumpling', 'onigiri', 'taiyaki', 'dango', 'boba'];

// Each sticker is drawn twice: a thick white outline first, then the coloured shapes on top.
const svgFor = (type) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 116 116">
  <style>.o *{fill:#fff!important;stroke:#fff!important;stroke-width:13px!important;stroke-linejoin:round;stroke-linecap:round}.f .s{stroke:${INK};stroke-width:2.6px;stroke-linejoin:round}</style>
  <g class="o">${SHAPES[type]}</g><g class="f">${SHAPES[type]}</g></svg>`;
const SRC = Object.fromEntries(Object.keys(SHAPES).map((t) => [t, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFor(t))}`]));
const IMG = {};
const loadImg = (src) => { const i = new Image(); i.src = src; return i; };
Object.entries(SRC).forEach(([t, s]) => { IMG[t] = loadImg(s); });
const WALK = [0, 1, 2, 3].map((i) => loadImg(`assets/yumemi-walk-${i}.webp`));
const EAT = loadImg('assets/yumemi-eat.webp');
const SLEEP = loadImg('assets/yumemi-sleep.webp');

const LINES = {
  catch: ['Nom! ♡', 'Yum!', 'Mmm~', 'Tasty ✧', 'More please!'],
  chilli: ['Too spicy!!', 'Hot hot hot!', 'Ah! My tongue!'],
  wish: ['Wish time! ✧'],
};
const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function initGame() {
  const hero = document.querySelector('#hello');
  const game = document.querySelector('#game');
  const playBtn = document.querySelector('#playBtn');
  if (!hero || !game || !playBtn) return;
  const canvas = game.querySelector('canvas');
  const g = canvas.getContext('2d');
  const card = game.querySelector('#gCard');
  const startBtn = game.querySelector('#gStart');
  const exitBtn = game.querySelector('#gExit');
  const quitBtn = game.querySelector('#gQuit');
  const result = game.querySelector('#gResult');
  const hudScore = game.querySelector('#gScore');
  const hudTime = game.querySelector('#gTime');
  const hudBest = game.querySelector('#gBest');
  const hudCombo = game.querySelector('#gCombo');

  // the legend on the start card uses the same stickers
  game.querySelectorAll('[data-snack]').forEach((img) => { img.src = SRC[img.dataset.snack]; });

  let W = 0; let H = 0; let floor = 0; let catH = 0;
  let open = false; let running = false; let paused = false;
  let raf = 0; let last = 0;
  const keys = { left: false, right: false };
  let best = parseInt(store.get(BEST_KEY), 10) || 0;
  let s; // the state of the current round

  const fresh = () => ({
    time: ROUND, score: 0, combo: 0, spawnIn: 0.6, foods: [], pops: [], sparks: [],
    x: W / 2, tx: W / 2, facing: 1, walked: 0, eatFor: 0, stunFor: 0, wishFor: 0, started: false,
  });

  function size() {
    const r = game.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const phone = window.innerWidth < 900;
    floor = H - (phone ? 92 : 34);
    catH = Math.max(96, Math.min(180, H * (phone ? 0.19 : 0.22)));
    if (s) { s.x = Math.min(Math.max(s.x, catH * 0.4), W - catH * 0.4); s.tx = s.x; }
  }

  function hud() {
    hudScore.textContent = String(s.score).padStart(5, '0');
    hudTime.textContent = String(Math.ceil(s.time)).padStart(2, '0');
    hudBest.textContent = String(Math.max(best, s.score)).padStart(5, '0');
    const mult = multiplier();
    hudCombo.textContent = s.wishFor > 0 ? `✧ wish time x${mult} ✧` : (s.combo >= 3 ? `combo ${s.combo}  x${mult}` : '');
    game.classList.toggle('wish', s.wishFor > 0);
  }
  const multiplier = () => Math.min(4, 1 + Math.floor(s.combo / 5)) * (s.wishFor > 0 ? 2 : 1);

  function showCard(mode) {
    card.hidden = false;
    card.dataset.mode = mode;
    if (mode === 'intro') { result.textContent = best ? `Your best: ${best} ♡` : ''; startBtn.textContent = 'Start ♡'; }
    if (mode === 'paused') { result.textContent = 'Paused. Yumemi is waiting with her chopsticks.'; startBtn.textContent = 'Keep playing ♡'; }
    if (mode === 'end') {
      const sc = s.score;
      const line = sc < 100 ? 'A little snack is still a snack ♡'
        : sc < 300 ? 'Yum! My tummy is happy (=^･ω･^=)'
          : sc < 600 ? 'So full… time for a nap ✧'
            : 'Legendary appetite! The noodle stall is out of noodles ♡';
      const record = sc > best;
      if (record) { best = sc; store.set(BEST_KEY, String(best)); }
      result.textContent = `${record ? 'New record! ✧ ' : ''}You scored ${sc}. ${line}`;
      startBtn.textContent = 'Play again ♡';
      sound.dream();
    }
    startBtn.focus({ preventScroll: true });
  }

  function openGame() {
    if (open) return;
    open = true;
    window.scrollTo({ top: hero.offsetTop, behavior: 'auto' });
    hero.classList.add('is-playing');
    game.hidden = false;
    size();
    s = fresh();
    hud();
    showCard('intro');
    loop(performance.now());
  }

  function closeGame() {
    if (!open) return;
    open = false; running = false; paused = false;
    cancelAnimationFrame(raf);
    game.hidden = true;
    game.classList.remove('wish');
    hero.classList.remove('is-playing');
    playBtn.focus({ preventScroll: true });
  }

  function start() {
    if (paused) { paused = false; card.hidden = true; last = performance.now(); return; }
    s = fresh();
    s.started = true;
    running = true;
    card.hidden = true;
    hud();
    sound.chime();
    last = performance.now();
  }

  function pause() {
    if (!running || paused) return;
    paused = true;
    showCard('paused');
  }

  function end() {
    running = false;
    s.foods = [];
    s.wishFor = 0; s.stunFor = 0; s.eatFor = 0;
    s.napping = true; // a full tummy means a nap
    hud();
    showCard('end');
  }

  /* ---------- the round ---------- */
  function spawn() {
    const t = 1 - s.time / ROUND; // 0 at the start, 1 at the end
    const sz = Math.max(48, Math.min(76, Math.min(W, H) * 0.085));
    const r = Math.random();
    const hasLantern = s.foods.some((f) => f.type === 'lantern');
    let type = GOOD[Math.floor(Math.random() * GOOD.length)];
    if (s.time < ROUND - 4 && r < 0.17 + t * 0.08) type = 'chilli';
    else if (!hasLantern && r > 0.955) type = 'lantern';
    s.foods.push({
      type, size: type === 'lantern' ? sz * 1.1 : sz,
      x: sz + Math.random() * (W - sz * 2), y: 60 - sz,
      vy: H * (0.26 + t * 0.3) * SPEED * (0.85 + Math.random() * 0.3),
      rot: (Math.random() - 0.5) * 0.6, vr: (Math.random() - 0.5) * 1.6,
    });
    s.spawnIn = (0.85 - t * 0.42) / SPEED * (0.8 + Math.random() * 0.4);
  }

  function pop(text, x, y, color) { s.pops.push({ text, x, y, life: 1, color }); }
  function sparkle(x, y, color) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2; const v = 60 + Math.random() * 120;
      s.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, life: 0.6 + Math.random() * 0.3, color });
    }
  }

  function update(dt) {
    // move Yumemi
    if (s.stunFor > 0) s.stunFor -= dt;
    else if (!s.napping) {
      const keyDir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      if (keyDir) s.tx = s.x + keyDir * W * 0.9 * dt * 1.6;
      const half = catH * 0.4;
      s.tx = Math.min(Math.max(s.tx, half), W - half);
      const before = s.x;
      s.x += (s.tx - s.x) * Math.min(1, dt * 12);
      const dx = s.x - before;
      if (Math.abs(dx) > 0.3) s.facing = dx > 0 ? 1 : -1;
      s.walked += Math.abs(dx);
    }
    s.eatFor = Math.max(0, s.eatFor - dt);
    s.wishFor = Math.max(0, s.wishFor - dt);

    if (!running) return;
    s.time -= dt;
    if (s.time <= 0) { s.time = 0; end(); return; }
    s.spawnIn -= dt;
    if (s.spawnIn <= 0) spawn();

    // her catching zone: around her head and paws
    const zoneTop = floor - catH * 1.0;
    const zoneBot = floor - catH * 0.45;
    const zoneHalf = catH * 0.42;
    s.foods = s.foods.filter((f) => {
      f.y += f.vy * dt;
      f.rot += f.vr * dt;
      const inX = Math.abs(f.x - s.x) < zoneHalf + f.size * 0.35;
      const inY = f.y + f.size * 0.35 > zoneTop && f.y - f.size * 0.35 < zoneBot;
      if (inX && inY) { caught(f); return false; }
      if (f.y - f.size > floor) {
        if (GOOD.includes(f.type)) s.combo = 0; // a missed snack breaks the combo
        return false;
      }
      return true;
    });
    hud();
  }

  function caught(f) {
    const y = floor - catH * 1.05;
    if (f.type === 'chilli') {
      s.combo = 0; s.stunFor = 1; s.eatFor = 0;
      pop(pick(LINES.chilli), s.x, y, '#e33b3b');
      sound.mrrp();
      return;
    }
    if (f.type === 'lantern') {
      s.wishFor = 6;
      s.score += 25 * (Math.min(4, 1 + Math.floor(s.combo / 5)));
      pop(pick(LINES.wish), s.x, y, '#f0a020');
      sparkle(f.x, f.y, '#ffd24d');
      sound.dream();
      return;
    }
    s.combo += 1;
    const pts = 10 * multiplier();
    s.score += pts;
    s.eatFor = 0.35;
    pop(s.combo % 5 === 0 ? `combo ${s.combo}! +${pts}` : `${pick(LINES.catch)} +${pts}`, s.x, y, '#f0559a');
    sparkle(f.x, f.y, '#ff8fc6');
    sound.stop(s.combo);
    if (s.combo % 5 === 0) sound.slurp();
  }

  /* ---------- drawing ---------- */
  function draw(dt) {
    g.clearRect(0, 0, W, H);
    // soft shadow under her
    g.fillStyle = 'rgba(60, 30, 60, .16)';
    g.beginPath(); g.ellipse(s.x, floor - 4, catH * 0.34, catH * 0.06, 0, 0, Math.PI * 2); g.fill();

    // Yumemi
    const eating = s.eatFor > 0;
    const img = s.napping ? SLEEP : eating ? EAT : WALK[Math.floor(s.walked / (catH * 0.16)) % WALK.length];
    if (img.complete && img.naturalWidth) {
      const h = s.napping ? catH * 0.7 : eating ? catH * 0.9 : catH;
      const w = h * (img.naturalWidth / img.naturalHeight);
      const shake = s.stunFor > 0 && !reducedMotion ? Math.sin(performance.now() / 30) * 4 : 0;
      g.save();
      g.translate(s.x + shake, floor);
      if (!eating && !s.napping && s.facing < 0) g.scale(-1, 1);
      g.drawImage(img, -w / 2, -h, w, h);
      g.restore();
      if (s.stunFor > 0) { g.font = `${Math.round(catH * 0.2)}px sans-serif`; g.textAlign = 'center'; g.fillText('💦', s.x + catH * 0.32, floor - catH * 0.95); }
    }

    // snacks
    s.foods.forEach((f) => {
      const im = IMG[f.type];
      if (!im.complete) return;
      g.save();
      g.translate(f.x, f.y);
      g.rotate(f.rot);
      if (f.type === 'lantern') { g.shadowColor = 'rgba(255, 190, 60, .9)'; g.shadowBlur = 24; }
      g.drawImage(im, -f.size / 2, -f.size / 2, f.size, f.size);
      g.restore();
    });

    // sparkles
    s.sparks = s.sparks.filter((p) => {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt;
      g.globalAlpha = Math.max(0, p.life / 0.9);
      g.fillStyle = p.color;
      g.beginPath(); g.arc(p.x, p.y, 3.2, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 1;
      return p.life > 0;
    });

    // floating words
    const fontPx = Math.round(Math.max(15, Math.min(22, W * 0.02)));
    g.font = `700 ${fontPx}px "Zen Maru Gothic", sans-serif`;
    g.textAlign = 'center';
    s.pops = s.pops.filter((p) => {
      p.life -= dt * 0.9; p.y -= 40 * dt;
      g.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
      g.lineWidth = 5; g.strokeStyle = '#fff'; g.lineJoin = 'round';
      g.strokeText(p.text, p.x, p.y);
      g.fillStyle = p.color; g.fillText(p.text, p.x, p.y);
      g.globalAlpha = 1;
      return p.life > 0;
    });
  }

  function loop(now) {
    if (!open) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    if (!paused) update(dt);
    draw(paused ? 0 : dt);
    raf = requestAnimationFrame(loop);
  }

  /* ---------- controls ---------- */
  playBtn.addEventListener('click', openGame);
  startBtn.addEventListener('click', start);
  exitBtn.addEventListener('click', closeGame);
  quitBtn.addEventListener('click', closeGame);

  const aim = (e) => {
    if (!open || !s) return;
    const r = canvas.getBoundingClientRect();
    s.tx = e.clientX - r.left;
  };
  canvas.addEventListener('pointermove', aim);
  canvas.addEventListener('pointerdown', aim);

  window.addEventListener('keydown', (e) => {
    if (!open) return;
    const k = e.key;
    if (k === 'Escape') { closeGame(); return; }
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') { keys.left = true; e.preventDefault(); }
    if (k === 'ArrowRight' || k === 'd' || k === 'D') { keys.right = true; e.preventDefault(); }
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(k)) e.preventDefault();
    if (k === ' ' && card.hidden) e.preventDefault(); // space never scrolls the page mid-game
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key;
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') keys.left = false;
    if (k === 'ArrowRight' || k === 'd' || k === 'D') keys.right = false;
  });
  // the page stays put while you play
  window.addEventListener('wheel', (e) => { if (open) e.preventDefault(); }, { passive: false });
  // leaving: a menu link, another tab, or a resize
  document.addEventListener('click', (e) => { if (open && e.target.closest('a[href^="#"]') && !game.contains(e.target)) closeGame(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('resize', () => { if (open) size(); });
}
