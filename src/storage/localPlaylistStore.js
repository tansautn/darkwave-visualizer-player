/**
 * PlaylistStore contract (implemented by every storage backend):
 *   checkVersion(): boolean          — returns true when a version bump wiped storage
 *   list(): Promise<PlaylistMeta[]>  — [{id, name}]
 *   load(id): Promise<Track[]|null>
 *   save(id, playlist): Promise<void>
 *   delete(id): Promise<void>
 *
 * V1 backing: browser localStorage. Only one playlist (id = 'default') is
 * supported today; multi-playlist arrives when the IndexedDB store lands.
 */
import {checkAndClearPlaylist, getStoredPlaylist, setStoredPlaylist} from '@/utils/versionCheck';

export const DEFAULT_PLAYLIST_ID = 'default';

export const createLocalStoragePlaylistStore = () => ({
  checkVersion() {
    return checkAndClearPlaylist();
  },
  async list() {
    return [{id : DEFAULT_PLAYLIST_ID, name : 'Default Playlist'}];
  },
  async load(_id = DEFAULT_PLAYLIST_ID) {
    return getStoredPlaylist();
  },
  async save(_id, playlist) {
    setStoredPlaylist(playlist);
  },
  async delete(_id) {
    setStoredPlaylist([]);
  },
});
