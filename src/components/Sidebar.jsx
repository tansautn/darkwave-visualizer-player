import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, Music } from 'lucide-react';

const Sidebar = ({ playlist, currentTrack, onTrackSelect, onReorder }) => {
  const onDragEnd = (result) => {
    if (!result.destination) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div className="w-64 bg-black bg-opacity-50 text-white p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-4">Playlist</h2>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="playlist">
          {(provided) => (
            <ul {...provided.droppableProps} ref={provided.innerRef}>
              {playlist.map((track, index) => (
                <Draggable key={track.id} draggableId={track.id} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center p-2 mb-2 rounded ${
                        currentTrack && currentTrack.id === track.id
                          ? 'bg-blue-600 bg-opacity-50'
                          : 'bg-gray-700 bg-opacity-50'
                      } ${snapshot.isDragging ? 'opacity-50' : ''}`}
                    >
                      <div {...provided.dragHandleProps} className="mr-2 cursor-move">
                        <GripVertical size={16} />
                      </div>
                      <div
                        className="flex-grow cursor-pointer select-text"
                        onClick={() => onTrackSelect(track)}
                      >
                        {track.type === 'local' ? <Music size={16} className="inline mr-2" /> : null}
                        {track.title}
                      </div>
                    </li>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Sidebar;