import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const Playlist = ({ playlists, currentPlaylist, onTrackSelect, onPlaylistChange }) => {
  return (
    <div className="mt-4">
      <div className="flex space-x-2 mb-2">
        {playlists.map((playlist, index) => (
          <Button
            key={index}
            variant={currentPlaylist === playlist ? "default" : "outline"}
            onClick={() => onPlaylistChange(playlist)}
          >
            {playlist.name}
          </Button>
        ))}
      </div>
      <ScrollArea className="h-40">
        {currentPlaylist && currentPlaylist.tracks.map((track, index) => (
          <Button
            key={index}
            variant="ghost"
            className="w-full text-left"
            onClick={() => onTrackSelect(track)}
          >
            {track.title}
          </Button>
        ))}
      </ScrollArea>
    </div>
  );
};

export default Playlist;