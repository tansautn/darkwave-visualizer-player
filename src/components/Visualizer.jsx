import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';
import { useUserGestureContext } from './UserGestureProvider';
import { toast } from 'sonner';

const Visualizer = forwardRef(({ audioRef }, ref) => {
  const { isActive } = useUserGestureContext();
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const delayedAudibleRef = useRef(null);
  const [error, setError] = useState(null);
  const [presets, setPresets] = useState({});
  const [presetKeys, setPresetKeys] = useState([]);
  const [presetIndex, setPresetIndex] = useState(0);
  const [shufflePresets, setShufflePresets] = useState(false);
  const previousPresetsRef = useRef([]);
  const cycleIntervalRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const isAudioContextClosedRef = useRef(false);

  useImperativeHandle(ref, () => ({
    nextPreset: () => nextPreset(),
    prevPreset: () => prevPreset(),
    toggleShufflePresets: () => setShufflePresets(prev => !prev),
  }));

  const initVisualizer = useCallback(() => {
    if (!isActive) {
      initTimeoutRef.current = setTimeout(initVisualizer, 100);
      return;
    }

    clearTimeout(initTimeoutRef.current);

    const canvas = canvasRef.current;
    if (!canvas) {
      setError('Canvas element not found');
      return;
    }

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        isAudioContextClosedRef.current = false;
      }
      
      const allPresets = butterchurnPresets.getPresets();
      setPresets(allPresets);
      const sortedPresetKeys = Object.keys(allPresets).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
      setPresetKeys(sortedPresetKeys);
      setPresetIndex(Math.floor(Math.random() * sortedPresetKeys.length));

      visualizerRef.current = butterchurn.createVisualizer(audioContextRef.current, canvas, {
        width: canvas.width,
        height: canvas.height,
        pixelRatio: window.devicePixelRatio || 1,
        textureRatio: 1,
      });

      nextPreset(0);
      startRenderer();
      connectToAudioAnalyzer();
      startPresetCycle();
    } catch (err) {
      console.error('Error initializing visualizer:', err);
      setError('Failed to initialize visualizer. Please check your browser compatibility.');
    }
  }, [isActive]);

  useEffect(() => {
    initVisualizer();

    return () => {
      clearTimeout(initTimeoutRef.current);
      clearInterval(cycleIntervalRef.current);
      if (audioContextRef.current && !isAudioContextClosedRef.current) {
        audioContextRef.current.close();
        isAudioContextClosedRef.current = true;
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (delayedAudibleRef.current) {
        delayedAudibleRef.current.disconnect();
      }
    };
  }, [initVisualizer]);

  const connectToAudioAnalyzer = useCallback(() => {
    if (!audioRef.current || !audioContextRef.current || !visualizerRef.current) return;

    if (delayedAudibleRef.current) {
      delayedAudibleRef.current.disconnect();
    }

    delayedAudibleRef.current = audioContextRef.current.createDelay();
    delayedAudibleRef.current.delayTime.value = 0.26;

    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceNodeRef.current.connect(delayedAudibleRef.current);
    delayedAudibleRef.current.connect(audioContextRef.current.destination);

    visualizerRef.current.connectAudio(delayedAudibleRef.current);
  }, [audioRef]);

  const startRenderer = useCallback(() => {
    const renderFrame = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render();
      }
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  }, []);

  const nextPreset = useCallback((blendTime = 5.7) => {
    if (visualizerRef.current && presetKeys.length > 0) {
      let newIndex;
      if (shufflePresets) {
        newIndex = Math.floor(Math.random() * presetKeys.length);
      } else {
        newIndex = (presetIndex + 1) % presetKeys.length;
      }
      setPresetIndex(newIndex);
      previousPresetsRef.current.push(presetIndex);
      const presetName = presetKeys[newIndex];
      visualizerRef.current.loadPreset(presets[presetName], blendTime);
      toast(presetName, { duration: 2000 });
    }
  }, [presetKeys, presetIndex, shufflePresets, presets]);

  const prevPreset = useCallback((blendTime = 5.7) => {
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
      toast(presetName, { duration: 2000 });
    }
  }, [presetKeys, presetIndex, presets]);

  const startPresetCycle = useCallback(() => {
    cycleIntervalRef.current = setInterval(() => {
      nextPreset();
    }, 18000); // Change preset every 18 seconds
  }, [nextPreset]);

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
      className="w-full h-full"
      width={800}
      height={600}
    />
  );
});

export default Visualizer;