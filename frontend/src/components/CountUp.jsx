import { useEffect, useRef, useState } from "react";

/** Animated number that eases from its previous value to the new one. */
export default function CountUp({ value, duration = 850, decimals = 2, className }) {
  const target = Number(value);
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [display, setDisplay] = useState(safeTarget);
  const fromRef = useRef(safeTarget);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = fromRef.current;
    if (from === safeTarget) return undefined;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduceMotion || duration <= 0) {
      fromRef.current = safeTarget;
      setDisplay(safeTarget);
      return undefined;
    }

    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(from + (safeTarget - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = safeTarget;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = safeTarget;
    };
  }, [safeTarget, duration]);

  return (
    <span className={className}>
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  );
}
