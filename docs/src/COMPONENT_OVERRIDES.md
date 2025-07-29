# Component Override System

The MyST Awesome Theme includes a powerful component override system that allows you to customize and replace any theme component with your own custom implementations while maintaining full compatibility with existing layouts and functionality.

## Overview

The component override system is built around **Resolver Components** that act as smart wrappers around the default theme components. These resolvers can dynamically choose between the default component or a custom component you provide, enabling flexible theming without breaking existing code.

### Key Benefits

- **🎨 Complete Customization**: Replace any component with your own custom design
- **🔄 Backward Compatibility**: Existing layouts continue to work without modifications
- **⚡ Performance**: Only load the components and styles you actually use
- **🧩 Modular**: Override individual components without affecting others
- **📱 Responsive**: Custom components inherit responsive behavior
- **♿ Accessible**: Maintain accessibility features with proper implementation

## How It Works

### 1. Resolver Components

Resolver components are wrapper components that accept either the default component or a custom component via props:

```astro
---
// Using default NavigationMenu
---
<NavigationMenuResolver items={navItems} />

---
// Using custom NavigationMenu
import CustomNav from './custom/MyNavigationMenu.astro';
---
<NavigationMenuResolver component={CustomNav} items={navItems} />
```

### 2. Available Resolvers

The theme provides resolver components for all major theme components:

- `NavigationMenuResolver` - For sidebar navigation
- `TableOfContentsResolver` - For table of contents
- `ThemeControlsResolver` - For theme and color scheme controls
- `DocsLayoutResolver` - For entire layout overrides

### 3. Component Interface

Custom components must implement the same interface (props) as the default components they replace:

```typescript
// NavigationMenu interface example
interface Props {
  items: NavItem[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  collapsible?: boolean;
  showIcons?: boolean;
}
```

## Creating Custom Components

### Step 1: Create Your Custom Component

Create a new Astro component that implements the same interface as the component you want to replace:

```astro
---
// src/custom/MyNavigationMenu.astro
interface NavItem {
  title: string;
  href?: string;
  icon?: string;
  current?: boolean;
  children?: NavItem[];
}

interface Props {
  items: NavItem[];
  showSearch?: boolean;
  searchPlaceholder?: string;
  collapsible?: boolean;
  showIcons?: boolean;
}

const { items, showSearch = true, ...rest } = Astro.props;
---

<nav class="my-custom-navigation">
  <!-- Your custom navigation implementation -->
  {showSearch && (
    <div class="search-container">
      <wa-input placeholder="Search..." size="small">
        <wa-icon slot="start" name="magnifying-glass"></wa-icon>
      </wa-input>
    </div>
  )}
  
  <ul class="nav-list">
    {items.map(item => (
      <li class="nav-item">
        <a href={item.href} class={`nav-link ${item.current ? 'current' : ''}`}>
          {item.title}
        </a>
      </li>
    ))}
  </ul>
</nav>

<style>
  .my-custom-navigation {
    /* Your custom styles */
    background: linear-gradient(135deg, var(--wa-color-brand-fill-quiet), var(--wa-color-success-fill-quiet));
    border-radius: var(--wa-border-radius-l);
    padding: var(--wa-space-m);
  }
  
  .nav-link {
    color: var(--wa-color-text-normal);
    text-decoration: none;
    padding: var(--wa-space-s);
    border-radius: var(--wa-border-radius-m);
    transition: background-color var(--wa-transition-fast);
  }
  
  .nav-link:hover,
  .nav-link.current {
    background-color: var(--wa-color-brand-fill-loud);
    color: var(--wa-color-brand-on-loud);
  }
</style>

<script>
  // Import any Web Awesome components your custom component uses
  import '@awesome.me/webawesome/dist/components/input/input.js';
  import '@awesome.me/webawesome/dist/components/icon/icon.js';
</script>
```

### Step 2: Use the Resolver in Your Layout

Import your custom component and use it with the appropriate resolver:

```astro
---
// src/pages/my-page.astro
import DocsLayout from 'myst-awesome-theme/layouts/DocsLayout.astro';
import NavigationMenuResolver from 'myst-awesome-theme/components/NavigationMenuResolver.astro';
import MyNavigationMenu from '../custom/MyNavigationMenu.astro';

const navItems = [
  { title: "Home", href: "/", current: true },
  { title: "About", href: "/about" },
  // ... more items
];
---

<DocsLayout title="My Custom Page">
  <NavigationMenuResolver 
    slot="navigation"
    component={MyNavigationMenu}
    items={navItems}
    showSearch={true}
  />
  
  <!-- Your page content -->
  <h1>Welcome to my custom page!</h1>
</DocsLayout>
```

## Component Examples

### Custom Navigation Menu

Here's an example of a custom navigation menu with enhanced styling:

```astro
---
// Custom navigation with gradient background and animations
---
<nav class="gradient-navigation">
  <div class="nav-header">
    <h2 class="nav-title">
      <wa-icon name="sparkles" variant="solid"></wa-icon>
      Navigation
    </h2>
  </div>
  
  <div class="nav-content">
    {items.map(section => (
      <div class="nav-section">
        <h3 class="section-title">{section.title}</h3>
        <ul class="section-links">
          {section.children?.map(item => (
            <li>
              <a href={item.href} class={`nav-link ${item.current ? 'current' : ''}`}>
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</nav>

<style>
  .gradient-navigation {
    background: linear-gradient(135deg, 
      var(--wa-color-brand-fill-quiet) 0%, 
      var(--wa-color-success-fill-quiet) 100%);
    border-radius: var(--wa-border-radius-l);
    padding: var(--wa-space-m);
    border: 2px solid var(--wa-color-brand-border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .nav-link {
    display: block;
    padding: var(--wa-space-s);
    color: var(--wa-color-text-normal);
    text-decoration: none;
    border-radius: var(--wa-border-radius-m);
    background-color: rgba(255, 255, 255, 0.1);
    transition: all var(--wa-transition-fast);
    backdrop-filter: blur(10px);
  }
  
  .nav-link:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .nav-link.current {
    background-color: var(--wa-color-brand-fill-loud);
    color: var(--wa-color-brand-on-loud);
    font-weight: var(--wa-font-weight-semibold);
  }
</style>
```

### Custom Table of Contents

Example of a table of contents with progress tracking:

```astro
---
// Custom TOC with reading progress indicator
---
<aside class="progress-toc">
  <wa-card>
    <div slot="header" class="toc-header">
      <wa-icon name="list-ul" variant="solid"></wa-icon>
      <h3>Contents</h3>
      <wa-badge variant="success" size="small">{items.length}</wa-badge>
    </div>
    
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-fill"></div>
      </div>
      <span class="progress-text">0% read</span>
    </div>
    
    <ul class="toc-list">
      {items.map(item => (
        <li class={`toc-item level-${item.level}`}>
          <a href={item.href} class="toc-link" data-target={item.id}>
            {item.title}
          </a>
        </li>
      ))}
    </ul>
  </wa-card>
</aside>

<style>
  .progress-toc {
    position: sticky;
    top: var(--wa-space-l);
    max-height: calc(100vh - var(--wa-space-xl));
  }
  
  .progress-bar {
    width: 100%;
    height: 4px;
    background: var(--wa-color-neutral-fill-quiet);
    border-radius: var(--wa-border-radius-s);
    overflow: hidden;
    margin-bottom: var(--wa-space-xs);
  }
  
  .progress-fill {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, 
      var(--wa-color-success-fill-loud) 0%, 
      var(--wa-color-brand-fill-loud) 100%);
    transition: width var(--wa-transition-slow);
  }
  
  .toc-link.active {
    background: var(--wa-color-success-fill-loud);
    color: var(--wa-color-success-on-loud);
    font-weight: var(--wa-font-weight-semibold);
  }
</style>

<script>
  // Progress tracking functionality
  function updateProgress() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (!progressFill || !progressText) return;
    
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.round((scrollTop / docHeight) * 100);
    
    progressFill.style.width = `${Math.min(scrollPercent, 100)}%`;
    progressText.textContent = `${Math.min(scrollPercent, 100)}% read`;
  }
  
  window.addEventListener('scroll', updateProgress);
  updateProgress();
</script>
```

## Best Practices

### ✅ Do

- **Maintain Interface Compatibility**: Ensure your custom components accept the same props as the components they replace
- **Import Web Awesome Components**: Include all Web Awesome components your custom component uses in script blocks
- **Preserve Accessibility**: Maintain ARIA attributes, keyboard navigation, and focus management
- **Use Web Awesome Design Tokens**: Leverage CSS custom properties for consistent theming
- **Test Responsiveness**: Ensure your custom components work on all screen sizes
- **Follow Naming Conventions**: Use clear, descriptive class names and component names

### ❌ Don't

- **Break the Interface**: Don't change the expected props or remove required functionality
- **Skip Accessibility**: Don't remove keyboard navigation, ARIA attributes, or focus management
- **Ignore Performance**: Don't import unnecessary dependencies or create heavy custom styles
- **Hardcode Values**: Don't use fixed colors or spacing instead of Web Awesome design tokens
- **Override Everything**: Don't replace components unless you have a specific need

## Testing Custom Components

### Unit Testing

Test your custom components to ensure they work correctly:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Custom Navigation Menu', () => {
  test('should render navigation items', async ({ page }) => {
    await page.goto('/page-with-custom-nav');
    
    const customNav = page.locator('.my-custom-navigation');
    await expect(customNav).toBeVisible();
    
    const navLinks = customNav.locator('.nav-link');
    expect(await navLinks.count()).toBeGreaterThan(0);
  });
  
  test('should highlight current page', async ({ page }) => {
    await page.goto('/page-with-custom-nav');
    
    const currentLink = page.locator('.nav-link.current');
    await expect(currentLink).toBeVisible();
  });
});
```

### Visual Testing

Test the visual appearance and responsiveness:

```typescript
test('should look correct on different screen sizes', async ({ page }) => {
  await page.goto('/page-with-custom-nav');
  
  // Desktop
  await page.setViewportSize({ width: 1200, height: 800 });
  await expect(page.locator('.my-custom-navigation')).toBeVisible();
  
  // Tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(page.locator('.my-custom-navigation')).toBeVisible();
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('.my-custom-navigation')).toBeVisible();
});
```

## Troubleshooting

### Common Issues

**Q: My custom component isn't displaying**
A: Check that you're importing the custom component correctly and passing it to the resolver's `component` prop.

**Q: Web Awesome components aren't working in my custom component**
A: Make sure you're importing the Web Awesome components in a `<script>` block within your custom component.

**Q: Styles aren't applying correctly**
A: Ensure you're using Web Awesome CSS custom properties and that your styles are scoped to your custom component.

**Q: The component works but accessibility is broken**
A: Check that you've maintained all ARIA attributes, keyboard navigation, and focus management from the original component.

### Debug Tips

1. **Use Browser DevTools**: Inspect the rendered HTML to ensure your custom component is being used
2. **Check Console Errors**: Look for JavaScript errors related to Web Awesome components
3. **Validate Props**: Ensure you're passing all required props to your custom component
4. **Test Fallbacks**: Verify that the default component works when no custom component is provided

## Migration Guide

### From Default to Custom Components

1. **Identify the Component**: Determine which component you want to customize
2. **Study the Interface**: Look at the default component's props and structure
3. **Create Custom Component**: Build your replacement component with the same interface
4. **Update Layout**: Replace the default component with the resolver and your custom component
5. **Test Thoroughly**: Ensure functionality, accessibility, and responsiveness work correctly

### Updating Existing Custom Components

When updating custom components:

1. **Check Interface Changes**: Ensure your component still matches the expected interface
2. **Update Dependencies**: Make sure you're importing all required Web Awesome components
3. **Test Compatibility**: Verify that your component works with the latest theme version
4. **Review Best Practices**: Update your component to follow current best practices

## Examples and Demos

For complete working examples of custom components, see:

- [`/component-override-test`](/component-override-test) - Live demo page with custom navigation and TOC
- [`src/custom/CustomNavigationMenu.astro`](src/custom/CustomNavigationMenu.astro) - Custom navigation with gradients and animations
- [`src/custom/CustomTableOfContents.astro`](src/custom/CustomTableOfContents.astro) - Custom TOC with progress tracking
- [`tests/component-overrides.spec.ts`](tests/component-overrides.spec.ts) - Comprehensive test suite for component overrides

## Further Reading

- [Web Awesome Documentation](https://webawesome.com/docs/) - Learn about available components and design tokens
- [Astro Component Guide](https://docs.astro.build/en/core-concepts/astro-components/) - Understanding Astro component architecture
- [MyST Awesome Theme Architecture](./ARCHITECTURE.md) - Deep dive into theme structure and patterns
