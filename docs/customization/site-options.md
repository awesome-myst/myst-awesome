# Site Options

Site options in MyST allow you to quickly configure how your website behaves and appears. These options control various aspects of your site, from basic settings like logos and favicons to more advanced features like analytics, navigation behavior, and theme-specific customizations.

## What are Site Options?

Site options are configuration settings that control your website's appearance and behavior. They are different from project frontmatter (which contains metadata about your content) and focus specifically on how your website is rendered and presented to users.

Site options are specified in the `site.options` section of your `myst.yml` configuration file:

```yaml
# myst.yml
version: 1
site:
  template: awesome-book
  options:
    # Site options go here
    logo: assets/logo.svg
    favicon: assets/favicon.ico
    hide_toc: false
```

These options are template-specific, meaning different themes may support different options. The options you specify here are validated against your chosen theme's available options during the build process.

## Complete Example

Here's a comprehensive example showing all the common site options available in MyST themes:

```yaml
# myst.yml
version: 1
site:
  template: awesome-book
  title: My MyST Site
  options:
    # Branding and Identity
    logo: assets/logo.svg
    favicon: assets/favicon.ico

    # Navigation and Layout
    hide_toc: false
    hide_outline: false
    hide_title_block: false
    folders: false

    # Styling
    style: assets/custom-styles.css

    # Theme-specific options (book-theme)
    numbered: true
    show_navbar_depth: 2
    repository_url: https://github.com/user/repo
    repository_branch: main
    launch_buttons:
      notebook_interface: jupyterlab
      binderhub_url: https://mybinder.org

    # Design options
    design:
      hide_authors: false
      primary_color: "#1f77b4"
```

## Site Options Reference

### Basic Branding Options

#### `logo`
- **Type**: `string` (file path or URL)
- **Description**: Path to your site's logo image. This appears in the site header/navigation.
- **Example**: `logo: assets/logo.svg`
- **Themes**: `book-theme`, `article-theme`

#### `favicon`
- **Type**: `string` (file path or URL)
- **Description**: Path to your site's favicon (the small icon that appears in browser tabs).
- **Example**: `favicon: assets/favicon.ico`
- **Templates**: `awesome-book`

### Navigation and Layout Options

#### `hide_toc`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Hide the primary sidebar (table of contents) across the entire site.
- **Example**: `hide_toc: true`
- **Themes**: `book-theme`, `article-theme`
- **Page-level**: Can be overridden in page frontmatter under `site.hide_toc`

#### `hide_outline`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Hide the secondary sidebar (in-page outline) across the entire site.
- **Example**: `hide_outline: true`
- **Themes**: `book-theme`, `article-theme`
- **Page-level**: Can be overridden in page frontmatter under `site.hide_outline`

#### `hide_title_block`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Hide the default title block that shows page metadata (useful for landing pages).
- **Example**: `hide_title_block: true`
- **Themes**: `book-theme`, `article-theme`
- **Page-level**: Can be overridden in page frontmatter under `site.hide_title_block`

#### `folders`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Include folder structure in URLs. When enabled, nested folders become path segments in URLs.
- **Example**: `folders: true`
- **Themes**: `book-theme`, `article-theme`

### Styling Options

#### `style`
- **Type**: `string` (file path)
- **Description**: Path to a custom CSS file to include in your site for additional styling.
- **Example**: `style: assets/custom-styles.css`
- **Themes**: `book-theme`, `article-theme`

### Book Theme Specific Options

#### `numbered`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable automatic numbering of sections and chapters.
- **Example**: `numbered: true`
- **Themes**: `book-theme`

#### `show_navbar_depth`
- **Type**: `integer`
- **Default**: `1`
- **Description**: Depth of navigation items to show in the navbar.
- **Example**: `show_navbar_depth: 2`
- **Themes**: `book-theme`

#### `repository_url`
- **Type**: `string` (URL)
- **Description**: URL to the source repository for the site.
- **Example**: `repository_url: https://github.com/user/repo`
- **Themes**: `book-theme`

#### `repository_branch`
- **Type**: `string`
- **Default**: `main`
- **Description**: Git branch name for repository links.
- **Example**: `repository_branch: main`
- **Themes**: `book-theme`

#### `launch_buttons`
- **Type**: `object`
- **Description**: Configuration for interactive notebook launch buttons.
- **Themes**: `book-theme`

##### `launch_buttons.notebook_interface`
- **Type**: `string`
- **Options**: `classic`, `jupyterlab`
- **Default**: `classic`
- **Description**: Interface to use when launching notebooks.

##### `launch_buttons.binderhub_url`
- **Type**: `string` (URL)
- **Default**: `https://mybinder.org`
- **Description**: URL for Binder hub to launch interactive notebooks.

### Design Options

#### `design`
- **Type**: `object`
- **Description**: Container for design-related options.
- **Themes**: `book-theme`, `article-theme`

##### `design.hide_authors`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Hide author information from pages.
- **Example**: `design: {hide_authors: true}`

##### `design.primary_color`
- **Type**: `string` (CSS color)
- **Description**: Primary color for the theme.
- **Example**: `design: {primary_color: "#1f77b4"}`

### Page-Level Overrides

Many site options can be overridden on individual pages by including them in the page's frontmatter under a `site` key:

```yaml
---
title: My Special Page
site:
  hide_toc: true
  hide_outline: true
  hide_title_block: true
---
```

This is particularly useful for landing pages or special pages that need different layout options than the rest of your site.

## Theme Compatibility

Different MyST themes support different sets of options:

- **book-theme**: Supports all options listed above
- **article-theme**: Supports basic branding, navigation, analytics, and styling options
- **Custom themes**: May define their own specific options

When using a custom theme, refer to the theme's documentation for available options. MyST will validate your options against the theme's specification and warn you about unsupported options.