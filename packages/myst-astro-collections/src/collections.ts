import { defineCollection, z } from "astro:content";
import type { MystServerConfig, ProjectConfig } from "./loaders.js";
import {
  createMystXrefLoader,
  createPagesLoader,
  createProjectFrontmatterLoader,
} from "./loaders.js";
import {
  xrefSchema,
  pageSchema,
  projectFrontmatterSchema,
} from "@awesome-myst/myst-zod";

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
    schema: xrefSchema,
  });
};

/**
 * Create pages collection for page references
 */
export const createPagesCollection = (config: MystServerConfig = {}) => {
  return defineCollection({
    loader: createPagesLoader(config),
    schema: pageSchema,
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
    schema: projectFrontmatterSchema,
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
