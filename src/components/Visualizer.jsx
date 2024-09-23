import React, { useEffect, useRef } from 'react';
import butterchurn from 'butterchurn';
import butterchurnPresets from 'butterchurn-presets';

const Visualizer = () => {
  const canvasRef = useRef(null);
  const visualizerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('webgl2');
    const visualizer = butterchurn.createVisualizer(context, {
      width: canvas.width,
      height: canvas.height,
    });

    visualizerRef.current = visualizer;

    const presets = butterchurnPresets.getPresets();
    const preset = presets[Object.keys(presets)[0]];

    visualizer.loadPreset(preset, 0.0);

    const render = () => {
      visualizer.render();
      requestAnimationFrame(render);
    };

    render();

    return () => {
      visualizer.destroy();
    };
  }, []);

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