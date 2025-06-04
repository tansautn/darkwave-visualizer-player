/**
 * --------------------------------------------------------------------------
 *
 * --------------------------------------------------------------------------
 * @PROJECT    : darkwave-visualizer-player
 * @AUTHOR     : Zuko <https://github.com/tansautn>
 * @LINK       : https://www.zuko.pro/
 * @FILE       : InteractionProvider.jsx

 * @CREATED    : 11:40 PM , 01/Oct/2024
 */
import React, {createContext, useContext, useEffect, useRef, useState} from 'react';

const InteractionContext = createContext({ isInteracted : false, isInteracting : false });

export const useInteraction = () => useContext(InteractionContext);

export const InteractionProvider = ({ children }) => {
  const [isInteracted, setIsInteracted] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const timeoutIds = useRef([]);
  const interactionTriggered = useRef(false); // Đảm bảo chỉ trigger một lần

  const handleInteraction = () => {
    setIsInteracting(true);

    while(timeoutIds.current.length) {
      clearTimeout(timeoutIds.current.pop());
    }

    const newTimeoutId = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);

    timeoutIds.current.push(newTimeoutId);
  };

  const handleFirstUserGesture = () => {
    if(!interactionTriggered.current) {
      setIsInteracted(true);
      interactionTriggered.current = true;
    }
  };

  useEffect(() => {
    const interactionEvents = ['click', 'mouseup', 'keyup', 'touchend']; // Chỉ những sự kiện này kích hoạt isInteracted

    interactionEvents.forEach((event) => {
      window.addEventListener(event, handleFirstUserGesture);
    });

    const interactionEventsForInteracting = [...interactionEvents, 'mousemove', 'scroll'];
    interactionEventsForInteracting.forEach((event) => {
      window.addEventListener(event, handleInteraction);
    });

    return () => {
      // Loại bỏ sự kiện
      interactionEvents.forEach((event) => {
        window.removeEventListener(event, handleFirstUserGesture);
      });

      interactionEventsForInteracting.forEach((event) => {
        window.removeEventListener(event, handleInteraction);
      });

      while(timeoutIds.current.length) {
        clearTimeout(timeoutIds.current.pop());
      }
    };
  }, []);

  return (
  <InteractionContext.Provider value={{ isInteracted, isInteracting }}>
      {children}
    </InteractionContext.Provider>
  );
};

