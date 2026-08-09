/**
 * Visualizer — thin canvas view. All state and lifecycle live in
 * VisualizerProvider; this component only mounts the <canvas> and
 * mirrors the `enabled` opacity behavior.
 */
import React from 'react';
import {useVisualizer} from '@/providers/VisualizerProvider.jsx';

const Visualizer = () => {
  const {canvasRef, config, enabled, error} = useVisualizer();

  if(error) {
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
    width={config.width}
    height={config.height}
  />
  );
};

export default Visualizer;
