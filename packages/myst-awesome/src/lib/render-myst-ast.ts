// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import type {
  Root,
  Parent,
  Node,
  Heading,
  Paragraph,
  Myst,
} from "@awesome-myst/myst-zod";
import { basicTransformations, type VFile } from "myst-transforms";
import { mystParse } from "myst-parser";

/** Function to render MyST content as HTML (simplified) */
export function renderMystAst(root: Root): string {
  if (!root || !root.children) {
    return "<p>No content available</p>";
  }

  const renderNode = (node: Node): string => {
    switch (node.type) {
      case "paragraph":
        return `<p>${
          (node as Paragraph).children?.map(renderNode).join("") || ""
        }</p>`;
      case "heading": {
        const headingNode = node as Heading;
        const level = Math.min(6, Math.max(1, headingNode.depth || 2));
        const text = headingNode.children?.map(renderNode).join("") || "";
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return `<h${level} id="${id}">${text}</h${level}>`;
      }
      case "text":
        return (node as any).value || "";
      case "emphasis":
        return `<em>${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</em>`;
      case "strong":
        return `<strong>${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</strong>`;
      case "inlineCode":
        return `<code>${(node as any).value || ""}</code>`;
      case "code": {
        const codeNode = node as any;
        return `<pre><code class="language-${codeNode.lang || ""}">${
          codeNode.value || ""
        }</code></pre>`;
      }
      case "list": {
        const listNode = node as any;
        const tag = listNode.ordered ? "ol" : "ul";
        return `<${tag}>${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</${tag}>`;
      }
      case "listItem":
        return `<li>${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</li>`;
      case "blockquote":
        return `<blockquote>${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</blockquote>`;
      case "link": {
        const linkNode = node as any;
        return `<a href="${linkNode.url || "#"}">${
          (node as Parent).children?.map(renderNode).join("") || ""
        }</a>`;
      }
      case "myst":
        return `<wa-myst-editor>${(node as Myst).value}</wa-myst-editor>`
      default:
        console.warn(`Unknown node type: ${(node as Parent).type}`);
        return (node as Parent).children?.map(renderNode).join("") || "";
    }
  };

  return root.children?.map(renderNode).join("\n") || "";
}

/**
 * Parse MyST markdown and render it to HTML in one function
 * @param mystContent - Raw MyST markdown string
 * @returns Rendered HTML string
 */
export function mystParseAndRender(mystContent: string): string {
  try {
    // Parse the MyST content
    const tree = mystParse(mystContent);
    
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
      basicTransformations(tree as Root, file as VFile);
    } catch (error) {
      console.warn('Failed to apply basic transformations:', error);
    }

    // Render the parsed tree to HTML
    return renderMystAst(tree as Root);
  } catch (error) {
    console.error('MyST parse and render error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `<p><em>Error parsing MyST content: ${errorMessage}</em></p>`;
  }
}
