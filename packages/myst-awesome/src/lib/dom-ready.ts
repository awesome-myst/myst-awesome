// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

/**
 * Runs `callback` once the document has been parsed.
 *
 * Astro emits each client `<script>` block as a module, and a module that
 * finishes evaluating after `DOMContentLoaded` has already fired will never see
 * that event again: `document.addEventListener('DOMContentLoaded', …)` silently
 * becomes a no-op and the setup it guards never runs. Web Awesome makes this
 * easy to hit, because a page pulls in one module per component it uses and a
 * cold dev server serves them slowly enough for the ordering to change between
 * runs.
 *
 * The failure is invisible rather than loud — the DOM is correct, no error is
 * thrown, and only the behaviour the callback was supposed to attach is
 * missing — so every DOM-ready hook in the theme goes through here instead of
 * listening for the event directly.
 */
export function onDomReady(callback: () => void): void {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}
