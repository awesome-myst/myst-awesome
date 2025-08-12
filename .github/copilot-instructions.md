# Copilot Instructions for MyST Awesome Theme

## Big Picture
- Monorepo (pnpm workspaces):
  - `packages/myst-awesome` – Astro theme (components, layouts, pages, tests)
  - `packages/myst-astro-collections` – Astro content collections pulling from MyST
  - `docs` – MyST content app (separate build/runtime) that consumes the theme
- Dual runtime in dev: Astro UI at :4321, MyST content server at :3100
- Slot-based layouts (Web Awesome pattern): `header`, `navigation`, `aside`, `main`, etc.
- Theme system via CSS classes: `wa-theme-{name}` + CSS custom properties
- Type safety: Astro + TypeScript strict; MyST data validated with `@awesome-myst/myst-zod`

## Critical Workflows
- From repo root:
  - `pnpm dev` – Theme dev server (:4321)
  - `pnpm dev-docs` – Starts MyST (:3100) and Astro for docs
  - `pnpm start-myst` – MyST headless server only
  - `pnpm build` – Build collections + theme
  - `pnpm build-collections` – Build `myst-astro-collections` only
  - `pnpm test` – Playwright tests (requires :4321 and :3100)
- Ignore older Deno task docs; this repo uses pnpm.

## Content Collections (MyST → Astro)
- Configure in `docs/src/content.config.ts`:
  ```ts
  import { createMystCollections } from "@awesome-myst/myst-astro-collections";
  export const collections = createMystCollections({
    server: { baseUrl: "http://localhost:3100", timeout: 10000 },
    project: { staticConfig: { /* mirrors myst.yml */ } }
  });
  ```
  - For search index generation, set `server.generateSearchIndex: true`.
- Usage in Astro: `await getCollection('pages')`, `(await getCollection('projectFrontmatter'))[0]`.

## Astro + Web Awesome Conventions
- Import Web Awesome CSS once in `BasePage.astro` for bundling:
  - `@awesome.me/webawesome/dist/styles/webawesome.css`
  - `@awesome.me/webawesome/dist/styles/themes/default.css`
- Import Web Awesome components inside a `<script>` block (not frontmatter), e.g.:
  ```astro
  <script>
    import '@awesome.me/webawesome/dist/components/button/button.js';
    import '@awesome.me/webawesome/dist/components/icon/icon.js';
  </script>
  ```
- SSR config: set `noExternal: ["@awesome.me/webawesome"]` in `astro.config.mjs` where needed.

## Layout & Responsive Rules (important for tests)
- Source of truth: `packages/myst-awesome/src/layouts/BasePage.astro`.
  - Grid defined with `:has()` and class fallbacks (`has-menu`, `has-aside`).
  - JS sets `data-view` on `.page-layout` via `matchMedia` using `mobileBreakpoint` (default 768px).
  - Do NOT globally hide the aside with `display: none` in shared layouts; collapse via grid instead.
- Docs-only responsive hiding lives in the docs app (example):
  - `docs/src/pages/book/[id].astro` adds `:global` CSS to hide TOC/aside ≤920px when needed.
- Named slots drive composition: `navigation` → sidebar, `aside` → TOC, default slot → main content.

## Testing
- Playwright tests live in `packages/myst-awesome/tests/` and `docs/tests/`.
- Expectations differ by context:
  - Theme package: aside should remain present on mobile (grid collapses; not `display:none`).
  - Docs app: TOC/aside hidden on mobile (<≈920px) to prevent empty space.
- Common failures: responsive regressions. Fix by adjusting grid/template areas vs. visibility, not by globally hiding elements in `BasePage.astro`.

## Key Files
- Theme:
  - `packages/myst-awesome/src/layouts/BasePage.astro` – root layout + theming, responsive behavior
  - `packages/myst-awesome/src/layouts/DocsLayout.astro` – docs layout built on BasePage
  - `packages/myst-awesome/src/components/*Resolver.astro` – component override system
- Docs app:
  - `docs/src/content.config.ts` – MyST → Astro collections
  - `docs/src/pages/book/[id].astro` – docs page + docs-only responsive CSS
  - `docs/myst.yml` – MyST project config; `docs/directives.mjs` – custom directives
- Collections pkg: `packages/myst-astro-collections/src/` – loader/validation glue

## Troubleshooting (dual servers)
- Ports:
  - Theme dev/tests: Astro on 4322 (see `packages/myst-awesome/astro.config.mjs` and tests’ baseURL).
  - Docs dev/tests: Astro on 4321; MyST on 3100 (see `docs/tests/playwright.config.ts` and `docs/package.json`).
- Timeouts/startup:
  - Theme tests start their own server via Playwright webServer (timeout 30s).
  - Docs scripts use `start-server-and-test` to boot MyST then Astro; increase timeout in `docs/tests/playwright.config.ts` if MyST is slow.
- Symptoms:
  - 404 for `/myst.xref.json` → MyST not running; use `pnpm dev-docs` or `pnpm --filter=myst-awesome-docs myst-content-server`.
  - Port in use → kill stray Astro/MyST or change port in config.
  - Flaky waits → confirm `reuseExistingServer` and bump `webServer.timeout`.

## Test-running tips
- Run all tests (root): `pnpm test`.
- Theme-only tests: `pnpm --filter=myst-awesome test`.
  - Target a spec: `pnpm --filter=myst-awesome exec playwright test packages/myst-awesome/tests/navigation-responsive-fix.spec.ts`.
  - UI baseURL: `http://localhost:4322` (set in `packages/myst-awesome/tests/playwright.config.ts`).
- Docs-only tests: `pnpm --filter=myst-awesome-docs test`.
  - Target a spec: `pnpm --filter=myst-awesome-docs exec playwright test docs/tests/toc-responsive.spec.ts`.
  - Dual startup handled by docs `dev` script (MyST 3100 → Astro 4321).
- Debugging:
  - Traces: open `.zip` via `npx playwright show-trace <path>` (trace is `on-first-retry`).
  - Increase `webServer.timeout` or `use.baseURL` as needed per config.

## Versions
- pnpm 9.x, Astro 5.x (TS strict), Web Awesome 3.x beta, MyST 1.3.x
- Workspace deps: `docs` consumes `myst-awesome` via `workspace:*`
