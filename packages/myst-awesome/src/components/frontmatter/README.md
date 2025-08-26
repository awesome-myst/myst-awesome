# MyST Frontmatter Components

Astro components for displaying MyST page frontmatter data using WebAwesome UI components and scienceicons. These components mirror the functionality of `myst-theme/packages/frontmatter` but are implemented purely in Astro.js.

## Components

### FrontmatterBlock.astro
Main orchestrating component that displays all frontmatter information in a structured layout.

**Props:**
- `frontmatter` - The complete frontmatter object from `page.data.frontmatter`

**Usage:**
```astro
---
import FrontmatterBlock from '../components/frontmatter/FrontmatterBlock.astro';
---

<FrontmatterBlock frontmatter={page.data.frontmatter} />
```

### Authors.astro
Displays author information with ORCID and email links.

**Props:**
- `authors` - Array of author objects from frontmatter
- `affiliations` - Array of affiliation objects for lookup

**Features:**
- ORCID icons with links to orcid.org profiles
- Email icons with mailto links
- Affiliation lookup and display

### Affiliations.astro
Displays institutional affiliations with ROR (Research Organization Registry) links.

**Props:**
- `affiliations` - Array of affiliation objects (displays all)
- `affiliationId` - String ID to lookup specific affiliation (displays single)

**Features:**
- Support for both individual and list display modes
- ROR icon links to ror.org registry
- Handles institution names and ROR IDs

### LicenseBadges.astro
Displays license badges using Creative Commons and other license icons.

**Props:**
- `license` - License object or array from frontmatter

**Features:**
- Creative Commons license detection and icon display
- OSI (Open Source Initiative) approved license badges
- Automatic license URL generation
- Support for multiple licenses

### DownloadsDropdown.astro
Displays download options for various formats in a dropdown menu.

**Props:**
- `downloads` - Array of download/export objects from frontmatter

**Features:**
- Format detection (PDF, Jupyter notebooks, etc.)
- Appropriate icons for each format type
- File extension display
- Direct download functionality

### LaunchButton.astro
Displays launch options for Jupyter/Binder environments.

**Props:**
- `thebe` - Thebe configuration from frontmatter
- `kernelName` - Optional kernel name for display

**Features:**
- Binder launch button with automatic URL construction
- JupyterHub integration
- Repository source links
- Dropdown for additional options

## Icons

All components use the `wa-scienceicons` library for scientific icons:

- **ORCID**: `orcid` - Author identification
- **Email**: `email` - Contact information  
- **ROR**: `ror` - Research organization registry
- **GitHub**: `github` - Source code repositories
- **Jupyter**: `jupyter` - Jupyter environments
- **Binder**: `binder` - Binder launch
- **Creative Commons**: `cc`, `cc-by`, `cc-nc`, `cc-nd`, `cc-sa`, `cc-zero` - License types
- **OSI**: `osi` - Open source licenses

## WebAwesome Components Used

- `wa-card` - Main content containers
- `wa-button` - Action buttons
- `wa-button-group` - Button groupings
- `wa-dropdown` / `wa-dropdown-item` - Dropdown menus
- `wa-icon` - Icon display
- `wa-badge` - Status badges

## Data Structure

The components expect frontmatter data structured according to the MyST schema:

```typescript
interface Frontmatter {
  title?: string;
  subtitle?: string;
  doi?: string;
  authors?: Array<{
    name: string;
    orcid?: string;
    email?: string;
    affiliations?: string[];
  }>;
  affiliations?: Array<{
    id: string;
    name?: string;
    institution?: string;
    ror?: string;
  }>;
  license?: Array<{
    id?: string;
    name?: string;
    url?: string;
    CC?: boolean;
    osi?: boolean;
  }>;
  downloads?: Array<{
    format: string;
    url: string;
    title?: string;
  }>;
  thebe?: {
    repository?: string;
    binder?: {
      repo: string;
      ref?: string;
    };
    server?: {
      url: string;
    };
    path?: string;
  };
}
```

## Integration with MyST Collections

These components are designed to work with MyST data loaded via Astro collections:

```astro
---
import { getCollection } from 'astro:content';
import FrontmatterBlock from '../components/frontmatter/FrontmatterBlock.astro';

// Load page data from MyST collection
const pages = await getCollection('pages');
const page = pages.find(p => p.slug === Astro.params.slug);
---

{page && (
  <FrontmatterBlock frontmatter={page.data.frontmatter} />
)}
```

## Styling

Components use Tailwind CSS classes for styling and are designed to work with the Web Awesome design system. The styling is responsive and follows modern web design patterns.

## Demo

See `/frontmatter-demo` for a complete demonstration of all components with sample data.

## Dependencies

- **Astro** - Component framework
- **WebAwesome** - UI component library  
- **wa-scienceicons** - Science icon library
- **Tailwind CSS** - Styling (optional, components work without it)

## Browser Support

Components work in all modern browsers that support Web Components and ES6+ JavaScript.
