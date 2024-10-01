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
import React, {createContext, useContext, useState, useEffect} from 'react';

const InteractionContext = createContext();

export const useInteraction = () => useContext(InteractionContext);

export const InteractionProvider = ({ children }) => {
  const [ isInteracted, setIsInteracted ] = useState(false);
  const [ isInteracting, setIsInteracting ] = useState(false);
  const [ timeoutId, setTimeoutId ] = useState(null);

  const handleInteraction = () => {
    setIsInteracted(true);
    setIsInteracting(true);

    if(timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);

    setTimeoutId(newTimeoutId);
  };

  useEffect(() => {
    const interactionEvents = [ 'mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove' ];

    interactionEvents.forEach(event => {
      window.addEventListener(event, handleInteraction);
    });

    return () => {
      interactionEvents.forEach(event => {
        window.removeEventListener(event, handleInteraction);
      });
      if(timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
  <InteractionContext.Provider value={{ isInteracted, isInteracting }}>
      {children}
    </InteractionContext.Provider>
  );
};
