/**
 * TrackTitle — the current song title rendered as inline SVG, in the same
 * visual language as /zuko_disco_centered.svg: shadow → outline → fill →
 * neon rim layers, with every "Zuko" filled by the disco mosaic.
 *
 * Why SVG: a stroked copy under the fill gives a real outline (think ASS
 * subtitle `\bord` + `\shad`) that stays legible over any visualizer frame;
 * CSS text-shadow only approximates that.
 *
 * Sizing: glyphs are laid out at FONT_SIZE user units, the viewBox is fitted
 * to the measured text bbox, and CSS decides the on-screen height
 * (`--title-h`, scaled by `--ui-scale`). Titles wider than the container
 * ping-pong scroll Winamp-style; with prefers-reduced-motion they shrink to
 * fit instead. All rules live in the `.track-title*` block of src/index.css.
 *
 * @param {string} [title]
 * @param {boolean} [effects]  animated gradient + mosaic; false = flat white fill
 * @param {string} [className]
 */
import {useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {tokenizeTitle} from '@/utils/titleTokens';

const FONT_SIZE = 100;        // user units — on-screen size comes from CSS height
const PAD = 16;               // viewBox padding: room for outline stroke + shadow offset
const EDGE_FADE_PX = 24;      // marquee edge fade width (mask + strip padding)
const MARQUEE_SPEED = 40;     // px per second while scrolling
const MARQUEE_TRAVEL = 0.76;  // share of one leg spent moving — matches trackTitleMarquee keyframes
const MARQUEE_MIN_S = 6;

/* one <tspan> per token; omitted fills inherit from the parent <text> */
const TitleTokens = ({tokens, textFill, zukoFill}) => tokens.map((token, i) => (
  <tspan key={i} fill={token.isZuko ? zukoFill : textFill}>
    {token.isZuko ? 'Zuko' : token.text}
  </tspan>
));

const TrackTitle = ({title = '', effects = true, className = ''}) => {
  const uid = useId().replace(/:/g, '');
  const ids = {
    fill    : `${uid}-fill`,
    edge    : `${uid}-edge`,
    rainbow : `${uid}-rainbow`,
    tiles   : `${uid}-tiles`,
  };

  const viewportRef = useRef(null);
  const svgRef = useRef(null);
  const measureRef = useRef(null);
  const [box, setBox] = useState(null);  // fitted viewBox {x, y, w, h}
  const [shift, setShift] = useState(0); // px the strip travels; 0 = title fits

  const tokens = useMemo(() => tokenizeTitle(title), [title]);

  const measure = useCallback(() => {
    const text = measureRef.current;
    if(!text) return;
    let bb;
    try { bb = text.getBBox(); }
    catch { return; } // not rendered yet
    if(!bb.width) return;
    const next = {x : bb.x - PAD, y : bb.y - PAD, w : bb.width + PAD * 2, h : bb.height + PAD * 2};
    setBox(prev => (
      prev && Math.abs(prev.w - next.w) < 0.5 && Math.abs(prev.h - next.h) < 0.5
      && Math.abs(prev.x - next.x) < 0.5 && Math.abs(prev.y - next.y) < 0.5
        ? prev
        : next
    ));
  }, []);

  const measureOverflow = useCallback(() => {
    const viewport = viewportRef.current;
    const svg = svgRef.current;
    if(!viewport || !svg) return;
    const overflow = svg.getBoundingClientRect().width - viewport.clientWidth;
    const next = overflow > 1 ? Math.ceil(overflow + EDGE_FADE_PX * 2) : 0;
    setShift(prev => (Math.abs(prev - next) < 1 ? prev : next));
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [title, measure]);

  useLayoutEffect(() => {
    measureOverflow();
  }, [box, measureOverflow]);

  /* web font swaps in after first paint → glyph widths change → re-fit */
  useEffect(() => {
    const fonts = typeof document !== 'undefined' ? document.fonts : null;
    if(!fonts) return;
    fonts.ready.then(measure);
    fonts.addEventListener?.('loadingdone', measure);
    return () => fonts.removeEventListener?.('loadingdone', measure);
  }, [measure]);

  /* container width or --title-h (text size setting, breakpoint) changed.
     `title` re-keys the strip, so the observed <svg> node is new. */
  useEffect(() => {
    if(typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measureOverflow());
    if(viewportRef.current) observer.observe(viewportRef.current);
    if(svgRef.current) observer.observe(svgRef.current);
    return () => observer.disconnect();
  }, [title, measureOverflow]);

  const marquee = shift > 0;
  const viewBox = box
    ? `${box.x} ${box.y} ${box.w} ${box.h}`
    : `0 ${-FONT_SIZE} ${FONT_SIZE * 8} ${FONT_SIZE * 1.4}`;
  const ratio = box ? box.w / box.h : 8;
  const duration = Math.max(MARQUEE_MIN_S, shift / MARQUEE_SPEED / MARQUEE_TRAVEL);

  return (
  <div
    ref={viewportRef}
    className={`track-title ${marquee ? 'track-title--marquee' : ''} ${className}`}
    style={{
      '--title-fade'     : `${EDGE_FADE_PX}px`,
      '--title-shift'    : `${-shift}px`,
      '--title-duration' : `${duration.toFixed(2)}s`,
    }}
  >
      <div className="track-title__strip" key={title}>
        <svg
          ref={svgRef}
          className={`track-title__svg ${effects ? 'track-title__svg--fx' : ''}`}
          viewBox={viewBox}
          role="img"
          aria-label={title || undefined}
          aria-hidden={title ? undefined : true}
          style={{'--title-ratio' : ratio, visibility : title ? undefined : 'hidden'}}
        >
          {title && <title>{title}</title>}
          {effects && (
          <defs>
              <linearGradient id={ids.fill} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor="#ffe3f4" className="tt-hue-a" />
                <stop offset="100%" stopColor="#c8f3ff" className="tt-hue-b" />
              </linearGradient>
              <linearGradient id={ids.edge} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff00aa" className="tt-edge-a" />
                <stop offset="100%" stopColor="#00ccff" className="tt-edge-b" />
              </linearGradient>
              <linearGradient id={ids.rainbow} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff8c0" className="tt-edge-b" />
                <stop offset="30%" stopColor="#ff6eb4" className="tt-edge-a" />
                <stop offset="60%" stopColor="#66eeff" className="tt-edge-b" />
                <stop offset="100%" stopColor="#3a1800" />
              </linearGradient>
              {/* same mosaic as the "Zuko" disco SVG */}
              <pattern id={ids.tiles} x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
                <rect width="13" height="13" fill="#7700aa" rx="1.5" />
                <rect x="1" y="1" width="5" height="5" fill="#ffe066" rx="1" className="tt-pulse-1" />
                <rect x="7" y="1" width="5" height="5" fill="#ff6eb4" rx="1" className="tt-pulse-2" />
                <rect x="1" y="7" width="5" height="5" fill="#66eeff" rx="1" className="tt-pulse-3" />
                <rect x="7" y="7" width="5" height="5" fill="#a0ff80" rx="1" className="tt-pulse-4" />
              </pattern>
            </defs>
          )}

          {/* drop shadow */}
          <text
            fontSize={FONT_SIZE} transform="translate(3 5)" opacity={0.45}
            fill="#05000c" stroke="#05000c" strokeWidth={14} strokeLinejoin="round"
          >
            <TitleTokens tokens={tokens} />
          </text>
          {/* outline */}
          <text
            fontSize={FONT_SIZE} opacity={0.8}
            fill="#07000f" stroke="#07000f" strokeWidth={12} strokeLinejoin="round"
          >
            <TitleTokens tokens={tokens} />
          </text>
          {/* fill — also the measured layer */}
          <text ref={measureRef} fontSize={FONT_SIZE} fill={effects ? `url(#${ids.fill})` : '#ffffff'}>
            <TitleTokens tokens={tokens} zukoFill={effects ? `url(#${ids.tiles})` : undefined} />
          </text>
          {effects && (
          <>
              {/* rainbow glaze over the Zuko mosaic only */}
              <text fontSize={FONT_SIZE} fill="none" opacity={0.45}>
                <TitleTokens tokens={tokens} zukoFill={`url(#${ids.rainbow})`} />
              </text>
              {/* neon rim */}
              <text fontSize={FONT_SIZE} fill="none" stroke={`url(#${ids.edge})`} strokeWidth={2.5} opacity={0.85}>
                <TitleTokens tokens={tokens} />
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

export default TrackTitle;
