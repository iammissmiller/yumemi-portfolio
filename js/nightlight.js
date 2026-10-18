// The lantern nightlight (night mode only): the hero painting goes dark, and your cursor or finger
// becomes a lantern that lights it up. Six little dreams are hidden in the dark; find them all.
// Leave it alone for a moment and the light drifts back to the lantern Yumemi is sleeping with.
import { theme } from './theme.js';
import { reducedMotion } from './store.js';
import { sound } from './sound.js';
import { say } from './yumemi.js';

export function initNightlight() {
  const hero = document.querySelector('#hello');
  const art = hero && hero.querySelector('.hero-art');
  const layer = art && art.querySelector('.nightlight');
  if (!layer) return;
  const dreams = [...layer.querySelectorAll('.dream')];
  const count = hero.querySelector('#nlCount');
  const glow = art.querySelector('.lantern-glow');

  const pos = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  let lastMove = -1e9;
  let found = 0;
  let onScreen = true;
  let raf = 0;
  let radius = 150;

  const active = () => theme.get() === 'night' && onScreen && !hero.classList.contains('is-playing');

  // where the lantern in her paws is, inside the painting
  const lanternSpot = () => {
    const a = art.getBoundingClientRect();
    if (!glow || !glow.offsetParent) return { x: a.width * 0.3, y: a.height * 0.8 };
    const g = glow.getBoundingClientRect();
    return { x: g.left + g.width / 2 - a.left, y: g.top + g.height / 2 - a.top };
  };

  const set = (name, v) => art.style.setProperty(name, `${v.toFixed(1)}px`);

  function tick(now) {
    raf = 0;
    if (!active()) return;
    const userLight = now - lastMove < 2600;
    if (!userLight) Object.assign(target, lanternSpot());
    const k = reducedMotion ? 1 : (userLight ? 0.2 : 0.05);
    pos.x += (target.x - pos.x) * k;
    pos.y += (target.y - pos.y) * k;
    set('--x', pos.x); set('--y', pos.y);
    const l = lanternSpot();
    set('--lx', l.x); set('--ly', l.y);

    // a dream counts as found when your lantern shines right on it
    if (userLight) {
      const a = art.getBoundingClientRect();
      dreams.forEach((d) => {
        if (d.classList.contains('found')) return;
        const r = d.getBoundingClientRect();
        const dx = r.left + r.width / 2 - a.left - pos.x;
        const dy = r.top + r.height / 2 - a.top - pos.y;
        if (Math.hypot(dx, dy) < radius * 0.45) {
          d.classList.add('found');
          found += 1;
          count.textContent = found;
          sound.stop(found);
          if (found === dreams.length) {
            say('You found every dream! Now they can come true ✧');
            sound.dream();
            hero.querySelector('.nl-hint').classList.add('all-found');
          }
        }
      });
    }
    raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && active()) raf = requestAnimationFrame(tick); };

  function measure() {
    const a = art.getBoundingClientRect();
    radius = Math.max(85, Math.min(200, Math.min(a.width, a.height) * 0.3));
    set('--nr', radius);
  }

  const aim = (e) => {
    const a = art.getBoundingClientRect();
    target.x = e.clientX - a.left;
    target.y = e.clientY - a.top;
    lastMove = performance.now();
    kick();
  };
  hero.addEventListener('pointermove', aim, { passive: true });
  hero.addEventListener('pointerdown', aim, { passive: true });

  new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; kick(); }).observe(hero);
  theme.onChange(() => {
    measure();
    Object.assign(pos, lanternSpot());
    kick();
  });
  window.addEventListener('resize', () => { measure(); kick(); });

  measure();
  Object.assign(pos, lanternSpot());
  Object.assign(target, pos);
  kick();
}
