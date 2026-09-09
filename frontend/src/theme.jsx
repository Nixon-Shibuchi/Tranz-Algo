import { createContext, useContext, useEffect, useMemo, useState } from "react";

export const THEMES = [
  {
    id: "day",
    label: "Day",
    hint: "Teal on white — logo primary",
  },
  {
    id: "night",
    label: "Night",
    hint: "Teal glow on charcoal",
  },
  {
    id: "atlas",
    label: "Sienna",
    hint: "Sienna on deep teal — logo inverted",
  },
];

const STORAGE_KEY = "tranzalgo-theme";
const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "night";
  }
  return "day";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: setThemeState,
      themes: THEMES,
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
