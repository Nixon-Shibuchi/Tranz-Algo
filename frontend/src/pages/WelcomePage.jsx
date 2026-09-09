import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { Logo } from "../components/Brand";
import DoodleBackdrop from "../components/Doodles";
import { markWelcomeSeen } from "../welcome";

const AUTOPLAY_MS = 7000;

/* Slide 1 — the journey: boxed goods, flown in and cleared by customs, then sold in the shop */
const AWNING_PATH =
  "M220 84h88v12a11 11 0 0 1-22 0a11 11 0 0 1-22 0a11 11 0 0 1-22 0a11 11 0 0 1-22 0z";

function ArtTrueCost() {
  const SHELF = ["var(--accent)", "var(--info)", "var(--signal)"];

  return (
    <svg viewBox="0 0 320 200" className="wc-svg wc-svg-wide" role="img"
      aria-label="Boxed goods flown in, cleared by customs officers, then sold in a shop at their true cost">
      <defs>
        <clipPath id="tcAwningClip">
          <path d={AWNING_PATH} />
        </clipPath>
      </defs>

      {/* sky: clouds and the flight path */}
      <g fill="var(--line)" opacity="0.75">
        <path d="M78 46a6 6 0 0 1 6-6a9 9 0 0 1 15 3a5 5 0 0 1-1 3z" />
        <path d="M210 40a5 5 0 0 1 5-5a7 7 0 0 1 12 2.5a4 4 0 0 1-1 2.5z" />
      </g>
      <path className="wc-trace" style={{ "--d": "240ms" }} d="M62 86Q140 20 208 74"
        fill="none" stroke="var(--line-strong)" strokeWidth="1.6" strokeDasharray="5 5" />

      {/* the aeroplane */}
      <g className="wc-fly" style={{ "--d": "320ms" }}>
        <path d="M112 48L96 44l2 8l14 1z" fill="var(--accent)" opacity="0.55" />
        <path d="M114 42L106 26h12l10 14z" fill="var(--accent)" opacity="0.75" />
        <path d="M156 58l-18 18h20l14-18z" fill="var(--accent)" opacity="0.55" />
        <path d="M108 50c0-6 8-10 24-10h26c14 0 24 4 28 10c-4 6-14 10-28 10h-30c-12 0-20-4-20-10z"
          fill="var(--accent)" />
        <path d="M172 45c6 .5 10 2.5 12 4.5h-11z" fill="var(--card-elevated)" opacity="0.85" />
        {[136, 144, 152, 160].map((cx) => (
          <circle key={cx} cx={cx} cy="49" r="2" fill="var(--card-elevated)" opacity="0.9" />
        ))}
      </g>

      <line x1="14" y1="150" x2="306" y2="150" stroke="var(--line-strong)" strokeWidth="2" />

      {/* stage 1 — boxed goods on a pallet */}
      <g className="wc-float" style={{ "--d": "0ms" }}>
        <rect x="22" y="140" width="60" height="6" rx="1.5" fill="var(--line-strong)" />
        <rect x="26" y="146" width="9" height="4" fill="var(--line-strong)" />
        <rect x="69" y="146" width="9" height="4" fill="var(--line-strong)" />
        <rect x="28" y="108" width="48" height="32" rx="2" fill="var(--accent-soft)"
          stroke="var(--accent)" strokeWidth="1.6" />
        <rect x="28" y="108" width="48" height="9" fill="var(--accent)" opacity="0.75" />
        <rect x="48" y="108" width="8" height="32" fill="var(--accent)" opacity="0.45" />
      </g>
      <g className="wc-pop" style={{ "--d": "110ms" }}>
        <rect x="30" y="86" width="26" height="22" rx="2" fill="var(--info-soft)"
          stroke="var(--info)" strokeWidth="1.5" />
        <rect x="30" y="86" width="26" height="6.5" fill="var(--info)" opacity="0.75" />
        <rect x="40" y="86" width="6" height="22" fill="var(--info)" opacity="0.4" />
      </g>
      <g className="wc-pop" style={{ "--d": "200ms" }}>
        <rect x="58" y="94" width="18" height="14" rx="2" fill="var(--signal-soft)"
          stroke="var(--signal)" strokeWidth="1.4" />
        <rect x="58" y="94" width="18" height="4.5" fill="var(--signal)" opacity="0.75" />
      </g>

      <path className="wc-pop" style={{ "--d": "300ms" }} d="M94 114l6 6l-6 6"
        fill="none" stroke="var(--line-strong)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* stage 2 — customs officer clearing the shipment */}
      <g className="wc-float" style={{ "--d": "480ms" }}>
        <path d="M118 131v-10a12 12 0 0 1 24 0v10z" fill="var(--info)" />
        <circle cx="130" cy="100" r="7" fill="var(--info)" />
        <path d="M123 99a7 7 0 0 1 14 0z" fill="var(--ink)" opacity="0.7" />
        <rect x="120.5" y="97.5" width="19" height="3.4" rx="1.7" fill="var(--ink)" opacity="0.7" />
        <circle cx="136" cy="118" r="2.4" fill="var(--signal)" />
        <rect x="158" y="104" width="32" height="20" rx="2" fill="var(--accent-soft)"
          stroke="var(--accent)" strokeWidth="1.5" />
        <rect x="158" y="104" width="32" height="6" fill="var(--accent)" opacity="0.75" />
        <rect x="170" y="104" width="8" height="20" fill="var(--accent)" opacity="0.45" />
        <rect x="112" y="124" width="92" height="7" rx="2" fill="var(--line-strong)" />
        <rect x="118" y="131" width="80" height="19" fill="var(--card-elevated)"
          stroke="var(--line-strong)" strokeWidth="1.4" />
        <g stroke="var(--line-strong)" strokeWidth="1.1" opacity="0.7">
          <line x1="145" y1="131" x2="145" y2="150" />
          <line x1="171" y1="131" x2="171" y2="150" />
        </g>
      </g>
      <g className="wc-pop" style={{ "--d": "660ms" }}>
        <path d="M196 79l11 4.5v9.5c0 8-5.5 12.5-11 14.5c-5.5-2-11-6.5-11-14.5v-9.5z"
          fill="var(--signal-soft)" stroke="var(--signal)" strokeWidth="2" strokeLinejoin="round" />
        <path d="M191 93l3.6 3.6l6.8-7.2" fill="none" stroke="var(--signal)"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <path className="wc-pop" style={{ "--d": "720ms" }} d="M210 114l6 6l-6 6"
        fill="none" stroke="var(--line-strong)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* stage 3 — the shop where it is sold */}
      <g className="wc-float" style={{ "--d": "780ms" }}>
        <rect x="224" y="96" width="80" height="54" fill="var(--card-elevated)"
          stroke="var(--line-strong)" strokeWidth="1.6" />
        <rect x="232" y="112" width="34" height="26" rx="2" fill="var(--accent-soft)"
          stroke="var(--line-strong)" strokeWidth="1.2" />
        <line x1="232" y1="125.5" x2="266" y2="125.5" stroke="var(--line-strong)" strokeWidth="1.2" />
        <rect x="276" y="114" width="22" height="36" rx="2" fill="var(--card)"
          stroke="var(--line-strong)" strokeWidth="1.4" />
        <circle cx="281" cy="133" r="1.8" fill="var(--line-strong)" />
        <path d={AWNING_PATH} fill="var(--card-elevated)" />
        <g clipPath="url(#tcAwningClip)">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <rect key={i} x={220 + i * 11} y="82" width="11" height="28"
              fill={i % 2 === 0 ? "var(--accent)" : "var(--accent-soft)"} />
          ))}
        </g>
        <path d={AWNING_PATH} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="244" y="66" width="42" height="15" rx="3" fill="var(--accent)" />
        <text x="265" y="77" textAnchor="middle" className="wc-svg-cap wc-on-accent">SHOP</text>
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} className="wc-pop" style={{ "--d": `${900 + i * 80}ms` }}>
          <rect x={236 + i * 10} y="115" width="7" height="10" rx="1" fill={SHELF[i]} />
          <rect x={236 + i * 10} y="128" width="7" height="9" rx="1" fill={SHELF[(i + 1) % 3]} opacity="0.75" />
        </g>
      ))}

      {/* the running story, stage by stage */}
      <text x="52" y="177" textAnchor="middle" className="wc-svg-tiny">Boxed &amp; bought</text>
      <text x="158" y="177" textAnchor="middle" className="wc-svg-tiny">Freight, duty, VAT</text>
      <g className="wc-float" style={{ "--d": "1120ms" }}>
        <rect x="214" y="162" width="96" height="22" rx="11" fill="var(--accent)" />
        <text x="262" y="177" textAnchor="middle" className="wc-svg-badge">TRUE COST</text>
      </g>
    </svg>
  );
}

/* Slide 2 — two entry modes merging into one costed batch */
function ArtModes() {
  return (
    <svg viewBox="0 0 300 200" className="wc-svg wc-svg-wide" role="img"
      aria-label="Foreign invoice and local charges merging into one costed batch">
      <defs>
        <linearGradient id="mdResult" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="color-mix(in srgb, var(--accent) 78%, #000)" />
        </linearGradient>
      </defs>

      <g className="wc-float" style={{ "--d": "0ms" }}>
        <rect x="8" y="26" width="136" height="58" rx="12" fill="var(--card-elevated)"
          stroke="var(--info)" strokeWidth="1.8" />
        <circle cx="34" cy="55" r="15" fill="var(--info-soft)" />
        <text x="34" y="60" textAnchor="middle" className="wc-svg-sym" fill="var(--info)">$</text>
        <text x="58" y="49" className="wc-svg-label">USD 120.00</text>
        <text x="58" y="65" className="wc-svg-tiny">Auto FX</text>
      </g>

      <g className="wc-float" style={{ "--d": "180ms" }}>
        <rect x="8" y="112" width="136" height="58" rx="12" fill="var(--card-elevated)"
          stroke="var(--signal)" strokeWidth="1.8" />
        <circle cx="34" cy="141" r="15" fill="var(--signal-soft)" />
        <text x="34" y="146" textAnchor="middle" className="wc-svg-sym" fill="var(--signal)">K</text>
        <text x="58" y="135" className="wc-svg-label">ZMW 4,500</text>
        <text x="58" y="151" className="wc-svg-tiny">Already-Local</text>
      </g>

      <path d="M146 55c20 0 14 33 28 35" fill="none" stroke="var(--info)"
        strokeWidth="1.8" strokeDasharray="5 4" opacity="0.85" />
      <path d="M146 141c20 0 14-33 28-35" fill="none" stroke="var(--signal)"
        strokeWidth="1.8" strokeDasharray="5 4" opacity="0.85" />

      <g className="wc-float" style={{ "--d": "320ms" }}>
        <rect x="96" y="88" width="56" height="20" rx="10" fill="var(--card)"
          stroke="var(--line-strong)" strokeWidth="1.2" />
        <text x="124" y="102" textAnchor="middle" className="wc-svg-tiny">FX 27.40</text>
      </g>

      <g className="wc-float" style={{ "--d": "460ms" }}>
        <rect x="174" y="62" width="114" height="76" rx="14" fill="url(#mdResult)" />
        <text x="231" y="88" textAnchor="middle" className="wc-svg-label wc-on-accent">
          One batch
        </text>
        <line x1="192" y1="98" x2="270" y2="98" stroke="var(--accent-ink)" strokeWidth="1" opacity="0.35" />
        <text x="231" y="118" textAnchor="middle" className="wc-svg-big wc-on-accent">
          7,788
        </text>
        <text x="231" y="131" textAnchor="middle" className="wc-svg-tiny wc-on-accent">
          total true cost
        </text>
      </g>
    </svg>
  );
}

/* Slide 3 — margin gauge with the Margin-Guard danger zone */
function ArtPrice() {
  return (
    <svg viewBox="0 0 300 200" className="wc-svg wc-svg-wide" role="img"
      aria-label="A margin gauge with a danger zone, producing a safe retail price">
      <path d="M84 108a66 66 0 0 1 132 0" fill="none" stroke="var(--meter-track)"
        strokeWidth="16" strokeLinecap="round" />
      <path className="wc-arc" style={{ "--d": "60ms" }} d="M84 108A66 66 0 0 1 103.3 61.3"
        fill="none" stroke="var(--danger)" strokeWidth="16" strokeLinecap="round" />
      <path className="wc-arc" style={{ "--d": "180ms" }} d="M103.3 61.3A66 66 0 0 1 216 108"
        fill="none" stroke="var(--ok)" strokeWidth="16" strokeLinecap="round" opacity="0.9" />

      <g className="wc-needle" style={{ "--d": "420ms" }}>
        <line x1="150" y1="108" x2="176" y2="62" stroke="var(--ink)" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="150" cy="108" r="9" fill="var(--card-elevated)" stroke="var(--ink)" strokeWidth="3" />
      </g>

      <text x="150" y="142" textAnchor="middle" className="wc-svg-gauge">30%</text>
      <text x="150" y="156" textAnchor="middle" className="wc-svg-tiny">profit margin</text>

      <text x="78" y="130" textAnchor="middle" className="wc-svg-tiny" fill="var(--danger)">floor</text>
      <text x="222" y="130" textAnchor="middle" className="wc-svg-tiny" fill="var(--ok)">safe</text>

      <g className="wc-float" style={{ "--d": "580ms" }}>
        <path d="M22 166h78a10 10 0 0 1 10 10a10 10 0 0 1-10 10H22z" fill="var(--accent-soft)" />
        <text x="34" y="181" className="wc-svg-tiny">Landed 820</text>
        <path d="M198 166h78a10 10 0 0 1 10 10a10 10 0 0 1-10 10h-78l-14-10z" fill="var(--accent)" />
        <circle cx="196" cy="176" r="3" fill="var(--accent-ink)" opacity="0.55" />
        <text x="242" y="181" textAnchor="middle" className="wc-svg-label wc-on-accent">
          Retail 1,066
        </text>
      </g>
    </svg>
  );
}

/* Slide 4 — a ledger line traced back to the figures behind it */
function ArtLedger() {
  const ROWS = [64, 84, 104, 124, 144];
  const BREAKDOWN = [
    { label: "Goods", w: 44, fill: "var(--accent)" },
    { label: "Ship", w: 24, fill: "var(--info)" },
    { label: "Duty", w: 14, fill: "var(--signal)" },
    { label: "VAT", w: 18, fill: "var(--secondary, var(--danger))" },
  ];

  return (
    <svg viewBox="0 0 300 200" className="wc-svg wc-svg-wide" role="img"
      aria-label="A ledger entry expanded into the exact figures behind it">
      <defs>
        <linearGradient id="lgPaper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--card-elevated)" />
          <stop offset="100%" stopColor="var(--card)" />
        </linearGradient>
      </defs>

      <g className="wc-float" style={{ "--d": "0ms" }} opacity="0.75">
        <rect x="20" y="34" width="106" height="140" rx="9" fill="var(--card)"
          stroke="var(--line)" strokeWidth="1.4" transform="rotate(-7 73 104)" />
        <rect x="24" y="30" width="106" height="140" rx="9" fill="var(--card)"
          stroke="var(--line)" strokeWidth="1.4" transform="rotate(-3.5 77 100)" />
      </g>

      <g className="wc-float" style={{ "--d": "150ms" }}>
        <rect x="28" y="26" width="112" height="148" rx="10" fill="url(#lgPaper)"
          stroke="var(--line-strong)" strokeWidth="1.6" />
        <path d="M28 36a10 10 0 0 1 10-10h92a10 10 0 0 1 10 10v16H28z" fill="var(--accent-soft)" />
        <text x="38" y="45" className="wc-svg-cap">TRUE-COST LEDGER</text>

        <rect x="32" y="96" width="104" height="18" rx="5" fill="var(--accent-soft)" />
        <rect x="32" y="96" width="3" height="18" rx="1.5" fill="var(--accent)" />

        {ROWS.map((y, i) => (
          <g key={y} className="wc-pop" style={{ "--d": `${220 + i * 90}ms` }}>
            <circle cx="44" cy={y} r="5" fill="none" stroke={i === 2 ? "var(--accent)" : "var(--ok)"} strokeWidth="1.6" />
            <path d={`M41.6 ${y}l1.8 1.9 3.4-3.9`} fill="none"
              stroke={i === 2 ? "var(--accent)" : "var(--ok)"} strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" />
            <rect x="56" y={y - 3.5} width={i === 2 ? 46 : 40 + ((i * 9) % 22)} height="5" rx="2.5"
              fill={i === 2 ? "var(--accent)" : "var(--line-strong)"} opacity={i === 2 ? 1 : 0.55} />
            <rect x="112" y={y - 3.5} width="22" height="5" rx="2.5"
              fill={i === 2 ? "var(--accent)" : "var(--line-strong)"} opacity={i === 2 ? 1 : 0.35} />
          </g>
        ))}
      </g>

      <path className="wc-trace" style={{ "--d": "620ms" }}
        d="M140 105c20 0 14-38 32-38" fill="none" stroke="var(--accent)"
        strokeWidth="1.8" strokeDasharray="5 4" />

      <g className="wc-float" style={{ "--d": "700ms" }}>
        <rect x="172" y="40" width="116" height="112" rx="12" fill="var(--card-elevated)"
          stroke="var(--accent)" strokeWidth="1.8" />
        <text x="186" y="60" className="wc-svg-cap">HOW IT WAS BUILT</text>
        {BREAKDOWN.map((b, i) => (
          <g key={b.label} className="wc-grow" style={{ "--d": `${820 + i * 110}ms` }}>
            <rect x="186" y={72 + i * 16} width="7" height="7" rx="2" fill={b.fill} />
            <text x="198" y={78.5 + i * 16} className="wc-svg-micro">{b.label}</text>
            <rect x="230" y={72.5 + i * 16} width={b.w} height="6" rx="3" fill={b.fill} opacity="0.85" />
          </g>
        ))}
        <line x1="186" y1="138" x2="274" y2="138" stroke="var(--line-strong)" strokeWidth="1" />
        <text x="186" y="150" className="wc-svg-micro">Per unit</text>
        <text x="274" y="150" textAnchor="end" className="wc-svg-label" fill="var(--accent)">820.00</text>
      </g>

      <g className="wc-pop" style={{ "--d": "1240ms" }}>
        <circle cx="150" cy="168" r="17" fill="var(--accent)" opacity="0.08" />
        <circle cx="150" cy="168" r="17" fill="none" stroke="var(--accent)" strokeWidth="3.5" opacity="0.9" />
        <line x1="162" y1="180" x2="174" y2="192" stroke="var(--accent)" strokeWidth="4.5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

const SLIDES = [
  {
    id: "truecost",
    kicker: "True cost",
    title: "Know the true cost of every unit",
    body: "Shipping, duty and import VAT arrive as one lump sum. Tranz-Algo spreads them fairly across every item, so you see true cost per unit — not a guess.",
    Art: ArtTrueCost,
  },
  {
    id: "modes",
    kicker: "Built for real paperwork",
    title: "Foreign invoices and local charges, together",
    body: "Enter supplier prices in USD with a live exchange rate, or paste local amounts straight from your shipper and clearing agent. Mix both in one batch.",
    Art: ArtModes,
  },
  {
    id: "price",
    kicker: "Margin-Guard",
    title: "Price with confidence, not hope",
    body: "Set your profit margin and get a suggested retail price built on true cost. Margin-Guard warns you the moment a price drops toward the danger line.",
    Art: ArtPrice,
  },
  {
    id: "ledger",
    kicker: "Explainable by design",
    title: "Open any figure and see the proof",
    body: "Commit a batch and stock rises, prices apply, and the True-Cost Ledger records exactly how each number was reached — goods, shipping, duty and VAT, line by line.",
    Art: ArtLedger,
  },
];

export default function WelcomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const dragRef = useRef(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const finish = useCallback(() => {
    markWelcomeSeen();
    navigate("/login", { replace: true });
  }, [navigate]);

  const go = useCallback((next) => {
    setIndex((current) => {
      const total = SLIDES.length;
      return ((next % total) + total) % total;
    });
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const t = window.setTimeout(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [index, paused, reduceMotion]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "ArrowRight") go(index + 1);
      else if (e.key === "ArrowLeft") go(index - 1);
      else if (e.key === "Escape") finish();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, finish]);

  if (user) return <Navigate to="/" replace />;

  function onPointerDown(e) {
    dragRef.current = { x: e.clientX, at: Date.now() };
    setPaused(true);
  }

  function onPointerUp(e) {
    const start = dragRef.current;
    dragRef.current = null;
    setPaused(false);
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) < 45) return;
    go(dx < 0 ? index + 1 : index - 1);
  }

  const isLast = index === SLIDES.length - 1;

  return (
    <div
      className="welcome-wrap"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <DoodleBackdrop className="welcome-doodles" />

      <header className="welcome-top">
        <div className="brand">
          <Logo size={38} />
          <span>
            Tranz-Algo
            <small>Import true-cost pricing</small>
          </span>
        </div>
        <button type="button" className="btn ghost welcome-skip" onClick={finish}>
          Skip
        </button>
      </header>

      <main className="wc-stage">
        <div className="wc-hello">
          <h1 className="wc-hello-title">Welcome to Tranz-Algo</h1>
        </div>

        <section
          className="card wc-card"
          aria-roledescription="carousel"
          aria-label="What Tranz-Algo does"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            dragRef.current = null;
            setPaused(false);
          }}
        >
          <div className="wc-viewport">
            <div className="wc-track" style={{ transform: `translateX(-${index * 100}%)` }}>
              {SLIDES.map((slide, i) => {
                const { Art } = slide;
                return (
                  <article
                    className={`wc-slide${i === index ? " active" : ""}`}
                    key={slide.id}
                    aria-hidden={i !== index}
                    aria-roledescription="slide"
                    aria-label={`${i + 1} of ${SLIDES.length}`}
                  >
                    <div className="wc-art">
                      <Art />
                    </div>
                    <div className="wc-copy">
                      <span className="wc-kicker">{slide.kicker}</span>
                      <h2 className="wc-title">{slide.title}</h2>
                      <p className="wc-body">{slide.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <footer className="wc-foot">
            <div className="wc-dots" role="tablist" aria-label="Choose slide">
              {SLIDES.map((slide, i) => (
                <button
                  key={slide.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={slide.title}
                  className={`wc-dot${i === index ? " active" : ""}${i < index ? " seen" : ""}`}
                  onClick={() => go(i)}
                >
                  <span
                    className="wc-dot-fill"
                    key={`${slide.id}-${index}-${paused}`}
                    style={{
                      animationDuration: `${AUTOPLAY_MS}ms`,
                      animationPlayState: paused || reduceMotion ? "paused" : "running",
                    }}
                  />
                </button>
              ))}
            </div>

            <div className="wc-nav">
              <button
                type="button"
                className="btn ghost"
                onClick={() => go(index - 1)}
                disabled={index === 0}
              >
                Back
              </button>
              {isLast ? (
                <button type="button" className="btn primary" onClick={finish}>
                  Get started
                </button>
              ) : (
                <button type="button" className="btn primary" onClick={() => go(index + 1)}>
                  Next
                </button>
              )}
            </div>
          </footer>
        </section>

        <p className="wc-signin">
          Already set up?{" "}
          <button type="button" className="btn link wc-signin-link" onClick={finish}>
            Sign in
          </button>
        </p>
      </main>
    </div>
  );
}
