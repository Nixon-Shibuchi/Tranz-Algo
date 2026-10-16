import { useEffect, useState } from "react";

/**
 * Smart page / section loading indicator.
 * label — what is loading (e.g. "Loading products")
 * tips — optional rotating hints for longer waits
 * compact — inline strip instead of full block
 */
export default function LoadingState({
  label = "Loading",
  tips = null,
  compact = false,
  className = "",
}) {
  const tipList = Array.isArray(tips) && tips.length ? tips : null;
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!tipList || tipList.length < 2) return undefined;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tipList.length);
    }, 2800);
    return () => window.clearInterval(id);
  }, [tipList]);

  const tip = tipList ? tipList[tipIndex] : null;

  return (
    <div
      className={`loading-state${compact ? " loading-state--compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-state__orbit" aria-hidden="true">
        <span className="loading-state__ring" />
        <span className="loading-state__dot" />
      </div>
      <div className="loading-state__copy">
        <p className="loading-state__label">{label}</p>
        {tip ? <p className="loading-state__tip">{tip}</p> : null}
      </div>
    </div>
  );
}
