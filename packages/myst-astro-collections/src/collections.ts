import { defineCollection, z } from "astro:content";
import type { MystServerConfig, ProjectConfig } from "./loaders.js";
import {
  createMystXrefLoader,
  createPagesLoader,
  createProjectFrontmatterLoader,
} from "./loaders.js";

/**
 * Configuration for all MyST collections
 */
export interface MystCollectionsConfig {
  /** MyST content server configuration */
  server?: MystServerConfig;
  /** Project configuration */
  project?: ProjectConfig;
}

/**
 * Create MyST XRef collection
 */
export const createMystXrefCollection = (config: MystServerConfig = {}) => {
  return defineCollection({
    loader: createMystXrefLoader(config),
    schema: z.object({
      id: z.string(),
      version: z.string(),
      myst: z.string().optional(),
      references: z.array(
        z.object({
          identifier: z.string().optional(),
          html_id: z.string().optional(),
          kind: z.string(),
          data: z.string(),
          url: z.string(),
          implicit: z.boolean().optional(),
        })
      ),
    }),
  });
};

/**
 * Create pages collection for page references
 */
export const createPagesCollection = (config: MystServerConfig = {}) => {
  return defineCollection({
    loader: createPagesLoader(config),
    schema: z.object({
      id: z.string(),
      identifier: z.string().optional(),
      html_id: z.string().optional(),
      kind: z.literal("page"),
      data: z.string(),
      url: z.string(),
      implicit: z.boolean().optional(),
    }),
  });
};

/**
 * Create project frontmatter collection
 */
export const createProjectFrontmatterCollection = (
  config: ProjectConfig = {}
) => {
  return defineCollection({
    loader: createProjectFrontmatterLoader(config),
    schema: z.object({
      id: z.string(),
      version: z.number(),
      project: z
        .object({
          id: z.string(),
          title: z.string(),
          description: z.string().optional(),
          keywords: z.array(z.string()).optional(),
          authors: z.array(z.string()).optional(),
          github: z.string().optional(),
        })
        .optional(),
      site: z
        .object({
          title: z.string().optional(),
          options: z.record(z.any()).optional(),
        })
        .optional(),
    }),
  });
};

/**
 * Create all MyST collections with unified configuration
 */
export const createMystCollections = (config: MystCollectionsConfig = {}) => {
  const { server = {}, project = {} } = config;

  return {
    mystXref: createMystXrefCollection(server),
    pages: createPagesCollection(server),
    projectFrontmatter: createProjectFrontmatterCollection(project),
  };
};

/**
 * Pre-configured collections with default settings
 */
export const mystCollections = createMystCollections();
