import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, ListIcon, UploadIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { useLocalStorage } from '../hooks/useLocalStorage';

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useLocalStorage('playlist', [
    { id: '1', title: 'Dang Cay - T.H.wav', url: 'https://cdn.zuko.pro/Dang Cay - T.H.wav' },
    { id: '2', title: 'Tôi là tôi 2013 - Koi Fish.mp3', url: 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3' },
    { id: '3', title: 'DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3', url: 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3' },
    { id: '4', title: 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3', url: 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3' },
    { id: '5', title: 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3', url: 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3' },
    { id: '6', title: 'full B\'Small remix.mp3', url: 'https://cdn.zuko.pro/full B\'Small remix.mp3' },
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

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newTracks = files.map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      title: file.name,
      url: URL.createObjectURL(file),
      type: 'local'
    }));
    setPlaylist([...playlist, ...newTracks]);
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
            <div className="mt-2 text-center">
              {currentTrack && <p className="text-sm">{currentTrack.title}</p>}
            </div>
          </div>
        </div>
      </div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        multiple
        onChange={handleFileUpload}
        accept="audio/*"
      />
      <label htmlFor="file-upload" className="absolute top-4 right-4 cursor-pointer">
        <Button variant="ghost">
          <UploadIcon className="h-6 w-6" />
        </Button>
      </label>
      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
};

export default MusicPlayer;