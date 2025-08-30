// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import { LitElement, html, css, type PropertyValues } from 'lit';
import { mystParse } from 'myst-parser';
import { renderMystAst } from './render-myst-ast.js';
import type { Root } from '@awesome-myst/myst-zod';

// Import Web Awesome components
import '@awesome.me/webawesome/dist/components/textarea/textarea.js';
import '@awesome.me/webawesome/dist/components/card/card.js';

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

    .preview-content code {
      font-family: var(--wa-font-family-code, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
      background: var(--wa-color-surface-raised, #f5f5f5);
      padding: 0.2em 0.4em;
      border-radius: var(--wa-border-radius-s, 3px);
      font-size: 0.9em;
    }

    .preview-content pre {
      background: var(--wa-color-surface-raised, #f5f5f5);
      border: 1px solid var(--wa-color-surface-border, #ddd);
      border-radius: var(--wa-border-radius-m, 6px);
      padding: var(--wa-space-m, 1rem);
      overflow-x: auto;
      margin: var(--wa-space-m, 1rem) 0;
    }

    .preview-content pre code {
      background: none;
      padding: 0;
      border-radius: 0;
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
    readonly: { type: Boolean }
  };

  private _value = '';
  private _placeholder = 'Enter MyST markdown...';
  private _readonly = false;
  private _renderedHtml = '';
  private _error: string | null = null;
  private _textarea?: HTMLElement;

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

  constructor() {
    super();
    this._updatePreview();
  }

  connectedCallback() {
    super.connectedCallback();
    // Set initial content from text content if value is empty
    if (!this.value && this.textContent?.trim()) {
      this.value = this.textContent.trim();
      this._updatePreview();
    }
  }

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('value')) {
      this._updatePreview();
    }
  }

  firstUpdated() {
    this._textarea = this.shadowRoot?.querySelector('wa-textarea') || undefined;
  }

  private async _updatePreview() {
    if (!this.value.trim()) {
      this._renderedHtml = '<p><em>Enter some MyST markdown to see the preview...</em></p>';
      this._error = null;
      this.requestUpdate();
      return;
    }

    try {
      // Parse MyST markdown using myst-parser
      const tree = mystParse(this.value);
      
      // Apply basic transformations (simplified for now)
      const transformedTree = await this._applyTransformations(tree);
      
      // Render to HTML using our render function
      this._renderedHtml = renderMystAst(transformedTree as Root);
      this._error = null;
    } catch (error) {
      console.error('MyST parsing error:', error);
      this._error = error instanceof Error ? error.message : 'Unknown parsing error';
      this._renderedHtml = '<p><em>Error parsing MyST content</em></p>';
    }
    this.requestUpdate();
  }

  private async _applyTransformations(tree: any): Promise<any> {
    try {
      // For now, return the tree as-is since basic transformations require more setup
      // In a full implementation, you would set up the unified processor with plugins
      return tree;
    } catch (error) {
      console.warn('Error applying transformations:', error);
      // Return original tree if transformations fail
      return tree;
    }
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
              ${this._error ? html`<span class="error-message">⚠ Parse Error</span>` : ''}
            </div>
            <div class="preview-content">
              ${this._error 
                ? html`<div class="error-message">${this._error}</div>`
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
   * Get the current MyST AST
   */
  getAst() {
    try {
      return mystParse(this.value);
    } catch (error) {
      console.error('Error parsing MyST:', error);
      return null;
    }
  }

  /**
   * Set the editor content
   */
  setValue(content: string) {
    this.value = content;
    this.requestUpdate();
  }

  /**
   * Get the current editor content
   */
  getValue() {
    return this.value;
  }
}

// Register the custom element
customElements.define('wa-myst-editor', WaMystEditor);

declare global {
  interface HTMLElementTagNameMap {
    'wa-myst-editor': WaMystEditor;
  }
}