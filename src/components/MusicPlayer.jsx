import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState([]);
  const [visualizerError, setVisualizerError] = useState(null);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const savedPlaylist = localStorage.getItem('playlist');
    if (savedPlaylist) {
      setPlaylist(JSON.parse(savedPlaylist));
    } else {
      // Set default playlist if no saved playlist exists
      setPlaylist([
        { id: '1', title: 'Track 1', url: 'https://example.com/track1.mp3' },
        { id: '2', title: 'Track 2', url: 'https://example.com/track2.mp3' },
        { id: '3', title: 'Track 3', url: 'https://example.com/track3.mp3' },
      ]);
    }
  }, []);

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
    localStorage.setItem('playlist', JSON.stringify(result));
  };

  const handleVisualizerError = (error) => {
    setVisualizerError(error);
  };

  return (
    <div className="flex h-screen bg-black bg-opacity-80 text-white">
      <Sidebar
        playlist={playlist}
        currentTrack={currentTrack}
        onTrackSelect={handleTrackSelect}
        onReorder={handleReorder}
      />
      <div className="flex-1 flex flex-col p-4">
        <div className="flex-1">
          {visualizerError ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
              <p>{visualizerError}</p>
            </div>
          ) : (
            <Visualizer onError={handleVisualizerError} />
          )}
        </div>
        <div className="flex items-center justify-between mt-4">
          <Button onClick={() => {}} variant="ghost"><SkipBackIcon /></Button>
          <Button onClick={togglePlay} variant="ghost">
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button onClick={() => {}} variant="ghost"><SkipForwardIcon /></Button>
        </div>
        <Slider
          value={[progress]}
          max={100}
          step={1}
          className="mt-4"
          onValueChange={(value) => {
            const newTime = (value[0] / 100) * audioRef.current.duration;
            audioRef.current.currentTime = newTime;
          }}
        />
        <Slider
          value={[volume * 100]}
          max={100}
          step={1}
          className="mt-4"
          onValueChange={(value) => handleVolumeChange(value[0] / 100)}
        />
        <audio
          ref={audioRef}
          onTimeUpdate={handleProgress}
          onEnded={() => setIsPlaying(false)}
        />
      </div>
    </div>
  );
};

export default MusicPlayer;
