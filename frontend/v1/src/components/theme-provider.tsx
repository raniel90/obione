import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Read the persisted theme — matches the pre-paint script in index.html so the
 * first render agrees with the class already on <html> (no flash). */
function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("obione-theme") as Theme | null) ?? "dark";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("obione-theme", theme);
    } catch {
      /* noop */
    }
  }, [theme]);

  const value: ThemeContextValue = {
    theme,
    toggle: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    setTheme: setThemeState,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
