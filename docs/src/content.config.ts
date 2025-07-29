import { defineCollection, z } from "astro:content";
import {
  xrefSchema,
  projectFrontmatterSchema,
  type XRef,
  type ProjectFrontmatter,
} from "@awesome-myst/myst-zod";

// Custom loader for MyST XRef data from the myst-content-server
const mystXrefLoader = async () => {
  try {
    const response = await fetch("http://localhost:3100/myst.xref.json");
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

// Custom loader for page references from myst.xref.json
const pagesLoader = async () => {
  try {
    const response = await fetch("http://localhost:3100/myst.xref.json");
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

// Custom loader for project frontmatter from myst.yml
const projectFrontmatterLoader = async () => {
  try {
    // For now, return a minimal project config since file loading requires Node.js APIs
    // In a real implementation, this would read from myst.yml
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

// Define the mystXref collection with proper schema validation
const mystXref = defineCollection({
  loader: mystXrefLoader,
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

// Define the pages collection for page references
const pages = defineCollection({
  loader: pagesLoader,
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

// Define the projectFrontmatter collection with simplified schema
const projectFrontmatter = defineCollection({
  loader: projectFrontmatterLoader,
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

export const collections = {
  mystXref,
  pages,
  projectFrontmatter,
};
