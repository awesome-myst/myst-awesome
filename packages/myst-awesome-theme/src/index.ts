// Export theme components and layouts
export { default as BasePage } from "./layouts/BasePage.astro";
export { default as ContentLayout } from "./layouts/ContentLayout.astro";
export { default as DocsLayout } from "./layouts/DocsLayout.astro";
export { default as NavigationMenu } from "./components/NavigationMenu.astro";
export { default as TableOfContents } from "./components/TableOfContents.astro";
export { default as ThemeControls } from "./components/ThemeControls.astro";

// Export utilities
export * from "./lib/getComponent";
