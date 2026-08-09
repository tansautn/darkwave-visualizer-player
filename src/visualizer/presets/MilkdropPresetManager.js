/**
 * PresetManager contract (each backend ships one):
 *
 *   attach(backendHandle)             — bind to backend-specific renderer
 *   detach()                          — release renderer + preset cache
 *   list()                            — [{id, name}]
 *   currentPreset                     — {id, name} | null
 *   loadPreset(idOrName, blendTime)   — Promise<void>, emits 'change'
 *   nextPreset(blendTime, {shuffle})  — advance forward (or random)
 *   prevPreset(blendTime)             — pop history, or fall back to (idx-1)
 *   randomPreset(blendTime)           — shortcut for nextPreset(..., {shuffle:true})
 *   subscribe(event, cb) : () => void — currently only 'change'
 */
import butterchurnPresets from 'butterchurn-presets';

export class MilkdropPresetManager {
  constructor() {
    this.visualizer = null;
    this.presets = {};
    this.keys = [];
    this.currentIndex = -1;
    this.history = [];
    this.listeners = new Set();
  }

  attach(visualizer) {
    this.visualizer = visualizer;
    this.presets = butterchurnPresets.getPresets();
    this.keys = Object.keys(this.presets)
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }

  detach() {
    this.visualizer = null;
    this.presets = {};
    this.keys = [];
    this.currentIndex = -1;
    this.history = [];
    this.listeners.clear();
  }

  list() {
    return this.keys.map((name, id) => ({id, name}));
  }

  get currentPreset() {
    if(this.currentIndex < 0) return null;
    return {id : this.currentIndex, name : this.keys[this.currentIndex]};
  }

  _resolveIndex(idOrName) {
    if(typeof idOrName === 'number') return idOrName;
    return this.keys.indexOf(idOrName);
  }

  loadPreset(idOrName, blendTime = 0) {
    if(!this.visualizer) return;
    const index = this._resolveIndex(idOrName);
    if(index < 0 || index >= this.keys.length) return;
    const name = this.keys[index];
    this.visualizer.loadPreset(this.presets[name], blendTime);
    if(this.currentIndex >= 0) this.history.push(this.currentIndex);
    this.currentIndex = index;
    this._emit();
  }

  nextPreset(blendTime = 2.7, {shuffle = false} = {}) {
    if(this.keys.length === 0) return;
    const nextIdx = shuffle
      ? Math.floor(Math.random() * this.keys.length)
      : ((this.currentIndex + 1) % this.keys.length);
    this.loadPreset(nextIdx, blendTime);
  }

  prevPreset(blendTime = 2.7) {
    if(this.keys.length === 0) return;
    let prevIdx;
    if(this.history.length > 0) {
      prevIdx = this.history.pop();
    }
    else {
      prevIdx = (this.currentIndex - 1 + this.keys.length) % this.keys.length;
    }
    const name = this.keys[prevIdx];
    if(!name) return;
    this.visualizer.loadPreset(this.presets[name], blendTime);
    this.currentIndex = prevIdx;
    this._emit();
  }

  randomPreset(blendTime = 2.7) {
    this.nextPreset(blendTime, {shuffle : true});
  }

  subscribe(_event, cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  _emit() {
    const preset = this.currentPreset;
    this.listeners.forEach(cb => {
      try { cb(preset); } catch(e) { console.error('preset listener threw', e); }
    });
  }
}
