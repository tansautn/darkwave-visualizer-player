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
  └─ InteractionProvider   ← tracks first user gesture + activity state
       └─ TooltipProvider
            └─ BrowserRouter → <Index> → <MusicPlayer>
```

### Core components

| Component | Role |
|---|---|
| `MusicPlayer.jsx` | All player state (playlist, currentTrack, isPlaying, progress). Owns the `<audio>` element via `audioRef`. |
| `Visualizer.jsx` | Full-screen butterchurn WebGL canvas. Receives `audioRef` and connects to Web Audio API after first user gesture. Exposes `nextPreset`/`prevPreset` via `useImperativeHandle`. |
| `Sidebar.jsx` | Playlist panel with react-beautiful-dnd drag-and-drop reordering. |
| `WelcomeScreen.jsx` | Looping video background shown before first user interaction. |
| `TypingIntro.jsx` | Typing animation overlay shown after first interaction, before playback starts. |
| `InteractionProvider.jsx` | `isInteracted` (one-time first gesture, triggers autoplay + visualizer init) vs `isInteracting` (activity within 3 s window, drives overlay opacity). |

### Data flow: playlist & playback persistence

1. On mount, `checkAndClearPlaylist()` compares `CURRENT_VERSION` (from `src/playlists/default.js`) against `localStorage['app_version']`. Mismatch → wipes `localStorage['playlist']` and reloads the bundled default playlist.
2. `CURRENT_VERSION` equals `BUILD_TIMESTAMP` (injected by vite at prod build via `define`), `VITE_PLAYLIST_VERSION` env var, or the hardcoded fallback `'1.2.5'`. **Bump the fallback or env var when you want to force a playlist reset for users.**
3. `localStorage['darkwave-playback-state']` stores `{trackId, index, position}` and is restored on load via `restoreTimeRef`. Saved every 10 s and on unmount.
4. Local file uploads (`type: 'local'`) are stripped from the restored playlist on next load (blob URLs don't survive page reload).

### Audio URL encoding

Track URLs in `default.js` may contain non-ASCII characters (Vietnamese filenames). `encodeUrl()` in `src/utils/urlUtils.js` percent-encodes only the path segments after the hostname. Always use `encodeUrl(track.url)` when setting `audio.src`.

### Visualizer lifecycle

The butterchurn visualizer requires `AudioContext`, which browsers block until a user gesture. `Visualizer.jsx` polls `isInteracted` (100 ms interval) before creating the `AudioContext`. The audio element must have `crossOrigin="anonymous"` for `createMediaElementSource` to work across origins.

Preset auto-cycles every 18 s (`PRESET_CHANGE_DELAY`). Arrow keys (`←`/`→`) cycle presets manually; `↑`/`↓` change tracks; `Space` toggles play.

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
