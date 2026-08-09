/**
 * MediaSessionBinder — headless. Wires the browser's Media Session API to
 * Playback + Playlist so lockscreen / notification / Bluetooth / OS media
 * key controls work, and so `audio.play()` from a `nexttrack` handler runs
 * inside a user-gesture-equivalent context (this is the fix for the mobile
 * "screen off → track ends → next track never plays" bug).
 *
 * Renders nothing. Registers on mount, unregisters on unmount.
 */
import {useEffect} from 'react';
import {usePlayback} from '@/providers/PlaybackProvider.jsx';
import {usePlaylist} from '@/providers/PlaylistProvider.jsx';

const ARTWORK = [
  {src : '/og-image.png',              sizes : '512x512', type : 'image/png'},
  {src : '/zuko_disco_centered.svg',   sizes : 'any',     type : 'image/svg+xml'},
];

const hasMediaSession = () =>
  typeof navigator !== 'undefined' && 'mediaSession' in navigator;

const safeSetActionHandler = (name, handler) => {
  try { navigator.mediaSession.setActionHandler(name, handler); }
  catch { /* action not supported in this browser — ignore */ }
};

export const MediaSessionBinder = () => {
  const {currentTrack, isPlaying, currentTime, duration, audioRef, play, pause, seek} = usePlayback();
  const {playlistName, next, prev} = usePlaylist();

  /* metadata (title / artist / album / artwork) */
  useEffect(() => {
    if(!hasMediaSession() || !currentTrack) return;
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title   : currentTrack.title,
        artist  : 'Z U K O',
        album   : playlistName || 'Darkwave',
        artwork : ARTWORK,
      });
    }
    catch(e) {
      console.warn('MediaSession metadata set failed', e);
    }
  }, [currentTrack, playlistName]);

  /* playback state — feeds the play/pause UI in notifications */
  useEffect(() => {
    if(!hasMediaSession()) return;
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }, [isPlaying]);

  /* action handlers — MUST be registered for the OS to render the buttons.
     `nexttrack` running here is what lets the following `play()` avoid the
     autoplay block on mobile browsers when the screen is off. */
  useEffect(() => {
    if(!hasMediaSession()) return;
    const handlers = {
      play          : () => play(),
      pause         : () => pause(),
      previoustrack : () => prev(),
      nexttrack     : () => next(),
      stop          : () => pause(),
      seekto        : (d) => {
        if(d && Number.isFinite(d.seekTime)) seek(d.seekTime);
      },
      seekbackward  : (d) => {
        const cur = audioRef.current?.currentTime ?? 0;
        const step = d?.seekOffset || 10;
        seek(Math.max(0, cur - step));
      },
      seekforward   : (d) => {
        const cur = audioRef.current?.currentTime ?? 0;
        const step = d?.seekOffset || 10;
        seek(cur + step);
      },
    };
    for(const [name, handler] of Object.entries(handlers)) {
      safeSetActionHandler(name, handler);
    }
    return () => {
      for(const name of Object.keys(handlers)) {
        safeSetActionHandler(name, null);
      }
    };
  }, [play, pause, seek, next, prev, audioRef]);

  /* position state — drives the scrubber on the OS lockscreen */
  useEffect(() => {
    if(!hasMediaSession() || typeof navigator.mediaSession.setPositionState !== 'function') return;
    if(!Number.isFinite(duration) || duration <= 0) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position     : Math.min(Math.max(currentTime, 0), duration),
        playbackRate : 1,
      });
    }
    catch { /* older browsers throw on invalid ranges — ignore */ }
  }, [currentTime, duration]);

  return null;
};

export default MediaSessionBinder;
