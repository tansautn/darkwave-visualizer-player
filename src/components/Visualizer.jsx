import React, {forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState} from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import {useInteraction} from '../providers/InteractionProvider.jsx';

const PRESET_CHANGE_DELAY = 18000; // 18 seconds

const Visualizer = forwardRef(({ audioRef, cycleTimeoutRef, initTimeoutRef, enabled = true }, ref) => {
  const isUseDefaultStartPreset = true;
  const startPresetName = 'martin - disco mix 4';
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const delayedAudibleRef = useRef(null);
  const [currentPresetName, setCurrentPresetName] = useState(null);
  const [error, setError] = useState(null);
  const [presets, setPresets] = useState({});
  const [presetKeys, setPresetKeys] = useState([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [shufflePresets, setShufflePresets] = useState(true);
  const previousPresetsRef = useRef([]);
  const { isInteracted } = useInteraction();

  const nextPresetRef = useRef(null);
  const rafIdRef = useRef(null);
  const enabledRef = useRef(enabled);

  useImperativeHandle(ref, () => ({
    nextPreset : () => {
      nextPreset();
      resetPresetCycle();
    },
    prevPreset : () => {
      prevPreset();
      resetPresetCycle();
    },
    toggleShufflePresets: () => setShufflePresets(prev => !prev),
    getCurrentPreset : () => currentPresetName,
    currentPresetName : currentPresetName,
  }), [currentPresetName]);

  const connectToAudioAnalyzer = useCallback(() => {
    if(!audioContextRef.current || !audioRef.current || !visualizerRef.current) {
      return;
    }

    if (delayedAudibleRef.current) {
      delayedAudibleRef.current.disconnect();
    }

    delayedAudibleRef.current = audioContextRef.current.createDelay();
    delayedAudibleRef.current.delayTime.value = 0.1;

    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceNodeRef.current.connect(delayedAudibleRef.current);
    delayedAudibleRef.current.connect(audioContextRef.current.destination);

    visualizerRef.current.connectAudio(delayedAudibleRef.current);
  }, [ audioRef, audioContextRef, visualizerRef ]);

  const startRenderer = useCallback(() => {
    if(rafIdRef.current) return;
    const renderFrame = () => {
      if(visualizerRef.current) {
        visualizerRef.current.render();
      }
      rafIdRef.current = requestAnimationFrame(renderFrame);
    };
    rafIdRef.current = requestAnimationFrame(renderFrame);
  }, []);

//  const nextPreset = (blendTime = 5.7) => {
//    if (visualizerRef.current && presetKeys.length > 0) {
//      const newIndex = (presetIndex + 1) % presetKeys.length;
//      setPresetIndex(newIndex);
//      visualizerRef.current.loadPreset(presets[presetKeys[newIndex]], blendTime);
//    }
//  };
//
//  const prevPreset = (blendTime = 5.7) => {
//    if (visualizerRef.current && presetKeys.length > 0) {
//      const newIndex = (presetIndex - 1 + presetKeys.length) % presetKeys.length;
//      setPresetIndex(newIndex);
//      visualizerRef.current.loadPreset(presets[presetKeys[newIndex]], blendTime);
//    }
//  };
  const nextPreset = useCallback((blendTime = 2.7) => {
    if (visualizerRef.current && presetKeys.length > 0) {
      let newIndex;
      if (shufflePresets) {
        console.info('shuffling presets');
        newIndex = Math.floor(Math.random() * presetKeys.length);
      } else {
        console.info('next preset');
        newIndex = (presetIndex + 1) % presetKeys.length;
      }
      console.info('using index ', newIndex);
      console.info('using preset ', presetKeys[ newIndex ]);
      setPresetIndex(newIndex);
      previousPresetsRef.current.push(presetIndex);
      const presetName = presetKeys[newIndex];
      visualizerRef.current.loadPreset(presets[presetName], blendTime);
      setCurrentPresetName(presetName);
//      console.info('setting current preset name to ', presetName);
//      window.setTimeout(console.info('--setting current preset name to ', presetName), 120);
      // toast(`Visualizer Preset: ${presetName}`, { duration : 1200 });
    }
  }, [presetKeys, presetIndex, presets, shufflePresets]);

  const prevPreset = useCallback((blendTime = 2.7) => {
    if (visualizerRef.current && presetKeys.length > 0) {
      let newIndex;
      if (previousPresetsRef.current.length > 0) {
        newIndex = previousPresetsRef.current.pop();
      } else {
        newIndex = (presetIndex - 1 + presetKeys.length) % presetKeys.length;
      }
      setPresetIndex(newIndex);
      const presetName = presetKeys[newIndex];
      visualizerRef.current.loadPreset(presets[presetName], blendTime);
      setCurrentPresetName(presetName);
      console.info('setting current preset name to ', presetName);
//      window.setTimeout(console.info('--setting current preset name to ', presetName), 120);
      // toast(`Visualizer Preset: ${presetName}`, { duration : 1200 });
    }
  }, [presetKeys, presetIndex, presets]);

  /* auto next preset */
  useEffect(() => {
    nextPresetRef.current = nextPreset;
  }, [ nextPreset ]);

  /* start / stop renderer when enabled prop changes */
  useEffect(() => {
    enabledRef.current = enabled;
    if(enabled) {
      startRenderer();
    } else {
      if(rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    }
  }, [enabled, startRenderer]);

  const resetPresetCycle = useCallback(() => {
    if(cycleTimeoutRef.current) {
      clearTimeout(cycleTimeoutRef.current);
    }
    const handler = () => {
      nextPresetRef.current(2.7);
      resetPresetCycle(); // Set up the next cycle
    }
    cycleTimeoutRef.current = setTimeout(handler, PRESET_CHANGE_DELAY);
  }, []);

  /* init visualizer */
  useEffect(() => {
    const initVisualizer = () => {
      if(!isInteracted) {
        initTimeoutRef.current = setTimeout(initVisualizer, 100);
        return;
      }
      clearTimeout(initTimeoutRef.current);

      const canvas = canvasRef.current;
      if(!canvas) {
        setError('Canvas element not found');
        return;
      }

      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().then(() => {
            console.info("AudioContext resumed");
          }).catch(err => {
            console.error("Failed to resume AudioContext", err);
          });
        }
        const allPresets = butterchurnPresets.getPresets();
        setPresets(allPresets);
        const sortedPresetKeys = Object.keys(allPresets).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
        setPresetKeys(sortedPresetKeys);
        visualizerRef.current = butterchurn.createVisualizer(audioContextRef.current, canvas, {
          width        : canvas.width,
          height       : canvas.height,
          pixelRatio   : window.devicePixelRatio || 1,
          textureRatio : 1,
        });
        let presetName, newIdx;
        if (isUseDefaultStartPreset){
          presetName = startPresetName;
          newIdx = sortedPresetKeys.indexOf(presetName);
        }
        if(shufflePresets && !isUseDefaultStartPreset) {
          newIdx = Math.floor(Math.random() * sortedPresetKeys.length);
          presetName = sortedPresetKeys[newIdx];
        }
        setCurrentPresetName(presetName);
        setPresetIndex(newIdx);
        visualizerRef.current.loadPreset(allPresets[presetName], 0);
        nextPreset(0);
        startRenderer();
        resetPresetCycle();
        connectToAudioAnalyzer();
      }
      catch(err) {
        console.error('Error initializing visualizer:', err);
        setError('Failed to initialize visualizer. Please check your browser compatibility.');
      }
    };

    initVisualizer();

    return () => {
      if(rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if(audioContextRef.current) {
        audioContextRef.current.close();
      }
      if(sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if(delayedAudibleRef.current) {
        delayedAudibleRef.current.disconnect();
      }
      if(cycleTimeoutRef.current) {
        clearTimeout(cycleTimeoutRef.current);
      }
    };
  }, [ isInteracted, startRenderer, resetPresetCycle, connectToAudioAnalyzer ]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full transition-opacity duration-500 ${enabled ? 'opacity-100' : 'opacity-10'}`}
      width={800}
      height={600}
    />
  );
});

export default Visualizer;
