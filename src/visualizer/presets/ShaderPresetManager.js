/**
 * ShaderPresetManager — Shadertoy-flavored preset store.
 *
 * A preset is:
 *   {
 *     id, name,
 *     fragmentSource: string      // Shadertoy `mainImage` GLSL
 *     commonSource?: string       // optional per-preset "Common" tab
 *     channels?: [{kind: 'audioFFT'|'audioWave'|'texture', src?}]
 *   }
 *
 * Uniforms injected at runtime by ShaderBackend:
 *   iTime, iTimeDelta, iFrame, iResolution, iMouse, iDate,
 *   iChannel0..iChannel3 (sampler2D)
 *
 * This is a stub — presets aren't wired yet. Implementation will hold
 * compiled GLSL programs + a texture pool for iChannel bindings.
 */
export class ShaderPresetManager {
  constructor() {
    this.presets = [];
    this.currentIndex = -1;
    this.listeners = new Set();
  }

  attach(_backendHandle) {
    // reserved for GL program cache initialisation
  }

  detach() {
    this.presets = [];
    this.currentIndex = -1;
    this.listeners.clear();
  }

  list() {
    return this.presets.map((p, id) => ({id, name : p.name}));
  }

  get currentPreset() {
    if(this.currentIndex < 0) return null;
    const p = this.presets[this.currentIndex];
    return {id : this.currentIndex, name : p?.name ?? null};
  }

  loadPreset(_idOrName, _blendTime) {
    throw new Error('ShaderPresetManager.loadPreset not implemented');
  }

  nextPreset() { /* noop until implemented */ }
  prevPreset() { /* noop until implemented */ }
  randomPreset() { /* noop until implemented */ }

  subscribe(_event, cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}
