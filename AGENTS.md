# Agent Guidelines for myst-awesome

## Build/Development Commands
- `deno task dev` - Start Astro dev server
- `deno task build` - Build for production
- `deno task preview` - Preview production build
- `cd docs && deno task dev` - Start docs with MyST content server
- `deno task start-myst` - Start MyST headless server only

## Code Style & Conventions
- **Language**: TypeScript with Astro framework
- **Config**: Uses `astro/tsconfigs/strict` TypeScript config
- **Imports**: Use ES modules, import CSS at component level
- **Components**: Astro components (.astro files) with TypeScript frontmatter
- **Styling**: Component-scoped CSS in `<style>` blocks, Web Awesome CSS variables
- **Props**: Define TypeScript interfaces for component props
- **Naming**: camelCase for variables, PascalCase for components
- **Web Components**: Import Web Awesome components in `<script>` blocks
- **Assets**: Store in `src/assets/`, import as modules

## Key Dependencies
- Astro 5.x for static site generation
- Web Awesome (@awesome.me/webawesome) for UI components
- MyST for documentation content
- TypeScript with strict mode enabled