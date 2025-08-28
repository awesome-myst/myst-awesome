# Frontmatter Component Resolvers

This directory contains resolver components that allow for easy customization and override of frontmatter display components in the MyST Awesome theme.

## Overview

The resolver pattern allows you to:
1. Use default components with no configuration
2. Override the entire component with a custom implementation
3. Override specific sub-components while keeping others default

## Quick Usage Example

Here's a complete example of using custom frontmatter components in a MyST project:

```astro
---
// src/pages/book/[...slug].astro
import DocsLayout from '@awesome-myst/myst-awesome/layouts/DocsLayout.astro';
import CustomAuthors from '../components/examples/CustomAuthors.astro';
import CustomFrontmatter from '../components/examples/CustomFrontmatterBlock.astro';

// ... get frontmatter data from MyST
---

<!-- Option 1: Custom entire frontmatter block -->
<DocsLayout 
  title={frontmatter.title}
  frontmatterComponent={CustomFrontmatter}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <slot />
</DocsLayout>

<!-- Option 2: Custom specific components -->
<DocsLayout 
  title={frontmatter.title}
  frontmatterComponents={{ 
    authors: CustomAuthors 
  }}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <slot />
</DocsLayout>
```

## Available Resolvers

### FrontmatterBlockResolver

Main resolver for the entire frontmatter block.

```astro
<!-- Default usage -->
<FrontmatterBlockResolver frontmatter={frontmatter} />

<!-- Custom entire component -->
import CustomFrontmatter from './custom/MyFrontmatterBlock.astro';
<FrontmatterBlockResolver 
  component={CustomFrontmatter} 
  frontmatter={frontmatter} 
/>

<!-- Custom sub-components -->
import CustomAuthors from './custom/MyAuthors.astro';
<FrontmatterBlockResolver 
  frontmatter={frontmatter}
  components={{ authors: CustomAuthors }}
/>
```

### Individual Component Resolvers

- **AuthorsResolver** - For author display
- **AffiliationsResolver** - For affiliation display  
- **DOIResolver** - For DOI links
- **DownloadsResolver** - For download buttons/dropdowns
- **LaunchButtonResolver** - For Jupyter/Binder launch buttons
- **LicenseBadgesResolver** - For license badges
- **SocialLinksResolver** - For social media links

#### Example Usage

```astro
<!-- Custom authors component -->
import CustomAuthors from './custom/MyAuthors.astro';
<AuthorsResolver 
  component={CustomAuthors}
  authors={frontmatter.authors}
  affiliations={frontmatter.affiliations}
/>

<!-- Custom DOI component -->
import CustomDOI from './custom/MyDOI.astro';
<DOIResolver 
  component={CustomDOI}
  doi={frontmatter.doi}
/>
```

## Using in DocsLayout

The `DocsLayout` component supports frontmatter customization through props:

```astro
---
import DocsLayout from '@awesome-myst/myst-awesome/layouts/DocsLayout.astro';
import CustomAuthors from './components/custom/MyAuthors.astro';
import CustomFrontmatter from './components/custom/MyFrontmatterBlock.astro';
---

<!-- Override entire frontmatter block -->
<DocsLayout 
  frontmatterComponent={CustomFrontmatter}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <!-- content -->
</DocsLayout>

<!-- Override specific sub-components -->
<DocsLayout 
  frontmatterComponents={{ authors: CustomAuthors }}
  frontmatter={frontmatter}
  showFrontmatterBlock={true}
>
  <!-- content -->
</DocsLayout>
```

## Creating Custom Components

### Custom Frontmatter Block

```astro
---
// MyFrontmatterBlock.astro
import type { ProjectAndPageFrontmatter } from '@awesome-myst/myst-zod';

interface Props {
  frontmatter: ProjectAndPageFrontmatter;
  baseUrl?: string;
  components?: any;
}

const { frontmatter, baseUrl, components } = Astro.props;
---

<div class="my-custom-frontmatter">
  <!-- Your custom layout -->
  {frontmatter.title && <h2>{frontmatter.title}</h2>}
  {frontmatter.authors && (
    <div class="authors">
      {frontmatter.authors.map(author => 
        <span class="author">{author.name}</span>
      )}
    </div>
  )}
</div>

<style>
  .my-custom-frontmatter {
    /* Your custom styles */
  }
</style>
```

### Custom Sub-Component

```astro
---
// MyAuthors.astro
interface Props {
  authors: any[];
  affiliations?: any[];
}

const { authors, affiliations } = Astro.props;
---

<div class="custom-authors">
  {authors.map(author => (
    <div class="author-card">
      <h3>{author.name}</h3>
      {author.email && <a href={`mailto:${author.email}`}>{author.email}</a>}
    </div>
  ))}
</div>

<style>
  .custom-authors {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .author-card {
    padding: 1rem;
    border: 1px solid var(--wa-color-surface-border);
    border-radius: var(--wa-border-radius-m);
  }
</style>
```

## Component Interface Requirements

When creating custom components, ensure they accept the same props as the default components they're replacing:

- **FrontmatterBlock**: `frontmatter`, `baseUrl`, `components`
- **Authors**: `authors`, `affiliations`
- **Affiliations**: `affiliations`
- **DOI**: `doi`
- **Downloads**: `downloads`
- **LaunchButton**: `thebe`
- **LicenseBadges**: `license`, `iconOnly`
- **SocialLinks**: `socialLinks`

## Benefits

1. **Gradual customization** - Override only what you need
2. **Type safety** - Full TypeScript support
3. **Maintainability** - Easy to update and extend
4. **Reusability** - Share custom components across projects
5. **Fallback support** - Always falls back to default components
