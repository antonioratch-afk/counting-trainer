/**
 * Most-missed items for the review button.
 * Uses test and review answers only (learn mode shows the reference card), ignores voided items,
 * and looks at the last 5 answers of each item.
 * Running-count items never repeat, so 'running' returns [] and the caller starts fresh runs.
 */
export function pickReview(attempts, stageId, n) {
  if (stageId === 'running') return [];
  const byItem = new Map();
  for (const a of attempts) {
    if (a.stageId !== stageId) continue;
    if (a.mode !== 'test' && a.mode !== 'review') continue;
    if (a.outcome === 'voided') continue;
    if (!byItem.has(a.itemKey)) byItem.set(a.itemKey, []);
    byItem.get(a.itemKey).push(a);
  }
  const ranked = [];
  for (const [itemKey, list] of byItem) {
    list.sort((x, y) => x.ts - y.ts);
    const window = list.slice(-5);
    const misses = window.filter((a) => !a.correct);
    if (misses.length === 0) continue;
    ranked.push({
      itemKey,
      rate: misses.length / window.length,
      count: window.length,
      lastMiss: Math.max(...misses.map((a) => a.ts)),
    });
  }
  ranked.sort((a, b) => b.rate - a.rate || b.count - a.count || b.lastMiss - a.lastMiss);
  return ranked.slice(0, n).map((r) => r.itemKey);
}
