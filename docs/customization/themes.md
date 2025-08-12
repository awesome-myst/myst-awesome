# Themes

MyST Awesome uses Web Awesome for theming, providing a powerful and flexible theming system that supports multiple design aesthetics and easy customization.

## Overview

The theme system in MyST Awesome is built on top of [Web Awesome](https://webawesome.com), which provides a comprehensive set of CSS custom properties and pre-built themes. The theming system allows you to:

- Choose from multiple built-in Web Awesome themes
- Create custom themes by overriding CSS custom properties
- Use custom theme components for advanced customization
- Switch themes dynamically at runtime

## Available Web Awesome Themes

MyST Awesome includes several pre-built Web Awesome themes, each with its own visual personality:

### Default Theme (`default`)
The standard Web Awesome theme with a clean, professional appearance. Features:
- Neutral color palette with subtle blues
- Balanced typography with good readability
- Conservative spacing and borders
- Suitable for professional documentation and applications

### Awesome Theme (`awesome`)
A modern, vibrant theme with bold colors and contemporary design. Features:
- Bright accent colors with high contrast
- Modern typography with slightly larger text
- Rounded corners and smooth shadows
- Perfect for creative projects and modern applications

### Shoelace Theme (`shoelace`)
A clean, minimal theme inspired by the Shoelace design system. Features:
- Simplified color palette with focus on content
- Clean typography with excellent readability
- Minimal visual elements and subtle borders
- Ideal for documentation and content-focused sites

### Additional Themes
Web Awesome also provides several other themes that can be enabled:

- **Brutalist**: Bold, stark design with sharp edges
- **Glossy**: Shiny, polished appearance with gradients
- **Matter**: Material Design-inspired theme
- **Mellow**: Soft, calm colors with gentle contrasts
- **Playful**: Fun, colorful theme with rounded elements
- **Premium**: Professional, refined appearance
- **Tailspin**: Dynamic, energetic design

## Using Themes

### Basic Theme Usage

The simplest way to use themes is through the default theme configuration in your layout:

```astro
---
import BasePage from '@awesome-myst/myst-awesome/layouts/BasePage.astro';
---

<BasePage theme="awesome">
  <!-- Your content -->
</BasePage>
```

### Theme Component

For more control over theme loading, use the `Themes` component:

```astro
---
import Themes from '@awesome-myst/myst-awesome/components/Themes.astro';
---

<html>
  <head>
    <!-- Load specific themes -->
    <Themes themes={['default', 'awesome', 'shoelace']} />
  </head>
  <body>
    <!-- Your content -->
  </body>
</html>
```

### Theme Properties

The `Themes` component accepts several properties:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `themes` | `string[]` | `['default', 'awesome', 'shoelace']` | Array of theme names to load |
| `includeBase` | `boolean` | `true` | Whether to include base Web Awesome CSS |
| `customThemes` | `string[]` | `[]` | URLs to external theme CSS files |
| `includeAll` | `boolean` | `false` | Load all available Web Awesome themes |

### Loading All Themes

To make all Web Awesome themes available for dynamic switching:

```astro
<Themes includeAll={true} />
```

## Custom Themes

### Creating Custom Theme CSS

You can create custom themes by overriding Web Awesome's CSS custom properties. Create a new CSS file with your theme variables:

```css
/* custom-theme.css */
:root {
  /* Primary colors */
  --wa-color-primary-50: #f0f9ff;
  --wa-color-primary-100: #e0f2fe;
  --wa-color-primary-500: #0ea5e9;
  --wa-color-primary-600: #0284c7;
  --wa-color-primary-900: #0c4a6e;

  /* Background colors */
  --wa-color-surface-default: #ffffff;
  --wa-color-surface-raised: #f8fafc;
  --wa-color-surface-lowered: #f1f5f9;

  /* Text colors */
  --wa-color-text-normal: #334155;
  --wa-color-text-loud: #0f172a;
  --wa-color-text-quiet: #64748b;

  /* Border and spacing */
  --wa-border-radius-m: 8px;
  --wa-space-m: 1rem;

  /* Typography */
  --wa-font-family-body: 'Inter', system-ui, sans-serif;
  --wa-font-family-heading: 'Inter', system-ui, sans-serif;
}

/* Dark mode overrides */
.wa-dark {
  --wa-color-surface-default: #0f172a;
  --wa-color-surface-raised: #1e293b;
  --wa-color-surface-lowered: #334155;

  --wa-color-text-normal: #e2e8f0;
  --wa-color-text-loud: #f8fafc;
  --wa-color-text-quiet: #94a3b8;
}
```

### Using External Theme CSS

Load custom themes from external URLs:

```astro
<Themes
  themes={['default']}
  customThemes={[
    '/assets/custom-theme.css',
    'https://cdn.example.com/my-theme.css'
  ]}
/>
```

## Custom Theme Components

For advanced theme customization, you can create custom theme components that extend the base functionality.

### Creating a Custom Theme Component

Create a new component that handles theme loading and adds custom enhancements:

```astro
```{code-block} astro
---
// src/components/CustomThemes.astro
interface Props {
  themes?: string[];
  includeBase?: boolean;
  customThemes?: string[];
  includeAll?: boolean;
  // Custom properties
  enableBrandColors?: boolean;
  customFonts?: boolean;
}

const {
  themes = ['default', 'awesome'],
  includeBase = true,
  customThemes = [],
  includeAll = false,
  enableBrandColors = true,
  customFonts = false
} = Astro.props;

// Import Web Awesome CSS
import "@awesome.me/webawesome/dist/styles/webawesome.css";
import "@awesome.me/webawesome/dist/styles/themes/default.css";
import "@awesome.me/webawesome/dist/styles/themes/awesome.css";
import "@awesome.me/webawesome/dist/styles/themes/shoelace.css";
---

<!-- Theme metadata -->
<meta name="theme:custom" content="true" />
<meta name="theme:brand-colors" content={enableBrandColors.toString()} />

<!-- External theme CSS -->
{customThemes.map((url) => (
  <link rel="stylesheet" href={url} />
))}
```

<!-- Custom font loading -->
{customFonts && (
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
    rel="stylesheet"
  />
)}

<!-- Custom theme enhancements -->
{enableBrandColors && (
  <style>
    :root {
      /* Custom brand colors */
      --brand-primary: #6366f1;
      --brand-secondary: #8b5cf6;
      --brand-accent: #06b6d4;

      /* Override Web Awesome colors with brand colors */
      --wa-color-primary-500: var(--brand-primary);
      --wa-color-primary-600: var(--brand-primary);
      --wa-color-brand-fill-loud: var(--brand-primary);
    }

    /* Custom component styling */
    .brand-button {
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      border: none;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: var(--wa-border-radius-m);
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .brand-button:hover {
      transform: translateY(-1px);
      box-shadow: var(--wa-shadow-l);
    }

    /* Custom navigation styling */
    .custom-nav {
      background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent));
      color: white;
    }

    .custom-nav a {
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .custom-nav a:hover {
      color: white;
    }
  </style>
)}

<style>
  /* Base custom styling */
  :root {
    /* Custom spacing scale */
    --custom-space-xs: 0.25rem;
    --custom-space-sm: 0.5rem;
    --custom-space-md: 1rem;
    --custom-space-lg: 2rem;
    --custom-space-xl: 4rem;

    /* Custom typography scale */
    --custom-text-xs: 0.75rem;
    --custom-text-sm: 0.875rem;
    --custom-text-base: 1rem;
    --custom-text-lg: 1.125rem;
    --custom-text-xl: 1.25rem;
    --custom-text-2xl: 1.5rem;
    --custom-text-3xl: 1.875rem;
  }

  /* Enhanced content styling */
  .content-enhanced {
    font-size: var(--custom-text-base);
    line-height: 1.7;
    color: var(--wa-color-text-normal);
  }

  .content-enhanced h1,
  .content-enhanced h2,
  .content-enhanced h3 {
    color: var(--wa-color-text-loud);
    margin-bottom: var(--custom-space-md);
  }

  .content-enhanced code {
    background: var(--wa-color-surface-raised);
    padding: 0.2rem 0.4rem;
    border-radius: var(--wa-border-radius-s);
    font-size: 0.9em;
  }

  .content-enhanced pre {
    background: var(--wa-color-surface-lowered);
    padding: var(--custom-space-md);
    border-radius: var(--wa-border-radius-m);
    overflow-x: auto;
    border: 1px solid var(--wa-color-surface-border);
  }

  .content-enhanced blockquote {
    border-left: 4px solid var(--wa-color-primary-500);
    padding-left: var(--custom-space-md);
    margin: var(--custom-space-md) 0;
    font-style: italic;
    color: var(--wa-color-text-quiet);
  }
</style>
```

### Using Custom Theme Components

Use the `ThemesResolver` to apply your custom theme component:

```astro
---
import ThemesResolver from '@awesome-myst/myst-awesome/components/ThemesResolver.astro';
import CustomThemes from './components/CustomThemes.astro';
---

<html>
  <head>
    <ThemesResolver
      component={CustomThemes}
      includeAll={true}
      enableBrandColors={true}
      customFonts={true}
      customThemes={['/assets/brand-theme.css']}
    />
  </head>
  <body>
    <!-- Your content will use the custom theme -->
  </body>
</html>
```

## Dynamic Theme Switching

MyST Awesome supports runtime theme switching through the theme controls component:

### Theme Selector

Include the theme selector in your layout:

```astro
---
import ThemeControls from '@awesome-myst/myst-awesome/components/ThemeControls.astro';
---

<header>
  <ThemeControls
    themes={['default', 'awesome', 'shoelace']}
    showColorScheme={true}
  />
</header>
```

### JavaScript Theme API

Control themes programmatically:

```javascript
// Switch to a specific theme
window.setTheme('awesome');

// Switch color scheme
window.setColorScheme('dark'); // 'light', 'dark', or 'auto'

// Get current theme
const currentTheme = localStorage.getItem('theme') || 'default';
const currentColorScheme = localStorage.getItem('color-scheme') || 'auto';
```

## CSS Custom Properties Reference

Web Awesome provides hundreds of CSS custom properties for theming. Here are the most commonly used categories:

### Colors

```css
/* Primary colors */
--wa-color-primary-50 through --wa-color-primary-950

/* Surface colors */
--wa-color-surface-default
--wa-color-surface-raised
--wa-color-surface-lowered
--wa-color-surface-border

/* Text colors */
--wa-color-text-normal
--wa-color-text-loud
--wa-color-text-quiet
--wa-color-text-link
```

### Typography

```css
/* Font families */
--wa-font-family-body
--wa-font-family-heading
--wa-font-family-code

/* Font weights */
--wa-font-weight-normal
--wa-font-weight-semibold
--wa-font-weight-bold

/* Font sizes */
--wa-font-size-xs through --wa-font-size-6xl
```

### Spacing and Layout

```css
/* Spacing scale */
--wa-space-xs through --wa-space-6xl

/* Border radius */
--wa-border-radius-xs through --wa-border-radius-2xl

/* Shadows */
--wa-shadow-xs through --wa-shadow-2xl
```

## Best Practices

### Performance

1. **Load only needed themes**: Use the `themes` prop to specify only the themes you need
2. **External themes**: Use `customThemes` for external CSS to avoid bundling
3. **Theme switching**: Preload all themes if users will switch between them

### Accessibility

1. **Color contrast**: Ensure sufficient contrast in custom themes
2. **Reduced motion**: Respect `prefers-reduced-motion` in theme transitions
3. **High contrast**: Test themes with high contrast mode enabled

### Development Workflow

1. **Start with a base theme**: Extend existing themes rather than creating from scratch
2. **Use CSS custom properties**: Override Web Awesome variables for consistency
3. **Test in both light and dark modes**: Ensure themes work in all color schemes
4. **Component isolation**: Create theme-specific components for complex customizations

## Examples

### Documentation Site Theme

```astro
<ThemesResolver
  component={DocsThemes}
  themes={['default', 'shoelace']}
  enableDocsStyling={true}
  customThemes={[
    'https://cdn.jsdelivr.net/npm/prismjs@latest/themes/prism.css'
  ]}
/>
```

### Marketing Site Theme

```astro
<ThemesResolver
  component={MarketingThemes}
  themes={['awesome', 'playful']}
  enableBrandColors={true}
  customFonts={true}
  customThemes={['/assets/marketing-theme.css']}
/>
```

### Application Theme

```astro
<ThemesResolver
  component={AppThemes}
  themes={['default', 'premium']}
  enableAppStyling={true}
  darkModeSupport={true}
/>
```

## Troubleshooting

### Theme Not Loading

1. Check that the theme CSS is properly imported
2. Verify theme names are spelled correctly
3. Ensure Web Awesome base CSS is loaded first

### Styles Not Applying

1. Check CSS specificity - Web Awesome uses CSS custom properties
2. Verify the theme class is applied to the document root
3. Check for conflicting CSS that might override theme styles

### Performance Issues

1. Reduce the number of loaded themes
2. Use specific theme imports instead of `includeAll`
3. Consider lazy loading themes for theme switching

For more information about Web Awesome theming, visit the [Web Awesome documentation](https://webawesome.com/docs/themes).
