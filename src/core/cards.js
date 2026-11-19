import { randInt } from './rng.js';

export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = ['S', 'H', 'D', 'C'];
export const TENS = ['T', 'J', 'Q', 'K'];

/** @typedef {{ rank: string, suit: string }} Card */

/** @returns {Card[]} */
export function deck() {
  const cards = [];
  for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit });
  return cards;
}

/** @returns {Card[]} */
export function shoe(decks) {
  const cards = [];
  for (let i = 0; i < decks; i++) cards.push(...deck());
  return cards;
}

/** Fisher-Yates; returns a new array. */
export function shuffle(cards, rng) {
  const out = cards.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Blackjack value: 2-9 face value, ten-value cards 10, ace 11. */
export function cardValue(rank) {
  if (rank === 'A') return 11;
  if (TENS.includes(rank)) return 10;
  return Number(rank);
}

/** J, Q, K map to T for chart keys. */
export function chartRank(rank) {
  return TENS.includes(rank) ? 'T' : rank;
}

/** T shows as 10 on screen. */
export function displayRank(rank) {
  return rank === 'T' ? '10' : rank;
}

export function suitSymbol(suit) {
  return { S: '♠', H: '♥', D: '♦', C: '♣' }[suit];
}
