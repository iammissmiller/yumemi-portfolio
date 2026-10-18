// "My story": a cinematic walk through five places, driven by the scroll (GSAP ScrollTrigger).
// The road slides past while Yumemi walks in step with your scrolling. At each place she stops,
// the camera eases in, the sky changes colour with the time of day, and a chapter title appears.
import { reducedMotion } from './store.js';
import { sound } from './sound.js';
import { POSES } from './yumemi.js';
import { theme } from './theme.js';

const WALK_FRAMES = [0, 1, 2, 3].map((i) => `assets/yumemi-walk-${i}.webp`);
WALK_FRAMES.forEach((src) => { const i = new Image(); i.src = src; });

// Where she stops in each painting (share of its width) and what she does there.
const STOPS = [
  { at: 0.66, pose: 'lantern' }, // in front of the old city gate, lantern up
  { at: 0.38, pose: 'eat' },     // on a stool at the noodle stall
  { at: 0.60, pose: 'wave' },    // waving to the kids with the kite and the handheld game
  { at: 0.64, pose: 'back' },    // looking up the shrine steps
  { at: 0.50, pose: 'sleep' },   // asleep on the rooftop by the teahouse (scene centred)
];
// The sky behind the road for each place: dusk, midnight, day, sakura, dawn
const SKY = {
  morning: { intro: '#fff4f9', stops: ['#ffe6ee', '#e9e2ff', '#fff0dc', '#ffe6f2', '#f1e8ff'] },
    night: { intro: '#17132f', stops: ['#2a1d4a', '#141634', '#1f2348', '#2a1c46', '#1d2246'] },
};
const PACE = 850;   // px of road per 1000px of scrolling (lower = slower walk)
const HOLD = 0.85;  // how long she stays at each place, in screen heights of scrolling

export function initJourney() {
  const section = document.querySelector('#journey');
  if (!section) return;
  const pin = section.querySelector('.journey-pin');
  const intro = section.querySelector('.journey-intro');
  const strip = section.querySelector('.strip');
  const track = section.querySelector('.track');
  const scenes = [...track.querySelectorAll('.scene')];
  const walker = section.querySelector('#walker');
  const chapters = [...section.querySelectorAll('.chapter')];
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger || reducedMotion) {
    document.documentElement.classList.add('static-journey');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  let st = null;
  let tl = null;

  function build() {
    const progress = st ? st.progress : 0;
    if (st) st.kill(true);
    if (tl) tl.kill();
    gsap.set([intro, ...chapters, strip, track], { clearProps: 'all' });

    const sky = SKY[theme.get() === 'night' ? 'night' : 'morning'];
    const feetX = walker.offsetLeft;
    const xFor = (i, at) => -(scenes[i].offsetLeft + scenes[i].offsetWidth * at - feetX);
    const startX = xFor(0, 0.06);
    const stopX = STOPS.map((s, i) => xFor(i, s.at));
    const hold = (window.innerHeight * HOLD) / 1000;
    gsap.set(strip, { transformOrigin: `${feetX}px 82%` });
    gsap.set(pin, { '--journey-bg': sky.intro });
    gsap.set(track, { x: startX });
    gsap.set(chapters, { autoAlpha: 0 });

    tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    const holds = [];
    let t = 0;
    let lastX = startX;
    stopX.forEach((x, i) => {
      const walk = Math.abs(x - lastX) / PACE;
      // walking in: the road slides, the sky shifts to this place's time of day
      tl.to(track, { x, duration: walk, ease: 'sine.inOut' }, t);
      tl.to(pin, { '--journey-bg': sky.stops[i], duration: walk }, t);
      if (i === 0) {
        // the title card leaves first, then the painted road rises in behind it
        tl.to(intro, { autoAlpha: 0, y: -60, duration: walk * 0.4, ease: 'power1.in' }, t);
        tl.fromTo(strip, { autoAlpha: 0, y: 80 }, { autoAlpha: 1, y: 0, duration: walk * 0.45, ease: 'power2.out' }, t + walk * 0.3);
      }
      else {
        tl.to(strip, { scale: 1, duration: Math.min(walk * 0.4, 0.35), ease: 'power1.inOut' }, t);
        tl.to(chapters[i - 1], { autoAlpha: 0, y: -40, duration: Math.min(walk * 0.35, 0.3) }, t);
      }
      t += walk;
      // arriving: the camera eases in and the chapter appears
      holds.push([t, t + hold]);
      tl.to(strip, { scale: 1.07, duration: hold * 0.6, ease: 'power1.inOut' }, t);
      tl.fromTo(chapters[i], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: hold * 0.3, ease: 'power2.out' }, t);
      tl.fromTo(chapters[i].children, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: hold * 0.25, stagger: hold * 0.07, ease: 'power2.out' }, t);
      t += hold;
      lastX = x;
    });

    let prevX = startX;
    let travelled = 0;
    let shownStop = -1;
    let src = '';
    const setSrc = (s) => { if (s !== src) { walker.src = s; src = s; } };
    const step = () => strip.offsetHeight * 0.085;

    const update = () => {
      const time = tl.time();
      const x = gsap.getProperty(track, 'x');
      const dx = x - prevX;
      prevX = x;
      const at = holds.findIndex(([a, b]) => time >= a - 0.004 && time <= b + 0.004);
      if (at >= 0) {
        setSrc(POSES[STOPS[at].pose]);
        walker.classList.remove('facing-left');
        if (at !== shownStop) { sound.stop(at); shownStop = at; }
      } else {
        travelled += Math.abs(dx);
        setSrc(WALK_FRAMES[Math.floor(travelled / step()) % WALK_FRAMES.length]);
        if (Math.abs(dx) > 0.5) walker.classList.toggle('facing-left', dx > 0);
        shownStop = -1;
      }
    };

    st = ScrollTrigger.create({
      animation: tl,
      trigger: section,
      start: 'top top',
      end: () => `+=${Math.round(t * 1000)}`,
      pin: pin,
      scrub: 0.8,
      // measure this pinned section before everything below it, so their start points include its scroll length
      refreshPriority: 1,
      onUpdate: update,
    });
    if (progress) st.scroll(st.start + (st.end - st.start) * progress);
    update();
  }

  build();
  theme.onChange(() => { build(); ScrollTrigger.sort(); ScrollTrigger.refresh(); });
  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastWidth) return; // ignore phone address-bar height changes
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { build(); ScrollTrigger.sort(); ScrollTrigger.refresh(); }, 200);
  });
}
