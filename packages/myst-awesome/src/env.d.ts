// Hooks the theme's client scripts share through `window`. BasePage.astro
// defines both; a component rendered outside BasePage must treat them as
// absent.
interface Window {
  setColorScheme?: (scheme: "light" | "dark" | "auto") => void;
  setTheme?: (theme: string) => void;
}
