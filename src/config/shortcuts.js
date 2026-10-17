/**
 * Keyboard shortcuts — display metadata only. The handlers live in
 * MusicPlayer's keydown listener; keep `keys` in sync with it.
 * Shown in control tooltips (HintTooltip `shortcut`) and the Settings dialog.
 */
export const SHORTCUTS = Object.freeze({
  togglePlay    : {keys : ['Space'],          label : 'Play / Pause'},
  nextTrack     : {keys : ['↑'],              label : 'Next track'},
  prevTrack     : {keys : ['↓'],              label : 'Previous track'},
  nextPreset    : {keys : ['→'],              label : 'Next preset'},
  prevPreset    : {keys : ['←'],              label : 'Previous preset'},
  addSoundCloud : {keys : ['Enter'],          label : 'Add SoundCloud track'},
  uploadLocal   : {keys : ['Shift', 'Enter'], label : 'Upload local files'},
  openSettings  : {keys : [','],              label : 'Open settings'},
});
