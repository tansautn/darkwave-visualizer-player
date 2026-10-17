/**
 * HintTooltip — readable tooltip for icon controls.
 *
 * Wraps the shadcn Tooltip parts (Root + Trigger + Content) and renders the
 * content through a Portal: the control bar fades to a few % opacity when
 * idle, and an in-tree tooltip would inherit that opacity.
 *
 * @param {React.ReactNode} content   tooltip label
 * @param {string[]} [shortcut]       key caps shown after the label, e.g. ['Shift', 'Enter']
 * @param {'top'|'right'|'bottom'|'left'} [side]
 * @param {number} [delayDuration]    ms before opening
 * @param {React.ReactElement} children  the trigger — must forward a ref (Button does)
 */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip';

const HintTooltip = ({content, shortcut, side = 'top', delayDuration = 500, children}) => (
  <Tooltip delayDuration={delayDuration}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipPrimitive.Portal>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="flex items-center gap-2 rounded-lg border-white/15 bg-zinc-950/90 px-2.5 py-1.5 font-ui text-[13px] font-medium leading-none tracking-[0.01em] text-white shadow-[0_8px_24px_rgba(0,0,0,0.55)] backdrop-blur-md"
      >
        <span>{content}</span>
        {shortcut?.length > 0 && (
          <span className="flex items-center gap-1">
            {shortcut.map(key => (
              <kbd key={key} className="kbd">{key}</kbd>
            ))}
          </span>
        )}
      </TooltipContent>
    </TooltipPrimitive.Portal>
  </Tooltip>
);

export default HintTooltip;
