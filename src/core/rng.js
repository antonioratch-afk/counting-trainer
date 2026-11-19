// Seeded random numbers (mulberry32). The seed comes from the shell (app.js),
// so nothing in core reads crypto or the clock.

/** @param {number} seed @returns {() => number} numbers in [0, 1) */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive integer in [min, max]. */
export function randInt(rng, min, max) {
  return min + Math.floor(rng() * (max - min + 1));
}

export function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}
