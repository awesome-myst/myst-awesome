# MyST Awesome

A modern, responsive MyST-MD theme built with [Web Awesome](https://webawesome.com) components. Designed for scientific communication with excellent typography, accessibility, and user experience.

## ✨ Features

- **📝 MyST Integration**: Seamless integration with [MyST Markdown](https://mystmd.org) for scientific communication
- **🎨 Multiple Themes**: Choose from built-in, customizable Web Awesome themes
- **🌓 Dark Mode**: Automatic and manual light/dark mode switching
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- **⚡ Fast Performance**: Optimized for speed with Astro's static generation
- **🔍 Search Ready**: Built-in fuzzy search functionality 
- **🔧 Component Overrides**: Customize any component with your own implementations

## 🚀 Quick Start

This project uses **pnpm workspaces** for monorepo management.

### Installation

```sh
# Clone the repository
git clone https://github.com/awesome-myst/myst-awesome.git
cd myst-awesome

# Install dependencies (using pnpm)
pnpm install

# Start development server (theme)
pnpm dev

# Start documentation server (MyST content)
pnpm dev-docs
```

### 🏗️ Workspace Structure

```
├── packages/
│   └── myst-awesome/     # Main theme package
│       ├── src/                # Astro components and layouts
│       ├── tests/              # Playwright tests
│       └── package.json
├── docs/                       # MyST documentation content
│   ├── index.md
│   ├── myst.yml
│   └── package.json
├── pnpm-workspace.yaml         # Workspace configuration
└── package.json                # Root workspace package
```

## 🎨 Component Override System

One of the most powerful features of MyST Awesome Theme is the ability to override any component with your own custom implementations while maintaining full compatibility.

### Quick Example

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

## 📚 Available Commands

All commands are run from the root of the project:

| Command                    | Action                                           |
| :------------------------- | :----------------------------------------------- |
| `pnpm install`             | Install dependencies for all packages           |
| `pnpm dev`                 | Start Astro dev server at `localhost:4321`      |
| `pnpm build`               | Build production site to `./dist/`              |
| `pnpm preview`             | Preview build locally                            |
| `pnpm test`                | Run Playwright tests                             |
| `pnpm dev-docs`            | Start MyST documentation development             |
| `pnpm start-myst`          | Start headless MyST server only                 |

## 🎯 Development Workflow

### Theme Development (Astro)
```sh
pnpm dev                   # Main dev server at :4321
pnpm build                 # Production build to dist/
```

### Documentation Development (MyST)
```sh
pnpm dev-docs              # MyST content server at :3100
pnpm start-myst            # Headless MyST server only
```

### Testing
```sh
pnpm test                  # Playwright tests (requires both servers)
```

## 🎨 Theming

The theme leverages Web Awesome's comprehensive theming system:

### Available Themes

- `default` - Clean, professional appearance
- `awesome` - Vibrant colors and modern styling  

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
import ThemeControls from 'myst-awesome/components/ThemeControls.astro';
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
4. Test your changes: `pnpm test`
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

<!-- - [Live Demo](https://myst-awesome.netlify.app) -->
- [Documentation](./docs/)
- [Component Override Guide](./docs/COMPONENT_OVERRIDES.md)
- [Web Awesome Docs](https://webawesome.com/docs/)
- [Astro Docs](https://docs.astro.build/)
- [MyST Docs](https://mystmd.org/guide/)
