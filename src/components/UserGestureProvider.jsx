import React, { createContext, useState, useContext, useEffect } from 'react';

const UserGestureContext = createContext();

export const useUserGestureContext = () => useContext(UserGestureContext);

export const UserGestureProvider = ({ children }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const handleActivity = () => {
      setIsActive(true);
      clearTimeout(window.inactivityTimer);
      window.inactivityTimer = setTimeout(() => setIsActive(false), 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(window.inactivityTimer);
    };
  }, []);

  return (
    <UserGestureContext.Provider value={{ isActive, setIsActive }}>
      {children}
    </UserGestureContext.Provider>
  );
};