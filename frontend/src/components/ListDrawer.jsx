import { useEffect } from "react";

export const LIST_PREVIEW_LIMIT = 5;

export function ListCapBar({ total, shown, noun = "items", onOpen }) {
  const hidden = total - shown;
  if (hidden <= 0) return null;
  return (
    <div className="list-cap-bar">
      <p className="muted list-cap-copy">
        Showing {shown} of {total} {noun}.
      </p>
      <button type="button" className="btn list-cap-btn" onClick={onOpen}>
        View all {total}
      </button>
    </div>
  );
}

export function ListDrawer({ open, onClose, title, subtitle, children }) {
  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button type="button" className="list-drawer-backdrop" aria-label="Close list" onClick={onClose} />
      <aside className="list-drawer open" aria-labelledby="list-drawer-title">
        <header className="list-drawer-head">
          <div>
            <h2 id="list-drawer-title">{title}</h2>
            {subtitle && <p className="muted list-drawer-sub">{subtitle}</p>}
          </div>
          <button type="button" className="btn ghost" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="list-drawer-body">{children}</div>
      </aside>
    </>
  );
}

export function ListSearch({ value, onChange, placeholder = "Search…", id }) {
  return (
    <label className="list-search" htmlFor={id}>
      <span className="list-search-label">Search</span>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
