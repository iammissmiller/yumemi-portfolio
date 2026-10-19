import { getAnalyser, isMusicPlaying } from './music.js';

/**
 * visualizer.js - Subtle audio visualizer bar fixed at the bottom of the screen.
 * - Renders a sleek, delicate frequency wave/spectrum across the bottom edge.
 * - Fades in gently when background music starts, fades out smoothly when muted.
 * - Sits at position: fixed, bottom: 0, matching morning and night themes seamlessly.
 */

export function initVisualizer() {
  const canvas = document.getElementById('audioVisualizer');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let animId = null;
  let currentAlpha = 0; // for smooth fading
  let freqData = null;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = 44; // taller, clearly visible bar height
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
  };

  window.addEventListener('resize', resize, { passive: true });
  resize();

  const draw = () => {
    animId = requestAnimationFrame(draw);

    const analyser = getAnalyser();
    const playing = isMusicPlaying() && analyser;

    // Smoothly fade alpha in or out
    const targetAlpha = playing ? 1 : 0;
    currentAlpha += (targetAlpha - currentAlpha) * 0.08;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (currentAlpha < 0.005) return;

    if (!freqData || freqData.length !== analyser.frequencyBinCount) {
      freqData = new Uint8Array(analyser.frequencyBinCount);
    }

    if (playing) {
      analyser.getByteFrequencyData(freqData);
    } else if (freqData) {
      // Gently decay existing data if paused
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = Math.floor(freqData[i] * 0.85);
      }
    }

    const isNight = document.documentElement.dataset.theme === 'night';
    ctx.globalAlpha = currentAlpha * (isNight ? 0.85 : 0.75);

    // Dynamic bar distribution across bottom
    const barCount = Math.min(72, Math.floor(width / 14));
    const step = Math.max(1, Math.floor((freqData.length * 0.6) / barCount));
    const barWidth = width / barCount;

    // Color gradient for the audio visualizer
    const grad = ctx.createLinearGradient(0, height, 0, 0);
    if (isNight) {
      grad.addColorStop(0, 'rgba(255, 140, 210, 0.25)');
      grad.addColorStop(0.4, 'rgba(180, 140, 255, 0.75)');
      grad.addColorStop(0.85, 'rgba(125, 255, 207, 0.95)');
      grad.addColorStop(1, '#ffffff');
    } else {
      grad.addColorStop(0, 'rgba(255, 160, 215, 0.3)');
      grad.addColorStop(0.4, 'rgba(240, 85, 154, 0.8)');
      grad.addColorStop(0.85, 'rgba(143, 115, 255, 0.95)');
      grad.addColorStop(1, '#ffffff');
    }

    ctx.fillStyle = grad;

    for (let i = 0; i < barCount; i++) {
      // Mirrored sampling centered around musical melody & rhythm frequencies
      const distFromCenter = Math.abs(i - barCount / 2) / (barCount / 2);
      // Focus on low-mid and mid-high frequencies where lo-fi beats and keys resonate
      const index = Math.min(freqData.length - 1, Math.floor((1 - distFromCenter * 0.82) * 48) + 2);
      const rawVal = (freqData[index] || 0) / 255;

      // Higher sensitivity curve: amplifies subtle musical dynamics
      const amplified = Math.min(1, Math.pow(rawVal * 1.5, 0.85));

      // Bar height scales up to 40px with a gentle floor so rhythm is distinctly felt
      const barH = Math.max(2, amplified * (height - 4));
      const x = i * barWidth;
      const y = height - barH;
      const w = Math.max(1.5, barWidth - 2.5);

      // Draw rounded top bar
      ctx.beginPath();
      const r = Math.min(w / 2, barH / 2, 2.5);
      ctx.roundRect(x + 1.25, y, w, barH, [r, r, 0, 0]);
      ctx.fill();
    }

    // Glowing baseline edge
    ctx.fillStyle = isNight ? 'rgba(125, 255, 207, 0.65)' : 'rgba(240, 85, 154, 0.55)';
    ctx.fillRect(0, height - 2, width, 2);
  };

  draw();
}
