---
title: "Code, execution, and Jupyter outputs"
description: "Render full MyST code metadata, inline expressions, static Jupyter outputs, output reuse, and future interactive execution safely."
---

This phase turns code and notebook output from plain highlighted text into a faithful static rendering surface. It covers code-directive metadata, code tabs and copy controls, Shiki line strategies, inline evaluation values, Jupyter MIME bundles, output embedding, and future executable/widget integrations. Static output rendering is P1/P2 work; live kernels and anywidget execution are explicitly P3 stretch work. The main authoring references are the [MyST code guide](https://mystmd.org/guide/code), [output-reuse guide](https://mystmd.org/guide/reuse-jupyter-outputs), and [in-page execution guide](https://mystmd.org/guide/in-page-execution).

## Status

| Field | Value |
| --- | --- |
| Priority | P1 for code parity/static outputs; P3 for live execution and widgets |
| Effort | XL |
| Depends on | Foundational AST-schema acceptance, renderer escaping/sanitization policy, UI tabs/components, and embed/xref resolution |

## Overview

- Match the `code` directive’s rendering-relevant options: `linenos`, `lineno-start`, `emphasize-lines`, `caption`, and `filename`, including line-number behavior for code cells.
- Add copy affordances with [`<wa-copy-button>`](https://webawesome.com/docs/components/copy-button/) and optionally group alternate snippets in the tab components from `05-ui-extension-components.md`.
- Upgrade Shiki output to a controlled line-by-line HTML strategy so current-line numbers and highlights can be added without modifying source code strings.
- Render `inlineExpression` nodes created by `{eval}` as static transformed values, never execute source in the browser during this phase.
- Render static `outputs`/`output` nodes for trusted images, plain text, stderr, and sanitized HTML MIME representations.
- Depend on upstream embed transforms to materialize reused outputs; render the resulting tree without duplicate execution.
- Mark Thebe/JupyterLite in-page execution and `anywidget` as P3 opt-in integrations with an explicit security and dependency boundary.

## Background and references

### Code directives and AST data

- The MyST code directive parses `linenos`, `lineno-start`, legacy `number-lines`, `lineno-match`, `emphasize-lines`, and `filename` into `showLineNumbers`, `startingLineNumber`, `emphasizeLines`, and `filename`. [The option parser](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/code.ts) also validates malformed emphasis ranges.
- The directive wraps a captioned code block in a `container` with `kind: "code"` and a `caption` child; an uncaptained block remains a direct `code` node. [The code directive implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/code.ts) is the parity reference.
- The public guide documents line numbers, emphasized lines, starting line numbers, captions, filenames, literal includes, and code-cell compatibility. [MyST code guide](https://mystmd.org/guide/code)
- `{eval}` creates `{ type: "inlineExpression", value }`; it is a parsing surface, and render-time values are supplied by upstream transformations rather than JavaScript evaluation in the theme. [The eval role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/inlineExpression.ts) and [inline options guide](https://mystmd.org/guide/inline-options) define the author-facing feature.

### Output and reuse AST data

- `myst-spec-ext` reexports `Output` and `Outputs`, while the concrete definitions live in `myst-spec`: an `output` has children and `jupyter_data`; an `outputs` node contains output/placeholder children and can carry `visibility`, `scroll`, and `id`. [The extension reexports](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec-ext/src/index.ts) and [spec output types](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) define the verified local contract.
- The embed directive emits `type: "embed"` with a label source and optional `remove-input`/`remove-output` flags. [The directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/embed.ts) is the AST-level entry point.
- MyST’s output-reuse guide requires authors to label a notebook cell/output and then use standard embedding syntax; it also documents embedding only outputs or both input and output. [Reuse Jupyter outputs](https://mystmd.org/guide/reuse-jupyter-outputs)
- The embed transform explicitly recognizes output nodes when applying `remove-output` and handles notebook code nodes when applying `remove-input`. [The embed transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/embed.ts) should execute before theme rendering.

### Static now; execution later

- MyST documents in-page execution through live Jupyter kernels, Binder-style providers, and browser-side JupyterLite/WebAssembly. [In-page execution](https://mystmd.org/guide/in-page-execution) makes this a separate runtime concern, so it is P3 here.
- The `anywidget` directive produces an `anywidget` node from a JavaScript module URL, optional CSS URL, and JSON model body. [The directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/anywidget.ts) and [widgets guide](https://mystmd.org/guide/widgets) make clear that trusted JavaScript is required.

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) currently calls the Shiki helper for `code` but ignores filename, line numbers, emphasized lines, captions, and code-container meaning.
- [`shiki-highlighter.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/shiki-highlighter.ts) currently returns whole-block Shiki HTML with dual light/dark themes; it has no line-decoration strategy.
- The renderer supports `container` and `caption` generically, but always emits `<figure>` for a container, which is not sufficient for a code figure with a filename/header/control bar. [Current container rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) is therefore a prerequisite change.
- [`html-escape.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/html-escape.ts) escapes text but does not sanitize a whole HTML document or fragment. Raw notebook `text/html` must never bypass a sanitizer.
- `@awesome-myst/myst-zod` models code metadata in [`src/flow-content/code.ts`](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/code.ts), but it has no `output`, `outputs`, `inlineExpression`, `embed`, or `anywidget` schemas in the current unions. [The flow union](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/flow-content.ts) needs expansion.
- UI component support and Resolver components from `05-ui-extension-components.md` provide the copy-button and code-tab building blocks.

## Upstream implementation pointers

| Concern | Source | Renderer implication |
| --- | --- | --- |
| Code options | [`myst-directives/src/code.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/code.ts) | preserve parsed metadata; do not reparse option strings |
| Code authoring | [MyST code guide](https://mystmd.org/guide/code) | test public examples for number/highlight/caption/filename parity |
| Inline eval | [`myst-roles/src/inlineExpression.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-roles/src/inlineExpression.ts) | render transformed inline value; never evaluate arbitrary code |
| Output types | [`myst-spec/src/ext.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-spec/src/ext.ts) | handle output/outputs, visibility, scroll, placeholders, MIME metadata |
| Output reduction | [`myst-cli/src/transforms/outputs.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/outputs.ts) | follow reduced static output shape and placeholder behavior |
| Embed | [`myst-directives/src/embed.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/embed.ts) | target label plus remove-input/remove-output |
| Reuse guide | [MyST output reuse](https://mystmd.org/guide/reuse-jupyter-outputs) | labelled notebook content and output-only reuse |
| Widgets | [`myst-directives/src/anywidget.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/anywidget.ts) | P3 opaque client widget boundary |

## Implementation guidance

### Code components and code-directive parity

1. Add `CodeBlock.astro` and `CodeBlockResolver.astro` under `packages/myst-awesome/src/components/`. Use the Resolver pattern required by [`AGENTS.md`](https://github.com/awesome-myst/myst-awesome/blob/main/AGENTS.md).
2. Define props for `language`, `codeHtml`, `rawCode`, `filename`, `showLineNumbers`, `startingLineNumber`, `emphasizeLines`, `captionHtml`, `identifier`, `enumerator`, and `class`.
3. Add a `case "code"` that sends parsed AST properties—not reinterpreted directive source—to a code-block rendering helper/component.
4. Change the `container` case so `kind === "code"` delegates to `CodeBlockResolver`, consumes its one `code` child plus `caption`, and emits `<figure class="myst-code-block">` only for that semantic container. Keep existing figure/table behavior untouched.
5. Place a filename header only when `filename` is non-empty; use `<wa-copy-button value="…">` in that header or a code toolbar. [Web Awesome Copy Button](https://webawesome.com/docs/components/copy-button/) provides the control’s clipboard feedback.
6. Copy **raw code text** through a property or safe text content, not the highlighted HTML string. Ensure copied contents exactly match `node.value`, including whitespace.
7. Reserve a `CodeTabs.astro`/`CodeTabsResolver.astro` component for a future upstream `code-tab` extension or authoring plugin. It should compose `TabSet` semantics from `05-ui-extension-components.md` rather than introduce an incompatible tab model.

### Four Shiki 4 line-number/highlight strategies

1. **Preferred: transformer/decorated lines.** Upgrade to Shiki 4 and use its transformer-capable highlighter API to attach `data-line`, `data-highlighted`, and a visible line-number span to each emitted line. Keep Shiki token spans intact and style line numbers with CSS counters.
2. **Structured HAST post-process.** Ask Shiki for HAST/structured output, walk line elements server-side, then serialize a controlled fragment. This provides strong invariants when the Shiki 4 transformer API changes, at the cost of an additional conversion layer.
3. **Tokenized lines from `codeToTokens`.** Obtain line-token arrays, serialize every token through a local escaping/style allowlist, and create one `<span class="line">` per source line. This offers exact column/line control but assumes ownership of more of Shiki’s renderer surface.
4. **Legacy HTML wrapper fallback.** Retain `codeToHtml`, wrap each known line element after strict server-side parsing, and inject number/highlight spans. Use only as a compatibility fallback because string-level HTML manipulation is brittle and must never rely on regexes over untrusted content.

Implement strategy 1 first, retain strategy 2 as a tested fallback, and reject strategy 4 unless a DOM/HAST parser gives complete structural validation. Whichever strategy ships must add `data-line` for every source line, calculate displayed number as `startingLineNumber + zeroBasedIndex`, and apply emphasis against the upstream already-parsed integer list.

### Inline expressions and static output MIME dispatch

1. Add `case "inlineExpression"` with two safe modes: render upstream materialized children/value when present, or render an escaped visible placeholder with a development warning when no value has been transformed. Never call `eval`, `Function`, a kernel, or remote API from the renderer.
2. Add `Output.astro`/`OutputResolver.astro` and `Outputs.astro`/`OutputsResolver.astro`. `Outputs.astro` owns grouping, `visibility`, `scroll`, and a fixed-height overflow treatment; `Output.astro` owns a single MIME bundle.
3. Add `case "outputs"` and `case "output"` to [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts), forwarding non-output placeholder children through normal rendering in source order.
4. Normalize `jupyter_data` defensively into a MIME bundle. Prefer safe display types in this order: `image/svg+xml` only after SVG sanitization, `image/png`, `image/jpeg`, `image/webp`, `text/html` only after HTML sanitization, then `text/plain`; render `stderr`/error tracebacks as an escaped `<pre class="myst-output-stderr">`.
5. For `image/png` and other binary image representations, use the emitted/static asset URL where upstream has written one. Permit a `data:` image URL only for an allowlisted image MIME type, validate the payload’s base64 form/size, and escape alt text.
6. For `text/html`, use a server-side sanitizer with an explicit allowlist of elements/attributes/URL schemes; strip scripts, event-handler attributes, forms, iframes, styles unless intentionally permitted, and unsafe URLs. [`html-escape.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/html-escape.ts) remains mandatory for text fallbacks but is not a sanitizer.
7. Never render `application/javascript`, notebook metadata, or unknown rich MIME payloads. Fall back to `text/plain` or a labelled unavailable-output block.
8. Render `stream` output as escaped plain text and visually distinguish `stderr`; render Jupyter `error` with name/value/traceback as text, never as HTML.

### Embed, reuse, P3 execution, and widgets

1. Treat `embed` as a build-time transform concern. When the upstream transform has replaced it with target children, render them normally. If an unresolved `embed` reaches the theme, render an escaped, non-production diagnostic and return no remote content.
2. Test `remove-input` and `remove-output` against the transformed AST—not against source syntax—because [the embed transform](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/embed.ts) owns those mutations.
3. Preserve labels/ids on outputs so an embedded output can be a local xref target, as described in [the reuse guide](https://mystmd.org/guide/reuse-jupyter-outputs).
4. **P3 stretch:** add a separately installed, opt-in Thebe adapter component after static output parity. It must require an explicit project configuration, render no credentials, define CSP/documentation requirements, and provide a no-JavaScript static fallback.
5. **P3 stretch:** evaluate JupyterLite only as an opt-in browser-kernel adapter after Thebe integration design is complete. [MyST’s JupyterLite guidance](https://mystmd.org/guide/in-page-execution) confirms it is a different runtime model.
6. **P3 stretch:** add `Anywidget.astro`/Resolver only after trust policy approval. Load module and optional CSS URLs only from approved origins or integrity-pinned local assets, retain the Shadow DOM model, and clearly warn authors that widget code is arbitrary JavaScript as [the widgets guide](https://mystmd.org/guide/widgets) does.

## myst-zod notes

- Keep the existing `code` schema as the source for `showLineNumbers`, `startingLineNumber`, `emphasizeLines`, and `filename`. [The schema](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/code.ts) may need `caption`/container interoperability but should not duplicate directive parsing.
- Add `inline-expression.ts` to the phrasing union with `type: "inlineExpression"`, original `value`, optional transformed display children/value, and common role metadata.
- Add `output.ts` and `outputs.ts` to flow content. Model `visibility`, `scroll`, `id`, target metadata, child placeholders, and `jupyter_data` as a narrow discriminated schema rather than `any` wherever practical.
- Add `embed.ts` with normalized source label and `remove-input`/`remove-output`; it remains accepted so unresolved ASTs can produce a diagnostic.
- Add `anywidget.ts` only for P3, with module URL, optional CSS URL, and JSON-like model data. Do not type it as an arbitrary executable function.
- Extend container support so `kind: "code"` is valid and its code/caption children validate; preserve existing figure/table semantics.

## Tests to reproduce

- Reproduce code option parsing, line-number conflicts, emphasis range validation, filename handling, captions, and code-cell output structure from [`myst-directives/src/code.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/code.ts) and [`myst-directives/src/code.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/code.spec.ts).
- Reproduce public code examples for `linenos`, `lineno-start`, `emphasize-lines`, captions, filenames, and included code from the [MyST code guide](https://mystmd.org/guide/code).
- Reproduce output removal/placeholder behavior from [`myst-cli/src/transforms/outputs.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/outputs.spec.ts).
- Reproduce static inline-expression transformation expectations from [`myst-cli/src/transforms/inlineExpressions.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/inlineExpressions.spec.ts).
- Reproduce label, output-only embedding, full-cell embedding, placeholders, figure/table wrapping, and accessibility examples from [MyST output reuse](https://mystmd.org/guide/reuse-jupyter-outputs).
- Reproduce the `embed` option AST from [`myst-directives/src/embed.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/embed.ts) and transformation behavior from [`myst-cli/src/transforms/embed.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-cli/src/transforms/embed.ts).

## Tests to create

- `packages/myst-awesome/tests/code-block-rendering.spec.ts`: line count, initial line number, selected highlights, filename header, caption, identifier, and exact copy-button text.
- `packages/myst-awesome/tests/code-tabs-and-copy.spec.ts`: code-tab keyboard navigation (once supplied), copy success state, and no HTML copied to clipboard.
- `packages/myst-awesome/src/lib/shiki-highlighter.spec.ts`: all four strategies’ structural output, light/dark token preservation, blank lines, last-line newline, language failure, and large block performance budget.
- `packages/myst-awesome/tests/jupyter-output-rendering.spec.ts`: `image/png`, trusted SVG, safe/unsafe `text/html`, `text/plain`, stream stdout/stderr, errors, MIME fallback, scroll, and placeholders.
- `packages/myst-awesome/tests/output-embed-rendering.spec.ts`: transformed output-only/full-cell embeds, remove-input/remove-output, output id, and xref target preservation.
- `packages/myst-awesome/tests/inline-expression-rendering.spec.ts`: materialized expression text, escaped fallback, and proof that no browser evaluation occurs.
- `packages/myst-awesome/tests/p3-execution-boundary.spec.ts`: disabled-by-default Thebe/JupyterLite/anywidget markup, approved-origin checks, and static fallback.

## Acceptance criteria

- [ ] Code directive options produce correct line numbers, start number, highlighted lines, filename, caption, target id, and copy behavior.
- [ ] Code containers no longer receive a generic figure-only rendering path.
- [ ] The Shiki 4 implementation decorates lines structurally and preserves dual-theme syntax tokens.
- [ ] `{eval}`/`inlineExpression` output is rendered only from upstream materialized data and never executed in the theme.
- [ ] `outputs` and `output` render safe static images, plain text, stderr, and sanitizer-approved HTML MIME bundles.
- [ ] Unknown/risky MIME types and all unsafe HTML are rejected or degraded to safe text; raw output HTML is never emitted directly.
- [ ] Embedded/reused outputs work after upstream transforms and retain ids/labels for cross-references.
- [ ] Thebe, JupyterLite, and anywidget are clearly marked P3, disabled by default, and guarded by explicit trust/configuration controls.
- [ ] Code/output components provide Resolver overrides and have Playwright plus unit coverage.

## Dependencies and ordering

1. Land [02-core-ast-parity.md](02-core-ast-parity.md) first, particularly output unions, trusted fragment boundaries, and a server-side sanitizer decision.
2. Land [05-ui-extension-components.md](05-ui-extension-components.md) before code tabs/copy-toolbar completion; it supplies the shared Resolver conventions, `wa-tab-group` integration, and component import practice.
3. Land [03-cross-references-and-numbering.md](03-cross-references-and-numbering.md) and embed infrastructure before output-reuse acceptance. Static standalone outputs and code parity can ship earlier.
4. [06-proofs-exercises.md](06-proofs-exercises.md) may ship before or alongside static outputs, but gated exercises and solution examples must be rerun when code-cell/output support becomes available.
5. Do not start P3 live execution or anywidget work until static output MIME handling, CSP guidance, dependency review, and no-JavaScript fallback tests are complete.
