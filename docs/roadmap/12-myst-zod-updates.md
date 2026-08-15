---
title: myst-zod schema updates
description: Bring the Deno-first myst-zod schemas into parity with MyST 1.10 extension nodes and release them for Astro consumers.
---

Bring `@awesome-myst/myst-zod` from partial mdast/MyST coverage to an explicitly versioned MyST 1.10 schema surface. This is schema work first: no renderer should claim support for a node until the published schema can parse it and the consuming Astro packages can type-check it.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P1 | XL | `01-dependency-updates.md` |

## Overview

The target is an additive 0.7.x release (or 0.8.0 if runtime parsing semantics change) that models the MyST extension types used by mystmd and the directive/role extensions used in docs. Build named schemas for stable AST nodes, compose them into recursive flow/phrasing unions, and keep generic `mystDirective`/`mystRole` only as safe fallbacks.

In the verified 1.10.1 clone, `myst-spec-ext`'s `src/index.ts` only re-exports deprecated aliases from `myst-spec`; use [myst-spec-ext index](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/index.ts) and the actual [myst-spec extension declarations](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) as the parity contract.

## Background and references

MyST's extension declarations define citation, embed/include, raw, notebook-output, aside, iframe, inline-expression, SI-unit, index, and rich cross-reference fields in one source of truth ([myst-spec `ext.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts)).

The directive and role packages create additional concrete node shapes: cards, grids, icons, proofs, exercises, mermaid, glossary, `div`, `span`, and button-as-link/span. Their implementation and tests are the field-level reference where those nodes are not declared in `myst-spec-ext` ([card extension](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/src/index.ts), [button extension](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/src/index.ts), [MyST directives](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-directives/src)).

Zod 4 is relevant because Astro 6 upgrades its own Zod dependency to version 4, while myst-zod is a Deno package currently importing `npm:zod@^3.25.76`. Do not assume a peer-compatible Zod 3/4 schema is sufficient—test Deno and the generated npm package independently ([Astro 6 Zod migration](https://docs.astro.build/en/guides/upgrade-to/v6/), [myst-zod Deno configuration](https://github.com/awesome-myst/myst-zod/blob/main/deno.json)).

## Current state in myst-awesome

- The theme renderer types its root AST as myst-zod `Root`; unknown nodes currently warn and render nothing, so better schemas will expose gaps before rendering work begins ([renderer](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)).
- `myst-astro-collections` imports `pageSchema`, `projectFrontmatterSchema`, and `xrefSchema` from myst-zod in its public collection constructors ([collection definitions](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/collections.ts)).
- The theme also imports myst-zod frontmatter types in layouts and frontmatter components; preserve those public type names and transformations ([DocsLayout](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/DocsLayout.astro), [frontmatter components](https://github.com/awesome-myst/myst-awesome/tree/main/packages/myst-awesome/src/components/frontmatter)).
- The dependency baseline will pin consumers to `^0.7.0`; publish schema changes before adding renderer code that depends on the new discriminated-union members.

## Upstream implementation pointers

- `myst-spec` defines extensions for [citations, embeds, includes, raw, outputs, asides, and cross-references](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts).
- Cards emit `card` with optional `url` and structural `header`, `cardTitle`, and `footer` children ([card directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/src/index.ts)).
- Buttons deliberately emit a `span` with `class: "button"` or a `link` with that class rather than a `button` AST node ([button role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/src/index.ts)).
- Grid, icon, proof, exercise, and tabs have executable reference tests in [grid](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-grid/tests/grid.spec.ts), [icon](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-icon/tests/icon.spec.ts), [proof](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/tests/proof.spec.ts), [exercise](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/tests/exercise.spec.ts), and [tabs](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-tabs/tests/tabs.spec.ts) tests.
- Directives create generic extension nodes including [glossary](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/glossary.ts), [mermaid](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/mermaid.ts), and [div](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/div.ts); roles create [span](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/span.ts) and index-related spans ([indices role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/indices.ts)).

## Implementation guidance

### Audit result and ownership

`src/flow-content/flow-content.ts` already includes table, thematic break, target, generic directive, admonition, container, math, footnotes, definitions, and **both** `tabSet` and `tabItem`; `src/phrasing-content/phrasing-content.ts` already includes cross references, footnote references, typography, links, and static nodes ([flow union](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/flow-content.ts), [phrasing union](https://github.com/awesome-myst/myst-zod/blob/main/src/phrasing-content/phrasing-content.ts)).

`tabSet`/`tabItem` therefore require field review and tests, not a second schema. `card`, `grid`, `icon`, `proof`, `exercise`, `aside`, `embed`, `iframe`, `mermaid`, `glossary`, index nodes, notebook output, `raw`, and `div` are absent as named union members and must be added. A generic directive/role schema is not a substitute for emitted concrete nodes.

### New flow-content schemas

Create the following files under `src/flow-content/`, export them from `src/index.ts`, and add each unique discriminator to `FlowContent` and `uniqueFlowContentSchema`.

| New schema | Required baseline fields | Source/reference |
| --- | --- | --- |
| `citation.ts` | `cite`: `kind`, `label`, optional identifier/children/error/prefix/suffix/partial/enumerator; `citeGroup`: `kind`, `children: Cite[]` | [myst-spec citations](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `aside.ts` | `kind?: sidebar \| margin \| topic`, `class?`, target fields, mixed children | [myst-spec aside](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `embed.ts` | `remove-input?`, `remove-output?`, source dependency, mixed children | [myst-spec embed](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `include.ts` | `file`, literal/filter/lang/line-number/emphasis/filename/target/caption/children fields | [myst-spec include](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `iframe.ts` | `src`, optional width/align/class/title/target/children | [myst-spec iframe](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `outputs.ts` | `output`: target, `jupyter_data`, children; `outputs`: target, children, visibility/scroll/id | [myst-spec outputs](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `raw.ts` | optional lang/tex/typst/value and mixed children | [myst-spec raw](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `extensions.ts` | `card`, `cardTitle`, `header`, `footer`, `grid`, `icon`, `proof`, `exercise`, `mermaid`, `glossary`, `div`, and any locally observed extension children | [card implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/src/index.ts), [directive implementations](https://github.com/jupyter-book/mystmd/tree/main/packages/myst-directives/src) |
| `math-group.ts` | `mathGroup`, target fields, enumerated/enumerator, `children: Math[]` | [myst-spec math group](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |
| `algorithm-line.ts` | `indent?`, `enumerator?`, phrasing children | [myst-spec algorithm line](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) |

Define recursive `mixedContentSchema` helpers with `z.lazy` in one internal module so `embed`, `include`, aside, outputs, card, and div do not create circular import initialization failures. Keep public `ZodType<T>` annotations only at exported boundaries.

### New phrasing-content schemas

Create these under `src/phrasing-content/`, re-export them, and add them to `PhrasingContent` or `StaticPhrasingContent` according to their upstream child contract.

| New schema | Fields and placement |
| --- | --- |
| `inline-expression.ts` | `inlineExpression`: value, optional identifier/result, static children; add to phrasing content ([upstream type](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts)). |
| `si.ts` | `si`: value, optional number/unit/units/alt; add to static phrasing content ([upstream type](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts)). |
| `span.ts` | generic `span` with optional `class` and phrasing children; represent `{button}` through this plus link `class`, not a fictitious `button` node ([button behavior](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/src/index.ts)). |
| `term.ts` | `term`/glossary-reference form with identifier/label/children after inspecting actual parser fixtures; **verify exact emitted fields during implementation**. |
| `download.ts` | a resolved download role node, or a typed role refinement if the parser intentionally preserves `mystRole`; **verify exact emitted discriminator/fields during implementation**. |
| `index.ts` | index entry/group fields using `IndexEntry`; retain role fallback when the transform emits a span ([index entry declaration](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts), [indices role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/indices.ts)). |

### Extend existing schemas

- Extend `node.ts`/`parent.ts` support to preserve shared target metadata (`identifier`, `label`, `html_id`, `indexEntries`) without blindly accepting arbitrary properties. Individual schemas should own fields where the MyST type does.
- Extend `table-cell.ts` with `colspan`, `rowspan`, and `width`; these are declared MyST extensions ([upstream table cell type](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts)).
- Extend `heading.ts`, `image.ts`, `math.ts`, `inline-math.ts`, `code.ts`, `list-item.ts`, `container.ts`, `admonition.ts`, `cross-reference.ts`, and `link.ts` with the MyST extension fields relevant to each type: target metadata, image optimization/source fields, math typst/tight/kind, code execution/visibility/filename, checked lists, richer container source/enumeration metadata, open/icon admonitions, and link/reference resolution metadata ([extension declarations](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts)).
- Preserve the current `tabItem` `title`, `sync`, and `selected` properties; add a parsing test rather than changing it without evidence ([existing tab schema](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/tab-set.ts)).
- Keep `mystDirective` and `mystRole` permissive enough to hold unrecognized extension data, but use `z.record(z.string(), z.unknown())`, not `z.any()`, for options/result-like maps when Zod 4 semantics are adopted.
- Review frontmatter aliases and transforms in `frontmatter/` for Zod 4 compatibility. Preserve user-facing coercions such as downloads, exports, references, and Thebe; they are consumed by Astro frontmatter components ([downloads schema](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter/downloads.ts), [project schema](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter/project.ts)).

### Zod 4 and Deno/npm release plan

1. Create a `zod-v4` branch/PR and change `deno.json` to the intended Zod 4 npm specifier only after a clean Deno test baseline. Audit `z.record`, `z.discriminatedUnion`, transforms, `ZodType<T>` generic assignments, error APIs, and default/unknown-key behavior against Zod 4 migration notes.
2. Replace current `@ts-ignore`/`@ts-expect-error` workarounds around union composition with small typed factory helpers where possible; do not delete a suppression until Deno and generated npm declarations pass.
3. Run `deno test`, `deno task build:npm`, and tests against the generated `npm/` package in a clean Node workspace. The package is Deno-first but its consumers are pnpm/Astro packages ([Deno tasks](https://github.com/awesome-myst/myst-zod/blob/main/deno.json)).
4. Publish a prerelease such as `0.7.1-rc.0` if Zod 4 is included; install that tarball/version in myst-awesome and myst-astro-collections, then publish `0.7.1` after their build and test matrix is green.
5. Publish a minor `0.8.0` instead if strict parsing newly rejects ASTs accepted by 0.7.0. Document every intentional rejection in the changelog and offer a migration note.

### Consumer rollout

1. In myst-awesome, move the direct dependency to the published release and change renderer imports/types only after schema tests pass. Add exhaustiveness checks to `render-myst-ast.ts` in the following renderer-parity PR, not in the schema release ([renderer](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)).
2. In myst-astro-collections, update the direct dependency and run `tsc`; validate page/project/xref loaders against generated MyST 1.10 AST payloads ([loaders](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)).
3. Keep myst-awesome's root override at the released compatible range so docs and workspace packages resolve the same schema implementation ([root override policy](https://github.com/awesome-myst/myst-awesome/blob/main/package.json)).

### Schema design rules

- Use one file per public named AST discriminator, a colocated exported TypeScript type, and a schema name ending in `Schema`; this matches the current flow-content organization ([current schema exports](https://github.com/awesome-myst/myst-zod/blob/main/src/index.ts)).
- Model required upstream fields as required, but preserve parser-phase optionality for transformed content. Do not make a field required merely because a renderer wants it.
- Use string unions for known rendering states such as output visibility and citation kinds; use `z.unknown()` only at explicit extension-map boundaries.
- Keep AST schemas strict enough to flag misspelled structural fields, but decide unknown-key policy by node family and test it under both Deno and generated npm consumption.
- Use `z.lazy` only at real recursion points and centralize shared mixed-child unions; circular files are a recurring source of runtime initialization bugs in ESM.
- Treat `mystDirective` and `mystRole` as forward-compatible fallbacks. A recognized transformed node must still graduate to a concrete schema, union entry, and test.

### Delivery slices

| Slice | Schema scope | Consumer gate |
| --- | --- | --- |
| A | cited upstream `myst-spec` nodes: cite, citeGroup, aside, embed/include, iframe, raw, output/outputs, inlineExpression, SI, mathGroup | Deno and generated npm schema tests |
| B | richer fields on existing tables, headings, images, math, code, containers, links, and cross references | myst-astro-collections `tsc` and loader fixtures |
| C | directive/role extension nodes: card, grid, icon, proof, exercise, mermaid, glossary, span/div, term/index/download policy | renderer fixture tests in myst-awesome |
| D | Zod 4 migration and published release candidate | full consumer build and browser matrix |

## myst-zod notes

This document is the myst-zod implementation plan. Its safety rule is: a named concrete node must have (1) a declared TypeScript type, (2) a Zod schema, (3) union membership, (4) direct parsing tests, and (5) an exported public symbol before consumers rely on it.

Frontmatter is not secondary work. Keep existing page/project transforms stable and add only upstream-backed fields; frontmatter schema compatibility is required for the collection package's public API ([page frontmatter](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter/page.ts), [project frontmatter](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter/project.ts)).

## Tests to reproduce

- Run existing myst-zod [root tests](https://github.com/awesome-myst/myst-zod/blob/main/test/root_test.ts), [new-node tests](https://github.com/awesome-myst/myst-zod/blob/main/test/test_new_nodes.ts), [frontmatter tests](https://github.com/awesome-myst/myst-zod/blob/main/test/frontmatter_test.ts), and [xref tests](https://github.com/awesome-myst/myst-zod/blob/main/test/xref_test.ts) before adding coverage.
- Reproduce upstream extension parsing expectations from [cards](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/tests/card.spec.ts), [grids](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-grid/tests/grid.spec.ts), [icons](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-icon/tests/icon.spec.ts), [proofs](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/tests/proof.spec.ts), [exercises](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/tests/exercise.spec.ts), and [tabs](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-tabs/tests/tabs.spec.ts).
- Use [myst-spec extension declarations](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) as type-level fixtures for cite/citeGroup, iframe, include, raw, output/outputs, aside, embed, inlineExpression, and SI nodes.

## Tests to create

- Add `test/spec-ext-parity_test.ts`: table-driven valid and invalid examples for every exported MyST extension schema, including exact inferred types.
- Add `test/extension-nodes_test.ts`: card/grid/icon/proof/exercise/mermaid/glossary/div/span/button role parse tests plus regression cases for union recursion.
- Add `test/zod4-compat_test.ts`: asserts record unknown-key policy, transformations, discriminated-union errors, and public parse/safeParse behavior under the chosen Zod 4 version.
- Add `test/npm-consumer_test.mjs` (or equivalent generated-package test): imports the `npm/` artifact with Node, parses a page/project/xref and a mixed MyST AST, and checks named exports.
- Add `packages/myst-astro-collections/tests/myst-zod-0.7-fixtures.mjs` and `packages/myst-awesome/tests/myst-zod-consumer.spec.ts` in the consumer repository before publishing final.

## Acceptance criteria

- [ ] The parity table above has a schema, export, union placement, and direct test for every supported node.
- [ ] Existing `tabSet`/`tabItem` are verified rather than duplicated.
- [ ] Cite/citeGroup, aside, embed, include, iframe, inlineExpression, output/outputs, raw, SI, index, span/div, card, grid, icon, proof, exercise, mermaid, glossary/term, and download handling have an explicit schema or documented fallback.
- [ ] Shared MyST target and extension fields are modeled on the correct concrete node types.
- [ ] Deno tests, npm build, generated-package Node test, myst-astro-collections build, and myst-awesome build all pass.
- [ ] Zod 4 behavior and every breaking parse-policy decision are recorded in the release notes.
- [ ] A published myst-zod release is installed by both workspace consumers before renderer changes depend on its types.

## Dependencies and ordering

Land `01-dependency-updates.md` first so consumers are on the MyST 1.10 and Astro baseline. This document must land before the AST-extension rendering documents and before `13-testing-strategy.md` marks extension-node schema cases as supported; it can proceed alongside test-harness scaffolding once the dependency PR is merged.
