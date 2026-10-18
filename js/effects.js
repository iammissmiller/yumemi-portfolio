// Ambient petals / fireflies, the gold-leaf cursor trail, and the "yume" easter egg.
import { reducedMotion } from './store.js';
import { theme } from './theme.js';

/* --- Sakura petals in the morning, fireflies at night (one canvas, paused when the tab is hidden) --- */
export function initAmbient() {
  const canvas = document.querySelector('#ambient');
  const g = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!g || reducedMotion) return;
  let W = 0;
  let H = 0;
  let parts = [];
  let raf = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const count = () => (theme.get() === 'night' ? (W < 600 ? 14 : 26) : (W < 600 ? 8 : 16));
  const make = (anywhere) => (theme.get() === 'morning'
    ? { x: Math.random() * W, y: anywhere ? Math.random() * H : -20, r: 4 + Math.random() * 4,
        vx: 0.2 + Math.random() * 0.4, vy: 0.4 + Math.random() * 0.6,
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.04, sway: Math.random() * 6.28 }
    : { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 20, r: 1.3 + Math.random() * 1.5,
        vx: (Math.random() - 0.5) * 0.3, vy: -(0.12 + Math.random() * 0.25), sway: Math.random() * 6.28 });
  const reset = () => { parts = Array.from({ length: count() }, () => make(true)); };

  const tick = () => {
    raf = requestAnimationFrame(tick);
    g.clearRect(0, 0, W, H);
    const morning = theme.get() === 'morning';
    parts.forEach((p, i) => {
      p.sway += 0.02;
      p.x += p.vx + Math.sin(p.sway) * 0.4;
      p.y += p.vy;
      if (morning) {
        p.rot += p.vr;
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.fillStyle = 'rgba(240, 170, 190, 0.7)';
        g.beginPath();
        g.ellipse(0, 0, p.r, p.r * 0.6, 0, 0, Math.PI * 2);
        g.fill();
        g.restore();
        if (p.y > H + 20 || p.x > W + 20) parts[i] = make(false);
      } else {
        // night: slow specks of dark-blue dust drifting up on the dim paper
        const a = 0.25 + Math.sin(p.sway * 2) * 0.12;
        g.fillStyle = `rgba(40, 55, 110, ${a})`;
        g.beginPath(); g.arc(p.x, p.y, p.r * 1.3, 0, Math.PI * 2); g.fill();
        if (p.y < -20) parts[i] = make(false);
      }
    });
  };

  resize();
  reset();
  tick();
  window.addEventListener('resize', () => { resize(); reset(); });
  theme.onChange(reset);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else if (!raf) { tick(); }
  });
}

/* --- Cursor trail: bright pink sakura petals by day, bright gold-white stars at night --- */
export function initSparkles() {
  if (reducedMotion) return;
  const MAX_ALIVE = 60;
  let alive = 0;
  let last = 0;
  // at night each star gets a bright glowing halo behind it
  const halo = (x, y) => {
    const h = document.createElement('span');
    h.className = 'sparkle halo';
    h.setAttribute('aria-hidden', 'true');
    h.style.left = `${x}px`;
    h.style.top = `${y}px`;
    h.style.setProperty('--s', `${34 + Math.random() * 18}px`);
    h.style.setProperty('--dy', '0px');
    document.body.appendChild(h);
    h.addEventListener('animationend', () => h.remove(), { once: true });
  };
  const spark = (x, y) => {
    if (alive >= MAX_ALIVE) return;
    const night = theme.get() === 'night';
    if (night) halo(x, y);
    const s = document.createElement('span');
    s.className = night ? 'sparkle star' : 'sparkle petal';
    s.setAttribute('aria-hidden', 'true');
    s.style.left = `${x}px`;
    s.style.top = `${y}px`;
    s.style.setProperty('--s', `${(night ? 18 : 11) + Math.random() * (night ? 14 : 10)}px`);
    s.style.setProperty('--rot', `${Math.random() * 360}deg`);
    s.style.setProperty('--dx', `${Math.random() * 40 - 20}px`);
    s.style.setProperty('--dy', `${night ? Math.random() * 20 - 10 : 24 + Math.random() * 24}px`); // petals fall, stars twinkle in place
    document.body.appendChild(s);
    alive++;
    s.addEventListener('animationend', () => { s.remove(); alive--; }, { once: true });
  };
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const now = performance.now();
    if (now - last < 28) return;
    last = now;
    spark(e.clientX, e.clientY);
  }, { passive: true });
  window.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    for (let i = 0; i < 8; i++) spark(e.clientX + Math.random() * 36 - 18, e.clientY + Math.random() * 36 - 18);
  }, { passive: true });
}
