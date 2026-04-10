export type ThemePreference = "system" | "dark" | "light";

/** Syncs <html data-theme="..."> so CSS can honor Settings / config.json. */
export function applyRootTheme(theme: ThemePreference | undefined): void {
  const t = theme ?? "system";
  if (t === "system") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.dataset.theme = t;
  }
}

export function applyThemeFromConfigJson(json: string): void {
  try {
    const c = JSON.parse(json) as { theme?: ThemePreference };
    applyRootTheme(c.theme);
  } catch {
    applyRootTheme(undefined);
  }
}
