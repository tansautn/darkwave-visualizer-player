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

const BLACKLIST_KEY = 'visualizer-preset-blacklist';

export class MilkdropPresetManager {
  constructor() {
    this.visualizer = null;
    this.presets = {};
    this.keys = [];
    this.currentIndex = -1;
    this.history = [];
    this.listeners = new Set();
    this.blacklist = this._loadBlacklist();
  }
  _defaultBlacklist() {
    return ["Rovastar - Oozing Resistance","Flexi, fishbrain, Geiss + Martin - tokamak witchery","martin - fruit machine","Flexi + Martin - cascading decay swing","Flexi, martin + geiss - dedicated to the sherwin maxawow","Aderrasi - Storm of the Eye (Thunder) - mash0000 - quasi pseudo meta concentrics","suksma - uninitialized variabowl (hydroponic chronic)","Flexi - predator-prey-spirals","_Geiss - untitled","_Geiss - Artifact 01","Aderrasi - Potion of Spirits","Martin - liquid arrows","martin - chain breaker","flexi + fishbrain - neon mindblob grafitti","Geiss, Flexi + Stahlregen - Thumbdrum Tokamak [crossfiring aftermath jelly mashup]","Geiss - Reaction Diffusion 2","Flexi - truly soft piece of software - this is generic texturing (Jelly) ","flexi - swing out on the spiral","Geiss - Thumb Drum","Zylot - Paint Spill (Music Reactive Paint Mix)","flexi - patternton, district of media, capitol of the united abstractions of fractopia","Unchained - Unified Drag 2","suksma - vector exp 1 - couldn′t not","_Geiss - Desert Rose 2","_Aderrasi - Wanderer in Curved Space - mash0000 - faclempt kibitzing meshuggana schmaltz (Geiss color mix)","flexi - what is the matrix","yin - 191 - Temporal singularities","Geiss + Flexi + Martin - disconnected","$$$ Royal - Mashup (220)","Idiot - Star Of Annon","Unchained - Rewop","cope + martin - mother-of-pearl","Unchained & Rovastar - Wormhole Pillars (Hall of Shadows mix)","martin + flexi - diamond cutter [prismaticvortex.com] - camille - i wish i wish i wish i was constrained","martin - mucus cervix","flexi - bouncing balls [double mindblob neon mix]","TonyMilkdrop - Leonardo Da Vinci's Balloon [Flexi - merry-go-round + techstyle]","sawtooth grin roam","shifter - dark tides bdrv mix 2","Cope - The Neverending Explosion of Red Liquid Fire","suksma - Rovastar - Sunflower Passion (Enlightment Mix)_Phat_edit + flexi und martin shaders - circumflex in character classes in regular expression","Flexi - alien fish pond","$$$ Royal - Mashup (431)","Aderrasi - Songflower (Moss Posy)","Aderrasi + Geiss - Airhandler (Kali Mix) - Canvas Mix","Flexi - infused with the spiral","Flexi - mindblob mix","Flexi + stahlregen - jelly showoff parade","Geiss - Spiral Artifact","Milk Artist At our Best - FED - SlowFast Ft AdamFX n Martin - HD CosmoFX"];
  }
  _loadBlacklist() {
    try {
      const raw = localStorage.getItem(BLACKLIST_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set(this._defaultBlacklist());
    } catch { return new Set(); }
  }

  _saveBlacklist() {
    localStorage.setItem(BLACKLIST_KEY, JSON.stringify([...this.blacklist]));
  }

  isBlacklisted(name) { return this.blacklist.has(name); }

  toggleBlacklist(name) {
    if(!name) return false;
    if(this.blacklist.has(name)) {
      this.blacklist.delete(name);
      this._saveBlacklist();
      return false;
    }
    this.blacklist.add(name);
    this._saveBlacklist();
    // purge from history
    this.history = this.history.filter(i => this.keys[i] !== name);
    return true;
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
    const total = this.keys.length;
    if(total === 0) return;
    if(this.blacklist.size >= total) return;
    for(let i = 0; i < total; i++) {
      const nextIdx = shuffle
        ? Math.floor(Math.random() * total)
        : ((this.currentIndex + 1 + i) % total);
      if(!this.blacklist.has(this.keys[nextIdx])) {
        this.loadPreset(nextIdx, blendTime);
        return;
      }
    }
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
