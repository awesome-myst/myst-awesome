import { defineCollection, z } from 'astro:content';

import { file } from 'astro/loaders';

import { rootSchema, xrefReferenceSchema, pageFrontmatterSchema, projectFrontmatterSchema, xrefSchema, type XrefReference } from './src/utils/schema.js';

const MYST_PORT = 3100

const xrefReferenceWithIdSchema = xrefReferenceSchema.extend({
  id: z.string(),
})

type XrefReferenceWithId = z.infer<typeof xrefReferenceWithIdSchema>

const xrefLoader = async (server: string = `http://localhost:${MYST_PORT}`): Promise<XrefReferenceWithId> => {
  const xrefResponse = await fetch(`${server}/myst.xref.json`);
  if (!xrefResponse.ok) {
    throw new Error(`Failed to load xref from ${server}`);
  }
  const xrefs = await xrefResponse.json();
  const references = xrefs.references.map((xref: XrefReference): XrefReferenceWithId => {
    if (xref.identifier) {
      return { ...xref, id: xref.identifier };
    }
    return { ...xref, id: xref.url };
  });
  return references;
}

const PagesWithIdSchema = z.object({
  id: z.string(),
  slug: z.string(),
  frontmatter: pageFrontmatterSchema,
  mdast: rootSchema,
});
type PagesWithId = z.infer<typeof PagesWithIdSchema>


const pagesLoader = async (server: string = `http://localhost:${MYST_PORT}`): Promise<PagesWithId[]> => {
  const xrefResponse = await fetch(`${server}/myst.xref.json`);
  if (!xrefResponse.ok) {
    throw new Error(`Failed to load xref from ${server}`);
  }
  const xrefs = await xrefResponse.json();
  const pages = [];
  for (const xref of xrefs.references) {
    if (xref.kind === 'page') {
      const pageResponse = await fetch(`${server}/${xref.data}`);
      if (!pageResponse.ok) {
        throw new Error(`Failed to load page from ${server}`);
      }
      const page = await pageResponse.json();
      const pageData = {
        id: page.slug,
        slug: page.slug,
        frontmatter: page.frontmatter,
        mdast: page.mdast,
      };
      pages.push(pageData);
    }
  }

  return pages;
}

const xref = defineCollection({
  loader: xrefLoader,
  schema: xrefSchema
 });
const pages = defineCollection({
  loader: pagesLoader,
  schema: z.object({
    slug: z.string(),
    frontmatter: pageFrontmatterSchema,
    mdast: rootSchema,
  }),
 });
// const project = defineCollection({
//   loader: file('docs/myst.yml'),
//   schema: projectFrontmatterSchema
//  });

 // http://localhost:${MYST_PORT}/myst.xref.json

export const collections = { xref, pages, project };