import React, {useEffect, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {Tooltip} from "@/components/ui/tooltip";
import {CloudIcon, DownloadIcon, Eye, EyeOff, ListIcon, PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon, UploadIcon, Volume, Volume1, Volume2, VolumeX} from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import {exportPlaylistToM3U8, loadSoundCloudTrack} from '../utils/playlistUtils';
import {useInteraction} from '../providers/InteractionProvider.jsx';
import {usePlayback} from '../providers/PlaybackProvider.jsx';
import {usePlaylist} from '../providers/PlaylistProvider.jsx';
import {useVisualizer} from '../providers/VisualizerProvider.jsx';
import TypingIntro from './TypingIntro';
import WelcomeScreen from './WelcomeScreen';
import {AppConfig} from '@/config/AppConfig';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

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
  const {currentTrack, isPlaying, currentTime, duration, volume, error, toggle, seek, setVolume} = usePlayback();
  const {playlist, playlistName, setPlaylistName, select, next, prev, add, reorder} = usePlaylist();
  const {isInteracting, isInteracted} = useInteraction();
  const {enabled: visualizerEnabled, currentPresetName, controls: visualizerControls} = useVisualizer();

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [indicator, setIndicator] = useState('▶');

  const fileInputRef = useRef(null);
  const showPlaylistRestoredRef = useRef(false);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

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

  const CREDIT_STRING = ' | Z U K O — Darkwave Music Player';
  const MAX_TITLE_LENGTH = 60;

  useEffect(() => {
    const indicators = ['▶', '▷'];
    let indicatorIndex = 0;
    const interval = setInterval(() => {
      setIndicator(() => {
        if (!isPlaying) {
          return '🟥';
        }
        indicatorIndex = (indicatorIndex + 1) % indicators.length;
        return indicators[indicatorIndex];
      });
    }, 750);

    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    if (!currentTrack) {
      document.title = document.head.dataset.initialTitle || 'Z U K O — Darkwave Music Player';
      return;
    }

    const fullTitle = currentTrack.title;

    if (fullTitle.length <= MAX_TITLE_LENGTH) {
      document.title = `${indicator} ${fullTitle}${CREDIT_STRING}`;
    } else {
      let startIndex = 0;
      const titleScrollInterval = setInterval(() => {
        const slicedTitle = fullTitle.slice(startIndex, startIndex + MAX_TITLE_LENGTH);
        document.title = `${indicator} ${slicedTitle}${CREDIT_STRING}`;
        startIndex = (startIndex + 1) % (fullTitle.length + 1);
      }, 500);

      return () => clearInterval(titleScrollInterval);
    }
  }, [currentTrack, indicator, isPlaying]);

  /** first user gesture → start playback */
  useEffect(() => {
    if(!isInteracted) return;
    if(!currentTrack && playlist.length > 0) {
      select(playlist[0]);
    }
    else if(!isPlaying) {
      toggle();
    }
  }, [isInteracted]); // eslint-disable-line react-hooks/exhaustive-deps

  /** hot keys */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
      else if(e.code === 'ArrowLeft') {
        visualizerControls.prevPreset();
      }
      else if(e.code === 'ArrowRight') {
        visualizerControls.nextPreset();
      }
      else if(e.code === 'ArrowUp') {
        next();
      }
      else if(e.code === 'ArrowDown') {
        prev();
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
  }, [toggle, next, prev, visualizerControls]);

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newTracks = files.map((file, index) => ({
      id    : `local-${Date.now()}-${index}`,
      title : file.name,
      url   : URL.createObjectURL(file),
      type  : 'local'
    }));
    add(newTracks);
  };

  const handleSoundCloudUpload = async () => {
    alert('SoundCloud upload is waiting for API key approval. So, it is not implemented yet.');
    return;
    // eslint-disable-next-line no-unreachable
    const url = prompt("Enter SoundCloud URL:");
    if(url) {
      try {
        const track = await loadSoundCloudTrack(url);
        add([track]);
      }
      catch(err) {
        console.error("Error loading SoundCloud track:", err);
      }
    }
  };

  const handleExportPlaylist = () => {
    exportPlaylistToM3U8(playlist, playlistName);
  };

  const VolumeIconComp = getVolumeIcon(volume);

  return (
  <>
  <div className="relative h-screen bg-black bg-opacity-80 text-white">
      <Visualizer />

      {/* Mobile only: floating button to toggle visualizer renderer */}
      {isInteracted && (
        <button
          className="md:hidden fixed top-4 right-4 z-40 flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-300 active:scale-90"
          style={{background: visualizerEnabled ? 'rgba(220,38,38,0.75)' : 'rgba(55,65,81,0.75)'}}
          onClick={() => visualizerControls.setEnabled(v => !v)}
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
            onTrackSelect={select}
            onReorder={reorder}
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
            if(duration > 0) {
              seek((value[0] / 100) * duration);
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
                <Button onClick={() => visualizerControls.setEnabled(v => !v)} variant="ghost">
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
                <Button onClick={prev} variant="ghost" className="p-2">
                  <SkipBackIcon className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
              </Tooltip>
              <Tooltip content={isPlaying ? "Pause" : "Play"} delayDuration={1000}>
                <Button onClick={toggle} variant="ghost" className="h-11 w-11 md:h-12 md:w-12 rounded-full p-0 flex items-center justify-center">
                  {isPlaying ?
                    <PauseIcon className="h-6 w-6 md:h-7 md:w-7" /> :
                    <PlayIcon className="h-6 w-6 md:h-7 md:w-7" />
                  }
                </Button>
              </Tooltip>
              <Tooltip content="Next Track" delayDuration={1000}>
                <Button onClick={next} variant="ghost" className="p-2">
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
                  onValueChange={(value) => setVolume(value[0] / 100)}
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
                      onValueChange={(value) => setVolume(value[0] / 100)}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>
      {/* audio element is owned by PlaybackProvider */}
    </div>

  </>
  );
};

export default MusicPlayer;
