// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import katex from "katex";

/**
 * Configuration options for KaTeX rendering
 */
export interface KaTeXConfig {
  /** Whether to render in display mode (block math) or inline mode */
  displayMode?: boolean;
  /** Whether to throw on error or render error message */
  throwOnError?: boolean;
  /** Whether to allow potentially unsafe HTML output */
  trust?: boolean;
  /** Macros to pass to KaTeX */
  macros?: Record<string, string>;
  /** Whether to use strict mode */
  strict?: boolean | "warn" | "ignore";
}

/**
 * Default KaTeX configuration
 */
const DEFAULT_KATEX_CONFIG: KaTeXConfig = {
  displayMode: false,
  throwOnError: false,
  trust: false,
  strict: "warn",
  macros: {},
};

/**
 * Renders LaTeX math using KaTeX
 * @param math - The LaTeX math string to render
 * @param config - Optional configuration overrides
 * @returns HTML string with rendered math
 */
export function renderMath(math: string, config: KaTeXConfig = {}): string {
  const finalConfig = { ...DEFAULT_KATEX_CONFIG, ...config };

  try {
    return katex.renderToString(math, finalConfig);
  } catch (error) {
    console.warn("KaTeX rendering error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    if (finalConfig.displayMode) {
      return `<div class="katex-error" style="color: red; font-family: monospace;">
        Math Error: ${errorMessage}<br>
        Expression: ${escapeHtml(math)}
      </div>`;
    } else {
      return `<span class="katex-error" style="color: red; font-family: monospace;" title="${errorMessage}">${escapeHtml(
        math
      )}</span>`;
    }
  }
}

/**
 * Renders inline math using KaTeX
 * @param math - The LaTeX math string to render
 * @param config - Optional configuration overrides
 * @returns HTML string with rendered inline math
 */
export function renderInlineMath(
  math: string,
  config: KaTeXConfig = {}
): string {
  return renderMath(math, { ...config, displayMode: false });
}

/**
 * Renders display math using KaTeX
 * @param math - The LaTeX math string to render
 * @param config - Optional configuration overrides
 * @returns HTML string with rendered display math
 */
export function renderDisplayMath(
  math: string,
  config: KaTeXConfig = {}
): string {
  return renderMath(math, { ...config, displayMode: true });
}

/**
 * Escape HTML characters to prevent XSS
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
