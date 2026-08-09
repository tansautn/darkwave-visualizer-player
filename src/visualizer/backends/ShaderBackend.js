/**
 * ShaderBackend — Shadertoy-flavored WebGL fragment-shader renderer.
 *
 * Not implemented yet. When it lands, it will:
 *   1. Create a WebGL2 context on the shared canvas.
 *   2. Bind a fullscreen quad + a program compiled from
 *        <preset.commonSource>
 *        <preset.fragmentSource>
 *      with a Shadertoy-compatible prelude (uniforms below).
 *   3. Feed audio into iChannel0/iChannel1 via AnalyserNode → texture upload
 *      each frame (FFT = 1D texture width 512, waveform = 1D texture width 512).
 *   4. Update iTime / iTimeDelta / iFrame / iResolution / iMouse each frame.
 *   5. Optionally cross-fade between two programs on preset change
 *      (blendTime > 0 → render both to FBOs, mix by t).
 *
 * The stub throws from init() so misconfiguration surfaces immediately.
 */
import {ShaderPresetManager} from '../presets/ShaderPresetManager';

export class ShaderBackend {
  constructor() {
    this.name = 'shader';
    this.presetManager = new ShaderPresetManager();
  }

  async init(_canvas, _audioContext, _config) {
    throw new Error('ShaderBackend not implemented yet — use backend: "milkdrop"');
  }

  connectAudio(_sourceNode) {}
  disconnectAudio() {}
  render() {}
  resize(_w, _h) {}
  dispose() {}
}
