import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {Tooltip} from "@/components/ui/tooltip";
import {CloudIcon, DownloadIcon, Eye, EyeOff, ListIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, UploadIcon, Volume, Volume1, Volume2, VolumeX} from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import {exportPlaylistToM3U8, loadSoundCloudTrack} from '../utils/playlistUtils';
import {checkAndClearPlaylist, getStoredPlaylist, setStoredPlaylist} from '../utils/versionCheck';
import {useInteraction} from '../providers/InteractionProvider.jsx';
import defaultPlaylist from '@/playlists/default';
import {toast} from '@/components/ui/use-toast.js';
import {encodeUrl} from '@/utils/urlUtils.js';
import TypingIntro from './TypingIntro';
import WelcomeScreen from './WelcomeScreen';
import {AppConfig} from '@/config/AppConfig';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

const PLAYBACK_STATE_KEY = 'darkwave-playback-state';

const formatTime = (time) => {
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const getVolumeIcon = (vol) => {
  if(vol === 0) return VolumeX;
  if(vol <= 0.33) return Volume;
  if(vol <= 0.66) return Volume1;
  return Volume2;
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
  const [currentPresetName, setCurrentPresetName] = useState(null);
  const [showIntro, setShowIntro] = useState(true);
  // For scrolling track title
  const [scrollingTitle, setScrollingTitle] = useState('');
  const [indicator, setIndicator] = useState('▶');

  const [visualizerEnabled, setVisualizerEnabled] = useState(true);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const timeoutRef = useRef(null);
  const visualizerRef = useRef(null);
  const visInstanceRef = useRef(null);
  const cycleTimeoutRef = useRef(null);
  const initTimeoutRef = useRef(null);
  const {isInteracting, isInteracted} = useInteraction();
  const playbackHydratedRef = useRef(false);
  const restoreTimeRef = useRef(null);
  const skipNextSaveRef = useRef(false);
  const showPlaylistRestoredRef = useRef(false);
  /** hydrate showPlaylist from UI state storage — runs once on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AppConfig.UI_STATE_KEY);
      if(stored) {
        const parsed = JSON.parse(stored);
        if(typeof parsed.showPlaylist === 'boolean') {
          setShowPlaylist(parsed.showPlaylist);
          showPlaylistRestoredRef.current = true;
        }
      }
    }
    catch {}
  }, []);

  /** persist showPlaylist to UI state storage on every change */
  useEffect(() => {
    try {
      localStorage.setItem(AppConfig.UI_STATE_KEY, JSON.stringify({showPlaylist}));
    }
    catch {}
  }, [showPlaylist]);

  /** check if js bundled's version is newer than local storage's version. if so, reset playlist */
  useEffect(() => {
    const wasReset = checkAndClearPlaylist();
    const storedPlaylist = getStoredPlaylist();
    if(wasReset || !storedPlaylist) {
      setPlaylist(defaultPlaylist);
    }
    else {
      setPlaylist(storedPlaylist);
    }
  }, []);
  /** store playlist in local storage */
  useEffect(() => {
    setStoredPlaylist(playlist);
  }, [playlist]);
  const savePlaybackState = useCallback((positionOverride) => {
    if(typeof window === 'undefined' || !currentTrack) {
      return;
    }
    const trackIndex = playlist.findIndex(track => track.id === currentTrack.id);
    if(trackIndex === -1) {
      return;
    }
    const position = typeof positionOverride === 'number'
      ? positionOverride
      : (audioRef.current?.currentTime ?? 0);

    try {
      localStorage.setItem(
        PLAYBACK_STATE_KEY,
        JSON.stringify({
          trackId  : currentTrack.id,
          index    : trackIndex,
          position : position
        })
      );
    }
    catch(error) {
      console.warn('Failed to persist playback state', error);
    }
  }, [currentTrack, playlist, audioRef]);

  useEffect(() => {
    if(typeof window === 'undefined' || playlist.length === 0) {
      return;
    }

    if(playbackHydratedRef.current) {
      if(!currentTrack && playlist.length > 0) {
        setCurrentTrack(playlist[0]);
      }
      return;
    }

    let nextTrack = playlist[0];
    try {
      const storedState = localStorage.getItem(PLAYBACK_STATE_KEY);
      if(storedState) {
        const parsed = JSON.parse(storedState);
        let nextIndex = -1;

        if(parsed?.trackId) {
          nextIndex = playlist.findIndex(track => track.id === parsed.trackId);
        }
        if(nextIndex === -1 && typeof parsed?.index === 'number') {
          const {index} = parsed;
          if(index >= 0 && index < playlist.length) {
            nextIndex = index;
          }
        }

        if(nextIndex >= 0) {
          nextTrack = playlist[nextIndex];
          if(typeof parsed?.position === 'number') {
            restoreTimeRef.current = parsed.position;
          }
        }
      }
    }
    catch(error) {
      console.warn('Failed to parse playback state', error);
    }

    skipNextSaveRef.current = restoreTimeRef.current != null;
    setCurrentTrack(nextTrack);
    playbackHydratedRef.current = true;
  }, [playlist, currentTrack]);

  useEffect(() => {
    if(!currentTrack) {
      return;
    }
    if(skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    savePlaybackState(0);
  }, [currentTrack, savePlaybackState]);

  useEffect(() => {
    if(!currentTrack) {
      return;
    }
    const interval = setInterval(() => {
      savePlaybackState();
    }, 10000);

    return () => clearInterval(interval);
  }, [currentTrack, savePlaybackState]);

  useEffect(() => {
    return () => {
      savePlaybackState();
    };
  }, [savePlaybackState]);

  const autoPlayStart = () => {
    if(audioRef.current && audioRef.current.state === "suspended") {
      return;
    }
    if(currentTrack) {
      setError(null);
      if(audioRef.current) {
        audioRef.current.src = encodeUrl(currentTrack.url);
        audioRef.current.load();
        if(isPlaying) {
          audioRef.current.play().catch(e => {
            console.error('Error playing audio:', e);
            setError('Error playing audio: ' + e.message);
            setIsPlaying(false);
          });
        }
      }
    }
  };
  useEffect(autoPlayStart, [currentTrack, audioRef]);
  // --- Start of new/modified useEffects for title management ---
  const CREDIT_STRING = ' | Z U K O — Darkwave Music Player';
  const MAX_TITLE_LENGTH = 60; // Độ dài tối đa trước khi bắt đầu chạy chữ

  // Part 1: Indicator
  useEffect(() => {
    const indicators = ['▶', '▷'];
    let indicatorIndex = 0;
    const interval = setInterval(() => {
      setIndicator(prev => {
        if (!isPlaying) {
          return '🟥'; // Nếu không phát, luôn là '🟥'
        }
        indicatorIndex = (indicatorIndex + 1) % indicators.length;
        return indicators[indicatorIndex];
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying]); // Chạy lại khi trạng thái play thay đổi


  // Part 2 & 3: Title và Credit
  useEffect(() => {
    if (!currentTrack) {
      document.title = document.head.dataset.initialTitle || 'Z U K O — Darkwave Music Player';
      setScrollingTitle(''); // Reset scrolling title khi không có track
      return;
    }

    const fullTitle = currentTrack.title;

    if (fullTitle.length <= MAX_TITLE_LENGTH) {
      // Nếu title ngắn, không cần chạy chữ
      setScrollingTitle(fullTitle); // Đảm bảo scrollingTitle được cập nhật
      document.title = `${indicator} ${fullTitle}${CREDIT_STRING}`;
    } else {
      let startIndex = 0;
      const titleScrollInterval = setInterval(() => {
        const slicedTitle = fullTitle.slice(startIndex, startIndex + MAX_TITLE_LENGTH);
        setScrollingTitle(slicedTitle); // Cập nhật state scrollingTitle
        document.title = `${indicator} ${slicedTitle}${CREDIT_STRING}`;

        startIndex = (startIndex + 1) % (fullTitle.length + 1); // +1 để có khoảng trắng ở cuối khi cuộn
      }, 500); // Tốc độ chạy chữ (ví dụ: 500ms)

      return () => clearInterval(titleScrollInterval);
    }
  }, [currentTrack, indicator, isPlaying]); // Thêm indicator và isPlaying vào dependency để cập nhật tức thì

  // --- End of new/modified useEffects for title management ---

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
    setCurrentPresetName(visInstanceRef?.current?.currentPresetName);
  }, [visInstanceRef?.current?.currentPresetName]);
  /** hot keys */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
      else if(e.code === 'ArrowLeft') {
        visualizerRef.current?.prevPreset();
      }
      else if(e.code === 'ArrowRight') {
        visualizerRef.current?.nextPreset();
      }
      else if(e.code === 'ArrowUp') {
        handleNextTrack();
      }
      else if(e.code === 'ArrowDown') {
        handlePreviousTrack();
      }
      else if(e.code === 'Enter') {
        if(e.shiftKey) {
          fileInputRef.current?.click();
        }
        else {
          handleSoundCloudUpload();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current && audioRef.current.state === "suspended") {
      console.warn('Audio is suspended. Cannot play audio.');
      toast('Audio is suspended. Could not play audio until you have iteracted with the page.', { duration : 800 });
      return;
    }
    if(!currentTrack) {
      setError('No track selected');
      return;
    }
    if(isPlaying) {
      audioRef.current.pause();
    }
    else {
      audioRef.current.play().catch(e => {
        console.error('Error playing audio:', e);
        setError('Error playing audio: ' + e.message);
      });
    }
    setIsPlaying(!isPlaying);
  }, [currentTrack, isPlaying, audioRef.current]);

  const handleProgress = () => {
    if(audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    if(audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, [audioRef.current]);

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
      id    : `local-${Date.now()}-${index}`,
      title : file.name,
      url   : URL.createObjectURL(file),
      type  : 'local'
    }));
    setPlaylist([...playlist, ...newTracks]);
  };

  const handleSoundCloudUpload = async () => {
    alert('SoundCloud upload is waiting for API key approval. So, it is not implemented yet.');
    return;
    const url = prompt("Enter SoundCloud URL:");
    if(url) {
      try {
        const track = await loadSoundCloudTrack(url);
        setPlaylist([...playlist, track]);
      }
      catch(error) {
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
    if(currentIndex < playlist.length - 1) {
      setCurrentTrack(playlist[currentIndex + 1]);
    }
  }, [playlist, currentTrack?.id]);

  const handlePreviousTrack = useCallback(() => {
    const currentIndex = playlist.findIndex(track => track.id === currentTrack?.id);
    if(currentIndex > 0) {
      setCurrentTrack(playlist[currentIndex - 1]);
    }
  }, [playlist, currentTrack?.id]);

  const VolumeIconComp = getVolumeIcon(volume);

  return (
  <>
  <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer audioRef={audioRef} visualizerRef={visualizerRef} ref={visInstanceRef} cycleTimeoutRef={cycleTimeoutRef} initTimeoutRef={initTimeoutRef} enabled={visualizerEnabled} />
      
      {/* Mobile only: floating button to toggle visualizer renderer */}
      {isInteracted && (
        <button
          className="md:hidden fixed top-4 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 active:scale-90"
          style={{background: visualizerEnabled ? 'rgba(220,38,38,0.75)' : 'rgba(55,65,81,0.75)'}}
          onClick={() => setVisualizerEnabled(v => !v)}
          title={visualizerEnabled ? 'Tắt Visualizer' : 'Bật Visualizer'}
        >
          {visualizerEnabled ? <Eye className="h-5 w-5 text-white" /> : <EyeOff className="h-5 w-5 text-white" />}
        </button>
      )}

      {/* Welcome Screen - hiển thị trước khi user interaction */}
      {!isInteracted && (
        <WelcomeScreen />
      )}

      {/* Typing Intro Overlay - hiển thị sau khi user đã interact */}
      {showIntro && isInteracted && (
        <TypingIntro onComplete={() => {
          setShowIntro(false);
          if(!showPlaylistRestoredRef.current) {
            setTimeout(() => setShowPlaylist(true), AppConfig.PLAYLIST_AUTO_SHOW_DELAY);
          }
        }} />
      )}

      <div className={`absolute inset-x-0 bottom-0 flex flex-col transition-opacity duration-300 ${!visualizerEnabled ? 'opacity-[0.85]' : isInteracting ? 'opacity-60' : 'opacity-5'}`}>
        {showPlaylist && (
        <div className="bg-black bg-opacity-5 rounded-t-lg mx-4 mb-2 max-h-[80vh] overflow-y-auto">
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
          <div className="flex items-center justify-center mb-2">
            <div className="text-sm text-center text-yellow-700">{`Preset: ${currentPresetName}`}</div>
          </div>
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
            if(audioRef.current) {
              audioRef.current.currentTime = (value[0] / 100) * audioRef.current.duration;
            }
          }}
          />
          <div className="flex items-center justify-between mt-4">
            {/* Mobile-only: playlist toggle */}
            <div className="flex md:hidden items-center">
              <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost" className="p-2">
                <ListIcon className="h-5 w-5" />
              </Button>
            </div>
            {/* Desktop-only: full left controls */}
            <div className="hidden md:flex items-center space-x-2">
              <Tooltip content={visualizerEnabled ? 'Tắt Visualizer' : 'Bật Visualizer'} delayDuration={1000}>
                <Button onClick={() => setVisualizerEnabled(v => !v)} variant="ghost">
                  {visualizerEnabled ? <Eye className="h-4 w-4 md:h-6 md:w-6" /> : <EyeOff className="h-4 w-4 md:h-6 md:w-6" />}
                </Button>
              </Tooltip>
              <Tooltip content="Toggle Playlist" delayDuration={1000}>
                <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                  <ListIcon className="h-4 w-4 md:h-6 md:w-6" />
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
                  <UploadIcon className="h-4 w-4 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
              <Tooltip content="Add SoundCloud Track" delayDuration={1000}>
                <Button onClick={handleSoundCloudUpload} variant="ghost">
                  <CloudIcon className="h-4 w-4 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
            </div>
            <div className="flex-1 flex items-center justify-center space-x-2 md:space-x-4">
              <Tooltip content="Previous Track" delayDuration={1000}>
                <Button onClick={handlePreviousTrack} variant="ghost" className="p-2">
                  <SkipBackIcon className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
              <Tooltip content={isPlaying ? "Pause" : "Play"} delayDuration={1000}>
                <Button onClick={togglePlay} variant="ghost" className="h-11 w-11 md:h-12 md:w-12 rounded-full p-0 flex items-center justify-center">
                  {isPlaying ?
                    <PauseIcon className="h-6 w-6 md:h-7 md:w-7" /> :
                    <PlayIcon className="h-6 w-6 md:h-7 md:w-7" />
                  }
                </Button>
              </Tooltip>
              <Tooltip content="Next Track" delayDuration={1000}>
                <Button onClick={handleNextTrack} variant="ghost" className="p-2">
                  <SkipForwardIcon className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
            </div>
            <div className="flex items-center space-x-2">
              <Tooltip content="Export Playlist" delayDuration={1000}>
                <Button onClick={handleExportPlaylist} variant="ghost" className="hidden md:inline-flex">
                  <DownloadIcon className="h-4 w-4 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
              {/* Desktop: inline volume slider */}
              <div className="hidden md:block w-24">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                />
              </div>
              {/* Mobile: leveled icon button → popover slider */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="md:hidden p-2">
                    <VolumeIconComp className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent side="top" align="end" className="w-40 p-3 bg-black/90 border border-white/20 text-white">
                  <div className="flex items-center gap-2">
                    <VolumeIconComp className="h-4 w-4 shrink-0 text-white/70" />
                    <Slider
                      value={[volume * 100]}
                      max={100}
                      step={1}
                      onValueChange={(value) => handleVolumeChange(value[0] / 100)}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      <audio
      ref={audioRef}
      onTimeUpdate={handleProgress}
      onEnded={handleNextTrack}
      onLoadedMetadata={(event) => {
        if(restoreTimeRef.current != null) {
          event.currentTarget.currentTime = restoreTimeRef.current;
          savePlaybackState(restoreTimeRef.current);
          restoreTimeRef.current = null;
          skipNextSaveRef.current = false;
        }
      }}
      onError={(e) => {
        console.error('Audio error:', e);
        setError('Error loading audio: ' + e.target.error.message);
      }}
      crossOrigin="anonymous"
      />
    </div>

  </>
  );
};

export default MusicPlayer;
