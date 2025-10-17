// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * Escape HTML characters to prevent XSS
 * Works in both Node.js and browser environments
 * @param text - Text to escape
 * @returns Escaped HTML string
 */
export function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#x27;",
  };

  return text.replace(/[&<>"']/g, (match) => htmlEscapes[match] || match);
}
