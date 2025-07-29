import { createMystCollections } from "@awesome-myst/myst-astro-collections";

// Create MyST collections with custom configuration
export const collections = createMystCollections({
  server: {
    baseUrl: "http://localhost:3100",
    timeout: 10000,
  },
  project: {
    // Use static config since we're in a build environment
    staticConfig: {
      version: 1,
      project: {
        id: "1a8d1012-58dc-4f74-afcd-7878dbccaa06",
        title: "MyST Awesome Theme",
        description: "MyST-MD site theme built with Web Awesome.",
        keywords: [
          "myst",
          "myst-md",
          "theme",
          "web-awesome",
          "shoelace",
          "astro",
          "book",
          "furo",
        ],
        authors: ["Matt McCormick"],
        github: "https://github.com/awesome-myst/myst-awesome-theme",
      },
      site: {
        title: "MyST Awesome Theme Guide",
        options: {
          favicon: "favicon.ico",
          logo: "logo.png",
        },
      },
    },
  },
});
