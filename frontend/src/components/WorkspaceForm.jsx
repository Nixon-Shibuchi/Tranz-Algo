import { PRIMARY_COST_MODES } from "../costModes";

export function FormPanel({ kicker, title, hint, children, onSubmit }) {
  return (
    <form className="card workspace-form" onSubmit={onSubmit}>
      <header className="workspace-form-head span-2">
        {kicker && <span className="page-kicker">{kicker}</span>}
        <h2>{title}</h2>
        {hint && <p className="muted workspace-form-hint">{hint}</p>}
      </header>
      {children}
    </form>
  );
}

export function FormSection({ kicker, title, hint, children, columns = 2 }) {
  const hasHead = kicker || title || hint;
  return (
    <section className="form-section span-2">
      {hasHead && (
        <header className="form-section-head">
          {kicker && <span className="form-section-kicker">{kicker}</span>}
          {title && <h3 className="form-section-title">{title}</h3>}
          {hint && <p className="form-section-hint">{hint}</p>}
        </header>
      )}
      <div className={`form-section-grid cols-${columns}`}>{children}</div>
    </section>
  );
}

export function FormField({
  label,
  hint,
  required,
  className = "",
  id,
  children,
}) {
  return (
    <div className={`form-field${className ? ` ${className}` : ""}`}>
      <label className="form-field-label-wrap" htmlFor={id}>
        <span className="form-field-label">
          {label}
          {required && (
            <span className="form-required" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {hint && <span className="form-field-hint">{hint}</span>}
      </label>
      <div className="form-control">{children}</div>
    </div>
  );
}

export function FormFold({ open, onToggle, label, badge, children }) {
  return (
    <div className={`form-fold span-2${open ? " open" : ""}`}>
      <button
        type="button"
        className="form-fold-trigger"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="form-fold-grip" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
        <span className="form-fold-label">{label}</span>
        {badge && <span className="form-fold-badge">{badge}</span>}
        <span className="form-fold-chevron" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && <div className="form-fold-body">{children}</div>}
    </div>
  );
}

export function FormActions({ children }) {
  return <div className="form-actions span-2">{children}</div>;
}

export function ModeCards({ value, onChange, name = "primary_cost_mode" }) {
  return (
    <div className="mode-cards span-2" role="radiogroup" aria-label="Primary cost mode">
      {PRIMARY_COST_MODES.map((mode) => {
        const active = value === mode.id;
        return (
          <label
            key={mode.id}
            className={`mode-card${active ? " active" : ""}`}
          >
            <input
              type="radio"
              name={name}
              value={mode.id}
              checked={active}
              onChange={() => onChange(mode.id)}
            />
            <span className="mode-card-icon" aria-hidden="true">
              {mode.icon}
            </span>
            <span className="mode-card-copy">
              <span className="mode-card-title">{mode.title}</span>
              <span className="mode-card-hint">{mode.hint}</span>
            </span>
            <span className="mode-card-check" aria-hidden="true" />
          </label>
        );
      })}
    </div>
  );
}
