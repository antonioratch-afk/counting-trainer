// Hi-Lo tags, kept as a table so another counting system can be added later.
export const HILO = {
  2: 1, 3: 1, 4: 1, 5: 1, 6: 1,
  7: 0, 8: 0, 9: 0,
  T: -1, J: -1, Q: -1, K: -1, A: -1,
};

/** @returns {-1|0|1} */
export function tag(rank) {
  const v = HILO[rank];
  if (v === undefined) throw new Error(`unknown rank ${rank}`);
  return v;
}

export function runningCount(cards) {
  let n = 0;
  for (const c of cards) n += tag(c.rank);
  return n;
}

/** "+1", "0" or "-1". */
export function formatTag(n) {
  return n > 0 ? `+${n}` : String(n);
}
