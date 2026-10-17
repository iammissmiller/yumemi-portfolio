// Yumemi in the hero: she leans toward the cursor, waves when patted and dozes off when left alone.
import { reducedMotion } from './store.js';
import { sound } from './sound.js';
import { theme } from './theme.js';

export const POSES = {
  lantern: 'assets/yumemi-lantern.webp',
  walk: 'assets/yumemi-walk.webp',
  wave: 'assets/yumemi-wave.webp',
  eat: 'assets/yumemi-eat.webp',
  sleep: 'assets/yumemi-sleep.webp',
  back: 'assets/yumemi-back.webp',
};

// Preload every pose so swapping never flickers.
Object.values(POSES).forEach((src) => { const i = new Image(); i.src = src; });

const bubble = document.querySelector('#bubble');
export const say = (text) => { if (bubble) bubble.textContent = text; };

export function initYumemi() {
  const btn = document.querySelector('#yumemi');
  const img = btn.querySelector('.pose');
  let asleep = false;
  let happyTimer = 0;

  // she holds up her lantern (it glows at night)
  const restingPose = () => 'lantern';
  const setPose = (name) => {
    if (img.getAttribute('src') !== POSES[name]) img.src = POSES[name];
    btn.classList.toggle('asleep', name === 'sleep');
  };
  setPose(restingPose());

  function wake(announce) {
    if (!asleep) return;
    asleep = false;
    setPose(restingPose());
    if (announce) say("Oh! You're back. I was only resting my eyes.");
  }

  theme.onChange((next) => {
    wake();
    if (!asleep) setPose(restingPose());
    say(next === 'morning' ? 'Sakura morning! Time to wander ✧' : 'Night already? Good thing I brought my lantern ♡');
  });

  // Pat her
  const pats = ['Mrrp! ♡', 'Hehe, that tickles (=^･ω･^=)', 'Noodles later?', 'Purrr… ✧', 'Stay little with me ♡'];
  let patCount = 0;
  btn.addEventListener('click', () => {
    wake();
    clearTimeout(happyTimer);
    setPose('wave');
    btn.classList.remove('bounce');
    void btn.offsetWidth; // restart the hop animation
    btn.classList.add('bounce');
    sound.mrrp();
    say(pats[patCount++ % pats.length]);
    happyTimer = setTimeout(() => setPose(restingPose()), 1600);
  });

  // Lean toward the pointer (or finger)
  let lastInput = performance.now();
  let target = null;
  let frame = 0;
  const lean = () => {
    frame = 0;
    if (!target || asleep) return;
    const r = btn.getBoundingClientRect();
    const dx = target.x - (r.left + r.width / 2);
    const dy = target.y - (r.top + r.height * 0.35);
    const tilt = Math.max(-7, Math.min(7, dx / 60));
    const lift = Math.max(-6, Math.min(4, dy / 90));
    btn.style.transform = `rotate(${tilt.toFixed(2)}deg) translateY(${lift.toFixed(1)}px)`;
  };
  const onInput = (x, y) => {
    target = { x, y };
    lastInput = performance.now();
    if (asleep) wake(true);
    if (!frame && !reducedMotion) frame = requestAnimationFrame(lean);
  };
  window.addEventListener('pointermove', (e) => onInput(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => onInput(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onInput(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('keydown', () => { lastInput = performance.now(); if (asleep) wake(true); });
  window.addEventListener('scroll', () => { lastInput = performance.now(); }, { passive: true });

  // Doze off after 25 quiet seconds
  setInterval(() => {
    if (!asleep && performance.now() - lastInput > 25000) {
      asleep = true;
      btn.style.transform = '';
      setPose('sleep');
      say('Zzz… (move your mouse or tap to wake me)');
    }
  }, 2000);
}
