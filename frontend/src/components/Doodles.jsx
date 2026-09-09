import { useId } from "react";

/*
  Hand-drawn style line-art icons on a 24×24 grid, tiled as an SVG pattern.
  Stroke colour comes from the parent's `color`, so the backdrop follows the theme.
*/

const ICONS = {
  cart: (
    <>
      <path d="M1.5 3.5h3.2l2.7 10.8h11.3L21.5 6.5H7.4" />
      <circle cx="9.8" cy="19" r="1.6" />
      <circle cx="18" cy="19" r="1.6" />
    </>
  ),
  tag: (
    <>
      <path d="M3 3h8.2l9.8 9.8-8.2 8.2L3 11.2V3z" />
      <circle cx="7.2" cy="7.2" r="1.3" />
    </>
  ),
  cloud: <path d="M7.2 18.5h9.6a4.2 4.2 0 0 0 .5-8.4 6.2 6.2 0 0 0-11.8 1.7 3.5 3.5 0 0 0 1.7 6.7z" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3.4" />
      <path d="M12 2.4v3M12 18.6v3M2.4 12h3M18.6 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1" />
    </>
  ),
  truck: (
    <>
      <path d="M1.8 5.5h11.4v11H1.8z" />
      <path d="M13.2 9h4.2l3.3 3.3v4.2h-7.5z" />
      <circle cx="6.4" cy="18.4" r="1.7" />
      <circle cx="17.2" cy="18.4" r="1.7" />
    </>
  ),
  browser: (
    <>
      <path d="M2.2 4h19.6v16H2.2z" />
      <path d="M2.2 8.2h19.6" />
      <circle cx="5" cy="6.1" r="0.85" />
      <circle cx="7.6" cy="6.1" r="0.85" />
      <path d="M7 11.6h1.8l1.4 5.2h5.6l1-3.6H9.2" />
    </>
  ),
  bag: (
    <>
      <path d="M5.6 7.6h12.8l1 13.4H4.6z" />
      <path d="M8.8 7.6V5.8a3.2 3.2 0 0 1 6.4 0v1.8" />
    </>
  ),
  search: (
    <>
      <circle cx="10.4" cy="10.4" r="6.2" />
      <path d="M14.9 14.9 20.6 20.6" />
    </>
  ),
  basket: (
    <>
      <path d="M3.4 8.4h17.2l-2.2 11.4H5.6z" />
      <path d="M8 8.4 12 3.2l4 5.2" />
      <path d="M9.6 12.2v4.2M14.4 12.2v4.2" />
    </>
  ),
  card: (
    <>
      <path d="M2 5.4h20v13.2H2z" />
      <path d="M2 9.6h20" />
      <path d="M5 14.6h5.2" />
    </>
  ),
  cursor: <path d="M6.2 3.2 18 11.4l-5 1.2 2.9 5.3-2.5 1.4-2.9-5.3-4.3 3z" />,
  gift: (
    <>
      <path d="M3.2 10.4h17.6V21H3.2z" />
      <path d="M2.2 6.8h19.6v3.6H2.2z" />
      <path d="M12 6.8V21" />
      <path d="M12 6.8C11 4 7 3.6 7 5.6c0 .8.8 1.2 2 1.2" />
      <path d="M12 6.8C13 4 17 3.6 17 5.6c0 .8-.8 1.2-2 1.2" />
    </>
  ),
  box: (
    <>
      <path d="M3 7.6 12 3l9 4.6v8.8L12 21l-9-4.6z" />
      <path d="M3 7.6 12 12.2l9-4.6" />
      <path d="M12 12.2V21" />
    </>
  ),
  chat: (
    <>
      <path d="M3.4 4.6h17.2v11.2H9.8L4.8 20v-4.2H3.4z" />
      <path d="M7.5 9h9M7.5 12h6" />
    </>
  ),
  hanger: (
    <path d="M12 7.4a2.1 2.1 0 1 1 2.1 2.1c-1.2 0-2.1.7-2.1 1.7v.6l8.6 5.2H3.4L12 11.8" />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="7.2" />
      <path d="M12 6.4v11.2" />
      <path d="M14.7 9.1c0-1.2-1.2-1.9-2.7-1.9s-2.7.8-2.7 2 1.2 1.7 2.7 2 2.7.9 2.7 2.1-1.2 1.9-2.7 1.9-2.7-.7-2.7-1.9" />
    </>
  ),
  chart: <path d="M3 20V13.5M9 20V7M15 20v-8.5M21 20V4" />,
  phone: (
    <>
      <path d="M6.4 2.6h11.2v18.8H6.4z" />
      <path d="M10.4 5h3.2" />
      <circle cx="12" cy="18.4" r="1" />
    </>
  ),
};

/* x, y, scale, rotation for each icon in the 480×480 tile */
const PLACEMENTS = [
  ["cart", 26, 34, 1.9, -6],
  ["tag", 136, 20, 1.7, 8],
  ["cloud", 244, 48, 1.8, 0],
  ["gear", 358, 26, 1.7, 0],
  ["truck", 30, 148, 1.9, 0],
  ["browser", 146, 128, 2.0, -3],
  ["coin", 288, 152, 1.6, 0],
  ["search", 380, 140, 1.7, 10],
  ["basket", 28, 262, 1.8, 5],
  ["card", 138, 254, 1.9, -5],
  ["cursor", 258, 258, 1.7, 0],
  ["gift", 366, 250, 1.8, 6],
  ["box", 34, 372, 1.9, 0],
  ["chat", 150, 370, 1.8, 4],
  ["hanger", 264, 372, 1.8, -4],
  ["chart", 372, 368, 1.8, 0],
  ["phone", 196, 60, 1.4, 12],
  ["bag", 96, 92, 1.3, -10],
];

/* Small decorative marks scattered between the icons */
const MARKS = (
  <>
    <path d="M92 30v14M100 26v18M108 32v12" />
    <path d="M228 118v12M236 114v16M244 120v10" />
    <path d="M330 108v10M338 104v14" />
    <path d="M112 208v12M120 204v16M128 210v10" />
    <path d="M330 330v12M338 326v16" />
    <path d="M214 20h10M219 15v10" />
    <path d="M62 216h10M67 211v10" />
    <path d="M446 214h10M451 209v10" />
    <path d="M196 440h10M201 435v10" />
    <circle cx="240" cy="216" r="2.4" />
    <circle cx="88" cy="330" r="2.4" />
    <circle cx="452" cy="60" r="2.4" />
    <circle cx="16" cy="118" r="2.4" />
    <circle cx="340" cy="452" r="2.4" />
    <path d="M436 300c6-6 14-6 20 0" />
    <path d="M12 434c6-6 14-6 20 0" />
    <path d="M224 340c6-6 14-6 20 0" />
  </>
);

export default function DoodleBackdrop({ className = "" }) {
  const rawId = useId();
  const patternId = `doodles-${rawId.replace(/[:]/g, "")}`;

  return (
    <svg
      className={`doodle-backdrop ${className}`}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={patternId} width="480" height="480" patternUnits="userSpaceOnUse">
          <g
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          >
            {PLACEMENTS.map(([name, x, y, scale, rotate]) => (
              <g
                key={`${name}-${x}-${y}`}
                transform={`translate(${x} ${y}) rotate(${rotate} 12 12) scale(${scale})`}
              >
                {ICONS[name]}
              </g>
            ))}
            {MARKS}
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
