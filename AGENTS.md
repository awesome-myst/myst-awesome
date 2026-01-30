# Agent Guidelines for myst-awesome

## Build/Development Commands
- `pnpm dev` - Start theme dev server (:4322)
- `pnpm dev-docs` - Start docs with MyST content server (:3100) and Astro (:4321)
- `pnpm build` - Build collections + theme + docs
- `pnpm build-collections` - Build myst-astro-collections only
- `pnpm test` - Run all Playwright tests
- `pnpm --filter=myst-awesome test` - Run theme tests only
- `pnpm --filter=myst-awesome exec playwright test path/to/test.spec.ts` - Run single test

## Code Style & Conventions
- **Language**: TypeScript strict mode with Astro framework
- **Imports**: ES modules, Web Awesome components in `<script>` blocks (not frontmatter)
- **Props**: Define TypeScript interfaces for component props with defaults
- **Styling**: Component-scoped CSS, Web Awesome CSS variables, slot-based layouts
- **Naming**: camelCase variables, PascalCase components, kebab-case CSS classes
- **Error Handling**: Try-catch for optional collections, silent failures for missing MyST data
- **Web Components**: Import once in BasePage.astro, use `noExternal: ["@awesome.me/webawesome"]`
- **Commits**: Do not use Conventional Commit conventions

## Key Dependencies & Patterns
- Astro 5.x + TypeScript strict, Web Awesome 3.x beta, MyST 1.3.x, pnpm workspaces
- Grid layouts with `:has()` selectors, responsive via `data-view` attribute
- MyST collections via `@awesome-myst/myst-astro-collections` loader
- Dual runtime: Astro UI + MyST content server (ports 4321/4322 + 3100)