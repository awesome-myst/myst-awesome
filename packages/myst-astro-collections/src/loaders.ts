import type { XRef, ProjectFrontmatter } from "@awesome-myst/myst-zod";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml } from "yaml";

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
      console.log("Loaded page references:", pageReferences);

      // Fetch the actual page data for each reference
      const pageDataPromises = pageReferences.map(async (ref) => {
        try {
          // Validate that ref has required properties
          if (!ref.url || !ref.data) {
            console.warn(`Invalid page reference - missing url or data:`, ref);
            return null;
          }

          const pageResponse = await fetch(`${baseUrl}${ref.data}`, {
            signal: controller.signal,
          });

          if (!pageResponse.ok) {
            console.warn(
              `Failed to fetch page data for ${ref.url}: ${pageResponse.status}`
            );
            return null;
          }

          const pageData = await pageResponse.json();
          return {
            id: ref.url, // Use URL as the ID
            ...ref, // Include original reference data
            ...pageData, // Include page content
          };
        } catch (error) {
          console.warn(`Failed to load page data for ${ref.url}:`, error);
          return null;
        }
      });

      // Wait for all page data to be fetched
      const pageDataResults = await Promise.all(pageDataPromises);

      // Filter out any null results and return
      const validPages = pageDataResults.filter((data) => data !== null);
      console.log(
        `Loaded ${validPages.length} valid pages out of ${pageReferences.length} references`
      );

      return validPages;
    } catch (error) {
      console.warn("Failed to load pages data:", error);
      return [];
    }
  };
};

/**
 * Custom loader for project frontmatter from myst.yml or static config
 * 
 * This loader reads MyST project configuration from a myst.yml file using the YAML parser.
 * It supports both file-based loading and static configuration as a fallback.
 * 
 * @param config Configuration object with optional configPath and staticConfig
 * @returns Astro loader function that returns project frontmatter data
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

      // Load from myst.yml file using Node.js fs module
      // Use synchronous imports since we're in a loader context
      
      // Default path to myst.yml relative to the current working directory
      const configPath = config.configPath || 'myst.yml';
      const fullPath = resolve(process.cwd(), configPath);
      
      // Check if file exists
      if (!existsSync(fullPath)) {
        console.warn(`MyST config file not found at ${fullPath}, using defaults`);
        throw new Error(`MyST config file not found: ${fullPath}`);
      }

      // Read and parse the YAML file
      const fileContent = readFileSync(fullPath, 'utf-8');
      const frontmatter = parseYaml(fileContent);

      return [
        {
          id: "project",
          ...frontmatter,
        },
      ];
    } catch (error) {
      console.warn("Failed to load project frontmatter:", error);
      
      // Fallback to default config
      const defaultFrontmatter = {
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
          github: "https://github.com/awesome-myst/myst-awesome",
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
          ...defaultFrontmatter,
        },
      ];
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
