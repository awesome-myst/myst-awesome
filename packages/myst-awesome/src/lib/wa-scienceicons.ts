// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * Register scienceicons as a custom icon library for Web Awesome
 * 
 * This module registers the scienceicons collection as a custom icon library
 * that can be used with Web Awesome's <wa-icon> component.
 * 
 * Setup:
 * 1. Copy the scienceicons from node_modules/scienceicons/24/solid/
 *    to your public/scienceicons/ directory
 * 2. Import this module in your application
 * 
 * Usage:
 * ```typescript
 * import './lib/wa-scienceicons.js';
 * 
 * // Or with custom base URL:
 * import { registerScienceIconsLibrary } from './lib/wa-scienceicons.js';
 * registerScienceIconsLibrary('/custom/icons/path');
 * ```
 * 
 * Then use icons in your templates:
 * ```html
 * <wa-icon library="scienceicons" name="github"></wa-icon>
 * <wa-icon library="scienceicons" name="jupyter"></wa-icon>
 * <wa-icon library="scienceicons" name="orcid"></wa-icon>
 * ```
 */

import { registerIconLibrary } from '@awesome.me/webawesome';

import { SCIENCEICONS, isScienceIcon } from './scienceicons-names.js';
import type { ScienceIconName } from './scienceicons-names.js';

/**
 * Get the URL for a scienceicon
 * 
 * Note: The scienceicons must be made available in your public directory.
 * You can copy them from node_modules/scienceicons/24/solid/
 * to your public/scienceicons/ directory, or set up a build process to do this automatically.
 */
export function getScienceIconUrl(name: string, baseUrl?: string): string {
  // Default to a public directory path
  // Users can override this by passing a different baseUrl
  const iconBaseUrl = baseUrl || '/scienceicons';
  
  return `${iconBaseUrl}/${name}.svg`;
}

/**
 * Register the scienceicons library with Web Awesome
 * 
 * @param baseUrl - Optional base URL for the icons (defaults to '/scienceicons')
 */
export function registerScienceIconsLibrary(baseUrl?: string) {
  registerIconLibrary('scienceicons', {
    resolver: (name: string) => {
      // Validate that the icon exists
      if (!isScienceIcon(name)) {
        console.warn(`Unknown scienceicon: ${name}. Available icons:`, SCIENCEICONS);
        return '';
      }
      
      return getScienceIconUrl(name, baseUrl);
    },
    mutator: (svg: SVGElement) => {
      // The scienceicons already use fill="currentColor" which is perfect for Web Awesome
      // But we'll ensure it's set correctly just in case
      if (!svg.hasAttribute('fill') || svg.getAttribute('fill') === 'none') {
        svg.setAttribute('fill', 'currentColor');
      }
      
      // Ensure proper accessibility
      if (!svg.hasAttribute('aria-hidden')) {
        svg.setAttribute('aria-hidden', 'true');
      }
      
      // Remove any inline styles that might interfere
      svg.removeAttribute('style');
      
      return svg;
    },
  });
}

// Re-exported so a consumer that only wants the names need not know they
// live in their own module.
export { SCIENCEICONS, isScienceIcon };
export type { ScienceIconName };

// Also export a convenience function to get all available icon names
export function getScienceIconNames(): readonly string[] {
  return SCIENCEICONS;
}
