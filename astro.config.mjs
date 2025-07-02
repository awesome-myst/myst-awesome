// @ts-check
import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";

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
    // Ensure Web Awesome and its dependencies are properly optimized
    optimizeDeps: {
      include: [
        "@awesome.me/webawesome",
        "@shoelace-style/localize",
        "@shoelace-style/animations",
        "@ctrl/tinycolor",
        "@floating-ui/dom",
        "lit",
        "qr-creator",
        "style-observer",
        "composed-offset-position",
      ],
    },
  },
});
