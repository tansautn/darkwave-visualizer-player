/**
 * PlaylistProvider — owns the ordered track list + navigation actions and
 * bridges to PlaybackProvider (loadTrack + ended handler).
 *
 * Exposes via usePlaylist():
 *   playlist, playlistName, currentIndex
 *   setPlaylistName(name)
 *   select(track), next(), prev()
 *   add(tracks), remove(id), reorder(from, to)
 *
 * Persistence:
 *   - Playlist array persisted via injected store (localStorage today).
 *   - Playback position persisted to PLAYBACK_STATE_KEY every 10 s and on
 *     unmount, restored on first playlist load through playback.loadTrack.
 */
import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import defaultPlaylist from '@/playlists/default';
import {createLocalStoragePlaylistStore, DEFAULT_PLAYLIST_ID} from '@/storage/localPlaylistStore';
import {PLAYBACK_STATE_KEY} from '@/utils/versionCheck';
import {usePlayback} from './PlaybackProvider.jsx';

const PlaylistContext = createContext(null);

export const usePlaylist = () => {
  const ctx = useContext(PlaylistContext);
  if(!ctx) {
    throw new Error('usePlaylist must be used inside <PlaylistProvider>');
  }
  return ctx;
};

export const PlaylistProvider = ({children, store: injectedStore}) => {
  const playback = usePlayback();
  const store = useMemo(() => injectedStore ?? createLocalStoragePlaylistStore(), [injectedStore]);

  const [playlist, setPlaylist] = useState([]);
  const [playlistName, setPlaylistName] = useState('Default Playlist');
  const playbackHydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);

  const currentTrackId = playback.currentTrack?.id;
  const currentIndex = useMemo(
    () => (currentTrackId ? playlist.findIndex(t => t.id === currentTrackId) : -1),
    [playlist, currentTrackId],
  );

  /* load initial playlist from the store; wipe if version bumped */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const wasReset = store.checkVersion();
      const stored = await store.load(DEFAULT_PLAYLIST_ID);
      if(cancelled) return;
      setPlaylist(wasReset || !stored ? defaultPlaylist : stored);
    })();
    return () => { cancelled = true; };
  }, [store]);

  /* persist playlist on every change */
  useEffect(() => {
    if(playlist.length > 0) {
      store.save(DEFAULT_PLAYLIST_ID, playlist);
    }
  }, [playlist, store]);

  /* hydrate current track (once) + fall back to first track if current disappears */
  useEffect(() => {
    if(playlist.length === 0) return;

    if(playbackHydratedRef.current) {
      if(!playback.currentTrack) {
        playback.loadTrack(playlist[0], {autoplay : false});
      }
      return;
    }

    let nextTrack = playlist[0];
    let restorePosition = null;
    try {
      const raw = localStorage.getItem(PLAYBACK_STATE_KEY);
      if(raw) {
        const parsed = JSON.parse(raw);
        let idx = -1;
        if(parsed?.trackId) {
          idx = playlist.findIndex(t => t.id === parsed.trackId);
        }
        if(idx === -1 && typeof parsed?.index === 'number' && parsed.index >= 0 && parsed.index < playlist.length) {
          idx = parsed.index;
        }
        if(idx >= 0) {
          nextTrack = playlist[idx];
          if(typeof parsed?.position === 'number') {
            restorePosition = parsed.position;
          }
        }
      }
    }
    catch(e) {
      console.warn('Failed to parse playback state', e);
    }

    skipNextSaveRef.current = restorePosition != null;
    playback.loadTrack(nextTrack, {autoplay : false, restorePosition});
    playbackHydratedRef.current = true;
  }, [playlist, playback]);

  const savePlaybackState = useCallback((positionOverride) => {
    if(typeof window === 'undefined' || !playback.currentTrack) return;
    const idx = playlist.findIndex(t => t.id === playback.currentTrack.id);
    if(idx === -1) return;
    const position = typeof positionOverride === 'number'
      ? positionOverride
      : (playback.audioRef.current?.currentTime ?? 0);
    try {
      localStorage.setItem(PLAYBACK_STATE_KEY, JSON.stringify({
        trackId  : playback.currentTrack.id,
        index    : idx,
        position,
      }));
    }
    catch(e) {
      console.warn('Failed to persist playback state', e);
    }
  }, [playback.currentTrack, playback.audioRef, playlist]);

  /* reset saved position when a new track becomes active (skip once on hydration) */
  useEffect(() => {
    if(!playback.currentTrack) return;
    if(skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    savePlaybackState(0);
  }, [playback.currentTrack, savePlaybackState]);

  useEffect(() => {
    if(!playback.currentTrack) return;
    const interval = setInterval(() => savePlaybackState(), 10000);
    return () => clearInterval(interval);
  }, [playback.currentTrack, savePlaybackState]);

  useEffect(() => () => savePlaybackState(), [savePlaybackState]);

  const select = useCallback((track) => {
    playback.loadTrack(track, {autoplay : true});
  }, [playback]);

  const next = useCallback(() => {
    const idx = playlist.findIndex(t => t.id === playback.currentTrack?.id);
    if(idx >= 0 && idx < playlist.length - 1) {
      select(playlist[idx + 1]);
    }
  }, [playlist, playback.currentTrack?.id, select]);

  const prev = useCallback(() => {
    const idx = playlist.findIndex(t => t.id === playback.currentTrack?.id);
    if(idx > 0) {
      select(playlist[idx - 1]);
    }
  }, [playlist, playback.currentTrack?.id, select]);

  const add = useCallback((tracks) => {
    setPlaylist(prev => [...prev, ...tracks]);
  }, []);

  const remove = useCallback((id) => {
    setPlaylist(prev => prev.filter(t => t.id !== id));
  }, []);

  const reorder = useCallback((from, to) => {
    setPlaylist(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(from, 1);
      result.splice(to, 0, removed);
      return result;
    });
  }, []);

  /* wire audio-end → next track */
  useEffect(() => {
    playback.setOnEndedHandler(() => next());
    return () => playback.setOnEndedHandler(null);
  }, [next, playback]);

  const value = {
    playlist, playlistName, currentIndex,
    setPlaylist, setPlaylistName,
    select, next, prev,
    add, remove, reorder,
  };

  return (
  <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
};
