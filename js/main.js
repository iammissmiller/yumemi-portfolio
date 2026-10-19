// Entry point: wires every part of Yumemi's site together.
import { store } from './store.js';
import { initSoundSeal } from './sound.js';
import { initTheme } from './theme.js';
import { initYumemi, say } from './yumemi.js';
import { initJourney } from './journey.js';
import { initAmbient, initSparkles } from './effects.js';
import { initReveal, initHeader } from './reveal.js';
import { initCompanion } from './companion.js';
import { initGame } from './game.js';
import { initNightlight } from './nightlight.js';
import { initMusic } from './music.js';
import { initVisualizer } from './visualizer.js';

initTheme();
initSoundSeal();
initMusic();       
initVisualizer();  
initYumemi();
initJourney();   
initReveal();
initCompanion();
initHeader();
initAmbient();
initSparkles();
initGame();
initNightlight();

// Keep the range-slider CSS fill in sync with its value
(function syncVolSlider() {
  const slider = document.querySelector('#musicVolume');
  if (!slider) return;
  const update = () => slider.style.setProperty('--val', slider.value);
  slider.addEventListener('input', update);
  update(); // run once on load
}());

/* Guest book: not connected to storage yet, so it says so honestly. */
const gb = document.querySelector('.gb-form');
if (gb) {
  gb.addEventListener('submit', (e) => {
    e.preventDefault();
    gb.querySelector('.gb-status').textContent = 'Thank you! My brush is still drying, so the guest book can\'t keep notes yet. Come back soon.';
  });
}

/* Visitor memory + a classic hit counter.
   This counts visits in this browser only; an all-visitor count needs the backend (planned with the guest book). */
const visits = (parseInt(store.get('yumemi-visits'), 10) || 0) + 1;
store.set('yumemi-visits', String(visits));
// at night she is asleep, so the greeting is a sleepy one
const night = document.documentElement.dataset.theme === 'night';
if (night) say(visits === 1 ? 'Zzz… night already. Tap me if you need me ♡' : `Zzz… you came back (visit ${visits}) ♡`);
else say(visits === 1 ? 'Mrrp! Hello, little traveller (=^･ω･^=)' : `You came back! Visit number ${visits} ♡`);
const odometer = document.querySelector('#tally');
String(visits).padStart(6, '0').split('').forEach((digit) => {
  const d = document.createElement('span');
  d.textContent = digit;
  odometer.append(d);
});
document.querySelector('#tallyCount').textContent = `(${visits.toLocaleString()} ${visits === 1 ? 'visit' : 'visits'} from you)`;

/* Highlight the menu link for the section currently on screen. */
const links = [...document.querySelectorAll('.menu a')];
const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.setAttribute('aria-current', String(a.getAttribute('href') === `#${entry.target.id}`)));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => io.observe(s));
}

window.ScrollTrigger?.refresh();
