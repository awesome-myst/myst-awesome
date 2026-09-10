---
title: Dependency updates
description: P0 staged upgrade of Astro, Web Awesome, MyST, rendering dependencies, and test tooling.
---

This is the first implementation step in the roadmap (P0). It establishes the supported build toolchain, pins one coherent MyST release family, and creates a known-good baseline before schema or renderer-parity work changes behavior.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P0 | L | None — land before every other roadmap document |

## Overview

Upgrade in small, reversible pull requests rather than one lockfile rewrite. The target is Astro 7.3.2, Web Awesome 3.12.0, MyST 1.10.x, current rendering libraries, and Playwright 1.62.1; keep TypeScript on the latest 6.x line for now rather than adopting TypeScript 7 in this Astro workspace.

The dependency PRs must update the root override policy **and** every direct consumer. `pnpm.overrides` is the guardrail; it does not replace correct direct ranges in `packages/myst-awesome/package.json`, `packages/myst-astro-collections/package.json`, and `docs/package.json`.

## Background and references

Astro 6 requires Node 22.12.0 or later, upgrades the bundler to Vite 7, upgrades its Zod dependency to Zod 4, and changes the `astro:schema` import to `astro/zod`; it also has integration/adapter changes around Vite Environments. Read and execute the applicable checks in the [official Astro 6 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v6/).

Astro 7 upgrades to Vite 8, makes the Rust compiler the only compiler, reserves `src/fetch.ts`, changes default `compressHTML` whitespace behavior, and moves the default Markdown pipeline to Sätteri. The docs app and theme have custom Vite configuration and Astro templates, so validate these items against the [official Astro 7 upgrade guide](https://docs.astro.build/en/guides/upgrade-to/v7/).

The collection package imports `defineCollection` and `z` from `astro:content`; therefore content-collection build/type checks are a first-class migration gate, not a docs-only smoke test ([current collection implementation](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/collections.ts)).

TypeScript 7.0 is now the native compiler release, but it does not ship a stable programmatic API; Microsoft specifically says Astro and other embedded-language workflows should continue using TypeScript 6 for now. Treat TS 7/`tsgo` as an opt-in experiment, not this upgrade's compiler baseline ([TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)).

The existing theme has a Vite `noExternal` rule for Web Awesome and direct deep imports for its components, which makes Web Awesome a behavior-tested upgrade rather than a version-only change ([theme Astro configuration](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/astro.config.mjs), [layout component imports](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/DocsLayout.astro)).

## Current state in myst-awesome

- Root `package.json` currently overrides Astro, Web Awesome, myst-zod, Playwright, mystmd, and myst-common; expand this policy rather than letting workspace packages resolve incompatible MyST minors ([root manifest](https://github.com/awesome-myst/myst-awesome/blob/main/package.json)).
- The theme directly uses Astro, Web Awesome, myst-parser, myst-transforms, Shiki, KaTeX, Lit, Fuse, Sharp, Science Icons, TypeScript, and myst-zod ([theme manifest](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/package.json)).
- `myst-astro-collections` imports Astro content APIs and myst-zod, so its Astro and TypeScript ranges must move with the theme ([collection manifest](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/package.json)).
- The docs app has its own older Astro, MyST extension, Sharp, TypeScript, and Playwright entries; leaving these behind would defeat the root overrides and obscure install-time failures ([docs manifest](https://github.com/awesome-myst/myst-awesome/blob/main/docs/package.json)).
- `docs/pixi.toml` allows `mystmd >=1.3.25,<2`; retain that compatible range but raise its lower bound to `>=1.10.1` so the headless content server emits the same AST family tested in Node ([Pixi configuration](https://github.com/awesome-myst/myst-awesome/blob/main/docs/pixi.toml)).

## Upstream implementation pointers

- Use the [Astro 6 guide](https://docs.astro.build/en/guides/upgrade-to/v6/) for the Node 22.12+, Vite 7, Zod 4, content-schema import, and integration review; use the [Astro 7 guide](https://docs.astro.build/en/guides/upgrade-to/v7/) for Vite 8, compiler strictness, Markdown, and whitespace validation.
- `myst-spec-ext` 1.10.0 is a compatibility/re-export package over `myst-spec`, and the upstream package manifest declares the same MyST-family release ([upstream package manifest](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/package.json), [upstream exports](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/index.ts)).
- Keep the renderer's imports aligned with the new parser/transform types; it imports myst-zod types and applies MyST transforms before rendering ([renderer entry point](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)).
- Verify component names and deep-import paths against the Web Awesome 3.12 documentation during implementation; do not infer that beta-era package exports remain stable ([Web Awesome documentation](https://webawesome.com/docs/)).

## Implementation guidance

### Target dependency policy

The policy has two halves, and they are not interchangeable:

- **Root `pnpm.overrides` are exact versions**, with no range operator. An override exists to collapse a dependency to one installed copy; a caret there re-admits the duplicate majors/minors this policy is meant to eliminate, and it makes `pnpm why` output non-reproducible between checkouts.
- **Direct consumer manifests use compatible caret ranges** so each workspace package still publishes a usable range to its own downstream consumers. `astro` is the exception: it is pinned exactly everywhere because the Astro 6/7 migrations are gated per PR.

Re-run `pnpm install` once per PR and commit the resulting `pnpm-lock.yaml`. The exact values below are targets as of writing; confirm the current release at implementation time and pin to that version rather than carrying a stale number forward.

| Dependency | Root `pnpm.overrides` | `packages/myst-awesome` | `packages/myst-astro-collections` | `docs` |
| --- | --- | --- | --- | --- |
| `astro` | `7.3.2` | `7.3.2` | `7.3.2` | `7.3.2` |
| `@awesome.me/webawesome` | `3.12.0` | `^3.12.0` | — | `^3.12.0` |
| `mystmd` | `1.10.1` | — | — | `^1.10.1` |
| `myst-parser` | `1.7.3` | `^1.7.3` | — | `^1.7.3` |
| `myst-transforms` | `1.3.50` | `^1.3.50` | — | — |
| `myst-common` | `1.10.0` | — | — | `^1.10.0` |
| `myst-spec-ext` | `1.10.0` | `^1.10.0` | — | — |
| `@awesome-myst/myst-zod` | `0.7.0` | `^0.7.0` | `^0.7.0` | indirect/workspace |
| `shiki` | — | `^4.4.3` | — | — |
| `katex` | — | `^0.18.4` | — | — |
| `lit` | — | `^3.3.3` | — | — |
| `fuse.js` | — | `^7.5.0` | — | remove root-only duplicate or set `^7.5.0` |
| `sharp` | `0.35.3` | `^0.35.3` | — | `^0.35.3` |
| `scienceicons` | — | `^0.0.14` | — | — |
| `@playwright/test` | `1.62.1` | dev `^1.62.1` | — | dev `^1.62.1` |
| `typescript` | `6.0.2` | `^6.0.2` | dev `^6.0.2` | `^6.0.2` |

Bumping a pinned override is a normal, reviewable one-line change; treat it as the intended maintenance cost of deduplication rather than a reason to widen the override to a range.

Overrides serve a second purpose beyond deduplication: holding the installed tree to the declared Node floor. A transitive dependency is free to declare an `engines.node` higher than this repository supports, and neither `pnpm install` nor a local run on a newer Node will surface it. Pin such a package to the newest version compatible with the floor, and prefer that to raising the floor itself — the floor is a promise this repository makes to consumers of its published packages, so it should move only when a direct dependency actually requires it. After changing Astro or any package that carries a large transitive tree, check the regenerated lockfile for `engines` entries above the floor rather than assuming a green local run covers it. The check is mechanical and worth scripting: walk `node_modules/.pnpm`, read each package's `engines.node`, and report every range the floor does not satisfy.

The `unifont` pin is the standing example, and Astro 7 sharpened it. Astro 7.3.2 declares `unifont@~0.7.5`, but every unifont from 0.7.5 onward depends on `undici@^8`, and every undici 8.x release declares `engines.node >=22.19.0`. Holding `unifont` at `0.7.4` therefore keeps the override deliberately *outside* the range its dependent declares, which is the price of the 22.12.0 floor; it is safe here only because this workspace does not use Astro's font APIs, so unifont is never loaded. Revisit the pin — not the floor — whenever Astro's unifont range moves again, and drop it entirely once a `undici` release supports the floor or Astro's own requirements force the floor up.

Version targets should be checked in their package release notes at implementation time: [Astro](https://www.npmjs.com/package/astro), [Web Awesome](https://www.npmjs.com/package/@awesome.me/webawesome), [MyST](https://www.npmjs.com/package/mystmd), [Shiki](https://www.npmjs.com/package/shiki), [KaTeX](https://www.npmjs.com/package/katex), [Playwright](https://www.npmjs.com/package/@playwright/test), and [myst-zod](https://www.npmjs.com/package/@awesome-myst/myst-zod).

### Files and package edits

1. Modify `package.json`: replace all six existing overrides, add `myst-parser`, `myst-transforms`, `myst-spec-ext`, `sharp`, and TypeScript overrides, and either remove the root `fuse.js` dependency if unused or align it to `^7.5.0`.
2. Modify `packages/myst-awesome/package.json`: update every direct target in the table, add runtime/type dependency `myst-spec-ext`, and align the Playwright dev dependency. Keep `@astrojs/check` in a separate follow-up if its Astro 7 compatibility requires a version change.
3. Modify `packages/myst-astro-collections/package.json`: raise Astro, myst-zod, and TypeScript ranges together; inspect `src/types.d.ts` after the Astro content-collections type changes ([ambient declaration](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/types.d.ts)).
4. Modify `docs/package.json`: update Astro, Web Awesome, MyST packages, Sharp, TypeScript, and Playwright. Retain MyST extension packages until the docs build proves whether their 1.10.1 counterparts are required, then make a dedicated consistency PR.
5. Modify `docs/pixi.toml`: set `mystmd = ">=1.10.1,<2"`; leave Deno and Node constraints alone unless Astro validation requires Node 22.12+ exactly.
6. Regenerate `pnpm-lock.yaml`; run `pnpm why` for Astro, Web Awesome, myst-parser, myst-common, myst-zod, and Zod to find duplicate majors.

### Ordered upgrade sequence

1. **PR 1 — toolchain floor:** declare Node `>=22.12.0` in the repository's supported-engines documentation/CI setup, raise the Pixi MyST floor, and confirm all three CI operating systems install Node 22. This isolates environment rollback.
2. **PR 2 — Astro 5 to 6:** move every direct Astro range and the override to the current 6.x release first; update `astro:content`/`astro:zod` usage if the build exposes it, inspect custom Vite hooks, and resolve Zod 4 type failures. Declare the dev server's late-discovered client dependencies in `optimizeDeps.include` (see below). Do not combine with Web Awesome changes.
3. **PR 3 — Astro 6 to 7:** move to 7.3.2 and Vite 8; build the theme and docs, check every `.astro` template for invalid/unclosed markup, inspect whitespace-sensitive prose, and check that no `src/fetch.ts` is unintentionally present.
4. **PR 4 — Web Awesome 3.12.0:** update the root/theme/docs ranges; validate imports in `DocsLayout.astro`, `ContentLayout.astro`, `SearchDialog.astro`, and all custom-element selectors. Confirm the `noExternal`/`optimizeDeps` workarounds still have a reason before retaining them; `optimizeDeps.exclude` for Web Awesome is load-bearing as of the Astro 6 migration, so removing it requires a cold-start dev-server check, not just a green warm test run. This PR also owns a defect the Astro 7 whitespace change exposed: on the docs home page (`docs/src/pages/index.astro`, which renders `ThemeControls` inside `BasePage`) `wa-select` and `wa-option` never register, while `wa-button` does, so the theme selector renders its ten `<wa-option>` labels as a run of plain text in the header. Fix the registration rather than the spacing — the `{" "}` treatment is wrong for options that are meant to become a dropdown. The planned `dependency-smoke.spec.ts` should assert registration on this route specifically, since the layouts that do work would otherwise hide it.

   *Outcome.* Pinned to an exact `3.12.0` — the release current at implementation time, confirmed against the registry as this document instructs rather than taken from a written target. The version tables above were updated to match. Three findings are worth carrying forward. First, the registration defect is not specific to the docs home page: `ThemeControls.astro` never registered the elements it renders and only worked because `ThemeControlsResolver.astro` imported them, and `ContentLayout.astro` never registered `wa-avatar`, `wa-badge`, `wa-input` or `wa-tag` at all, so `/blog-example` had the same defect. The fix is per-component imports, and `scripts/check-webawesome-registration.mjs` now walks each page's `.astro` import graph so the class of defect fails a check rather than a reviewer's eye — it reads the installed package to learn which elements each module actually defines, because `tab-group.js` legitimately defines `wa-tab` and `wa-tab-panel` too. Second, `dist/utilities/icon-library.js` no longer exists; `registerIconLibrary` moved to `dist/components/icon/library.js` (the package root also re-exports it). Third, long-form `size` values are deprecated in favour of `s`/`m`/`l`, which every Web Awesome element in the workspace now uses.
5. **PR 5 — MyST family and myst-zod:** update mystmd, parser, transforms, common, spec-ext, and myst-zod atomically. Add `myst-spec-ext` before roadmap 12 consumes its type surface. Build the headless docs server and inspect serialized ASTs.
6. **PR 6 — renderer libraries:** upgrade Shiki 4, KaTeX 0.18, Sharp 0.35, Lit 3.3.3, Fuse 7.5, and Science Icons 0.0.14; adjust `shiki-highlighter.ts`, `katex-renderer.ts`, `wa-scienceicons.ts`, and search code only where compilation or snapshots require it. Shiki 4 also collapses the duplicate Shiki major that Astro 6 introduced. Keep the `optimizeDeps.include` lists in both Astro configs in step with any import path that moves.
7. **PR 7 — test tooling and TypeScript:** upgrade Playwright; move to TypeScript 6.0.2 or the latest compatible 6.x patch after `astro check` and `tsc` are clean, and pin the root override to whichever patch is selected. Do not replace `tsc` with `tsgo`.

### Astro and TypeScript migration gates

- Before PR 2, add/confirm CI uses Node 22.12.0+. Astro 6 no longer supports Node 18 or 20 ([Astro 6 Node requirement](https://docs.astro.build/en/guides/upgrade-to/v6/)).
- Validate each dependency PR on the exact Node version the CI matrix pins, not merely on the development machine. A newer local Node silently satisfies engine floors that CI does not, so a green local run is not evidence that the supported floor still builds.
- Search `packages/` and `docs/` for `astro:schema`; replace it with `astro/zod` only where present, and do not make speculative source edits.
- Review the two `vite` objects and the theme's `astro:config:setup` integration under Vite 7/8; adapter-only changes are unlikely here but plugin-hook behavior must be verified ([scienceicons integration](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/integrations/scienceicons.ts)).
- Declare every client dependency that Vite cannot reach from its cold-start scan in `optimizeDeps.include`. Vite 7 discovers dependencies imported from `.astro` `<script>` blocks and from lazily loaded client modules only when a route is first requested, then re-optimizes and broadcasts a full page reload; a parallel browser test run racing that reload fails with `504 (Outdated Optimize Dep)`, destroyed execution contexts, and reset `window` hooks. The theme lists its own dependencies by name; the docs app reaches the same modules through the linked `@awesome-myst/myst-awesome` workspace package and must use Vite's `parent > dep` syntax. Verify with a cold dev server (`rm -rf node_modules/.vite .astro`) and confirm no `new dependencies optimized` line appears while routes load in parallel.
- Run an Astro 7 markup pass over layouts, components, and pages because the Rust compiler is stricter about malformed HTML ([Astro 7 compiler migration](https://docs.astro.build/en/guides/upgrade-to/v7/)). Do not discover these one build at a time: `@astrojs/compiler-rs` exposes `transform()`, so a short script can compile every `.astro` file in the workspace and print the files the parser rejects in one pass. Note that a rejected file is reported as an `error`-severity entry in the returned `diagnostics` array rather than as a thrown exception, and that `find -name '*.astro'` also matches the generated `.astro/` cache directories unless `-type f` is given.
- The Rust compiler applies JSX rules inside `{...}` expressions, where the Go compiler accepted HTML. Two constructs are silently valid under Astro 6 and hard parse errors under Astro 7: an HTML `<!-- comment -->` inside an expression, which must become `{/* comment */}`, and a ternary branch containing sibling elements, which must be wrapped in a single `<Fragment>`.
- Treat the `compressHTML` default change from `true` to `'jsx'` as a behavioral diff to be measured, not eyeballed. Build once with the Astro 7 default and once with `compressHTML: true` restored, then compare the two outputs: JSX rules delete the whitespace between a text line and an element on the next line, where Astro 6 collapsed it to one space. Compare `document.body.innerText` in a browser rather than the raw HTML — raw-HTML diffs report every block-level tag boundary, and only a browser knows that whitespace inside a flex container with a `gap` never rendered. Repair the affected templates with `{" "}` rather than opting out with `compressHTML: true`; MyST prose injected through `set:html` is a runtime string and is not affected either way.
- Astro 7.2 starts `astro dev` as a background process when it detects an AI coding agent (via `am-i-vibing`, which reads markers such as `CLAUDECODE`), and the foreground command then returns as soon as the server is ready. Playwright supervises `webServer` as a foreground process and aborts the whole run with "Process from config.webServer exited early", so both Playwright configs set `env: { ASTRO_DEV_BACKGROUND: "0" }`. GitHub Actions does not set those markers, so this fails only for contributors running the suites from an agent — keep the opt-out in the config rather than relying on a shell variable.
- Do not select TS 7 for this repository now: `astro check` and editor/template tooling depend on programmatic compiler integration that TS 7 has not yet restored. Re-evaluate after Astro documents TS 7 support and TypeScript ships its stable API ([TypeScript 7 compatibility guidance](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)).

### Validation and rollback

For each PR run `pnpm install --frozen-lockfile`, `pnpm run build`, `pnpm test`, and the focused command for the changed workspace. The root scripts already compose collection build, theme build, docs build, and both Playwright suites ([root scripts](https://github.com/awesome-myst/myst-awesome/blob/main/package.json)).

Every PR in this sequence is browser-facing by definition, so each one runs the browser-facing CI tier defined in [13-testing-strategy.md](13-testing-strategy.md) — theme Chromium, Firefox, and WebKit plus the docs desktop and mobile projects — as a required merge gate. That document is the single definition of the gate; do not maintain a second browser policy here. Run the complete Playwright matrix locally as well where practical ([theme Playwright config](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/playwright.config.ts), [docs Playwright config](https://github.com/awesome-myst/myst-awesome/blob/main/docs/tests/playwright.config.ts)).

Astro 7 makes the theme's cold-start dev server measurably slower — roughly 48–59 s per cold theme suite against 45–48 s on Astro 6 — and that is enough to surface a pre-existing race in the locally parallel test run. Across ten cold Astro 7 runs, two failed in the `chromium` project only, always on the same two waits: `window.__searchReady`, and a `.color-btn.active` that stays invisible because Web Awesome has not removed `wa-cloak` yet. Four cold Astro 6 runs and two cold Astro 7 runs under CI settings were clean. The distinguishing factor is `workers`, which the Playwright configs set to `1` under `CI` and leave at the default locally, so the parallel local run puts three browser projects on one cold dev server. Do not add retries or waits to these tests: the fix belongs with the Web Awesome loading work in PR 4, and until then a local cold-cache failure in exactly these two places should be re-run rather than treated as a regression.

PR 4 resolved both waits at their common root. `window.__searchReady` and the `.color-btn.active` class were each set from a `document.addEventListener('DOMContentLoaded', …)` registered inside an Astro client `<script>`, and a module that finishes evaluating after that event has already fired never sees it again — the listener is simply never called, no error is raised, and the only visible symptom is the missing setup. Because `.color-btn:not(.active)` is `display: none`, the whole colour-scheme toggle then has no visible button. `packages/myst-awesome/src/lib/dom-ready.ts` runs the callback immediately when `document.readyState` is past `loading`, and every DOM-ready hook in the theme goes through it.

The `optimizeDeps.exclude` for Web Awesome was re-checked against 3.12.0 on a cold dev server and is still load-bearing, though for a different reason than when it was added. Dropping it from the theme is harmless — four routes loaded in parallel from an empty `node_modules/.vite` with no re-optimization, and it removes a dev-only "Multiple versions of Lit loaded" warning — but dropping it from the docs app makes the home page answer its in-flight module requests with `504 (Outdated Optimize Dep)` and fail the dynamic import of Astro's client runtime. The theme reaches roughly forty Web Awesome deep imports from `<script>` blocks, and Vite's `parent > dep` syntax names one module at a time, so there is no practical `include` list for the linked-package case. Both configs therefore keep the exclusion.

Retaining it leaves one cold-cache effect in place, found while validating PR 4 and confirmed to predate it. Under a cold docs dev server with the local worker count, every `/book/*` route logs `Failed to load render module: TypeError: Importing a module script failed` and the MyST editor falls back to its "preview unavailable" string, because `wa-myst-editor` dynamically imports `render-myst-ast.ts` while Vite is still optimizing. The same cold run under `CI=1` — the single-worker setting CI uses — is clean, and no test fails either way, so this is a local-development degradation rather than a merge gate. Reproduce it with `rm -rf docs/node_modules/.vite docs/.astro && pnpm --filter=@awesome-myst/myst-awesome-docs test`, and fix it by making the editor's render module reachable from the cold-start scan rather than by retrying the import.

Rollback by reverting the single dependency PR, its manifest/lockfile pair, and any mechanically required source migration in the same revert. Never hand-edit transitive versions in `pnpm-lock.yaml`; restore the prior lockfile and rerun the previous frozen install. Keep an Astro 6 branch/tag until the Astro 7 CI matrix has passed twice on main.

### Upgrade risk register

| Risk | Early signal | Required response |
| --- | --- | --- |
| Astro/Vite break a custom plugin | build failure or missing favicon/science icon behavior | isolate the integration update and compare its hook use with the [Astro 6 Vite Environments notes](https://docs.astro.build/en/guides/upgrade-to/v6/) |
| Vite re-optimizes dependencies mid-test | browser tests fail only from a cold cache, with `504 (Outdated Optimize Dep)` or "execution context was destroyed" | add the late-discovered module to `optimizeDeps.include` in the affected Astro config; do not paper over it with test retries or waits |
| Astro 7 compiler exposes invalid templates | parser errors or changed DOM nesting | repair markup; do not suppress compiler errors ([Astro 7 Rust compiler guidance](https://docs.astro.build/en/guides/upgrade-to/v7/)) |
| `compressHTML: 'jsx'` deletes an intentional space | words or an icon and its label run together, with no build warning | add `{" "}` at the line break in the affected template; confirm with an `innerText` comparison against a `compressHTML: true` build, not by reading the diff of the emitted HTML |
| Astro auto-backgrounds `astro dev` under an AI agent | Playwright reports "Process from config.webServer exited early" and no test runs; `astro dev status` shows a server the harness did not start | set `ASTRO_DEV_BACKGROUND=0` in the Playwright `webServer` config, and stop the orphaned server with `astro dev stop` |
| Web Awesome deep import moves | module-not-found error or undefined custom element | update imports after checking [Web Awesome documentation](https://webawesome.com/docs/), then retain a component-registration test |
| MyST types drift from serialized content | collection/schema failure or renderer unknown-node warning | pin all MyST core packages to the target family and capture the AST as a fixture |
| native/image dependency differs by OS | Sharp installation/build failure in one matrix leg | keep Sharp in the same PR as its lockfile and retain the existing three-OS CI matrix |
| a transitive dependency declares a Node floor above the repository's | nothing locally, if the developer's Node is newer than the CI pin; an `EBADENGINE`/`Unsupported engine` failure for anyone installing with `engine-strict` | pin the offending package to the newest version compatible with the declared floor via `pnpm.overrides`; validate on the exact CI Node version rather than on the development machine |
| TypeScript 7 disrupts Astro templates | `astro check` or editor/type-plugin errors | revert to the approved TS 6.x line and wait for the programmatic API path ([TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/)) |

## Web Awesome theme availability

`ThemeControls.astro` offers ten themes, but the npm package ships only `default`, `awesome` and `shoelace`; `brutalist`, `glossy`, `matter`, `mellow`, `playful`, `premium` and `tailspin` are Web Awesome Pro themes. Selecting one therefore adds a `wa-theme-*` class with no stylesheet behind it, and `docs/src/pages/custom-themes.astro` demonstrates the `customThemes` prop with a jsDelivr URL for `premium.css` that answers 404. This is not a regression introduced by the version bump — it has been true since the beta — but it should be resolved deliberately: either restrict the selector to the themes the free package ships and document how a Pro subscriber adds the rest, or keep all ten and load the Pro stylesheets from a configured source. It belongs with the theming work rather than with a dependency PR.

## myst-zod notes

Upgrade the root and direct workspace ranges to `@awesome-myst/myst-zod ^0.7.0` in the MyST-family PR. The collections package validates MyST page/project/xref data through these schemas, while the theme imports its AST and frontmatter types ([collection schemas](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/collections.ts), [theme renderer imports](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)).

Do not migrate myst-zod to Zod 4 in this dependency PR. It is Deno-first and currently pins Zod 3 in `deno.json`; roadmap 12 owns the separate compatibility, Deno test, npm build, and release work ([myst-zod Deno configuration](https://github.com/awesome-myst/myst-zod/blob/main/deno.json)).

The Astro 6 migration makes that follow-up visible rather than optional. Astro 6 generates each collection's editor JSON schema with Zod 4's `z.toJSONSchema()`, which cannot read a Zod 3 schema object, so every build and dev-server start now logs `An error was encountered while creating the JSON schema for the "<collection>" collection. Proceeding without it. Error: TypeError: Cannot read properties of undefined (reading 'def')`. Astro catches the failure and continues, and runtime validation is unaffected because it goes through `safeParseAsync`, which Zod 3 also implements — only the generated `.astro/collections/*.schema.json` files are lost. This warning is the expected state until roadmap 12 moves myst-zod to Zod 4; do not suppress it, and treat its disappearance as one of that document's acceptance signals. Zod 3 and Zod 4 are therefore both installed on purpose until then, and the single-major expectation for Zod in the acceptance criteria below applies only after roadmap 12 lands.

## Tests to reproduce

- Reproduce the Astro content-collection build/type path in [the collection loader test](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/tests/test-yaml-loader.mjs) after each Astro PR.
- Re-run the theme's Web Awesome-heavy tests, especially [component overrides](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/component-overrides.spec.ts), [admonitions](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/admonition-rendering.spec.ts), and [search launcher](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/search-launcher.spec.ts).
- Re-run [KaTeX rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/katex-rendering.spec.ts), [image rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/image-rendering.spec.ts), and the docs [search dialog](https://github.com/awesome-myst/myst-awesome/blob/main/docs/tests/search-dialog.spec.ts) after the renderer-library PR.

## Tests to create

- Add `packages/myst-awesome/tests/dependency-smoke.spec.ts`: asserts Web Awesome custom elements used by layouts are registered and the docs-example route loads without console errors.
- Add `docs/tests/dependency-smoke.spec.ts` alongside it. The theme suite cannot reach the docs home page, and that route is the only one in the workspace that composes `ThemeControls` into `BasePage` directly, so the registration defect PR 4 fixed is only observable from the docs app's own Playwright project.
- Add `packages/myst-awesome/tests/astro7-whitespace.spec.ts`: visits prose containing adjacent inline elements and verifies intentional spaces survive; keep the expected behavior explicit rather than relying on a screenshot.
- Add `packages/myst-astro-collections/tests/astro7-content-collections.mjs`: imports the public collection builders and validates a representative page/xref/project payload after the Astro 7 migration.
- Add a CI `pnpm why`/duplicate-major diagnostic only on failure, not as a permanently noisy job.

## Acceptance criteria

- [x] Node 22.12.0+ is the documented and CI-tested floor before Astro 6 lands.
- [ ] Every root `pnpm.overrides` entry is an exact version with no range operator, and all three package manifests match the target policy.
- [x] `docs/pixi.toml` requires MyST 1.10.1 or later within the 1.x series.
- [x] Astro 5→6 and 6→7 land in distinct, revertible PRs.
- [ ] `pnpm run build` and `pnpm test` pass on Linux, macOS, and Windows CI.
- [ ] Web Awesome component registration, theme switching, search, KaTeX, Shiki code blocks, Sharp images, and Science Icons are visually checked.
- [ ] `pnpm why` shows a single intended major for Astro, Zod, MyST core packages, and myst-zod.
- [ ] TypeScript remains on a tested 6.x release; TS 7 is recorded as deferred with the official embedded-language rationale.

## Dependencies and ordering

This document has no predecessor and is the first roadmap implementation. Land it before [core AST parity](02-core-ast-parity.md), `12-myst-zod-updates.md`, and `13-testing-strategy.md`; those documents rely on MyST 1.10 types, the new myst-zod range, and the stable Astro 7/Playwright baseline.
