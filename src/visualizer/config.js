/**
 * Visualizer configuration surface.
 *
 * All fields map to real backend parameters where possible.
 * Fields specific to a single backend are grouped under `milkdrop` / `shader`
 * so a backend swap doesn't drag unused config along.
 *
 *   backend           'milkdrop' | 'shader'
 *   width / height    canvas logical size (px)
 *   pixelRatio        canvas backing-store scale (retina)
 *   targetFps         0 or null = uncapped RAF; N = cap to N fps
 *   blendTime         seconds spent morphing between presets
 *   autoCycle         when true, presets auto-advance
 *   cycleInterval     ms between auto-advances
 *   shufflePresets    when auto-advancing, pick randomly
 *   startPreset       exact preset name to load first
 *   useStartPreset    when false, first preset is picked by shuffle policy
 *   milkdrop.textureRatio         internal FFT/warp render resolution scale
 *   milkdrop.meshWidth / Height   FFT mesh detail — bigger = sharper warps
 *   milkdrop.outputFXAA           anti-alias the final composite
 *   shader.commonSource           GLSL prepended to every preset (a la Shadertoy Common tab)
 *   shader.channels               iChannel binding hints (kind: 'audioFFT'|'audioWave'|'texture')
 */
export const DEFAULT_VISUALIZER_CONFIG = Object.freeze({
  backend        : 'milkdrop',
  width          : 800,
  height         : 600,
  pixelRatio     : typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1,
  targetFps      : 0,
  blendTime      : 2.7,
  autoCycle      : true,
  cycleInterval  : 18000,
  shufflePresets : true,
  startPreset    : 'martin - disco mix 4',
  useStartPreset : true,
  milkdrop       : Object.freeze({
    textureRatio : 1,
    meshWidth    : 48,
    meshHeight   : 36,
    outputFXAA   : false,
  }),
  shader         : Object.freeze({
    commonSource : '',
    channels     : Object.freeze([
      {kind : 'audioFFT'},
      {kind : 'audioWave'},
    ]),
  }),
});
