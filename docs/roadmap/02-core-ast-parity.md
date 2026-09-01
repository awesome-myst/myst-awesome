---
title: Core AST node parity
description: Render the remaining fundamental MyST AST nodes without losing author content, using semantic HTML and Web Awesome primitives where appropriate.
---

This roadmap closes the foundational renderer gaps before higher-level cross-reference and citation work. The goal is semantic, safe HTML for the AST emitted by the MyST content server, with a conservative fallback that preserves content and makes unsupported syntax visible during development. The upstream [MyST AST schemas](https://github.com/jupyter-book/myst-spec/tree/main/schema), [directive implementations](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-directives/src), and [HTML renderer](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-to-html/src) are the behavioral references.

## Status

| Field | Value |
| --- | --- |
| Priority | P0 |
| Effort | L |
| Depends on | None |

## Overview

- Add first-class render branches for tables, thematic breaks, targets, generic `span`/`div`, raw content, and asides.
- Preserve container metadata and captions so table, figure, quote, and aside transforms continue to compose.
- Render unknown `mystDirective` and `mystRole` nodes as visible, non-destructive fallbacks.
- Replace the current content-dropping unknown-node behavior with child rendering and a development-only warning banner.
- Keep semantics native HTML first; use Web Awesome where it is a true component mapping rather than ornamental markup.

## Background and references

### Table family

- The MyST [table schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json) defines `table` with `align` and `tableRow` children, and each `tableRow` contains `tableCell` children.
- A `tableCell` can carry `header: true` and per-cell `align`, so the renderer must choose `<th>` rather than `<td>` from the node rather than assuming the first row is a header. [TableCell schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json)
- `rowspan` and `colspan` are not standard `tableCell` schema fields; MyST’s table guide documents complex spanning tables as [raw HTML](https://mystmd.org/guide/tables), so raw HTML support is required for that authoring path rather than inventing AST attributes.
- The upstream [`table` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts) wraps table content and an optional caption in a `container` whose `kind` is `table`.
- The upstream [`list-table` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts) converts its two-level list to `table` → `tableRow` → `tableCell`, sets `header` for configured header rows, and propagates `align`.
- The upstream [`csv-table` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts) parses each CSV field as inline MyST, emits the same table nodes, and marks `header` rows supplied by `:header:` or `:header-rows:`.
- The MyST [tables guide](https://mystmd.org/guide/tables) is the author-facing source for pipe tables, `table`, `list-table`, `csv-table`, alignment, captions, and raw HTML complex tables.
- Upstream HTML conversion uses a table-cell transform before the mdast-to-HAST schema is applied. [HTML table transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/transforms.ts)

### Structural and raw nodes

- The CommonMark-compatible [thematic-break schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/commonmark.schema.json) represents horizontal rules as `thematicBreak`.
- An explicit MyST target is a `mystTarget` with a label; the [reference schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/references.schema.json) states that it labels the following node.
- The [`div` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/div.ts) emits a `div` node, populates it from parsed body children, and applies common directive options such as class, ID, and style.
- The [`span` role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/span.ts) emits an inline `span` node and applies common role options to it.
- The [`raw` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/raw.ts) emits a `raw` node with `lang`, `value`, and export-specific `tex` or `typst` properties.
- The upstream HTML schema maps generic structural nodes directly to HTML elements, including `aside`, `div`, `span`, and `raw` handling. [MyST-to-HTML schema](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts)

### Asides and quotations

- The [`aside` directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/aside.ts) supports aliases `margin`, `sidebar`, and `topic`; it emits `aside` and optionally prepends an `admonitionTitle`.
- The MyST [asides guide](https://mystmd.org/guide/asides) describes `aside`, margin content, sidebars, and topics as supplementary content rather than normal document flow.
- The blockquote transform recognizes a final paragraph beginning `--`, `---`, or an em dash as an attribution and moves it into a `caption`. [Blockquote transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blockquote.ts)
- The same transform preserves a prebuilt quote container, which is the form used by epigraph and pull-quote directive results. [Quote-container handling](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blockquote.ts)

### Fallback precedent

- The upstream HTML schema renders unknown roles as a `<span class="role unhandled">` and renders their children, rather than deleting them. [Unknown role handler](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts)
- The same schema renders unknown directives as a visible `<div class="directive unhandled">` containing an error paragraph and its children. [Unknown directive handler](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts)
- The theme renderer currently logs an unknown type and returns an empty string, even though it computes child HTML, so author content can disappear. [Current fallback](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) handles paragraphs, headings, lists, basic inline styles, code, images, containers, captions, math, and admonitions, but has no case for the table family or the other nodes in this roadmap.
- The renderer already treats `container` as a wrapper for figures and tables, so table support should extend that branch instead of creating a parallel caption model. [Existing container and caption rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- Headings currently synthesize IDs from rendered text; later roadmap work must instead use resolved `html_id` values where present. [Current heading branch](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- The docs route passes the page’s resolved `mdast` into `renderMystAst`, which means node rendering must work with content-server output rather than only parser output. [Book route](https://github.com/awesome-myst/myst-awesome/blob/main/docs/src/pages/book/[...slug].astro)
- `@awesome-myst/myst-zod` already declares schemas for `table`, `tableRow`, `tableCell`, `thematicBreak`, and `mystTarget`, but the renderer does not import or use those types. [Flow-content schemas](https://github.com/awesome-myst/myst-zod/tree/main/src/flow-content)
- The current local Zod package has `mystDirective` and `mystRole` schemas, so fallback rendering can be typed after a dependency update without broad `any` leakage. [Directive schema](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/directive.ts) and [role schema](https://github.com/awesome-myst/myst-zod/blob/main/src/phrasing-content/static/role.ts)

## Upstream implementation pointers

| Concern | Upstream pointer | Takeaway |
| --- | --- | --- |
| Table AST | [tables schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json) | Use node properties for `<th>`/`<td>` and alignment. |
| Directive lowering | [table.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts) | `list-table` and `csv-table` arrive as ordinary table AST; no renderer-specific directive branch is needed once the AST is supported. |
| Complex spans | [tables guide](https://mystmd.org/guide/tables) | Preserve vetted raw HTML because spanning is shown as HTML, not a table AST extension. |
| HTML conversion | [myst-to-html schema](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts) | Keep element choices conventional and expose unhandled MyST syntax. |
| Quote attribution | [blockquote.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blockquote.ts) | A quote attribution is a `caption` sibling in a quote container. |
| Aside lowering | [aside.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/aside.ts) | Render an `aside` with optional title content. |
| Generic styling | [div.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/div.ts) and [span.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/span.ts) | Preserve class, `html_id`, and safe style metadata. |
| Raw content | [raw.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/raw.ts) | Only HTML/web raw content belongs in the browser output. |

## Implementation guidance

### Renderer API and common helpers

1. Modify [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts).
2. Add local type imports for `Table`, `TableRow`, `TableCell`, `ThematicBreak`, `Target`, and their forthcoming structural-node equivalents from `@awesome-myst/myst-zod`.
3. Add `renderChildren(node: Parent): Promise<string>` to centralize `Promise.all(node.children?.map(renderNode) ?? [])`.
4. Add `htmlAttrs(node, options)` to return escaped `id`, class list, and a strictly allow-listed styling attribute set.
5. Allow `id` from `node.html_id` first and `node.identifier` second; do not stringify arbitrary `data` or arbitrary object properties into HTML attributes.
6. Add `escapeAttribute` beside the existing [`escapeHtml`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/html-escape.ts) utility if it is not already present.
7. Keep raw HTML insertion behind an explicit `isHtmlRawNode` predicate; never treat a generic string node as trusted HTML.

### Tables

1. Add a `case "table"` that renders `<table>` with a `myst-table` class and `data-align` when the table supplies `align`.
2. Render a table with one logical `<tbody>` by default; split into `<thead>` plus `<tbody>` only when the leading contiguous rows contain `header: true` cells.
3. Do not infer a header from row index: inspect every cell’s `header` field, as emitted by [`list-table`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts) and [`csv-table`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts).
4. Add a `case "tableRow"` that renders `<tr>` and uses `renderChildren`.
5. Add a `case "tableCell"` that selects `<th scope="col">` for `header: true`, otherwise `<td>`.
6. For `align: left|center|right`, emit `class="myst-table__cell myst-table__cell--align-…"`, not deprecated presentational `align` attributes.
7. Support nonstandard `rowspan` and `colspan` only when they are finite positive integers on a node received from compatible upstream output; emit escaped numeric attributes and otherwise ignore them.
8. Render the cell children directly; a table cell’s schema permits phrasing content, so do not force nested paragraphs. [TableCell schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json)
9. Extend the existing `container` branch: for `kind === "table"`, output `<figure class="myst-table-container">`, put a table `caption` inside the table when structurally possible, and use `<figcaption>` for the directive/container caption.
10. Prefer native `<table>` semantics over a Web Awesome surrogate. Add responsive overflow styling in a new `packages/myst-awesome/src/styles/myst-table.css` and import it from the theme’s style entry point.
11. Confirm Web Awesome has no dedicated table primitive during implementation; do not assert one without a documented component.

### Thematic breaks, targets, spans, and divs

1. Add `case "thematicBreak"` returning `<wa-divider class="myst-thematic-break"></wa-divider>`, with a CSS fallback rule so the document remains legible if custom elements are unavailable.
2. The native alternative is `<hr>`; use it only if the project decides component hydration cost is unjustified. The Web Awesome `wa-divider` mapping is a project convention to confirm during implementation.
3. Add `case "mystTarget"` returning `""` because the upstream target transform transfers its normalized identifier and removes the node before final rendering. [Target transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts)
4. Treat a remaining `mystTarget` in development as diagnostic data: include an HTML comment with the escaped label, never a visible empty anchor that could duplicate IDs.
5. Add `case "span"` that emits `<span>` and uses `htmlAttrs` plus rendered children.
6. Add `case "div"` that emits `<div>` and uses `htmlAttrs` plus rendered children.
7. Preserve class names and `html_id` generated by common directive/role options, but reject event handler attributes, `srcdoc`, and untrusted URL-bearing attributes.
8. Permit a `style` string only after a small sanitizer exists; initially prefer classes and omit style with a development warning rather than passing arbitrary CSS.

### Raw and aside rendering

1. Add a single explicit renderer option, `rawHtmlPolicy: "deny" | "allow"`, defaulting to `"deny"`. It is the only input that authorizes raw markup to reach the browser; there is no ambient "upstream content policy" signal and no implicit trust derived from where the AST came from.
2. Add `case "raw"` that returns an empty production string whenever `rawHtmlPolicy` is `"deny"`, regardless of `lang`. Only under `"allow"` may `value` be emitted, and then only for `lang` equal to `html`, `web`, or empty.
3. Treat empty `lang` as the highest-risk case, not the most permissive one: an unlabelled `raw` node carries no author declaration of format, so it renders only under the same explicit `"allow"` opt-in as `html`/`web` and never by default.
4. For `tex`, `latex`, `typst`, and unknown raw formats, return an empty production string under either policy because those are export-specific values in the upstream directive. [Raw directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/raw.ts)
5. In development, render a `<pre class="myst-raw--unsupported">` diagnostic only when an opt-in renderer option is enabled; never expose TeX/Typst raw text accidentally in production pages.
6. Surface `rawHtmlPolicy` as a site-level setting (for example `site.options.raw_html: allow`) so enabling executable markup is a recorded deployment decision in one place, not a per-call-site argument that drifts between routes.
7. Document the trust boundary next to the raw branch: content-server raw HTML is executable markup that runs with the site's origin and privileges. A project that renders untrusted or contributed content must leave the default in place.
8. Cover both branches in tests: the denied empty-`lang` path must produce an empty string, the denied `html` path must produce an empty string, and the allowed paths must round-trip the value unchanged. The deny-path tests are the ones that must not be skipped when raw support is still incomplete.
9. Add `case "aside"` returning `<aside class="myst-aside …">`.
10. Detect a leading `admonitionTitle` child, render it as `<h2 class="myst-aside__title">` or `<p role="heading">` according to the surrounding heading outline, then render the remaining children in `<div class="myst-aside__body">`.
11. Add `myst-aside--margin`, `myst-aside--sidebar`, and `myst-aside--topic` modifier classes from the aside `kind`; map no aside to `myst-aside--default`.
12. Use CSS grid placement rather than a Web Awesome card so an aside preserves `<aside>` landmark semantics and can participate in the DocsLayout columns.

### Blockquote attribution and quote containers

1. Keep the existing `blockquote` output as `<blockquote>` but teach the `container` branch about `kind === "quote"`.
2. Render a quote container as `<figure class="myst-quote …">`, with `<blockquote>` in normal order and a following `<figcaption class="myst-quote__attribution">` for its caption.
3. Apply `myst-quote--epigraph` and `myst-quote--pull-quote` classes from directive-provided classes or metadata; do not key behavior on display text.
4. Render an orphan `caption` after a bare `blockquote` as `<footer>` inside that blockquote when no quote container exists.
5. Add CSS for citation-dash removal only if the transform did not already strip it; the upstream transform strips the attribution marker before making the caption. [Attribution lifting](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blockquote.ts)

### Unknown directives, roles, and nodes

1. Add `case "mystRole"` that renders `<span class="myst-role myst-role--unhandled" data-myst-role="…">` around rendered children.
2. Add `case "mystDirective"` that renders `<div class="myst-directive myst-directive--unhandled" data-myst-directive="…">`, an accessible warning summary in development, and rendered children.
3. Read directive/role name from the known AST property, escape it for text and attributes, and omit it safely if absent.
4. Replace `default` with `const childHtml = await renderChildren(node as Parent);`.
5. In production, return `<span class="myst-node--unknown" data-myst-node="…">${childHtml}</span>` for phrasing content and `<div …>` for likely flow content; never return `""` merely because the type is unknown.
6. In development, prepend a compact `<aside class="myst-render-warning" role="status">Unsupported MyST node: …</aside>` banner before the rendered children.
7. Gate warnings with `import.meta.env.DEV` or an explicit renderer option so static production HTML contains author content but no internal implementation notices.
8. Keep `console.warn` in development, include the node type and position, and deduplicate repeated warnings by type to avoid console floods.
9. Add a final defensive branch for leaf unknown nodes that returns escaped `value` or `raw` text if present; this protects future text-like nodes without turning arbitrary objects into `[object Object]`.

### Files to create or modify

| File | Change |
| --- | --- |
| [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) | Add all node branches, helpers, renderer options, safe fallback, and metadata-aware IDs. |
| `packages/myst-awesome/src/lib/myst-html-attrs.ts` | Create a tested allow-list for classes, IDs, table spans, and optionally sanitized style values. |
| `packages/myst-awesome/src/styles/myst-table.css` | Create responsive table, header, alignment, caption, and overflow styles. |
| `packages/myst-awesome/src/styles/myst-structural.css` | Create aside, quote, raw-diagnostic, divider, and unhandled-node styles. |
| [`packages/myst-awesome/src/layouts/BasePage.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/BasePage.astro) | Import the two new style modules beside the existing admonition stylesheet import. |
| `packages/myst-awesome/tests/core-ast-parity.spec.ts` | Create end-to-end rendering coverage for all supported node cases. |
| `packages/myst-awesome/tests/fixtures/core-ast-parity.json` | Create compact resolved-AST fixture inputs. |

## myst-zod notes

- Table, table row, table cell, thematic break, target, and directive/role schemas already exist in the local [`myst-zod` source tree](https://github.com/awesome-myst/myst-zod/tree/main/src), so this renderer change should consume them rather than duplicate AST interfaces.
- Verify whether `span`, `div`, `raw`, and `aside` are exported by the pinned package version; add schema files and union membership in `phrasing-content.ts` or `flow-content/flow-content.ts` where missing.
- Preserve the upstream property spelling `html_id`, `identifier`, `label`, `header`, `align`, `lang`, `value`, `kind`, and `children`; adapters belong in the renderer, not in Zod transforms.
- Add optional positive-integer `rowspan` and `colspan` only as compatibility fields if observed in content-server payloads; do not alter the canonical [table schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json) to claim they are native MyST table-cell fields.
- Export a discriminated union broad enough that `renderMystAst` can exhaustively switch after updating `@awesome-myst/myst-zod` to the published version that contains the added nodes.

## Tests to reproduce

- Reproduce the table directive lowering from [upstream `table.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/table.ts): a captioned `table`, a one-row-header `list-table`, and `csv-table` header data plus `header-rows`.
- Use table AST fixtures conforming to the [table schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/tables.schema.json), including `header`, table alignment, and cell alignment.
- Reproduce the raw HTML spanning-table example in the [MyST tables guide](https://mystmd.org/guide/tables) and verify its `rowspan`, `colspan`, and `align` survive only through the raw-node policy.
- Reproduce title-bearing `aside`, `margin`, `sidebar`, and `topic` output from the [aside directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/aside.ts).
- Reproduce final-paragraph quote attribution and prebuilt quote-container behavior from the [blockquote transform tests](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/blockquote.spec.ts).
- Reproduce unhandled directive and role presentation from the [upstream HTML schema](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-to-html/src/schema.ts).

## Tests to create

- Create `core-ast-parity.spec.ts` with a “native table semantics” test asserting `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, `<td>`, and alignment classes.
- Add “list-table and csv-table AST parity” coverage using explicit `header` flags rather than parser source text.
- Add “table container caption” coverage asserting directive captions remain associated with the table and caption-number output remains visible.
- Add “complex raw HTML table preserves permitted spans” coverage under an enabled raw-HTML renderer option, plus a disabled-policy test.
- Add “thematic break renders a divider with fallback semantics” coverage.
- Add “target nodes do not render duplicate anchors” coverage for a residual `mystTarget` and a following heading with `html_id`.
- Add “span and div preserve safe classes and IDs” coverage and a negative test for event-handler attributes.
- Add “aside aliases produce landmark and modifiers” coverage for default, margin, sidebar, and topic kinds.
- Add “blockquote attribution becomes a quote figcaption” coverage for transformed quote AST.
- Add “unknown directive, role, and node preserve child text” coverage in production mode.
- Add “development unknown-node banner is visible and escaped” coverage, with a node type containing markup-like text.
- Add a small `myst-html-attrs.test.ts` unit suite for escaping, class splitting, safe numeric spans, and style rejection.

## Acceptance criteria

- [ ] Pipe-table, `table`, `list-table`, and `csv-table` resolved AST render as accessible native tables.
- [ ] Header cells, alignment, captions, and valid cell spans are represented in output without relying on row position heuristics.
- [ ] Complex table `rowspan`/`colspan` works through the configured raw-HTML path and is never silently invented for standard table nodes.
- [ ] `thematicBreak`, `span`, `div`, `raw`, `aside`, `mystTarget`, and quote-attribution structures have explicit behavior.
- [ ] `rawHtmlPolicy` defaults to `"deny"`, an empty-`lang` `raw` node emits nothing under that default, and non-HTML export raw is never emitted as browser markup under either policy.
- [ ] Unknown directives, roles, and generic nodes render their children in production.
- [ ] Development builds visibly identify unsupported node types without leaking unescaped source content.
- [ ] All generated attributes are escaped and restricted to the allowed set.
- [ ] Existing caption, image, admonition, math, and footnote Playwright tests remain green.

## Dependencies and ordering

- This document must land before [03-cross-references-and-numbering.md](03-cross-references-and-numbering.md), because reference targets, resolved `html_id`, caption numbers, and hover content depend on safe structural rendering.
- This document must land before [04-citations-and-bibliography.md](04-citations-and-bibliography.md), because citation fallbacks and bibliography output require the non-destructive unknown-node policy.
- The renderer type work can proceed in parallel with a `@awesome-myst/myst-zod` version bump, but merging the switch branches should wait until all imported discriminated-union members are available.
