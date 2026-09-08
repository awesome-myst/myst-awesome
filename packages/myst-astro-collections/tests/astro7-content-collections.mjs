// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

// Exercises the public collection builders after the Astro 7 migration.
//
// Astro 7 removed the deprecated `z` re-export from `astro:content` and moved
// content collections onto Zod 4, while the schemas this package validates
// against still come from `@awesome-myst/myst-zod` on Zod 3. That split is
// deliberate until roadmap 12 lands, so the contract worth pinning here is that
// each builder still resolves `astro:content`, still assembles a `loader` and a
// `schema`, and that the schema still accepts real MyST payloads and rejects
// malformed ones.
//
// `astro:content` is a virtual module, so it is stubbed through loader hooks;
// see `astro-content-hooks.mjs` for why.

import assert from "node:assert/strict";
import { register } from "node:module";

register("./astro-content-hooks.mjs", import.meta.url);

const {
  createMystXrefCollection,
  createPagesCollection,
  createProjectFrontmatterCollection,
  createMystCollections,
} = await import("../dist/index.js");

// Representative payloads, shaped after the JSON the MyST content server emits
// for this repository's own docs (`docs/public/book/`).
const xrefPayload = {
  version: "1",
  myst: "1.8.0",
  references: [
    { kind: "page", data: "/content/index.json", url: "/" },
    {
      identifier: "what-are-site-options",
      kind: "heading",
      data: "/content/site-options.json",
      url: "/site-options",
      implicit: true,
    },
  ],
};

const pagePayload = {
  version: 1,
  kind: "Article",
  sha256: "a".repeat(64),
  slug: "typography",
  location: "/authoring/typography.md",
  dependencies: [],
  frontmatter: { title: "Typography" },
  mdast: {
    type: "root",
    children: [
      { type: "paragraph", children: [{ type: "text", value: "Hello" }] },
    ],
  },
  references: { cite: { order: [], data: {} } },
};

const projectPayload = {
  title: "MyST Awesome",
  description: "MyST-MD site theme built with Web Awesome.",
  toc: [{ file: "index.md" }],
};

const cases = [
  {
    name: "mystXref",
    collection: createMystXrefCollection({}),
    valid: xrefPayload,
    // `references` is required, and every entry needs a `kind`.
    invalid: { version: "1", myst: "1.8.0", references: [{ url: "/" }] },
  },
  {
    name: "pages",
    collection: createPagesCollection({}),
    valid: pagePayload,
    // `mdast` must be a MyST root node, not a bare string.
    invalid: { ...pagePayload, mdast: "not-an-ast" },
  },
  {
    name: "projectFrontmatter",
    collection: createProjectFrontmatterCollection({}),
    valid: projectPayload,
    // `toc` entries must be objects describing a file or a parent entry.
    invalid: { ...projectPayload, toc: ["index.md"] },
  },
];

for (const { name, collection, valid, invalid } of cases) {
  assert.ok(collection, `${name}: builder returned nothing`);
  assert.equal(
    typeof collection.loader,
    "function",
    `${name}: collection is missing its loader`
  );
  assert.ok(collection.schema, `${name}: collection is missing its schema`);

  const accepted = collection.schema.safeParse(valid);
  assert.ok(
    accepted.success,
    `${name}: schema rejected a representative payload: ${JSON.stringify(
      accepted.error?.issues?.slice(0, 3)
    )}`
  );

  const rejected = collection.schema.safeParse(invalid);
  assert.equal(
    rejected.success,
    false,
    `${name}: schema accepted a malformed payload`
  );

  console.log(`✓ ${name} collection builds and validates its payload`);
}

// The unified factory is what both `content.config.ts` files call, so it needs
// to keep returning all three collections under their expected keys.
const collections = createMystCollections({});
assert.deepEqual(
  Object.keys(collections).sort(),
  ["mystXref", "pages", "projectFrontmatter"],
  "createMystCollections did not return the expected collections"
);
for (const [name, collection] of Object.entries(collections)) {
  assert.equal(
    typeof collection.loader,
    "function",
    `createMystCollections().${name} is missing its loader`
  );
  assert.ok(
    collection.schema,
    `createMystCollections().${name} is missing its schema`
  );
}

console.log("✓ createMystCollections returns all three collections");
