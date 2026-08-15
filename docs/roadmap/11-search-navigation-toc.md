---
title: Search, navigation, and table of contents
description: Build AST-derived search, TOC-driven navigation, reliable anchors, and accessible in-page table-of-contents behavior.
---

This roadmap replaces the current metadata-only Fuse experience with an AST-derived build index and makes project structure authoritative for navigation. It preserves MyST’s distinction between a project TOC, page outline, and in-document `{toc}` directive. [MyST’s table-of-contents guide](https://mystmd.org/guide/table-of-contents) is the structural reference.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P0 | XL | 02 Core AST parity; 03 Cross-references and numbering; 10 Frontmatter, SEO, and site metadata |

## Overview

- Generate a static search index from transformed MyST ASTs in `myst-astro-collections`, with page and heading records plus meaningful text excerpts.
- Retain Fuse.js and the existing dialog UI, but upgrade its index, keyboard model, route handling, and accessible result semantics.
- Derive navigation tree, breadcrumbs, previous/next pages, and collapsible groups from the project TOC rather than page-path heuristics.
- Align generated heading IDs, page TOC links, URL hashes, scroll spy, and `{toc}` directive behavior with transformed AST identifiers.

## Background and references

- The MyST project TOC is a tree of files, URLs, patterns, and children; for websites it defines the primary navigation. [Table of contents guide](https://mystmd.org/guide/table-of-contents)
- TOC entries can override navigation titles, form dropdown groups, and mark built pages hidden without preventing references to them. [TOC navigation behavior](https://mystmd.org/guide/table-of-contents)
- MyST site navigation distinguishes top navigation, primary project-TOC sidebar, content window, secondary in-page outline, banner, and footer. [Website navigation guide](https://mystmd.org/guide/website-navigation)
- The `{toc}` directive accepts aliases, validates `depth`, supports context, and emits a `toc` node. [TOC directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/toc.ts)
- The guide documents page, section, and project contexts plus depth control for the in-page directive. [In-page TOC guide](https://mystmd.org/guide/table-of-contents)
- Upstream builds a sectioned search representation from AST text and copies `myst.search.json` into static HTML output. [Search sectioning](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/search.ts) [Static search-index output](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/html/index.ts)

## Current state in myst-awesome

- [`SearchDialog.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/SearchDialog.astro) fetches `fuse.json`, constructs a Fuse index, searches title/description/keywords/identifier/URL, and previews results in `wa-zoomable-frame`.
- [`SearchLauncher.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/SearchLauncher.astro) advertises `/` and opens the dialog on click or Enter, but it does not own global `/` or Cmd/Ctrl+K shortcuts.
- [`myst-astro-collections/src/loaders.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts) already obtains `myst.xref.json` and has a Fuse-index configuration path, making it the correct build-time integration point.
- [`generate-page-toc.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/generate-page-toc.ts) recursively finds headings only through depth four and derives IDs from plain text, which can diverge from upstream `html_id` values.
- [`TableOfContents.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/TableOfContents.astro) already provides a flat multi-level outline, click scrolling, and request-animation-frame scroll tracking, but the heading selector and manual hash behavior need hardening.
- [`DocsLayout.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/DocsLayout.astro) accepts breadcrumbs and previous/next props and contains presentation for them, but callers currently supply rather than derive them.
- [`NavigationMenu.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/NavigationMenu.astro) is a menu component, not a complete project-TOC tree renderer.

## Upstream implementation pointers

- [`packages/myst-cli/src/process/search.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/search.ts): AST section extraction, heading hierarchy, literal text collection, and section context.
- [`packages/myst-cli/src/build/html/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/html/index.ts): emitted `myst.search.json` static artifact.
- [`packages/myst-directives/src/toc.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/toc.ts): aliases, `depth`, context, and node shape.
- [Project TOC guide](https://mystmd.org/guide/table-of-contents): explicit/implicit trees, patterns, title override, hidden pages, and in-page TOC.
- [Website navigation guide](https://mystmd.org/guide/website-navigation): site.nav, primary/secondary sidebars, and page layout behavior.
- [Website metadata guide](https://mystmd.org/guide/website-metadata): `myst.xref.json` as the project-wide reference/URL artifact.

## Implementation guidance

### Build-time AST search

1. Add `packages/myst-astro-collections/src/search.ts`; invoke it after pages and XRef data are loaded, not from the browser.
2. Port the upstream sectioning idea from [`process/search.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/search.ts): create one page record and one record per heading-delimited section, retaining ancestor heading context.
3. Store `{ id, kind, title, text, excerpt, headings, url, hash, frontmatter }`, where `url + hash` always uses the same route and anchor utilities as rendered links.
4. Collect visible text from paragraphs, headings, captions, legends, table cells once roadmap 02 lands, and supported admonition content. Exclude raw HTML, code by default, generated navigation, hidden metadata, and duplicate child text.
5. Add a configurable `search.includeCode` and `search.maxRecordChars`; truncate after text extraction on Unicode boundaries and precompute excerpts at build time.
6. Write a versioned `public/myst.search.json`; maintain `fuse.json` as a compatibility alias during one minor release, then switch the dialog URL.
7. Put a content/version hash in the artifact and emit a compact manifest with record count so development can detect stale indexes.
8. Avoid a runtime full-site fetch, a client-side AST parse, or a dependence on browser-only DOM text extraction.

### Search dialog and keyboard behavior

1. Update [`SearchDialog.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/SearchDialog.astro) to weight heading/title and section text, display the matched heading path and excerpt, and navigate to `url#hash`.
2. Use a unique dialog ID, `aria-controls`, `aria-activedescendant`, `role="combobox"` / listbox semantics, and an announced result count. Keep the preview pane optional and avoid loading it until selection is stable.
3. Add a document-level key handler in the dialog component: `/` opens search unless focus is editable; Cmd/Ctrl+K opens it everywhere; Escape closes it; ArrowUp/ArrowDown, Enter, and Tab follow the dialog’s active result.
4. Prevent duplicate listeners across Astro view transitions or repeated layout mounting. Scope event handlers to the dialog instance and remove them on unmount/page swap.
5. Preserve existing `baseDir` and folders URL normalization, but centralize it in `generate-page-url.ts` or a new `resolve-site-url.ts` helper shared by search, nav, breadcrumbs, and feeds.
6. Treat URL hashes as first-class: close search then navigate without stripping the fragment; focus the target heading after navigation when appropriate.

### Project TOC navigation

1. Add `packages/myst-astro-collections/src/toc.ts` to parse/consume the normalized project TOC supplied by the content server/project frontmatter.
2. Expand file, URL, and pattern entries before rendering. Preserve authored ordering, external URLs, title overrides, `hidden`, and nested children.
3. Create `packages/myst-awesome/src/lib/project-navigation.ts` that returns the active ancestry, breadcrumb objects, depth-first visible prev/next neighbors, and a stable nav tree for a route.
4. Replace path-derived breadcrumbs in [`DocsLayout.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/DocsLayout.astro) with objects from this helper. Keep the home link and use authored TOC titles.
5. Create `packages/myst-awesome/src/components/ProjectNavigation.astro` and use nested `<details>` initially for collapsible groups; evaluate `wa-tree` only after confirming its current API during implementation.
6. Set `aria-current="page"` on the active item, keep the active ancestor expanded, use a persisted per-project expansion state, and provide keyboard-accessible disclosure controls.
7. Derive `prevPage` / `nextPage` from the flattened visible page sequence. Exclude external URLs and hidden entries by default; permit a documented option to include hidden linked pages.
8. Preserve `site.nav` as a separate top-level navigation data source rather than folding it into the project TOC. [Website navigation](https://mystmd.org/guide/website-navigation)

### Anchors, outlines, and the `{toc}` directive

1. Rewrite [`generate-page-toc.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/generate-page-toc.ts) to use transformed `heading.html_id` / `identifier` first, then one shared slug fallback only for malformed external AST.
2. Capture inline heading text with a recursive `toText`-style helper rather than only direct `child.value`, so emphasis, inline code, and links are represented in labels.
3. Preserve all heading depths in the data model; let page/frontmatter configuration choose min/max depth instead of hard-coding four.
4. Update [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) to render an anchor link inside every identified heading, with an accessible label and `scroll-margin-top` CSS.
5. Update [`TableOfContents.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/TableOfContents.astro) to use `IntersectionObserver` when available, keep its existing scroll fallback, update `history.replaceState` without jumpy scrolling, and honor direct-load hashes after fonts/layout settle.
6. Make TOC click handling retain normal link behavior for modified clicks/new tabs. For ordinary clicks, focus the heading after smooth scroll and respect `prefers-reduced-motion`.
7. Add `toc` node support to the renderer. For `context: page` / section, render an inline nested list from heading data following the directive location and requested depth; for `context: project`, render a compact project tree from the navigation model.
8. Do not use the sidebar’s full document outline to satisfy a section-scoped `{toc}`. Preserve directive location and source position in the render context.

### Artifact lifecycle and URL invariants

1. Build search and navigation artifacts after route normalization, so one helper determines folder-style URLs, base directories, trailing slash policy, and fragments.
2. Treat the content-server XRef URL as input, then normalize only at the Astro boundary; do not reverse-engineer paths from titles or source filenames.
3. Record the project TOC digest in `myst.search.json`. Regenerate both nav and search when TOC ordering/title overrides change even if page text does not.
4. Use deterministic record IDs such as `{route}#{heading-id}` and reserve a page-root record ID for pages without headings.
5. Deduplicate equal visible text only when record URL and heading context are also equal. Repeated text in different sections is useful search evidence.
6. Limit the default search artifact to public, non-draft pages. A configuration option may include hidden pages for authenticated/private deployments.
7. Do not expose raw source paths, local file paths, private frontmatter, or unrendered notebook output in the browser artifact.
8. Defer downloading the search artifact until a user invokes search, but preload a small manifest on high-latency documentation sites only after measuring it.
9. Add a visible “no results” state with query echo, clear-query control, and no iframe preview request.
10. On navigation to a result hash, allow native anchor behavior first. Apply focus and offset correction only when the target is present and the browser has not already scrolled it into view.
11. Use `history.replaceState` for scroll-spy changes and `history.pushState` only for a user-initiated TOC click, avoiding polluted back-button history.
12. Respect `site.hide_toc` for the primary sidebar and `site.hide_outline` for the secondary outline independently, as described by the navigation and landing-page guides. [Website navigation](https://mystmd.org/guide/website-navigation) [Landing pages](https://mystmd.org/guide/website-landing-pages)
13. Provide a small public `getProjectNavigation()` API so custom layouts can consume the same model without reimplementing tree traversal.
14. Snapshot serialized nav/search artifacts in CI to make ordering, anchor, and public-content changes visible in review.

## myst-zod notes

- Ensure the project schema models normalized TOC entries (`file`, `url`, `pattern`, `children`, `title`, `hidden`) and `site.nav` without flattening authored hierarchy. [TOC format](https://mystmd.org/guide/table-of-contents)
- Add or complete schemas for `toc` directive nodes, heading `html_id`/identifier, and page frontmatter controls for outline/TOC visibility and depth.
- Define search-record, project-nav-tree, and breadcrumb types in `myst-astro-collections` rather than adding build-artifact-only types to AST Zod schemas.
- Keep XRef URL/anchor schema compatibility with the generated search and index artifacts from roadmaps 09 and 10.

## Tests to reproduce

- Reproduce hierarchy and literal-text extraction expectations from [`myst-cli/src/process/search.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/search.ts).
- Reproduce static search artifact placement from [`myst-cli/src/build/html/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/html/index.ts).
- Reproduce file, URL, pattern, nested, title override, hidden, and implicit TOC examples in the [TOC guide](https://mystmd.org/guide/table-of-contents).
- Reproduce top navigation, primary sidebar, and secondary outline behavior in the [website navigation guide](https://mystmd.org/guide/website-navigation).
- Reproduce `{toc}` aliases, invalid depth handling, contexts, and depth behavior from [`toc.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/toc.ts) and the [in-page TOC examples](https://mystmd.org/guide/table-of-contents).

## Tests to create

- `packages/myst-astro-collections/tests/search-index.spec.mjs`: heading sections, hierarchy, captions, exclusion rules, stable hashes, and stale-index hash.
- `packages/myst-awesome/tests/search-dialog.spec.ts`: `/`, Cmd/Ctrl+K, editable-field exception, arrows, Enter, Escape, result URLs with hashes, and dialog accessibility.
- `packages/myst-astro-collections/tests/project-toc.spec.mjs`: file/url/pattern expansion, title overrides, hidden pages, external links, and visible depth-first ordering.
- `packages/myst-awesome/tests/project-navigation.spec.ts`: active expansion, breadcrumbs, prev/next, collapsed groups, keyboard behavior, and responsive drawer.
- `packages/myst-awesome/src/lib/generate-page-toc.test.ts`: inline heading text, explicit IDs, duplicate fallback IDs, all depths, and malformed AST fallback.
- `packages/myst-awesome/tests/page-toc-scrollspy.spec.ts`: direct hash loads, scrolling, reduced motion, focus, history update, and modified-click behavior.
- `packages/myst-awesome/tests/toc-directive.spec.ts`: page/section/project contexts and depth rendering.

## Acceptance criteria

- [ ] Search results include title, heading path, useful excerpt, and stable page-plus-fragment URLs derived from transformed AST.
- [ ] Search index generation occurs at build/load time and does not require browser parsing of every site page.
- [ ] `/` and Cmd/Ctrl+K work without interfering with text editing, and the dialog is keyboard and screen-reader usable.
- [ ] Project navigation comes from the authored/resolved TOC, preserves title overrides and order, and handles hidden/external nodes intentionally.
- [ ] Breadcrumbs and previous/next links derive from the same route tree as the sidebar.
- [ ] Heading anchors, page outline links, search fragments, direct URL hashes, and cross-references resolve to the same IDs.
- [ ] The page outline supports arbitrary configured depth, robust scroll spy, reduced motion, focus management, and normal modified link behavior.
- [ ] `{toc}` supports documented contexts/depth and does not substitute a whole-page outline for a section-specific list.
- [ ] Auxiliary generated routes (index/feed/search artifacts) are excluded or included in navigation and discovery by explicit configuration.

## Dependencies and ordering

- Requires roadmap 03 to supply resolved cross-reference URLs and stable AST identifiers.
- Requires roadmap 02 before `{toc}` can be rendered as a first-class directive node.
- Requires roadmap 09 to reuse stable project/index target URLs, and roadmap 10 for canonical route metadata and feed/discovery enumeration.
- Roadmap 08 should land before final search extraction rules so media captions and figure text are represented consistently.
