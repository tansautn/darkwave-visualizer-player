/**
 * PlaybackProvider — owns two <audio> elements ("A" / "B") and low-level
 * playback state. Two elements enable ping-pong preload: while slot A plays
 * the current track, slot B fetches + decodes the next one, so track
 * transitions are gapless and survive mobile JS throttling.
 *
 * Exposes via usePlayback():
 *   audioRef              → active <audio> element (legacy consumers)
 *   audioRefs             → {a, b} — both, for the Web Audio graph tap
 *   activeSlot            → 'a' | 'b'
 *   currentTrack, isPlaying, currentTime, duration, volume, error
 *   play(), pause(), toggle(), seek(t), setVolume(v)
 *   loadTrack(track, {autoplay, restorePosition})
 *   preloadTrack(track)   → fetch on the inactive slot; no-op if already queued
 *   setOnEndedHandler(cb) → single-slot ended callback
 */
import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {encodeUrl} from '@/utils/urlUtils.js';

const PlaybackContext = createContext(null);

export const usePlayback = () => {
  const ctx = useContext(PlaybackContext);
  if(!ctx) {
    throw new Error('usePlayback must be used inside <PlaybackProvider>');
  }
  return ctx;
};

export const PlaybackProvider = ({children}) => {
  const audioARef = useRef(null);
  const audioBRef = useRef(null);
  const restoreTimeRef = useRef(null);
  const onEndedRef = useRef(null);
  const preloadedRef = useRef(null); // {track, slot: 'a'|'b'} or null

  const [activeSlot, setActiveSlot] = useState('a');
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState(null);

  const getSlot = (slot) => (slot === 'a' ? audioARef.current : audioBRef.current);
  const getActive = () => getSlot(activeSlot);
  const getInactive = () => getSlot(activeSlot === 'a' ? 'b' : 'a');

  const runPlay = useCallback((el) => {
    if(!el) return;
    const p = el.play();
    if(p && typeof p.then === 'function') {
      p.then(() => setIsPlaying(true)).catch(e => {
        console.error('Error playing audio:', e);
        setError('Error playing audio: ' + e.message);
        setIsPlaying(false);
      });
    }
    else {
      setIsPlaying(true);
    }
  }, []);

  const play = useCallback(() => {
    runPlay(getActive());
  }, [activeSlot, runPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = useCallback(() => {
    const el = getActive();
    if(!el) return;
    el.pause();
    setIsPlaying(false);
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    if(!currentTrack) {
      setError('No track selected');
      return;
    }
    setError(null);
    if(isPlaying) pause(); else play();
  }, [currentTrack, isPlaying, play, pause]);

  const seek = useCallback((time) => {
    const el = getActive();
    if(el && Number.isFinite(time)) {
      el.currentTime = time;
    }
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if(audioARef.current) audioARef.current.volume = v;
    if(audioBRef.current) audioBRef.current.volume = v;
  }, []);

  const preloadTrack = useCallback((track) => {
    if(!track) {
      preloadedRef.current = null;
      return;
    }
    if(preloadedRef.current?.track?.id === track.id) return;
    const inactiveSlot = activeSlot === 'a' ? 'b' : 'a';
    const el = getInactive();
    if(!el) return;
    try {
      el.pause();
      el.src = encodeUrl(track.url);
      el.load();
      preloadedRef.current = {track, slot : inactiveSlot};
    }
    catch(e) {
      console.warn('preloadTrack failed', e);
    }
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTrack = useCallback((track, opts = {}) => {
    const {autoplay = true, restorePosition = null} = opts;
    setCurrentTrack(track);
    setError(null);
    if(!track) return;

    const preloaded = preloadedRef.current;
    /* fast path: the requested track was already preloaded — swap slots */
    if(preloaded && preloaded.track?.id === track.id && restorePosition == null) {
      const oldActive = getActive();
      if(oldActive) {
        try { oldActive.pause(); oldActive.currentTime = 0; } catch {}
      }
      const newSlot = preloaded.slot;
      const newActive = getSlot(newSlot);
      preloadedRef.current = null;
      setActiveSlot(newSlot);
      if(newActive) {
        try { newActive.currentTime = 0; } catch {}
        if(autoplay) runPlay(newActive);
      }
      return;
    }

    /* cold path: load into the active slot */
    const el = getActive();
    if(!el) return;
    el.src = encodeUrl(track.url);
    el.load();
    restoreTimeRef.current = restorePosition;
    preloadedRef.current = null;
    if(autoplay) runPlay(el);
  }, [activeSlot, runPlay]); // eslint-disable-line react-hooks/exhaustive-deps

  const setOnEndedHandler = useCallback((cb) => {
    onEndedRef.current = cb;
  }, []);

  const isEventFromActive = useCallback((event) => {
    const active = getActive();
    return active && event.currentTarget === active;
  }, [activeSlot]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTimeUpdate = useCallback((event) => {
    if(!isEventFromActive(event)) return;
    const el = event.currentTarget;
    setCurrentTime(el.currentTime);
    setDuration(el.duration || 0);
  }, [isEventFromActive]);

  const handleLoadedMetadata = useCallback((event) => {
    if(!isEventFromActive(event)) return;
    if(restoreTimeRef.current != null) {
      event.currentTarget.currentTime = restoreTimeRef.current;
      restoreTimeRef.current = null;
    }
  }, [isEventFromActive]);

  const handleEnded = useCallback((event) => {
    if(!isEventFromActive(event)) return;
    setIsPlaying(false);
    if(onEndedRef.current) onEndedRef.current();
  }, [isEventFromActive]);

  const handleError = useCallback((event) => {
    if(!isEventFromActive(event)) return;
    console.error('Audio error:', event);
    setError('Error loading audio: ' + (event.target?.error?.message ?? 'unknown'));
  }, [isEventFromActive]);

  /* keep both audios in sync with volume state (covers slot swap post-mount) */
  useEffect(() => {
    if(audioARef.current) audioARef.current.volume = volume;
    if(audioBRef.current) audioBRef.current.volume = volume;
  }, [volume]);

  const value = {
    audioRef       : activeSlot === 'a' ? audioARef : audioBRef,
    audioRefs      : {a : audioARef, b : audioBRef},
    activeSlot,
    currentTrack, isPlaying, currentTime, duration, volume, error,
    play, pause, toggle, seek, setVolume, loadTrack, preloadTrack, setOnEndedHandler,
  };

  const audioProps = {
    onTimeUpdate     : handleTimeUpdate,
    onLoadedMetadata : handleLoadedMetadata,
    onEnded          : handleEnded,
    onError          : handleError,
    crossOrigin      : 'anonymous',
    preload          : 'auto',
  };

  return (
  <PlaybackContext.Provider value={value}>
      {children}
      <audio ref={audioARef} {...audioProps} />
      <audio ref={audioBRef} {...audioProps} />
    </PlaybackContext.Provider>
  );
};
