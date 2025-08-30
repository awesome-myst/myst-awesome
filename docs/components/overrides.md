# Component Override System

One of the most powerful features of MyST Awesome Theme is the ability to override any component with your own custom implementations while maintaining full compatibility.

## Quick Example

```astro
---
// Create a custom navigation component
import DocsLayout from 'myst-awesome/layouts/DocsLayout.astro';
import NavigationMenuResolver from 'myst-awesome/components/NavigationMenuResolver.astro';
import MyCustomNav from './custom/MyCustomNav.astro';
---

<DocsLayout title="Custom Navigation Demo">
  <!-- Use custom navigation instead of default -->
  <NavigationMenuResolver 
    slot="navigation"
    component={MyCustomNav}
    items={navItems}
  />
  
  <h1>Page with custom navigation!</h1>
</DocsLayout>
```

## Available Override Points

- **NavigationMenuResolver** - Sidebar navigation component
- **TableOfContentsResolver** - Table of contents component  
- **ThemeControlsResolver** - Theme and color scheme controls
- **DocsLayoutResolver** - Entire page layout

## Creating Custom Components

1. **Study the Interface**: Look at the default component's props and structure
2. **Create Your Component**: Build a replacement with the same interface
3. **Use the Resolver**: Pass your component to the appropriate resolver
4. **Test Thoroughly**: Ensure functionality, accessibility, and responsiveness

## Detailed Examples

### Custom Navigation Component

```astro
---
// components/MyCustomNav.astro
export interface Props {
  items: NavigationItem[];
  currentPath?: string;
}

const { items, currentPath } = Astro.props;
---

<nav class="custom-navigation">
  {items.map(item => (
    <a 
      href={item.url}
      class:list={['nav-item', { active: currentPath === item.url }]}
    >
      {item.title}
    </a>
  ))}
</nav>

<style>
  .custom-navigation {
    /* Your custom styles */
  }
</style>
```

### Custom Table of Contents

```astro
---
// components/MyCustomTOC.astro
export interface Props {
  headings: TocHeading[];
  collapsed?: boolean;
}

const { headings, collapsed = false } = Astro.props;
---

<aside class="custom-toc" data-collapsed={collapsed}>
  <h3>Contents</h3>
  <ul>
    {headings.map(heading => (
      <li data-level={heading.depth}>
        <a href={`#${heading.slug}`}>
          {heading.text}
        </a>
      </li>
    ))}
  </ul>
</aside>
```

## Testing Your Overrides

Always test your custom components for:
- **Functionality** - All features work as expected
- **Accessibility** - WCAG 2.1 AA compliance
- **Responsiveness** - Works on all screen sizes
- **Theme compatibility** - Works with all available themes
- **Performance** - No significant impact on load times

## Advanced Patterns

For more complex overrides and patterns, see the detailed implementation guide in [`../src/COMPONENT_OVERRIDES.md`](../src/COMPONENT_OVERRIDES.md).
