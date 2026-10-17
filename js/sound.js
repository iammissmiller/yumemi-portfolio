// All sounds are synthesised live with the Web Audio API, so there are no audio files to load.
import { store } from './store.js';

let ctx = null;
let muted = store.get('yumemi-muted') === '1';

// Browsers only allow sound after the visitor has clicked, tapped or pressed a key.
// Until then every sound quietly skips, so nothing is blocked and no warnings appear.
let unlocked = false;
['pointerdown', 'keydown'].forEach((type) => {
  window.addEventListener(type, () => { unlocked = true; }, { once: true, capture: true });
});

function audio() {
  if (!unlocked) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// One soft bell-like note: quick attack, gentle fade.
function note(freq, delay, length, volume) {
  const c = audio();
  if (!c) return;
  const t = c.currentTime + delay;
  [[1, 'triangle', volume], [2, 'sine', volume * 0.3]].forEach(([mult, type, vol]) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq * mult;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + length + 0.05);
  });
}

// A tiny kitten "mrrp": a quick rising-then-falling chirp.
function chirp() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.09);
  osc.frequency.exponentialRampToValueAtTime(640, t + 0.22);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.09, t + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.26);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.3);
}

// A noodle slurp: a short burst of soft noise that sweeps from high to low.
function slurpNoise() {
  const c = audio();
  if (!c) return;
  const t = c.currentTime;
  const len = 0.45;
  const buffer = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 6;
  band.frequency.setValueAtTime(2600, t);
  band.frequency.exponentialRampToValueAtTime(500, t + len);
  const gain = c.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
  src.connect(band).connect(gain).connect(c.destination);
  src.start(t);
  src.stop(t + len);
}

// A pentatonic scale, so the journey's stop bells always sound pleasant together.
const STOP_NOTES = [523.25, 587.33, 659.25, 783.99, 880];

export const sound = {
  isMuted: () => muted,
  setMuted(value) {
    muted = value;
    store.set('yumemi-muted', value ? '1' : '0');
    if (value && ctx) ctx.suspend(); // also silences anything already playing
  },
  chime() { if (!muted) note(1318.5, 0, 0.45, 0.06); },
  mrrp() { if (!muted) chirp(); },
  slurp() { if (!muted) slurpNoise(); },
  stop(i) { if (!muted) note(STOP_NOTES[i % STOP_NOTES.length], 0, 1.2, 0.07); },
  dream() {
    if (muted) return;
    [523.25, 587.33, 659.25, 783.99, 880, 1046.5].forEach((f, i) => note(f, i * 0.12, 1.4, 0.08));
  },
};

// Wire up the sound seal: 音 (sound) when on, 静 (quiet) when muted.
export function initSoundSeal() {
  const btn = document.querySelector('#soundToggle');
  const render = () => {
    const on = !muted;
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Sound is on. Mute' : 'Sound is off. Unmute');
    btn.querySelector('.seal-mark').textContent = on ? '音' : '静';
    btn.querySelector('.seal-cap').textContent = on ? 'Sound on' : 'Muted';
  };
  btn.addEventListener('click', () => {
    sound.setMuted(!muted);
    render();
    sound.chime(); // only heard when sound was just turned on
  });
  render();

  // Soft chime on every button and link (Yumemi makes her own sound).
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, a, [role="button"]');
    if (el && el !== btn && !el.hasAttribute('data-no-chime')) sound.chime();
  });
}
