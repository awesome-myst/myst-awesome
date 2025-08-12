import type { XRef, ProjectFrontmatter } from "@awesome-myst/myst-zod";
import PQueue from "p-queue";
import {
  readFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  writeFileSync,
} from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
import { parse as parseYaml } from "yaml";
import { randomUUID } from "node:crypto";

/**
 * Configuration for MyST content server
 */
export interface MystServerConfig {
  /** Base URL of the MyST content server */
  baseUrl?: string;
  /** Timeout for requests in milliseconds */
  timeout?: number;
  /** Generate a public/fuse.json search index from myst.xref.json (default: true) */
  generateFuse?: boolean;
  /** Concurrency for fetching page JSON when generating fuse.json (default: 16) */
  fuseConcurrency?: number;
  /** Include frontmatter.keywords in fuse.json entries (default: false) */
  includeKeywords?: boolean;
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
  const {
    baseUrl = "http://localhost:3100",
    timeout = 5000,
    generateFuse = true,
    fuseConcurrency = 16,
    includeKeywords = false,
  } = config;

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

      // Persist a copy to public/myst.xref.json so Astro can serve it directly
      try {
        const publicDir = resolve(process.cwd(), "public");
        if (!existsSync(publicDir)) {
          mkdirSync(publicDir, { recursive: true });
        }
        const targetPath = join(publicDir, "myst.xref.json");
        writeFileSync(targetPath, JSON.stringify(xrefData, null, 2), "utf-8");
        console.log("✓ Saved myst.xref.json to public/ (", targetPath, ")");
      } catch (writeErr) {
        console.warn("Failed to write myst.xref.json to public/:", writeErr);
      }

      // Optionally generate a Fuse.js-friendly index at public/fuse.json
      if (generateFuse) {
        try {
          // Build entries from references, fetching page data when kind === 'page'
          const references = Array.isArray(xrefData?.references)
            ? xrefData.references
            : [];

          // Helper to safely pick frontmatter fields
          const pickFrontmatter = (fm: any) => {
            if (!fm || typeof fm !== "object") return undefined;
            const out: any = {};
            if (typeof fm.title === "string") out.title = fm.title;
            if (typeof fm.description === "string")
              out.description = fm.description;
            if (includeKeywords && Array.isArray(fm.keywords))
              out.keywords = fm.keywords.filter(
                (k: any) => typeof k === "string"
              );
            return Object.keys(out).length ? out : undefined;
          };

          // Build queue tasks so we can control concurrency with p-queue
          const pageTasks = references.map((ref) => async () => {
            try {
              const base = {
                url: (ref as any)?.url as string | undefined,
                kind: (ref as any)?.kind as string | undefined,
                identifier: (ref as any)?.identifier as string | undefined,
              };
              if (base.kind === "page" && (ref as any)?.data && base.url) {
                // Fetch the page data JSON to extract frontmatter
                const pageController = new AbortController();
                const pageTimeout = setTimeout(
                  () => pageController.abort(),
                  timeout
                );
                const pageResp = await fetch(`${baseUrl}${(ref as any).data}`, {
                  signal: pageController.signal,
                });
                clearTimeout(pageTimeout);
                if (pageResp.ok) {
                  const pageJson = await pageResp.json();
                  const fm = pickFrontmatter(pageJson?.frontmatter);
                  return fm ? { ...base, frontmatter: fm } : base;
                }
                // If fetch fails, return without frontmatter
                return base;
              }
              // Non-page or missing data/url
              return base;
            } catch (e) {
              // On any error, return minimal entry
              return {
                url: (ref as any)?.url,
                kind: (ref as any)?.kind,
                identifier: (ref as any)?.identifier,
              };
            }
          });

          const queue = new PQueue({
            concurrency: Math.max(1, Math.floor(fuseConcurrency || 1)),
          });
          const fuseEntries = await queue.addAll(pageTasks);
          // Filter out entries missing essential fields (url and kind)
          const fuseFiltered = fuseEntries.filter(
            (e) =>
              typeof (e as any)?.url === "string" &&
              typeof (e as any)?.kind === "string"
          );

          const publicDir = resolve(process.cwd(), "public");
          if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
          const fusePath = join(publicDir, "fuse.json");
          writeFileSync(fusePath, JSON.stringify(fuseFiltered, null), "utf-8");
          console.log("✓ Saved fuse.json to public/ (", fusePath, ")");
        } catch (fuseErr) {
          console.warn("Failed to generate fuse.json:", fuseErr);
        }
      }

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

          // Persist this page JSON into public/ at ref.url
          try {
            const publicDir = resolve(process.cwd(), "public");
            if (!existsSync(publicDir)) {
              mkdirSync(publicDir, { recursive: true });
            }
            const urlPath = String(ref.data).replace(/^\/+/, ""); // strip leading '/'
            const targetPath = join(publicDir, urlPath);
            const targetDir = dirname(targetPath);
            if (!existsSync(targetDir)) {
              mkdirSync(targetDir, { recursive: true });
            }
            writeFileSync(
              targetPath,
              JSON.stringify(pageData, null, 2),
              "utf-8"
            );
            console.log(`✓ Saved page JSON to public/${urlPath}`);
          } catch (writeErr) {
            console.warn(
              `Failed to write page JSON for ${ref.url} to public/:`,
              writeErr
            );
          }
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
        if (!config.staticConfig.id) {
          console.warn(
            "Static project config provided but missing 'id' property, generating a new UUID"
          );
          config.staticConfig.id = randomUUID(); // Generate a new UUID if not provided
        }
        return [
          config.staticConfig, // Return the static config directly
        ];
      }

      // Load from myst.yml file using Node.js fs module
      // Use synchronous imports since we're in a loader context

      // Default path to myst.yml relative to the current working directory
      const configPath = config.configPath || "myst.yml";
      const fullPath = resolve(process.cwd(), configPath);

      // Check if file exists
      if (!existsSync(fullPath)) {
        console.warn(
          `MyST config file not found at ${fullPath}, using defaults`
        );
        throw new Error(`MyST config file not found: ${fullPath}`);
      }

      // Read and parse the YAML file
      const fileContent = readFileSync(fullPath, "utf-8");
      const frontmatter = parseYaml(fileContent);
      if (!frontmatter.project) {
        console.warn(
          `MyST config file at ${fullPath} does not contain 'project' frontmatter, using defaults`
        );
        throw new Error(`Missing 'project' frontmatter in myst.yml`);
      }
      if (!frontmatter.project.id) {
        console.warn(
          `Project frontmatter missing 'id' property, generating a new UUID`
        );
        frontmatter.project.id = randomUUID(); // Generate a new UUID if not provided
      }

      if (!frontmatter.version || frontmatter.version < 1) {
        console.warn(
          `MyST config file at ${fullPath} is missing version or has an unsupported version`
        );
      }

      // Handle favicon copying if site.options.favicon is specified
      if (frontmatter.site?.options?.favicon) {
        try {
          const faviconRelativePath = frontmatter.site.options.favicon;
          const mystConfigDir = dirname(fullPath);
          const faviconSourcePath = resolve(mystConfigDir, faviconRelativePath);

          if (existsSync(faviconSourcePath)) {
            // Create public directory in the same directory as myst.yml
            const publicDir = join(mystConfigDir, "public");
            if (!existsSync(publicDir)) {
              mkdirSync(publicDir, { recursive: true });
            }

            // Copy favicon to public directory with basename
            const faviconBasename = basename(faviconRelativePath);
            const faviconTargetPath = join(publicDir, faviconBasename);
            copyFileSync(faviconSourcePath, faviconTargetPath);
            console.log(
              `✓ Copied favicon: ${faviconRelativePath} → public/${faviconBasename}`
            );
          } else {
            console.warn(`⚠ Favicon file not found: ${faviconSourcePath}`);
          }
        } catch (error) {
          console.warn("Failed to copy favicon:", error);
        }
      }

      const result = {
        ...frontmatter.project,
        ...frontmatter.site, // Include site options if available
      };
      return [result];
    } catch (error) {
      console.warn("Failed to load project frontmatter:", error);

      // Fallback to default config
      const defaultFrontmatter = {
        version: 1,
        project: {
          id: randomUUID(), // Generate a new UUID for the project
          title: "MyST Awesome",
          description: "MyST-MD site built with Web Awesome.",
          keywords: ["myst", "myst-md", "webawesome", "astro"],
          authors: [],
          github: "https://github.com/awesome-myst/myst-awesome",
        },
        site: {
          title: "MyST Awesome",
        },
      };

      const result = {
        ...defaultFrontmatter.project,
        ...defaultFrontmatter.site, // Include site options if available
      };
      return [result];
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
