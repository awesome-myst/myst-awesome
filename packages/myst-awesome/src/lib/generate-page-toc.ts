// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

import type { Page, Node, Heading, Parent } from "@awesome-myst/myst-zod";

export type TocItem = {
  level: number;
  title: string;
  href: string;
  id: string;
};

/** Extract page table of contents from MyST content */
export function generatePageToc(page: Page): TocItem[] {
  const tocItems: TocItem[] = [];

  if (page.mdast) {
    // Simple extraction of headings from the MyST AST
    const extractHeadings = (node: Node): void => {
      if (
        node.type === "heading" &&
        (node as Heading).depth &&
        (node as Heading).depth <= 4
      ) {
        const text =
          (node as Heading).children
            ?.map((child: any) => child.value || "")
            .join("") || "";
        if (text) {
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
          tocItems.push({
            level: (node as Heading).depth,
            title: text,
            href: `#${id}`,
            id: id,
          });
        }
      }
      if ("children" in node && Array.isArray((node as Parent).children)) {
        (node as Parent).children.forEach(extractHeadings);
      }
    };

    if (page.mdast.children) {
      page.mdast.children.forEach(extractHeadings);
    }
  }

  return tocItems;
}
