---
title: Includes, glossaries, terms, and indices
description: Preserve content-server includes and add linked glossary, term, and generated index rendering for static Astro sites.
---

This roadmap treats includes as an upstream content-server responsibility and focuses the theme on consuming the transformed AST correctly. It then adds first-class glossary/term interaction and a deterministic static index page. [MyST’s glossary and term guide](https://mystmd.org/guide/glossaries-and-terms) defines the user-facing behavior.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P2 | L | 02 Core AST parity; 03 Cross-references and numbering |

## Overview

- Verify that collection pages receive include-resolved content rather than implementing filesystem inclusion in Astro.
- Render `glossary` definition lists semantically and render `{term}` links with a `wa-tooltip` hover preview plus a glossary-anchor URL.
- Preserve inline index targets and generate one build-time alphabetical index page for a static site.
- Keep project-wide aggregation out of the runtime browser and build it from transformed ASTs and content-server cross-reference data.

## Background and references

- `{include}` and its `literalinclude` alias first create an `include` node; literal mode can also be selected by `literal` or `lang`, with line and marker filters. [Include directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/include.ts)
- The include transform resolves files, detects recursive inclusion, filters content, converts literal content to code, recursively parses normal content, and merges only selected include frontmatter. [Include transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/include.ts)
- The MyST CLI wires file resolution, loading, parsing, dependency watching, and `includeDirectiveTransform` together before the page is served. [CLI include transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/include.ts)
- A glossary is represented as a glossary wrapper around definition lists; its transform normalizes each definition term to `term-…` identifiers and HTML IDs. [Glossary transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/glossary.ts)
- The `{term}` role creates a cross-reference to the normalized `term-…` identifier and supports a separate display label. [Term role source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/term.ts)
- MyST documents term references as links to their glossary definition with a hover reference. [Glossary and terms guide](https://mystmd.org/guide/glossaries-and-terms)
- `{index}` exists as both directive and role, supports single/pair/triple/see/seealso forms, and `show-index` / `genindex` creates a display location. [Index directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/indices.ts) [Index role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/indices.ts)
- The project transform groups index targets by normalized first letter, creates links and see/see-also entries, and replaces `genindex` with a `block` whose part is `index`. [Index transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/indices.ts)

## Current state in myst-awesome

- [`myst-astro-collections`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts) loads content from the MyST content server and already persists `myst.xref.json`, rather than parsing source Markdown in Astro.
- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) supports definition-list primitives but has no `glossary`, term-role/cross-reference tooltip, index entry, or generated-index rendering branch.
- Include handling is therefore a verification concern: a resolved page AST should contain parsed children or code, not a remaining `include` node. [Current renderer fallback behavior](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- The loader’s existing `myst.xref.json` copy is a useful authoritative source for cross-page target URLs, while the page AST remains needed for index entry payloads. [XRef loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)
- The current theme has no `wa-tooltip` usage for MyST terms, no index route, and no static aggregate artifact.

## Upstream implementation pointers

- [`packages/myst-directives/src/include.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/include.ts) and [`include.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/include.spec.ts): directive aliases, literal choice, and line-range parser.
- [`packages/myst-transforms/src/include.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/include.ts): resolution, recursion, filtering, literal code, and parsed-content replacement.
- [`packages/myst-cli/src/transforms/include.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/include.ts): proof that resolution belongs to the CLI/content-server stage.
- [`packages/myst-directives/src/glossary.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/glossary.ts), [`myst-roles/src/term.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/term.ts), and [`myst-transforms/src/glossary.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/glossary.ts).
- [`packages/myst-directives/src/indices.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/indices.ts), [`myst-roles/src/indices.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/indices.ts), and [`myst-transforms/src/indices.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/indices.ts).
- [Glossary, terms, and index authoring guide](https://mystmd.org/guide/glossaries-and-terms): author-level examples and `genindex` behavior.

## Implementation guidance

### Include pass-through contract

1. Do not add an Astro filesystem include parser. It would duplicate path semantics, file watching, recursion detection, format parsing, and filter behavior already owned by the CLI.
2. Add `packages/myst-astro-collections/src/verify-transforms.ts` and call it after page data is fetched. In development, walk `page.mdast` and report a targeted error if a residual `include` node is found.
3. Expose `verifyResolvedIncludes?: boolean` in the collection server configuration, defaulting to true in development and CI and false only for explicit low-level AST debugging.
4. Add a fixture MyST project under `packages/myst-astro-collections/tests/fixtures/includes/` containing parsed Markdown includes, `literalinclude`, `:start-after:`, `:end-before:`, `:lines:`, nested includes, and a deliberately missing include.
5. Test the actual content-server response in addition to isolated loader fixtures. The assertion is structural: normal includes disappear into parsed children, and literal includes appear as `code` nodes.
6. If the invariant fails, render an escaped diagnostic `<pre class="myst-include-unresolved">` only in development; production builds must fail rather than silently omit source content.

### Glossary and term rendering

1. Add `glossary` handling to [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts): emit `<section class="myst-glossary">` around the rendered definition lists and preserve common classes/IDs.
2. Refactor definition-list rendering so a `definitionTerm` can carry the transformed `id="term-…"`, an accessible heading/link target, and a matching description relationship.
3. Extend the cross-reference renderer from roadmap 03 to recognize term targets. Render the visible label as `<a href="/glossary/#term-…">` when the definition is cross-page and `#term-…` when local.
4. Create `packages/myst-awesome/src/components/TermTooltip.astro` as a progressive-enhancement script component. It should locate term links annotated with `data-term-id` and attach a `wa-tooltip` containing sanitized plain-text definition preview.
5. Build `public/myst.terms.json` in `myst-astro-collections` as a versioned envelope — `{ version, generatedAt, terms }`, where `terms` is `{ identifier, label, definitionText, url }[]` — derived from transformed glossary definition terms. This is the single public shape; the loader, the schema, `TermTooltip`, and every collection consumer parse the envelope and read `terms`, never a bare top-level array. Never place rendered HTML in this file.
6. Load the terms manifest only on first term hover/focus, cache it in memory, and leave the ordinary link fully functional if the manifest cannot be loaded.
7. Add styles in [`MystContentStyles.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/MystContentStyles.astro) for a subtle dotted affordance without obscuring normal link semantics.
8. Handle duplicate normalized term identifiers as a build error with both page paths, matching upstream’s requirement that multiple glossaries do not redefine a term. [Glossary guide](https://mystmd.org/guide/glossaries-and-terms)

### Static generated index

1. Add `packages/myst-astro-collections/src/build-index.ts` that walks every transformed page AST, finds `indexEntries`, and records `{ entry, subEntry, emphasis, url, title, anchor }`.
2. Use the same normalized-letter and ordering behavior as upstream; port it from [`indices.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/indices.ts) rather than using locale-dependent browser sorting.
3. Resolve `url` and anchors through the fetched XRef collection where possible. Fail the build for a target without a stable URL instead of emitting a broken index link.
4. Persist `public/myst.index.json` using the same `{ version, generatedAt, groups }` envelope, where `groups` is structured by letter, main entry, subentry, direct references, `see`, and `see also`; include only escaped text strings and URLs.
5. Add `packages/myst-awesome/src/pages/genindex.astro` (or an integration-installed consumer route) that imports the generated artifact at build time and emits semantic letter headings, definition lists, and reference links.
6. Render an in-page `genindex` AST node as a link or embed of the generated index only when its project scope matches the built artifact; do not attempt to aggregate the whole project on every page render.
7. Make the index route configurable (`site.options.index_path`, default `/genindex/`) and include it in navigation only when at least one entry exists.
8. Preserve `:see:` / `:seealso:` as textual cross-references with links when the referenced entry exists; report unresolved targets in CI.

### Build data flow and failure handling

1. Fetch pages before producing term/index artifacts so include expansion and transforms have completed.
2. Build a page-local target map from transformed AST nodes, then merge it with the project XRef map. Record whether a URL came from a local anchor or XRef resolution for diagnostics.
3. Treat the term registry as project scoped. A nested project or separately mounted collection must produce its own manifest namespace and glossary URLs.
4. Give all generated artifacts the same explicit schema-version envelope: `{ version, generatedAt, terms }` for `myst.terms.json` and `{ version, generatedAt, groups }` for `myst.index.json`. Both are validated against a published schema before write and after read, so a consumer never has to sniff whether it received an envelope or a bare array.
5. Do not use wall-clock `generatedAt` in deterministic content snapshots; permit it only in a separate development manifest or derive it from the build context.
6. Keep manifest filenames configurable to avoid collisions where multiple MyST projects share an Astro `public/` directory.
7. On a page reload in development, invalidate the terms/index in-memory cache when the manifest version changes.
8. If a term reference points to a known identifier but its definition is in an unpublished/hidden page, choose an explicit site policy: expose the glossary route or fail the public build.
9. Index target URLs must preserve a page fragment even when the target is attached to inline content, so a user arrives at the actual mention rather than only the page title.
10. Escape index labels and term previews at serialization and rendering boundaries. Definition source may contain rich MyST AST but the manifest’s preview is plain text.
11. Normalize whitespace for lookup keys only; retain the authored display label in visible glossary and index output.
12. Add build diagnostics for term definitions never referenced and index entries never displayed. They are warnings, not errors.
13. Keep the generated route usable without a client manifest: its initial HTML must contain all index headings and links.
14. Include the index route in sitemap/feed policy only through roadmap 10’s discovery model; generated does not automatically mean public.
15. Document that `genindex` is a project aggregate, whereas an inline `{index}` is a target annotation with no visible page text by itself. [Index directive behavior](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/indices.ts)
16. Preserve original source position on build diagnostics whenever the AST exposes it, so an author can repair a term or index problem without searching a rendered page.
17. Treat an entry’s emphasis flag as presentation metadata only. It must not change its identity, ordering key, or link destination.
18. Use one Unicode normalization strategy for terms and index entry lookup; retain upstream-compatible normalized first-letter grouping for presentation.
19. Render `see` and `see also` text in the authored case, even when lookup normalizes case for matching.
20. Keep tooltip previews short and deterministic; truncate by grapheme cluster and append a plain-text ellipsis only after text extraction.
21. Use pointer and keyboard focus events equally for term preview loading, with an Escape path that dismisses an open interactive tooltip.
22. Preserve visible term links when tooltip JavaScript is disabled, when a device lacks hover, and when a terms manifest request is blocked.
23. Do not merge definitions with identically rendered text but distinct normalized IDs; identifiers, not descriptions, are the canonical identity.
24. Add a developer-only inspector command that reports the number of includes, terms, index targets, unresolved links, and generated groups per project.
25. Ensure the inspector reads build artifacts and transformed ASTs only; it must not introduce a second include parser or source-resolution implementation.
26. Keep index and term assets cacheable by content hash and serve a new version under a changed filename or explicit manifest version.
27. Include source-page title in index link accessible names when duplicate anchor labels on different pages would otherwise be ambiguous.
28. Make glossary and generated-index styles print-safe, because they are definition-heavy navigational content even when the site is static.

## myst-zod notes

- Add schemas for `include`, `glossary`, `genindex`, and index-entry-bearing nodes to [`myst-zod`](https://github.com/awesome-myst/myst-zod/blob/main/src/), keeping transform-time nodes valid even though successful collection output should not retain `include`.
- Add `indexEntries`, `identifier`, `html_id`, `label`, `noSubcontainers`, and common classes to the nodes that upstream transforms annotate.
- Model term references as the existing cross-reference schema plus a target-kind discriminator if one is not already available; do not make the renderer infer terms from text.
- Define runtime manifest schemas for `myst.terms.json` and `myst.index.json` in a real module — `packages/myst-astro-collections/src/manifest-schemas.ts`, or a shared `myst-zod` export if other packages need them — not in `packages/myst-astro-collections/src/types.d.ts`. A `.d.ts` file is erased at compile time and can validate nothing, and the repository has no manifest validation path today. Parse with those schemas on both sides, before writing each artifact and after reading it, and derive the exported TypeScript types from them with `z.infer`. Model both as the versioned envelope so a consumer written against a bare array fails to compile as well as failing to parse.

## Tests to reproduce

- Port line filter expectations from [`myst-directives/src/include.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/include.spec.ts).
- Reproduce literal-vs-parsed include transformation, recursion detection, and frontmatter handling from [`myst-transforms/src/include.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/include.ts).
- Reproduce identifier assignment and normalized-letter expectations from [`myst-transforms/src/indices.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/indices.spec.ts).
- Port glossary term, index role, pair, emphasis, `see`, `seealso`, and `show-index` examples from the [glossary and terms guide](https://mystmd.org/guide/glossaries-and-terms).

## Tests to create

- `packages/myst-astro-collections/tests/includes-content-server.spec.mjs`: AST assertions for normal and literal include resolution.
- `packages/myst-awesome/tests/glossary-terms.spec.ts`: glossary anchors, local/cross-page term links, keyboard tooltip, and no-JavaScript link fallback.
- `packages/myst-astro-collections/tests/terms-manifest.spec.mjs`: normalized IDs, duplicate-term failure, and plain-text preview extraction.
- `packages/myst-astro-collections/tests/index-manifest.spec.mjs`: accents, numerals, pair/triple entries, emphasis, see/seealso, and stable ordering.
- `packages/myst-awesome/tests/genindex.spec.ts`: generated route, deep links, keyboard navigation, and absent-index behavior.
- `packages/myst-awesome/src/lib/render-myst-ast.glossary.test.ts`: semantic definition-list and `genindex` rendering.

## Acceptance criteria

- [ ] The Astro layer never reads include source files directly in normal operation.
- [ ] CI proves that the content-server AST has no unresolved `include` nodes for valid fixtures.
- [ ] Literal includes render as highlighted code while parsed includes contribute normal AST content.
- [ ] Glossary terms have stable `term-…` anchors and accessible definition-list markup.
- [ ] `{term}` links navigate correctly across pages and show a sanitized hover/focus preview when JavaScript is available.
- [ ] Duplicate glossary terms and unresolved index targets fail with actionable page/identifier diagnostics.
- [ ] Index directives and roles produce a deterministic static index grouped by upstream-compatible normalized letters.
- [ ] `show-index`/`genindex` authoring produces a useful static index entry point without runtime project aggregation.
- [ ] The generated manifests contain no executable or rendered HTML content.

## Dependencies and ordering

- Requires roadmap 03’s cross-reference URL and hover-preview contract before term links can be complete.
- Requires roadmap 11’s project TOC/page URL utilities for stable generated-index route and navigation integration.
- Coordinate with roadmap 10 if the index route gains frontmatter-driven title, description, canonical URL, or robots policy.
