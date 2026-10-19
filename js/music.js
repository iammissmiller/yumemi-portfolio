import { store } from './store.js';
import { theme } from './theme.js';

/* -- Constants ----------------------------------------------- */
const DEFAULT_VOLUME  = 0.18;
const FADE_DURATION_S = 2.0;    
const ANALYSER_FFT    = 256;    
const STORAGE_KEY_VOL = 'yumemi-music-vol';
const STORAGE_KEY_MUSIC_MUTED = 'yumemi-music-muted';


let ctx        = null;
let analyser   = null;
let masterGain = null;

const slots = {
  morning: { el: null, source: null, gain: null },
  night:   { el: null, source: null, gain: null },
};

let activeKey = null;
let started   = false;
let muted     = store.get(STORAGE_KEY_MUSIC_MUTED) === '1';

/* -- Private helpers ----------------------------------------- */

function savedVolume() {
  const n = parseFloat(store.get(STORAGE_KEY_VOL));
  return (Number.isFinite(n) && n >= 0 && n <= 1) ? n : DEFAULT_VOLUME;
}

// This code is used to create the audio context and the analyser, and connect them to the master gain.
function buildCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;

  ctx = new AC();

  analyser = ctx.createAnalyser();
  analyser.fftSize = ANALYSER_FFT;

  masterGain = ctx.createGain();
  masterGain.gain.value = savedVolume();

  analyser.connect(masterGain);
  masterGain.connect(ctx.destination);

  return ctx;
}

/** Wire a single track slot into the graph (idempotent). */
function ensureSlot(key) {
  const slot = slots[key];
  if (slot.source) return;

  const el = document.getElementById(`bgMusic-${key}`);
  if (!el) return;

  slot.el     = el;
  slot.source = ctx.createMediaElementSource(el);
  slot.gain   = ctx.createGain();
  slot.gain.gain.value = 0;
  slot.source.connect(slot.gain);
  slot.gain.connect(analyser);
}

/**
 * Crossfade to nextKey.
 * ctx.resume() is awaited before el.play() - key fix for Chrome policy.
 * @param {string}  nextKey  'morning' | 'night'
 * @param {boolean} instant  skip the ramp (first play)
 */
async function crossfadeTo(nextKey, instant = false) {
  if (!ctx) return;

  ensureSlot('morning');
  ensureSlot('night');

  const now = ctx.currentTime;
  const end = now + (instant ? 0.05 : FADE_DURATION_S);

  // Fade out all other slots, then pause them to save resources
  Object.entries(slots).forEach(([key, slot]) => {
    if (!slot.gain || key === nextKey) return;
    slot.gain.gain.cancelScheduledValues(now);
    slot.gain.gain.setValueAtTime(slot.gain.gain.value, now);
    slot.gain.gain.linearRampToValueAtTime(0, end);
    setTimeout(() => {
      if (activeKey !== key) slot.el?.pause();
    }, (end - now + 0.15) * 1000);
  });

  // Schedule gain ramp for the incoming track
  const target = slots[nextKey];
  if (!target.gain) return;
  target.gain.gain.cancelScheduledValues(now);
  target.gain.gain.setValueAtTime(target.gain.gain.value, now);
  target.gain.gain.linearRampToValueAtTime(1, end);
  activeKey = nextKey;

  // Resume context THEN play from the beginning - correct order for Chrome
  try {
    if (ctx.state !== 'running') await ctx.resume();
    target.el.currentTime = 0;   // always start the new theme from the top
    await target.el.play();
  } catch {
    // Still blocked; silently ignore - next gesture will retry via sound.js
  }
}

/* -- Public API ---------------------------------------------- */

export function initMusic() {
  // Register both event types but clean up both once either fires
  const onFirstGesture = () => {
    removeGestureListeners();
    if (started || muted) return;
    started = true;
    buildCtx();
    crossfadeTo(theme.get(), true);
  };

  const removeGestureListeners = () => {
    window.removeEventListener('pointerdown', onFirstGesture, { capture: true });
    window.removeEventListener('keydown',     onFirstGesture, { capture: true });
  };

  window.addEventListener('pointerdown', onFirstGesture, { capture: true });
  window.addEventListener('keydown',     onFirstGesture, { capture: true });

  // Theme switch -> crossfade
  theme.onChange((next) => {
    if (!started || muted) return;
    crossfadeTo(next);
  });

  // Music seal UI state renderer
  const volSeal = document.querySelector('#volSeal');
  const volMark = volSeal?.querySelector('.seal-mark');
  const volCap  = volSeal?.querySelector('.seal-cap');

  const renderMusicSeal = () => {
    if (!volSeal) return;
    volSeal.setAttribute('data-muted', String(muted));
    if (volMark) {
      volMark.textContent = muted ? '✕' : '♪';
      volMark.setAttribute('aria-label', muted ? 'Music is muted. Click to unmute' : 'Music is playing. Click to mute');
    }
    if (volCap) {
      volCap.textContent = muted ? 'Music off' : 'Music';
    }
  };

  const toggleMusicMute = () => {
    muted = !muted;
    store.set(STORAGE_KEY_MUSIC_MUTED, muted ? '1' : '0');
    renderMusicSeal();

    if (!ctx) {
      if (!muted && !started) onFirstGesture();
      return;
    }

    const now = ctx.currentTime;
    if (muted) {
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.35);
    } else {
      if (!started) {
        started = true;
        buildCtx();
        crossfadeTo(theme.get(), true);
        return;
      }
      const vol = savedVolume();
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(vol, now + 0.4);
      if (activeKey && slots[activeKey].el?.paused) {
        ctx.resume().then(() => slots[activeKey].el.play()).catch(() => {});
      }
    }
  };

  renderMusicSeal();

  // Clicking the Music seal mark toggles background music mute independently
  volMark?.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMusicMute();
  });

  // Volume slider
  const slider = document.querySelector('#musicVolume');
  if (slider) {
    slider.value = String(Math.round(savedVolume() * 100));
    slider.addEventListener('input', () => {
      const vol = Number(slider.value) / 100;
      store.set(STORAGE_KEY_VOL, String(vol));
      if (muted) {
        // Automatically unmute when user interacts with volume slider
        muted = false;
        store.set(STORAGE_KEY_MUSIC_MUTED, '0');
        renderMusicSeal();
      }
      if (ctx && masterGain) masterGain.gain.value = vol;
    });
  }
}

/** AnalyserNode exposed for visualizer.js */
export function getAnalyser() { return analyser; }

/** Whether background music is currently unmuted and actively playing */
export function isMusicPlaying() {
  return !muted && started && ctx && ctx.state === 'running';
}
