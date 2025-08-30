// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { createProjectFrontmatterCollection } from "@awesome-myst/myst-astro-collections";

// Create MyST collections with default configuration
export const collections = {
  projectFrontmatter: createProjectFrontmatterCollection({
    staticConfig: {
      id: "myst-awesome",
    },
  }),
};
