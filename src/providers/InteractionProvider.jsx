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
/*
 * Exposes via useInteraction():
 *   isInteracted   one-time first gesture (unlocks autoplay + AudioContext)
 *   isInteracting  input within the last IDLE_TIMEOUT_MS → controls undimmed
 *   isTapGuarded   tap guard is up: from TAP_GUARD_LEAD_MS before the dim
 *                  until TAP_GUARD_RELEASE_MS after the next input. While up,
 *                  the first tap on dimmed controls only wakes them.
 */
import React, {createContext, useContext, useEffect, useRef, useState} from 'react';
import {AppConfig} from '@/config/AppConfig';

const InteractionContext = createContext({ isInteracted : false, isInteracting : false, isTapGuarded : false });

export const useInteraction = () => useContext(InteractionContext);

export const InteractionProvider = ({ children }) => {
  const [isInteracted, setIsInteracted] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isTapGuarded, setIsTapGuarded] = useState(false);
  const timeoutIds = useRef([]);
  const tapGuardRef = useRef(false);
  const guardReleaseId = useRef(null);
  const interactionTriggered = useRef(false); // Đảm bảo chỉ trigger một lần

  const handleInteraction = () => {
    setIsInteracting(true);

    while(timeoutIds.current.length) {
      clearTimeout(timeoutIds.current.pop());
    }

    // Tap đánh thức UI: giữ guard thêm một chút để chính cú tap đó
    // (touchend → mousedown → click) không rơi xuống control bên dưới.
    // Chỉ hẹn một lần — event tiếp theo trong cùng cú tap không đẩy lùi.
    if(tapGuardRef.current && !guardReleaseId.current) {
      guardReleaseId.current = setTimeout(() => {
        guardReleaseId.current = null;
        tapGuardRef.current = false;
        setIsTapGuarded(false);
      }, AppConfig.TAP_GUARD_RELEASE_MS);
    }

    timeoutIds.current.push(setTimeout(() => {
      tapGuardRef.current = true;
      setIsTapGuarded(true);
    }, AppConfig.IDLE_TIMEOUT_MS - AppConfig.TAP_GUARD_LEAD_MS));

    timeoutIds.current.push(setTimeout(() => {
      setIsInteracting(false);
    }, AppConfig.IDLE_TIMEOUT_MS));
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
      clearTimeout(guardReleaseId.current);
    };
  }, []);

  return (
  <InteractionContext.Provider value={{ isInteracted, isInteracting, isTapGuarded }}>
      {children}
    </InteractionContext.Provider>
  );
};

