import { createProjectFrontmatterCollection } from "@awesome-myst/myst-astro-collections";

// Create MyST collections with default configuration
export const collections = {
  projectFrontmatter: createProjectFrontmatterCollection({
    staticConfig: {},
  }),
};
