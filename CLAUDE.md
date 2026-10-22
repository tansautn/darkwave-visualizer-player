# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # dev server at http://localhost:8088
npm run build        # production build (no sourcemaps, injects BUILD_TIMESTAMP)
npm run build:dev    # watch build with sourcemaps (mode=development)
npm run lint         # ESLint, zero warnings allowed
npm run reformat     # ESLint --fix
npm run preview      # preview production build
```

No test suite exists. Verify features manually in the browser.

## Code Discovery

Use `codebase-memory-mcp` tools for navigating this project:
- `search_graph(query=...)` — find functions/components by name or concept
- `get_code_snippet(qualified_name)` — read a specific function without opening the whole file
- `trace_path(name, mode=calls)` — follow call chains
- Fall back to Grep/Read only for config values or non-code files.

## Architecture

Single-page Vite + React 18 app. **One route (`/`), one page component (`Index`), one primary stateful component (`MusicPlayer`).**

### Provider tree (App.jsx)
```
QueryClientProvider
  └─ SettingsProvider        ← persisted player settings (localStorage['darkwave-settings'])
       └─ InteractionProvider   ← tracks first user gesture + activity state
            └─ PlaybackProvider → PlaylistProvider → VisualizerProvider
                 └─ TooltipProvider
                      ├─ MediaSessionBinder, VisualizerSettingsBinder   (headless)
                      └─ BrowserRouter → <Index> → <MusicPlayer>
```
See `docs/architect/` for the provider internals.

### Core components

| Component | Role |
|---|---|
| `MusicPlayer.jsx` | All player state (playlist, currentTrack, isPlaying, progress). Owns the `<audio>` element via `audioRef`. |
| `Visualizer.jsx` | Full-screen butterchurn WebGL canvas. Receives `audioRef` and connects to Web Audio API after first user gesture. Exposes `nextPreset`/`prevPreset` via `useImperativeHandle`. |
| `Sidebar.jsx` | Playlist panel with react-beautiful-dnd drag-and-drop reordering. |
| `WelcomeScreen.jsx` | Looping video background shown before first user interaction. |
| `TypingIntro.jsx` | Typing animation overlay shown after first interaction, before playback starts. |
| `InteractionProvider.jsx` | `isInteracted` (one-time first gesture, triggers autoplay + visualizer init) vs `isInteracting` (activity within `IDLE_TIMEOUT_MS`, drives overlay opacity) vs `isTapGuarded` (up from `TAP_GUARD_LEAD_MS` before the dim until `TAP_GUARD_RELEASE_MS` after the next input — MusicPlayer covers the controls with a transparent div while it is up, so the first tap on dimmed controls only wakes them). Timings in `src/config/AppConfig.js`. |
| `TrackTitle.jsx` | Song title as inline SVG (outline + shadow layers, "Zuko" in the disco mosaic). viewBox fitted to measured text; long titles ping-pong scroll. CSS in the `.track-title*` block of `src/index.css`. |
| `PresetHud.jsx` | Preset name overlay (top-left mobile / top-right desktop). Mode `auto` flashes on change and follows `isInteracting`; `always` never hides. Prev/next buttons only take taps while interacting. |
| `SettingsDialog.jsx` | Settings modal (gear button or `,`). Display + Visualizer + Shortcuts tabs. |
| `HintTooltip.jsx` | The tooltip to use for controls — portals out of the dimmed control bar, optional key caps. Don't use the raw shadcn `Tooltip` root directly. |
| `SettingsProvider.jsx` | `useSettings()` → `{settings, updateSettings(section, patch), resetSettings}`. Shape/defaults in `src/config/settings.js`; stored values are sanitized against the defaults, so new fields need no migration. |

### Data flow: playlist & playback persistence

1. On mount, `checkAndClearPlaylist()` compares `CURRENT_VERSION` (from `src/playlists/default.js`) against `localStorage['app_version']`. Mismatch → wipes `localStorage['playlist']` and reloads the bundled default playlist.
2. `CURRENT_VERSION` equals `BUILD_TIMESTAMP` (injected by vite at prod build via `define`), `VITE_PLAYLIST_VERSION` env var, or the hardcoded fallback `'1.2.5'`. **Bump the fallback or env var when you want to force a playlist reset for users.**
3. `localStorage['darkwave-playback-state']` stores `{trackId, index, position}` and is restored on load via `restoreTimeRef`. Saved every 10 s and on unmount.
4. Local file uploads (`type: 'local'`) are stripped from the restored playlist on next load (blob URLs don't survive page reload).

### Audio URL encoding

Track URLs in `default.js` may contain non-ASCII characters (Vietnamese filenames). `encodeUrl()` in `src/utils/urlUtils.js` percent-encodes only the path segments after the hostname. Always use `encodeUrl(track.url)` when setting `audio.src`.

### Visualizer lifecycle

The butterchurn visualizer requires `AudioContext`, which browsers block until a user gesture. `Visualizer.jsx` polls `isInteracted` (100 ms interval) before creating the `AudioContext`. The audio element must have `crossOrigin="anonymous"` for `createMediaElementSource` to work across origins.

Preset auto-cycles every 18 s by default. `autoCycle`, `cycleInterval`, `blendTime`, `targetFps` are runtime options of VisualizerProvider (`controls.setOptions`) — changing them never re-inits the backend. `VisualizerSettingsBinder` pushes the persisted Settings values into them.

Hot keys (handler in `MusicPlayer.jsx`, display labels in `src/config/shortcuts.js` — keep both in sync): `←`/`→` presets, `↑`/`↓` tracks, `Space` play, `Enter` / `Shift+Enter` add track, `,` settings. They are ignored while the settings dialog is open or when focus is in an input / slider.

### Typography

- Fonts are self-hosted via `@fontsource/be-vietnam-pro` (`font-ui`, Vietnamese-first sans) and `@fontsource/roboto-mono` (`font-mono`), imported in `src/main.jsx`.
- Player text uses the `text-ui-*` sizes from `tailwind.config.js`; they multiply by the `--ui-scale` CSS var that MusicPlayer sets from Settings → Text size.
- Small text drawn straight over the visualizer gets `.text-halo` (`src/index.css`).
- The page declares itself dark (`<meta name="color-scheme" content="dark">` + `html { color-scheme: dark }`) and carries `<meta name="darkreader-lock">` in `index.html`. Keep both: Dark Reader's dynamic mode otherwise turns the see-through `bg-black/5` bars opaque and inverts the SVG title's light gradient (seen in Firefox).
- Dimming is applied per region in MusicPlayer (scrim, playlist, title, transport rows), not on the whole control container — that is what lets Settings → Track title stay lit (`always`, or `TITLE_FLASH_MS` after a track change) while the rest dims. `useFlashOnChange` (`src/hooks/`) drives both the title and preset flashes.

### shadcn/ui components

`src/components/ui/` is a shadcn/ui component library. Treat these files as vendored — add new ones via `npx shadcn-ui@latest add <component>`, don't hand-edit them.

### src/dev/ — ignore

`src/dev/` contains React Buddy IDE toolbox previews. Do not modify or reference these files.

## Path aliases

| Alias | Resolves to |
|---|---|
| `@` | `./src` |
| `lib` | `./lib` |

## Adding tracks to the default playlist

Edit `src/playlists/default.js`. Entries can be plain URL strings or `{title, url}` objects. `createPlaylistFromArray` normalises them and infers `type: 'remote' | 'local'` from the URL prefix.
