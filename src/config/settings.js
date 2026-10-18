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

/**
 * Merge a stored (possibly stale or hand-edited) settings object onto the
 * defaults. Unknown keys are dropped, wrong types or values outside
 * SETTING_CHOICES fall back to the default, so adding / renaming a field
 * never needs a migration.
 */
export const sanitizeSettings = (raw) => {
  const result = {};
  for(const [section, defaults] of Object.entries(DEFAULT_SETTINGS)) {
    const stored = raw && typeof raw[section] === 'object' ? raw[section] : {};
    result[section] = {};
    for(const [key, fallback] of Object.entries(defaults)) {
      const value = stored?.[key];
      const choices = SETTING_CHOICES[section]?.[key];
      const valid = typeof value === typeof fallback && (!choices || choices.includes(value));
      result[section][key] = valid ? value : fallback;
    }
  }
  return result;
};
