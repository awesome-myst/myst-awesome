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
import { basicTransformations } from "myst-transforms";
import { mystParse } from "myst-parser";
import { highlightCode, highlightInlineCode } from "./shiki-highlighter.js";

/** Function to render MyST content as HTML (simplified) */
export async function renderMystAst(root: Root): Promise<string> {
  if (!root || !root.children) {
    return "<p>No content available</p>";
  }

  const renderNode = async (node: Node): Promise<string> => {
    switch (node.type) {
      case "paragraph": {
        const children = await Promise.all(
          (node as Paragraph).children?.map(renderNode) || []
        );
        return `<p>${children.join("")}</p>`;
      }
      case "heading": {
        const headingNode = node as Heading;
        const level = Math.min(6, Math.max(1, headingNode.depth || 2));
        const children = await Promise.all(
          headingNode.children?.map(renderNode) || []
        );
        const text = children.join("");
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        return `<h${level} id="${id}">${text}</h${level}>`;
      }
      case "text":
        return (node as any).value || "";
      case "emphasis": {
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<em>${children.join("")}</em>`;
      }
      case "strong": {
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<strong>${children.join("")}</strong>`;
      }
      case "inlineCode": {
        const codeNode = node as any;
        const code = codeNode.value || "";
        const lang = codeNode.lang; // MyST might provide language for inline code
        return await highlightInlineCode(code, lang);
      }
      case "code": {
        const codeNode = node as any;
        const code = codeNode.value || "";
        const lang = codeNode.lang || codeNode.language || "text";
        const highlighted = await highlightCode(code, lang);
        return highlighted;
      }
      case "list": {
        const listNode = node as any;
        const tag = listNode.ordered ? "ol" : "ul";
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<${tag}>${children.join("")}</${tag}>`;
      }
      case "listItem": {
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<li>${children.join("")}</li>`;
      }
      case "blockquote": {
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<blockquote>${children.join("")}</blockquote>`;
      }
      case "link": {
        const linkNode = node as any;
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return `<a href="${linkNode.url || "#"}">${children.join("")}</a>`;
      }
      case "block": {
        // Block nodes are container nodes that just pass through their children
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return children.join("");
      }
      case "inlineMath": {
        const mathNode = node as any;
        const math = mathNode.value || "";
        return `<span class="math inline">$${math}$</span>`;
      }
      case "myst":
        return `<wa-myst-editor>${(node as Myst).value}</wa-myst-editor>`
      default:
        console.warn(`Unknown node type: ${(node as Parent).type}`);
        // console.log('Unknown node structure:', JSON.stringify(node, null, 2));
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return children.join("");
    }
  };

  const renderedChildren = await Promise.all(
    root.children?.map(renderNode) || []
  );
  return renderedChildren.join("\n");
}

/**
 * Parse MyST markdown and render it to HTML in one function
 * @param mystContent - Raw MyST markdown string
 * @returns Promise<string> - Rendered HTML string
 */
export async function mystParseAndRender(mystContent: string): Promise<string> {
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
      basicTransformations(tree as Root, file as any);
    } catch (error) {
      console.warn('Failed to apply basic transformations:', error);
    }

    // Render the parsed tree to HTML
    return await renderMystAst(tree as Root);
  } catch (error) {
    console.error('MyST parse and render error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return `<p><em>Error parsing MyST content: ${errorMessage}</em></p>`;
  }
}
