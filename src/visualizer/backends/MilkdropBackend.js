/**
 * VisualizerBackend contract (each backend must satisfy):
 *
 *   name                              — human-readable identifier
 *   presetManager                     — a PresetManager instance
 *   async init(canvas, audioContext, config)
 *                                     — allocate GL / renderer resources
 *   connectAudio(sourceNode)          — tap the audio graph for FFT/waveform
 *   disconnectAudio()                 — release the tap
 *   render()                          — draw one frame (called per RAF tick)
 *   resize(width, height)             — react to canvas size changes
 *   dispose()                         — release everything, safe to re-init later
 *
 * Backends do NOT own:
 *   - the RAF loop           (VisualizerProvider does)
 *   - the cycle timer        (VisualizerProvider does)
 *   - the AudioContext / MediaElementSource
 *                            (VisualizerProvider does — reused across swaps)
 */
import butterchurn from 'butterchurn';
import {MilkdropPresetManager} from '../presets/MilkdropPresetManager';

export class MilkdropBackend {
  constructor() {
    this.name = 'milkdrop';
    this.visualizer = null;
    this.presetManager = new MilkdropPresetManager();
    this._connected = false;
  }

  async init(canvas, audioContext, config) {
    const mk = config.milkdrop || {};
    this.visualizer = butterchurn.createVisualizer(audioContext, canvas, {
      width        : canvas.width,
      height       : canvas.height,
      pixelRatio   : config.pixelRatio,
      textureRatio : mk.textureRatio ?? 1,
      meshWidth    : mk.meshWidth,
      meshHeight   : mk.meshHeight,
      outputFXAA   : mk.outputFXAA,
    });
    this.presetManager.attach(this.visualizer);
  }

  connectAudio(sourceNode) {
    if(!this.visualizer) return;
    this.visualizer.connectAudio(sourceNode);
    this._connected = true;
  }

  disconnectAudio() {
    if(this.visualizer && this._connected && typeof this.visualizer.disconnectAudio === 'function') {
      this.visualizer.disconnectAudio();
    }
    this._connected = false;
  }

  render() {
    if(this.visualizer) this.visualizer.render();
  }

  resize(width, height) {
    if(this.visualizer && typeof this.visualizer.setRendererSize === 'function') {
      this.visualizer.setRendererSize(width, height);
    }
  }

  dispose() {
    this.disconnectAudio();
    this.presetManager.detach();
    this.visualizer = null;
  }
}
