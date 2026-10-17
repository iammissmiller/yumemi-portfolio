// Yumemi, the companion: once you leave the hero she stays in the corner,
// changing pose and saying something for each section. Pat her for more.
import { reducedMotion } from './store.js';
import { sound } from './sound.js';
import { POSES } from './yumemi.js';

const EXTRA_LINES = [
  'Mrrp! (=^･ω･^=)',
  'Have you eaten yet? ♡',
  'Slow down. The petals will wait for you.',
  'brb, noodles (´｡• ω •｡`)',
  'That tickles! ✧',
];

export function initCompanion() {
  const box = document.querySelector('.companion');
  if (!box) return;
  const cat = box.querySelector('.companion-cat');
  const img = cat.querySelector('img');
  const bubble = box.querySelector('.companion-bubble');
  const { gsap } = window;
  const animate = gsap && !reducedMotion;

  let current = null;
  let shown = false;
  let bubbleTimer = 0;
  let extra = 0;
  const said = new WeakSet(); // sections whose line she has already said on tap

  const speak = (text) => {
    clearTimeout(bubbleTimer);
    bubble.textContent = text;
    if (animate) gsap.fromTo(bubble, { autoAlpha: 0, scale: .6, transformOrigin: '100% 100%' }, { autoAlpha: 1, scale: 1, duration: .45, ease: 'back.out(2)' });
    bubbleTimer = setTimeout(() => {
      if (animate) gsap.to(bubble, { autoAlpha: 0, duration: .4, onComplete: () => { bubble.textContent = ''; } });
      else bubble.textContent = '';
    }, 5200);
  };

  const hop = () => { if (animate) gsap.fromTo(img, { y: 0 }, { y: -14, duration: .18, yoyo: true, repeat: 1, ease: 'power2.out' }); };

  const show = () => {
    if (shown) return;
    shown = true;
    box.hidden = false;
    if (animate) gsap.fromTo(box, { y: 160, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .7, ease: 'back.out(1.6)' });
  };
  const hide = () => {
    if (!shown) return;
    shown = false;
    clearTimeout(bubbleTimer);
    if (animate) gsap.to(box, { y: 160, autoAlpha: 0, duration: .45, ease: 'power2.in', onComplete: () => { if (!shown) box.hidden = true; } });
    else box.hidden = true;
  };

  const setPose = (pose) => {
    const src = POSES[pose] || POSES.wave;
    if (img.getAttribute('src') === src) return;
    if (!animate) { img.src = src; return; }
    gsap.to(img, {
      autoAlpha: 0, y: 12, duration: .18, ease: 'power1.in',
      onComplete: () => { img.src = src; gsap.to(img, { autoAlpha: 1, y: 0, duration: .35, ease: 'back.out(2.5)' }); },
    });
  };

  // Which section is in the middle of the screen?
  const sections = [...document.querySelectorAll('[data-companion]')];
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || entry.target === current) return;
      current = entry.target;
      const [pose, line] = current.dataset.companion.split('|');
      if (pose === 'hide') { hide(); return; }
      show();
      setPose(pose);
      // on small screens she only talks when you tap her, so she never covers the words
      if (line && window.innerWidth >= 900) speak(line);
    });
  }, { rootMargin: '-48% 0px -48% 0px' });
  sections.forEach((s) => io.observe(s));

  cat.addEventListener('click', () => {
    hop();
    sound.mrrp();
    const sectionLine = current && current.dataset.companion.split('|')[1];
    // first tap in a section: her line for that section; after that, her little extras
    if (sectionLine && !said.has(current)) { said.add(current); speak(sectionLine); }
    else speak(EXTRA_LINES[extra++ % EXTRA_LINES.length]);
  });
}
