---
title: Cross-references, targets, and numbering
description: Consume MyST’s resolved reference model for stable IDs, numbering, internal links, hover previews, and cross-project references.
---

This roadmap makes the Astro theme a faithful consumer of MyST’s resolved reference data rather than a second implementation of document semantics. The MyST processing pipeline already assigns targets, normalizes IDs, resolves local and remote links, and enumerates document structures; myst-awesome should preserve that output, render it accessibly, and use the existing cross-reference manifest for site-wide navigation. The implementation reference is the upstream [enumeration transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts), [target transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts), and [reference-link handling](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-transforms/src/links).

## Status

| Field | Value |
| --- | --- |
| Priority | P0 |
| Effort | XL |
| Depends on | 02-core-ast-parity |

## Overview

- Render resolved `crossReference` nodes as robust document links, including link text produced by upstream transforms.
- Use MyST-provided `html_id` and `enumerator` fields for headings, figures, tables, equations, and sections.
- Add progressive-enhancement hover previews fed by JSON page data, while keeping ordinary links fully usable without JavaScript.
- Consume project `numbering` frontmatter at the loader boundary and keep semantic resolution out of the HTML renderer.
- Preserve `{ref}`, `{numref}`, `{eq}`, and `{doc}` role output without treating source-role spellings as a rendering API.
- Support MyST cross-project references from `myst.xref.json` and intersphinx results already resolved by the headless content server.

## Background and references

### Targets, identifiers, and IDs

- A MyST explicit target is a `mystTarget` node with a label, and the [reference schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/references.schema.json) describes it as providing an identifier for the following node.
- The [`mystTargetsTransform`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts) normalizes a target label, transfers target attributes to the following node, and removes the target node.
- The [`headingLabelTransform`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts) adds implicit `label`, `identifier`, and `html_id` values to headings that have none.
- The [`htmlIdsTransform`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/htmlIds.ts) ensures duplicate `html_id` values become unique by suffixing `-1`, `-2`, and so on.
- Therefore the renderer must not recreate IDs from rendered heading text when an upstream `html_id` exists; doing so can break duplicate headings and explicit labels. [Current theme heading logic](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)

### Enumeration and reference text

- Upstream default numbering includes figures, tables, equations, and heading levels, with templates such as `Figure %s`, `Table %s`, and `Section %s`. [Default numbering](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
- `ReferenceState` fills project frontmatter numbering against defaults, initializes counters, applies heading offsets, and assigns each target node an `enumerator`. [Reference state construction](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
- The enumeration transform identifies headings, containers, math/math groups, and proofs as targetable structures; containers determine their reference kind from `kind`. [Target-kind logic](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
- The transform adds `captionNumber` nodes to enumerated containers so captions can render the resolved number as content rather than recomputing it in a theme. [Caption-number transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
- Cross-reference children may contain `%s` or `{number}` placeholders, according to the [cross-reference schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/references.schema.json), and the resolver fills them from the target enumerator.
- For headings, the resolver derives link text from heading children; for figures, tables, and similar targets it looks for a caption, admonition title, or definition term. [Reference-content resolution](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)

### Role lowering

- The [`reference` role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/reference.ts) accepts aliases `eq`, `numref`, `prf:ref`, and `proof:ref`, normalizes the label, and emits a `crossReference` with `kind`.
- The `crossReference.kind` vocabulary is `eq`, `numref`, or `ref` in the [reference schema](https://github.com/jupyter-book/myst-spec/blob/main/schema/references.schema.json).
- The [`doc` role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/doc.ts) lowers to an ordinary link and warns that Markdown links are preferred, so the theme should render the resulting link normally.
- The MyST [cross-references guide](https://mystmd.org/guide/cross-references) is the author-facing syntax reference for targets, references, equations, and numbered references.

### External references

- The [`MystTransformer`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.ts) resolves `xref:key/page#identifier` against loaded MyST cross-reference data and upgrades non-page matches into remote `crossReference` nodes.
- A remote `crossReference` receives `remote`, `remoteBaseUrl`, `url`, `dataUrl`, `identifier`, `label`, and `html_id` from the referenced project. [Remote reference upgrade](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.ts)
- The [`SphinxTransformer`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/sphinx.ts) resolves intersphinx references to an external URL and supplies display text when the original link is empty.
- MyST’s [external references guide](https://mystmd.org/guide/external-references) documents both MyST project references and intersphinx configuration.
- Link validation emits errors for unresolved configured external references and warnings for empty reference text. [Reference check transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/check.ts)

### The manifest contract

- The MyST CLI’s [`writeMystXRefJson`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/site.ts) writes `myst.xref.json` with version, MyST version, and de-duplicated references.
- A manifest reference includes `kind`, `data`, and `url`, and target records add `identifier`, optional distinct `html_id`, and optional `implicit`. [Manifest writer](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/site.ts)
- The CLI copies the manifest into HTML build output and serves it from the development site. [HTML build export](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/html/index.ts) and [site server route](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/build/site/start.ts)
- `myst-astro-collections` already fetches `myst.xref.json`, validates it with `xrefSchema`, persists a public copy, and returns it as the `mystXref` collection. [Theme XRef loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts) and [collection definition](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/collections.ts)
- The page loader subsequently fetches each page `data` URL and exposes resolved page JSON, including `mdast` and references, to Astro. [Page loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)

## Current state in myst-awesome

- The book route renders `page.data.mdast` directly, so it receives the content server’s transformed AST and should not invoke parser-only numbering logic at render time. [Book rendering route](https://github.com/awesome-myst/myst-awesome/blob/main/docs/src/pages/book/[...slug].astro)
- `renderMystAst` has no `crossReference` branch and currently calculates heading IDs from visible text rather than `html_id`. [Theme renderer](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- The local Zod package already models `crossReference` with `kind`, `identifier`, `label`, `html_id`, and static children. [Cross-reference schema](https://github.com/awesome-myst/myst-zod/blob/main/src/phrasing-content/cross-reference.ts)
- The local Zod page contract preserves a page-level `references` object and a resolved `mdast`, but it does not itself enumerate targets. [Page schema](https://github.com/awesome-myst/myst-zod/blob/main/src/page.ts)
- The project loader reads `myst.yml` and returns project/site frontmatter, so it is the appropriate place to expose global numbering settings to pages and components. [Project frontmatter loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)
- The XRef loader currently writes the upstream manifest to the public directory and generates a Fuse index, but does not create a target-index utility or hover-preview data source. [XRef loader behavior](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)

## Upstream implementation pointers

| Concern | Upstream pointer | Theme implication |
| --- | --- | --- |
| Explicit labels | [targets.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts) | Render transferred `html_id`; never render residual target as a duplicate anchor. |
| Duplicate IDs | [htmlIds.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/htmlIds.ts) | Treat `html_id` as authoritative. |
| Number counters | [enumerate.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts) | Consume `enumerator` and `captionNumber`; do not count nodes in the renderer. |
| Local roles | [reference.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/reference.ts) | Render the lowered `crossReference`, not source syntax. |
| Document role | [doc.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/doc.ts) | Ordinary resolved link rendering is sufficient. |
| MyST project XRefs | [links/myst.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.ts) | Use remote `url` plus `dataUrl` for navigation and previews. |
| Intersphinx | [links/sphinx.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/sphinx.ts) | Render the resolved external URL; do not attempt local preview fetches. |
| Manifest emission | [process/site.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/process/site.ts) | Maintain producer compatibility rather than designing a second manifest. |

## Implementation guidance

### Recommendation: resolve at collection/load time, render at render time

- **Recommendation:** numbering and reference resolution belong in MyST processing and `myst-astro-collections` load time, not in `renderMystAst`.
- MyST’s `ReferenceState` handles page order, counter continuation, title offsets, templates, implicit labels, and multi-page lookup, which requires project-wide state unavailable to an isolated renderer call. [Reference state and multi-page resolver](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
- The headless content server already supplies resolved page JSON to the collections loader, so the renderer should be a pure consumer of resolved `html_id`, `enumerator`, `url`, `dataUrl`, and reference children. [Pages loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)
- Extend the loader only to normalize reusable lookup indexes and preserve frontmatter; do not rerun `enumerateTargetsTransform` in Astro.
- Provide a clearly named `unresolved` rendering state for server outputs that have not completed upstream resolution, rather than guessing labels or numbering in the client.

### Stable target rendering

1. Modify [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) so heading IDs use `node.html_id ?? node.identifier ?? generatedSlug`.
2. Add the same `id` precedence to figure/table/quote containers, math wrappers, definitions, and any future targetable node.
3. When a node has `enumerator`, add `data-myst-enumerator="…"`, but do not create visible numbering except where upstream AST includes `captionNumber` or the component explicitly owns its display.
4. Preserve upstream `captionNumber` children as the visible caption label; this maintains template text selected by the numbering configuration. [Caption-number insertion](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
5. Never derive IDs from rendered HTML, because inline markup and duplicate headings make that result unstable.

### Cross-reference HTML

1. Add `CrossReference` to renderer imports and add `case "crossReference"`.
2. Render a resolved local reference as `<a class="myst-xref myst-xref--{kind}" href="{url}#{html_id}">…</a>`.
3. If the node has `url` without an `html_id`, use the URL exactly; append `#html_id` only once and only for an intra-document fragment.
4. For a local same-page target, use `href="#{html_id}"`; for local cross-page targets, use the resolved page URL plus hash.
5. For remote references, combine `remoteBaseUrl` and `url` safely, then append the escaped `html_id` when provided by the [`MystTransformer`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.ts).
6. Render children from the resolved AST as link text; those children already contain title, caption text, or enumerator substitution from the upstream resolver. [Reference-content resolution](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
7. If children are empty, render a development diagnostic and a production-safe label based on `identifier`, never an empty focusable anchor.
8. Mark unresolved references with `aria-invalid="true"` and `myst-xref--unresolved`; preserve any children and emit no fabricated destination.
9. Render `{doc}` output through the existing `link` branch; add tests that prove a lowered doc role remains a normal anchor.

### Hover previews

1. Create `packages/myst-awesome/src/components/XRefHoverPreview.astro` for the server-rendered trigger markup and `packages/myst-awesome/src/lib/wa-xref-preview.ts` for client-side progressive enhancement.
2. Use an ordinary `<a>` as the trigger; attach preview behavior without replacing browser navigation, keyboard activation, copy-link, or context-menu behavior.
3. Store `data-xref-url`, `data-xref-data-url`, `data-xref-identifier`, and `data-xref-remote` on resolved cross-reference links.
4. Validate `dataUrl` before any request. `dataUrl` arrives from cross-reference metadata that can name a remote project, so treat it as untrusted input rather than a theme-generated URL:
   - Resolve it against the document base and require the result to be same-origin, or to match an explicit `options.xref_preview_origins` allowlist of `https:` origins. Reject everything else, including `http:`, `data:`, `blob:`, and `file:`.
   - Send the request with `credentials: "omit"`, `redirect: "error"`, and an `AbortSignal` timeout, so a preview cannot leak cookies to an allowed origin or be walked to a disallowed one by a redirect chain.
   - Require a JSON content type on the response and abandon the preview on any other value.
   - Bound the read: cap the response at a documented byte ceiling and abort past it, so a large or hostile page payload cannot stall the tab.
5. On hover/focus, fetch the validated page JSON, locate the target by `identifier` or `html_id`, and render a sanitized text preview consisting of title/caption plus a bounded content excerpt.
6. Treat every validation or fetch failure as "no preview": log a development diagnostic, mark the link so it is not retried in a loop, and leave the anchor's ordinary navigation, keyboard activation, and context menu completely unaffected. A preview is supplemental and must never become a precondition for following a link.
7. Cache in-flight and resolved preview requests by absolute data URL so repeated links do not refetch a page. Cache only permitted requests; never cache a rejected URL as though it were a miss to retry.
8. Use `wa-tooltip` only for a short loading/error label; render the rich preview in an accessible positioned popover component, because tooltip semantics are too limited for interactive excerpts.
9. Follow the general approach used by Jupyter Book’s MyST theme hover popover—an anchor remains primary and a lazily loaded preview is supplemental—without coupling this Astro implementation to React code.
10. Set `aria-describedby` only while a non-interactive preview is open, close on Escape and blur, and never trap focus.
11. Disable previews for intersphinx and unresolved references because they lack a MyST page-data contract.
12. Add an opt-out frontmatter/site option such as `options.xref_hover_previews: false`, with a default that favors progressive enhancement. Cross-origin previews are separately opt-in through the origin allowlist: the progressive-enhancement default covers same-origin project pages only.

### Loader-side reference index

1. Create `packages/myst-astro-collections/src/xref-index.ts`.
2. Export `buildXrefIndex(xref: XRef)` returning maps by page URL, `identifier`, and `html_id`, retaining `kind`, `data`, `url`, and `implicit`.
3. Use `@awesome-myst/myst-zod`’s [`xrefSchema`](https://github.com/awesome-myst/myst-zod/blob/main/src/myst-xref.ts) as the validation boundary before building maps.
4. Extend [`createMystXrefLoader`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts) to expose the unmodified upstream manifest and derived indexes as separate collection fields; never mutate manifest reference records.
5. Continue writing the raw `myst.xref.json` into public output so downstream projects can consume the same canonical artifact.
6. Add `createXRefPreviewLoader` only if static embedding of snippets is needed later; phase one should fetch existing page data lazily to avoid duplicating all AST content in the manifest.

### Numbering configuration

1. Pass the page and project frontmatter `numbering` values through collections unchanged so display components can make only presentational choices.
2. Do not use these settings to recompute `enumerator`; upstream numbering includes defaults, explicit per-kind templates, `continue`, `start`, title offsets, and local overrides. [Numbering initialization](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts)
3. Add an optional `showSectionNumbers` theme setting only to control CSS visibility of already resolved heading enumerators; it must not change links or references.
4. Render section numbers inside heading content only when the AST contains an intentional resolved number field or a loader-normalized presentation token; avoid a second, divergent numbering system.
5. Document that frontmatter `numbering` changes require a content-server rebuild before Astro reloads its page JSON.

### External-reference behavior

1. Preserve `remote`, `remoteBaseUrl`, `url`, `dataUrl`, and `html_id` on the `CrossReference` schema used by the renderer.
2. Use `url`/`html_id` for remote link destinations and `dataUrl` for optional MyST hover preview fetches.
3. Do not inspect `xref:` or deprecated `myst:` source URIs in the browser; upstream transforms have already normalized and validated them. [MyST URI handling](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.ts)
4. Render intersphinx output as external links with `rel="noopener noreferrer"` when opening a new tab; no XRef preview is attempted.
5. Add a development badge or console diagnostic for `myst-xref--unresolved`, but keep production content readable.

### Files to create or modify

| File | Change |
| --- | --- |
| [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) | Add `crossReference`, resolved ID precedence, reference classes, and data attributes. |
| `packages/myst-awesome/src/components/XRefHoverPreview.astro` | Create accessible anchor-adjacent preview markup. |
| `packages/myst-awesome/src/lib/wa-xref-preview.ts` | Create lazy fetch, cache, target lookup, safe excerpt, and event lifecycle code. |
| `packages/myst-awesome/src/styles/myst-xref.css` | Create link-kind, unresolved, preview, and reduced-motion styles. |
| `packages/myst-astro-collections/src/xref-index.ts` | Create a typed manifest index builder. |
| [`packages/myst-astro-collections/src/loaders.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts) | Attach derived indexes without changing raw manifest persistence. |
| [`packages/myst-astro-collections/src/collections.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/collections.ts) | Expose typed XRef index data if Astro collection schema requires it. |
| `packages/myst-awesome/tests/cross-references.spec.ts` | Create browser tests for local, remote, unresolved, and keyboard preview behavior. |
| `packages/myst-astro-collections/tests/xref-index.test.ts` | Create manifest indexing and duplicate-ID tests. |

## myst-zod notes

- `crossReference` is already represented in the local [`cross-reference.ts`](https://github.com/awesome-myst/myst-zod/blob/main/src/phrasing-content/cross-reference.ts); extend it with optional resolved remote fields only after verifying them against content-server output.
- Keep `html_id` optional and distinct from `identifier`, matching the upstream external-reference type where `html_id` may differ. [MyST XRef type](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/types.ts)
- The local [`myst-xref.ts`](https://github.com/awesome-myst/myst-zod/blob/main/src/myst-xref.ts) should remain the schema for versioned `myst.xref.json`; add no Astro-only fields to that canonical file format.
- Add a separate Zod schema for derived preview/index records if Astro needs validation, so `XRefReference` remains interoperable with upstream producers.
- Ensure targetable renderer node schemas preserve optional `identifier`, `html_id`, and `enumerator` fields through their flow-content unions.

## Tests to reproduce

- Reproduce label transfer and heading implicit-ID behavior from [targets.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/targets.ts).
- Reproduce duplicate `html_id` suffixing from [htmlIds.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/htmlIds.ts).
- Reproduce heading, figure, table, equation, subfigure, and caption-number enumeration paths from [enumerate.spec.ts](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.spec.ts).
- Reproduce `{ref}`, `{numref}`, and `{eq}` lowering from [`reference.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/reference.ts).
- Reproduce the ordinary-link output and warning behavior of `{doc}` from [`doc.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/doc.ts).
- Reproduce MyST project references, explicit/implicit targets, page references, and error cases from [myst link tests](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/myst.spec.ts).
- Reproduce intersphinx target and project URL behavior from [sphinx link tests](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/links/sphinx.spec.ts).
- Reproduce manifest shape from [site XRef output fixture](https://github.com/jupyter-book/mystmd/blob/main/packages/mystmd/tests/outputs/site-xrefs-myst.xref.json).

## Tests to create

- Create `cross-references.spec.ts` with “explicit target uses upstream html_id, not generated slug”.
- Add “duplicate headings retain distinct server-assigned IDs” coverage.
- Add “ref, numref, and eq render resolved children and correct href” coverage using a resolved AST fixture.
- Add “figure/table/equation caption number appears exactly once” coverage.
- Add “doc role lowered link stays a normal anchor” coverage.
- Add “remote MyST XRef combines base URL, page URL, and fragment” coverage.
- Add “intersphinx link is external and has no preview request” coverage.
- Add “unresolved cross-reference preserves text and announces diagnostic in development” coverage.
- Add “hover preview fetches once, opens on focus, closes on Escape, and preserves Enter navigation” Playwright coverage.
- Add “preview failure leaves link usable and shows no unsafe fetched HTML” coverage.
- Add `xref-index.test.ts` cases for unique identifier lookup, `html_id` fallback lookup, duplicate manifest records, implicit targets, and version validation.

## Acceptance criteria

- [ ] All heading and targetable-container IDs use upstream `html_id` when supplied.
- [ ] `crossReference` nodes render valid, keyboard-accessible links for local and remote resolved references.
- [ ] `{ref}`, `{numref}`, `{eq}`, and `{doc}` source syntax works through its resolved AST representation.
- [ ] Figures, tables, equations, and headings display only upstream-resolved enumerators and caption-number nodes.
- [ ] No renderer code counts sections, figures, tables, or equations.
- [ ] Hover previews are progressive enhancement: links work with JavaScript disabled, on error, and on touch devices.
- [ ] Preview fetches are restricted to same-origin or allowlisted `https:` origins, omit credentials, reject redirects, require a JSON content type, and enforce a response-size ceiling.
- [ ] The collections package exposes a typed lookup over the unmodified canonical `myst.xref.json`.
- [ ] Astro output continues publishing `myst.xref.json` for downstream MyST projects.
- [ ] Intersphinx references remain ordinary external links and unresolved references preserve author-visible content.

## Dependencies and ordering

- Requires [02-core-ast-parity.md](02-core-ast-parity.md) for target, caption, table, math, structural-container, and safe fallback rendering.
- Must land before [04-citations-and-bibliography.md](04-citations-and-bibliography.md), because citation links and bibliography anchors need the shared `html_id`, link, hover-preview, and loader data conventions.
- Coordinate with a `myst-astro-collections` schema/version release before consuming new derived index fields in `docs`.
