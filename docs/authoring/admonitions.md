---
title: Callouts & Admonitions
description: Callout blocks or admonitions, like "notes" or "hints" are outlined or shaded areas of a document to bring attention to particular information.
thumbnail: ./thumbnails/admonitions.png
---

Callouts, or "admonitions", highlight a particular block of text that exists slightly apart from the narrative of your page, such as a note or a warning.

In MyST we call these kinds of directives "admonitions", however, they are almost always used through their _named_ directives, like `note` or `danger`. There are ten kinds of admonitions available:

- `note` / `attention`
- `important` / `caution`
- `hint` / `warning`
- `seealso` / `danger`
- `tip` / `error`

For example, try changing the following example of a `{tip}` admonition to a `{warning}`:

```{myst}
:::{tip}
Try changing `tip` to `warning`!
:::
```

See below for a demo of each admonition in the default theme.

```{note}
This is a note admonition
```

```{important}
This is an important admonition
```

```{hint}
This is a hint admonition
```

```{seealso}
This is a seealso admonition
```

```{tip}
This is a tip admonition
```

```{attention}
This is an attention admonition
```

```{caution}
This is a caution admonition
```

```{warning}
This is a warning admonition
```

```{danger}
This is a danger admonition
```

```{error}
This is an error admonition
```

## Admonition Titles

All admonitions have a single argument, which is the admonition title and can use Markdown.
If a title argument is not supplied the first node of the admonition body is used if it is a heading or a paragraph with fully bold text; otherwise the name of the directive is used (e.g. `seealso` becomes "See Also"; `note` becomes "Note").

```{myst}
:::{tip} Admonition _title_
Here is an admonition!
:::
```

## Admonition Dropdown

To turn an admonition into a dropdown, add the `dropdown` class to them.
Dropdown admonitions use the `<details>` HTML element (meaning they also will work without JavaScript), and they can be helpful when including text that shouldn't immediately visible to your readers.
To have a dropdown-style admonition start open, add the `open` option.

```{myst}
:::{note} Click Me! 👈
:class: dropdown
👋 This could be a solution to a problem or contain other detailed explanations.
:::
```

## Simpler Admonitions

Admonitions can additionally be styled as `simple`, and can optionally hide the icon using the `icon` option.

```{myst}
:::{important} Magic
:class: simple

This is a magic cat. It casts a luck spell on you that lasts an hour.
:::
```

Removing the icon from an admonition allows using a custom emoji for style.

```{myst}
:::{danger} 🎤 Transcript. **Speaker:** John Smith
:icon: false
— To begin this lecture, I would like to ask the audience some questions.
:::
```

Multiple classes can be combined using inline options:

```{myst}
:::{warning .simple .dropdown icon=false open=true} ✍️ NB
The proof of the lemma for $x \leqslant 0$ is left to the reader.
:::
```

```{seealso} Admonitions in myst-awesome Theme
:class: dropdown

The myst-awesome theme renders admonitions using **Web Awesome** components:
- Standard admonitions render as `<wa-callout>` elements
- Admonitions with `dropdown` class render as `<wa-details>` elements

See the [Admonition Test Page](/admonition-test) for live examples of all admonition types.
```

This page is a modified version of the Admonitions page from the official [MyST-MD Guide](https://mystmd.org/guide/admonitions).
