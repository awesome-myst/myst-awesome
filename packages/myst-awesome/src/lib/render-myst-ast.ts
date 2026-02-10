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
  Superscript,
  Subscript,
  FootnoteReference,
  FootnoteDefinition,
  Caption,
  Container,
  Legend,
  Admonition,
  AdmonitionTitle,
} from "@awesome-myst/myst-zod";

import { basicTransformations } from "myst-transforms";
import { mystParse } from "myst-parser";
import { highlightCode, highlightInlineCode } from "./shiki-highlighter.js";
import { renderInlineMath, renderDisplayMath } from "./katex-renderer.js";
import { escapeHtml } from "./html-escape.js";

/** Function to render MyST content as HTML (simplified) */
export async function renderMystAst(root: Root): Promise<string> {
  if (!root || !root.children) {
    return "<p>No content available</p>";
  }

  // Counter for generating unique IDs
  let abbreviationCounter = 0;
  let footnoteCounter = 0;
  const footnoteNumberMap = new Map<string, number>(); // Maps identifier → display number

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
      case "comment": {
        const commentNode = node as any;
        const commentValue = commentNode.value ?? commentNode.raw ?? "";
        console.log("MyST comment:", commentValue || commentNode);
        return "";
      }
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
        const keyboardNode = node as any;
        const children = await Promise.all(
          keyboardNode.children?.map(renderNode) || []
        );
        const content = children.join("");
        // Style keyboard input using Web Awesome design tokens, matching SearchDialog.astro styling
        return `<kbd style="font-family: var(--wa-font-family-code); padding: var(--wa-space-3xs) var(--wa-space-2xs); border: 1px solid var(--wa-color-neutral-border-normal); border-radius: var(--wa-border-radius-s); background: var(--wa-color-neutral-fill-quiet);">${content}</kbd>`;
      }
      case "footnoteDefinition": {
        const fnDef = node as FootnoteDefinition;
        const identifier = fnDef.identifier || fnDef.label || "";
        // Determine display number: use label if numeric, otherwise auto-number
        let displayNum: number;
        const numericLabel = parseInt(fnDef.label || "", 10);
        if (!isNaN(numericLabel)) {
          displayNum = numericLabel;
        } else {
          if (!footnoteNumberMap.has(identifier)) {
            footnoteNumberMap.set(identifier, ++footnoteCounter);
          }
          displayNum = footnoteNumberMap.get(identifier)!;
        }
        const children = await Promise.all(fnDef.children?.map(renderNode) || []);
        const content = children.join("").replace(/^<p>|<\/p>$/g, "");
        const defId = `fndef-${identifier}`;
        const refId = `fnref-${identifier}`;
        return `<div class="footnote-definition" id="${defId}" data-num="${displayNum}"><span class="footnote-number">[${displayNum}]</span> ${content} <a href="#${refId}" class="footnote-backref" style="text-decoration: none;">↩</a></div>`;
      }
      case "footnoteReference": {
        const fnRef = node as FootnoteReference;
        const identifier = fnRef.identifier || fnRef.label || "";
        // Determine display number: use label if numeric, otherwise auto-number
        let displayNum: number;
        const numericLabel = parseInt(fnRef.label || "", 10);
        if (!isNaN(numericLabel)) {
          displayNum = numericLabel;
        } else {
          if (!footnoteNumberMap.has(identifier)) {
            footnoteNumberMap.set(identifier, ++footnoteCounter);
          }
          displayNum = footnoteNumberMap.get(identifier)!;
        }
        const refId = `fnref-${identifier}`;
        const defId = `fndef-${identifier}`;
        return `<sup id="${refId}"><a href="#${defId}" class="footnote-ref" style="text-decoration: none;">[${displayNum}]</a></sup>`;
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
      case "image": {
        const imageNode = node as any;
        const url = escapeHtml(imageNode.url || "");
        const alt = escapeHtml(imageNode.alt || "");
        const title = imageNode.title;
        const width = imageNode.width;
        const height = imageNode.height;
        const align = imageNode.align;

        // Build class list (matching myst-to-html pattern)
        // Alignment is now handled by CSS classes instead of inline styles
        const classes: string[] = [];
        if (align) {
          classes.push(`align-${align}`);
        }
        if (imageNode.class) {
          classes.push(imageNode.class);
        }

        // Build style for dimensions only (alignment handled by CSS classes)
        const styles: string[] = [];
        if (width) {
          styles.push(`width: ${escapeHtml(String(width))}`);
        }
        if (height) {
          styles.push(`height: ${escapeHtml(String(height))}`);
        }

        const classAttr =
          classes.length > 0 ? ` class="${classes.join(" ")}"` : "";
        const styleAttr =
          styles.length > 0 ? ` style="${styles.join("; ")}"` : "";
        const titleAttr = title
          ? ` title="${escapeHtml(String(title))}"`
          : "";

        return `<img src="${url}" alt="${alt}"${titleAttr}${classAttr}${styleAttr} />`;
      }
      case "block": {
        // Block nodes are container nodes that just pass through their children
        const children = await Promise.all(
          (node as Parent).children?.map(renderNode) || []
        );
        return children.join("");
      }
      case "container": {
        // Container wraps figures and tables with captions
        // Following myst-to-html reference implementation
        const containerNode = node as Container;
        const children = await Promise.all(
          containerNode.children?.map(renderNode) || []
        );

        // Build class list: "numbered" when enumerated !== false, plus custom class
        const classes: string[] = [];
        if (containerNode.enumerated !== false) {
          classes.push("numbered");
        }
        if (containerNode.class) {
          classes.push(containerNode.class);
        }

        // ID from identifier or label
        const id =
          (containerNode as any).identifier ||
          (containerNode as any).label ||
          undefined;
        const idAttr = id ? ` id="${escapeHtml(id)}"` : "";
        const classAttr =
          classes.length > 0 ? ` class="${classes.join(" ")}"` : "";

        return `<figure${idAttr}${classAttr}>${children.join("")}</figure>`;
      }
      case "caption": {
        // Caption renders as figcaption element
        const captionNode = node as Caption;
        const children = await Promise.all(
          captionNode.children?.map(renderNode) || []
        );
        return `<figcaption>${children.join("")}</figcaption>`;
      }
      case "captionNumber": {
        // CaptionNumber renders the "Figure 1" / "Table 1" prefix
        // Type is from myst-spec-ext, use generic type
        const captionNumNode = node as any;
        const kind = captionNumNode.kind || "figure";
        const capitalizedKind = kind.charAt(0).toUpperCase() + kind.slice(1);
        const value =
          captionNumNode.enumerator || captionNumNode.value || "";
        return `<span class="caption-number">${escapeHtml(capitalizedKind)} ${escapeHtml(String(value))}</span>`;
      }
      case "legend": {
        // Legend provides additional descriptive text below caption
        const legendNode = node as Legend;
        const children = await Promise.all(
          legendNode.children?.map(renderNode) || []
        );
        return `<div class="legend">${children.join("")}</div>`;
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
      case "html": {
        const htmlNode = node as any;
        const htmlContent = htmlNode.value || "";
        return htmlContent
      }
      case "admonition": {
        const admonNode = node as Admonition;
        const kind = admonNode.kind || "note";
        const classStr = (admonNode.class || "");
        const classes = classStr.split(/\s+/).filter(Boolean);
        
        // Parse options from node
        const isDropdown = classes.includes("dropdown");
        const isSimple = classes.includes("simple");
        const showIcon = !((admonNode as any).icon === false);
        const isOpen = (admonNode as any).open === true;
        
        // Variant and icon mapping
        const variantMap: Record<string, string> = {
          note: "brand",
          info: "brand",
          important: "brand",
          tip: "success",
          hint: "success",
          seealso: "success",
          attention: "warning",
          caution: "warning",
          warning: "warning",
          danger: "danger",
          error: "danger",
        };
        
        const iconMap: Record<string, { name: string; variant: string }> = {
          note: { name: "circle-info", variant: "regular" },
          info: { name: "circle-info", variant: "regular" },
          important: { name: "circle-exclamation", variant: "solid" },
          tip: { name: "lightbulb", variant: "regular" },
          hint: { name: "lightbulb", variant: "regular" },
          seealso: { name: "arrow-up-right-from-square", variant: "regular" },
          attention: { name: "triangle-exclamation", variant: "solid" },
          caution: { name: "hand", variant: "regular" },
          warning: { name: "triangle-exclamation", variant: "solid" },
          danger: { name: "circle-exclamation", variant: "solid" },
          error: { name: "xmark-circle", variant: "solid" },
        };
        
        const variant = variantMap[kind] || "brand";
        const icon = iconMap[kind] || iconMap.note;
        
        // Separate title from body
        const titleNode = admonNode.children?.find(c => c.type === "admonitionTitle");
        const bodyChildren = admonNode.children?.filter(c => c.type !== "admonitionTitle") || [];
        
        // Render title
        let titleHtml = "";
        if (titleNode) {
          const titleChildren = await Promise.all(
            (titleNode as AdmonitionTitle).children?.map(renderNode) || []
          );
          titleHtml = titleChildren.join("");
        } else {
          // Default title formatting
          titleHtml = kind === "seealso" ? "See Also" : 
                      kind.charAt(0).toUpperCase() + kind.slice(1);
        }
        
        // Render body
        const bodyHtml = await Promise.all(bodyChildren.map(renderNode));
        const contentHtml = bodyHtml.join("");
        
        // Build CSS classes
        const cssClasses = `admonition admonition-${kind} admonition-${variant}`;
        
        // Build icon HTML
        const iconHtml = showIcon 
          ? `<wa-icon ${isDropdown ? '' : 'slot="icon" '}name="${icon.name}" variant="${icon.variant}"></wa-icon>`
          : '';
        
        // Render as dropdown or callout
        if (isDropdown) {
          return `<wa-details${isOpen ? ' open' : ''} class="${cssClasses}" data-admonition-kind="${kind}">
      <span slot="summary">
        ${iconHtml ? iconHtml + ' ' : ''}<strong>${titleHtml}</strong>
      </span>
      <div class="admonition-content">${contentHtml}</div>
    </wa-details>`;
        } else {
          const appearance = isSimple ? ` appearance="plain"` : '';
          return `<wa-callout variant="${variant}"${appearance} class="${cssClasses}" data-admonition-kind="${kind}">
      ${iconHtml}
      <strong>${titleHtml}</strong>
      <div class="admonition-content">${contentHtml}</div>
    </wa-callout>`;
        }
      }
      case "admonitionTitle": {
        // AdmonitionTitle is handled by the parent admonition case
        // This case should not be hit directly during normal rendering
        const titleNode = node as AdmonitionTitle;
        const children = await Promise.all(
          titleNode.children?.map(renderNode) || []
        );
        return children.join("");
      }
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

  // Separate footnote definitions from main content
  const footnotes: string[] = [];
  const content: string[] = [];
  for (const child of renderedChildren) {
    if (child.includes('class="footnote-definition"')) {
      footnotes.push(child);
    } else {
      content.push(child);
    }
  }

  // Build final output with footnotes at bottom
  let result = content.join("\n");
  
  if (footnotes.length > 0) {
    // Sort footnotes by their display number
    footnotes.sort((a, b) => {
      const numA = parseInt(a.match(/data-num="(\d+)"/)?.[1] || "0", 10);
      const numB = parseInt(b.match(/data-num="(\d+)"/)?.[1] || "0", 10);
      return numA - numB;
    });
    result += `\n<hr style="margin-top: var(--wa-space-xl);" />\n<section class="footnotes" style="font-size: 0.9em;">\n${footnotes.join("\n")}\n</section>`;
  }
  return result;
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
