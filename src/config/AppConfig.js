export const AppConfig = Object.freeze({
  PLAYLIST_AUTO_SHOW_DELAY : 2000, // ms after TypingIntro completes before auto-opening playlist
  UI_STATE_KEY             : 'darkwave-ui-state',
  SETTINGS_KEY             : 'darkwave-settings',
  IDLE_TIMEOUT_MS          : 3000, // no input for this long → isInteracting = false → controls dim
  TAP_GUARD_LEAD_MS        : 200,  // tap guard goes up this long before the controls dim
  TAP_GUARD_RELEASE_MS     : 50,   // guard outlives the tap that lifted it, so that tap can't reach a control
  PRESET_FLASH_MS          : 4000, // preset HUD stays visible after a preset change (Auto mode)
  TITLE_FLASH_MS           : 5000, // track title stays visible after a track change ("On change" mode)
});
