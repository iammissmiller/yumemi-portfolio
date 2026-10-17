// Motion for the whole page (GSAP + ScrollTrigger):
// the hero's opening sequence, words and blocks that rise in and fade away as you scroll,
// paintings that bleed in like wet watercolour, the growth chart, the permit stamp and the finale.
import { reducedMotion } from './store.js';

const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

// Wrap each word in two spans so it can rise out of its own little window.
function splitWords(el) {
  if (el.dataset.split) return;
  el.dataset.split = '1';
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute('aria-label', el.textContent.trim());
  el.textContent = '';
  words.forEach((word, i) => {
    const w = document.createElement('span');
    w.className = 'w';
    w.setAttribute('aria-hidden', 'true');
    const wi = document.createElement('span');
    wi.className = 'wi';
    wi.textContent = word;
    w.append(wi);
    el.append(w);
    if (i < words.length - 1) el.append(' ');
  });
}

function heroIntro(gsap) {
  const hero = document.querySelector('.hero');
  const chars = $$('.title-ja span', hero);
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.fromTo('.hero-path', { autoAlpha: 0, '--r': '0%' }, { autoAlpha: 1, '--r': '160%', duration: 2.2, ease: 'power2.inOut' }, 0)
    // each brush character is "painted" from top to bottom
    .fromTo(chars, { autoAlpha: 0, clipPath: 'inset(0% 0% 100% 0%)', y: -12 },
      { autoAlpha: 1, clipPath: 'inset(0% 0% 0% 0%)', y: 0, duration: .9, stagger: .22, ease: 'power2.out', clearProps: 'clipPath' }, .2)
    .fromTo('.hero .title-en', { autoAlpha: 0, y: -20 }, { autoAlpha: 1, y: 0, duration: .8 }, .9)
    .fromTo('.hero .tagline', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8 }, .8)
    .fromTo('.hero .lede .wi', { yPercent: 110 }, { yPercent: 0, duration: .9, stagger: .05 }, .95)
    .fromTo('.hero-links', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .8 }, 1.5)
    // Yumemi hops onto the path
    .fromTo('.yumemi', { autoAlpha: 0, y: -90 }, { autoAlpha: 1, y: 0, duration: .9, ease: 'bounce.out' }, 1.2)
    .fromTo('.bubble', { autoAlpha: 0, scale: .4, transformOrigin: '0% 100%' }, { autoAlpha: 1, scale: 1, duration: .6, ease: 'back.out(2.2)' }, 2)
    .fromTo('.scroll-cue', { autoAlpha: 0 }, { autoAlpha: 1, duration: .8 }, 2.3)
    // a sticker slaps on and the photo-booth date prints
    .fromTo('.hero .sticker', { autoAlpha: 0, scale: 2.4, rotate: -30 }, { autoAlpha: 1, scale: 1, rotate: 10, duration: .5, ease: 'back.out(3)', clearProps: 'transform' }, 2.2)
    .fromTo('.purikura-date', { autoAlpha: 0, x: 30 }, { autoAlpha: 1, x: 0, duration: .6, ease: 'steps(6)' }, 2.4);
  document.documentElement.classList.remove('anim');

  // Scrolling away from the hero: the words drift up and fade, the painting rises slower (depth)
  gsap.to('.hero-copy', { y: -120, autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 25%', scrub: true } });
  gsap.to('.hero-art', { y: -60, scale: 1.04, autoAlpha: .15, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
}

function blockReveals(gsap) {
  // blocks rise in when they arrive and fade away when they leave (in both directions)
  $$('[data-reveal]').forEach((el) => {
    const siblings = $$(':scope > [data-reveal]', el.parentElement);
    gsap.fromTo(el, { autoAlpha: 0, y: 44 }, {
      autoAlpha: 1, y: 0, duration: .9, ease: 'power3.out', delay: Math.max(siblings.indexOf(el), 0) * .08,
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 8%', toggleActions: 'play none none reverse' },
    });
  });
  // headings rise word by word
  $$('.split').forEach((el) => {
    if (el.closest('.hero')) return;
    gsap.fromTo(el.querySelectorAll('.wi'), { yPercent: 110 }, {
      yPercent: 0, duration: .8, ease: 'power3.out', stagger: .05,
      scrollTrigger: { trigger: el, start: 'top 90%', end: 'bottom 8%', toggleActions: 'play none none reverse' },
    });
  });
}

function paintingBleeds(gsap) {
  // each project painting bleeds onto the paper as its screen arrives, and drifts for depth
  $$('.project').forEach((project) => {
    const cover = project.querySelector('.project-cover');
    if (!cover) return;
    const art = cover.querySelectorAll('.art');
    if (art.length) {
      gsap.fromTo(art, { '--r': '0%' }, {
        '--r': '160%', ease: 'none', stagger: .15,
        scrollTrigger: { trigger: project, start: 'top 80%', end: 'top 15%', scrub: .6 },
      });
    }
    gsap.fromTo(cover, { y: 70 }, { y: -70, ease: 'none', scrollTrigger: { trigger: project, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
}

function growthChart(gsap) {
  const post = document.querySelector('.post');
  if (!post) return;
  const marks = $$('li', post).reverse(); // lowest mark first, like measuring a growing child
  const tl = gsap.timeline({ scrollTrigger: { trigger: '.growth', start: 'top 70%', end: 'bottom 10%', toggleActions: 'play none none reverse' } });
  tl.fromTo(post, { scaleY: 0 }, { scaleY: 1, duration: 1, ease: 'power2.out' })
    .fromTo(marks, { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0, duration: .5, stagger: .18, ease: 'power2.out' }, .5);
}

function permitStamp(gsap) {
  const permit = document.querySelector('.permit');
  if (!permit) return;
  const tl = gsap.timeline({ scrollTrigger: { trigger: permit, start: 'top 80%', end: 'bottom 5%', toggleActions: 'play none none reverse' } });
  tl.fromTo(permit, { autoAlpha: 0, y: 70, rotate: -2.5 }, { autoAlpha: 1, y: 0, rotate: 0, duration: 1, ease: 'power3.out' })
    .fromTo('.permit .field', { autoAlpha: 0, x: 20 }, { autoAlpha: 1, x: 0, duration: .5, stagger: .1 }, .4)
    // the 旅 stamp slams down
    .fromTo('.permit .stamp', { autoAlpha: 0, scale: 2.6, rotate: -50 }, { autoAlpha: .9, scale: 1, rotate: -12, duration: .45, ease: 'back.out(3)' }, 1.1);
}

function finale(gsap) {
  const finaleEl = document.querySelector('.finale');
  if (!finaleEl) return;
  gsap.fromTo('.finale-scene', { yPercent: 6, scale: 1.34 }, {
    yPercent: 0, scale: 1.18, ease: 'none',
    scrollTrigger: { trigger: finaleEl, start: 'top bottom', end: 'bottom bottom', scrub: true },
  });
  gsap.fromTo('.finale-cat', { autoAlpha: 0, y: 20 }, {
    autoAlpha: 1, y: 0, duration: 1.2, ease: 'power2.out',
    scrollTrigger: { trigger: finaleEl, start: 'top 30%', toggleActions: 'play none none reverse' },
  });
}

export function initHeader() {
  const bar = document.querySelector('.topbar');
  let lastY = window.scrollY;
  let ticking = false;
  const update = () => {
    ticking = false;
    const y = window.scrollY;
    bar.classList.toggle('scrolled', y > 40);
    if (y > lastY + 4 && y > 240) bar.classList.add('hidden');
    else if (y < lastY - 4 || y < 240) bar.classList.remove('hidden');
    lastY = y;
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  bar.addEventListener('focusin', () => bar.classList.remove('hidden')); // keyboard users always see it
  update();
}

export function initReveal() {
  $$('.split').forEach(splitWords);
  const { gsap, ScrollTrigger } = window;
  if (!gsap || !ScrollTrigger || reducedMotion) {
    document.documentElement.classList.remove('anim');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  heroIntro(gsap);
  blockReveals(gsap);
  paintingBleeds(gsap);
  growthChart(gsap);
  permitStamp(gsap);
  finale(gsap);
}
