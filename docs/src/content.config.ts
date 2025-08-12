import { createMystCollections } from "@awesome-myst/myst-astro-collections";

// Create MyST collections with custom configuration
export const collections = createMystCollections({
  server: {
    baseUrl: "http://localhost:3100",
    timeout: 10000,
    // Enable fuse index generation for search
    generateSearchIndex: true,
    includeKeywords: true,
  },
  project: {
    // Load configuration from myst.yml file (relative to docs directory)
    configPath: "myst.yml",
  },
});
