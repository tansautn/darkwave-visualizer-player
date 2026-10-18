/**
 * Player settings — user-tunable, persisted per device by SettingsProvider.
 *
 *   ui.textScale          'sm' | 'md' | 'lg' → multiplier exposed as the
 *                         `--ui-scale` CSS var (see `text-ui-*` in tailwind.config.js)
 *   ui.titleEffects       animated gradient + "Zuko" mosaic on the SVG track title
 *   ui.showRemaining      right-hand time shows remaining (−m:ss) instead of total
 *   ui.titleVisibility    'controls' dims with the bar | 'change' stays up for
 *                         TITLE_FLASH_MS after a track change | 'always' never dims
 *   ui.presetVisibility   preset HUD: 'off' | 'auto' (flash on change + activity) | 'always'
 *   ui.controlsBackdrop   dark gradient scrim behind the control bar
 *   ui.tapGuard           first tap on dimmed controls only wakes them
 *   ui.activeOpacity      control bar opacity while the user is interacting
 *   ui.idleOpacity        control bar opacity after 3 s without input
 *   ui.showIntro          play TypingIntro after the first gesture
 *   visualizer.*          runtime options forwarded to VisualizerProvider
 *                         (see src/visualizer/config.js for meaning)
 */
import {DEFAULT_VISUALIZER_CONFIG} from '@/visualizer/config';

export const TEXT_SCALES = Object.freeze({
  sm : 0.9,
  md : 1,
  lg : 1.15,
});

export const DEFAULT_SETTINGS = Object.freeze({
  ui : Object.freeze({
    textScale        : 'md',
    titleEffects     : true,
    showRemaining    : true,
    titleVisibility  : 'controls',
    presetVisibility : 'auto',
    controlsBackdrop : true,
    tapGuard         : true,
    activeOpacity    : 0.9,
    idleOpacity      : 0.05,
    showIntro        : true,
  }),
  visualizer : Object.freeze({
    autoCycle      : DEFAULT_VISUALIZER_CONFIG.autoCycle,
    cycleInterval  : DEFAULT_VISUALIZER_CONFIG.cycleInterval,
    blendTime      : DEFAULT_VISUALIZER_CONFIG.blendTime,
    shufflePresets : DEFAULT_VISUALIZER_CONFIG.shufflePresets,
    targetFps      : DEFAULT_VISUALIZER_CONFIG.targetFps,
  }),
});

/* allowed values for string settings — anything else falls back to the default */
export const SETTING_CHOICES = Object.freeze({
  ui : Object.freeze({
    textScale        : Object.keys(TEXT_SCALES),
    titleVisibility  : ['controls', 'change', 'always'],
    presetVisibility : ['off', 'auto', 'always'],
  }),
});

/* numeric bounds — stored values are clamped into them; also the Settings
   slider ranges. activeOpacity tops out at 0.9 so the controls (and the
   backdrop behind them) always stay semi-transparent over the visualizer. */
export const SETTING_RANGES = Object.freeze({
  ui : Object.freeze({
    activeOpacity : [0.4, 0.9],
    idleOpacity   : [0, 0.5],
  }),
  visualizer : Object.freeze({
    cycleInterval : [5000, 120000],
    blendTime     : [0, 10],
  }),
});

/**
 * Merge a stored (possibly stale or hand-edited) settings object onto the
 * defaults. Unknown keys are dropped, wrong types or values outside
 * SETTING_CHOICES fall back to the default, numbers are clamped into
 * SETTING_RANGES, so adding / renaming a field never needs a migration.
 */
export const sanitizeSettings = (raw) => {
  const result = {};
  for(const [section, defaults] of Object.entries(DEFAULT_SETTINGS)) {
    const stored = raw && typeof raw[section] === 'object' ? raw[section] : {};
    result[section] = {};
    for(const [key, fallback] of Object.entries(defaults)) {
      const value = stored?.[key];
      const choices = SETTING_CHOICES[section]?.[key];
      const range = SETTING_RANGES[section]?.[key];
      const valid = typeof value === typeof fallback
        && (typeof value !== 'number' || Number.isFinite(value))
        && (!choices || choices.includes(value));
      let next = valid ? value : fallback;
      if(range) {
        next = Math.min(range[1], Math.max(range[0], next));
      }
      result[section][key] = next;
    }
  }
  return result;
};
