// Export theme components and layouts
export { default as BasePage } from "./layouts/BasePage.astro";
export { default as ContentLayout } from "./layouts/ContentLayout.astro";
export { default as DocsLayout } from "./layouts/DocsLayout.astro";
export { default as NavigationMenu } from "./components/NavigationMenu.astro";
export { default as TableOfContents } from "./components/TableOfContents.astro";
export { default as ThemeControls } from "./components/ThemeControls.astro";
export { default as Footer } from "./components/Footer.astro";
export { default as Themes } from "./components/Themes.astro";
export { default as ThemesResolver } from "./components/ThemesResolver.astro";

// Export utilities
export * from "./lib/get-component.ts";
export * from "./lib/generate-page-url.ts";
export * from "./lib/generate-page-toc.ts";
