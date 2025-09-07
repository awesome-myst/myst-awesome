// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

// This is the bundled version for dynamic loading
import { basicTransformations } from "myst-transforms";

/** Function to render MyST content as HTML (simplified) */
export function renderMystAst(root) {
  if (!root || !root.children) {
    return "<p>No content available</p>";
  }

  // Create a minimal VFile-like object for the transformations
  const file = { 
    path: 'rendered.md',
    messages: [],
    data: {},
    history: [],
    cwd: '/tmp',
    value: '',
    map: undefined,
    fail: () => {},
    info: () => {},
    message: () => {},
    warn: () => {},
  };

  // Apply basic MyST transformations to the root AST
  try {
    basicTransformations(root, file);
  } catch (error) {
    console.warn('Failed to apply basic transformations:', error);
  }

  const renderNode = (node) => {
    switch (node.type) {
      case "paragraph":
        return `<p>${
          node.children?.map(renderNode).join("") || ""
        }</p>`;
      case "heading": {
        const level = Math.min(6, Math.max(1, node.depth || 2));
        const text = node.children?.map(renderNode).join("") || "";
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return `<h${level} id="${id}">${text}</h${level}>`;
      }
      case "text":
        return node.value || "";
      case "emphasis":
        return `<em>${
          node.children?.map(renderNode).join("") || ""
        }</em>`;
      case "strong":
        return `<strong>${
          node.children?.map(renderNode).join("") || ""
        }</strong>`;
      case "inlineCode":
        return `<code>${node.value || ""}</code>`;
      case "code": {
        return `<pre><code class="language-${node.lang || ""}">${
          node.value || ""
        }</code></pre>`;
      }
      case "list": {
        const tag = node.ordered ? "ol" : "ul";
        return `<${tag}>${
          node.children?.map(renderNode).join("") || ""
        }</${tag}>`;
      }
      case "listItem":
        return `<li>${
          node.children?.map(renderNode).join("") || ""
        }</li>`;
      case "blockquote":
        return `<blockquote>${
          node.children?.map(renderNode).join("") || ""
        }</blockquote>`;
      case "link": {
        return `<a href="${node.url || "#"}">${
          node.children?.map(renderNode).join("") || ""
        }</a>`;
      }
      case "myst":
        return `<wa-myst-editor>${node.value}</wa-myst-editor>`
      default:
        console.warn(`Unknown node type: ${node.type}`);
        return node.children?.map(renderNode).join("") || "";
    }
  };

  return root.children?.map(renderNode).join("\n") || "";
}
