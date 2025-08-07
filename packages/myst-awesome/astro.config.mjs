// @ts-check
import { defineConfig } from "astro/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

/**
 * Vite plugin to copy favicon from MyST project config to public directory
 */
function faviconCopyPlugin() {
  return {
    name: "myst-favicon-copy",
    configResolved: async (/** @type {any} */ config) => {
      try {
        // Find the docs directory by looking for myst.yml
        const possibleDocsDir = path.resolve(process.cwd(), "../../docs");
        const mystYmlPath = path.join(possibleDocsDir, "myst.yml");

        if (fs.existsSync(mystYmlPath)) {
          const mystConfig = fs.readFileSync(mystYmlPath, "utf8");
          const faviconMatch = mystConfig.match(/favicon:\s*(.+)/);

          if (faviconMatch) {
            const faviconRelativePath = faviconMatch[1].trim();
            const sourceFaviconPath = path.join(
              possibleDocsDir,
              faviconRelativePath
            );

            if (fs.existsSync(sourceFaviconPath)) {
              const faviconBasename = path.basename(faviconRelativePath);
              const publicDir = path.join(process.cwd(), "public");
              const targetFaviconPath = path.join(publicDir, faviconBasename);

              // Ensure public directory exists
              if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
              }

              // Copy favicon file
              fs.copyFileSync(sourceFaviconPath, targetFaviconPath);
              console.log(
                `✓ Copied favicon from ${sourceFaviconPath} to ${targetFaviconPath}`
              );
            } else {
              console.warn(`⚠ Favicon file not found: ${sourceFaviconPath}`);
            }
          }
        }
      } catch (error) {
        console.warn("Favicon copy plugin error:", error);
      }
    },
  };
}

// https://astro.build/config
export default defineConfig({
  vite: {
    // Configure module resolution to handle Web Awesome's non-exported paths
    ssr: {
      noExternal: ["@awesome.me/webawesome"],
    },
    // Pass theme config to client and server
    define: {
      __THEME_CONFIG__: JSON.stringify(themeConfig),
    },
    plugins: [faviconCopyPlugin()],
  },
});
