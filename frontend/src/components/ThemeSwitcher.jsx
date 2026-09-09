import { useTheme } from "../theme";

export default function ThemeSwitcher({ compact = false }) {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div
      className={`theme-switcher${compact ? " compact" : ""}`}
      role="group"
      aria-label="Colour mode"
    >
      {!compact && <span className="theme-switcher-label">Mode</span>}
      <div className="theme-switcher-track">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`theme-chip${theme === t.id ? " active" : ""}`}
            aria-pressed={theme === t.id}
            title={t.hint}
            onClick={() => setTheme(t.id)}
          >
            <span className={`theme-dot theme-dot-${t.id}`} aria-hidden="true" />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
