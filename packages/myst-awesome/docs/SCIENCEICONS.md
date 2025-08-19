# Science Icons for Web Awesome

This module integrates the [scienceicons](https://github.com/continuous-foundation/scienceicons) library with [Web Awesome](https://webawesome.com/) components, allowing you to use science-related icons in your applications.

## Quick Start

### 1. Install Dependencies

The scienceicons dependency is already included in this package. Make sure Web Awesome is also installed:

```bash
npm install @awesome.me/webawesome scienceicons
```

### 2. Copy Icons to Public Directory

Copy the scienceicons SVG files to your public directory:

```bash
# Using the included script
npm run copy-scienceicons

# Or manually copy from:
# node_modules/scienceicons/optimized/24/solid/
# to:
# public/scienceicons/
```

### 3. Import and Use

Import the scienceicons library in your application:

```typescript
// Auto-registers with default settings
import './lib/wa-scienceicons.js';

// Or with custom configuration
import { registerScienceIconsLibrary } from './lib/wa-scienceicons.js';
registerScienceIconsLibrary('/custom/icons/path');
```

Use icons in your templates:

```html
<wa-icon library="scienceicons" name="github"></wa-icon>
<wa-icon library="scienceicons" name="jupyter"></wa-icon>
<wa-icon library="scienceicons" name="orcid"></wa-icon>
<wa-icon library="scienceicons" name="myst"></wa-icon>
```

## Available Icons

The library includes 29 science-related icons:

- **Academic**: `arxiv`, `orcid`, `open-access`
- **Code & Development**: `github`, `jupyter`, `jupyter-book`, `jupyter-text`, `binder`
- **Communication**: `discord`, `discourse`, `email`, `linkedin`, `mastodon`, `slack`, `twitter`, `x`, `youtube`
- **Organizations**: `curvenote`, `myst`, `ror`, `osi`
- **Licenses**: `cc`, `cc-by`, `cc-nc`, `cc-nd`, `cc-sa`, `cc-zero`
- **Social**: `bluesky`, `website`

## Styling

Icons inherit the current text color and can be styled with CSS:

```html
<!-- Colored icons -->
<wa-icon library="scienceicons" name="jupyter" style="color: #f37626;"></wa-icon>
<wa-icon library="scienceicons" name="github" style="color: #333;"></wa-icon>

<!-- Large icons -->
<wa-icon library="scienceicons" name="orcid" style="font-size: 3rem;"></wa-icon>
```

## JavaScript API

The library provides utility functions for working with scienceicons:

```typescript
import { 
  getScienceIconNames, 
  isScienceIcon, 
  getScienceIconUrl,
  registerScienceIconsLibrary,
  type ScienceIconName
} from './lib/wa-scienceicons.js';

// Get all available icon names
const icons = getScienceIconNames();
// Returns: ['arxiv', 'binder', 'bluesky', ...]

// Check if an icon exists
const exists = isScienceIcon('github'); // true
const notExists = isScienceIcon('invalid'); // false

// Get the URL for an icon
const url = getScienceIconUrl('jupyter'); // '/scienceicons/jupyter.svg'
const customUrl = getScienceIconUrl('jupyter', '/my/icons'); // '/my/icons/jupyter.svg'

// Register with custom base URL
registerScienceIconsLibrary('/custom/path');
```

## TypeScript Support

The library includes full TypeScript support with type safety:

```typescript
import type { ScienceIconName } from './lib/wa-scienceicons.js';

// Type-safe icon names
const iconName: ScienceIconName = 'github'; // ✅ Valid
const invalid: ScienceIconName = 'invalid'; // ❌ TypeScript error
```

## Custom Base URL

If you want to serve the icons from a different location, you can customize the base URL:

```typescript
import { registerScienceIconsLibrary } from './lib/wa-scienceicons.js';

// Serve from a CDN
registerScienceIconsLibrary('https://cdn.example.com/scienceicons');

// Serve from a custom path
registerScienceIconsLibrary('/assets/icons/science');
```

## Astro Integration

For Astro projects, you can import the library in your layout or component:

```astro
---
// In your layout or page frontmatter
---

<script>
  // Import in a script tag (not frontmatter)
  import '../lib/wa-scienceicons.js';
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
</script>

<!-- Use in your template -->
<wa-icon library="scienceicons" name="myst"></wa-icon>
```

## Demo

See the [scienceicons demo page](./src/pages/scienceicons-demo.astro) for a complete example with all available icons.

## License

This integration is MIT licensed. The scienceicons themselves are also MIT licensed by the [Continuous Science Foundation](https://github.com/continuous-foundation/scienceicons).
