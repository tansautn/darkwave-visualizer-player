import {useEffect, useState} from 'react';

/**
 * true for `durationMs` after `value` changes to a non-null value.
 * State is adjusted during render (no extra effect pass); the effect only
 * owns the timer, and a new value restarts it.
 */
export const useFlashOnChange = (value, durationMs) => {
  const [seen, setSeen] = useState(value);
  const [flashing, setFlashing] = useState(false);

  if(value !== seen) {
    setSeen(value);
    setFlashing(value != null);
  }

  useEffect(() => {
    if(!flashing) return;
    const timeout = setTimeout(() => setFlashing(false), durationMs);
    return () => clearTimeout(timeout);
  }, [flashing, seen, durationMs]);

  return flashing;
};
