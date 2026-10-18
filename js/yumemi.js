// Yumemi in the hero.
// Day: she holds up her lantern, leans toward your cursor (or finger) and her eyes follow it.
// Night: she is curled up asleep with her lantern glowing; tap her and she wakes for a moment.
// Pat her and she waves. Leave her alone for a while and she dozes off.
// Easter egg: tap or click her lantern and a wish lantern floats up into the sky.
import { reducedMotion, store } from './store.js';
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
new Image().src = 'assets/wish-lantern.webp';

const bubble = document.querySelector('#bubble');
export const say = (text) => { if (bubble) bubble.textContent = text; };

// Where things are in the lantern pose painting (461 x 496 pixels)
const ART = { w: 461, h: 496 };
const LANTERN = { x1: 14, x2: 136, y1: 250, y2: 425 }; // the paper lantern she holds
const EYE_TRAVEL = 4.5;                                  // how far her pupils can move (painting pixels)

export function initYumemi() {
  const btn = document.querySelector('#yumemi');
  const img = btn.querySelector('.pose');
  const eyes = [...btn.querySelectorAll('.eye-look')];
  let pose = '';
  let idleAsleep = false; // fell asleep in the day because nobody was around
  let timer = 0;

  const restingPose = () => (theme.get() === 'night' ? 'sleep' : 'lantern');
  const setPose = (name) => {
    pose = name;
    if (img.getAttribute('src') !== POSES[name]) img.src = POSES[name];
    btn.dataset.pose = name;
    if (name !== 'lantern') btn.style.transform = '';
  };
  setPose(restingPose());

  const backToRest = (after) => {
    clearTimeout(timer);
    timer = setTimeout(() => setPose(restingPose()), after);
  };

  function wakeFromIdle() {
    if (!idleAsleep) return;
    idleAsleep = false;
    setPose(restingPose());
    say("Oh! You're back. I was only resting my eyes.");
  }

  theme.onChange((next) => {
    clearTimeout(timer);
    idleAsleep = false;
    setPose(restingPose());
    say(next === 'morning' ? 'Sakura morning! Time to wander ✧' : 'Zzz… night already. Tap me if you need me ♡');
  });

  /* --- the Easter egg: a wish lantern --- */
  let wishing = false;
  function releaseWish() {
    if (wishing) return;
    wishing = true;
    const wishes = (parseInt(store.get('yumemi-wishes'), 10) || 0) + 1;
    store.set('yumemi-wishes', String(wishes));
    say(wishes === 1 ? 'You found my wish lantern! Make a wish ✧' : `Wish number ${wishes} is on its way ✧`);
    sound.dream();

    const r = img.getBoundingClientRect();
    const sx = r.width / ART.w;
    const sy = r.height / ART.h;
    const left = r.left + LANTERN.x1 * sx;
    const top = r.top + LANTERN.y1 * sy;
    const width = (LANTERN.x2 - LANTERN.x1) * sx;

    if (typeof window.confetti === 'function') {
      window.confetti({
        particleCount: 70, spread: 70, startVelocity: 28, gravity: .6, ticks: 220,
        origin: { x: (left + width / 2) / window.innerWidth, y: (top + width * .7) / window.innerHeight },
        colors: ['#ff8fc6', '#ffd36b', '#b9a4ff', '#ffffff'], shapes: ['circle', 'star'],
        disableForReducedMotion: true,
      });
    }

    const { gsap } = window;
    if (!gsap || reducedMotion) { setTimeout(() => { wishing = false; }, 1500); return; }
    const fly = document.createElement('img');
    fly.src = 'assets/wish-lantern.webp';
    fly.alt = '';
    fly.className = 'wish-lantern';
    fly.setAttribute('aria-hidden', 'true');
    Object.assign(fly.style, { left: `${left}px`, top: `${top}px`, width: `${width}px` });
    document.body.append(fly);
    gsap.timeline({ onComplete: () => { fly.remove(); wishing = false; } })
      .fromTo(fly, { scale: .9, autoAlpha: 0 }, { scale: 1.1, autoAlpha: 1, duration: .4, ease: 'back.out(2)' })
      .to(fly, { y: -(top + width * 2), duration: 5, ease: 'power1.in' }, .3)
      .to(fly, { x: '+=40', rotation: 6, duration: 1.2, yoyo: true, repeat: 3, ease: 'sine.inOut' }, .3)
      .to(fly, { scale: .45, autoAlpha: 0, duration: 1.4, ease: 'power1.in' }, 3.9);
  }

  const onLantern = (e) => {
    if (pose !== 'lantern' || !e || e.clientX == null || (e.clientX === 0 && e.clientY === 0)) return false;
    const r = img.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * ART.w;
    const y = ((e.clientY - r.top) / r.height) * ART.h;
    return x >= LANTERN.x1 && x <= LANTERN.x2 && y >= LANTERN.y1 && y <= LANTERN.y2;
  };

  /* --- pat her --- */
  const pats = ['Mrrp! ♡', 'Hehe, that tickles (=^･ω･^=)', 'Noodles later?', 'Purrr… ✧', 'Stay little with me ♡'];
  let patCount = 0;
  btn.addEventListener('click', (e) => {
    if (onLantern(e)) { releaseWish(); return; }
    idleAsleep = false;
    btn.classList.remove('bounce');
    void btn.offsetWidth; // restart the hop animation
    btn.classList.add('bounce');
    sound.mrrp();
    if (pose === 'sleep') {
      // woken up (at night): she opens her eyes and looks at you, then dozes off again
      setPose('lantern');
      say('Mrrp? Is it morning already?');
      if (theme.get() === 'night') backToRest(4500);
      return;
    }
    setPose('wave');
    say(pats[patCount++ % pats.length]);
    backToRest(1600);
  });

  /* --- she leans toward the pointer (or finger) and her eyes follow it --- */
  let lastInput = performance.now();
  let target = null;
  let frame = 0;
  const follow = () => {
    frame = 0;
    if (!target || pose !== 'lantern') return;
    const r = btn.getBoundingClientRect();
    const dx = target.x - (r.left + r.width / 2);
    const dy = target.y - (r.top + r.height * 0.35);
    const tilt = Math.max(-7, Math.min(7, dx / 60));
    const lift = Math.max(-6, Math.min(4, dy / 90));
    btn.style.transform = `rotate(${tilt.toFixed(2)}deg) translateY(${lift.toFixed(1)}px)`;

    const ir = img.getBoundingClientRect();
    eyes.forEach((eye) => {
      const ex = ir.left + (Number(eye.dataset.cx) / ART.w) * ir.width;
      const ey = ir.top + (Number(eye.dataset.cy) / ART.h) * ir.height;
      const ddx = target.x - ex;
      const ddy = target.y - ey;
      const dist = Math.hypot(ddx, ddy) || 1;
      const reach = Math.min(1, dist / 220) * EYE_TRAVEL;
      eye.setAttribute('transform', `translate(${((ddx / dist) * reach).toFixed(2)} ${((ddy / dist) * reach * 0.8).toFixed(2)})`);
    });
  };
  const onInput = (x, y) => {
    target = { x, y };
    lastInput = performance.now();
    if (idleAsleep) wakeFromIdle();
    if (!frame && !reducedMotion) frame = requestAnimationFrame(follow);
  };
  window.addEventListener('pointermove', (e) => onInput(e.clientX, e.clientY), { passive: true });
  window.addEventListener('pointerdown', (e) => onInput(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => { const t = e.touches[0]; if (t) onInput(t.clientX, t.clientY); }, { passive: true });
  window.addEventListener('keydown', () => { lastInput = performance.now(); if (idleAsleep) wakeFromIdle(); });
  window.addEventListener('scroll', () => { lastInput = performance.now(); }, { passive: true });

  // In the day, she dozes off after 25 quiet seconds (and wakes when you come back)
  setInterval(() => {
    if (!idleAsleep && pose === 'lantern' && theme.get() !== 'night' && performance.now() - lastInput > 25000) {
      idleAsleep = true;
      setPose('sleep');
      say('Zzz… (move your mouse or tap to wake me)');
    }
  }, 2000);
}
