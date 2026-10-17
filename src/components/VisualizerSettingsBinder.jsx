/**
 * VisualizerSettingsBinder — headless. Pushes the persisted visualizer
 * settings (SettingsProvider) into VisualizerProvider's runtime options, so
 * neither provider has to know about the other.
 *
 * Runs on mount too: the values land in VisualizerProvider's refs before the
 * first user gesture creates the backend.
 */
import {useEffect} from 'react';
import {useSettings} from '@/providers/SettingsProvider.jsx';
import {useVisualizer} from '@/providers/VisualizerProvider.jsx';

export const VisualizerSettingsBinder = () => {
  const {settings} = useSettings();
  const {controls} = useVisualizer();
  const {autoCycle, cycleInterval, blendTime, targetFps, shufflePresets} = settings.visualizer;

  useEffect(() => {
    controls.setOptions({autoCycle, cycleInterval, blendTime, targetFps});
  }, [controls, autoCycle, cycleInterval, blendTime, targetFps]);

  useEffect(() => {
    controls.setShufflePresets(shufflePresets);
  }, [controls, shufflePresets]);

  return null;
};
