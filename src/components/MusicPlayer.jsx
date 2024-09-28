import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PlayIcon, PauseIcon, SkipForwardIcon, SkipBackIcon, ListIcon, UploadIcon, CloudIcon, DownloadIcon } from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import { loadSoundCloudTrack, exportPlaylistToM3U8 } from '../utils/playlistUtils';
import { checkAndClearPlaylist, getStoredPlaylist, setStoredPlaylist } from '../utils/versionCheck';

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('Default Playlist');
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const audioRef = useRef(null);
  const hlsRef = useRef(null);
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);

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
    const handleActivity = () => {
      setIsActive(true);
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setIsActive(false), 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeoutRef.current);
    };
  }, []);

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
      <Visualizer audioRef={audioRef} />
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