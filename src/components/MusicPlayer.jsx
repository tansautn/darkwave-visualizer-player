import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {Tooltip} from "@/components/ui/tooltip";
import {CloudIcon, DownloadIcon, ListIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, UploadIcon} from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import {exportPlaylistToM3U8, loadSoundCloudTrack} from '../utils/playlistUtils';
import {checkAndClearPlaylist, getStoredPlaylist, setStoredPlaylist} from '../utils/versionCheck';
import {useInteraction} from '../providers/InteractionProvider.jsx';

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const defaultPlaylist = [
  {id : '10', title : 'Happy no birthday - Zuko mix', url : 'https://cdn.zuko.pro/Recording%202024.10.15%2020_51_34.mp3', type : 'remote'},
  {id : '8', title : 'Mixtape Nhạc Cổ Lùn 2088 - Zuko on the mix', url : 'https://cdn.zuko.pro/nhac%20co%20lun_test_mixdown.mp3', type : 'remote'},
  {id    : '9', title : 'Mixtape Một Mai Muộn Màng - Zuko mix 2020', url : 'https://cdn.zuko.pro/Mot-Mai-Muon-Mang_ Zuko_mixdown_total_rms_0.5.mp3',
    type : 'remote'
  },
  { id: '3', title: 'DJ Blue Sky - Han Mac Tu (Remix)', url: 'https://cdn.zuko.pro/DJ Blue Sky - Han Mac Tu (Remix) [High quality].mp3', type: 'remote' },
  { id: '2', title: 'Tôi là tôi 2013 - Koi Fish', url: 'https://cdn.zuko.pro/Tôi là tôi 2013 - Koi Fish.mp3', type: 'remote' },
  { id: '1', title: 'Dang Cay - T.H', url: 'https://cdn.zuko.pro/Dang Cay - T.H.wav', type: 'remote' },
  { id: '4', title: 'Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix', url: 'https://cdn.zuko.pro/Faded Ft Thu Cuoi - DJ Linh Ku Feat DJ Phuc Nelly Remix.mp3', type: 'remote' },
  { id: '5', title: 'Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky', url: 'https://cdn.zuko.pro/Neu Em Duoc Lua Chon (Le Quyen) - Ben Heineken ft Tricky.mp3', type: 'remote' },
  { id: '6', title: 'full B\'Small remix', url: 'https://cdn.zuko.pro/full B\'Small remix.mp3', type: 'remote' },
];

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playlist, setPlaylist] = useState([]);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [playlistName, setPlaylistName] = useState('Default Playlist');
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [currentPresetName, setCurrentPresetName] = useState(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);
  const visualizerRef = useRef(null);
  const cycleTimeoutRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const {isInteracting, isInteracted} = useInteraction();
  /** check if js bundled's version is newer than local storage's version. if so, reset playlist */
  useEffect(() => {
    const wasReset = checkAndClearPlaylist();
    const storedPlaylist = getStoredPlaylist();
    if (wasReset || !storedPlaylist) {
      setPlaylist(defaultPlaylist);
    } else {
      setPlaylist(storedPlaylist);
    }
  }, []);
  /** store playlist in local storage */
  useEffect(() => {
    setStoredPlaylist(playlist);
  }, [playlist]);

  useEffect(() => {
    console.info('current track', currentTrack);
    if (currentTrack) {
      setError(null);
      if (audioRef.current) {
        audioRef.current.src = currentTrack.url;
        audioRef.current.load();

      }
    }
  }, [ isPlaying ]);

  useEffect(() => {
    if (!currentTrack && playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
  }, [ playlist ]);
//  /** user gesture detection */
  useEffect(() => {
    if(!isInteracted) {
      return;
    }
    console.info('run useEffect', currentTrack, isPlaying);
    if(!currentTrack && playlist.length > 0) {
      setCurrentTrack(playlist[0]);
    }
//    setIsPlaying(true);
    if(!isPlaying) {
      togglePlay();
    }
//    const handleActivity = () => {
//      setIsActive(true);
//      clearTimeout(timeoutRef.current);
//      timeoutRef.current = setTimeout(() => setIsActive(false), 3000);
//    };
//
//    window.addEventListener('mousemove', handleActivity);
//    window.addEventListener('keydown', handleActivity);
//
//    return () => {
//      window.removeEventListener('mousemove', handleActivity);
//      window.removeEventListener('keydown', handleActivity);
//      clearTimeout(timeoutRef.current);
//    };
  }, [isInteracted]);
  useEffect(() => {
    setCurrentPresetName(visualizerRef.current?.getCurrentPreset()?.name);
  }, [visualizerRef.current?.getCurrentPreset()]);
  /** hot keys */
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
  }, [ currentTrack, isPlaying, audioRef.current ]);

  const handleProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, [ audioRef.current ]);

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
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    }
  }, [playlist, currentTrack]);

  const handlePreviousTrack = useCallback(() => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    if (currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
    }
  }, [playlist, currentTrack]);

  return (
    <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer audioRef={audioRef} ref={visualizerRef} cycleTimeoutRef={cycleTimeoutRef} initTimeoutRef={initTimeoutRef} />
      <div className={`absolute inset-x-0 bottom-0 flex flex-col transition-opacity duration-300 ${isInteracting ? 'opacity-60' : 'opacity-5'}`}>
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
          <div className="flex items-center justify-between mb-2">
            
            <div className="text-sm text-center">{currentTrack?.title}</div>
            
          </div>
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={(value) => {
              if (audioRef.current) {
                audioRef.current.currentTime = (value[ 0 ] / 100) * audioRef.current.duration;
              }
            }}
          />
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
            <Tooltip content="Toggle Playlist" delayDuration={1000}>
              <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                <ListIcon className="h-6 w-6" />
              </Button>
            </Tooltip>
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
            </div>
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
              <Tooltip content="Export Playlist" delayDuration={1000}>
                <Button onClick={handleExportPlaylist} variant="ghost">
                  <DownloadIcon className="h-6 w-6" />
                </Button>
              </Tooltip>
              <div className="w-24">
                <Slider
                value={[ volume * 100 ]}
                max={100}
                step={1}
                onValueChange={(value) => handleVolumeChange(value[ 0 ] / 100)}
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

export default MusicPlayer;
