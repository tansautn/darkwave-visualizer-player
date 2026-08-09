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
 *   listPresets(),
 *   controls: { nextPreset, prevPreset, randomPreset, loadPreset,
 *               freeze, resume, toggleFreeze,
 *               setEnabled, setShufflePresets, resetCycle }
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

const mergeConfig = (userConfig) => ({
  ...DEFAULT_VISUALIZER_CONFIG,
  ...(userConfig || {}),
  milkdrop : {...DEFAULT_VISUALIZER_CONFIG.milkdrop, ...(userConfig?.milkdrop || {})},
  shader   : {...DEFAULT_VISUALIZER_CONFIG.shader, ...(userConfig?.shader || {})},
});

export const VisualizerProvider = ({children, config: userConfig}) => {
  const config = useMemo(() => mergeConfig(userConfig), [userConfig]);
  const {isInteracted} = useInteraction();
  const {audioRef} = usePlayback();

  const canvasRef = useRef(null);
  const backendRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
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

  useEffect(() => { shuffleRef.current = shufflePresets; }, [shufflePresets]);

  const stopRenderer = useCallback(() => {
    if(rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const startRenderer = useCallback(() => {
    if(rafIdRef.current) return;
    const targetFps = config.targetFps || 0;
    const frameInterval = targetFps > 0 ? (1000 / targetFps) : 0;
    let lastFrameTime = 0;
    const loop = (time) => {
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
  }, [config.targetFps]);

  const resetPresetCycle = useCallback(() => {
    if(cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
      cycleTimeoutRef.current = null;
    }
    if(!config.autoCycle) return;
    const tick = () => {
      backendRef.current?.presetManager.nextPreset(config.blendTime, {shuffle : shuffleRef.current});
      cycleTimeoutRef.current = setTimeout(tick, config.cycleInterval);
    };
    cycleTimeoutRef.current = setTimeout(tick, config.cycleInterval);
  }, [config.autoCycle, config.blendTime, config.cycleInterval]);

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
          if(audioRef.current) {
            sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceNodeRef.current.connect(delayNodeRef.current);
            delayNodeRef.current.connect(audioContextRef.current.destination);
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
  }, [isInteracted, config, audioRef, startRenderer, resetPresetCycle, stopRenderer]);

  /* pause / resume renderer on enabled or frozen toggle */
  useEffect(() => {
    if(!ready) return;
    if(enabled && !frozen) startRenderer();
    else stopRenderer();
  }, [enabled, frozen, ready, startRenderer, stopRenderer]);

  const controls = useMemo(() => ({
    nextPreset : () => {
      backendRef.current?.presetManager.nextPreset(config.blendTime, {shuffle : shuffleRef.current});
      resetPresetCycle();
    },
    prevPreset : () => {
      backendRef.current?.presetManager.prevPreset(config.blendTime);
      resetPresetCycle();
    },
    randomPreset : () => {
      backendRef.current?.presetManager.randomPreset(config.blendTime);
      resetPresetCycle();
    },
    loadPreset : (idOrName) => {
      backendRef.current?.presetManager.loadPreset(idOrName, config.blendTime);
      resetPresetCycle();
    },
    freeze       : () => setFrozen(true),
    resume       : () => setFrozen(false),
    toggleFreeze : () => setFrozen(v => !v),
    setEnabled,
    setShufflePresets : setShufflePresetsState,
    resetCycle        : resetPresetCycle,
  }), [config.blendTime, resetPresetCycle]);

  const value = {
    canvasRef, config,
    ready, error,
    enabled, frozen, shufflePresets, currentPresetName,
    listPresets : () => backendRef.current?.presetManager.list() ?? [],
    controls,
  };

  return (
  <VisualizerContext.Provider value={value}>
      {children}
    </VisualizerContext.Provider>
  );
};
