import axios from 'axios';

export const loadSoundCloudTrack = async (url) => {
  // This is a placeholder implementation. In a real-world scenario, you'd need to use SoundCloud API
  // and handle authentication properly.
  try {
    const response = await axios.get(`https://api.soundcloud.com/resolve?url=${url}&client_id=YOUR_SOUNDCLOUD_CLIENT_ID`);
    return {
      id: `soundcloud-${response.data.id}`,
      title: response.data.title,
      url: response.data.stream_url,
      type: 'soundcloud'
    };
  } catch (error) {
    console.error("Error fetching SoundCloud track:", error);
    throw new Error("Failed to load SoundCloud track");
  }
};

export const exportPlaylistToM3U8 = (playlist, playlistName) => {
  let content = "#EXTM3U\n";
  playlist.forEach(track => {
    content += `#EXTINF:-1,${track.title}\n`;
    content += `${track.type === 'local' ? track.title : track.url}\n`;
  });

  const blob = new Blob([content], { type: 'audio/x-mpegurl' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${playlistName}.m3u8`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};