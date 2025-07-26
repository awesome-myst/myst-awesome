# MyST Awesome Theme

A modern, responsive documentation theme built with [Astro](https://astro.build) and [Web Awesome](https://webawesome.com) components. Designed for technical documentation with excellent typography, accessibility, and user experience.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/awesome-myst/myst-awesome-theme)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/awesome-myst/myst-awesome-theme)

## ✨ Features

- **📝 MyST Integration**: Seamless integration with MyST Markdown
- **🎨 Multiple Themes**: Choose from 10 built-in Web Awesome themes
- **🌓 Dark Mode**: Automatic and manual light/dark mode switching
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- **⚡ Fast Performance**: Optimized for speed with Astro's static generation
- **🔍 Search Ready**: Built-in search functionality support
- **� Component Overrides**: Customize any component with your own implementations

## 🚀 Quick Start

### Installation

```sh
# Clone the repository
git clone https://github.com/awesome-myst/myst-awesome-theme.git
cd myst-awesome-theme

# Install dependencies (using Deno)
deno install

# Start development server
deno task dev
```

### Basic Usage

```astro
---
// src/pages/my-docs.astro
import DocsLayout from 'myst-awesome-theme/layouts/DocsLayout.astro';
---

<DocsLayout 
  title="My Documentation"
  description="A guide to using MyST Awesome Theme"
>
  <h1>Welcome to my documentation!</h1>
  <p>Start writing your content here.</p>
</DocsLayout>
```

## 🏗️ Project Structure

```text
/
├── public/              # Static assets
├── src/
│   ├── components/      # Reusable Astro components
│   │   ├── NavigationMenu.astro
│   │   ├── TableOfContents.astro
│   │   ├── ThemeControls.astro
│   │   └── *Resolver.astro     # Component override resolvers
│   ├── layouts/         # Page layouts
│   │   ├── BasePage.astro      # Root layout with Web Awesome
│   │   ├── DocsLayout.astro    # Documentation layout
│   │   └── ContentLayout.astro # Content/blog layout
│   ├── custom/          # Custom component examples
│   │   ├── CustomNavigationMenu.astro
│   │   └── CustomTableOfContents.astro
│   ├── lib/             # Utilities and helpers
│   │   └── getComponent.ts     # Component resolver utilities
│   └── pages/           # Page routes
├── docs/                # MyST documentation content
│   ├── myst.yml         # MyST configuration
│   └── *.md             # Markdown content files
├── tests/               # Playwright tests
└── astro.config.mjs     # Astro configuration with theme overrides
```

## 🎨 Component Override System

One of the most powerful features of MyST Awesome Theme is the ability to override any component with your own custom implementations while maintaining full compatibility.

### Quick Example

```astro
---
// Create a custom navigation component
import DocsLayout from 'myst-awesome-theme/layouts/DocsLayout.astro';
import NavigationMenuResolver from 'myst-awesome-theme/components/NavigationMenuResolver.astro';
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

### Available Override Points

- **NavigationMenuResolver** - Sidebar navigation component
- **TableOfContentsResolver** - Table of contents component  
- **ThemeControlsResolver** - Theme and color scheme controls
- **DocsLayoutResolver** - Entire page layout

### Creating Custom Components

1. **Study the Interface**: Look at the default component's props and structure
2. **Create Your Component**: Build a replacement with the same interface
3. **Use the Resolver**: Pass your component to the appropriate resolver
4. **Test Thoroughly**: Ensure functionality, accessibility, and responsiveness

See the [Component Override Guide](./docs/COMPONENT_OVERRIDES.md) for detailed documentation and examples.

## 🧞 Commands

All commands are run from the root of the project:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `deno install`            | Install dependencies                             |
| `deno task dev`           | Start Astro dev server at `localhost:4321`      |
| `deno task build`         | Build production site to `./dist/`              |
| `deno task preview`       | Preview build locally                            |
| `deno task test`          | Run Playwright tests                             |
| `cd docs && deno task dev`| Start MyST content server at `localhost:3100`   |
| `deno task start-myst`    | Start headless MyST server only                 |

## 🎯 Development Workflow

### Theme Development (Astro)
```sh
deno task dev              # Main dev server at :4321
deno task build           # Production build to dist/
```

### Documentation Development (MyST)
```sh
cd docs && deno task dev  # MyST content server at :3100
deno task start-myst      # Headless MyST server only
```

### Testing
```sh
deno task test           # Playwright tests (requires both servers)
```

**Note**: Tests require both Astro (:4321) and MyST (:3100) servers running.

## 🎨 Theming

The theme leverages Web Awesome's comprehensive theming system:

### Available Themes
- `default` - Clean, professional appearance
- `awesome` - Vibrant colors and modern styling  
- `shoelace` - Familiar Shoelace-inspired interface
- `brutalist` - Bold, high-contrast design
- `glossy` - Smooth, polished appearance
- `matter` - Material Design inspired
- `mellow` - Soft, gentle color palette
- `playful` - Fun, energetic styling
- `premium` - Sophisticated, elegant design
- `tailspin` - Dynamic, movement-focused theme

### Theme Usage

```astro
---
// Set theme in layout
---
<DocsLayout theme="awesome" colorScheme="auto">
  <!-- Your content -->
</DocsLayout>
```

Or use the built-in theme controls:

```astro
---
import ThemeControls from 'myst-awesome-theme/components/ThemeControls.astro';
---

<ThemeControls 
  showThemeSelector={true}
  showColorSchemeSelector={true}
  size="small"
/>
```

## 🧪 Examples and Demos

- **[Component Override Test](/component-override-test)** - Live demo showcasing custom components
- **[Documentation Example](/docs-example)** - Full documentation layout
- **[Blog Example](/blog-example)** - Content/blog layout showcase

## 🏗️ Architecture

The theme uses a **dual build system**:

- **Astro** for theme components and layouts (`src/`)
- **MyST** for content compilation (`docs/`)

Key architectural decisions:

- **Slot-Based Layouts**: Web Awesome's page component pattern with named slots
- **Component Hydration**: Web Awesome components imported in `<script>` blocks
- **Theme System**: CSS classes (`wa-theme-{name}`) and custom properties
- **Override System**: Resolver components for flexible customization

See [Copilot Instructions](./.github/copilot-instructions.md) for detailed development patterns.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding conventions
4. Test your changes: `deno task test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode conventions
- Use Web Awesome components and design tokens
- Import Web Awesome components in `<script>` blocks
- Write Playwright tests for new features
- Maintain accessibility standards (WCAG 2.1 AA)
- Test on multiple screen sizes and themes

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Astro](https://astro.build) - The web framework for content-driven websites
- [Web Awesome](https://webawesome.com) - The comprehensive component library
- [MyST](https://mystmd.org) - Markedly Structured Text for scientific communication
- [Playwright](https://playwright.dev) - End-to-end testing framework

## 🔗 Links

- [Live Demo](https://myst-awesome-theme.netlify.app)
- [Documentation](./docs/)
- [Component Override Guide](./docs/COMPONENT_OVERRIDES.md)
- [Web Awesome Docs](https://webawesome.com/docs/)
- [Astro Docs](https://docs.astro.build/)
- [MyST Docs](https://mystmd.org/guide/)
