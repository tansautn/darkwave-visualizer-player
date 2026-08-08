/**
 * PlaybackProvider — owns the <audio> element and low-level playback state.
 *
 * Exposes via usePlayback():
 *   audioRef, currentTrack, isPlaying, currentTime, duration, volume, error
 *   play(), pause(), toggle(), seek(t), setVolume(v)
 *   loadTrack(track, { autoplay, restorePosition })
 *   setOnEndedHandler(cb) — single-slot callback fired when the track ends
 */
import React, {createContext, useCallback, useContext, useRef, useState} from 'react';
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
  const audioRef = useRef(null);
  const restoreTimeRef = useRef(null);
  const onEndedRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [error, setError] = useState(null);

  const play = useCallback(() => {
    const el = audioRef.current;
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

  const pause = useCallback(() => {
    const el = audioRef.current;
    if(!el) return;
    el.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if(!currentTrack) {
      setError('No track selected');
      return;
    }
    setError(null);
    if(isPlaying) pause(); else play();
  }, [currentTrack, isPlaying, play, pause]);

  const seek = useCallback((time) => {
    const el = audioRef.current;
    if(el && Number.isFinite(time)) {
      el.currentTime = time;
    }
  }, []);

  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if(audioRef.current) {
      audioRef.current.volume = v;
    }
  }, []);

  /**
   * Load a track into the audio element.
   * @param {object} track
   * @param {{autoplay?: boolean, restorePosition?: number|null}} opts
   */
  const loadTrack = useCallback((track, opts = {}) => {
    const {autoplay = true, restorePosition = null} = opts;
    setCurrentTrack(track);
    setError(null);
    const el = audioRef.current;
    if(!el || !track) return;
    el.src = encodeUrl(track.url);
    el.load();
    restoreTimeRef.current = restorePosition;
    if(autoplay) {
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
    }
  }, []);

  const setOnEndedHandler = useCallback((cb) => {
    onEndedRef.current = cb;
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if(!el) return;
    setCurrentTime(el.currentTime);
    setDuration(el.duration || 0);
  }, []);

  const handleLoadedMetadata = useCallback((event) => {
    if(restoreTimeRef.current != null) {
      event.currentTarget.currentTime = restoreTimeRef.current;
      restoreTimeRef.current = null;
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if(onEndedRef.current) onEndedRef.current();
  }, []);

  const handleError = useCallback((e) => {
    console.error('Audio error:', e);
    setError('Error loading audio: ' + (e.target?.error?.message ?? 'unknown'));
  }, []);

  const value = {
    audioRef,
    currentTrack, isPlaying, currentTime, duration, volume, error,
    play, pause, toggle, seek, setVolume, loadTrack, setOnEndedHandler,
  };

  return (
  <PlaybackContext.Provider value={value}>
      {children}
      <audio
      ref={audioRef}
      onTimeUpdate={handleTimeUpdate}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
      onError={handleError}
      crossOrigin="anonymous"
      />
    </PlaybackContext.Provider>
  );
};
