import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, ListIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useLocalStorage('playlist', [
    { id: '1', title: 'Track 1', url: 'https://example.com/track1.mp3' },
    { id: '2', title: 'Track 2', url: 'https://example.com/track2.mp3' },
    { id: '3', title: 'Track 3', url: 'https://example.com/track3.mp3' },
  ]);
  const [showPlaylist, setShowPlaylist] = useState(false);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    if (currentTrack) {
      if (currentTrack.type === 'hls') {
        if (Hls.isSupported()) {
          hlsRef.current = new Hls();
          hlsRef.current.loadSource(currentTrack.url);
          hlsRef.current.attachMedia(audioRef.current);
        }
      } else {
        audioRef.current.src = currentTrack.url;
      }
    }
  }, [currentTrack]);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgress = () => {
    const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
    setProgress(progress);
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
  };

  const handleTrackSelect = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleReorder = (startIndex, endIndex) => {
    const result = Array.from(playlist);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    setPlaylist(result);
  };

  return (
    <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer />
      <div className="absolute inset-0 flex">
        {showPlaylist && (
          <Sidebar
            playlist={playlist}
            currentTrack={currentTrack}
            onTrackSelect={handleTrackSelect}
            onReorder={handleReorder}
          />
        )}
        <div className="flex-1 flex flex-col justify-end p-4">
          <div className="bg-black bg-opacity-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                <ListIcon className="h-6 w-6" />
              </Button>
              <div className="flex items-center space-x-4">
                <Button onClick={() => {}} variant="ghost"><SkipBackIcon className="h-6 w-6" /></Button>
                <Button onClick={togglePlay} variant="ghost" className="h-12 w-12 rounded-full">
                  {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
                </Button>
                <Button onClick={() => {}} variant="ghost"><SkipForwardIcon className="h-6 w-6" /></Button>
              </div>
              <div className="w-24">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                />
              </div>
            </div>
            <Slider
              value={[progress]}
              max={100}
              step={1}
              onValueChange={(value) => {
                const newTime = (value[0] / 100) * audioRef.current.duration;
                audioRef.current.currentTime = newTime;
              }}
            />
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MusicPlayer;