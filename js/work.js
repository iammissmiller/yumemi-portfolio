// Selected work: each project opens a small toy.
// The Noodle Atlas (tap bowls), the Petal Almanac (season tabs), Lantern Letters (tap lanterns).
import { sound } from './sound.js';
import { say } from './yumemi.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function initOpeners() {
  $$('.open-toy').forEach((btn) => {
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const openLabel = btn.textContent;
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
      btn.textContent = open ? 'Close' : openLabel;
      if (open) panel.querySelector('button')?.focus({ preventScroll: true });
      window.ScrollTrigger?.refresh(); // the page got taller or shorter
    });
  });
}

function initAtlas() {
  const bowls = $$('.bowl');
  const out = $('.tasting');
  bowls.forEach((bowl) => {
    bowl.setAttribute('aria-pressed', 'false');
    bowl.addEventListener('click', () => {
      bowls.forEach((b) => b.setAttribute('aria-pressed', String(b === bowl)));
      out.innerHTML = '';
      const h = document.createElement('h4');
      h.textContent = bowl.dataset.dish;
      const place = document.createElement('p');
      place.className = 'place';
      place.textContent = bowl.dataset.place;
      const note = document.createElement('p');
      note.textContent = bowl.dataset.note;
      out.append(h, place, note);
      sound.slurp();
    });
  });
}

function initAlmanac() {
  const tabs = $$('.season-tabs [role="tab"]');
  if (!tabs.length) return;
  const img = $('.season-img');
  const note = $('.season-note');
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    if (focus) tab.focus();
    const season = tab.dataset.season;
    img.classList.add('fading');
    setTimeout(() => {
      img.src = `assets/season-${season}.webp`;
      img.alt = `The road in ${season}`;
      img.classList.remove('fading');
    }, 200);
    note.textContent = tab.dataset.note;
    sound.chime();
  };
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener('click', () => select(tab, false));
    // arrow keys move between seasons, as tabs should
    tab.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      select(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  // preload the other seasons
  ['summer', 'autumn', 'winter'].forEach((s) => { const i = new Image(); i.src = `assets/season-${s}.webp`; });
}

function initLetters() {
  const lanterns = $$('.lantern');
  const out = $('.letter');
  lanterns.forEach((lantern, i) => {
    lantern.setAttribute('aria-pressed', 'false');
    lantern.addEventListener('click', () => {
      lanterns.forEach((l) => l.setAttribute('aria-pressed', String(l === lantern)));
      lantern.classList.add('read');
      out.innerHTML = '';
      const card = document.createElement('blockquote');
      card.className = 'letter-card';
      card.textContent = lantern.dataset.letter;
      const sign = document.createElement('span');
      sign.className = 'sign';
      sign.textContent = 'with love, Yumemi';
      card.append(sign);
      out.append(card);
      sound.stop(i);
      if ($$('.lantern.read').length === lanterns.length) say('You read every letter! Now go and play.');
    });
  });
}

export function initWork() {
  initOpeners();
  initAtlas();
  initAlmanac();
  initLetters();
}
