/**
 * Split a track title around the "Zuko" signature so callers can render it
 * specially (disco SVG image in the playlist, mosaic fill in the SVG title).
 */
export const ZUKO_TOKENS = Object.freeze(['Zuko', '🇿🇺🇰🅾']);

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const ZUKO_PATTERN = new RegExp(`(${ZUKO_TOKENS.map(escapeRegExp).join('|')})`, 'u');

/** @returns {{text: string, isZuko: boolean}[]} */
export const tokenizeTitle = (title) =>
  String(title ?? '')
    .split(ZUKO_PATTERN)
    .filter(Boolean)
    .map(text => ({text, isZuko : ZUKO_TOKENS.includes(text)}));
