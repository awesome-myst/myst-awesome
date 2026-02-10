// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

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
export { default as KaTeXStyles } from "./components/KaTeXStyles.astro";
export { default as SearchDialog } from "./components/SearchDialog.astro";
export { default as SearchLauncher } from "./components/SearchLauncher.astro";
export { default as Admonition } from "./components/Admonition.astro";
export { default as AdmonitionResolver } from "./components/AdmonitionResolver.astro";

// Export utilities
export * from "./lib/get-component.ts";
export * from "./lib/generate-page-url.ts";
export * from "./lib/generate-page-toc.ts";
export * from "./lib/render-myst-ast.ts";
export * from "./lib/katex-renderer.ts";

// Export web components
export { WaMystEditor } from "./lib/wa-myst-editor.ts";
