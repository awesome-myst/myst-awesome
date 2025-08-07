# @awesome-myst/myst-astro-collections

Astro content collections for MyST projects. This package provides pre-configured collections and loaders for integrating MyST content with Astro's content collection system.

## Features

- **MyST XRef Collection**: Cross-reference data from MyST content server
- **Pages Collection**: Individual page references extracted from XRef data
- **Project Frontmatter Collection**: Project configuration from myst.yml
- **Configurable**: Customizable server URLs, timeouts, and project settings
- **TypeScript**: Full TypeScript support with proper types from `@awesome-myst/myst-zod`

## Installation

```bash
npm install @awesome-myst/myst-astro-collections
# or
pnpm add @awesome-myst/myst-astro-collections
```

## Quick Start

In your `src/content.config.ts`:

```typescript
import { mystCollections } from "@awesome-myst/myst-astro-collections";

export const collections = mystCollections;
```

## Custom Configuration

```typescript
import { createMystCollections } from "@awesome-myst/myst-astro-collections";

export const collections = createMystCollections({
  server: {
    baseUrl: "http://localhost:3100",
    timeout: 10000,
  },
  project: {
    staticConfig: {
      version: 1,
      project: {
        title: "My Documentation",
        description: "My awesome docs",
      },
    },
  },
});
```

## Individual Collections

You can also use collections individually:

```typescript
import {
  createMystXrefCollection,
  createPagesCollection,
  createProjectFrontmatterCollection
} from "@awesome-myst/myst-astro-collections";

export const collections = {
  mystXref: createMystXrefCollection({
    baseUrl: "http://localhost:3100"
  }),
  pages: createPagesCollection(),
  // Only include the collections you need
};
```

## Usage in Pages

```typescript
import { getCollection, getEntry } from 'astro:content';

// Get all pages
const pages = await getCollection('pages');

// Get project config
const project = (await getCollection('projectFrontmatter'))[0];

// Get cross-reference data
const xref = await getEntry('mystXref', 'myst-xref');
```

## API Reference

### Collections

- `mystXref`: Cross-reference data from MyST content server
- `pages`: Page references filtered from XRef data
- `projectFrontmatter`: Project configuration data

### Configuration Types

- `MystServerConfig`: Server configuration (baseUrl, timeout)
- `ProjectConfig`: Project configuration (configPath, staticConfig)
- `MystCollectionsConfig`: Combined configuration for all collections

## Requirements

- Astro 5.0+
- MyST content server running (typically on http://localhost:3100)
- `@awesome-myst/myst-zod` for type definitions

## License

Apache-2.0
