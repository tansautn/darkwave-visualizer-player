import React from 'react';

/**
 * SlashingTitle — pure-CSS "Fruit Ninja" slash title.
 *
 * The two words share one slot and swap with a blade-cut animation.
 * All motion lives in the `.slash-*` rules in src/index.css (no JS).
 *
 * The `--i` var offsets word B by half a loop, so exactly two words are
 * supported (the default). `slotClassName`/`className` let the caller
 * pass the surrounding <h1> typography (size, weight, font, color).
 *
 * @param {string} [prefix]  static text kept on the first line
 * @param {string[]} [words] the two swapping words (rendered on line 2)
 * @param {string} [className] extra classes for the <h1>
 */
const SlashingTitle = ({
  prefix = 'Zuko the',
  words = ['Coder', 'DJ'],
  className = '',
}) => (
  <h1 className={`slash-title ${className}`}>
    {prefix}
    <span className="slash-slot">
      {words.map((word, i) => (
        <span className="slash-word" style={{ '--i': i }} key={word + i}>
          <span className="slash-word__body">
            <span className="slash-word__half slash-word__half--top">{word}</span>
            <span className="slash-word__half slash-word__half--bottom">{word}</span>
          </span>
          <span className="slash-word__blade"></span>
          <span className="slash-word__sparks">
            <i></i><i></i><i></i><i></i><i></i><i></i>
          </span>
        </span>
      ))}
    </span>
  </h1>
);

export default SlashingTitle;
