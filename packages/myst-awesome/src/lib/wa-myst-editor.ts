// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { LitElement, html, css, type PropertyValues } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import type { Root } from '@awesome-myst/myst-zod';

// Import Web Awesome components
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

/**
 * A MyST Markdown editor with live preview using Web Awesome components.
 * 
 * @element wa-myst-editor
 * 
 * @attr {string} value - The MyST markdown content
 * @attr {string} placeholder - Placeholder text for the editor
 * @attr {boolean} readonly - Whether the editor is read-only
 * @attr {string} render-module-path - Path to the render module (default: '/render-myst-ast.mjs')
 * 
 * @fires change - Fired when the content changes
 * @fires input - Fired on input events
 */

export class WaMystEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: var(--wa-font-family-body, system-ui);
      margin-block: var(--wa-space-l, 2rem);
    }

    .editor-container {
      display: flex;
      flex-direction: column;
      gap: var(--wa-space-m, 1rem);
      width: 100%;
    }

    .editor-section {
      flex: 1;
      min-height: 200px;
    }

    wa-textarea {
      width: 100%;
      min-height: 200px;
    }

    wa-textarea::part(textarea) {
      font-family: var(--wa-font-family-code, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
      font-size: 14px;
      line-height: 1.4;
      resize: vertical;
    }

    wa-card {
      width: 100%;
      min-height: 200px;
    }

    .preview-content {
      padding: var(--wa-space-m, 1rem);
      line-height: 1.6;
      overflow-wrap: break-word;
    }

    .preview-content h1,
    .preview-content h2,
    .preview-content h3,
    .preview-content h4,
    .preview-content h5,
    .preview-content h6 {
      font-family: var(--wa-font-family-heading, inherit);
      font-weight: var(--wa-font-weight-bold, 600);
      margin-top: var(--wa-space-l, 1.5rem);
      margin-bottom: var(--wa-space-m, 1rem);
      color: var(--wa-color-text-normal);
    }

    .preview-content h1 { font-size: 2rem; }
    .preview-content h2 { font-size: 1.5rem; }
    .preview-content h3 { font-size: 1.25rem; }
    .preview-content h4 { font-size: 1.125rem; }
    .preview-content h5 { font-size: 1rem; }
    .preview-content h6 { font-size: 0.875rem; }

    .preview-content p {
      margin: var(--wa-space-m, 1rem) 0;
      color: var(--wa-color-text-normal);
    }

    .preview-content code:not(.shiki code) {
      font-family: var(--wa-font-family-code, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
      background: var(--wa-color-surface-raised, #f5f5f5);
      padding: 0.2em 0.4em;
      border-radius: var(--wa-border-radius-s, 3px);
      font-size: 0.9em;
    }

    .preview-content pre:not(.shiki) {
      background: var(--wa-color-surface-raised, #f5f5f5);
      border: 1px solid var(--wa-color-border-normal, #e0e0e0);
      border-radius: var(--wa-border-radius-m, 6px);
      padding: var(--wa-space-m, 1rem);
      overflow-x: auto;
      font-family: var(--wa-font-family-code, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .error-message {
      color: var(--wa-color-danger-500, #ef4444);
      font-weight: var(--wa-font-weight-medium, 500);
      font-size: 0.875rem;
    }

    .loading-message {
      color: var(--wa-color-primary-500, #3b82f6);
      font-weight: var(--wa-font-weight-medium, 500);
      font-size: 0.875rem;
    }

    .preview-content .loading-message {
      font-style: italic;
      color: var(--wa-color-text-muted, #6b7280);
    }

    .preview-content pre:not(.shiki) code {
      background: none;
      padding: 0;
      border-radius: 0;
    }

    /* Shiki syntax highlighting support */
    .preview-content .shiki {
      background-color: var(--shiki-light-bg) !important;
      border: 1px solid var(--wa-color-border-normal, #e0e0e0);
      border-radius: var(--wa-border-radius-m, 6px);
      padding: var(--wa-space-m, 1rem);
      overflow-x: auto;
      font-family: var(--wa-font-family-code, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
      font-size: 0.875rem;
      line-height: 1.4;
      margin: var(--wa-space-m, 1rem) 0;
    }

    .preview-content .shiki code {
      background: transparent !important;
      padding: 0 !important;
      border-radius: 0 !important;
      font-family: inherit !important;
      font-size: inherit !important;
      line-height: inherit !important;
      border: none !important;
      color: inherit !important;
    }

    .preview-content .shiki span {
      color: var(--shiki-light) !important;
    }

    /* Dark theme support for Shiki in preview */
    @media (prefers-color-scheme: dark) {
      .preview-content .shiki {
        background-color: var(--shiki-dark-bg) !important;
        border-color: var(--wa-color-border-normal, #4a5568);
      }
      
      .preview-content .shiki span {
        color: var(--shiki-dark) !important;
      }
    }

    /* Explicit theme class support */
    :host-context(.wa-dark) .preview-content .shiki,
    :host-context(.dark) .preview-content .shiki {
      background-color: var(--shiki-dark-bg) !important;
      border-color: var(--wa-color-border-normal, #4a5568);
    }

    :host-context(.wa-dark) .preview-content .shiki span,
    :host-context(.dark) .preview-content .shiki span {
      color: var(--shiki-dark) !important;
    }

    :host-context(.wa-light) .preview-content .shiki,
    :host-context(.light) .preview-content .shiki {
      background-color: var(--shiki-light-bg) !important;
      border-color: var(--wa-color-border-normal, #e0e0e0);
    }

    :host-context(.wa-light) .preview-content .shiki span,
    :host-context(.light) .preview-content .shiki span {
      color: var(--shiki-light) !important;
    }

    .preview-content blockquote {
      border-left: 4px solid var(--wa-color-brand-fill-loud, #007acc);
      margin: var(--wa-space-m, 1rem) 0;
      padding-left: var(--wa-space-m, 1rem);
      color: var(--wa-color-text-quiet, #666);
      font-style: italic;
    }

    .preview-content ul,
    .preview-content ol {
      margin: var(--wa-space-m, 1rem) 0;
      padding-left: var(--wa-space-xl, 2rem);
    }

    .preview-content li {
      margin: var(--wa-space-s, 0.5rem) 0;
    }

    .preview-content a {
      color: var(--wa-color-text-link, #007acc);
      text-decoration: none;
    }

    .preview-content a:hover {
      text-decoration: underline;
    }

    .error-message {
      color: var(--wa-color-danger-fill-loud, #dc3545);
      font-style: italic;
      padding: var(--wa-space-m, 1rem);
    }

    @media (min-width: 768px) {
      .editor-container {
        flex-direction: row;
        gap: var(--wa-space-l, 1.5rem);
      }

      .editor-section {
        flex: 1;
      }
    }
  `;

  static properties = {
    value: { type: String },
    placeholder: { type: String },
    readonly: { type: Boolean },
    renderModulePath: { type: String, attribute: 'render-module-path' }
  };

  private _value = '';
  private _placeholder = 'Enter MyST markdown...';
  private _readonly = false;
  private _renderModulePath = '/render-myst-ast.mjs';
  private _renderedHtml = '';
  private _error: string | null = null;
  private _isLoading = false;
  private _textarea?: any;
  private _renderModule: any = null;
  private _renderModulePromise: Promise<any> | null = null;
  private _debounceTimer: number | null = null;
  private _debounceDelay = 500; // 500ms debounce delay

  // Explicit getters/setters for reactive properties
  get value() { return this._value; }
  set value(val: string) {
    const oldVal = this._value;
    this._value = val;
    this.requestUpdate('value', oldVal);
  }

  get placeholder() { return this._placeholder; }
  set placeholder(val: string) {
    const oldVal = this._placeholder;
    this._placeholder = val;
    this.requestUpdate('placeholder', oldVal);
  }

  get readonly() { return this._readonly; }
  set readonly(val: boolean) {
    const oldVal = this._readonly;
    this._readonly = val;
    this.requestUpdate('readonly', oldVal);
  }

  get renderModulePath() { return this._renderModulePath; }
  set renderModulePath(val: string) {
    const oldVal = this._renderModulePath;
    this._renderModulePath = val;
    // Reset the module cache when path changes
    this._renderModule = null;
    this._renderModulePromise = null;
    this.requestUpdate('renderModulePath', oldVal);
  }

  constructor() {
    super();
    this._debouncedUpdatePreview();
  }

  connectedCallback() {
    super.connectedCallback();
    // Set initial content from text content if value is empty
    if (!this.value && this.textContent?.trim()) {
      this.value = this.textContent.trim();
      this._debouncedUpdatePreview();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Clean up debounce timer
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
  }

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('value')) {
      this._debouncedUpdatePreview();
    }
  }

  firstUpdated() {
    this._textarea = this.shadowRoot?.querySelector('wa-textarea') || undefined;
  }

  private async _loadRenderModule() {
    if (this._renderModule) {
      return this._renderModule;
    }

    if (this._renderModulePromise) {
      return this._renderModulePromise;
    }

    // this._renderModulePromise = import(this._renderModulePath)
    this._renderModulePromise = import("@awesome-myst/myst-awesome/lib/render-myst-ast.ts")
      .then(module => {
        this._renderModule = module;
        return module;
      })
      .catch(error => {
        console.error('Failed to load render module:', error);
        // Fallback to basic rendering
        this._renderModule = {
          renderMystAst: async (root: any) => {
            return '<p><em>Render module failed to load. Basic preview unavailable.</em></p>';
          },
          mystParseAndRender: async (content: string) => {
            return '<p><em>Render module failed to load. Basic preview unavailable.</em></p>';
          }
        };
        return this._renderModule;
      });

    return this._renderModulePromise;
  }

  private _debouncedUpdatePreview() {
    // Clear existing timer
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    // Set new timer
    this._debounceTimer = window.setTimeout(() => {
      this._updatePreview();
      this._debounceTimer = null;
    }, this._debounceDelay);
  }

  private async _updatePreview() {
    if (!this.value.trim()) {
      this._renderedHtml = '<p><em>Enter some MyST markdown to see the preview...</em></p>';
      this._error = null;
      this._isLoading = false;
      this.requestUpdate();
      return;
    }

    try {
      // Set loading state
      this._isLoading = true;
      this._error = null;
      this.requestUpdate();

      // Load the render module dynamically
      const renderModule = await this._loadRenderModule();
      
      // Render to HTML using the dynamically loaded render function (now async)
      this._renderedHtml = await renderModule.mystParseAndRender(this.value);
      this._isLoading = false;
      this._error = null;
    } catch (error) {
      console.error('MyST parsing error:', error);
      this._error = error instanceof Error ? error.message : 'Unknown parsing error';
      this._renderedHtml = '<p><em>Error parsing MyST content</em></p>';
      this._isLoading = false;
    }
    this.requestUpdate();
  }

  private _handleInput(event: Event) {
    const target = event.target as any;
    const newValue = target.value || '';
    
    // Only update if the value actually changed
    if (newValue !== this.value) {
      this.value = newValue;
      
      // Dispatch change event
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));

      // Dispatch input event
      this.dispatchEvent(new CustomEvent('input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    }
  }

  render() {
    return html`
      <div class="editor-container">
        <!-- MyST Markdown Input -->
        <div class="editor-section">
          <wa-textarea
            .value=${this.value}
            .placeholder=${this.placeholder}
            .readonly=${this.readonly}
            label="MyST Markdown"
            help-text="Enter MyST markdown syntax for live preview"
            resize="vertical"
            rows="12"
            @wa-input=${this._handleInput}
            @input=${this._handleInput}
            @change=${this._handleInput}
            @wa-change=${this._handleInput}
          ></wa-textarea>
        </div>

        <!-- Rendered Preview -->
        <div class="editor-section">
          <wa-card>
            <div slot="header">
              <strong>Preview</strong>
              ${this._isLoading ? html`<span class="loading-message">⏳ Rendering...</span>` : ''}
              ${this._error ? html`<span class="error-message">⚠ Parse Error</span>` : ''}
            </div>
            <div class="preview-content">
              ${this._error 
                ? html`<div class="error-message">${this._error}</div>`
                : this._isLoading
                  ? html`<div class="loading-message"><em>Rendering MyST content with syntax highlighting...</em></div>`
                  : html`<div .innerHTML=${this._renderedHtml}></div>`
              }
            </div>
          </wa-card>
        </div>
      </div>
    `;
  }

  /**
   * Focus the textarea
   */
  focus() {
    this._textarea?.focus();
  }

  /**
   * Set the editor content
   * @param content - The MyST markdown content to set
   */
  setValue(content: string) {
    this.value = content;
    this.requestUpdate();
  }

  /**
   * Get the current editor content
   * @returns The current MyST markdown content
   */
  getValue() {
    return this.value;
  }

  /**
   * Set the render module path
   * @param path - Path to the render module (relative, absolute, or external URL)
   */
  setRenderModulePath(path: string) {
    this.renderModulePath = path;
  }

  /**
   * Get the current render module path
   * @returns The current render module path
   */
  getRenderModulePath() {
    return this.renderModulePath;
  }
}

// Register the custom element
customElements.define('wa-myst-editor', WaMystEditor);

declare global {
  interface HTMLElementTagNameMap {
    'wa-myst-editor': WaMystEditor;
  }
}