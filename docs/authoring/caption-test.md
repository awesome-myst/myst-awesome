---
title: Caption Rendering Test
description: Test page for figure and caption rendering in the myst-awesome theme.
---

# Caption Rendering Test

This page demonstrates the rendering of MyST figures, captions, and legends.

## Simple Figure with Caption

```{figure} https://github.com/rowanc1/pics/blob/main/grapes-wide.png?raw=true
:label: fig-simple
:alt: Grapes on a vineyard

A simple figure demonstrating basic caption rendering with the myst-awesome theme.
```

## Figure with Legend

Figures can have both a caption and a legend (additional descriptive text):

```{figure} https://github.com/rowanc1/pics/blob/main/sunset.png?raw=true
:label: fig-with-legend
:alt: Sunset at the beach
:align: center

This is the caption for the figure.

+++

This is the legend, providing additional context. Legends appear below the caption and can contain extended descriptions, methodology notes, or data source information.
```

## Cross-referencing Figures

You can reference figures like {numref}`fig-simple` or {ref}`fig-with-legend`.

## Image Alignment

### Left-aligned Image

```{image} https://github.com/rowanc1/pics/blob/main/banff-wide.png?raw=true
:alt: Banff, Canada
:align: left
:width: 300px
```

Text wraps around left-aligned images. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

### Center-aligned Image

```{image} https://github.com/rowanc1/pics/blob/main/sfo-wide.png?raw=true
:alt: Golden Gate Bridge
:align: center
:width: 500px
```

### Right-aligned Image

```{image} https://github.com/rowanc1/pics/blob/main/ocean-wide.png?raw=true
:alt: Ocean view
:align: right
:width: 300px
```

Text wraps around right-aligned images. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

## Subfigures

Subfigures can be created by omitting the directive argument to figure:

:::{figure}
:label: subfigure-example
:align: left

![Banff, Canada](https://github.com/rowanc1/pics/blob/main/banff-wide.png?raw=true)
![Golden Gate Bridge, San Francisco](https://github.com/rowanc1/pics/blob/main/sfo-wide.png?raw=true)

We saw some great views on our trips this year!
:::
