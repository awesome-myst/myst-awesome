// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * Component resolver for MyST Awesome Theme
 * Enables component overrides by checking for custom components before falling back to defaults
 */

export interface ComponentOverrides {
  NavigationMenu?: string;
  TableOfContents?: string;
  ThemeControls?: string;
  Welcome?: string;
  BasePage?: string;
  DocsLayout?: string;
  ContentLayout?: string;
  Layout?: string;
}

export interface ThemeConfig {
  components?: ComponentOverrides;
}

/**
 * Load theme configuration from astro.config.mjs
 * @returns Promise resolving to the theme configuration
 */
async function loadThemeConfig(): Promise<ThemeConfig | undefined> {
  try {
    // Try to import the config from astro.config.mjs
    const config = await import("../../astro.config.mjs");
    return config.themeConfig;
  } catch (error) {
    // If config is not available, return undefined
    return undefined;
  }
}

/**
 * Get the component path for a given component name
 * Checks for custom components in configuration before falling back to defaults
 * @param name - The component name
 * @param config - Optional theme configuration with component overrides
 * @returns The path to the component file
 */
export function getComponent(
  name: keyof ComponentOverrides,
  config?: ThemeConfig
): string {
  // Check if there's a custom component defined
  if (config?.components && config.components[name]) {
    return config.components[name];
  }

  // Fall back to the default component
  const componentMap: Record<keyof ComponentOverrides, string> = {
    NavigationMenu: "../components/NavigationMenu.astro",
    TableOfContents: "../components/TableOfContents.astro",
    ThemeControls: "../components/ThemeControls.astro",
    Welcome: "../components/Welcome.astro",
    BasePage: "../layouts/BasePage.astro",
    DocsLayout: "../layouts/DocsLayout.astro",
    ContentLayout: "../layouts/ContentLayout.astro",
    Layout: "../layouts/Layout.astro",
  };

  return componentMap[name];
}

/**
 * Get a component with automatic config loading
 * @param name - The component name
 * @returns Promise resolving to the component path
 */
export async function getComponentWithConfig(
  name: keyof ComponentOverrides
): Promise<string> {
  const config = await loadThemeConfig();
  return getComponent(name, config);
}

/**
 * Create a component resolver function for a specific configuration
 * @param config - The theme configuration
 * @returns A resolver function that can be used to get component paths
 */
export function createComponentResolver(config?: ThemeConfig) {
  return (name: keyof ComponentOverrides) => getComponent(name, config);
}

/**
 * Higher-order component that resolves a component based on configuration
 * @param name - The component name to resolve
 * @param config - Optional theme configuration
 * @returns The resolved component path
 */
export function resolveComponent(
  name: keyof ComponentOverrides,
  config?: ThemeConfig
): string {
  return getComponent(name, config);
}
