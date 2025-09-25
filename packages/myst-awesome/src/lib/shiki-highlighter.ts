// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { codeToHtml } from 'shiki';

/**
 * Configuration for Shiki syntax highlighting
 */
export interface ShikiConfig {
  /** Light theme name */
  lightTheme: string;
  /** Dark theme name */
  darkTheme: string;
  /** Default language for code blocks when none is specified */
  defaultLanguage: string;
}

/**
 * Default Shiki configuration with GitHub themes
 */
export const DEFAULT_SHIKI_CONFIG: ShikiConfig = {
  lightTheme: 'github-light',
  darkTheme: 'github-dark',
  defaultLanguage: 'text',
};

/**
 * Highlights code using Shiki with dual theme support
 * @param code - The code to highlight
 * @param language - The programming language
 * @param config - Optional configuration overrides
 * @returns Promise<string> - HTML string with syntax highlighting
 */
export async function highlightCode(
  code: string, 
  language: string = DEFAULT_SHIKI_CONFIG.defaultLanguage,
  config: Partial<ShikiConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_SHIKI_CONFIG, ...config };
  
  try {
    // Use dual themes for light/dark mode support
    const html = await codeToHtml(code, {
      lang: language || finalConfig.defaultLanguage,
      themes: {
        light: finalConfig.lightTheme,
        dark: finalConfig.darkTheme,
      },
      defaultColor: false, // Don't set a default color, let CSS handle it
    });
    
    return html;
  } catch (error) {
    console.warn(`Shiki highlighting failed for language "${language}":`, error);
    // Fallback to plain HTML if highlighting fails
    return `<pre class="shiki"><code>${escapeHtml(code)}</code></pre>`;
  }
}

/**
 * Highlights inline code using Shiki
 * @param code - The inline code to highlight
 * @param language - The programming language (optional for inline code)
 * @param config - Optional configuration overrides
 * @returns Promise<string> - HTML string with syntax highlighting
 */
export async function highlightInlineCode(
  code: string,
  language?: string,
  config: Partial<ShikiConfig> = {}
): Promise<string> {
  // For inline code, we only highlight if a language is explicitly provided
  if (!language) {
    return `<code>${escapeHtml(code)}</code>`;
  }

  const finalConfig = { ...DEFAULT_SHIKI_CONFIG, ...config };
  
  try {
    // Use dual themes for light/dark mode support
    const html = await codeToHtml(code, {
      lang: language,
      themes: {
        light: finalConfig.lightTheme,
        dark: finalConfig.darkTheme,
      },
      defaultColor: false,
    });
    
    // Extract the inner content from the <pre><code> wrapper for inline use
    // Shiki returns <pre class="shiki"><code>...</code></pre>
    // We want just the <code> part with proper classes for inline use
    const match = html.match(/<code[^>]*>(.*?)<\/code>/s);
    if (match) {
      // Extract classes from the pre tag and apply them to inline code
      const preMatch = html.match(/<pre[^>]*class="([^"]*)"[^>]*>/);
      const classes = preMatch ? preMatch[1] : 'shiki';
      return `<code class="${classes} inline">${match[1]}</code>`;
    }
    
    return html;
  } catch (error) {
    console.warn(`Shiki inline highlighting failed for language "${language}":`, error);
    // Fallback to plain HTML if highlighting fails
    return `<code>${escapeHtml(code)}</code>`;
  }
}

/**
 * Escape HTML characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  
  return text.replace(/[&<>"']/g, (match) => htmlEscapes[match] || match);
}

/**
 * Get CSS for Shiki theme support
 * This provides the base CSS variables and classes needed for dual theme support
 */
export function getShikiThemeCSS(): string {
  return `
/* Shiki theme CSS variables for light/dark mode */
.shiki,
.shiki span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

.shiki.inline {
  background-color: transparent;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .shiki,
  .shiki span {
    color: var(--shiki-dark);
    background-color: var(--shiki-dark-bg);
  }
}

/* Explicit dark theme class support */
.dark .shiki,
.dark .shiki span {
  color: var(--shiki-dark);
  background-color: var(--shiki-dark-bg);
}

/* Light theme when explicitly set */
.light .shiki,
.light .shiki span {
  color: var(--shiki-light);
  background-color: var(--shiki-light-bg);
}

/* Code block specific styles */
.shiki {
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  font-family: 'Fira Code', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
}

.shiki code {
  background: transparent;
  padding: 0;
  border-radius: 0;
  font-family: inherit;
}
`;
}