/**
 * VisualizerProvider — owns the visualizer backend, its RAF loop, the preset
 * auto-cycle timer, and the shared Web Audio graph:
 *
 *   audio (from PlaybackProvider)
 *     → sourceNode (MediaElementSource, created once per AudioContext)
 *     → delayNode  (0.1 s, keeps A/V in sync)
 *     → destination                       ← audible chain, kept alive
 *          └─ backend.connectAudio(delayNode)  ← FFT tap, disposable
 *
 * Consumers get, via useVisualizer():
 *   canvasRef, config, ready, error,
 *   enabled, frozen, shufflePresets, currentPresetName,
 *   options  → {autoCycle, cycleInterval, blendTime, targetFps}
 *   listPresets(),
 *   controls: { nextPreset, prevPreset, randomPreset, loadPreset,
 *               freeze, resume, toggleFreeze,
 *               setEnabled, setShufflePresets, setOptions, resetCycle }
 *
 * `options` are seeded from config but tunable at runtime: they live in a
 * ref read by the RAF loop / cycle timer, so changing them never tears
 * down the backend (a `config` change still does).
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {MilkdropBackend} from '@/visualizer/backends/MilkdropBackend';
import {ShaderBackend} from '@/visualizer/backends/ShaderBackend';
import {DEFAULT_VISUALIZER_CONFIG} from '@/visualizer/config';
import {useInteraction} from './InteractionProvider.jsx';
import {usePlayback} from './PlaybackProvider.jsx';

const VisualizerContext = createContext(null);

export const useVisualizer = () => {
  const ctx = useContext(VisualizerContext);
  if(!ctx) {
    throw new Error('useVisualizer must be used inside <VisualizerProvider>');
  }
  return ctx;
};

const createBackend = (name) => {
  switch(name) {
    case 'milkdrop' : return new MilkdropBackend();
    case 'shader'   : return new ShaderBackend();
    default         : throw new Error(`Unknown visualizer backend: ${name}`);
  }
};

const RUNTIME_OPTION_KEYS = ['autoCycle', 'cycleInterval', 'blendTime', 'targetFps'];

const pickRuntimeOptions = (config) =>
  Object.fromEntries(RUNTIME_OPTION_KEYS.map(key => [key, config[key]]));

const mergeConfig = (userConfig) => ({
  ...DEFAULT_VISUALIZER_CONFIG,
  ...(userConfig || {}),
  milkdrop : {...DEFAULT_VISUALIZER_CONFIG.milkdrop, ...(userConfig?.milkdrop || {})},
  shader   : {...DEFAULT_VISUALIZER_CONFIG.shader, ...(userConfig?.shader || {})},
});

export const VisualizerProvider = ({children, config: userConfig}) => {
  const config = useMemo(() => mergeConfig(userConfig), [userConfig]);
  const {isInteracted} = useInteraction();
  const {audioRefs} = usePlayback();

  const canvasRef = useRef(null);
  const backendRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodesRef = useRef({a : null, b : null});
  const delayNodeRef = useRef(null);
  const rafIdRef = useRef(null);
  const cycleTimeoutRef = useRef(null);
  const shuffleRef = useRef(config.shufflePresets);

  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [frozen, setFrozen] = useState(false);
  const [shufflePresets, setShufflePresetsState] = useState(config.shufflePresets);
  const [currentPresetName, setCurrentPresetName] = useState(null);
  const [error, setError] = useState(null);
  const [options, setOptionsState] = useState(() => pickRuntimeOptions(config));
  const optionsRef = useRef(options);

  useEffect(() => { shuffleRef.current = shufflePresets; }, [shufflePresets]);
  useEffect(() => { optionsRef.current = options; }, [options]);

  const stopRenderer = useCallback(() => {
    if(rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startRenderer = useCallback(() => {
    if(rafIdRef.current) return;
    let lastFrameTime = 0;
    const loop = (time) => {
      const targetFps = optionsRef.current.targetFps || 0;
      const frameInterval = targetFps > 0 ? (1000 / targetFps) : 0;
      if(frameInterval > 0) {
        const delta = time - lastFrameTime;
        if(delta < frameInterval) {
          rafIdRef.current = requestAnimationFrame(loop);
          return;
        }
        lastFrameTime = time - (delta % frameInterval);
      }
      try {
        backendRef.current?.render();
      }
      catch(e) {
        console.error('Visualizer render error', e);
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
  }, []);

  const resetPresetCycle = useCallback(() => {
    if(cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if(!optionsRef.current.autoCycle) return;
    const tick = () => {
      backendRef.current?.presetManager.nextPreset(optionsRef.current.blendTime, {shuffle : shuffleRef.current});
      cycleTimeoutRef.current = setTimeout(tick, optionsRef.current.cycleInterval);
    };
    cycleTimeoutRef.current = setTimeout(tick, optionsRef.current.cycleInterval);
  }, []);

  /* init backend once the user has interacted (AudioContext requires a gesture) */
  useEffect(() => {
    if(!isInteracted) return;

    let cancelled = false;
    const setup = async () => {
      const canvas = canvasRef.current;
      if(!canvas) {
        setError('Canvas element not found');
        return;
      }
      try {
        if(!audioContextRef.current) {
          const Ctor = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new Ctor();
          if(audioContextRef.current.state === 'suspended') {
            try { await audioContextRef.current.resume(); }
            catch(e) { console.warn('AudioContext resume failed', e); }
          }
          delayNodeRef.current = audioContextRef.current.createDelay();
          delayNodeRef.current.delayTime.value = 0.1;
          delayNodeRef.current.connect(audioContextRef.current.destination);
        }

        /* both A/B audio elements must be routed so slot swaps stay audible.
           createMediaElementSource can only be called once per <audio>
           element per AudioContext, so we cache the source nodes. */
        for(const slot of ['a', 'b']) {
          const el = audioRefs[slot]?.current;
          if(el && !sourceNodesRef.current[slot]) {
            try {
              const node = audioContextRef.current.createMediaElementSource(el);
              node.connect(delayNodeRef.current);
              sourceNodesRef.current[slot] = node;
            }
            catch(e) {
              console.warn(`Failed to create MediaElementSource for slot ${slot}`, e);
            }
          }
        }

        const backend = createBackend(config.backend);
        await backend.init(canvas, audioContextRef.current, config);
        if(cancelled) { backend.dispose(); return; }

        backend.presetManager.subscribe('change', (preset) => {
          setCurrentPresetName(preset?.name ?? null);
        });

        if(config.useStartPreset && config.startPreset) {
          backend.presetManager.loadPreset(config.startPreset, 0);
        }
        else if(shuffleRef.current) {
          backend.presetManager.nextPreset(0, {shuffle : true});
        }

        if(delayNodeRef.current) {
          backend.connectAudio(delayNodeRef.current);
        }

        backendRef.current = backend;
        setReady(true);
        setError(null);
        startRenderer();
        resetPresetCycle();
      }
      catch(e) {
        console.error('Visualizer init failed', e);
        setError('Failed to initialize visualizer: ' + e.message);
      }
    };

    setup();

    return () => {
      cancelled = true;
      stopRenderer();
      if(cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
        cycleTimeoutRef.current = null;
      }
      if(backendRef.current) {
        backendRef.current.dispose();
        backendRef.current = null;
      }
      setReady(false);
      /* AudioContext + source/delay/destination survive across backend swaps */
    };
  }, [isInteracted, config, audioRefs, startRenderer, resetPresetCycle, stopRenderer]);

  /* re-arm the cycle timer when auto-cycle is toggled or its interval changes */
  useEffect(() => {
    if(ready) resetPresetCycle();
  }, [ready, options.autoCycle, options.cycleInterval, resetPresetCycle]);

  /* pause / resume renderer on enabled or frozen toggle */
  useEffect(() => {
    if(!ready) return;
    if(enabled && !frozen) startRenderer();
    else stopRenderer();
  }, [enabled, frozen, ready, startRenderer, stopRenderer]);

  /* mobile: when tab is hidden, stop rendering. The audio graph stays
     connected so <audio> keeps playing; only the RAF loop pauses. */
  useEffect(() => {
    if(typeof document === 'undefined') return;
    const onVisibilityChange = () => {
      if(document.hidden) {
        stopRenderer();
      }
      else if(ready && enabled && !frozen) {
        startRenderer();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [ready, enabled, frozen, startRenderer, stopRenderer]);

  const controls = useMemo(() => ({
    nextPreset : () => {
      backendRef.current?.presetManager.nextPreset(optionsRef.current.blendTime, {shuffle : shuffleRef.current});
      resetPresetCycle();
    },
    prevPreset : () => {
      backendRef.current?.presetManager.prevPreset(optionsRef.current.blendTime);
      resetPresetCycle();
    },
    randomPreset : () => {
      backendRef.current?.presetManager.randomPreset(optionsRef.current.blendTime);
      resetPresetCycle();
    },
    loadPreset : (idOrName) => {
      backendRef.current?.presetManager.loadPreset(idOrName, optionsRef.current.blendTime);
      resetPresetCycle();
    },
    freeze       : () => setFrozen(true),
    resume       : () => setFrozen(false),
    toggleFreeze : () => setFrozen(v => !v),
    setEnabled,
    setShufflePresets : setShufflePresetsState,
    setOptions        : (patch) => setOptionsState(prev => ({...prev, ...patch})),
    resetCycle        : resetPresetCycle,
  }), [resetPresetCycle]);

  const value = {
    canvasRef, config,
    ready, error,
    enabled, frozen, shufflePresets, currentPresetName, options,
    listPresets : () => backendRef.current?.presetManager.list() ?? [],
    controls,
  };

  return (
  <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
};
