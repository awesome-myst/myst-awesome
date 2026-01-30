# Agent Guidelines for myst-awesome

## Table of Contents
1. [Overview & Architecture](#1-overview--architecture)
2. [Project Structure](#2-project-structure)
3. [Development Commands](#3-development-commands)
4. [Code Style & Conventions](#4-code-style--conventions)
5. [Component Patterns](#5-component-patterns)
6. [Testing](#6-testing)
7. [Content Collections (MyST → Astro)](#7-content-collections-myst--astro)
8. [Configuration Files](#8-configuration-files)
9. [Build & Deployment](#9-build--deployment)
10. [Troubleshooting](#10-troubleshooting)
11. [Important Files Reference](#11-important-files-reference)
12. [Quick Reference Card](#quick-reference-card)

---

## 1. Overview & Architecture

### Big Picture
- **Monorepo structure** using pnpm workspaces
- **Three main packages:**
  - `packages/myst-awesome` - Astro theme (components, layouts, pages, tests)
  - `packages/myst-astro-collections` - Astro content collections pulling from MyST
  - `docs` - MyST content app (separate build/runtime) that consumes the theme
- **Dual runtime in development:** Astro UI server + MyST content server run simultaneously
- **Port allocation:**
  - **4322** - Theme dev server (`packages/myst-awesome`)
  - **4321** - Docs Astro server (`docs`)
  - **3100** - MyST content server (headless)

### Key Technologies
- **Astro 5.x** + TypeScript strict mode
- **Web Awesome 3.x beta** - Comprehensive component library
- **MyST 1.8.x** - Markedly Structured Text for scientific communication
- **pnpm 10.x** - Fast, disk-efficient package manager with workspaces
- **Playwright 1.57.x** - End-to-end testing framework

### Core Design Patterns
- **Slot-based layouts** following Web Awesome patterns (header, navigation, aside, main, footer)
- **Resolver components** for flexible component overrides
- **Type safety** via `@awesome-myst/myst-zod` schema validation
- **CSS Grid with `:has()` selectors** for responsive layouts
- **Data attributes** (`data-view`, `data-nav-open`) for responsive behavior
- **Theme system** via CSS classes (`wa-theme-{name}`) + CSS custom properties

---

## 2. Project Structure

### Monorepo Layout

```
myst-awesome/
├── packages/
│   ├── myst-awesome/              # Main Astro theme (port 4322)
│   │   ├── src/
│   │   │   ├── components/        # 55+ Astro components
│   │   │   │   ├── frontmatter/   # MyST metadata display components
│   │   │   │   ├── examples/      # Custom component examples
│   │   │   │   └── *Resolver.astro # Component override pattern
│   │   │   ├── layouts/           # BasePage, DocsLayout, ContentLayout
│   │   │   ├── lib/               # Core rendering logic (14 TS files)
│   │   │   │   ├── render-myst-ast.ts    # MyST → HTML pipeline
│   │   │   │   ├── shiki-highlighter.ts  # Code syntax highlighting
│   │   │   │   ├── wa-scienceicons.ts    # Science icon setup
│   │   │   │   ├── html-escape.ts        # HTML sanitization
│   │   │   │   └── ...
│   │   │   ├── integrations/      # Astro integrations (scienceicons.ts)
│   │   │   ├── pages/             # Demo/test pages
│   │   │   ├── assets/            # Static assets
│   │   │   └── content.config.ts  # Static project frontmatter collection
│   │   ├── tests/                 # 19 Playwright test files
│   │   ├── scripts/               # copy-scienceicons.mjs
│   │   ├── public/                # favicon files
│   │   └── astro.config.mjs       # Port 4322, faviconCopyPlugin
│   │
│   └── myst-astro-collections/    # Astro content loaders (711 lines)
│       ├── src/
│       │   ├── loaders.ts         # XRef, Pages, ProjectFrontmatter loaders
│       │   ├── collections.ts     # Collection factory functions
│       │   ├── index.ts           # Re-exports
│       │   └── types.d.ts         # Type augmentations
│       └── tests/                 # test-yaml-loader.mjs
│
├── docs/                          # MyST documentation project (port 4321)
│   ├── authoring/                 # Writing guides and examples
│   ├── components/                # Component documentation
│   ├── customization/             # Theming and customization docs
│   ├── src/
│   │   ├── pages/                 # Astro pages (book/[...slug].astro, article/[id].astro)
│   │   ├── components/            # Doc-specific custom components
│   │   ├── content.config.ts      # Full MyST collections (server + project)
│   │   ├── directives.mjs         # Custom MyST directives
│   │   └── types/                 # astro-augment.d.ts
│   ├── tests/                     # 5 Playwright tests for docs
│   ├── scripts/                   # setup-assets.mjs (pre-build)
│   ├── public/book/               # Generated MyST content (JSON, assets)
│   ├── _build/                    # MyST build output cache
│   ├── myst.yml                   # MyST project config (base_dir: book)
│   ├── pixi.toml                  # Python environment (mystmd, deno, nodejs)
│   └── package.json               # Uses start-server-and-test
│
├── pnpm-workspace.yaml            # Workspace configuration (packages/*, docs)
├── package.json                   # Root scripts, pnpm overrides
├── AGENTS.md                      # This file
└── .github/
    └── workflows/ci.yml           # Multi-OS CI (Ubuntu, macOS, Windows)
```

### Key File Patterns

- **Resolver Components** (`*Resolver.astro`) - Enable component overrides via props
- **Frontmatter Components** - Separate directory for MyST metadata display
- **Layout Slots** - Named slots drive composition (navigation → sidebar, aside → TOC, default → main)
- **Config Files** - `astro.config.mjs`, `myst.yml`, `content.config.ts`, `playwright.config.ts`
- **Dual Runtime** - Theme (Astro) + MyST content server run simultaneously in docs

---

## 3. Development Commands

### From Repository Root

#### Development Servers
```bash
pnpm dev          # Start theme dev server at :4322
pnpm dev-docs     # Start docs with MyST (:3100) + Astro (:4321)
pnpm start-myst   # Start headless MyST server only (:3100)
```

#### Build
```bash
pnpm build                 # Build ALL: collections → theme → docs (MUST follow order)
pnpm build-collections     # Build myst-astro-collections only
pnpm --filter=myst-awesome build           # Theme only
pnpm --filter=myst-awesome-docs build      # Docs only
```

**⚠️ CRITICAL:** Always build in order: **collections → theme → docs** (dependency chain!)

#### Testing
```bash
pnpm test                  # Run ALL Playwright tests (all packages)
pnpm --filter=myst-awesome test            # Theme tests only
pnpm --filter=myst-awesome-docs test       # Docs tests only

# Single test file
pnpm --filter=myst-awesome exec playwright test path/to/test.spec.ts

# Debug mode
pnpm --filter=myst-awesome exec playwright test --debug

# Show report
pnpm --filter=myst-awesome exec playwright show-report
```

#### Other
```bash
pnpm install      # Install dependencies (uses pnpm@10.28.2)
pnpm preview      # Preview production build
```

### Important Notes

- **Build Order:** ALWAYS build collections → theme → docs (dependencies!)
- **Port Conflicts:** Check ports 3100, 4321, 4322 before starting dev servers
- **MyST Server:** Required for docs development and tests
- **Workspace Filtering:** Use `--filter=<package-name>` for package-specific commands
- **Ignore Older Docs:** This repo uses pnpm, not Deno tasks

---

## 4. Code Style & Conventions

### Language & Framework

- **TypeScript:** Strict mode enabled (`"strict": true` in tsconfig)
- **Astro Framework:** Component-based with frontmatter + template sections
- **ES Modules:** Use import/export (no require/module.exports)

### Imports & Components

#### Web Awesome Components
**CRITICAL:** MUST import in `<script>` blocks, NOT frontmatter

```astro
<!-- ❌ WRONG - Will not work -->
---
import '@awesome.me/webawesome/dist/components/button/button.js';
---

<!-- ✅ CORRECT - Always use script block -->
<script>
  import '@awesome.me/webawesome/dist/components/button/button.js';
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
</script>
```

#### Web Awesome CSS
- Import Web Awesome CSS **once** in `BasePage.astro` for bundling:
  - `@awesome.me/webawesome/dist/styles/webawesome.css`
  - `@awesome.me/webawesome/dist/styles/themes/default.css`

#### SSR Configuration
**REQUIRED:** Set `noExternal: ["@awesome.me/webawesome"]` in `astro.config.mjs`:

```javascript
export default defineConfig({
  vite: {
    ssr: {
      noExternal: ["@awesome.me/webawesome"]  // MUST include this
    }
  }
});
```

### Props & Interfaces

Always define TypeScript interfaces for component props:

```typescript
interface Props {
  title?: string;                    // Optional with default
  theme?: 'default' | 'awesome';     // Union types for enums
  items: NavItem[];                  // Required
  showSearch?: boolean;              // Optional boolean
}

const { 
  title = "Default",      // Provide defaults for optional props
  theme = 'default', 
  items,
  showSearch = true 
} = Astro.props;
```

### Styling

- **Component-Scoped CSS:** Use `<style>` blocks in components
- **Web Awesome CSS Variables:** Use `--wa-*` custom properties for consistency
- **Design Tokens:** Leverage WA spacing, colors, typography, transitions

```css
.my-component {
  padding: var(--wa-space-m);
  color: var(--wa-color-text-normal);
  background: var(--wa-color-surface-normal);
  border-radius: var(--wa-border-radius-m);
  transition: all var(--wa-transition-fast);
}

.my-component:hover {
  background: var(--wa-color-surface-hover);
}
```

- **Responsive:** CSS Grid with `:has()` selectors, data-view attributes
- **Grid Layouts:** Use named grid areas with `:has()` selectors for responsive behavior

### Naming Conventions

- **Variables:** camelCase (`myVariable`, `navItems`, `currentPage`)
- **Components:** PascalCase (`NavigationMenu.astro`, `DocsLayout.astro`, `TableOfContents.astro`)
- **CSS Classes:** kebab-case (`page-layout`, `nav-item`, `toc-link`)
- **Files:** kebab-case for utilities, PascalCase for components

### Error Handling

- **Try-Catch:** For optional collections and external data fetching
- **Silent Failures:** For missing MyST data (use fallbacks)
- **Console Warnings:** For recoverable errors

```typescript
// Safe collection access
try {
  const collection = await getCollection('pages');
  return collection;
} catch (error) {
  console.warn('Pages collection not found, using defaults');
  return [];
}

// Lib functions with fallbacks
try {
  const result = await renderKaTeX(math);
  return result;
} catch (error) {
  console.warn('KaTeX rendering error:', error);
  return `<span class="katex-error">${escapeHtml(math)}</span>`;
}
```

### Commits

- **Do NOT use Conventional Commit conventions** (no `feat:`, `fix:`, `chore:`, etc.)
- Write clear, descriptive messages focusing on **"why"** not **"what"**
- Keep messages concise (1-2 sentences)

```bash
# ❌ Wrong - Conventional Commit format
git commit -m "feat: add dark mode toggle"

# ✅ Correct - Clear descriptive message
git commit -m "Add dark mode toggle to theme controls for user preference"
```

---

## 5. Component Patterns

### 1. Resolver Pattern (Component Overrides)

Core customization pattern. Every major component has a resolver that accepts custom implementations.

```astro
// NavigationMenuResolver.astro
interface Props {
  component?: any;  // Custom component override
  items: NavItem[];
  showSearch?: boolean;
  // ...other props
}

const { component, ...props } = Astro.props;
const Component = component || DefaultNavigationMenu;

<Component {...props} />
```

**Usage:**

```astro
<!-- Use default component -->
<NavigationMenuResolver items={navItems} />

<!-- Use custom component -->
---
import CustomNav from './custom/MyNav.astro';
---
<NavigationMenuResolver component={CustomNav} items={navItems} />
```

**Available Resolvers:**
- `NavigationMenuResolver` - Sidebar navigation
- `TableOfContentsResolver` - Table of contents
- `ThemeControlsResolver` - Theme and color scheme controls
- `FrontmatterBlockResolver` - Frontmatter display block
- `AuthorsResolver` - Author display
- `AffiliationsResolver` - Affiliation display
- `DOIResolver` - DOI links
- `DownloadsResolver` - Download buttons/dropdowns
- `LaunchButtonResolver` - Jupyter/Binder launch buttons
- `LicenseBadgesResolver` - License badges
- `SocialLinksResolver` - Social media links

See: `packages/myst-awesome/src/components/FRONTMATTER_RESOLVERS.md`

### 2. Frontmatter Resolver Pattern

Granular overrides for frontmatter components.

```astro
// FrontmatterBlockResolver.astro
interface Props {
  frontmatter: ProjectAndPageFrontmatter;
  component?: any;      // Full override
  components?: {        // Granular overrides
    authors?: any;
    doi?: any;
    downloads?: any;
    // ...
  };
}
```

**Usage in DocsLayout:**

```astro
<!-- Override entire frontmatter block -->
---
import CustomFrontmatter from './custom/MyFrontmatterBlock.astro';
---
<DocsLayout 
  frontmatterComponent={CustomFrontmatter}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <slot />
</DocsLayout>

<!-- Override specific sub-components -->
---
import CustomAuthors from './custom/MyAuthors.astro';
import CustomDOI from './custom/MyDOI.astro';
---
<DocsLayout 
  frontmatterComponents={{ 
    authors: CustomAuthors,
    doi: CustomDOI
  }}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <slot />
</DocsLayout>
```

### 3. Layout Slots Pattern

Named slots for flexible composition.

**BasePage.astro slots:**
- `banner` - Top banner area
- `header` - Main header
- `subheader` - Below header
- `navigation` - Sidebar navigation (left)
- `navigation-header` - Navigation header slot
- `navigation-footer` - Navigation footer slot
- `main-header` - Content area header
- `main-footer` - Content area footer
- `aside` - Right sidebar (typically TOC)
- `footer` - Page footer
- `skip-to-content` - Skip navigation link

**Usage:**

```astro
<BasePage title="My Page">
  <NavigationMenu slot="navigation" items={navItems} />
  <TableOfContents slot="aside" items={tocItems} />
  
  <!-- Default slot for main content -->
  <h1>Main Content</h1>
  <p>Page content goes here...</p>
</BasePage>
```

### 4. Responsive Data Attributes

Use `data-*` attributes for responsive behavior instead of media queries alone.

```astro
<!-- Component sets data-view attribute -->
<div 
  class="page-layout" 
  data-view={isMobile ? 'mobile' : 'desktop'}
  data-nav-open={navOpen}
  data-mobile-breakpoint="768px"
>
```

**CSS targets data attributes:**

```css
/* Mobile-specific styles */
.page-layout[data-view="mobile"] .mobile-nav-toggle {
  display: block !important;
}

/* Navigation state */
.page-layout[data-nav-open="true"] .page-menu {
  transform: translateX(0);
}
```

**JavaScript updates attributes:**

```javascript
const mobileBreakpoint = 768;
const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);

const updateView = () => {
  const isMobile = mediaQuery.matches;
  document.querySelector('.page-layout')
    ?.setAttribute('data-view', isMobile ? 'mobile' : 'desktop');
};

mediaQuery.addEventListener('change', updateView);
updateView(); // Initial call
```

### 5. CSS Grid with :has() Selector

Responsive layouts using modern CSS.

```css
/* Dynamic grid based on content presence */
.page-body:has(.page-menu):has(.page-aside) {
  grid-template-columns: 15rem 1fr 15rem;
  grid-template-areas: "menu main aside";
}

.page-body:has(.page-menu):not(:has(.page-aside)) {
  grid-template-columns: 15rem 1fr;
  grid-template-areas: "menu main";
}

/* Fallback for browsers without :has() support */
@supports not (selector(:has(*))) {
  .page-body.has-menu.has-aside {
    grid-template-columns: 15rem 1fr 15rem;
  }
  
  .page-body.has-menu:not(.has-aside) {
    grid-template-columns: 15rem 1fr;
  }
}
```

### 6. Collection Access Pattern

Safe collection access with error handling.

```typescript
import { getCollection } from 'astro:content';

// Try-catch for optional collections
let projectConfig: any = null;
try {
  const collection = await getCollection('projectFrontmatter');
  projectConfig = collection?.[0] || null;
} catch (error) {
  console.warn('ProjectFrontmatter collection not found, using defaults');
  projectConfig = getDefaultConfig();
}

// Use projectConfig safely
const title = projectConfig?.title || 'Default Title';
```

### 7. MyST AST Rendering Pattern

Core content rendering pipeline.

```typescript
// Import renderer
import { renderMystAst } from '@awesome-myst/myst-awesome/lib/render-myst-ast';

// In page template
const htmlContent = await renderMystAst(page.data.mdast);
```

**Pipeline flow:**
1. Walk AST nodes recursively
2. Call `shiki-highlighter` for code blocks
3. Call `katex-renderer` for math equations
4. Generate HTML string with proper escaping

### 8. Base Directory Handling

Always prefix URLs with `baseDir` for subdirectory deployment.

```typescript
const baseDir = siteOptions?.base_dir || '';

// Construct full URL with baseDir
const fullUrl = entry.url.startsWith('/') 
  ? `${baseDir}${entry.url}` 
  : `${baseDir}/${entry.url}`;

// Use in links
<a href={fullUrl}>{entry.title}</a>
```

### 9. Sticky Element Coordination

Granular sticky control using CSS custom properties.

```astro
interface Props {
  disableSticky?: string[]; // ['banner', 'header', 'menu', 'aside']
}
```

```css
:root {
  --banner-height: 0px;
  --header-height: 4rem;
  --sticky-top: calc(var(--banner-height) + var(--header-height));
}

.page-aside.sticky {
  position: sticky;
  top: var(--sticky-top, 0);
  height: calc(100vh - var(--sticky-top, 0));
  overflow-y: auto;
}
```

### 10. Search Implementation

Client-side fuzzy search with Fuse.js.

```astro
// BasePage.astro always includes SearchDialog
<SearchDialog baseDir={baseDir} foldersOption="show" />

// SearchLauncher triggers dialog
<wa-button id="search-launcher">
  <wa-icon name="search"></wa-icon>
</wa-button>
```

**Search data fetching:**

```typescript
// SearchDialog.astro
const response = await fetch(`${baseDir}/fuse.json`);
const fuseData = await response.json();

const fuse = new Fuse(fuseData, {
  keys: [
    'frontmatter.title',
    'frontmatter.description',
    'frontmatter.keywords'
  ],
  threshold: 0.3,
  includeScore: true
});

const results = fuse.search(searchQuery);
```

---

## 6. Testing

### Test Configuration

#### Theme Tests (packages/myst-awesome/tests/)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4322',
  },
  webServer: {
    command: 'pnpm --filter=myst-awesome dev',
    url: 'http://localhost:4322',
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
```

#### Docs Tests (docs/tests/)

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:4321',
  },
  webServer: {
    command: 'pnpm dev', // Starts MyST + Astro via start-server-and-test
    url: 'http://localhost:4321',
    timeout: 30000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
    { name: 'Pixel 5', use: { ...devices['Pixel 5'] } },
  ],
});
```

### Test Categories

1. **Component Override Tests** - Verify custom components load correctly
2. **Layout Tests** - Check responsive grid behavior, viewport handling
3. **Visual Tests** - Theme switching, KaTeX rendering, search dialog
4. **Navigation Tests** - Mobile hamburger, drawer behavior, TOC
5. **Content Tests** - Page loading, MyST collections data

### Common Test Patterns

```typescript
import { test, expect } from '@playwright/test';

// Wait for visible content (avoid hidden drawer/dialog elements)
test('page loads correctly', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('.page-main h1', { 
    timeout: 15000, 
    state: 'visible' 
  });
  
  const heading = await page.locator('.page-main h1').textContent();
  expect(heading).toBeTruthy();
});

// Check viewport-dependent behavior
test('responsive behavior', async ({ page }) => {
  await page.goto('/');
  
  const viewportSize = page.viewportSize();
  const isMobile = viewportSize && viewportSize.width <= 768;
  
  if (isMobile) {
    await expect(page.locator('.mobile-nav-toggle')).toBeVisible();
  } else {
    await expect(page.locator('.mobile-nav-toggle')).toBeHidden();
  }
});

// Test data-view attribute switching
test('data-view attribute updates', async ({ page }) => {
  await page.goto('/');
  
  const dataView = await page.evaluate(() => {
    return document.querySelector('.page-layout')?.getAttribute('data-view');
  });
  
  const viewportSize = page.viewportSize();
  const expected = viewportSize && viewportSize.width <= 768 ? 'mobile' : 'desktop';
  expect(dataView).toBe(expected);
});

// Test responsive layout changes
test('layout adjusts on resize', async ({ page }) => {
  await page.goto('/');
  
  // Desktop view
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator('.page-menu')).toBeVisible();
  
  // Mobile view
  await page.setViewportSize({ width: 375, height: 667 });
  const dataView = await page.evaluate(() => 
    document.querySelector('.page-layout')?.getAttribute('data-view')
  );
  expect(dataView).toBe('mobile');
});
```

### CI Configuration

**.github/workflows/ci.yml:**

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-24.04, macos-15, windows-2022]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      
      - name: Install pnpm
        run: npm install -g pnpm@10.28.2
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps
        if: runner.os == 'Linux'  # Only needed on Linux
      
      - name: Build
        run: pnpm build
      
      - name: Test
        run: pnpm test
```

**Key points:**
- Matrix: Ubuntu 24.04, macOS 15, Windows 2022
- Node: 22
- Playwright: Install with `--with-deps` on Linux only
- Build order: collections → theme → docs
- Test execution: `pnpm test` (runs all packages)

### Running Tests

```bash
# All tests (from root)
pnpm test

# Package-specific
pnpm --filter=myst-awesome test           # Theme tests
pnpm --filter=myst-awesome-docs test      # Docs tests

# Single test file
pnpm --filter=myst-awesome exec playwright test tests/navigation.spec.ts

# Debug mode (opens browser)
pnpm --filter=myst-awesome exec playwright test --debug

# UI mode (interactive)
pnpm --filter=myst-awesome exec playwright test --ui

# Show report
pnpm --filter=myst-awesome exec playwright show-report

# Update snapshots
pnpm --filter=myst-awesome exec playwright test --update-snapshots
```

---

## 7. Content Collections (MyST → Astro)

### Overview

Bridge between MyST content server and Astro collections via custom loaders.

### Configuration

#### Docs (Full MyST Collections)

```typescript
// docs/src/content.config.ts
import { createMystCollections } from '@awesome-myst/myst-astro-collections';

export const collections = createMystCollections({
  server: { 
    baseUrl: 'http://localhost:3100',
    timeout: 10000,
    generateSearchIndex: true  // Creates public/book/fuse.json
  },
  project: { 
    configPath: 'myst.yml',
    staticConfig: {
      // Optional: mirrors myst.yml content
      // Used as fallback if server unavailable
    }
  }
});
```

**Generated collections:**
- `pages` - All MyST pages with full frontmatter and content
- `xref` - Cross-reference data for navigation
- `projectFrontmatter` - Project-level metadata

#### Theme (Static Collections)

```typescript
// packages/myst-awesome/src/content.config.ts
import { createProjectFrontmatterCollection } from '@awesome-myst/myst-astro-collections';

export const collections = {
  projectFrontmatter: createProjectFrontmatterCollection({
    staticConfig: {
      id: 'myst-awesome',
      title: 'MyST Awesome',
      description: 'A modern MyST theme',
      // ...static configuration
    }
  })
};
```

**Why static?** Theme package doesn't run MyST server, uses static config for demos.

### Usage in Astro

```typescript
import { getCollection } from 'astro:content';

// Get all pages
const pages = await getCollection('pages');

// Get project frontmatter (single entry, access first element)
const projectFrontmatter = (await getCollection('projectFrontmatter'))[0];

// Get xref data (cross-references)
const xrefs = await getCollection('xref');

// Safe access with try-catch
let pages = [];
try {
  pages = await getCollection('pages');
} catch (error) {
  console.warn('Pages collection not found:', error);
  pages = [];
}
```

### BaseDir Support

Set `site.options.base_dir` in `myst.yml` for subdirectory deployment:

```yaml
# myst.yml
site:
  options:
    base_dir: book  # Deploys to /book/ path
```

**Effects:**
- Collections loader auto-copies files to `public/${baseDir}/`
- All URLs must be prefixed with `baseDir`
- Search index written to `public/${baseDir}/fuse.json`

### Search Index Generation

When `generateSearchIndex: true`:

```typescript
// Loader creates public/${baseDir}/fuse.json
{
  server: {
    generateSearchIndex: true
  }
}
```

**Index structure:**

```json
[
  {
    "url": "/book/page-slug",
    "frontmatter": {
      "title": "Page Title",
      "description": "Page description",
      "keywords": ["keyword1", "keyword2"]
    }
  }
]
```

**SearchDialog fetches and uses:**

```typescript
const response = await fetch(`${baseDir}/fuse.json`);
const fuseData = await response.json();
const fuse = new Fuse(fuseData, { keys: [...] });
```

---

## 8. Configuration Files

### astro.config.mjs

#### Theme Package (port 4322)

```javascript
import { defineConfig } from 'astro/config';
import { faviconCopyPlugin } from './scripts/favicon-plugin.mjs';

export default defineConfig({
  server: { 
    port: 4322  // Avoid conflicts with docs
  },
  vite: {
    ssr: {
      noExternal: ['@awesome.me/webawesome']  // REQUIRED for SSR
    },
    define: {
      __THEME_CONFIG__: JSON.stringify(themeConfig)
    }
  },
  integrations: [
    // Custom plugin to copy favicon from docs/myst.yml
    faviconCopyPlugin()
  ]
});
```

#### Docs Package (port 4321)

```javascript
import { defineConfig } from 'astro/config';

export default defineConfig({
  server: { 
    port: 4321  // Default Astro port
  },
  vite: {
    ssr: {
      noExternal: ['@awesome.me/webawesome']  // REQUIRED
    }
  },
  // Theme config for component overrides
  themeConfig: {
    components: {
      // NavigationMenu: './src/custom/MyNav.astro'
    }
  }
});
```

**Key points:**
- `noExternal` is **REQUIRED** for Web Awesome SSR
- Different ports avoid conflicts (4322 vs 4321)
- faviconCopyPlugin reads favicon path from `myst.yml`
- themeConfig enables component overrides

### myst.yml

```yaml
version: 1

project:
  id: my-project
  title: My Project
  description: Project description
  authors:
    - name: Author Name
      email: author@example.com
  
site:
  template: myst-awesome-theme
  options:
    favicon: assets/favicon.ico  # Relative to myst.yml
    logo: assets/logo.png
    logo_text: My Project
    base_dir: book  # URL routing prefix (critical!)

plugins:
  - src/directives.mjs  # Custom MyST directives
```

**Important fields:**
- `base_dir` - Affects all URL generation (e.g., `/book/page` instead of `/page`)
- Can be overridden with `BASE_DIR` environment variable
- `favicon` path relative to `myst.yml` location
- `plugins` - Custom MyST directive extensions

### pnpm-workspace.yaml

```yaml
packages:
  - packages/*
  - docs
```

### Root package.json

```json
{
  "name": "myst-awesome-workspace",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "packageManager": "pnpm@10.28.2",
  
  "scripts": {
    "dev": "pnpm --filter=myst-awesome dev",
    "build": "pnpm --filter=myst-astro-collections build && pnpm --filter=myst-awesome build && pnpm --filter=myst-awesome-docs build",
    "test": "pnpm --filter=myst-astro-collections test && pnpm --filter=myst-awesome test && pnpm --filter=myst-awesome-docs test",
    "dev-docs": "pnpm --filter=myst-awesome-docs dev"
  },
  
  "pnpm": {
    "overrides": {
      "@awesome-myst/myst-zod": "^0.6.1",
      "astro": "5.14.1",
      "@awesome.me/webawesome": "^3.1.0",
      "@playwright/test": "^1.57.0",
      "mystmd": "^1.8.0",
      "myst-common": "^1.9.3"
    },
    "onlyBuiltDependencies": ["esbuild"]
  }
}
```

**Critical `pnpm.overrides`:**
- Ensures consistent versions across all workspace packages
- Prevents version conflicts between packages
- `onlyBuiltDependencies` - Only rebuild esbuild (performance)

### TypeScript Configs

**Theme & Docs:**

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

**Collections:**

```json
{
  "compilerOptions": {
    "strict": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "declaration": true,
    "outDir": "./dist"
  }
}
```

---

## 9. Build & Deployment

### Build Order (CRITICAL)

```bash
# MUST follow this exact order - dependency chain!
pnpm --filter=myst-astro-collections build  # 1. Compile loaders
pnpm --filter=myst-awesome build            # 2. Build theme
pnpm --filter=myst-awesome-docs build       # 3. Build docs

# Or use convenience script (runs all in order)
pnpm build
```

**Why this order?**
- Theme depends on compiled collection loaders
- Docs depends on built theme package
- Breaking order causes build failures

### Pre-Build Steps

#### Docs Build Process

```bash
# 1. Setup assets (run automatically by docs build script)
npm run setup-assets  # Copies scienceicons, reads myst.yml

# 2. Start MyST server and build
start-server-and-test myst-content-server http://localhost:3100/myst.xref.json "astro build"
```

**What setup-assets does:**
- Reads `base_dir` from `myst.yml`
- Calls `setupScienceiconsForDocs(publicDir, baseDir)`
- Copies scienceicons to `public/book/scienceicons/`

### Output Directories

```
packages/myst-awesome/
  └── dist/              # Theme build output (Astro static files)

packages/myst-astro-collections/
  └── dist/              # Compiled TypeScript (loaders, collections, types)

docs/
  ├── dist/              # Static site (DEPLOY THIS!)
  ├── public/book/       # MyST generated content (JSON, assets)
  └── _build/            # MyST build cache (gitignored)
```

**Deployment target:** `docs/dist/` contains the complete static site.

### Environment Variables

```bash
BASE_DIR=book          # Override myst.yml base_dir
CI=true                # Affects test behavior (retries, workers)
NODE_ENV=production    # Standard Astro build flag
```

### Static Asset Handling

- **Scienceicons:** Copied to `public/${baseDir}/scienceicons/` by `setup-assets.mjs`
- **Favicon:** Copied to `public/` by `faviconCopyPlugin` in `astro.config.mjs`
- **MyST Content:** Generated in `public/${baseDir}/` by MyST content server
- **Fuse Index:** Written to `public/${baseDir}/fuse.json` by collection loader

### Deployment Checklist

1. ✓ Run `pnpm install --frozen-lockfile` (CI/production)
2. ✓ Build in order: collections → theme → docs
3. ✓ Verify `docs/dist/` contains all assets
4. ✓ Check `docs/dist/book/fuse.json` exists for search
5. ✓ Test `base_dir` routing (e.g., `/book/index` not `/index`)
6. ✓ Verify favicon serves from `docs/dist/favicon.ico`
7. ✓ Verify scienceicons serve from `docs/dist/book/scienceicons/`
8. ✓ Test responsive layouts on mobile viewport (<768px)
9. ✓ Test theme switching (light/dark mode)
10. ✓ Test search functionality

### CDN Considerations

- **Static-Only:** All assets in `public/` are statically served
- **No SSR:** Astro SSG (Static Site Generation) - no server required
- **MyST Server:** Only needed at build time, not runtime
- **Large Files:** `fuse.json` can be large - consider caching strategy
- **Cache Headers:** Set appropriate cache headers for static assets
- **Port Configuration:** Only relevant for development, not production

### Deployment Targets

**Works with:**
- Netlify, Vercel, Cloudflare Pages
- GitHub Pages (with base_dir configuration)
- AWS S3 + CloudFront
- Any static hosting CDN

**Configuration for subdirectory deployment:**

```yaml
# myst.yml
site:
  options:
    base_dir: my-docs  # Subdirectory path
```

```javascript
// astro.config.mjs
export default defineConfig({
  base: '/my-docs/',  // Must match base_dir
});
```

---

## 10. Troubleshooting

### Port Conflicts

**Symptom:** Dev server won't start, "port already in use" error

**Cause:** Ports 3100 (MyST), 4321 (docs), or 4322 (theme) already in use

**Solution:**

```bash
# Find and kill processes on specific ports
lsof -ti:3100 | xargs kill -9
lsof -ti:4321 | xargs kill -9
lsof -ti:4322 | xargs kill -9

# Or on Windows
netstat -ano | findstr :3100
taskkill /PID <PID> /F

# Or change port in astro.config.mjs
export default defineConfig({
  server: { port: 4323 }  // Use different port
});
```

### Web Awesome Components Not Rendering

**Symptom:** Custom elements like `<wa-icon>`, `<wa-button>` don't render, appear as unknown elements

**Cause:** Components imported in frontmatter instead of `<script>` block

**Solution:**

```astro
<!-- ❌ WRONG - Will not work -->
---
import '@awesome.me/webawesome/dist/components/icon/icon.js';
import '@awesome.me/webawesome/dist/components/button/button.js';
---
<wa-icon name="star"></wa-icon>

<!-- ✅ CORRECT - Always use script block -->
<wa-icon name="star"></wa-icon>

<script>
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
  import '@awesome.me/webawesome/dist/components/button/button.js';
</script>
```

**Also check:** `noExternal: ["@awesome.me/webawesome"]` in `astro.config.mjs`

### Collections Not Found

**Symptom:** `getCollection('pages')` throws error "Collection does not exist"

**Cause:**
- Theme package uses static config, not MyST server
- MyST server not running in docs
- `content.config.ts` misconfigured

**Solution:**

```typescript
// Use try-catch wrapper for optional collections
let pages = [];
try {
  pages = await getCollection('pages');
} catch (error) {
  console.warn('Pages collection not found, using fallback');
  pages = [];
}

// Check content.config.ts configuration
import { createMystCollections } from '@awesome-myst/myst-astro-collections';
export const collections = createMystCollections({
  server: { baseUrl: 'http://localhost:3100' }  // Verify URL
});

// Ensure MyST server is running
pnpm start-myst  # Should start on port 3100
```

### Favicon Not Showing

**Symptom:** Favicon 404 error, not appearing in browser tab

**Cause:**
- `faviconCopyPlugin` can't find `docs/myst.yml`
- Path in `myst.yml` is incorrect
- Favicon file doesn't exist at specified path

**Solution:**

```javascript
// Check astro.config.mjs relative path
import { resolve } from 'path';
const mystConfigPath = resolve(__dirname, '../../docs/myst.yml');

// Verify myst.yml path (relative to myst.yml location)
site:
  options:
    favicon: assets/favicon.ico  # Check this file exists

// Manual copy if plugin fails
cp docs/assets/favicon.ico packages/myst-awesome/public/
```

### Mobile Navigation Issues

**Symptom:** Hamburger menu not showing or not working on mobile

**Cause:**
- `data-view` attribute not set correctly
- CSS media query mismatch with breakpoint
- JavaScript `mediaQuery` listener not attached

**Solution:**

```javascript
// Check BasePage.astro JavaScript
const mobileBreakpoint = 768;
const mediaQuery = window.matchMedia(`(max-width: ${mobileBreakpoint}px)`);

const updateView = () => {
  const isMobile = mediaQuery.matches;
  const layout = document.querySelector('.page-layout');
  layout?.setAttribute('data-view', isMobile ? 'mobile' : 'desktop');
};

mediaQuery.addEventListener('change', updateView);
updateView(); // IMPORTANT: Initial call
```

```css
/* Verify CSS matches breakpoint */
@media (max-width: 768px) {
  .mobile-nav-toggle {
    display: block !important;
  }
}

/* Use data-view attribute */
.page-layout[data-view="mobile"] .page-menu {
  /* Mobile-specific styles */
}
```

### KaTeX Math Not Rendering

**Symptom:** Math equations show as plain text or LaTeX code

**Cause:** KaTeX CSS not imported in layout

**Solution:**

```astro
// Add to BasePage.astro or your layout
---
import KaTeXStyles from '@awesome-myst/myst-awesome/components/KaTeXStyles.astro';
---

<KaTeXStyles />

<!-- Or import KaTeX CSS directly -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
```

### Search Index Missing

**Symptom:** Search dialog shows "No results found" for all queries

**Cause:**
- `generateSearchIndex: false` or not set
- MyST server not running during build
- `fuse.json` not generated or incorrect path

**Solution:**

```typescript
// content.config.ts - enable search index generation
export const collections = createMystCollections({
  server: { 
    baseUrl: 'http://localhost:3100',
    generateSearchIndex: true  // ← Enable this
  }
});

// Verify file exists after build
ls -la docs/dist/book/fuse.json

// Check SearchDialog baseDir prop
<SearchDialog baseDir={baseDir} />  // Must match myst.yml base_dir

// Test MyST server is reachable
curl http://localhost:3100/myst.xref.json
```

### Base Directory URL Issues

**Symptom:** Links 404 on deployment, work locally

**Cause:** `base_dir` in `myst.yml` not applied to URLs consistently

**Solution:**

```typescript
// Check DocsLayout receives baseDir prop
const baseDir = siteOptions?.base_dir || '';
<DocsLayout baseDir={baseDir} ...>

// Verify SearchDialog receives baseDir
<SearchDialog baseDir={baseDir} />

// Check URL construction throughout code
const fullUrl = entry.url.startsWith('/') 
  ? `${baseDir}${entry.url}` 
  : `${baseDir}/${entry.url}`;

// Verify astro.config.mjs base matches
export default defineConfig({
  base: '/book/',  // Must match myst.yml base_dir
});
```

### Build Failures in CI

**Symptom:** Tests pass locally, fail in CI (especially on Linux)

**Cause:** Playwright not installed with system dependencies

**Solution:**

```yaml
# .github/workflows/ci.yml
- name: Install Playwright Browsers
  run: pnpm exec playwright install --with-deps  # Add --with-deps
  if: runner.os == 'Linux'  # Only on Linux

# Or install specific browser
- name: Install Chromium
  run: pnpm exec playwright install chromium --with-deps
```

**Other CI issues:**

```bash
# Increase timeout for slow MyST startup
# docs/tests/playwright.config.ts
webServer: {
  timeout: 60000,  // Increase from 30000
}

# Check build logs for actual error
pnpm build 2>&1 | tee build.log
```

### Type Errors with Collections

**Symptom:** TypeScript errors on collection schemas, type mismatches

**Cause:** `@awesome-myst/myst-zod` version mismatch between packages

**Solution:**

```json
// Check root package.json overrides
"pnpm": {
  "overrides": {
    "@awesome-myst/myst-zod": "^0.6.1"  // Ensure consistent version
  }
}

// Delete node_modules and reinstall
rm -rf node_modules packages/*/node_modules docs/node_modules
pnpm install

// Check for duplicate versions
pnpm list @awesome-myst/myst-zod
```

### Responsive Layout Regressions

**Symptom:** Elements missing or misplaced on mobile/desktop, aside not collapsing

**Cause:** Grid template areas or `:has()` selector issues

**Solution:**

```css
/* Check BasePage.astro grid definitions */
.page-body:has(.page-menu):has(.page-aside) {
  grid-template-columns: 15rem 1fr 15rem;
  grid-template-areas: "menu main aside";
}

/* Add fallback for browsers without :has() */
@supports not (selector(:has(*))) {
  .page-body.has-menu.has-aside {
    grid-template-columns: 15rem 1fr 15rem;
  }
}

/* Use data-view for responsive behavior */
.page-layout[data-view="mobile"] .page-menu {
  position: fixed;
  transform: translateX(-100%);
}

.page-layout[data-view="mobile"][data-nav-open="true"] .page-menu {
  transform: translateX(0);
}

/* NEVER hide aside globally in BasePage - use grid collapse */
/* Docs-specific hiding should be in docs app only */
```

**Test expectations:**
- **Theme package:** Aside remains in DOM on mobile (grid collapses, not `display: none`)
- **Docs app:** TOC/aside may be hidden via docs-specific CSS (<920px)

### Stale Build Cache

**Symptom:** Changes not reflecting after build, old content showing

**Cause:** Astro or MyST build cache not cleared

**Solution:**

```bash
# Clear all caches
rm -rf docs/dist docs/_build docs/.astro
rm -rf packages/myst-awesome/dist packages/myst-awesome/.astro
rm -rf packages/myst-astro-collections/dist

# Clear node_modules if needed
rm -rf node_modules packages/*/node_modules docs/node_modules

# Reinstall and rebuild
pnpm install
pnpm build

# For aggressive cache clearing
rm -rf dist _build .astro node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## 11. Important Files Reference

### Must-Read Documentation

1. **AGENTS.md** (this file) - Core development guidelines for AI agents
2. **packages/myst-awesome/src/components/FRONTMATTER_RESOLVERS.md** - Resolver pattern details
3. **docs/src/COMPONENT_OVERRIDES.md** - Component override system guide
4. **packages/myst-astro-collections/README.md** - Collections usage and API
5. **README.md** - Project overview, quick start, contributing guidelines

### Core Implementation Files

6. **packages/myst-awesome/src/layouts/BasePage.astro** - Root layout with slots, sticky, responsive
7. **packages/myst-awesome/src/layouts/DocsLayout.astro** - Documentation layout wrapper
8. **packages/myst-awesome/src/lib/render-myst-ast.ts** - MyST AST → HTML rendering pipeline
9. **packages/myst-astro-collections/src/loaders.ts** - XRef, Pages, ProjectFrontmatter loaders
10. **packages/myst-astro-collections/src/collections.ts** - Collection factory functions

### Configuration Files

11. **packages/myst-awesome/astro.config.mjs** - Theme Astro config (port 4322, faviconPlugin)
12. **docs/astro.config.mjs** - Docs Astro config (port 4321, themeConfig)
13. **docs/myst.yml** - MyST project configuration (base_dir, favicon, logo)
14. **pnpm-workspace.yaml** + root **package.json** - Workspace setup and overrides

### Testing Files

15. **packages/myst-awesome/tests/playwright.config.ts** - Theme test configuration
16. **docs/tests/playwright.config.ts** - Docs test configuration (dual server)
17. **.github/workflows/ci.yml** - CI/CD pipeline (multi-OS, Playwright)

### Utility Libraries

18. **packages/myst-awesome/src/lib/shiki-highlighter.ts** - Code syntax highlighting
19. **packages/myst-awesome/src/lib/wa-scienceicons.ts** - Science icon integration
20. **packages/myst-awesome/src/lib/html-escape.ts** - HTML sanitization utilities

### Example Components

21. **packages/myst-awesome/src/components/examples/** - Custom component examples
22. **docs/src/pages/book/[...slug].astro** - Page template with docs-specific responsive CSS

### Build Scripts

23. **docs/scripts/setup-assets.mjs** - Pre-build asset setup (scienceicons, baseDir)
24. **packages/myst-awesome/scripts/copy-scienceicons.mjs** - Scienceicons copy utility

---

## Quick Reference Card

### Port Allocation
- **3100** - MyST content server (headless, required for docs)
- **4321** - Docs Astro dev server (with MyST integration)
- **4322** - Theme Astro dev server (standalone theme)

### Build Order
**ALWAYS:** collections → theme → docs

```bash
pnpm build  # Runs all in correct order
```

### Key Commands
```bash
pnpm dev              # Theme dev (:4322)
pnpm dev-docs         # Docs dev (:4321 + :3100)
pnpm test             # All tests
pnpm build            # Full build (correct order)
pnpm --filter=<pkg> <cmd>  # Package-specific command
```

### Critical Patterns
- ✅ Web Awesome imports in `<script>` blocks (NOT frontmatter)
- ✅ Try-catch for optional collections
- ✅ `baseDir` prefix for all URLs
- ✅ Resolver pattern for component overrides
- ✅ `data-view` attribute for responsive behavior
- ✅ `noExternal: ["@awesome.me/webawesome"]` in astro.config.mjs

### Common Pitfalls
- ❌ Importing Web Awesome components in frontmatter
- ❌ Missing `noExternal: ["@awesome.me/webawesome"]` in Vite config
- ❌ Forgetting `baseDir` prefix in URL construction
- ❌ Wrong build order (breaks dependencies)
- ❌ Using Conventional Commit format (use descriptive messages)
- ❌ Globally hiding aside with `display: none` in BasePage (use grid collapse)

### File Locations Quick Map
```
packages/myst-awesome/src/
  ├── components/          # 55+ components, *Resolver.astro pattern
  ├── layouts/             # BasePage, DocsLayout, ContentLayout
  └── lib/                 # render-myst-ast, shiki-highlighter, etc.

docs/
  ├── src/pages/           # Page templates ([...slug].astro)
  ├── content/             # MyST markdown files
  └── myst.yml             # MyST configuration (base_dir!)

packages/myst-astro-collections/src/
  ├── loaders.ts           # Collection loaders
  └── collections.ts       # Factory functions
```

### Responsive Breakpoints
- **Mobile:** ≤768px (data-view="mobile")
- **Desktop:** >768px (data-view="desktop")
- **Docs TOC hiding:** ≤920px (docs-specific CSS)

### Debug Checklist
1. ✓ Are all dev servers running? (check ports 3100, 4321, 4322)
2. ✓ Is build order correct? (collections → theme → docs)
3. ✓ Are Web Awesome components in `<script>` blocks?
4. ✓ Is `noExternal` set in astro.config.mjs?
5. ✓ Are URLs prefixed with `baseDir`?
6. ✓ Is MyST server reachable at :3100/myst.xref.json?
7. ✓ Does `fuse.json` exist at `public/${baseDir}/fuse.json`?

---

**Version:** 2.0.0 (Consolidated with copilot-instructions.md)  
**Last Updated:** 2026-01-30  
**Maintained By:** awesome-myst team
