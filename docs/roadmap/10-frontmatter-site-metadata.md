---
title: Frontmatter, SEO, and site metadata
description: Complete MyST frontmatter rendering and add Astro-native SEO, social, discovery, analytics, downloads, and landing-page metadata.
---

This roadmap separates three concerns that are currently conflated: schema acceptance, visible document metadata, and HTML/site metadata. It closes gaps against MyST frontmatter while keeping theme-owned SEO and deployment behavior explicit. [MyST frontmatter](https://mystmd.org/guide/frontmatter) and [site metadata](https://mystmd.org/guide/website-metadata) are the compatibility baseline.

## Status

| Priority | Effort | Depends on |
| --- | --- | --- |
| P0 | XL | 02 Core AST parity; 05 UI extension components |

## Overview

- Compare the versioned [`myst-zod` frontmatter schemas](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter/index.ts) with the upstream `myst-frontmatter` surface before adding renderer assumptions.
- Keep the established resolver pattern, but fill visible frontmatter gaps for venue/journal, funding, authorship details, contributors, and document/site parts.
- Add a single page-head resolver for title, canonical URL, Open Graph, Twitter cards, descriptions, robots, and thumbnails.
- Generate sitemap, robots, RSS/Atom, and optional analytics through Astro build integrations/configuration rather than duplicating MyST server behavior.

## Background and references

- MyST supports page/project title variants, descriptions, thumbnails, authors/contributors, affiliations, DOI, license, funding, venue, downloads, launch configuration, and template-specific options. [Frontmatter reference](https://mystmd.org/guide/frontmatter)
- MyST publishes a project XRef metadata file at `myst.xref.json`, including reference links and page data suitable for cross-site use. [Website metadata guide](https://mystmd.org/guide/website-metadata)
- MyST’s SEO guide documents thumbnail selection, robots configuration, and automatic sitemap output. [SEO and social guide](https://mystmd.org/guide/seo-and-social)
- MyST documents Google Analytics and Plausible configuration under `site.options.analytics_google` and `site.options.analytics_plausible`; analytics is off by default. [Analytics guide](https://mystmd.org/guide/analytics)
- Downloads have three distinct concepts: static files, inline `{download}` links, and a frontmatter-driven page download panel. [Website downloads](https://mystmd.org/guide/website-downloads)
- Launch buttons are configured for JupyterHub and Binder-style environments and open the current notebook or MyST code-cell document. [Website launch buttons](https://mystmd.org/guide/website-launch-buttons)
- Landing pages use MyST blocks with `split-image`, `justified`, `centered`, and `logo-cloud` kinds, and can hide outline, TOC, and the standard title block. [Landing-page guide](https://mystmd.org/guide/website-landing-pages)
- Site parts such as footer and banner are theme-dependent, configured below `site.parts`, and differ from normal document content. [Document parts guide](https://mystmd.org/guide/document-parts)

## Current state in myst-awesome

- `myst-zod` has focused schemas for affiliations, contributors, downloads, funding, licenses, page/project/site settings, social links, Thebe, and venues. [Frontmatter schema directory](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter)
- The theme exposes `Authors`, `Affiliations`, `DOI`, `Downloads`, `LaunchButton`, `LicenseBadges`, `SocialLinks`, and `Journal` components under [`components/frontmatter`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter).
- [`FRONTMATTER_RESOLVERS.md`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/FRONTMATTER_RESOLVERS.md) documents whole-block and per-component resolver overrides, including author, affiliation, DOI, downloads, launch, license, and social components.
- [`FrontmatterBlock.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/FrontmatterBlock.astro) currently orchestrates DOI, authors/affiliations, license, downloads, and Thebe launch content; it does not orchestrate the existing Journal component, funding, or other contributor/venue surfaces.
- [`BasePage.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/BasePage.astro) currently emits title, description, generator, and favicon tags but no canonical, Open Graph, Twitter, robots, sitemap, feed, or analytics integration.
- The collection loader can read project frontmatter and copy a favicon, but it does not provide a normalized site URL, page-head model, feed model, or asset manifest for all metadata images. [Collection loader](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-astro-collections/src/loaders.ts)

## Upstream implementation pointers

- [`packages/myst-frontmatter`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-frontmatter): upstream page, project, site, contributor, funding, venue, download, and option validation surface.
- [Frontmatter guide](https://mystmd.org/guide/frontmatter): public field semantics, author/affiliation references, funding, venue, license, thumbnail, downloads, and launch-related frontmatter.
- [Website metadata guide](https://mystmd.org/guide/website-metadata): XRef project metadata and AST/page data exposure.
- [SEO and social guide](https://mystmd.org/guide/seo-and-social): discovery and thumbnail behavior.
- [Analytics guide](https://mystmd.org/guide/analytics), [downloads guide](https://mystmd.org/guide/website-downloads), [launch buttons guide](https://mystmd.org/guide/website-launch-buttons), [landing-page guide](https://mystmd.org/guide/website-landing-pages), and [document parts guide](https://mystmd.org/guide/document-parts).

## Implementation guidance

### Establish a normalized metadata contract

1. Add `packages/myst-awesome/src/lib/resolve-page-metadata.ts` with one pure `resolvePageMetadata({ page, project, site, route, buildUrl })` function.
2. Its output must include title, short title, description, canonical URL, locale, image URL/alt, publish/modified dates, authors, keywords, robots directive, feed eligibility, and a deterministic page URL.
3. Prefer page values, then project/site defaults, then safe theme defaults. Make field provenance observable in development diagnostics.
4. Add `packages/myst-astro-collections/src/metadata.ts` to normalize collection data once, including route-aware URLs and thumbnail asset resolution.
5. Treat `site.url`/deployment URL as required for canonical, sitemap, feed, and absolute social-image production. In preview builds, emit relative development tags only behind an explicit `allowRelativeMetadata` option.
6. Preserve unknown template-specific frontmatter in an `options` object rather than dropping it; only documented theme options become behavior.

### Page head, social, and discovery

1. Create `packages/myst-awesome/src/components/PageHead.astro` and replace the direct title/description head code in [`BasePage.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/layouts/BasePage.astro).
2. Emit one canonical `<link>`, `<meta name="description">`, Open Graph `og:type`, `og:title`, `og:description`, `og:url`, `og:site_name`, `og:image`, `og:image:alt`, and Twitter `summary_large_image` equivalents when the normalized model permits them.
3. Emit article publication/modified-time and author tags for dated authored pages; omit empty tags rather than emitting placeholders.
4. Use a normalized thumbnail path generated by the media work in roadmap 08. If no explicit thumbnail exists, select the first suitable local/remote content image only in the collection stage, never by parsing rendered HTML in the browser.
5. Add `@astrojs/sitemap` configuration in the integration entry point, deriving pages from collection routes and excluding `noindex`, draft, and explicitly hidden site pages.
6. Generate `robots.txt` from a small `robots` endpoint/template that points at sitemap, defaults public sites to allow, and defaults preview/noindex builds to disallow.
7. Add an RSS/Atom integration route such as `packages/myst-awesome/src/pages/rss.xml.ts` plus `atom.xml.ts`, driven by `feed: true` or a configured collection. Include only public canonical URLs and stable page descriptions.
8. Continue copying `myst.xref.json`; add clear documentation that it is MyST interoperability metadata, not a replacement for a site search index or RSS feed.

### Analytics, downloads, and launch buttons

1. Add `packages/myst-awesome/src/components/Analytics.astro`, included from `BasePage` only when configuration is valid and the build is not a preview/no-track build.
2. Map `site.options.analytics_plausible` to Plausible’s script/data-domain and `analytics_google` to Google’s measurement snippet; make the provider choice explicit and never emit either by default.
3. Add a consent/override hook (`analytics.enabled`, `analytics.consentRequired`) rather than building a bespoke consent platform into the theme.
4. Audit [`LaunchButton.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/LaunchButton.astro) against the documented Binder/JupyterHub configuration. Keep the existing resolver but add provider-specific URLs, current-page target path, disabled/invalid states, and accessible menu labels.
5. Update [`Downloads.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/Downloads.astro) and [`DownloadsDropdown.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/DownloadsDropdown.astro) to distinguish file, URL, and export IDs, preserve filename/download attributes, and resolve static assets via the loader manifest.
6. Do not conflate the page panel with inline `{download}` rendering; that renderer belongs to the AST/role roadmap.

### Visible scholarly metadata and document/site parts

1. Add `Funding.astro`, `Venue.astro`, `Contributors.astro`, and `DocumentParts.astro` under `components/frontmatter/`, each with a matching resolver only after its public component API is stable.
2. Update [`FrontmatterBlock.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/FrontmatterBlock.astro) to compose venue/journal, funding statements and awards, equal/corresponding/deceased author cues, affiliations, contributors, DOI, license, downloads, and launch controls in a predictable order.
3. Reuse the existing [`Journal.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/frontmatter/Journal.astro) only after renaming/generalizing its props to the upstream `venue` model; a journal is a subset of venue metadata.
4. Render machine-readable scholarly metadata as JSON-LD (`ScholarlyArticle`/`Article` when appropriate) from `PageHead`, keeping visible and structured values sourced from the same metadata resolver.
5. Add `BannerPart.astro`, `FooterPart.astro`, and `TocFooterPart.astro` render points in layouts, fed from parsed `site.parts` content rather than raw Markdown strings.

### Landing-page blocks

1. Extend the block renderer from roadmap 04 with `LandingBlock.astro` variants for `split-image`, `justified`, `centered`, and `logo-cloud`.
2. Retain arbitrary block `class` values and use `data-landing-kind` for scoped styling; do not mistake these documented kinds for frontmatter fields.
3. Have `DocsLayout` honor `site.hide_outline`, `site.hide_toc`, and `site.hide_title_block` at page scope, matching the landing-page configuration shown in the guide.
4. Keep landing-page image loading responsive and compatible with roadmap 08’s media manifest.

### Schema audit and rollout rules

1. Create a checked-in `docs/frontmatter-coverage.md` matrix during implementation. Each upstream field must be marked: validated, inherited, visible, head-only, artifact-only, intentionally unsupported, or deferred.
2. Include source schema location, `myst-zod` schema location, normalized metadata field, resolver/component, and test fixture for every matrix row.
3. Version theme-only options under a namespaced `site.options.myst_awesome` object if upstream has not defined an equivalent field.
4. Preserve valid upstream-but-unrendered fields in collection data and issue a development warning with a link to the coverage matrix rather than rejecting content.
5. Never infer a canonical URL from a GitHub URL, `edit_url`, or social profile; canonical URL derives from a configured production site origin and route.
6. Normalize DOI values once and render both the visible DOI link and JSON-LD identifier from that normalized value.
7. Resolve contributor/affiliation references before components render. A component must receive complete objects, never a mixture of string IDs and objects.
8. Make funding and venue rendering opt-in in compact documentation layouts, but available in the default scholarly frontmatter block.
9. Sanitize all user-controlled metadata text; URL values require protocol validation before entering a head tag, link, feed, or JSON-LD object.
10. Use a page-level `metadata: false` escape hatch only for intentional non-document endpoints; normal pages should have a complete head model.
11. Add a migration note for projects pinned to `@awesome-myst/myst-zod` 0.6.x when adopting schema fields introduced in 0.7.x.
12. Treat static route output as a contract: record sitemap, feed, robots, and head snapshots in tests before changing defaults.

## myst-zod notes

- Perform a field-by-field compatibility audit between [`myst-zod/src/frontmatter`](https://github.com/awesome-myst/myst-zod/blob/main/src/frontmatter) and upstream [`myst-frontmatter`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-frontmatter) before adding theme fields.
- Update `myst-zod` for missing upstream page/project/site metadata, especially site URL/locale/options, page social fields, venue richness, contributors, funding awards, downloads, and Binder/JupyterHub launch configuration.
- Keep page and project frontmatter types composable so resolution can preserve precedence and source location.
- Add schemas for theme-only metadata options separately from upstream schemas; avoid silently widening MyST compatibility fields to `any`.

## Tests to reproduce

- Reproduce title fallback, thumbnail, author, affiliation, license, funding, venue, downloads, and launch examples in the [frontmatter guide](https://mystmd.org/guide/frontmatter).
- Reproduce XRef metadata output expectations from the [website metadata guide](https://mystmd.org/guide/website-metadata).
- Reproduce robots/sitemap and social-thumbnail behavior from the [SEO and social guide](https://mystmd.org/guide/seo-and-social).
- Reproduce valid Plausible/Google configuration examples from the [analytics guide](https://mystmd.org/guide/analytics).
- Reproduce the documented Binder/JupyterHub behavior from the [launch button guide](https://mystmd.org/guide/website-launch-buttons).
- Reproduce `split-image`, `justified`, `centered`, `logo-cloud`, and hidden-layout landing-page examples from the [landing-page guide](https://mystmd.org/guide/website-landing-pages).

## Tests to create

- `packages/myst-awesome/src/lib/resolve-page-metadata.test.ts`: precedence, absolute URLs, missing site URL, thumbnail fallback, robots, and draft/noindex cases.
- `packages/myst-awesome/tests/page-head.spec.ts`: canonical, Open Graph, Twitter, JSON-LD, duplicate-tag prevention, and escaped metadata.
- `packages/myst-awesome/tests/discovery.spec.ts`: sitemap, robots, RSS, Atom, canonical base URL, and excluded pages.
- `packages/myst-awesome/tests/analytics.spec.ts`: no scripts by default, Plausible, Google, preview suppression, and consent hook.
- `packages/myst-awesome/tests/frontmatter-completeness.spec.ts`: author cues, affiliations, venue, funding awards, contributors, DOI, licenses, downloads, and resolver overrides.
- `packages/myst-awesome/tests/launch-buttons.spec.ts`: Binder/JupyterHub target URLs and invalid configuration.
- `packages/myst-awesome/tests/landing-pages.spec.ts`: all four documented block kinds and layout-hide fields.
- `packages/myst-astro-collections/tests/metadata-normalization.spec.mjs`: schema validation and media/route normalization.

## Acceptance criteria

- [ ] Every supported frontmatter field has an explicit schema, precedence rule, rendered disposition, or documented non-goal.
- [ ] Each public page has one correct title, description, canonical URL, and no duplicate social metadata.
- [ ] Open Graph, Twitter, JSON-LD, sitemap, robots, RSS, and Atom use absolute production URLs when `site.url` is configured.
- [ ] Preview/draft/noindex content is excluded from public discovery artifacts and does not load analytics.
- [ ] Analytics is absent by default and only supported provider configuration emits scripts.
- [ ] Downloads distinguish exports, files, and URLs; launch buttons cover documented Binder/JupyterHub behavior.
- [ ] Venue/journal, funding, and detailed authorship are visibly rendered and overrideable through the existing resolver pattern.
- [ ] Landing-page block kinds and layout suppression work without breaking normal document pages.
- [ ] The generated `myst.xref.json` remains available and its purpose is documented independently from SEO artifacts.

## Dependencies and ordering

- Requires roadmap 08 for deterministic optimized thumbnail URLs and landing media.
- Requires roadmap 02 for block rendering and roadmap 05 for reusable UI extension components before landing-page variants can ship.
- Requires roadmap 11 for feed/navigation route enumeration and for excluding hidden/auxiliary pages consistently.
- Coordinate with roadmap 09 for index-page canonical, robots, feed, and generated metadata behavior.
