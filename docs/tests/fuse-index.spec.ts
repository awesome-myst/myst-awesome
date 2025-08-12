import { test, expect } from "@playwright/test";

test.describe("fuse.json generation", () => {
  test("/fuse.json exists and has expected shape", async ({ request }) => {
    const res = await request.get("/fuse.json");
    expect(res.ok()).toBeTruthy();
    const data = await res.json();

    // Basic shape
    expect(Array.isArray(data)).toBeTruthy();
    expect(data.length).toBeGreaterThan(0);

    // Each item should have url and kind
    for (const item of data) {
      expect(typeof item.url).toBe("string");
      expect(typeof item.kind).toBe("string");
      if (item.identifier !== undefined) {
        expect(
          typeof item.identifier === "string" || item.identifier === undefined
        ).toBeTruthy();
      }
    }

    // There should be some page entries
    const pages = data.filter((d: any) => d.kind === "page");
    expect(pages.length).toBeGreaterThan(0);

    // Optional frontmatter checks (if present)
    for (const p of pages) {
      if (p.frontmatter !== undefined) {
        expect(typeof p.frontmatter).toBe("object");
        if (p.frontmatter.title !== undefined) {
          expect(typeof p.frontmatter.title).toBe("string");
        }
        if (p.frontmatter.description !== undefined) {
          expect(typeof p.frontmatter.description).toBe("string");
        }
        if (p.frontmatter.keywords !== undefined) {
          expect(Array.isArray(p.frontmatter.keywords)).toBeTruthy();
        }
      }
    }
  });
});
