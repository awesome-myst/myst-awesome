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
      case "admonition": {
        const admonitionNode = node as any;
        const kind = (admonitionNode.kind || admonitionNode.name || "").toLowerCase();
        const classList = Array.isArray(admonitionNode.class)
          ? admonitionNode.class
          : admonitionNode.class
          ? [admonitionNode.class]
          : [];
        const isSimple = classList.includes("simple");
        const isDropdown = classList.includes("dropdown");
        const iconEnabled = admonitionNode.icon !== false;

        const renderAdmonitionTitle = async (): Promise<string> => {
          if (admonitionNode.title) {
            return String(admonitionNode.title);
          }

          const children = Array.isArray(admonitionNode.children)
            ? admonitionNode.children
            : [];
          const titleNode = children.find(
            (child: any) => child?.type === "admonitionTitle"
          );
          if (titleNode) {
            const titleChildren = await Promise.all(
              (titleNode.children || []).map(renderNode)
            );
            return titleChildren.join("");
          }

          const firstNode = children[0];
          if (firstNode?.type === "heading") {
            const headingChildren = await Promise.all(
              (firstNode.children || []).map(renderNode)
            );
            return headingChildren.join("");
          }

          if (firstNode?.type === "paragraph") {
            const paragraphChildren = Array.isArray(firstNode.children)
              ? firstNode.children
              : [];
            if (
              paragraphChildren.length === 1 &&
              paragraphChildren[0]?.type === "strong"
            ) {
              const strongChildren = await Promise.all(
                (paragraphChildren[0].children || []).map(renderNode)
              );
              return strongChildren.join("");
            }
          }

          if (kind) {
            return kind.replace(/(^|\s)([a-z])/g, (_, space, letter) => {
              return `${space}${letter.toUpperCase()}`;
            });
          }

          return "Note";
        };

        const renderIcon = (): string => {
          if (!iconEnabled || isSimple) {
            return "";
          }

          const iconMap: Record<string, string> = {
            note: "circle-info",
            info: "circle-info",
            important: "circle-info",
            seealso: "circle-info",
            tip: "lightbulb",
            hint: "lightbulb",
            success: "circle-check",
            warning: "triangle-exclamation",
            caution: "triangle-exclamation",
            attention: "triangle-exclamation",
            danger: "circle-exclamation",
            error: "circle-exclamation",
          };

          const iconName = iconMap[kind] || "circle-info";
          return `<wa-icon slot="icon" name="${iconName}" variant="regular"></wa-icon>`;
        };

        const renderBody = async (): Promise<string> => {
          const children = Array.isArray(admonitionNode.children)
            ? admonitionNode.children
            : [];
          const bodyNodes = children.filter(
            (child: any) => child?.type !== "admonitionTitle"
          );
          const body = await Promise.all(bodyNodes.map(renderNode));
          return body.join("");
        };

        const titleHtml = await renderAdmonitionTitle();
        const bodyHtml = await renderBody();
        const iconHtml = renderIcon();

        const variantMap: Record<string, string> = {
          note: "brand",
          info: "brand",
          important: "brand",
          seealso: "brand",
          tip: "success",
          hint: "success",
          success: "success",
          warning: "warning",
          caution: "warning",
          attention: "warning",
          danger: "danger",
          error: "danger",
        };
        const variant = variantMap[kind] || "neutral";

        const titleBlock = titleHtml
          ? `<div class="admonition-title"><strong>${titleHtml}</strong></div>`
          : "";

        if (isDropdown) {
          const openAttr = admonitionNode.open ? " open" : "";
          return `<details class="admonition-dropdown"${openAttr}><summary>${titleBlock || "<strong>Details</strong>"}</summary><wa-callout variant="${variant}">${iconHtml}${bodyHtml}</wa-callout></details>`;
        }

        return `<wa-callout variant="${variant}">${iconHtml}${titleBlock}${bodyHtml}</wa-callout>`;
      }
      case "admonitionTitle": {
        const titleNode = node as any;
        const children = await Promise.all(
          (titleNode.children || []).map(renderNode)
        );
        return `<span class="admonition-title">${children.join("")}</span>`;
      }
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
