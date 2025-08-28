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
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

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

  // Read baseDir from project config if not explicitly provided in server config
  if (!server.baseDir && project.configPath) {
    try {
      const fullPath = resolve(process.cwd(), project.configPath);
      if (existsSync(fullPath)) {
        const fileContent = readFileSync(fullPath, "utf-8");
        const config = parseYaml(fileContent);
        server.baseDir = config?.site?.options?.base_dir || "";
      }
    } catch {
      // Ignore errors and continue without baseDir
    }
  }

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
