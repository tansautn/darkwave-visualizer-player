const CURRENT_VERSION = '1.0.0'; // Update this when you want to trigger a reset
const VERSION_KEY = 'app_version';
const PLAYLIST_KEY = 'playlist';

export const checkAndClearPlaylist = () => {
  const savedVersion = localStorage.getItem(VERSION_KEY);
  
  if (savedVersion !== CURRENT_VERSION) {
    console.log('New version detected. Clearing playlist.');
    localStorage.removeItem(PLAYLIST_KEY);
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    return true; // Indicates that a reset occurred
  }
  
  return false; // No reset needed
};

export const getStoredPlaylist = () => {
  const storedPlaylist = localStorage.getItem(PLAYLIST_KEY);
  if(storedPlaylist) {
    const playlist = JSON.parse(storedPlaylist);
    if(playlist.length > 0) {
      return playlist.filter(track => track.type !== 'local');
    }
  }
  return storedPlaylist ? JSON.parse(storedPlaylist) : null;
};

export const setStoredPlaylist = (playlist) => {
  localStorage.setItem(PLAYLIST_KEY, JSON.stringify(playlist));
};
