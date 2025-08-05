# Copilot Instructions for MyST Awesome Theme

## Architecture Overview

This is an **Astro + Web Awesome + MyST integration** that provides a modern documentation theme. Key architectural decisions:

- **Monorepo Structure**: Three packages in `pnpm` workspace - `myst-awesome-theme` (components), `myst-astro-collections` (data integration), and `myst-awesome-docs` (content)
- **Dual Build System**: Astro for theme components + MyST content server for documentation compilation
- **Content Collections**: Custom Astro collections (`mystXref`, `pages`, `projectFrontmatter`) fetch data from MyST server at build time
- **Type Safety**: Full TypeScript integration with `@awesome-myst/myst-zod` schemas for MyST data validation
- **Slot-Based Layouts**: Web Awesome's page component pattern with named slots (`header`, `navigation`, `aside`, `main`)
- **Theme System**: 10 built-in Web Awesome themes via CSS classes (`wa-theme-{name}`) and CSS custom properties

## Critical Development Workflows

### Development Commands
```bash
# Root workspace commands (from project root)
pnpm dev                 # Theme development server at :4321
pnpm dev-docs           # MyST docs server at :3100 + Astro dev
pnpm build              # Build collections + theme packages
pnpm build-collections  # Build myst-astro-collections only
pnpm start-myst         # MyST headless server only

# Individual package commands
cd packages/myst-awesome-theme && pnpm dev     # Theme only
cd packages/myst-astro-collections && pnpm build  # Collections package
cd docs && pnpm myst-content-server           # MyST server only
```

### Content Collections Integration
MyST data is loaded via custom Astro content collections in `docs/src/content.config.ts`:
```typescript
import { createMystCollections } from "@awesome-myst/myst-astro-collections";

export const collections = createMystCollections({
  server: { baseUrl: "http://localhost:3100", timeout: 10000 },
  project: { staticConfig: { /* myst.yml data */ } }
});
```

### Dual Server Setup
Development requires **both** MyST content server (:3100) and Astro dev server (:4321). Use `pnpm dev-docs` for automatic dual-server startup.

## Project-Specific Patterns

## Project-Specific Patterns

### Web Awesome Component Integration
**Critical**: Import Web Awesome components in `<script>` blocks, not frontmatter:
```astro
<script>
  import '@awesome.me/webawesome/dist/components/button/button.js';
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
</script>
```

### Layout Hierarchy
- `BasePage.astro` - Root layout with theme system, Web Awesome CSS imports
- `DocsLayout.astro` - Documentation-specific layout extending BasePage
- `ContentLayout.astro` - General content layout

### Theme System Usage
```astro
// Component props support all 10 Web Awesome themes
theme?: 'default' | 'awesome' | 'shoelace' | 'brutalist' | 'glossy' | 'matter' | 'mellow' | 'playful' | 'premium' | 'tailspin'

// Theme application via CSS classes
document.documentElement.classList.add(`wa-theme-${theme}`);
```

### Slot Pattern for Layouts
Components use named slots extensively following Web Awesome patterns:
```astro
<slot name="header" />      <!-- Page header content -->
<slot name="navigation" />  <!-- Sidebar navigation -->
<slot name="aside" />       <!-- Table of contents -->
<slot />                    <!-- Main content -->
```

## Key Integration Points

### MyST Content Collections
- **`@awesome-myst/myst-astro-collections`**: Custom loaders fetch MyST data at build time
- **Collection Types**: `mystXref` (cross-references), `pages` (page data), `projectFrontmatter` (config)
- **Data Flow**: MyST server (:3100) → Custom loaders → Astro collections → Static build
- **Schema Validation**: Uses `@awesome-myst/myst-zod` schemas (`xrefSchema`, `pageSchema`, `projectFrontmatterSchema`)
- **Usage Pattern**: `await getCollection('pages')` or `await getEntry('projectFrontmatter', 'project')`

### Astro + Web Awesome
- **Vite Config**: Special aliases handle Web Awesome's non-exported CSS paths (`astro.config.mjs`)
- **SSR Config**: `noExternal: ["@awesome.me/webawesome"]` for proper server rendering
- **CSS Loading**: Import Web Awesome CSS in `BasePage.astro` for proper bundling

### MyST Integration
- MyST serves content at `:3100`, Astro theme at `:4321`
- `docs/myst.yml` configures MyST project settings and plugins
- Custom directive plugins in `docs/directives.mjs`

### Testing Architecture
- Playwright tests run against MyST server (`:3100`) using theme components
- CSS/layout tests in `tests/` verify responsive behavior and component integration
- Tests check both visual rendering and Web Awesome component functionality

## Component Conventions

### TypeScript Interfaces
Define props with specific Web Awesome types:
```typescript
interface Props {
  variant?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'small' | 'medium' | 'large';
}
```

### Component Composition
- Navigation components accept hierarchical `NavItem[]` structures
- TableOfContents uses `TocItem[]` with level-based indentation
- Badge/status components follow Web Awesome variant patterns

### Styling Approach
- Use Web Awesome CSS custom properties: `var(--wa-color-*, --wa-space-*, --wa-border-radius-*)`
- Component-scoped CSS in `<style>` blocks
- Responsive design via CSS Grid and `@media` queries

## File Structure Significance

- `packages/myst-awesome-theme/src/layouts/` - Reusable page layouts with slot-based architecture
- `packages/myst-awesome-theme/src/components/` - Astro components wrapping Web Awesome functionality  
- `packages/myst-awesome-theme/src/pages/` - Route definitions with example implementations
- `packages/myst-awesome-theme/tests/` - Playwright tests for cross-browser layout verification
- `packages/myst-astro-collections/` - Custom Astro collections for MyST data integration
- `docs/` - MyST content and configuration (separate build system, workspace package)
- `context/` - Reference implementation (Furo theme) for comparison
- `pnpm-workspace.yaml` - Workspace configuration
- Root `package.json` - Workspace root with aggregated commands

## Dependencies & Versions

- **pnpm 9.x** as package manager with workspace support
- **Astro 5.x** with TypeScript strict mode
- **Web Awesome 3.x** beta for latest component features
- **MyST 1.3.x** for content compilation
- **Workspace Dependencies**: `myst-awesome-docs` depends on `myst-awesome-theme` via `workspace:*`
