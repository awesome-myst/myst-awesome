---
title: "Proofs, theorems, and exercises"
description: "Render MyST proof-family and exercise/solution nodes with enumeration, disclosure, and cross-reference-ready semantics."
---

This phase gives theorem-like content and pedagogical exercises a first-class, accessible presentation in myst-awesome. It renders the semantic AST emitted by the MyST proof and exercise extensions, keeps upstream numbering and labels intact, provides optional disclosure for solutions, and prepares the markup for the project’s cross-reference renderer. The authoring surface is documented by the [MyST proofs guide](https://mystmd.org/guide/proofs-and-theorems) and [MyST exercises guide](https://mystmd.org/guide/exercises).

## Status

| Field | Value |
| --- | --- |
| Priority | P2 |
| Effort | L |
| Depends on | Foundational AST-schema acceptance, renderer escaping policy, and cross-reference/enumeration integration |

## Overview

- Render `proof` nodes for every actual upstream proof kind, not only the common theorem/lemma/corollary examples.
- Render `exercise` and `solution` as related, label-addressable containers that preserve upstream `hidden`, `gate`, title, and numbering information.
- Use `wa-callout` variants when the visual language fits; use dedicated styled wrappers when mathematical content needs a more neutral theorem treatment.
- Render solution content in `<wa-details>` by default, with a predictable accessible summary and an implementation-configurable default open state.
- Preserve `identifier`, `label`, `enumerated`, `enumerator`, `kind`, and title fragments for future/parallel cross-reference resolution.
- Keep the defaults legible in both light and dark themes without encoding a semantic proof kind as a color-only signal.

## Background and references

### Actual upstream node kinds

- The proof directive always emits `type: "proof"`; the specialization is carried in `kind`, not in the AST node type. [The directive implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/src/proof.ts) also accepts the legacy `prf:*` aliases and the preferred `proof:*` aliases.
- The complete verified proof-kind list is `proof`, `axiom`, `lemma`, `definition`, `criterion`, `remark`, `conjecture`, `corollary`, `algorithm`, `example`, `property`, `observation`, `proposition`, `assumption`, and `theorem`. [The exported `PROOF_KINDS`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/src/types.ts) is authoritative.
- Proof directives default to `enumerated: true`, accept `:nonumber:` as a legacy override, can carry common directive targeting data, and place an optional title in an `admonitionTitle` child. [Proof AST construction](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/src/proof.ts) defines the behavior.
- An exercise emits `type: "exercise"` and receives a normalized `label`/`identifier`; numbered unlabeled exercises receive a generated fallback label. [The exercise directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/src/exercise.ts) also supports `hidden`, `enumerated`, and gated start/end nodes.
- A solution emits `type: "solution"` with an `admonitionTitle` containing “Solution to” plus a `crossReference` to the required exercise target. [The solution construction](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/src/exercise.ts) also supports `hidden` and gates.

### Numbering and cross-references

- MyST’s enumeration transform explicitly recognizes `proof` and `exercise` as enumerated content types. [The enumeration transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts) must run upstream of this theme; myst-awesome must render the resulting enumerator rather than calculate a second number.
- MyST resolves label links to `crossReference` nodes in its post-transform AST, and its AST primer identifies that post-transform tree as the form most renderers consume. [MyST AST primer](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/docs/ast-primer.md)
- The reference role accepts `ref`, `eq`, `numref`, `prf:ref`, and `proof:ref` aliases and emits a `crossReference` node. [The reference role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/reference.ts) is the MyST equivalent to the requested `{prf:ref}` behavior.
- The public proof guide recommends ordinary MyST cross-reference syntax and documents `{proof:ref}`; the exercise guide documents `ref`/`numref` for exercises and linked solutions. [Proof references](https://mystmd.org/guide/proofs-and-theorems) and [exercise references](https://mystmd.org/guide/exercises) should both render through the same eventual `crossReference` case.

### Compatibility references

- MyST’s proof guide states that its implementation and examples are based on [Sphinx Proof](https://github.com/executablebooks/sphinx-proof), whose `prf` domain provides proof-family directives and `prf:ref`.
- [sphinx-exercise](https://github.com/executablebooks/sphinx-exercise) is the Sphinx counterpart for exercise and solution directives; retain its author-facing distinction between a numbered exercise and a solution tied to that exercise.
- Web Awesome documents `wa-details` as a summary-and-disclosure component, making it the appropriate solution toggle rather than a menu control. [Web Awesome Details](https://webawesome.com/docs/components/details/)

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) has no `proof`, `exercise`, `solution`, or `crossReference` cases, so these nodes currently disappear after an unknown-node warning.
- The renderer already handles `admonition` and `admonitionTitle`, which supplies a useful visual and structural baseline but must not collapse proof-family semantics into arbitrary admonition kinds. [The current admonition case](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) is reusable presentation infrastructure.
- [`Admonition.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/Admonition.astro) and its Resolver demonstrate how a default component can remain theme-overridable. [The Resolver implementation](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/AdmonitionResolver.astro) is the required pattern.
- `@awesome-myst/myst-zod` currently has no proof, exercise, or solution node schema, so its root/flow unions must expand before a typed renderer can accept these inputs. [The current flow-content union](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/flow-content.ts) shows the registration point.
- The renderer currently escapes identifiers when rendering generic containers; proof/exercise components must use the same safe target-id behavior rather than emit labels raw. [The current container implementation](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) is the immediate reference.

## Upstream implementation pointers

| Concern | Source | What to preserve |
| --- | --- | --- |
| Proof AST | [`myst-ext-proof/src/proof.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/src/proof.ts) | `type`, `kind`, title child, `enumerated`, `nonumber` precedence, common target metadata |
| Proof-kind universe | [`myst-ext-proof/src/types.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/src/types.ts) | all 15 kinds, including non-obvious `criterion`, `property`, and `observation` |
| Exercise AST | [`myst-ext-exercise/src/exercise.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/src/exercise.ts) | generated label for enumerated unlabeled exercises, `hidden`, gates |
| Enumeration | [`myst-transforms/src/enumerate.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts) | upstream enumerator/template resolution |
| Reference AST | [`myst-roles/src/reference.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/reference.ts) | `crossReference.kind`, label, identifier |
| Authoring guidance | [proofs and theorems](https://mystmd.org/guide/proofs-and-theorems), [exercises](https://mystmd.org/guide/exercises) | titles, labels, hiding, linked solutions, gated syntax |

## Implementation guidance

### Components and presentation model

1. Add `Proof.astro` and `ProofResolver.astro`, `Exercise.astro` and `ExerciseResolver.astro`, plus `Solution.astro` and `SolutionResolver.astro` in `packages/myst-awesome/src/components/`.
2. Follow the repository Resolver contract from [`AGENTS.md`](https://github.com/awesome-myst/myst-awesome/blob/main/AGENTS.md): each resolver accepts `component?: any`, selects a default when absent, and forwards the typed props.
3. `Proof.astro` should accept `kind`, `titleHtml`, `bodyHtml`, `identifier`, `label`, `enumerated`, `enumerator`, and class tokens. It renders an `<aside>` or `<section>` with `data-myst-kind`, stable `id`, and a title line such as “Theorem 2 (Optional title).”
4. Use `wa-callout` only for kinds that should signal an instructional/status tone (`remark`, `example`, `observation`, `assumption`, `conjecture`). Render mathematical statement kinds (`theorem`, `lemma`, `corollary`, `axiom`, `definition`, `criterion`, `proposition`, `property`, `algorithm`, `proof`) in a custom styled container so they do not imply warning/success status.
5. Use an explicit, documented `PROOF_KIND_STYLE` mapping in a new `packages/myst-awesome/src/lib/proof-styles.ts`; it must have a default and must cover every verified upstream kind.
6. `Exercise.astro` should present the number/title/body as an article-like container, use a consistent exercise marker, and set `hidden` content to no rendered DOM rather than merely visually concealing it.
7. `Solution.astro` should render `<wa-details class="myst-solution">` with a summary made from “Solution” plus the resolved exercise number/title fragment. Add an `open` prop controlled by theme configuration; default to closed.

### Renderer changes

1. Add `case "proof"`, `case "exercise"`, and `case "solution"` to [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts).
2. Centralize target extraction in a helper that prefers `identifier`, falls back to `label`, and applies `escapeHtml`; never derive an id from a rendered title.
3. Split direct children into one `admonitionTitle` fragment and body fragments. Render the title once; do not accidentally render it in both the component heading and body.
4. Pass `node.enumerated !== false` and the upstream `node.enumerator` through to the component. If no enumerator is present, leave the visual number empty rather than guessing a counter.
5. Render a plain `proof` kind label as “Proof”; make the display label for every other kind title-cased from an allowlist, not from untrusted node text.
6. For `hidden: true`, return `""` early for proof/exercise/solution nodes. Preserve upstream gate behavior by rendering resulting normal flow in document order; do not invent client-side gates.
7. Add a provisional `case "crossReference"` only if the cross-reference roadmap is not landing first: emit an escaped `<a href="#identifier">` with already-resolved children/text, carry `data-myst-xref-kind`, and avoid resolving title/number in the theme. Replace this provisional behavior when the shared cross-reference renderer lands.
8. Make `Solution.astro` responsible for disclosure markup, while `render-myst-ast.ts` remains responsible only for AST-to-props partitioning and escaping.
9. Preserve all root CSS styles under component-scoped classes and `data-myst-kind`; do not couple proof colors to any arbitrary author class.

### Numbering, labels, and xrefs

- Treat MyST as the only numbering authority. The theme may display `enumerator`, but must not increment state across pages or nested content.
- Preserve `label`/`identifier` even for unnumbered nodes because they remain valid reference targets.
- Recognize `{proof:ref}` and legacy `{prf:ref}` only through their transformed `crossReference` form; parsing roles inside the Astro theme would duplicate the MyST pipeline.
- Support Markdown links such as `[](#my-theorem)`, explicit `[{number}]`, `ref`, and `numref` through the same target/href renderer once the xref data is available, per the [MyST cross-reference guide](https://mystmd.org/guide/cross-references).
- Do not treat a solution as independently numbered: upstream solutions inherit their contextual reference from the target exercise. [The MyST exercise guide](https://mystmd.org/guide/exercises) documents that relationship.

### Visibility and publication policy

- Treat `hidden` as a build/render visibility decision: do not place hidden exercise or solution text in an off-screen, searchable, or assistive-technology-visible container.
- Keep solution disclosure distinct from `hidden`: a closed `<wa-details>` is reader-controlled progressive disclosure, while `hidden` means no publication of the directive content.
- Preserve upstream `gate: "start"` and `gate: "end"` markers in schemas/fixtures even though the completed post-transform document should render normal document order.
- Do not add browser-side checking, answer submission, scoring, or persistence in this phase; those are pedagogical product features outside the MyST AST contract.
- Make the kind-to-presentation mapping a documented theme customization point so sites can adopt domain-specific proof labels without redefining MyST node kinds.

## myst-zod notes

- Add one module per discriminator — `extensions/proof.ts`, `extensions/exercise.ts`, and `extensions/solution.ts` — under `myst-zod/src/`, following the layout in [12-myst-zod-updates.md](12-myst-zod-updates.md), then add all three to [`flow-content.ts`](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/flow-content.ts).
- `proofSchema` needs `type: "proof"`, optional `kind` constrained to the complete upstream list, `enumerated`, optional `enumerator`, `identifier`, `label`, `hidden`, `class`, and recursive children.
- `exerciseSchema` needs `type: "exercise"`, `enumerated`, optional `enumerator`, `hidden`, optional `gate: "start" | "end"`, target metadata, and children.
- `solutionSchema` needs `type: "solution"`, `hidden`, optional `gate`, target metadata, and children. It must permit an `admonitionTitle` containing a `crossReference`.
- Add or complete the `crossReference` schema in the phrasing union before solution titles can be validated end to end.
- Publish fixtures that demonstrate every proof kind, explicit/implicit labels, enumerated false, gates, hidden nodes, and a solution title cross-reference.

## Tests to reproduce

- Reproduce proof titles, default enumeration, plain/aliased directive names, and `proof:theorem` parity from [`myst-ext-proof/tests/proof.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-proof/tests/proof.spec.ts).
- Reproduce explicit labels, `nonumber` precedence, and generated labels for enumerated unlabeled exercises from [`myst-ext-exercise/tests/exercise.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-exercise/tests/exercise.spec.ts).
- Reproduce proof kind authoring, references, and hiding scenarios from the [MyST proofs guide](https://mystmd.org/guide/proofs-and-theorems).
- Reproduce linked solutions, unnumbered exercises, gates, and hidden directives from the [MyST exercises guide](https://mystmd.org/guide/exercises).
- Reproduce label-link transformation and reference placeholder semantics from [`myst-transforms/src/enumerate.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/enumerate.ts) and [MyST cross-references](https://mystmd.org/guide/cross-references).

## Tests to create

- `packages/myst-awesome/tests/proof-rendering.spec.ts`: fixture one of each proof kind; assert title label, optional enumerator, id, body, and variant/custom-container mapping.
- `packages/myst-awesome/tests/exercise-rendering.spec.ts`: numbered/unnumbered/hidden/gated exercise fixtures and stable target ids.
- `packages/myst-awesome/tests/solution-rendering.spec.ts`: closed-by-default `wa-details`, accessible summary, open configuration, linked-exercise title, and hidden solution behavior.
- `packages/myst-awesome/tests/proof-exercise-xref.spec.ts`: rendered `crossReference` anchors for standard Markdown, `ref`, `numref`, `proof:ref`, and `prf:ref` inputs after MyST transformation.
- `packages/myst-awesome/tests/proof-exercise-overrides.spec.ts`: resolver overrides receive kind, enumerator, target id, title HTML, and body HTML.
- `packages/myst-awesome/src/lib/render-myst-ast.proofs.spec.ts`: unit coverage for child partitioning, kind fallback, escaped identifiers, no duplicate title, and no local numbering.

## Acceptance criteria

- [ ] Every verified proof kind renders with a stable, deliberate presentation and a safe default.
- [ ] Proof and exercise numbers display only when supplied by upstream enumeration; no client/theme counter exists.
- [ ] Label and identifier values become escaped, stable DOM ids for xrefs.
- [ ] Exercises preserve default enumeration, explicit `enumerated: false`, generated labels, `hidden`, and gated AST forms.
- [ ] Solutions render as accessible `wa-details` disclosures and retain their reference to the parent exercise.
- [ ] `{proof:ref}`, `{prf:ref}`, `ref`, `numref`, Markdown label links, and shorthand references all converge on the `crossReference` renderer.
- [ ] New proof/exercise/solution components support Resolver overrides.
- [ ] The renderer does not infer numbering, parse roles, or silently substitute an unrelated admonition kind.
- [ ] The same fixtures pass in light and dark themes with no color-only meaning or hidden textual title.

## Dependencies and ordering

1. Land [02-core-ast-parity.md](02-core-ast-parity.md) first, for arbitrary flow-node children and the core structural/fallback rendering these containers sit on. Roadmap 02 does not own the `crossReference` branch.
2. Land [03-cross-references-and-numbering.md](03-cross-references-and-numbering.md) before this phase’s final acceptance: it owns the `crossReference` renderer, target IDs, and enumerator handling. Proof/exercise containers can render first, but `{proof:ref}`-equivalent output cannot be correct without resolved xref metadata.
3. [05-ui-extension-components.md](05-ui-extension-components.md) should land before this phase’s solution UI so `Solution.astro` can reuse the shared Resolver and `wa-details` conventions.
4. [07-code-execution-and-outputs.md](07-code-execution-and-outputs.md) can follow independently, but exercise gates and solutions must be tested again when executable code-cell/output support lands.
