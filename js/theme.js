// Morning / night, shown on the theme seal as 朝 (morning) or 夜 (night).
import { store } from './store.js';

const root = document.documentElement;
const listeners = [];

export const theme = {
  get: () => root.dataset.theme,
  onChange: (fn) => listeners.push(fn),
};

function apply(next, remember) {
  root.dataset.theme = next;
  const btn = document.querySelector('#themeToggle');
  const morning = next === 'morning';
  btn.querySelector('.seal-mark').textContent = morning ? '朝' : '夜';
  btn.querySelector('.seal-cap').textContent = morning ? 'Morning' : 'Night';
  btn.setAttribute('aria-label', morning ? 'Morning scene. Switch to night' : 'Night scene. Switch to morning');
  if (remember) store.set('yumemi-theme', next);
  listeners.forEach((fn) => fn(next));
}

export function initTheme() {
  apply(store.get('yumemi-theme') === 'night' ? 'night' : 'morning', false);
  document.querySelector('#themeToggle').addEventListener('click', () => {
    apply(theme.get() === 'morning' ? 'night' : 'morning', true);
  });
}
