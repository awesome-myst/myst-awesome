// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

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
    resolve: {
      alias: {
        "@awesome.me/webawesome/dist/styles/webawesome.css": fileURLToPath(
          new URL(
            "node_modules/@awesome.me/webawesome/dist/styles/webawesome.css",
            import.meta.url
          )
        ),
        "@awesome.me/webawesome/dist/styles/themes/default.css": fileURLToPath(
          new URL(
            "node_modules/@awesome.me/webawesome/dist/styles/themes/default.css",
            import.meta.url
          )
        ),
      },
    },
    ssr: {
      noExternal: ["@awesome.me/webawesome"],
    },
    // Pass theme config to client and server
    define: {
      __THEME_CONFIG__: JSON.stringify(themeConfig),
    },
  },
});
