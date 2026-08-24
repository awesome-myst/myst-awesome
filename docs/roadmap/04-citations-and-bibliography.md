---
title: Citations and bibliography
description: Render MyST-resolved citations, bibliographies, citation metadata, and hover details from the headless content-server page contract.
---

This roadmap adds citation and bibliography presentation without duplicating MyST’s BibTeX, DOI, CSL, and citation-order processing. The content server already resolves cited labels into AST children and page-level reference metadata; myst-awesome should render that resolved contract, give readers accessible citation details, and provide a configurable bibliography section. The implementation baseline is the upstream [citation transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts), [citation utility package](https://github.com/jupyter-book/mystmd/tree/main/packages/citation-js-utils), and [bibliography directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/bibliography.ts).

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | L |
| Depends on | 02-core-ast-parity, 03-cross-references-and-numbering |

## Overview

- Add explicit renderers for `cite`, `citeGroup`, and `bibliography` rather than relying on an unknown-node fallback.
- Consume page-level `references.cite` as the canonical source for formatted bibliography HTML, DOI, URL, order, and citation enumerator.
- Preserve upstream inline citation children so author–year, narrative, parenthetical, partial-author, and partial-year forms display as MyST resolved them.
- Add an accessible, lazy citation-detail hover/focus panel that uses page metadata while keeping citation text as an ordinary link.
- Support numeric and author–year presentation from upstream frontmatter/style resolution; do not derive styles in the Astro renderer.
- Distinguish a bibliography section from footnotes and leave citation-as-footnote as a later, explicit presentation policy.

## Background and references

### Citation AST

- The MyST [`cite` role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.ts) emits a `cite` node for a single plain `{cite}` entry and a `citeGroup` node for grouped or aliased citation roles.
- A `cite` node carries normalized `label` and `identifier`, citation `kind`, optional prefix/suffix, and optional `partial` author/year display intent. [Cite role construction](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.ts)
- `citeGroup` preserves the group kind and children so grouped citations can share surrounding syntax while every individual citation remains addressable. [Cite-group construction](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.ts)
- `myst-spec-ext` re-exports `Cite`, `CiteGroup`, and `CiteKind` from `myst-spec`, although its aliases are deprecated in favor of the spec types. [Spec-ext exports](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/index.ts)
- MyST documents citation role aliases including `cite:p`, `cite:t`, author, year, and parenthetical variants in the [citations guide](https://mystmd.org/guide/citations).

### Citation resolution and data flow

- The CLI citation transform selects every `cite` node, renders inline children with the requested narrative or parenthetical mode, assigns an enumerator in first-appearance order, and records a page-level citation entry. [Citation transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts)
- Page-level citation data contains `order` plus `data[label]` records with a label, rendered bibliography HTML, enumerator, optional DOI, and optional URL. [Theme page contract](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts)
- The citation transform does not overwrite preexisting citation children, enabling later pipeline stages to preserve already-resolved content. [Citation child handling](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts)
- The theme’s pages loader fetches resolved page JSON from the headless content server and spreads it into each Astro collection entry, so the theme already receives both `mdast` and `references`. [Pages loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)
- The loader does not run citation parsing, CSL formatting, DOI requests, or cross-reference resolution itself; those are server responsibilities, as shown by its fetch-and-store behavior. [Collection loader implementation](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)

### Citation-js utilities and DOI behavior

- [`citation-js-utils`](https://github.com/jupyter-book/mystmd/tree/main/packages/citation-js-utils) loads citation-js BibTeX and CSL plugins, parses BibTeX and CSL-JSON, and builds per-label citation renderers.
- The package exposes inline citation rendering and bibliography-style HTML rendering, including supported style identifiers for APA, Vancouver, and Harvard forms. [Citation utility source](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/src/index.ts)
- The utilities normalize DOI URLs, find non-DOI URLs, and wrap DOI destinations in anchors when formatting bibliography output. [DOI helper implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/src/index.ts)
- The CLI DOI transform accepts a DOI, asks `doi.org` for BibTeX first, falls back to CSL-JSON, and caches the parsed CSL response. [DOI resolver](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/dois.ts)
- The MyST [citations guide](https://mystmd.org/guide/citations) says that DOI links become citations and that a DOI absent from configured BibTeX data is resolved and cached during the build.
- The same guide documents `myst build --doi-bib` as a way to materialize downloaded DOI records in a BibTeX file. [DOI BibTeX workflow](https://mystmd.org/guide/citations)

### Bibliography behavior

- The [`bibliography` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/bibliography.ts) lowers to a `bibliography` node with an optional `filter`, then applies common directive options.
- The upstream generic HTML schema currently maps a bibliography node to a bibliography placeholder `<div>`, so theme rendering must use page reference data to provide meaningful visible entries. [HTML bibliography handler](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts)
- The MyST guide supports frontmatter `bibliography` as an ordered array of local or remote BibTeX files. [Bibliography configuration](https://mystmd.org/guide/citations)
- MyST’s guide describes both narrative and numbered citation behavior, with numbered references controlled in site options. [Numbered citation documentation](https://mystmd.org/guide/citations)

### Footnotes versus bibliography

- MyST footnote processing is a separate transform that associates `footnoteReference` with `footnoteDefinition` and assigns independent enumerators. [Footnote transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/footnotes.ts)
- Citation enumeration is maintained in `references.cite.order`, not in the footnote transform, so footnote-style citation display must be an explicit theme feature rather than an accidental reuse of footnote output. [Citation order recording](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts)
- Phase one should use an in-document bibliography section and ordinary citation links; footnote-style citations should remain out of scope until the content contract can represent placement and backreferences without ambiguity.

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) has no `cite`, `citeGroup`, or `bibliography` branch, so these nodes reach the content-dropping fallback today.
- The docs route passes only `page.data.mdast` to `renderMystAst`, not the page’s `references`, so the renderer has no current way to resolve citation labels to metadata. [Current route call](https://github.com/awesome-myst/myst-awesome/blob/main/docs/src/pages/book/[...slug].astro)
- The local [`Page` schema](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts) already specifies the exact citation metadata needed for inline anchors and bibliography rendering.
- The page loader saves complete page JSON and returns `...pageData`, which verifies the headless server is the existing citation-resolution boundary rather than a missing integration. [Resolved page loading](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)
- The renderer’s existing footnote support is independent of page-level bibliography data and should remain so. [Current footnote rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- The unknown-node changes in [02-core-ast-parity.md](02-core-ast-parity.md) prevent citation content loss while the explicit feature is being introduced.

## Upstream implementation pointers

| Concern | Upstream pointer | Theme implication |
| --- | --- | --- |
| Role parsing | [cite.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.ts) | Render `cite`/`citeGroup` after role lowering; do not parse source syntax in Astro. |
| Citation children | [citations.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts) | Inline node children are canonical visible citation text. |
| Bibliography HTML | [citation-js-utils](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/src/index.ts) | Consume preformatted server output; do not ship citation-js to browsers. |
| DOI resolution | [dois.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/dois.ts) | DOI network/cache behavior stays server-side. |
| Directive AST | [bibliography.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/bibliography.ts) | Use `filter` and common options to control presentation. |
| Output model | [page.ts](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts) | Pass `references.cite` alongside `mdast` to the renderer. |
| Footnote distinction | [footnotes.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/footnotes.ts) | Do not conflate citation entries with footnote definitions. |

## Implementation guidance

### Define a renderer context

1. Change `renderMystAst(root)` to `renderMystAst(root, options?: RenderMystOptions)`.
2. Add `references?: Page["references"]`, `pageUrl?: string`, `rawHtmlPolicy?: "off" | "trusted"`, and `dev?: boolean` to `RenderMystOptions`.
3. Keep the options object optional so existing editor/test call sites remain compatible.
4. In [`docs/src/pages/book/[...slug].astro`](https://github.com/awesome-myst/myst-awesome/blob/main/docs/src/pages/book/[...slug].astro), call `await renderMystAst(page.data.mdast, { references: page.data.references, pageUrl: page.id })`.
5. Update every direct renderer test page to await the async output before assigning `set:html`; the current route’s direct call should be corrected as part of this work. [Renderer signature](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
6. Make the citation lookup immutable for one render: `const citations = options.references?.cite?.data ?? {}`.

### Render `cite` and `citeGroup`

1. Add type imports for `Cite` and `CiteGroup` after the compatible `myst-zod` release exposes them.
2. Add one canonical helper, `bibliographyId(label)`, and export it alongside the renderer. It performs the label normalization once and returns the full `ref-…` fragment identifier. Every citation `href`, every bibliography entry `id`, and every back-link must call it; no site in the codebase may build a `ref-…` string by interpolating a raw label.
3. Add `case "cite"` that looks up `cite.label` in `references.cite.data`.
4. Render resolved children first; this preserves author–year, numeric, parenthetical, narrative, prefix, suffix, and partial forms chosen by upstream citation-js processing. [Inline rendering](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts)
5. Wrap a resolved citation in `<a class="myst-citation" href="#{bibliographyId(label)}" data-cite-label="…">…</a>`, escaping the attribute value as usual.
6. Add `data-cite-enumerator`, `data-cite-doi`, and `data-cite-url` only when page metadata contains them; escape each value.
7. Base the bibliography ID on the normalized citation label rather than the numeric enumerator, because author–year and numeric styles may change the latter. Normalization must be deterministic and collision-checked: if two distinct labels normalize to the same identifier, fail the build rather than emitting two elements with one ID.
7. For an unresolved label, return `<span class="myst-citation myst-citation--missing">` with rendered children or escaped label; add a development diagnostic but do not fabricate bibliographic facts.
8. Add `case "citeGroup"` that renders its children inside `<span class="myst-citation-group">`; preserve upstream child punctuation rather than joining labels with a theme-defined delimiter.
9. If a cite group’s children are individual `cite` nodes without punctuation, preserve their AST order and use a semicolon separator only as a narrowly scoped accessibility fallback.
10. Do not call `citation-js-utils` in `renderMystAst`; that would duplicate server behavior and add a browser-side dependency.

### Render the bibliography directive

1. Add `case "bibliography"` that reads `references.cite.order` and `references.cite.data`.
2. Give each bibliography directive a page-scoped ordinal from the render context and derive its heading ID from that ordinal — `myst-bibliography-title-{n}` — rather than a fixed constant. Output `<section class="myst-bibliography" aria-labelledby="{that id}">` with a configurable heading defaulting to “References”, and put the same generated ID on the heading element. A page may legitimately contain more than one bibliography, and a repeated `aria-labelledby` target silently breaks the heading relationship for assistive technology.
3. Use `<ol>` when all citation records have enumerators and numeric style presentation is selected; otherwise use `<div role="list">` or `<ul>` with neutral styling for author–year output.
4. Render each entry as `<li id="{bibliographyId(label)}" data-cite-label="{label}">` using the same helper the `cite` branch calls, so an anchor and its entry can never disagree about the fragment. Insert the server-provided `html` only through a dedicated, documented bibliography-HTML sanitizer.
5. The server-provided bibliography HTML contains emphasis and external DOI anchors produced by citation formatting utilities, so sanitize to a tight allow-list (`a`, `i`, `em`, `strong`, `span`, text) and require `https:` on external hrefs. [Formatted citation examples](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/tests/fixtures.ts)
6. Preserve the directive’s optional `filter` as a phase-one capability: implement only clearly documented values after observing upstream resolved filter semantics; otherwise ignore it with a development warning rather than filtering arbitrarily.
7. If no bibliography directive occurs but the page has citation metadata, do **not** append a bibliography automatically in phase one; author placement must remain explicit.
8. If multiple bibliography directives occur, render each with the same ordered entries in phase one and log a development warning; introduce directive-specific filtering only after an upstream contract is verified. Only the first bibliography on a page carries the canonical entry IDs; later repetitions render the same content with `data-cite-label` but no `id`, so `bibliographyId(label)` continues to identify exactly one element per page.
9. Add back-link affordances only after recording citation anchor IDs; do not add a false single backlink for labels cited multiple times.

### Citation hover/focus details

1. Create `packages/myst-awesome/src/lib/wa-citation-preview.ts` and `packages/myst-awesome/src/styles/myst-citation.css`.
2. Emit citation metadata to the DOM as escaped `data-*` fields or a page-scoped JSON `<script type="application/json" id="myst-citation-data">` serialized by the route.
3. Prefer page-scoped JSON for bibliography HTML and abstracts to avoid unreadably large `data-*` attributes.
4. On pointer hover and keyboard focus, display a non-interactive preview containing the formatted bibliographic entry, DOI link, and external URL when present.
5. Use an ordinary anchor as the activation surface and preserve the `bibliographyId(label)` `href` so Enter, copy link, reader navigation, and no-JavaScript behavior remain correct.
6. Use `wa-tooltip` only for a concise text-only “Citation details” hint; implement rich content in a positioned popover that is connected with `aria-describedby`.
7. Close on Escape, focus loss, and pointer exit with a small delay; respect `prefers-reduced-motion`.
8. Sanitize bibliography HTML before injecting it into the popover just as for the visible bibliography list.
9. Do not promise abstracts unless the page contract is extended; current `references.cite.data` has formatted HTML, DOI, URL, label, and enumerator but no abstract. [Current page citation schema](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts)

### Style and numbering policy

1. Treat style resolution as upstream: the citation transform asks a renderer for inline children and bibliography HTML, while `citation-js-utils` selects citation templates. [Citation transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts) and [style renderer](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/src/index.ts)
2. Support author–year and numeric presentation by faithfully rendering those resolved children, not by checking string patterns or reformatting AST text.
3. Use `enumerator` only for bibliography `<ol>` ordering, optional visual marker, and data attribute; do not force `[n]` around every inline citation.
4. Expose CSS variables for `--myst-citation-color`, bibliography indentation, DOI link treatment, and numeric marker spacing.
5. If a site needs a style switcher, make it a rebuild-time frontmatter/content-server setting; client-side switching would require retaining CSL data and rerunning citation-js.
6. Document the relationship between author–year and numeric output in theme docs with links to the [MyST citation guide](https://mystmd.org/guide/citations).

### Footnote-style policy

1. Ship bibliography-section rendering in this roadmap.
2. Do not transform `cite` nodes into `footnoteReference` nodes, because upstream footnotes have a separate reference/definition graph and enumerator transform. [Footnote transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/footnotes.ts)
3. Design a later “citation footnotes” option only if page data grows a stable placement model that can expose one formatted definition per citation and multiple backreferences.
4. Until then, numeric citation links to the `bibliographyId(label)` fragment supply the conventional bibliography interaction without corrupting footnote numbering.

### Files to create or modify

| File | Change |
| --- | --- |
| [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) | Add renderer options and explicit cite, cite-group, and bibliography branches. |
| [`docs/src/pages/book/[...slug].astro`](https://github.com/awesome-myst/myst-awesome/blob/main/docs/src/pages/book/[...slug].astro) | Pass page references/page URL and emit safe page-scoped citation JSON for previews. |
| `packages/myst-awesome/src/lib/myst-bibliography-html.ts` | Create bibliography HTML sanitization and label-to-anchor helpers. |
| `packages/myst-awesome/src/lib/wa-citation-preview.ts` | Create progressive hover/focus preview behavior. |
| `packages/myst-awesome/src/styles/myst-citation.css` | Create inline citation, unresolved state, bibliography, and preview styles. |
| `packages/myst-awesome/tests/citations-bibliography.spec.ts` | Create browser coverage for citation and bibliography rendering. |
| `packages/myst-awesome/tests/fixtures/citations-page.json` | Create resolved page fixture with `mdast` plus `references.cite`. |
| `packages/myst-awesome/src/lib/myst-bibliography-html.test.ts` | Create sanitizer and anchor-generation unit coverage. |

## myst-zod notes

- Add `cite` and `citeGroup` node schemas and include them in the static/phrasing-content unions if the published `@awesome-myst/myst-zod` version used by the theme does not export them.
- Match upstream field names—`label`, `identifier`, `kind`, `prefix`, `suffix`, `partial`, `children`, `enumerator`, and `error`—instead of converting citation nodes into a theme-specific shape. [Cite role output](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.ts)
- Add a `bibliography` flow-content schema with optional `filter`, class, identifier, and `html_id` fields if it is missing from the local union.
- Retain the existing [`Citations` and `References` page schema](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts) as the boundary between content-server resolution and presentation.
- Add a separate renderer-options type in myst-awesome rather than expanding the page schema with DOM-only state.
- If preview payload validation is needed, derive a read-only `CitationPreviewRecord` schema from `Citations.data` rather than widening canonical server data.

## Tests to reproduce

- Reproduce one plain cite versus grouped cite role output from [`myst-roles/src/cite.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/cite.spec.ts).
- Reproduce parser-level directive output from [bibliography directive fixtures](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-parser/tests/directives/bibliography.yml).
- Reproduce parser-level cite role variants from [cite role fixtures](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-parser/tests/roles/cite.yml).
- Reproduce first-appearance ordering, citation children, enumerators, and missing-label handling from the [CLI citation transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/citations.ts).
- Reproduce BibTeX/CSL parsing, style output, DOI extraction from URL/note fields, and HTML formatting from [citation-js-utils tests](https://github.com/jupyter-book/mystmd/blob/main/packages/citation-js-utils/tests/basic.spec.ts).
- Reproduce DOI BibTeX-first and CSL-JSON fallback behavior from [DOI transform tests](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/doi.spec.ts).
- Reproduce normal footnote enumeration independently from [footnote transform tests](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/footnotes.spec.ts).

## Tests to create

- Create `citations-bibliography.spec.ts` with “single resolved citation links to stable bibliography ID”.
- Add “cite group retains resolved child order and parenthetical punctuation” coverage.
- Add “narrative, parenthetical, author-only, and year-only children render without theme reformatting” coverage.
- Add “numeric citation metadata preserves upstream enumerator but does not double-wrap visible brackets” coverage.
- Add “missing citation label preserves readable content and emits only a development diagnostic” coverage.
- Add “bibliography directive renders entries in `references.cite.order` and preserves safe emphasis/DOI anchors” coverage.
- Add “bibliography does not auto-append when directive is absent” coverage.
- Add “citation preview opens on focus, closes on Escape, and does not prevent anchor navigation” Playwright coverage.
- Add “citation preview and bibliography sanitizer reject script, event handler, data URL, and unsafe HTML” unit and browser coverage.
- Add “footnote and citation enumerators remain independent” coverage.
- Add “page loader fixture contains resolved `references.cite` without the Astro loader performing citation processing” integration coverage.

## Acceptance criteria

- [ ] `cite`, `citeGroup`, and `bibliography` nodes have explicit renderer branches.
- [ ] Inline citation text comes from resolved AST children and supports numeric and author–year results without client-side CSL formatting.
- [ ] Every resolved citation links to a stable bibliography entry ID, produced by the single `bibliographyId(label)` helper that also emits the entry’s `id`.
- [ ] A page with two bibliography directives emits unique heading IDs and exactly one element per bibliography entry ID.
- [ ] Bibliography output uses server-provided citation data in upstream first-use order.
- [ ] Formatted bibliography HTML is sanitized by a narrow, tested allow-list before it reaches `set:html` or a preview panel.
- [ ] DOI resolution, BibTeX/CSL parsing, style selection, and cache behavior remain in the MyST content-server pipeline.
- [ ] Citation hover/focus details are optional progressive enhancement and never replace ordinary anchor behavior.
- [ ] Citations and footnotes retain separate numbering and data models.
- [ ] Unresolved citation content remains visible in production and diagnosable in development.

## Dependencies and ordering

- Requires [02-core-ast-parity.md](02-core-ast-parity.md) for safe unknown-node behavior, raw/HTML trust conventions, and general structural rendering.
- Requires [03-cross-references-and-numbering.md](03-cross-references-and-numbering.md) for stable IDs, link behavior, hover-preview accessibility conventions, and loader-side resolved-data handling.
- The `myst-zod` citation-node update and the renderer-options change may be prepared in parallel, but bibliography UI should not merge until the pages collection is verified against a live headless-server citation fixture.
