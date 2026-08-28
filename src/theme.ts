export const THEME_STORAGE_KEY = "tape-theme";

export type ThemePreference = "light" | "dark";

export function getStoredThemePreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {
    /* ignore */
  }
  return "dark";
}

export function setThemePreference(pref: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    /* ignore */
  }
  document.documentElement.setAttribute("data-theme", pref);
}
