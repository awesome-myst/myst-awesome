---
title: Callouts & Admonitions
description: Callout blocks or admonitions, like "notes" or "hints" are outlined or shaded areas of a document to bring attention to particular information.
thumbnail: ./thumbnails/admonitions.png
---

Callouts, or "admonitions", highlight a particular block of text that exists slightly apart from the narrative of your page, such as a note or a warning.

See the [Admonition Test Page](/admonition-test) for a live demo of all admonition types in the myst-awesome theme.

## Admonition Types

There are ten kinds of admonitions available:

| Blue | Orange | Green | Red |
|------|--------|-------|-----|
| note | attention | hint | danger |
| important | caution | seealso | error |
| | warning | tip | |

For example:

```{note}
This is a note admonition.
```

```{tip}
This is a tip with helpful advice.
```

```{warning}
This is a warning admonition.
```

## Admonition Titles

All admonitions have a single argument, which is the admonition title and can use Markdown.

```{myst}
:::{tip} Custom Title
Here is an admonition with a custom title!
:::
```

## Dropdown Admonitions

To turn an admonition into a dropdown, add the `dropdown` class:

```{myst}
:::{note}
:class: dropdown
This is a dropdown admonition that can be collapsed.
:::
```

To have it start open, add the `open` option:

```{myst}
:::{note}
:class: dropdown
:open: true
This dropdown starts open by default.
:::
```

## Simple Admonitions

Admonitions can be styled as `simple`:

```{myst}
:::{note}
:class: simple
This is a simple admonition without the default styling.
:::
```

To hide the icon:

```{myst}
:::{note}
:icon: false
This admonition has no icon.
:::
```

```{seealso} Admonitions in myst-awesome Theme

The myst-awesome theme renders admonitions using **Web Awesome** components:
- `{note}`, `{tip}`, `{warning}`, etc. → `<wa-callout>` elements
- Admonitions with `dropdown` class → `<wa-details>` elements

See the [Admonition Test Page](/admonition-test) for live examples.
```

This page is a modified version of the Admonitions page from the official [MyST-MD Guide](https://mystmd.org/guide/admonitions).
