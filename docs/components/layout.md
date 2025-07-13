# MyST Awesome Theme Layout Components

This document describes the layout components implemented for the MyST Awesome Theme, which are inspired by Web Awesome's Page component structure and Furo's clean documentation styling.

## Architecture Overview

The layout system consists of three main components that build upon each other:

1. **BasePage.astro** - Core layout foundation
2. **DocsLayout.astro** - Documentation-specific layout
3. **ContentLayout.astro** - Blog/content-specific layout

## Components

### BasePage.astro

The foundational layout component that implements the Web Awesome Page component structure using only open-source components.

**Features:**

- Slot-based architecture (banner, header, subheader, navigation, main, aside, footer)
- Responsive navigation with mobile drawer using `wa-drawer`
- Theme and color scheme switching
- Sticky positioning for navigation elements
- Accessibility features (skip links, ARIA attributes)
- CSS Grid-based layout system

**Props:**

```typescript
interface Props {
  title?: string;
  description?: string;
  theme?:
    | "default"
    | "awesome"
    | "shoelace"
    | "brutalist"
    | "glossy"
    | "matter"
    | "mellow"
    | "playful"
    | "premium"
    | "tailspin";
  colorScheme?: "light" | "dark" | "auto";
  mobileBreakpoint?: string;
  disableSticky?: string[];
  navOpen?: boolean;
}
```

**Usage:**

```astro
---
import BasePage from './layouts/BasePage.astro';
---

<BasePage title="My Page" theme="awesome" colorScheme="auto">
  <div slot="header">Header content</div>
  <nav slot="navigation">Navigation content</nav>
  <main>Main content</main>
  <aside slot="aside">Sidebar content</aside>
</BasePage>
```

### DocsLayout.astro

Documentation-focused layout that extends BasePage with features specific to technical documentation.

**Features:**

- Breadcrumb navigation
- Table of contents with active section highlighting
- Theme and color scheme selectors in header
- Search functionality placeholder
- Article metadata (author, dates, edit links)
- Previous/next page navigation
- Structured footer with documentation links

**Props:**

```typescript
interface Props {
  title?: string;
  description?: string;
  theme?: string;
  colorScheme?: string;
  showToc?: boolean;
  showBreadcrumbs?: boolean;
  showEditButton?: boolean;
  editUrl?: string;
  lastModified?: Date;
  author?: string;
  section?: string;
  nextPage?: { title: string; href: string };
  prevPage?: { title: string; href: string };
}
```

**Usage:**

```astro
---
import DocsLayout from './layouts/DocsLayout.astro';
---

<DocsLayout
  title="API Reference"
  section="Documentation"
  showToc={true}
  showEditButton={true}
  editUrl="https://github.com/example/repo/edit/main/docs/api.md"
  nextPage={{ title: "Examples", href: "/docs/examples" }}
>
  <h1>API Documentation</h1>
  <p>Your documentation content here...</p>
</DocsLayout>
```

### ContentLayout.astro

Blog and article-focused layout optimized for reading experience.

**Features:**

- Hero image support
- Article metadata (author, publish date, reading time, tags)
- Social sharing buttons
- Tag cloud and categorization
- Newsletter signup
- Author information display
- Optimized typography for reading

**Props:**

```typescript
interface Props {
  title?: string;
  description?: string;
  author?: string;
  publishDate?: Date;
  lastModified?: Date;
  tags?: string[];
  category?: string;
  readingTime?: string;
  showTableOfContents?: boolean;
  heroImage?: string;
  heroImageAlt?: string;
}
```

**Usage:**

```astro
---
import ContentLayout from './layouts/ContentLayout.astro';

const publishDate = new Date('2024-01-15');
const tags = ['Web Development', 'Astro', 'Documentation'];
---

<ContentLayout
  title="Building Modern Documentation"
  author="Jane Developer"
  publishDate={publishDate}
  tags={tags}
  category="Tutorial"
  heroImage="/images/hero.jpg"
>
  <h2>Introduction</h2>
  <p>Your blog content here...</p>
</ContentLayout>
```

## Utility Components

### ThemeControls.astro

Reusable component for theme and color scheme selection.

**Features:**

- Theme selector dropdown with all Web Awesome themes
- Color scheme selector (light/dark/auto)
- Configurable appearance and size
- Automatic persistence to localStorage

### TableOfContents.astro

Automatic table of contents generation with active section tracking.

**Features:**

- Configurable heading levels
- Active section highlighting
- Smooth scrolling to sections
- Collapsible functionality
- Sticky positioning

### NavigationMenu.astro

Hierarchical navigation menu with search and collapsible sections.

**Features:**

- Multi-level navigation structure
- Search functionality
- Collapsible sections
- Icon and badge support
- Keyboard navigation
- Current page highlighting

## Styling System

The components use Web Awesome's comprehensive design system:

### Color System

- Semantic color tokens (`--wa-color-brand-fill-loud`, `--wa-color-text-normal`, etc.)
- Automatic dark mode support
- Theme-specific color palettes
- Consistent color usage across components

### Typography

- Web Awesome font families and sizes
- Consistent line heights and spacing
- Responsive typography scaling
- Code syntax highlighting support

### Layout

- CSS Grid and Flexbox for responsive layouts
- Web Awesome spacing tokens
- Consistent border radius and shadows
- Mobile-first responsive design

### Theming

- Support for all Web Awesome themes
- CSS custom property overrides
- Consistent component styling
- Theme persistence across sessions

## Responsive Behavior

### Mobile Navigation

- Automatic conversion to drawer navigation below breakpoint
- Hamburger menu toggle
- Touch-friendly interface
- Proper focus management

### Layout Adaptation

- Flexible grid systems that adapt to screen size
- Collapsible sidebars and navigation
- Optimized typography for mobile reading
- Touch-friendly interactive elements

## Accessibility Features

### Keyboard Navigation

- Full keyboard accessibility for all interactive elements
- Proper focus management and visual indicators
- Skip links for screen readers
- ARIA attributes and labels

### Screen Reader Support

- Semantic HTML structure
- Proper heading hierarchy
- Alternative text for images
- Descriptive link text

### Color and Contrast

- WCAG 2.1 AA compliant color combinations
- High contrast mode support
- Consistent focus indicators
- Reduced motion support

## Browser Support

The components are built with modern web standards and support:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

### Optimization Features

- Minimal JavaScript footprint
- CSS-only animations and transitions
- Efficient component hydration
- Optimized asset loading

### Bundle Size

- Tree-shakeable Web Awesome components
- Selective component imports
- Minimal runtime overhead
- Efficient CSS delivery

## Examples

See the example pages:

- `/docs-example` - Documentation layout demonstration
- `/blog-example` - Blog/content layout demonstration

These examples showcase all the features and demonstrate proper usage patterns for each layout component.

## Development

To work with these components:

1. Start the development server: `deno task dev`
2. View examples at `http://localhost:4321/docs-example` and `http://localhost:4321/blog-example`
3. Modify components in `src/layouts/` and `src/components/`
4. Test responsive behavior and accessibility features

## Future Enhancements

Potential improvements for future versions:

- Search integration with Algolia or similar
- Comment system integration
- Advanced table of contents with progress indicators
- Print-optimized styles
- Enhanced SEO features
- Multi-language support
