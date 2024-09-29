import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const Visualizer = forwardRef(({ audioRef }, ref) => {
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const delayedAudibleRef = useRef(null);
  const [error, setError] = useState(null);
  const [presets, setPresets] = useState({});
  const [presetKeys, setPresetKeys] = useState([]);
  const [presetIndex, setPresetIndex] = useState(0);

  useImperativeHandle(ref, () => ({
    nextPreset: () => nextPreset(),
    prevPreset: () => prevPreset(),
  }));

  useEffect(() => {
    const initVisualizer = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Canvas element not found');
        return;
      }

      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        
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
      } catch (err) {
        console.error('Error initializing visualizer:', err);
        setError('Failed to initialize visualizer. Please check your browser compatibility.');
      }
    };

    initVisualizer();

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect();
      }
      if (delayedAudibleRef.current) {
        delayedAudibleRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current && visualizerRef.current) {
      connectToAudioAnalyzer();
    }
  }, [audioRef]);

  const connectToAudioAnalyzer = () => {
    if (delayedAudibleRef.current) {
      delayedAudibleRef.current.disconnect();
    }

    delayedAudibleRef.current = audioContextRef.current.createDelay();
    delayedAudibleRef.current.delayTime.value = 0.26;

    sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
    sourceNodeRef.current.connect(delayedAudibleRef.current);
    delayedAudibleRef.current.connect(audioContextRef.current.destination);

    visualizerRef.current.connectAudio(delayedAudibleRef.current);
  };

  const startRenderer = () => {
    const renderFrame = () => {
      if (visualizerRef.current) {
        visualizerRef.current.render();
      }
      requestAnimationFrame(renderFrame);
    };
    renderFrame();
  };

  const nextPreset = (blendTime = 5.7) => {
    if (visualizerRef.current && presetKeys.length > 0) {
      const newIndex = (presetIndex + 1) % presetKeys.length;
      setPresetIndex(newIndex);
      visualizerRef.current.loadPreset(presets[presetKeys[newIndex]], blendTime);
    }
  };

  const prevPreset = (blendTime = 5.7) => {
    if (visualizerRef.current && presetKeys.length > 0) {
      const newIndex = (presetIndex - 1 + presetKeys.length) % presetKeys.length;
      setPresetIndex(newIndex);
      visualizerRef.current.loadPreset(presets[presetKeys[newIndex]], blendTime);
    }
  };

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