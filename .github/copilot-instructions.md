# Copilot Instructions for MyST Awesome Theme

## Architecture Overview

This is an **Astro + Web Awesome + MyST integration** that provides a modern documentation theme. Key architectural decisions:

- **Dual Build System**: Astro for the theme components (`src/`) + MyST for content compilation (`docs/`)
- **Slot-Based Layouts**: Uses Web Awesome's page component pattern with named slots (`header`, `navigation`, `aside`, `main`)
- **Theme System**: Web Awesome provides 10 built-in themes via CSS classes (`wa-theme-{name}`) and CSS custom properties
- **Component Hydration**: Web Awesome components are imported in `<script>` blocks for client-side hydration

## Critical Development Workflows

### Development Commands
```bash
# Theme development (Astro)
deno task dev              # Main dev server at :4321
deno task build           # Production build to dist/

# Documentation development (MyST)
cd docs && deno task dev  # MyST content server at :3100
deno task start-myst      # Headless MyST server only

# Testing
deno task test           # Playwright tests (requires both servers)
```

### Dual Server Setup
Tests require **both** Astro (:4321) and MyST (:3100) servers. Playwright config automatically starts MyST server, but manually run both for development.

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

- `src/layouts/` - Reusable page layouts with slot-based architecture
- `src/components/` - Astro components wrapping Web Awesome functionality  
- `src/pages/` - Route definitions with example implementations
- `docs/` - MyST content and configuration (separate build system)
- `tests/` - Playwright tests for cross-browser layout verification
- `context/` - Reference implementation (Furo theme) for comparison

## Dependencies & Versions

- **Astro 5.x** with TypeScript strict mode
- **Web Awesome 3.x** beta for latest component features
- **MyST 1.3.x** for content compilation
- **Deno** as runtime (not Node.js) - use `deno task` commands
