/**
 * SettingsDialog — player settings modal (open with the gear button or `,`).
 *
 * Display / Visualizer values are persisted through SettingsProvider; the
 * visualizer on/off switch and the preset buttons act on VisualizerProvider
 * directly (session state, same as the control bar buttons).
 *
 * The content carries the `dark` class so the vendored shadcn primitives
 * (Switch, Slider, Tabs, ToggleGroup) resolve their dark theme tokens.
 */
import {ChevronLeft, ChevronRight, Shuffle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Label} from '@/components/ui/label';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {ToggleGroup, ToggleGroupItem} from '@/components/ui/toggle-group';
import {SHORTCUTS} from '@/config/shortcuts';
import {CURRENT_VERSION} from '@/playlists/default';
import {useSettings} from '@/providers/SettingsProvider.jsx';
import {useVisualizer} from '@/providers/VisualizerProvider.jsx';

const TEXT_SIZE_OPTIONS = [
  {value : 'sm', label : 'Small',  className : 'text-[11px]'},
  {value : 'md', label : 'Medium', className : 'text-[13px]'},
  {value : 'lg', label : 'Large',  className : 'text-[15px]'},
];

const FPS_OPTIONS = [
  {value : '0',  label : 'Uncapped', short : 'Max'},
  {value : '60', label : '60 fps',   short : '60'},
  {value : '30', label : '30 fps',   short : '30'},
];

const percent = (v) => `${Math.round(v * 100)}%`;
const seconds = (digits) => (v) => `${v.toFixed(digits)} s`;

/* BUILD_TIMESTAMP is epoch ms in production builds; anything else is a plain version string */
const formatBuild = (version) => (
  /^\d{12,}$/.test(String(version))
    ? new Date(Number(version)).toISOString().slice(0, 16).replace('T', ' ')
    : `v${version}`
);

const Section = ({title, children}) => (
  <section className="pt-3 first:pt-0">
    <h3 className="pb-1 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">{title}</h3>
    <div className="divide-y divide-white/[0.06]">{children}</div>
  </section>
);

const RowText = ({id, label, hint}) => (
  <div className="min-w-0">
    <Label htmlFor={id} className="text-sm font-medium leading-5 text-zinc-100">{label}</Label>
    {hint && <p className="mt-0.5 text-[13px] leading-snug text-zinc-400">{hint}</p>}
  </div>
);

const SwitchRow = ({id, label, hint, checked, onCheckedChange}) => (
  <div className="flex items-center justify-between gap-6 py-3">
    <RowText id={id} label={label} hint={hint} />
    <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

const SliderRow = ({label, hint, value, format, min, max, step, disabled, onChange}) => (
  <div className={`py-3 transition-opacity ${disabled ? 'opacity-40' : ''}`}>
    <div className="flex items-baseline justify-between gap-4">
      <RowText label={label} hint={hint} />
      <output className="shrink-0 font-mono text-xs tabular-nums text-zinc-300">{format(value)}</output>
    </div>
    <Slider
      className="mt-3"
      value={[value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={([v]) => onChange(v)}
    />
  </div>
);

const ChoiceRow = ({label, hint, value, options, onChange}) => (
  <div className="flex items-center justify-between gap-6 py-3">
    <RowText label={label} hint={hint} />
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(v) => v && onChange(v)}
      className="shrink-0"
    >
      {options.map(option => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className={`min-w-9 px-2.5 font-mono data-[state=on]:bg-zinc-100 data-[state=on]:text-zinc-950 ${option.className ?? 'text-xs'}`}
        >
          {option.short ?? 'A'}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  </div>
);

const SettingsDialog = ({open, onOpenChange}) => {
  const {settings, updateSettings, resetSettings} = useSettings();
  const {enabled, ready, currentPresetName, controls} = useVisualizer();
  const {ui, visualizer} = settings;

  const setUi = (patch) => updateSettings('ui', patch);
  const setVisualizer = (patch) => updateSettings('visualizer', patch);

  return (
  <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="dark max-w-[34rem] gap-0 overflow-hidden border-white/10 bg-zinc-950/90 p-0 font-ui text-zinc-100 shadow-[0_24px_64px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:rounded-2xl">
        <DialogHeader className="border-b border-white/10 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-lg font-bold tracking-tight">Player settings</DialogTitle>
          <DialogDescription className="text-[13px] text-zinc-400">
            Typography, controls and visualizer behaviour. Saved on this device.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="display" className="flex min-h-0 flex-col">
          <TabsList className="mx-6 mt-4 grid grid-cols-3 bg-white/[0.06]">
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="visualizer">Visualizer</TabsTrigger>
            <TabsTrigger value="shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          <div className="max-h-[min(60vh,32rem)] overflow-y-auto px-6 pb-2 pt-4">
            <TabsContent value="display" className="mt-0">
              <Section title="Typography">
                <ChoiceRow
                  label="Text size"
                  hint="Track title, time, intro and preset name."
                  value={ui.textScale}
                  options={TEXT_SIZE_OPTIONS}
                  onChange={(textScale) => setUi({textScale})}
                />
                <SwitchRow
                  id="setting-title-effects"
                  label="Animated title"
                  hint="Neon gradient + disco mosaic on “Zuko”. Off = flat white, lighter on battery."
                  checked={ui.titleEffects}
                  onCheckedChange={(titleEffects) => setUi({titleEffects})}
                />
                <SwitchRow
                  id="setting-show-remaining"
                  label="Show remaining time"
                  hint="Right-hand time counts down. Click the time to switch."
                  checked={ui.showRemaining}
                  onCheckedChange={(showRemaining) => setUi({showRemaining})}
                />
              </Section>

              <Section title="Controls">
                <SwitchRow
                  id="setting-controls-backdrop"
                  label="Backdrop behind controls"
                  hint="Dark gradient so text stays readable on bright presets."
                  checked={ui.controlsBackdrop}
                  onCheckedChange={(controlsBackdrop) => setUi({controlsBackdrop})}
                />
                <SliderRow
                  label="Opacity while active"
                  value={ui.activeOpacity}
                  format={percent}
                  min={0.4}
                  max={1}
                  step={0.05}
                  onChange={(activeOpacity) => setUi({activeOpacity})}
                />
                <SliderRow
                  label="Opacity when idle"
                  hint="After 3 s without mouse, touch or keyboard input."
                  value={ui.idleOpacity}
                  format={percent}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(idleOpacity) => setUi({idleOpacity})}
                />
              </Section>

              <Section title="Overlays">
                <SwitchRow
                  id="setting-show-preset"
                  label="Show preset name"
                  hint="Top-left corner, flashes on every preset change."
                  checked={ui.showPresetName}
                  onCheckedChange={(showPresetName) => setUi({showPresetName})}
                />
                <SwitchRow
                  id="setting-show-intro"
                  label="Play intro on startup"
                  hint="Applies from the next visit."
                  checked={ui.showIntro}
                  onCheckedChange={(showIntro) => setUi({showIntro})}
                />
              </Section>
            </TabsContent>

            <TabsContent value="visualizer" className="mt-0">
              <div className="mb-3 flex items-center gap-1 rounded-xl border border-white/10 bg-white/[0.03] py-2 pl-3 pr-1">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-zinc-500">Now rendering</div>
                  <div className="line-clamp-2 break-words font-mono text-[13px] leading-snug text-zinc-100">
                    {currentPresetName ?? (ready ? '—' : 'Starts after the first click')}
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={controls.prevPreset} aria-label={SHORTCUTS.prevPreset.label}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={controls.randomPreset} aria-label="Random preset">
                  <Shuffle className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={controls.nextPreset} aria-label={SHORTCUTS.nextPreset.label}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Section title="Renderer">
                <SwitchRow
                  id="setting-visualizer-enabled"
                  label="Visualizer"
                  hint="Off pauses rendering; audio keeps playing."
                  checked={enabled}
                  onCheckedChange={(value) => controls.setEnabled(value)}
                />
                <ChoiceRow
                  label="Frame-rate cap"
                  hint="Lower caps save GPU and battery."
                  value={String(visualizer.targetFps)}
                  options={FPS_OPTIONS}
                  onChange={(v) => setVisualizer({targetFps : Number(v)})}
                />
              </Section>

              <Section title="Presets">
                <SwitchRow
                  id="setting-auto-cycle"
                  label="Auto-cycle presets"
                  checked={visualizer.autoCycle}
                  onCheckedChange={(autoCycle) => setVisualizer({autoCycle})}
                />
                <SliderRow
                  label="Cycle interval"
                  value={visualizer.cycleInterval / 1000}
                  format={seconds(0)}
                  min={5}
                  max={120}
                  step={1}
                  disabled={!visualizer.autoCycle}
                  onChange={(v) => setVisualizer({cycleInterval : v * 1000})}
                />
                <SwitchRow
                  id="setting-shuffle"
                  label="Shuffle"
                  hint="Pick the next preset at random."
                  checked={visualizer.shufflePresets}
                  onCheckedChange={(shufflePresets) => setVisualizer({shufflePresets})}
                />
                <SliderRow
                  label="Blend time"
                  hint="Cross-fade length between presets."
                  value={visualizer.blendTime}
                  format={seconds(1)}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={(blendTime) => setVisualizer({blendTime})}
                />
              </Section>
            </TabsContent>

            <TabsContent value="shortcuts" className="mt-0">
              <dl className="divide-y divide-white/[0.06]">
                {Object.values(SHORTCUTS).map(({keys, label}) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                    <dt className="text-sm text-zinc-200">{label}</dt>
                    <dd className="flex shrink-0 items-center gap-1">
                      {keys.map(key => <kbd key={key} className="kbd">{key}</kbd>)}
                    </dd>
                  </div>
                ))}
              </dl>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-3">
          <span className="font-mono text-[11px] text-zinc-500">build {formatBuild(CURRENT_VERSION)}</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetSettings} className="text-zinc-300">
              Reset to defaults
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
