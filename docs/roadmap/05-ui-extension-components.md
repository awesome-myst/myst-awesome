---
title: "UI extension components: cards, grids, tabs, dropdowns, buttons, icons"
description: "Render MyST UI-extension AST nodes with accessible Web Awesome components and overrideable Astro component boundaries."
---

This phase adds first-class rendering for MyST cards, grids, tabs, dropdowns, buttons, and icons. It preserves upstream AST semantics, uses Web Awesome custom elements where they are a direct fit, and introduces a consistent Astro Resolver boundary so themes can replace the default presentation without forking the AST renderer. The user-facing syntax and expected behavior are documented in the [MyST UI extensions guide](https://mystmd.org/guide/dropdowns-cards-and-tabs).

## Status

| Field | Value |
| --- | --- |
| Priority | P1 |
| Effort | L |
| Depends on | Foundational AST-schema acceptance, renderer escaping policy, and the component-override foundation |

## Overview

- Deliver complete rendering for `card`, `grid`, `grid-item`, `tabSet`, `tabItem`, `dropdown`, `button`/button-styled `link`, and `icon` nodes.
- Map cards to [`<wa-card>`](https://webawesome.com/docs/components/card/), grids to native CSS Grid, tabs to the Web Awesome tab components, dropdowns to [`<wa-details>`](https://webawesome.com/docs/components/details/), button semantics to [`<wa-button>`](https://webawesome.com/docs/components/button/), and icon nodes to `<wa-icon>`.
- Treat card header/title/footer, grid breakpoints, tab selection/synchronization, dropdown open state, link safety, and accessible icon labels as semantic data—not string interpolation details.
- Keep the renderer server-safe: generate only trusted component markup, escape all AST-originating attribute values, and retain normal anchor semantics for linked buttons.
- Make default UI components replaceable through the repository’s Resolver pattern rather than trying to import Astro components directly from `render-myst-ast.ts`.
- Ship the feature as an AST-consumer enhancement: MyST continues to parse directives and roles, while Astro receives already-expanded semantic nodes.
- Keep normal document reading usable without JavaScript; hydration is limited to the interaction Web Awesome components already own.
- Do not add an author-facing configuration dialect for these directives in myst-awesome; upstream MyST syntax remains the contract.
- Use semantic wrapper elements and component data attributes so visual customization does not require AST-specific CSS selectors.

## Background and references

### MyST inputs and AST contract

- The `card` directive emits one `card` node; its children can include a `header`, a `cardTitle`, ordinary body nodes, and a `footer`, while `url` is an optional link target. [The upstream directive implementation](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/src/index.ts) also supports `card` under the `grid-item-card` alias.
- A `grid` node has normalized responsive `columns` (one to four breakpoint values, constrained to 1–12) and contains `grid-item` nodes; each item can carry a `columns` span, `class`, `label`, and `identifier`. [The grid extension source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-grid/src/index.ts) is the compatibility contract.
- A tab collection uses a `tabSet` parent and `tabItem` children. Each item has `title`, optional `sync`, optional `selected`, common directive attributes, and body `children`. [The tab extension source](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-tabs/src/index.ts) defines those names and aliases.
- The button role deliberately produces either a normal `link` carrying `class: "button"` when a target exists or a `span` carrying the same class when it does not. [The button role](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/src/index.ts) therefore does **not** create a `button` AST node.
- The icon role produces `{ type: "icon", kind, name }`; `kind` is derived from the role prefix and legacy prefixes are normalized. [The icon extension](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-icon/src/index.ts) is the source of truth for supported role aliases.
- The normal MyST dropdown directive is separate from the extension packages and should render its semantic disclosure behavior rather than be confused with an action-menu dropdown. [The MyST guide](https://mystmd.org/guide/dropdowns-cards-and-tabs) presents dropdowns, cards, and tabs together.

### Web Awesome fit

- Web Awesome documents cards as a bordered grouping component and exposes header/footer slots, which directly accommodates MyST `header`, `cardTitle`, body, and `footer` regions. [Web Awesome Card](https://webawesome.com/docs/components/card/)
- Web Awesome’s component catalog includes Cards, Details, Tabs, Buttons, Icons, and Copy Button components; this phase uses `wa-tab-group`, `wa-tab`, and `wa-tab-panel` for tab sets and reserves `wa-copy-button` for the code roadmap. [Web Awesome Components](https://webawesome.com/docs/components/)
- `<wa-details>` provides the disclosure interaction required by a MyST dropdown, so it is preferable to `wa-dropdown`, which is documented as a menu trigger. [Web Awesome Details](https://webawesome.com/docs/components/details/)

## Current state in myst-awesome

- [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) currently has no cases for any nodes in this phase; unknown nodes only warn and render no content.
- The same renderer already serializes ordinary `link` nodes and is the correct interception point for a link whose class list includes `button`. [Existing link rendering](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts) must remain the fallback for all other anchors.
- Existing components establish both an Astro component boundary and a Resolver boundary, exemplified by [`Admonition.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/Admonition.astro) and [`AdmonitionResolver.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/AdmonitionResolver.astro).
- The repository convention requires Web Awesome component imports in client `<script>` blocks and requires `@awesome.me/webawesome` to remain non-externalized for SSR. [The component guidance](https://github.com/awesome-myst/myst-awesome/blob/main/AGENTS.md) applies to each new component.
- [`wa-scienceicons.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/wa-scienceicons.ts) already registers a `scienceicons` library and validates its shipped icon names; the icon implementation must reuse it instead of duplicating an SVG registry.
- [`html-escape.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/html-escape.ts) supplies the escaping primitive to use for every text or attribute value introduced by this phase.

## Upstream implementation pointers

| Surface | Upstream input | Renderer contract |
| --- | --- | --- |
| Cards | [`myst-ext-card/src/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/src/index.ts) | `card` with `header`, `cardTitle`, body, `footer`, and optional `url` |
| Grids | [`myst-ext-grid/src/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-grid/src/index.ts) | `grid.columns`; `grid-item.columns`, class, target metadata |
| Tabs | [`myst-ext-tabs/src/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-tabs/src/index.ts) | `tabSet`; `tabItem.title`, `sync`, `selected` |
| Buttons | [`myst-ext-button/src/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/src/index.ts) | classed `link` or `span`, not a bespoke AST type |
| Icons | [`myst-ext-icon/src/index.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-icon/src/index.ts) | `icon.kind` and `icon.name` |
| Dropdowns | [`myst-directives/src/dropdown.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-directives/src/dropdown.ts) | an admonition-style, titled disclosure node |
| Authoring examples | [MyST UI extensions guide](https://mystmd.org/guide/dropdowns-cards-and-tabs) | public syntax, composition, and accessibility examples |

## Implementation guidance

### Component boundary and resolver contract

1. Add default components in `packages/myst-awesome/src/components/`:
   - `Card.astro` and `CardResolver.astro`
   - `Grid.astro` and `GridResolver.astro`
   - `TabSet.astro` and `TabSetResolver.astro`
   - `Dropdown.astro` and `DropdownResolver.astro`
   - `Button.astro` and `ButtonResolver.astro`
   - `Icon.astro` and `IconResolver.astro`
2. Model every `*Resolver.astro` after [`AdmonitionResolver.astro`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/components/AdmonitionResolver.astro): accept `component?: any`, split it from the typed props, select `component ?? DefaultComponent`, and forward the remaining props unchanged.
3. Define explicit TypeScript prop interfaces in each default component. Pass pre-rendered **trusted HTML fragments** through named props such as `headerHtml`, `titleHtml`, `bodyHtml`, and `footerHtml`; use `set:html` only for those renderer-produced fragments.
4. Add a `UiComponentOverrides` shape to the theme configuration path used by layouts/pages, with optional keys `card`, `grid`, `tabSet`, `dropdown`, `button`, and `icon`. Do not make the AST renderer import a user component.
5. Make resolver usage observable in tests by adding a simple override component for each category or one parameterized fixture component.

### `render-myst-ast.ts` cases

1. Extend the `Node` type surface in `@awesome-myst/myst-zod` before adding strongly typed imports to [`render-myst-ast.ts`](https://github.com/awesome-myst/myst-awesome/blob/main/packages/myst-awesome/src/lib/render-myst-ast.ts).
2. Add local helpers:
   - `renderChildren(node)` to preserve ordered async rendering;
   - `nodeId(node, prefix)` to take `identifier` then `label`, escaping the result;
   - `classTokens(node)` to split only string `class` values;
   - `isSafeLinkTarget(url)` to reject dangerous URL schemes before an attribute is emitted.
3. Add a `case "card"` that partitions direct children by `header`, `cardTitle`, and `footer`, renders the remaining children as body content, and emits a stable wrapper with a target id. The output should be `<wa-card>` for a plain card and a normal anchor wrapper around `<wa-card>` for a linked card; do not nest anchors if content itself contains links.
4. Add `case "cardTitle"`, `case "header"`, and `case "footer"` only as internal fragments if recursion encounters them unexpectedly. They must not become generic page-level header/footer elements.
5. Add `case "grid"` and `case "grid-item"`. Render a semantic `<section>`/`<div>` pair with `data-columns="1 2 2 3"` (actual normalized values), CSS variables for the current layout, and an item `grid-column: span N` only for a valid span. CSS media queries should select the four upstream breakpoint values.
6. Add `case "tabSet"` and `case "tabItem"` as a coordinated operation. Generate one collision-free id base per set and, from it, one shared id per tab item. Web Awesome pairs a tab with its panel by attribute value, so that single id must be emitted twice: `<wa-tab slot="nav" panel="{id}">` for the label and `<wa-tab-panel name="{id}">` for the body. Do not derive the two values independently — a `panel` that does not match a `name` produces a tab group whose tabs switch nothing. Verify the attribute names against the [Web Awesome tab group documentation](https://webawesome.com/docs/components/tab-group/) during implementation.
7. Select exactly one tab per set: the first `tabItem` with `selected: true`, otherwise the first item. Preserve `sync` as an escaped `data-myst-sync` hook; synchronization across sets is a small client module, not an SSR guess. `sync` is a grouping key shared by many tabs and must never be used as the `panel`/`name` id.
8. Add a `case "admonition"` branch refinement or a dedicated recognized dropdown path that delegates class `dropdown` to `DropdownResolver`. `Dropdown.astro` should render `<wa-details open>` only when the AST says open and use the rendered admonition title as the summary.
9. Adjust `case "link"` so `class` containing the exact token `button` delegates to `ButtonResolver`. The component emits `<wa-button>` with a real nested anchor only if Web Awesome’s documented link semantics are confirmed during implementation; otherwise style the anchor with the existing button CSS and keep a valid single interactive element.
10. Adjust `case "span"` (after Zod support) so the exact `button` class produces a non-link `<wa-button disabled>` or a presentational button-like span. Do not fabricate a click action for an upstream role with no target.
11. Add `case "icon"` that maps a recognized science icon to `<wa-icon library="scienceicons" name="…">`, maps other upstream `kind` values through an explicit allowlist/configuration table, and falls back to a visually neutral, labelled text marker with a console warning for unsupported libraries.

### CSS, accessibility, and hydration

- Import each required Web Awesome element inside the new component’s client `<script>` block, following the repository convention in [`AGENTS.md`](https://github.com/awesome-myst/myst-awesome/blob/main/AGENTS.md).
- Use CSS custom properties and scoped styles. `Grid.astro` owns responsive column CSS; cards and tabs must not depend on an undocumented global stylesheet order.
- Add `aria-label`/`label` requirements for icons that convey meaning; decorative icons must be explicitly hidden from assistive technology.
- Maintain keyboard tab behavior supplied by `wa-tab-group`; do not reimplement roving focus.
- Use a native disclosure component (`wa-details`) for dropdowns so summary activation, keyboard interaction, and expanded state have one owner.
- Preserve generated identifiers on all labelled grid items, cards, and tab sets so later cross-reference work can target them.

## myst-zod notes

- `myst-zod` already has `tabSet` and `tabItem` schemas in [`src/flow-content/tab-set.ts`](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/tab-set.ts), but it does not currently model card, grid, grid-item, icon, or dropdown-specific data. Its flow-content union is the registration point. [The existing union](https://github.com/awesome-myst/myst-zod/blob/main/src/flow-content/flow-content.ts) must be extended.
- Add `card.ts`, `grid.ts`, and `icon.ts` schema modules, then register their types in flow and/or phrasing unions as appropriate. Card children need a recursive union that permits `header`, `cardTitle`, and `footer` wrapper nodes.
- Extend the existing admonition schema—not a second dropdown node—if upstream emits dropdowns as admonitions. Capture title, `open`, class token(s), `label`, and `identifier`.
- Extend `link` and add `span` support only enough to preserve the class token that identifies a button role. The schema must not treat arbitrary classes as trusted HTML.
- Add schema fixtures for every new node and reject malformed `columns`, tab selection values, and non-string icon names.

## Tests to reproduce

- Reproduce card title/header/body/footer splitting, option-driven header/footer, and minimal cards from [`myst-ext-card/tests/card.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-card/tests/card.spec.ts).
- Reproduce normalized breakpoint columns and nested grid items from [`myst-ext-grid/tests/grid.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-grid/tests/grid.spec.ts).
- Reproduce aliases, class propagation, `sync`, `selected`, and multiple tab items from [`myst-ext-tabs/tests/tabs.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-tabs/tests/tabs.spec.ts).
- Reproduce linked, autolink-style, unlinked, and invalid/recovery button input from [`myst-ext-button/tests/button.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-button/tests/button.spec.ts).
- Reproduce each canonical and legacy icon kind from [`myst-ext-icon/tests/icon.spec.ts`](https://github.com/jupyter-book/mystmd/blob/main/packages/myst-ext-icon/tests/icon.spec.ts).

## Tests to create

- `packages/myst-awesome/tests/ui-extension-components.spec.ts`: AST fixture page renders card slots, responsive grids, and a linked card without nested anchors.
- `packages/myst-awesome/tests/tabs-rendering.spec.ts`: every `wa-tab[panel]` value has exactly one matching `wa-tab-panel[name]` in the same set, exactly one tab is selected while the remaining panels stay unselected, plus keyboard activation and sync data attributes.
- `packages/myst-awesome/tests/dropdown-rendering.spec.ts`: closed/open dropdown state, title as summary, keyboard disclosure, and nested content.
- `packages/myst-awesome/tests/button-icon-rendering.spec.ts`: linked versus non-linked button semantics, rejected unsafe URL, scienceicons library output, decorative icon accessibility, and unknown-icon fallback.
- `packages/myst-awesome/tests/ui-component-overrides.spec.ts`: each Resolver selects an injected Astro override while retaining rendered child fragments.
- `packages/myst-awesome/src/lib/render-myst-ast.ui.spec.ts`: unit-level escaping, id generation, selected-tab tie-breaking, grid span clamping, and card partitioning.

## Acceptance criteria

- [ ] All upstream card, grid, tab, button, and icon AST shapes listed above render instead of warning or disappearing.
- [ ] Cards preserve header, title, body, footer, target id, optional URL, and safe nested-link behavior.
- [ ] Grid breakpoint columns and item spans render responsively without invalid CSS values.
- [ ] Tab labels and panels have valid relationships, exactly one initial selection, and accessible keyboard operation.
- [ ] Dropdowns use `wa-details`, preserve AST open state, and expose the title as their disclosure summary.
- [ ] Button roles retain correct link/non-link semantics and never synthesize an unrequested action.
- [ ] Icon rendering reuses `wa-scienceicons.ts`, supports an explicit fallback for unsupported kinds, and is accessible.
- [ ] All dynamic text, ids, classes, and URLs are escaped or validated before being serialized.
- [ ] Each default UI component has a working Resolver override test.
- [ ] The static page remains useful when optional synchronization enhancement JavaScript is unavailable.

## Dependencies and ordering

1. Land [02-core-ast-parity.md](02-core-ast-parity.md) first: these cases require a typed extension point in `@awesome-myst/myst-zod`, safe attribute serialization, and a way for pages to pass component overrides into rendering.
2. This document can proceed independently of the proof/exercise roadmap, but its dropdown implementation should establish the shared `wa-details` convention before solution toggling in `06-proofs-exercises.md`.
3. Land this document before the code-output roadmap where code tabs reuse tab styling and code copy controls must coexist in the same content layout.
4. Coordinate with [03-cross-references-and-numbering.md](03-cross-references-and-numbering.md) before promising links to cards or grid items; this phase preserves ids and labels but does not resolve `crossReference` nodes itself.
