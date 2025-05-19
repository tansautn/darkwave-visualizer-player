import React from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { CloudIcon, DownloadIcon, ListIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, UploadIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { useAudioVisualizer } from './AudioVisualizerProvider';

const MusicPlayer = () => {
  const {
    isPlaying,
    currentTrack,
    playlist,
    audioRef,
    togglePlay,
    nextPreset,
    prevPreset,
    // ... other methods and state from the context
  } = useAudioVisualizer();

  // ... Keep your existing functions that are not moved to the context

  return (
    <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer />
      {/* ... Rest of your JSX */}
      <audio
        ref={audioRef}
        onEnded={handleNextTrack}
        onError={(e) => {
          console.error('Audio error:', e);
          setError('Error loading audio: ' + e.target.error.message);
        }}
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default MusicPlayer;
