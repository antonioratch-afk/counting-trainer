import { h } from './dom.js';
import { displayRank, suitSymbol } from '../core/cards.js';

/** A playing card drawn with CSS and text. */
export function cardView(card, extraClass = '') {
  const red = card.suit === 'H' || card.suit === 'D';
  return h('div', { class: `card ${red ? 'red' : ''} ${extraClass}`, 'aria-label': `${displayRank(card.rank)}${suitSymbol(card.suit)}` },
    h('span', { class: 'rank' }, displayRank(card.rank)),
    h('span', { class: 'suit' }, suitSymbol(card.suit)));
}
