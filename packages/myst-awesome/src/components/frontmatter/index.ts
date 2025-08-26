/**
 * MyST Frontmatter Components
 * 
 * Astro components for displaying MyST page frontmatter data
 * using WebAwesome UI components and scienceicons.
 * 
 * These components mirror the functionality of myst-theme/packages/frontmatter
 * but are implemented purely in Astro.js.
 * 
 * Available components:
 * - FrontmatterBlock.astro - Main orchestrating component
 * - Authors.astro - Display authors with ORCID/email links
 * - Affiliations.astro - Display institutional affiliations with ROR links
 * - LicenseBadges.astro - Display Creative Commons and other license badges
 * - DownloadsDropdown.astro - Download options for various formats
 * - LaunchButton.astro - Launch buttons for Jupyter/Binder environments
 * 
 * Usage:
 * Import the component you need in your .astro file:
 * ---
 * import FrontmatterBlock from './components/frontmatter/FrontmatterBlock.astro';
 * ---
 * 
 * <FrontmatterBlock frontmatter={page.data.frontmatter} />
 */
