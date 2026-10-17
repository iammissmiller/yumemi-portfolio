// localStorage can throw (private mode, blocked storage), so every access is wrapped.
export const store = {
  get(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* ignore: storage is a nice-to-have */ }
  },
};

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
