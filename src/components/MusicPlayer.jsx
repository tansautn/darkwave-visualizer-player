import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tooltip } from "@/components/ui/tooltip";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, ListIcon, UploadIcon, CloudIcon, DownloadIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { loadSoundCloudTrack, exportPlaylistToM3U8 } from '../utils/playlistUtils';
import { checkAndClearPlaylist, getStoredPlaylist, setStoredPlaylist } from '../utils/versionCheck';
import { UserGestureProvider, useUserGestureContext } from './UserGestureProvider';

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const defaultPlaylist = [
  { id: '1', title: 'Dang Cay - T.H', url: 'https://cdn.zuko.pro/Dang Cay - T.H.wav', type: 'remote' },
  { id: '2', title: 'Tôi là tôi 2013 - Koi Fish', url: 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3', type: 'remote' },
  { id: '3', title: 'DJ Blue Sky - Han Mac Tu (Remix)', url: 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3', type: 'remote' },
  { id: '4', title: 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix', url: 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3', type: 'remote' },
  { id: '5', title: 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky', url: 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3', type: 'remote' },
  { id: '6', title: 'full B\'Small remix', url: 'https://cdn.zuko.pro/full B\'Small remix.mp3', type: 'remote' },
];

const MusicPlayerContent = () => {
  const { isActive } = useUserGestureContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(true); // Set default to true
  const [playlistName, setPlaylistName] = useState('Default Playlist');
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const visualizerRef = useRef(null);

  useEffect(() => {
    const wasReset = checkAndClearPlaylist();
    const storedPlaylist = getStoredPlaylist();
    if (wasReset || !storedPlaylist) {
      setPlaylist(defaultPlaylist);
    } else {
      setPlaylist(storedPlaylist);
    }
  }, []);

  useEffect(() => {
    setStoredPlaylist(playlist);
  }, [playlist]);

  useEffect(() => {
    if (currentTrack) {
      setError(null);
      if (audioRef.current) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();
        if (isPlaying) {
          audioRef.current.play().catch(e => {
            console.error('Error playing audio:', e);
            setError('Error playing audio: ' + e.message);
            setIsPlaying(false);
          });
        }
      }
    }
  }, [currentTrack, isPlaying]);

  useEffect(() => {
    if (!currentTrack && playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
  }, [playlist, currentTrack]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        visualizerRef.current?.prevPreset();
      } else if (e.code === 'ArrowRight') {
        visualizerRef.current?.nextPreset();
      } else if (e.code === 'ArrowUp') {
        handleNextTrack();
      } else if (e.code === 'ArrowDown') {
        handlePreviousTrack();
      } else if (e.code === 'Enter') {
        if (e.shiftKey) {
          fileInputRef.current?.click();
        } else {
          handleSoundCloudUpload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = useCallback(() => {
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
  }, [currentTrack, isPlaying]);

  const handleProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
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

  const handleNextTrack = useCallback(() => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    }
  }, [playlist, currentTrack]);

  const handlePreviousTrack = useCallback(() => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
    }
  }, [playlist, currentTrack]);

  return (
    <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer audioRef={audioRef} ref={visualizerRef} />
      <div className={`absolute inset-x-0 bottom-0 flex flex-col transition-opacity duration-300 ${isActive ? 'opacity-60' : 'opacity-5'}`}>
        {showPlaylist && (
          <div className="bg-black bg-opacity-5 rounded-t-lg mx-4 mb-2 h-[85vh] overflow-y-auto">
            <Sidebar
              playlist={playlist}
              currentTrack={currentTrack}
              onTrackSelect={handleTrackSelect}
              onReorder={handleReorder}
              playlistName={playlistName}
              onPlaylistNameChange={setPlaylistName}
            />
          </div>
        )}
        <div className="bg-black bg-opacity-5 rounded-lg mx-4 mb-4 p-4">
          {error && <div className="text-red-500 mb-2">{error}</div>}
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm">{formatTime(currentTime)}</div>
            <div className="text-sm text-center">{currentTrack?.title}</div>
            <div className="text-sm">{formatTime(duration - currentTime)}</div>
          </div>
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={(value) => {
              if (audioRef.current) {
                const newTime = (value[0] / 100) * audioRef.current.duration;
                audioRef.current.currentTime = newTime;
              }
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <Tooltip content="Toggle Playlist" delayDuration={1000}>
              <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                <ListIcon className="h-6 w-6" />
              </Button>
            </Tooltip>
            <div className="flex items-center space-x-4">
              <Tooltip content="Previous Track" delayDuration={1000}>
                <Button onClick={handlePreviousTrack} variant="ghost"><SkipBackIcon className="h-6 w-6" /></Button>
              </Tooltip>
              <Tooltip content={isPlaying ? "Pause" : "Play"} delayDuration={1000}>
                <Button onClick={togglePlay} variant="ghost" className="h-12 w-12 rounded-full">
                  {isPlaying ? <PauseIcon className="h-8 w-8" /> : <PlayIcon className="h-8 w-8" />}
                </Button>
              </Tooltip>
              <Tooltip content="Next Track" delayDuration={1000}>
                <Button onClick={handleNextTrack} variant="ghost"><SkipForwardIcon className="h-6 w-6" /></Button>
              </Tooltip>
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
              <Tooltip content="Upload Local File" delayDuration={1000}>
                <Button onClick={() => fileInputRef.current.click()} variant="ghost">
                  <UploadIcon className="h-6 w-6" />
                </Button>
              </Tooltip>
              <Tooltip content="Add SoundCloud Track" delayDuration={1000}>
                <Button onClick={handleSoundCloudUpload} variant="ghost">
                  <CloudIcon className="h-6 w-6" />
                </Button>
              </Tooltip>
              <Tooltip content="Export Playlist" delayDuration={1000}>
                <Button onClick={handleExportPlaylist} variant="ghost">
                  <DownloadIcon className="h-6 w-6" />
                </Button>
              </Tooltip>
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
        crossOrigin="anonymous"
      />
    </div>
  );
};

const MusicPlayer = () => (
  <UserGestureProvider>
    <MusicPlayerContent />
  </UserGestureProvider>
);

export default MusicPlayer;