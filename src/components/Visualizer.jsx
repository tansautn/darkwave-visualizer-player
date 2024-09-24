import React, { useEffect, useRef, useState } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const Visualizer = () => {
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('webgl2');

    try {
      const visualizer = butterchurn.createVisualizer(context, {
        width: canvas.width,
        height: canvas.height,
      });

      visualizerRef.current = visualizer;

      const presets = butterchurnPresets.getPresets();
      const preset = presets[Object.keys(presets)[0]];

      visualizer.loadPreset(preset, 0.0);

      const render = () => {
        if (visualizerRef.current) {
          visualizerRef.current.render();
          requestAnimationFrame(render);
        }
      };

      render();
    } catch (err) {
      console.error('Error initializing visualizer:', err);
      setError('Failed to initialize visualizer. Please check your browser compatibility.');
    }

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
      }
    };
  }, []);

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      width={800}
      height={600}
    />
  );
};

export default Visualizer;
