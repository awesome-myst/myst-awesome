---
title: Roadmap to MyST specification parity
description: Implementation plan for bringing myst-awesome to feature parity with the MyST Markdown specification and the mystmd reference implementation.
---

This directory plans and guides the implementation work required to bring
[myst-awesome](https://github.com/awesome-myst/myst-awesome) — an
[Astro](https://astro.build) theme built on
[Web Awesome](https://webawesome.com) — up to parity with the full feature
surface of the [MyST Markdown specification](https://mystmd.org/spec/) and its
reference implementation, [mystmd](https://github.com/jupyter-book/mystmd).

Each document in this directory is a self-contained implementation plan with a
consistent structure: status and priority, background material and references,
the current state in myst-awesome, pointers to upstream implementations
(GitHub source), concrete implementation guidance for Astro / Web Awesome,
required [myst-zod](https://github.com/awesome-myst/myst-zod) schema updates,
upstream tests to reproduce, new tests to create, and acceptance criteria.

## How myst-awesome renders MyST

myst-awesome does not parse MyST Markdown itself. A headless
[`myst` content server](https://mystmd.org/guide) parses, transforms, and
resolves the project; `@awesome-myst/myst-astro-collections` loads the
resulting MyST AST (JSON) into Astro content collections; and the theme's
[`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
converts AST nodes to HTML using Web Awesome components. Parity work therefore
concentrates on three surfaces:

1. **AST coverage** — a switch case (or component) for every node type in
   [myst-spec](https://github.com/jupyter-book/myst-spec) and
   [myst-spec-ext](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-spec-ext).
2. **Schema coverage** — [myst-zod](https://github.com/awesome-myst/myst-zod)
   validation for every node and frontmatter field that flows through the
   collections.
3. **Site features** — search, navigation, SEO, downloads, landing pages, and
   other behaviors of the reference
   [myst-theme](https://github.com/jupyter-book/myst-theme) delivered
   statically via Astro.

## Implementation order

Documents are numbered in recommended implementation order. Dependency updates
come first: everything else builds on current upstream AST shapes and current
Web Awesome components.

The table below is the authoritative priority for every plan. The `Status`
table at the top of each plan mirrors this value; when the two disagree, this
table wins and the plan document should be corrected.

| # | Plan | Phase | Priority |
| --- | --- | --- | --- |
| 01 | [Dependency updates](./01-dependency-updates.md) | Foundation | P0 |
| 02 | [Core AST node parity](./02-core-ast-parity.md) | Foundation | P0 |
| 03 | [Cross-references, targets, and numbering](./03-cross-references-and-numbering.md) | Scholarly core | P0 |
| 04 | [Citations and bibliography](./04-citations-and-bibliography.md) | Scholarly core | P1 |
| 05 | [UI extension components](./05-ui-extension-components.md) | Components | P1 |
| 06 | [Proofs, theorems, and exercises](./06-proofs-exercises.md) | Components | P2 |
| 07 | [Code, execution, and Jupyter outputs](./07-code-execution-and-outputs.md) | Executable content | P1 (P3 for live execution and widgets) |
| 08 | [Figures, media, and diagrams](./08-figures-media-diagrams.md) | Media | P1 |
| 09 | [Includes, glossaries, terms, and indices](./09-includes-glossaries-indices.md) | Authoring | P2 |
| 10 | [Frontmatter, SEO, and site metadata](./10-frontmatter-site-metadata.md) | Site | P1 |
| 11 | [Search, navigation, and table of contents](./11-search-navigation-toc.md) | Site | P1 |
| 12 | [myst-zod schema updates](./12-myst-zod-updates.md) | Cross-cutting | P0 |
| 13 | [Testing strategy and spec conformance](./13-testing-strategy.md) | Cross-cutting | P0 |

Phases group work that can proceed in parallel once its dependencies land:

- **Foundation (01, 02, 12, 13)** — upgrade the toolchain, cover the
  fundamental spec nodes (tables, targets, thematic breaks, fallbacks), stand
  up the spec-conformance test harness, and extend myst-zod schemas as
  needed by each feature. 12 and 13 are cross-cutting: they start here and
  receive increments from every later plan.
- **Scholarly core (03, 04)** — numbering, cross-references, and citations;
  the features that make MyST a scientific-communication tool.
- **Components and media (05, 06, 07, 08)** — cards, grids, tabs, dropdowns,
  proofs, exercises, code options, Jupyter outputs, figures, videos, and
  diagrams. Largely parallelizable.
- **Authoring and site (09, 10, 11)** — glossaries and indices, SEO and site
  metadata, search and navigation.

## Definition of parity

The roadmap targets the feature surface documented in the
[MyST guide](https://mystmd.org/guide) and encoded in
[myst-spec](https://github.com/jupyter-book/myst-spec/tree/main/schema)
schemas, the
[myst-spec-ext](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/index.ts)
extensions, the
[myst-directives](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-directives/src)
and
[myst-roles](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-roles/src)
registries, and the `myst-ext-*` extension packages. A feature is **done**
when:

1. The node(s) validate through myst-zod schemas.
2. `render-myst-ast.ts` (or a dedicated Astro component with a Resolver
   override) renders them with Web Awesome styling, light and dark.
3. The relevant [myst-spec YAML fixtures](https://github.com/jupyter-book/myst-spec/tree/main/docs/examples)
   pass in the conformance harness ([13](./13-testing-strategy.md)).
4. Playwright coverage exists for interactive behavior and visual regressions.
5. The feature is demonstrated on a docs page under `docs/authoring/`.

## Out of scope

- Non-HTML export targets (`myst-to-tex`, `myst-to-typst`, `myst-to-docx`,
  `myst-to-jats`, `myst-to-md`) — the `myst` CLI already provides these.
- Parsing (`myst-parser`, `markdown-it-myst`) — delegated to the headless
  `myst` content server.
- Live kernel execution by default — static outputs are in scope
  ([07](./07-code-execution-and-outputs.md)); in-page execution via
  [thebe](https://mystmd.org/guide/in-page-execution) is a stretch goal.
