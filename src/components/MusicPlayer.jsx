import React, {useEffect, useRef, useState} from 'react';
import {Button} from "@/components/ui/button";
import {Slider} from "@/components/ui/slider";
import {CloudIcon, DownloadIcon, Eye, EyeOff, ListIcon, PauseIcon, PlayIcon, Settings2, SkipBackIcon, SkipForwardIcon, UploadIcon, Volume, Volume1, Volume2, VolumeX} from 'lucide-react';
import Visualizer from './Visualizer';
import Sidebar from './Sidebar';
import HintTooltip from './HintTooltip';
import PresetHud from './PresetHud';
import SettingsDialog from './SettingsDialog';
import TrackTitle from './TrackTitle';
import {exportPlaylistToM3U8, loadSoundCloudTrack} from '../utils/playlistUtils';
import {useInteraction} from '../providers/InteractionProvider.jsx';
import {usePlayback} from '../providers/PlaybackProvider.jsx';
import {usePlaylist} from '../providers/PlaylistProvider.jsx';
import {useVisualizer} from '../providers/VisualizerProvider.jsx';
import {useSettings} from '../providers/SettingsProvider.jsx';
import TypingIntro from './TypingIntro';
import WelcomeScreen from './WelcomeScreen';
import {AppConfig} from '@/config/AppConfig';
import {TEXT_SCALES} from '@/config/settings';
import {SHORTCUTS} from '@/config/shortcuts';
import {useFlashOnChange} from '@/hooks/useFlashOnChange';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';

/** m:ss, or h:mm:ss for long mixes; non-finite (live stream) → --:-- */
const formatTime = (time) => {
  if(!Number.isFinite(time)) return '--:--';
  const total = Math.max(0, Math.floor(time));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
};

/** focused element handles this key itself — global hot keys must not fire on top */
const ownsKey = (target, key) => {
  if(!(target instanceof HTMLElement)) return false;
  if(target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return true;
  return target.getAttribute('role') === 'slider' && key.startsWith('Arrow');
};

const DIM_TRANSITION = 'transition-opacity duration-300';

const TIME_LABEL_CLASS = 'min-w-[6ch] shrink-0 font-mono text-ui-sm font-medium tabular-nums text-white/90 text-halo';

const getVolumeIcon = (vol) => {
  if(vol === 0) return VolumeX;
  if(vol <= 0.33) return Volume;
  if(vol <= 0.66) return Volume1;
  return Volume2;
};

const MusicPlayer = () => {
  const {currentTrack, isPlaying, currentTime, duration, volume, error, toggle, seek, setVolume} = usePlayback();
  const {playlist, playlistName, setPlaylistName, select, next, prev, add, reorder} = usePlaylist();
  const {isInteracting, isInteracted, isTapGuarded} = useInteraction();
  const {enabled: visualizerEnabled, currentPresetName, controls: visualizerControls} = useVisualizer();
  const {settings, updateSettings} = useSettings();
  const {ui} = settings;

  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showIntro, setShowIntro] = useState(ui.showIntro); // read once — the setting applies from the next visit
  const [showSettings, setShowSettings] = useState(false);
  const [indicator, setIndicator] = useState('▶');
  const titleFlashing = useFlashOnChange(currentTrack?.id, AppConfig.TITLE_FLASH_MS);

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

  const autoShowPlaylist = () => {
    if(!showPlaylistRestoredRef.current) {
      setTimeout(() => setShowPlaylist(true), AppConfig.PLAYLIST_AUTO_SHOW_DELAY);
    }
  };

  const handleIntroComplete = () => {
    setShowIntro(false);
    autoShowPlaylist();
  };

  /** first user gesture → start playback */
  useEffect(() => {
    if(!isInteracted) return;
    if(!currentTrack && playlist.length > 0) {
      select(playlist[0]);
    }
    else if(!isPlaying) {
      toggle();
    }
    if(!showIntro) {
      autoShowPlaylist();
    }
  }, [isInteracted]); // eslint-disable-line react-hooks/exhaustive-deps

  /** hot keys */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if(showSettings || ownsKey(e.target, e.key)) return;
      if(e.key === ',' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowSettings(true);
      }
      else if(e.code === 'Space') {
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
  }, [toggle, next, prev, visualizerControls, showSettings]);

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
  /* dimming is applied per region, so the title can stay lit while the rest dims */
  const controlsActive = !visualizerEnabled || isInteracting;
  const controlsOpacity = controlsActive ? ui.activeOpacity : ui.idleOpacity;
  const titlePinned = ui.titleVisibility === 'always' || (ui.titleVisibility === 'change' && titleFlashing);
  const titleOpacity = (controlsActive || titlePinned) ? ui.activeOpacity : ui.idleOpacity;
  const tapGuardActive = ui.tapGuard && visualizerEnabled && isTapGuarded;
  const toggleTimeMode = () => updateSettings('ui', {showRemaining : !ui.showRemaining});

  return (
  <>
  <div className="relative h-screen bg-black bg-opacity-80 text-white" style={{'--ui-scale' : TEXT_SCALES[ui.textScale]}}>
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

      {/* Preset HUD - góc trên màn hình, tách khỏi thông tin bài hát */}
      {isInteracted && ui.presetVisibility !== 'off' && visualizerEnabled && (
        <PresetHud
          name={currentPresetName}
          mode={ui.presetVisibility}
          active={isInteracting}
          onPrev={visualizerControls.prevPreset}
          onNext={visualizerControls.nextPreset}
        />
      )}

      {/* Welcome Screen - hiển thị trước khi user interaction */}
      {!isInteracted && (
        <WelcomeScreen />
      )}

      {/* Typing Intro Overlay - hiển thị sau khi user đã interact */}
      {showIntro && isInteracted && (
        <TypingIntro onComplete={handleIntroComplete} />
      )}

      <div className="absolute inset-x-0 bottom-0 isolate flex flex-col">
        {/* scrim — keeps title / time / icons readable over bright presets */}
        {ui.controlsScrim && (
          <div aria-hidden="true" className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent ${DIM_TRANSITION}`} style={{opacity : controlsOpacity}} />
        )}
        {showPlaylist && (
        <div className={`bg-black bg-opacity-5 rounded-t-lg mx-4 mb-2 max-h-[80vh] overflow-y-auto ${DIM_TRANSITION}`} style={{opacity : controlsOpacity}}>
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
        <div className="bg-black bg-opacity-5 rounded-lg mx-4 mb-4 px-4 pb-4 pt-2 md:px-6">
          {error && <div className={`mb-2 text-center text-ui-sm font-medium text-red-300 text-halo ${DIM_TRANSITION}`} style={{opacity : controlsOpacity}}>{error}</div>}

          <div className={DIM_TRANSITION} style={{opacity : titleOpacity}}>
            <TrackTitle title={currentTrack?.title} effects={ui.titleEffects} className="mb-1" />
          </div>

          <div className={DIM_TRANSITION} style={{opacity : controlsOpacity}}>
            {/* `dark` flips the vendored Slider tokens: bright played range on a dim track */}
            <div className="dark flex items-center gap-3">
              <span className={`${TIME_LABEL_CLASS} text-left`}>{formatTime(currentTime)}</span>
              <Slider
              className="flex-1"
              value={[progress]}
              max={100}
              step={1}
              onValueChange={(value) => {
                if(duration > 0) {
                  seek((value[0] / 100) * duration);
                }
              }}
              />
              <HintTooltip content={ui.showRemaining ? 'Show total duration' : 'Show remaining time'}>
                <button
                  type="button"
                  onClick={toggleTimeMode}
                  className={`${TIME_LABEL_CLASS} rounded text-right transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
                >
                  {ui.showRemaining ? `−${formatTime(duration - currentTime)}` : formatTime(duration)}
                </button>
              </HintTooltip>
            </div>

            <div className="flex items-center justify-between mt-3">
              {/* Mobile-only: playlist toggle */}
              <div className="flex md:hidden items-center">
                <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost" className="p-2" aria-label="Toggle playlist">
                  <ListIcon className="h-5 w-5" />
                </Button>
              </div>
              {/* Desktop-only: full left controls */}
              <div className="hidden md:flex items-center space-x-2">
                <HintTooltip content={visualizerEnabled ? 'Tắt Visualizer' : 'Bật Visualizer'}>
                  <Button onClick={() => visualizerControls.setEnabled(v => !v)} variant="ghost">
                    {visualizerEnabled ? <Eye className="h-4 w-4 md:h-6 md:w-6" /> : <EyeOff className="h-4 w-4 md:h-6 md:w-6" />}
                  </Button>
                </HintTooltip>
                <HintTooltip content="Toggle Playlist">
                  <Button onClick={() => setShowPlaylist(!showPlaylist)} variant="ghost">
                    <ListIcon className="h-4 w-4 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  multiple
                  onChange={handleFileUpload}
                  accept="audio/*"
                  ref={fileInputRef}
                />
                <HintTooltip content="Upload Local File" shortcut={SHORTCUTS.uploadLocal.keys}>
                  <Button onClick={() => fileInputRef.current.click()} variant="ghost">
                    <UploadIcon className="h-4 w-4 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
                <HintTooltip content="Add SoundCloud Track" shortcut={SHORTCUTS.addSoundCloud.keys}>
                  <Button onClick={handleSoundCloudUpload} variant="ghost">
                    <CloudIcon className="h-4 w-4 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
              </div>
              <div className="flex-1 flex items-center justify-center space-x-2 md:space-x-4">
                <HintTooltip content={SHORTCUTS.prevTrack.label} shortcut={SHORTCUTS.prevTrack.keys}>
                  <Button onClick={prev} variant="ghost" className="p-2">
                    <SkipBackIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
                <HintTooltip content={isPlaying ? "Pause" : "Play"} shortcut={SHORTCUTS.togglePlay.keys}>
                  <Button onClick={toggle} variant="ghost" className="h-11 w-11 md:h-12 md:w-12 rounded-full p-0 flex items-center justify-center">
                    {isPlaying ?
                      <PauseIcon className="h-6 w-6 md:h-7 md:w-7" /> :
                      <PlayIcon className="h-6 w-6 md:h-7 md:w-7" />
                    }
                  </Button>
                </HintTooltip>
                <HintTooltip content={SHORTCUTS.nextTrack.label} shortcut={SHORTCUTS.nextTrack.keys}>
                  <Button onClick={next} variant="ghost" className="p-2">
                    <SkipForwardIcon className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
              </div>
              <div className="flex items-center space-x-2">
                <HintTooltip content="Export Playlist">
                  <Button onClick={handleExportPlaylist} variant="ghost" className="hidden md:inline-flex">
                    <DownloadIcon className="h-4 w-4 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
                {/* Desktop: inline volume slider */}
                <div className="dark hidden md:block w-24">
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
                  <PopoverContent side="top" align="end" className="dark w-40 p-3 bg-black/90 border border-white/20 text-white">
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
                <HintTooltip content="Settings" shortcut={SHORTCUTS.openSettings.keys}>
                  <Button onClick={() => setShowSettings(true)} variant="ghost" className="p-2 md:px-4" aria-label="Settings">
                    <Settings2 className="h-5 w-5 md:h-6 md:w-6" />
                  </Button>
                </HintTooltip>
              </div>
            </div>
          </div>
        </div>
        {/* tap guard — while up, the first tap on the dimmed controls only wakes
            them (timing lives in InteractionProvider) */}
        {tapGuardActive && <div aria-hidden="true" className="absolute inset-0 z-10" />}
      </div>
      {/* audio element is owned by PlaybackProvider */}
    </div>

    <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
  </>
  );
};

export default MusicPlayer;
