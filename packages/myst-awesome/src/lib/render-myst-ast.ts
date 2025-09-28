// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import type {
  Root,
  Parent,
  Node,
  Heading,
  Paragraph,
  Myst,
  DefinitionList,
  DefinitionTerm,
  DefinitionDescription,
  Underline,
  Delete,
  Smallcaps,
  Break,
  Abbreviation,
  Math as MystMath,
  InlineMath,
  Keyboard,
  Superscript,
  Subscript,
  FootnoteDefinition,
  FootnoteReference,
} from "@awesome-myst/myst-zod";

import { basicTransformations } from "myst-transforms";
import { mystParse } from "myst-parser";
import { highlightCode, highlightInlineCode } from "./shiki-highlighter.js";
import { renderInlineMath, renderDisplayMath } from "./katex-renderer.js";

/** Function to render MyST content as HTML (simplified) */
export async function renderMystAst(root: Root): Promise<string> {
  if (!root || !root.children) {
    return "<p>No content available</p>";
  }

  // Counter for generating unique IDs
  let abbreviationCounter = 0;

  // Footnote numbering system
  const footnoteMap = new Map<string, number>(); // identifier -> display number
  const footnoteReferences: string[] = []; // order of appearance
  const footnoteDefinitions = new Set<string>(); // available definitions

  // First pass: collect all footnotes to determine numbering
  const collectFootnotes = (node: Node) => {
    if (node.type === "footnoteReference") {
      const refNode = node as FootnoteReference;
      const identifier = refNode.identifier || refNode.label || "1";
      if (!footnoteReferences.includes(identifier)) {
        footnoteReferences.push(identifier);
      }
    } else if (node.type === "footnoteDefinition") {
      const defNode = node as FootnoteDefinition;
      const identifier = defNode.identifier || defNode.label || "1";
      footnoteDefinitions.add(identifier);
    }

    // Recursively collect from children
    if ((node as Parent).children) {
      for (const child of (node as Parent).children) {
        collectFootnotes(child);
      }
    }
  };

  // Collect all footnotes
  for (const child of root.children) {
    collectFootnotes(child);
  }

  // Assign display numbers: manually numbered footnotes keep their numbers,
  // non-numeric footnotes get auto-numbered in order of appearance
  let autoNumber = 1;
  const usedNumbers = new Set<number>();

  // First, identify manually numbered footnotes
  for (const identifier of footnoteReferences) {
    if (/^\d+$/.test(identifier)) {
      const num = parseInt(identifier, 10);
      footnoteMap.set(identifier, num);
      usedNumbers.add(num);
    }
  }

  // Then assign auto-numbers to non-numeric footnotes
  for (const identifier of footnoteReferences) {
    if (!/^\d+$/.test(identifier) && footnoteDefinitions.has(identifier)) {
      // Find next available auto-number
      while (usedNumbers.has(autoNumber)) {
        autoNumber++;
      }
      footnoteMap.set(identifier, autoNumber);
      usedNumbers.add(autoNumber);
      autoNumber++;
    }
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
      case "break":
        return "<br />";
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
      case "underline": {
        const children = await Promise.all(
          (node as Underline).children?.map(renderNode) || []
        );
        return `<u>${children.join("")}</u>`;
      }
      case "delete": {
        const children = await Promise.all(
          (node as Delete).children?.map(renderNode) || []
        );
        return `<del>${children.join("")}</del>`;
      }
      case "smallcaps": {
        const children = await Promise.all(
          (node as Smallcaps).children?.map(renderNode) || []
        );
        return `<span style="font-variant: small-caps;">${children.join(
          ""
        )}</span>`;
      }
      case "superscript": {
        const children = await Promise.all(
          (node as Superscript).children?.map(renderNode) || []
        );
        return `<sup>${children.join("")}</sup>`;
      }
      case "subscript": {
        const children = await Promise.all(
          (node as Subscript).children?.map(renderNode) || []
        );
        return `<sub>${children.join("")}</sub>`;
      }
      case "abbreviation": {
        const abbrevNode = node as Abbreviation;
        const children = await Promise.all(
          abbrevNode.children?.map(renderNode) || []
        );
        const content = children.join("");

        if (abbrevNode.title) {
          const uniqueId = `abbr-${++abbreviationCounter}`;
          return `<abbr id="${uniqueId}" style="text-decoration: underline dotted; cursor: help;">${content}</abbr><wa-tooltip for="${uniqueId}">${abbrevNode.title}</wa-tooltip>`;
        } else {
          // Fallback to standard abbr without tooltip if no title
          return `<abbr style="text-decoration: underline dotted;">${content}</abbr>`;
        }
      }
      case "keyboard": {
        const keyboardNode = node as Keyboard;
        const children = await Promise.all(
          keyboardNode.children?.map(renderNode) || []
        );
        const content = children.join("");
        // Style keyboard input using Web Awesome design tokens, matching SearchDialog.astro styling
        return `<kbd style="font-family: var(--wa-font-family-code); padding: var(--wa-space-3xs) var(--wa-space-2xs); border: 1px solid var(--wa-color-neutral-border-normal); border-radius: var(--wa-border-radius-s); background: var(--wa-color-neutral-fill-quiet);">${content}</kbd>`;
      }
      case "footnoteReference": {
        const refNode = node as FootnoteReference;
        const identifier = refNode.identifier || refNode.label || "1";
        const displayNumber = footnoteMap.get(identifier) || identifier;
        // Create a clickable superscript link to the footnote definition
        // Uses Web Awesome color tokens for consistent theming
        return `<a href="#footnote-${identifier}" id="footnote-ref-${identifier}" style="text-decoration: none; color: var(--wa-color-primary-600);"><sup style="font-size: 0.75em; line-height: 0; vertical-align: super;">[${displayNumber}]</sup></a>`;
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
      case "definitionList": {
        const children = await Promise.all(
          (node as DefinitionList).children?.map(renderNode) || []
        );
        return `<dl>${children.join("")}</dl>`;
      }
      case "definitionTerm": {
        const children = await Promise.all(
          (node as DefinitionTerm).children?.map(renderNode) || []
        );
        return `<dt>${children.join("")}</dt>`;
      }
      case "definitionDescription": {
        const children = await Promise.all(
          (node as DefinitionDescription).children?.map(renderNode) || []
        );
        return `<dd>${children.join("")}</dd>`;
      }
      case "footnoteDefinition": {
        const defNode = node as FootnoteDefinition;
        const identifier = defNode.identifier || defNode.label || "1";
        const displayNumber = footnoteMap.get(identifier) || identifier;
        const children = await Promise.all(
          defNode.children?.map(renderNode) || []
        );
        const content = children.join("");

        // Create footnote definition with backlink to reference
        // Uses Web Awesome spacing and color tokens for consistent styling
        return `<div id="footnote-${identifier}" style="margin-top: var(--wa-space-m); padding: var(--wa-space-s); border-left: 2px solid var(--wa-color-neutral-border-normal); background: var(--wa-color-neutral-fill-quiet); font-size: 0.9em;">
  <div style="display: flex; align-items: flex-start; gap: var(--wa-space-xs);">
    <sup style="font-size: 0.75em; line-height: 0; vertical-align: super; font-weight: bold; color: var(--wa-color-primary-600);">[${displayNumber}]</sup>
    <div style="flex: 1;">${content}</div>
    <a href="#footnote-ref-${identifier}" style="text-decoration: none; color: var(--wa-color-neutral-500); font-size: 0.8em;" title="Back to reference">↵</a>
  </div>
</div>`;
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
        const mathNode = node as InlineMath;
        const math = mathNode.value || "";
        return renderInlineMath(math);
      }
      case "math": {
        const mathNode = node as MystMath;
        const math = mathNode.value || "";
        return renderDisplayMath(math);
      }
      case "myst":
        return `<wa-myst-editor>${(node as Myst).value}</wa-myst-editor>`;
      default:
        console.warn(`Unknown node type: ${(node as Parent).type}`);
        console.log("Unknown node structure:", JSON.stringify(node, null, 2));
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
      path: "rendered.md",
      messages: [],
      data: {},
      history: [],
      cwd: "/tmp",
      value: "",
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
      console.warn("Failed to apply basic transformations:", error);
    }

    // Render the parsed tree to HTML
    return await renderMystAst(tree as Root);
  } catch (error) {
    console.error("MyST parse and render error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return `<p><em>Error parsing MyST content: ${errorMessage}</em></p>`;
  }
}
