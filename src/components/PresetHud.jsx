/**
 * PresetHud — visualizer preset name, pinned to a top corner like a VJ overlay.
 *
 * The preset belongs to the visualizer layer, not to the track, so it lives
 * away from the track title / transport: top-left on mobile (top-right holds
 * the visualizer toggle), top-right on desktop (clear of the playlist name
 * field when the playlist is open).
 *
 * Modes: 'auto' flashes in for PRESET_FLASH_MS on every preset change and
 * otherwise follows the user-activity window; 'always' never hides.
 * The prev/next buttons only take taps while the user is active — a HUD
 * that is merely flashing or pinned is read-only, like the dimmed controls.
 *
 * @param {string|null} name   current preset name
 * @param {'auto'|'always'} [mode]
 * @param {boolean} active     user is interacting (InteractionProvider.isInteracting)
 * @param {() => void} onPrev
 * @param {() => void} onNext
 */
import {ChevronLeft, ChevronRight} from 'lucide-react';
import HintTooltip from './HintTooltip';
import {AppConfig} from '@/config/AppConfig';
import {SHORTCUTS} from '@/config/shortcuts';
import {useFlashOnChange} from '@/hooks/useFlashOnChange';

const PresetHud = ({name, mode = 'auto', active, onPrev, onNext}) => {
  const flashing = useFlashOnChange(name, AppConfig.PRESET_FLASH_MS);

  if(!name) return null;

  const visible = mode === 'always' || active || flashing;
  const buttonState = active ? '' : 'pointer-events-none opacity-0';

  return (
  <div
    className={`fixed left-3 top-3 z-30 flex max-w-[calc(100vw-5.5rem)] items-center gap-0.5 rounded-xl border border-white/10 bg-black/50 p-1 text-white shadow-lg backdrop-blur-md transition-all duration-500 md:left-auto md:right-5 md:top-5 md:max-w-md ${
    visible ? 'opacity-100 translate-y-0' : 'pointer-events-none -translate-y-1 opacity-0'
    }`}
  >
      <HintTooltip content={SHORTCUTS.prevPreset.label} shortcut={SHORTCUTS.prevPreset.keys} side="bottom">
        <button type="button" onClick={onPrev} className={`hud-button ${buttonState}`} aria-label={SHORTCUTS.prevPreset.label}>
          <ChevronLeft className="h-4 w-4" />
        </button>
      </HintTooltip>
      <div className="min-w-0 px-1.5 py-0.5">
        <div className="font-mono text-[10px] font-medium uppercase leading-4 tracking-[0.22em] text-white/50">
          Preset
        </div>
        <div className="line-clamp-2 break-words font-mono text-ui-xs font-medium leading-snug text-white/90">
          {name}
        </div>
      </div>
      <HintTooltip content={SHORTCUTS.nextPreset.label} shortcut={SHORTCUTS.nextPreset.keys} side="bottom">
        <button type="button" onClick={onNext} className={`hud-button ${buttonState}`} aria-label={SHORTCUTS.nextPreset.label}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </HintTooltip>
    </div>
  );
};

export default PresetHud;
