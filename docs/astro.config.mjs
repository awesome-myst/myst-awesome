// @ts-check
import { defineConfig } from "astro/config";

/**
 * Theme configuration for component overrides
 * Example:
 * {
 *   components: {
 *     NavigationMenu: './src/custom/MyNavigationMenu.astro',
 *     TableOfContents: './src/custom/MyTableOfContents.astro',
 *   }
 * }
 */
export const themeConfig = {
  components: {
    // Add your custom component overrides here
    // NavigationMenu: './src/custom/MyNavigationMenu.astro',
    // TableOfContents: './src/custom/MyTableOfContents.astro',
    // ThemeControls: './src/custom/MyThemeControls.astro',
  },
};

// https://astro.build/config
export default defineConfig({
  vite: {
    // Configure module resolution to handle Web Awesome's non-exported paths
    ssr: {
      noExternal: ["@awesome.me/webawesome"],
    },
    // Vite's cold-start dependency scan does not reach these, because they are
    // imported from `.astro` <script> blocks and from the client-side MyST
    // editor module rather than from a scanned entry. Left undeclared, the dev
    // server discovers them on the first request, re-optimizes, and forces a
    // full page reload that races anything already navigating.
    //
    // They belong to the linked `@awesome-myst/myst-awesome` workspace package
    // and are not resolvable from this app's own `node_modules`, so they use
    // Vite's `parent > dep` syntax for dependencies of a linked package.
    optimizeDeps: {
      include: [
        "@awesome-myst/myst-awesome > fuse.js",
        "@awesome-myst/myst-awesome > katex",
        "@awesome-myst/myst-awesome > lit",
        "@awesome-myst/myst-awesome > lit/directives/unsafe-html.js",
        "@awesome-myst/myst-awesome > myst-parser",
        "@awesome-myst/myst-awesome > myst-transforms",
        "@awesome-myst/myst-awesome > shiki",
      ],
      // Web Awesome cannot be handled the same way: `parent > dep` names one
      // module, and the theme reaches roughly forty Web Awesome deep imports
      // from its `<script>` blocks. Excluding the package keeps the optimizer
      // from discovering them one route at a time — dropping this line makes a
      // cold dev server answer the home page's in-flight module requests with
      // `504 (Outdated Optimize Dep)` and fail the dynamic import of Astro's
      // own client runtime.
      exclude: ["@awesome.me/webawesome"],
    },
    // Pass theme config to client and server
    define: {
      __THEME_CONFIG__: JSON.stringify(themeConfig),
    },
  },
});
