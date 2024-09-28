import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, ListIcon, UploadIcon, CloudIcon, DownloadIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { loadSoundCloudTrack, exportPlaylistToM3U8 } from '../utils/playlistUtils';

const defaultPlaylist = [
  { id: '1', title: 'Dang Cay - T.H.wav', url: 'https://cdn.zuko.pro/Dang Cay - T.H.wav' },
  { id: '2', title: 'Tôi là tôi 2013 - Koi Fish.mp3', url: 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3' },
  { id: '3', title: 'DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3', url: 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3' },
  { id: '4', title: 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3', url: 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3' },
  { id: '5', title: 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3', url: 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3' },
  { id: '6', title: 'full B\'Small remix.mp3', url: 'https://cdn.zuko.pro/full B\'Small remix.mp3' },
];

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useLocalStorage('playlist', defaultPlaylist);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('Default Playlist');
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (currentTrack) {
      setError(null); // Reset error state when changing tracks
      if (currentTrack.type === 'hls') {
        if (Hls.isSupported()) {
          hlsRef.current = new Hls();
          hlsRef.current.loadSource(currentTrack.url);
          hlsRef.current.attachMedia(audioRef.current);
          hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS error:', data);
            setError('Error loading HLS stream');
          });
        } else if (audioRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          audioRef.current.src = currentTrack.url;
        } else {
          setError('HLS is not supported in this browser');
        }
      } else {
        audioRef.current.src = currentTrack.url;
      }
      audioRef.current.load(); // Explicitly load the audio
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Error playing audio: ' + e.message);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!currentTrack && playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
  }, [playlist]);

  const togglePlay = () => {
    if (!currentTrack) {
      setError('No track selected');
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Error playing audio: ' + e.message);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgress = () => {
    if (audioRef.current.duration) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
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

  const handleSoundCloudUpload = async () => {
    const url = prompt("Enter SoundCloud URL:");
    if (url) {
      try {
        const track = await loadSoundCloudTrack(url);
        setPlaylist([...playlist, track]);
      } catch (error) {
        console.error("Error loading SoundCloud track:", error);
        setError("Failed to load SoundCloud track. Please check the URL and try again.");
      }
    }
  };

  const handleExportPlaylist = () => {
    exportPlaylistToM3U8(playlist, playlistName);
  };

  const handleNextTrack = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    }
  };

  const handlePreviousTrack = () => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
    }
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
            playlistName={playlistName}
            onPlaylistNameChange={setPlaylistName}
          />
        )}
        <div className="flex-1 flex flex-col justify-end p-4">
          <div className="bg-black bg-opacity-50 rounded-lg p-4">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                <ListIcon className="h-6 w-6" />
              </Button>
              <div className="flex items-center space-x-4">
                <Button onClick={handlePreviousTrack} variant="ghost"><SkipBackIcon className="h-6 w-6" /></Button>
                <Button onClick={togglePlay} variant="ghost" className="h-12 w-12 rounded-full">
                  {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
                </Button>
                <Button onClick={handleNextTrack} variant="ghost"><SkipForwardIcon className="h-6 w-6" /></Button>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  accept="audio/*"
                  ref={fileInputRef}
                />
                <Button onClick={() => fileInputRef.current.click()} variant="ghost">
                  <UploadIcon className="h-6 w-6" />
                </Button>
                <Button onClick={handleSoundCloudUpload} variant="ghost">
                  <CloudIcon className="h-6 w-6" />
                </Button>
                <Button onClick={handleExportPlaylist} variant="ghost">
                  <DownloadIcon className="h-6 w-6" />
                </Button>
                <div className="w-24">
                  <Slider
                    value={[volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                  />
                </div>
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
      <audio
        ref={audioRef}
        onTimeUpdate={handleProgress}
        onEnded={handleNextTrack}
        onError={(e) => {
          console.error('Audio error:', e);
          setError('Error loading audio: ' + e.target.error.message);
        }}
      />
    </div>
  );
};

export default MusicPlayer;