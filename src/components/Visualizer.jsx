import React, { useEffect, useRef, useState } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const Visualizer = () => {
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeVisualizer = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        setError('Canvas element not found');
        return;
      }

      let context;
      try {
        context = canvas.getContext('webgl2', { alpha: false });
        if (!context) {
          throw new Error('WebGL2 not supported');
        }
      } catch (err) {
        setError('WebGL2 is not supported in your browser.');
        return;
      }

      try {
        const visualizer = butterchurn.createVisualizer(context, {
          width: canvas.width,
          height: canvas.height,
          pixelRatio: window.devicePixelRatio || 1,
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
    };

    initializeVisualizer();

    return () => {
      if (visualizerRef.current) {
        visualizerRef.current.destroy();
      }
    };
  }, []);

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
};

export default Visualizer;