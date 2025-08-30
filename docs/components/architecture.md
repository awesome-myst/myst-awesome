# Architecture Overview

The MyST Awesome theme uses a **dual build system** designed for flexibility and performance:

- **Astro** for theme components and layouts (`packages/myst-awesome/src/`)
- **MyST** for content compilation (`docs/`)

## Key Architectural Decisions

### Slot-Based Layouts
Following Web Awesome's page component pattern with named slots:
- `navigation` - Sidebar navigation component
- `aside` - Table of contents and secondary content
- `main` - Primary content area
- `header` - Page header and site branding

### Component Hydration
Web Awesome components are imported in `<script>` blocks for optimal performance:

```astro
<script>
  import '@awesome.me/webawesome/dist/components/button/button.js';
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
</script>
```

### Theme System
- CSS classes (`wa-theme-{name}`) for theme selection
- CSS custom properties for dynamic theming
- Support for automatic light/dark mode switching

### Override System
Resolver components enable flexible customization while maintaining compatibility:
- **NavigationMenuResolver** - Sidebar navigation
- **TableOfContentsResolver** - Table of contents
- **ThemeControlsResolver** - Theme and color scheme controls
- **DocsLayoutResolver** - Entire page layout

### Static-First Design
Optimized for sustainable, easy hosting on CDNs:
- Pre-rendered static pages with Astro
- Minimal JavaScript for interactive components
- Optimized asset bundling and compression
- CDN-friendly caching strategies

## Development Patterns

See [Copilot Instructions](../../.github/copilot-instructions.md) for detailed development patterns and conventions.

## Monorepo Structure

The project uses pnpm workspaces for efficient dependency management:
- `packages/myst-awesome` - Core theme package
- `packages/myst-astro-collections` - MyST to Astro content collections
- `docs/` - Documentation and examples
