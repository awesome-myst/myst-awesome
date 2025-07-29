import type { XRef, ProjectFrontmatter } from "@awesome-myst/myst-zod";

/**
 * Configuration for MyST content server
 */
export interface MystServerConfig {
  /** Base URL of the MyST content server */
  baseUrl?: string;
  /** Timeout for requests in milliseconds */
  timeout?: number;
}

/**
 * Configuration for project frontmatter loader
 */
export interface ProjectConfig {
  /** Path to myst.yml file (relative to process.cwd()) */
  configPath?: string;
  /** Static project configuration (alternative to file loading) */
  staticConfig?: any;
}

/**
 * Custom loader for MyST XRef data from the myst-content-server
 */
export const createMystXrefLoader = (config: MystServerConfig = {}) => {
  const { baseUrl = "http://localhost:3100", timeout = 5000 } = config;

  return async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/myst.xref.json`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch myst.xref.json: ${response.status}`);
      }

      const xrefData: XRef = await response.json();

      // Return the full xref data as a single entry
      return [
        {
          id: "myst-xref",
          ...xrefData,
        },
      ];
    } catch (error) {
      console.warn("Failed to load MyST XRef data:", error);
      return [];
    }
  };
};

/**
 * Custom loader for page references from myst.xref.json
 */
export const createPagesLoader = (config: MystServerConfig = {}) => {
  const { baseUrl = "http://localhost:3100", timeout = 5000 } = config;

  return async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${baseUrl}/myst.xref.json`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch myst.xref.json: ${response.status}`);
      }

      const xrefData: XRef = await response.json();

      // Filter references to only include "page" kind
      const pageReferences = xrefData.references.filter(
        (ref) => ref.kind === "page"
      );

      // Transform each page reference into a collection entry
      return pageReferences.map((ref) => ({
        id: ref.url, // Use URL as the ID
        ...ref,
      }));
    } catch (error) {
      console.warn("Failed to load pages data:", error);
      return [];
    }
  };
};

/**
 * Custom loader for project frontmatter from myst.yml or static config
 */
export const createProjectFrontmatterLoader = (config: ProjectConfig = {}) => {
  return async () => {
    try {
      // If static config is provided, use it
      if (config.staticConfig) {
        return [
          {
            id: "project",
            ...config.staticConfig,
          },
        ];
      }

      // For now, return a default config since file loading requires Node.js APIs
      // In a real implementation, this would read from myst.yml using fs
      const frontmatter = {
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
      };

      return [
        {
          id: "project",
          ...frontmatter,
        },
      ];
    } catch (error) {
      console.warn("Failed to load project frontmatter:", error);
      return [];
    }
  };
};

/**
 * Convenience function to create all loaders with the same server config
 */
export const createMystLoaders = (
  serverConfig: MystServerConfig = {},
  projectConfig: ProjectConfig = {}
) => {
  return {
    mystXrefLoader: createMystXrefLoader(serverConfig),
    pagesLoader: createPagesLoader(serverConfig),
    projectFrontmatterLoader: createProjectFrontmatterLoader(projectConfig),
  };
};
