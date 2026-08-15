---
title: Testing strategy and spec conformance
description: A layered MyST AST conformance, upstream-regression, and browser visual/e2e test plan.
---

Build a test pyramid around the renderer: deterministic AST-to-HTML conformance first, targeted upstream regression fixtures second, then browser behavior and visual assertions. The test suite must make every supported node visible in a maintained feature-parity companion, rather than treating an absence of console warnings as support.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P1 | XL | `01-dependency-updates.md`, `12-myst-zod-updates.md` |

## Overview

Add a unit-level spec-conformance harness that feeds MyST specification YAML ASTs directly to `renderMystAst`, normalizes intentional theme differences, and compares checked-in HTML snapshots. Reproduce selected upstream transforms and HTML-renderer cases as focused regressions. Keep Playwright for rendered page semantics, Web Awesome behavior, responsive layouts, and visual change review—not as the only AST correctness signal.

The harness is a parity measurement, not a promise that myst-awesome emits byte-identical `myst-to-html` output. Its expected snapshots must encode the theme's intentional HTML choices, while unsupported cases are explicit `todo`/skip records with a linked roadmap issue.

## Background and references

MyST's specification repository provides YAML cases containing `mdast`, source MyST, expected HTML, and invalid markers. The verified fixture set is listed below and is the source corpus for AST conformance ([fixture directory](https://github.com/jupyter-book/myst-spec/tree/main/docs/examples)).

Upstream mystmd separates AST transformations from HTML serialization. Reproduce both classes selectively: transforms establish resolved-node semantics and `myst-to-html` supplies small serialization/security/state tests ([myst-transforms source tests](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-transforms/src), [myst-to-html tests](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-to-html/tests)).

The current renderer is an asynchronous switch over MyST AST nodes and invokes basic transforms before rendering. That makes a direct unit harness practical and more diagnostic than browser-only tests ([renderer implementation](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)).

## Current state in myst-awesome

- Theme tests are Playwright specs under `packages/myst-awesome/tests/`; the planning baseline calls this 19 specs, while the verified checkout currently contains additional diagnostic/layout specs. Preserve useful existing coverage and consolidate only after the new harness is stable ([theme test directory](https://github.com/awesome-myst/myst-awesome/tree/main/packages/myst-awesome/tests)).
- Theme Playwright runs Chromium, Firefox, and WebKit, starts the theme on port 4322, collects traces on first retry, and takes screenshots only on failure ([theme config](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/playwright.config.ts)).
- Docs Playwright additionally covers mobile Chrome and Mobile Safari and starts the docs app on port 4321 ([docs config](https://github.com/awesome-myst/myst-awesome/blob/main/docs/tests/playwright.config.ts)).
- CI already executes root build/test on Ubuntu, macOS, and Windows with Node 22 and uploads Playwright artifacts; extend this workflow rather than starting a parallel CI system ([CI workflow](https://github.com/awesome-myst/myst-awesome/blob/main/.github/workflows/ci.yml)).
- There is no renderer-unit test directory today. Create it adjacent to `src/lib/render-myst-ast.ts` so AST behavior is testable without starting Astro.

## Upstream implementation pointers

### Complete MyST spec fixture inventory

Run all valid cases from these verified YAML files; retain invalid cases as schema/parser validation cases and exclude them from `renderMystAst` snapshot input unless a dedicated invalid-AST behavior test exists.

| Fixture file | Primary coverage |
| --- | --- |
| [blocks.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/blocks.yml) | block breaks and blocks |
| [cmark_spec_0.30.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/cmark_spec_0.30.yml) | CommonMark compatibility corpus |
| [comments.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/comments.yml) | comments |
| [commonmark.basic.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.basic.yml) | basic text and emphasis |
| [commonmark.breaks.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.breaks.yml) | hard/soft breaks |
| [commonmark.code.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.code.yml) | inline and fenced code |
| [commonmark.headings.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.headings.yml) | headings |
| [commonmark.html.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.html.yml) | HTML nodes |
| [commonmark.links.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.links.yml) | links/images |
| [commonmark.lists.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.lists.yml) | ordered/unordered lists |
| [commonmark.paragraphs.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.paragraphs.yml) | paragraphs |
| [commonmark.quotes.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.quotes.yml) | blockquotes |
| [directives.admonitions.simple.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.admonitions.simple.yml) | simple admonitions |
| [directives.admonitions.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.admonitions.yml) | admonition variants |
| [directives.code.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.code.yml) | code directives |
| [directives.figure.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.figure.yml) | figures/captions/legends |
| [directives.generic.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.generic.yml) | unknown-directive fallback |
| [directives.image.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.image.yml) | image directives |
| [directives.math.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.math.yml) | display math |
| [directives.table.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.table.yml) | tables/list-tables |
| [footnotes.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/footnotes.yml) | footnotes |
| [references.equations.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.equations.yml) | equation references |
| [references.figures.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.figures.yml) | figure references |
| [references.headings.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.headings.yml) | heading references |
| [references.tables.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.tables.yml) | table references |
| [references.target.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.target.yml) | explicit targets |
| [roles.generic.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/roles.generic.yml) | unknown-role fallback |
| [roles.html.abbr.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/roles.html.abbr.yml) | abbreviations |
| [roles.html.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/roles.html.yml) | inline HTML roles |
| [roles.math.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/roles.math.yml) | inline math |
| [unist.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/unist.yml) | unist invariants |

### Relevant upstream regression tests

Reproduce these real upstream files as small, named assertions; do not copy the full upstream suite verbatim when a renderer has intentionally different markup.

| Area | Upstream source/fixture | myst-awesome purpose |
| --- | --- | --- |
| Admonitions | [admonitions.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/admonitions.spec.ts) | simple/callout transform shapes before `wa-callout` snapshots |
| Blocks | [blocks.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blocks.spec.ts) | block visibility and grouping |
| Captions/containers | [containers.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/containers.spec.ts), [blocks.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blocks.spec.ts) | figures, captions, tables |
| Footnotes | [footnotes.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/footnotes.spec.ts) | IDs, numbering, backreferences |
| HTML | [html.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/html.spec.ts), [html.yml](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/tests/html.yml) | sanitization/HTML policy |
| Indices | [indices.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/indices.spec.ts) | index node resolution |
| Math | [math.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/math.spec.ts), [mathSimplifications.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/mathSimplifications.spec.ts) | KaTeX inputs and labels |
| Numbering | [enumerate.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.spec.ts), [enumerators.yml](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/tests/enumerators.yml) | target/caption numbering |
| Links | [links/myst.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.spec.ts) | internal/MyST link behavior |
| TOC | [toc.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/toc.spec.ts) | page TOC data |
| HTML output | [html.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/html.spec.ts) | basic element serialization |
| HTML schema | [schema.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/schema.spec.ts) | keyboard/HAST mapping |
| HTML state | [state.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/state.spec.ts) | heading enumeration |
| HTML safety | [utils.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/utils.spec.ts) | attribute escaping |
| HTML transforms | [addenumerators.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/transforms/addenumerators.spec.ts), [addenumerators.yml](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/transforms/addenumerators.yml), [converthtml.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/transforms/converthtml.spec.ts), [converthtml.yml](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/tests/transforms/converthtml.yml) | numbering and HTML conversion regressions |

## Implementation guidance

### 1. Spec-conformance harness

1. Add a unit-test runner and script to `packages/myst-awesome/package.json` (Vitest is the recommended runner because upstream uses it; **verify Astro 7/Vite 8 compatibility when choosing its exact version**).
2. Create `packages/myst-awesome/src/lib/render-myst-ast.spec.ts` for direct renderer behavior and `packages/myst-awesome/tests/spec-conformance/myst-spec-render.spec.ts` for parameterized YAML cases.
3. Add `packages/myst-awesome/tests/spec-conformance/load-myst-spec-fixtures.ts`. Load local fixture files through a configured source path such as `MYST_SPEC_ROOT`; CI must checkout/pin the fixture revision or vendor a reviewed read-only fixture copy under `tests/fixtures/myst-spec/`. Do not fetch network content in test execution.
4. Parse YAML with `js-yaml`, iterate `cases`, skip `invalid: true`, validate `case.mdast` with the current myst-zod root schema where coverage exists, then pass it to `renderMystAst`.
5. Snapshot the output under `packages/myst-awesome/tests/spec-conformance/__snapshots__/`. Key snapshots by fixture basename and case `id`/title. Normalize newline endings and only normalize known nondeterminism such as generated IDs after documenting it.
6. Store case disposition in `packages/myst-awesome/tests/spec-conformance/manifest.ts`: `supported`, `partial`, `unsupported`, or `blocked-upstream`. A supported case must snapshot; partial/unsupported must assert the present behavior and link to a roadmap issue so `test.skip` does not silently expand.
7. Start with CommonMark basics, headings, links, lists, math, tables, figures, admonitions, footnotes, targets, and generic fallbacks. Enable extension fixtures only after the corresponding myst-zod schema and renderer document land.

Do **not** compare to `case.html` byte-for-byte. Compare to reviewed myst-awesome snapshots and optionally assert semantic invariants—e.g., table `th`/`td`, link `href`, escaped attributes, `wa-callout` kind—because the upstream expected HTML deliberately does not use the theme's Web Awesome components.

### 2. Upstream regression subset

Add `packages/myst-awesome/tests/upstream-regressions/` with focused data copied under an attribution header and a source URL. Each test name must retain the upstream filename/case title so it is searchable.

- `admonitions.spec.ts`: create ASTs mirroring the upstream transform outputs, then assert `wa-callout`/`wa-details`, title, and body markup.
- `blocks-and-containers.spec.ts`: cover blocks, figure/table containers, captions, legend, and enumerator markup.
- `footnotes-and-targets.spec.ts`: cover footnote anchors, target IDs, and cross-reference link text once feature support lands.
- `html-safety.spec.ts`: reproduce the dangerous-attribute escape expectation from myst-to-html utilities; test the theme's `html-escape.ts`, not a borrowed serializer ([theme HTML escape utility](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/html-escape.ts)).
- `math-and-code.spec.ts`: cover transformed math labels, KaTeX errors, Shiki language fallback, code line metadata, and safe raw handling.
- `toc-and-links.spec.ts`: cover heading hierarchy through `generate-page-toc.ts` and MyST/internal links through the renderer ([TOC generator](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/generate-page-toc.ts)).

### 3. Playwright visual and e2e conventions

Extend the existing suite with stable semantic locators and small purpose-specific pages. Use a new `packages/myst-awesome/src/pages/spec-fixtures.astro` that renders curated AST fixture routes through the same layout/renderer path; do not put hundreds of fixture cases into the landing page.

| Test file | Convention and assertions |
| --- | --- |
| `tests/spec-fixtures-rendering.spec.ts` | visit one fixture route per supported feature family; assert semantic HTML/custom-element role, text, href/src, and no console errors |
| `tests/spec-fixtures-visual.spec.ts` | Chromium-only `toHaveScreenshot` for cards/grids/tabs/admonitions/tables/math; use fixed viewport, reduced motion, local assets, and mask nondeterministic content |
| `tests/tabs-e2e.spec.ts` | keyboard navigation, selected panel state, and synced tabs |
| `tests/citations-xref-e2e.spec.ts` | citation text/link, cross-reference navigation, bibliography/target behavior after support lands |
| `tests/notebook-output-e2e.spec.ts` | output/outputs visibility, scrolling, and safe MIME fallback |
| `docs/tests/spec-content-e2e.spec.ts` | headless MyST server → collection loader → docs route integration using real docs content |

Keep existing `admonition-rendering.spec.ts`, `caption-rendering.spec.ts`, `image-rendering.spec.ts`, `katex-rendering.spec.ts`, `search-launcher.spec.ts`, component-override tests, theme-switching tests, and responsive-layout tests as regression owners, not duplicate screenshot files ([existing theme specs](https://github.com/awesome-myst/myst-awesome/tree/main/packages/myst-awesome/tests)).

Every screenshot test must set viewport/device explicitly, wait for fonts and custom elements, disable animation, and favor `locator.toHaveScreenshot()` over full-page snapshots. Every e2e assertion should be semantic first; screenshot changes require human review, with browser-specific baselines only when real rendering differences justify them.

### 4. CI matrix and execution order

Add explicit scripts: `test:unit`, `test:conformance`, `test:upstream-regressions`, `test:e2e`, and retain root `test` as the composed command. Do not make tests depend on a developer's globally running MyST server.

| CI tier | Trigger | Commands | Platform/browser scope | Required result |
| --- | --- | --- | --- | --- |
| Fast validation | every PR | `pnpm install --frozen-lockfile`, collection build, theme unit/conformance/regression tests | Ubuntu, Node 22 | deterministic AST/schema snapshots |
| Build | every PR | `pnpm run build` | Ubuntu, macOS, Windows, Node 22 | collection + theme + docs production builds |
| Theme e2e | every PR | theme `test:e2e` | Chromium on Ubuntu; full existing browser matrix nightly or before release | interactions and focused visuals |
| Docs e2e | every PR | docs Playwright | Chromium + mobile Chromium on Ubuntu; full docs matrix nightly/release | content server/collections integration |
| Full matrix | main/nightly/release | `pnpm test`, all Playwright projects | current three OS CI plus Chromium/Firefox/WebKit and docs mobile | cross-platform regression confidence |

Retain trace/screenshot/report artifact upload and add unit/conformance snapshot diffs to the same artifact group. The current CI has browser installation and artifact paths that can be extended directly ([existing workflow](https://github.com/awesome-myst/myst-awesome/blob/main/.github/workflows/ci.yml)).

## myst-zod notes

The conformance harness should call `rootSchema.safeParse` before rendering only for fixtures whose node coverage is declared supported by `12-myst-zod-updates.md`. During the migration, retain a manifest flag for fixtures that render under a permissive cast but cannot yet validate; this prevents schema lag from being mistaken for renderer success.

Add schema cases for each new fixture family first, then turn on renderer snapshots. A fixture may move from `unsupported` to `supported` only when both myst-zod parsing and renderer acceptance criteria are green.

## Tests to reproduce

- Reproduce all valid cases in the fixture inventory above through the direct renderer harness, beginning with [commonmark.basic.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/commonmark.basic.yml), [directives.table.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.table.yml), [directives.figure.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/directives.figure.yml), [footnotes.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/footnotes.yml), and [references.target.yml](https://github.com/jupyter-book/myst-spec/blob/main/docs/examples/references.target.yml).
- Reproduce the upstream test subset listed in “Relevant upstream regression tests,” including actual transform specs, `tests/*.yml`, and myst-to-html files before closing a corresponding parity row.
- Re-run the existing theme [admonition](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/admonition-rendering.spec.ts), [caption](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/caption-rendering.spec.ts), [image](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/image-rendering.spec.ts), and [KaTeX](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/tests/katex-rendering.spec.ts) browser tests after any renderer change.

## Tests to create

- Add the conformance loader, manifest, parameterized unit test, and reviewed snapshots described above.
- Add `render-myst-ast.spec.ts`, `upstream-regressions/*.spec.ts`, and focused extension-node unit tests as each renderer feature lands.
- Add the six named theme/docs Playwright specs in the browser convention table; add visual baselines only after semantic assertions pass.
- Add a `scripts/check-feature-parity.mjs` check that validates every `supported` row in the companion table names an existing fixture and test file.

### Feature-parity checklist companion

Maintain `packages/myst-awesome/tests/spec-conformance/feature-parity.md` as the companion artifact. The following table is its seed; the `status` field is deliberately conservative until the new harness runs.

| Node type/family | Fixture | Test file | Status |
| --- | --- | --- | --- |
| paragraph, text, emphasis, strong | `commonmark.basic.yml` | `render-myst-ast.spec.ts` | existing renderer; snapshot pending |
| headings, targets, TOC | `commonmark.headings.yml`, `references.target.yml` | `toc-and-links.spec.ts` | partial |
| links and images | `commonmark.links.yml`, `directives.image.yml` | `spec-fixtures-rendering.spec.ts` | partial |
| lists, blockquotes, thematic breaks | `commonmark.lists.yml`, `commonmark.quotes.yml` | `myst-spec-render.spec.ts` | snapshot pending |
| code and HTML safety | `commonmark.code.yml`, `commonmark.html.yml` | `math-and-code.spec.ts`, `html-safety.spec.ts` | partial |
| inline/display math | `roles.math.yml`, `directives.math.yml` | `math-and-code.spec.ts` | existing renderer; snapshot pending |
| tables | `directives.table.yml` | `myst-spec-render.spec.ts`, `spec-fixtures-visual.spec.ts` | unsupported |
| figures/captions/legends | `directives.figure.yml` | `blocks-and-containers.spec.ts` | partial |
| admonitions | `directives.admonitions.yml` | `admonitions.spec.ts`, `admonition-rendering.spec.ts` | existing renderer; snapshot pending |
| footnotes | `footnotes.yml` | `footnotes-and-targets.spec.ts` | partial |
| cross references | `references.*.yml` | `footnotes-and-targets.spec.ts`, `citations-xref-e2e.spec.ts` | unsupported |
| generic directive/role fallback | `directives.generic.yml`, `roles.generic.yml` | `myst-spec-render.spec.ts` | partial |
| tabs, cards, grids, buttons, icons | extension fixtures to add | `tabs-e2e.spec.ts`, `spec-fixtures-visual.spec.ts` | unsupported |
| aside/embed/iframe/mermaid/glossary/index | extension fixtures to add | extension unit + e2e tests | unsupported |
| inlineExpression/output/outputs/raw/download/span/div | extension fixtures to add | extension unit + notebook e2e tests | unsupported |

## Acceptance criteria

- [ ] Every valid YAML fixture is enumerated by the harness manifest with an explicit disposition.
- [ ] Supported AST cases have deterministic, reviewed myst-awesome HTML snapshots.
- [ ] Invalid YAML cases are never silently rendered as valid conformance cases.
- [ ] Focused upstream transform and myst-to-html regressions have source URLs and local named tests.
- [ ] Renderer unit, conformance, and upstream-regression tests run without Astro/Playwright.
- [ ] Playwright covers semantic behavior first and stable visual baselines second across feature pages.
- [ ] CI runs pnpm build, unit/conformance/regression, theme e2e, and docs build/e2e in the stated matrix.
- [ ] The feature-parity companion has one maintained row per node family with fixture, test path, and current status.
- [ ] A node cannot be marked supported until myst-zod validation, renderer snapshot, and applicable browser test are green.

## Dependencies and ordering

Land `01-dependency-updates.md` first for the Astro 7, MyST 1.10, and Playwright baseline. Land the schema release from `12-myst-zod-updates.md` before marking extension-node fixture rows supported. This strategy should be implemented alongside, and then required by, the AST renderer-parity documents beginning with [core AST parity](02-core-ast-parity.md).
