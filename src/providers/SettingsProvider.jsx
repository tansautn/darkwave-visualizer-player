/**
 * SettingsProvider — owns the persisted player settings
 * (shape + defaults in src/config/settings.js).
 *
 * Exposes via useSettings():
 *   settings                       → {ui: {...}, visualizer: {...}}
 *   updateSettings(section, patch) → shallow-merge `patch` into one section
 *   resetSettings()                → back to DEFAULT_SETTINGS
 *
 * Persistence: localStorage[AppConfig.SETTINGS_KEY], read once on mount
 * and written on every change. Other providers stay unaware of this one —
 * headless binders (e.g. VisualizerSettingsBinder) push values into them.
 */
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {AppConfig} from '@/config/AppConfig';
import {DEFAULT_SETTINGS, sanitizeSettings} from '@/config/settings';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if(!ctx) {
    throw new Error('useSettings must be used inside <SettingsProvider>');
  }
  return ctx;
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(AppConfig.SETTINGS_KEY);
    return sanitizeSettings(raw ? JSON.parse(raw) : null);
  }
  catch(e) {
    console.warn('Failed to read settings, using defaults', e);
    return sanitizeSettings(null);
  }
};

export const SettingsProvider = ({children}) => {
  const [settings, setSettings] = useState(loadSettings);

  useEffect(() => {
    try {
      localStorage.setItem(AppConfig.SETTINGS_KEY, JSON.stringify(settings));
    }
    catch(e) {
      console.warn('Failed to persist settings', e);
    }
  }, [settings]);

  const updateSettings = useCallback((section, patch) => {
    setSettings(prev => ({...prev, [section] : {...prev[section], ...patch}}));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(sanitizeSettings(DEFAULT_SETTINGS));
  }, []);

  const value = useMemo(
    () => ({settings, updateSettings, resetSettings}),
    [settings, updateSettings, resetSettings],
  );

  return (
  <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
