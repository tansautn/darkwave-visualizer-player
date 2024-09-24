import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon } from 'lucide-react';
import Playlist from './Playlist';
import Visualizer from './Visualizer';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlists, setPlaylists] = useLocalStorage('playlists', []);
  const [currentPlaylist, setCurrentPlaylist] = useState(null);
  const [visualizerError, setVisualizerError] = useState(null);

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

  const handleTrackChange = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleVisualizerError = (error) => {
    setVisualizerError(error);
  };

  return (
    <div className="flex flex-col h-screen bg-black bg-opacity-80 text-white p-4">
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
      <Playlist
        playlists={playlists}
        currentPlaylist={currentPlaylist}
        onTrackSelect={handleTrackChange}
        onPlaylistChange={setCurrentPlaylist}
      />
      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MusicPlayer;
