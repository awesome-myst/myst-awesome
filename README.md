# MyST Awesome

[![CI](https://github.com/awesome-myst/myst-awesome/actions/workflows/ci.yml/badge.svg)](https://github.com/awesome-myst/myst-awesome/actions/workflows/ci.yml)

⚠️ **Alpha State**: This project is currently in alpha development. Features and APIs may change.

A modern, responsive MyST-MD theme built with [Web Awesome](https://webawesome.com) components. Designed for scientific communication with excellent typography, accessibility, and user experience.

## ✨ Features

- **📝 MyST Integration**: Seamless integration with [MyST Markdown](https://mystmd.org) for scientific communication
- **🎨 Furo-Inspired Layout**: Clean, modern documentation layout inspired by the popular Furo Sphinx theme
- **🌐 Static-First Deployment**: Optimized for sustainable, easy hosting on CDNs with minimal infrastructure requirements
- **🎨 Multiple Themes**: Choose from built-in, customizable Web Awesome themes
- **🌓 Dark Mode**: Automatic and manual light/dark mode switching
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **♿ Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- **⚡ Fast Performance**: Optimized for speed with Astro's static generation
- **🔍 Search Ready**: Built-in fuzzy search functionality 
- **🔧 Component Overrides**: Customize any component with your own implementations

## 🚀 Quick Start

This project uses **pnpm workspaces** for monorepo management.

### Prerequisites

| Tool             | Supported version | Where it is declared                                                          |
| :--------------- | :---------------- | :---------------------------------------------------------------------------- |
| Node.js          | `>=22.12.0`       | `engines.node` in every workspace manifest; CI is pinned to this exact floor   |
| pnpm             | `>=10.28.2`       | `packageManager` in the root manifest (`corepack enable` installs it)          |
| MyST (`mystmd`)  | `>=1.10.1,<2`     | `docs/pixi.toml`, for the headless content server the docs app builds against  |

Node.js 22.12.0 is the floor required by Astro 6 and later; Node 18 and 20 are
not supported. Run `pnpm run check-engines` to verify your toolchain before
opening an issue about an install or build failure; the same check runs in CI,
where it also fails if the manifests and the pinned CI matrix ever disagree.

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

For detailed setup instructions and customization options, see our comprehensive [documentation](./docs/).

### 🏗️ Workspace Structure

```
├── packages/
│   ├── myst-awesome/           # Main Astro theme package
│   │   ├── src/                    # Astro components and layouts
│   │   ├── tests/                  # Playwright tests for theme
│   │   └── package.json
│   └── myst-astro-collections/     # MyST to Astro content collections
│       ├── src/                    # Collection loaders and schemas
│       ├── tests/                  # Collection tests
│       └── package.json
├── docs/                           # MyST documentation content
│   ├── authoring/                  # Writing guides and examples
│   ├── components/                 # Component documentation
│   ├── customization/              # Theming and customization docs
│   ├── src/                        # Astro pages and content config
│   ├── tests/                      # Playwright tests for docs
│   ├── index.md
│   ├── myst.yml
│   └── package.json
├── pnpm-workspace.yaml             # Workspace configuration
└── package.json                    # Root workspace package
```

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes following the coding conventions
4. Test your changes: `pnpm test`
5. Commit your changes using Conventional Commits: `git commit -m 'feat(theme): add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode conventions
- Use Web Awesome components and design tokens
- Import Web Awesome components in `<script>` blocks
- Write Playwright tests for new features
- Maintain accessibility standards (WCAG 2.1 AA)
- Test on multiple screen sizes and themes

See the [Architecture Overview](./docs/components/architecture.md) and [Component Overrides](./docs/components/overrides.md) documentation for detailed development patterns.

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
- [Component Overrides](./docs/components/overrides.md)
- [Architecture Overview](./docs/components/architecture.md)
- [Theming Guide](./docs/customization/themes.md)
- [MyST Awesome List](https://github.com/awesome-myst/awesome-myst)
- [Web Awesome Docs](https://webawesome.com/docs/)
- [Astro Docs](https://docs.astro.build/)
- [MyST Docs](https://mystmd.org/guide/)
