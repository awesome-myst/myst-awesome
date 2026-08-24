---
title: Figures, media, and diagrams
description: Render MyST figures, images, video, embeds, and Mermaid diagrams with Astro-native progressive enhancement.
---

This roadmap closes the media-rendering gap between the MyST AST delivered by the content server and the Astro theme. It preserves upstream figure semantics and static HTML resilience, then progressively enhances only diagrams and optimized local assets. [MyST’s figures guide](https://mystmd.org/guide/figures) is the authoring contract.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P1 | L | 02 Core AST parity; 03 Cross-references and numbering |

## Overview

- Render `container(kind: figure)` as semantic `<figure>` markup, preserving captions, legends, identifiers, numbering, and custom classes from the AST.
- Match the upstream `{figure}` directive’s image dimensions, alignment, alternate text, custom `kind`, notebook-output flags, placeholders, and implicit subfigure behavior. [The directive implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/figure.ts) is the source of truth.
- Render image/video asset URLs safely, keeping remote URLs remote and enhancing local raster assets only when a build-time manifest has a known local file.
- Add accessible iframe output and client-idle Mermaid rendering without making static HTML unusable when JavaScript or Mermaid loading fails.

## Background and references

- A MyST figure directive creates a `container` with `kind: figure`; its argument becomes an image, and its body is caption content or, without an argument, image children that can become subfigures. [Figure directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/figure.ts)
- The directive accepts `class`/`figclass`, `height`/`h`, `width`/`w`/`figwidth`, `alt`, `align`, `kind`, notebook-cell `remove-input` and `remove-output` flags, `placeholder`, and `no-subfigures` aliases. [Figure directive options](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/figure.ts)
- The guide documents numbered figures, remote figure URLs, implicit `Figure 1a` subfigures, grid classes on figures, and a way to opt out of implicit subfigures. [MyST figures](https://mystmd.org/guide/figures)
- MyST treats direct MP4 figure/image sources as video in HTML output and recommends an iframe for hosted services such as YouTube. [Video and YouTube guidance](https://mystmd.org/guide/figures)
- The `{iframe}` directive produces an `iframe` node with width, alignment, title, placeholder, common options, and an optional caption wrapped in a figure-like container. [Iframe directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/iframe.ts)
- The `{mermaid}` directive emits a Mermaid AST node from its text body; the guide also supports fenced `mermaid` code blocks. [Mermaid directive](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/mermaid.ts) [MyST diagrams](https://mystmd.org/guide/diagrams)
- The image directive supports common options plus `width`, `height`, `alt`, `align`, and `title`; its body can supply fallback alternate text. [Image directive source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/image.ts)
- MyST’s documented light/dark image approach is ordinary CSS classes such as `dark:hidden`, not a dedicated `dark-light` image node. [Light and dark CSS guidance](https://mystmd.org/guide/website-style)

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) renders `image`, `container`, `caption`, `captionNumber`, and `legend`, but does not branch on video extensions, `iframe`, or `mermaid`.
- The current image branch already carries `alt`, `title`, width, height, alignment classes, and a raw `class` string into `<img>`. [Current image renderer](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- The current container branch emits `<figure>` for every container and can apply `numbered` plus the container class, but it does not form nested subfigures or special-case figure content. [Current container renderer](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)
- `sharp` is already a dependency, while `astro:assets` is currently used in [`DocsLayout.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/DocsLayout.astro) for layout-owned images rather than arbitrary MyST AST images.
- [`MystContentStyles.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/MystContentStyles.astro) is the existing global place to add figure, media, and dark-theme presentation styles.
- The renderer currently logs and drops unknown AST nodes, so `iframe` and `mermaid` content is lost rather than safely represented. [Renderer fallback](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts)

## Upstream implementation pointers

- [`packages/myst-directives/src/figure.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/figure.ts): directive-to-container construction, figure aliases, subfigure suppression, placeholders, and `kind`.
- [`packages/myst-directives/src/image.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/image.ts): extended image option mapping and body-derived alternate text.
- [`packages/myst-directives/src/iframe.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/iframe.ts): iframe AST shape, placeholder child, title, and caption wrapper.
- [`packages/myst-directives/src/mermaid.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/mermaid.ts): Mermaid node construction.
- [`packages/myst-transforms/src/images.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-transforms/src/images.ts): upstream image/media transform boundary to inspect before relying on a field beyond the AST schema.
- [Figures and videos guide](https://mystmd.org/guide/figures): acceptance examples for remote figures, subfigures, grids, MP4 fallback images, and YouTube.
- [Diagrams guide](https://mystmd.org/guide/diagrams): Mermaid directive and fenced-code authoring examples.

## Implementation guidance

### Renderer and semantic HTML

1. Extend [`packages/myst-awesome/src/lib/render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) with typed guards for `iframe` and `mermaid`, and replace the generic container-only logic with `renderFigureContainer`.
2. Treat `container.kind === "figure"` as a figure. Keep other containers on their current path so this change does not redefine all MyST containers.
3. Render an outer `<figure id="…">`, image/video children, then `<figcaption>` containing the existing caption-number and legend output. Preserve `class`, `style`, `align-*`, and `data-kind` hooks.
4. When a figure body contains multiple image-bearing children and `noSubcontainers` is not true, wrap each visual child in `<figure class="myst-subfigure">`; preserve individual explicit labels/IDs and allow the parent to own its caption.
5. Do not manufacture subfigure identifiers or number strings in the theme. The content server’s transformed AST and enumeration fields are authoritative.
6. Add a shared `renderMediaNode(node, context)` helper used both by a bare image node and an image in a figure, preventing divergent option support.

### Images, remote assets, and video

1. Classify media URLs by extension after stripping query/hash: raster image, SVG, video (`.mp4`, `.webm`), or unsupported/unknown.
2. Emit `<video controls preload="metadata">` for MP4/WebM; include escaped `src`, `aria-label` from alt/title, and a text fallback link. Do not claim support for MOV/AVI conversion: that conversion belongs to upstream build tooling, not Astro.
3. Render direct remote images and media as their original absolute URL. Never download remote media during an Astro build by default.
4. Add `packages/myst-awesome/src/lib/media-manifest.ts` and `packages/myst-astro-collections/src/media.ts`. At collection-load time, resolve only project-relative local assets, run `sharp` for configured raster widths/formats, and write a deterministic manifest in `public/`.
5. Have the renderer consult the manifest through a supplied render context. Emit `<picture>`/`srcset` for manifest entries and a plain `<img>` for unknown, SVG, data, anchor, remote, and notebook-generated URLs.
6. Keep author-provided width/height as CSS sizing constraints rather than claiming they are source pixel dimensions. Add `loading="lazy"` and `decoding="async"` below the first visible content threshold; permit a frontmatter/config opt-out for hero imagery.
7. Pass all upstream common/directive classes through after tokenization and escaping. Add compatibility CSS for `full-width`, `align-left`, `align-center`, `align-right`, and grid utility classes without depending on Tailwind being installed.
8. Support upstream class-based light/dark variants by preserving classes and adding selectors for `.wa-dark`; document `dark:hidden` / complementary author classes. Do not add an invented `dark-light` directive.

### Iframes and hosted video

1. Render an iframe node as `<figure class="myst-iframe">` only when it has a caption wrapper; otherwise render a `<div class="myst-iframe">`.
2. Emit `<iframe src title loading="lazy" referrerpolicy="strict-origin-when-cross-origin">`; default a missing title to `"Embedded content"` and issue a development warning.
3. Apply validated width/height styles and alignment classes. Preserve the placeholder image in `<noscript>` or a static fallback region when present.
4. Do not infer provider URLs, execute provider scripts, or allow arbitrary raw HTML attributes. YouTube and other hosted-video providers are ordinary embed hosts and get no special standing.
5. Make `iframeAllowlist` restrictive by default. An iframe runs third-party code in the reader's browser, so an author-supplied URL is not sufficient authorization on its own:
   - The default allowlist permits same-origin embeds only.
   - A deployment adds `https:` origins explicitly through the theme option; each entry is an origin, not a substring or a wildcard suffix that a lookalike host can satisfy.
   - Compare the parsed URL's origin against the list. Never match on a raw string prefix.
   - Ship a documented starter list for common hosted-video providers that deployments can opt into, so the restrictive default does not make ordinary embeds hard to enable.
6. Render a disallowed iframe as a labelled fallback — caption text plus a plain external link to the URL — and emit a development warning naming the origin and the option to add. Silently dropping the node makes a misconfigured allowlist look like a renderer bug.
7. Document the tradeoff in the reverse of the usual direction: authoring parity with a permissive upstream is the opt-in, and reader safety is the default.

### Mermaid progressive enhancement

1. Add `mermaid` as a theme dependency and create `packages/myst-awesome/src/components/MermaidHydration.astro`.
2. Render the server output as `<pre class="myst-mermaid" data-mermaid-source="…"><code>…</code></pre>`, retaining visible diagram source as the no-JavaScript and load-error fallback.
3. Include `<MermaidHydration />` once from [`BasePage.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/BasePage.astro). Its client script should use `IntersectionObserver`, then dynamically import Mermaid only for an observed diagram.
4. Initialize Mermaid once per color mode, render each source into a unique SVG ID, replace only the individual fallback after success, and retain escaped source plus an error callout after failure.
5. Subscribe to the existing color-scheme change mechanism and rerender visible diagrams with a light/dark Mermaid theme. Avoid server rendering Mermaid so static builds do not require browser layout APIs.
6. Add styles in [`MystContentStyles.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/MystContentStyles.astro) for responsive SVGs, captions, error state, video sizing, and figure/subfigure grids.

### Delivery slices and compatibility boundaries

1. Ship semantic figure/image rendering first, behind no feature flag, because it only consumes nodes already accepted by the renderer.
2. Ship video extension detection in the same slice, but leave uncommon media formats as a linked image fallback until their upstream transform output is verified.
3. Ship iframe output next with the restrictive default host policy in place from the first release; loosening a default after sites depend on it is a breaking security change, whereas widening an allowlist is additive. Test captions before enabling remote-provider examples in theme docs.
4. Ship the local media manifest separately because it adds file-system work, build output, cache invalidation, and deployment-size concerns.
5. Make `media.optimize` opt-in for the first release. `sharp` capability alone must not change users’ image URLs or asset ownership unexpectedly.
6. Derive manifest keys from the source **content hash and transformation options only**. Identical bytes plus identical options must produce the same key — and therefore the same emitted URL — across checkouts, machines, and CI runs; that is what makes the manifest deterministic and the output URLs cacheable. Source mtime may be kept as a separate non-identity field to skip re-encoding work, but it must never enter the key: a fresh clone rewrites mtimes and would otherwise churn every asset URL on the site.
7. Ensure emitted optimized asset paths respect `baseDir`, folder URL mode, and the site URL helper proposed in roadmap 11.
8. Ship Mermaid as a progressive enhancement after its static renderer branch is covered; an unavailable CDN/package must leave the code source readable.
9. Keep Mermaid configuration theme-owned and conservative: no author-supplied JavaScript callbacks, no unbounded HTML labels, and no global `startOnLoad`.
10. Render external media URLs only after attribute escaping and protocol validation. Allow `https:`, `http:` when configured, relative paths, and safe data image URLs; reject dangerous protocols.
11. Keep `alt=""` meaningful for decorative images. Do not substitute a filename when the author intentionally supplied empty alternate text.
12. Carry a `data-myst-media-kind` attribute on all output to simplify tests and downstream component overrides.
13. Document exact generated markup and CSS hooks in the theme README so custom Astro users can style figures without replacing the renderer.
14. Do not attempt PDF/static-export placeholder selection in Astro. Consume whichever image/video node the content server supplies for the web build.
15. Add visual regression baselines for one-column, two-column, narrow mobile, high-contrast, and dark-mode figures.
16. Preserve source ordering in figures and captions; CSS must not make screen-reader reading order differ from author order.
17. Add a per-figure `data-myst-figure-kind` hook instead of inferring custom kinds from classes.
18. Keep media render helpers pure and pass asset-manifest lookups as context, so renderer unit tests require no filesystem or Astro runtime.
19. Resolve local asset paths relative to the source page before manifest lookup, matching content-server link resolution rather than Astro route resolution.
20. Record unresolved local assets in a build report with source page and original URL; do not silently turn them into broken optimized URLs.
21. Require captions on decorative figures only when the author supplied one; alternate text and caption fulfill distinct accessibility needs.
22. Avoid a `poster` default for video unless upstream supplies a placeholder image, because choosing an arbitrary frame changes author intent.

## myst-zod notes

- Add `Iframe` and `Mermaid` node schemas, including common node attributes, to the relevant AST schema modules under [`src/`](https://github.com/awesome-myst/myst-zod/blob/main/src/).
- Extend the image schema with the upstream fields consumed after transformation (`placeholder`, alignment, dimensions, title, and notebook output flags) only where they are not already modeled.
- Model figure containers without narrowing `kind` to `"figure"` so custom figure kinds remain valid.
- Add Zod fixtures for nested figure containers and media nodes before updating the renderer’s discriminated union.

## Tests to reproduce

- Reproduce the directive option construction in [`figure.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/figure.ts), [`image.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/image.ts), [`iframe.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/iframe.ts), and [`mermaid.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/mermaid.ts).
- Port the remote-figure, subfigure, grid-class, video, static-fallback, and YouTube examples in the [figures guide](https://mystmd.org/guide/figures).
- Port the directive and fenced-code Mermaid examples in the [diagrams guide](https://mystmd.org/guide/diagrams).
- Verify class-based image swapping against the [light/dark CSS example](https://mystmd.org/guide/website-style).

## Tests to create

- `packages/myst-awesome/tests/figures-media.spec.ts`: numbered figure, caption, legend, custom kind, remote URL, width/height, alignment, class, and alternate text.
- `packages/myst-awesome/tests/subfigures.spec.ts`: implicit subfigures, explicit child labels, no-subfigures, and grid classes.
- `packages/myst-awesome/tests/video-and-iframe.spec.ts`: MP4/WebM `<video>`, static text fallback, placeholder, caption, an allowlisted provider iframe rendering as an embed, and the same URL rendering as an external-link fallback when the origin is not allowlisted.
- `packages/myst-awesome/tests/mermaid.spec.ts`: source fallback before hydration, lazy SVG render, malformed source error, and light/dark rerender.
- `packages/myst-awesome/tests/media-optimization.spec.ts`: local manifest output and `srcset`; assert remote URLs bypass local optimization.
- `packages/myst-awesome/src/lib/render-myst-ast.media.test.ts`: escaping and extension classification unit coverage.

## Acceptance criteria

- [ ] All figure directive options above have an intentional AST-to-HTML disposition, including documented aliases and notebook-only fields.
- [ ] A remote figure, a local optimized raster image, an SVG, MP4, and WebM render valid accessible HTML.
- [ ] Figures with multiple children preserve upstream numbering/labels and have usable responsive subfigure layout.
- [ ] Image and figure classes, dimensions, alignment, caption, legend, and custom kinds survive rendering.
- [ ] An iframe has a title, lazy loading, safe fallback behavior, and correctly rendered caption.
- [ ] With no `iframeAllowlist` configured, a cross-origin iframe renders as a labelled external link rather than an embed, and adding its origin to the option renders the embed.
- [ ] Rebuilding an unchanged image in a fresh clone produces byte-identical manifest keys and asset URLs.
- [ ] Mermaid source is useful without JavaScript and is upgraded only after the diagram approaches the viewport.
- [ ] Mermaid has no global rerender loop and does not block the initial page load.
- [ ] Light/dark image classes work with the existing Web Awesome color-mode classes.
- [ ] Playwright coverage passes in light and dark modes and with JavaScript disabled for media fallbacks.

## Dependencies and ordering

- Land after roadmap 02 establishes the AST/container renderer, and coordinate with roadmap 03 so figure identifiers and caption numbers come from a stable cross-reference contract.
- Coordinate with roadmap 10 before finalizing thumbnail/media-manifest placement, since thumbnails serve SEO and social cards.
- Coordinate with roadmap 11 so rendered figure headings and Mermaid text participate in the build-time search index only where appropriate.
