#!/usr/bin/env node
// Verifies that every `<wa-*>` element rendered by an Astro page is registered.
//
// Web Awesome ships one ES module per component and registers the custom
// element as a side effect of importing it. A page that renders `<wa-select>`
// without importing `select.js` somewhere in its component tree still emits the
// tag, and the browser renders its children as unstyled text instead of a
// dropdown. Nothing fails at build time, so this class of defect is only
// visible to someone looking at the page.
//
// The check walks each page's `.astro` import graph, unions the elements it
// renders with the elements its `<script>` blocks register, and reports any
// element that is rendered but never registered.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Roots that contain Astro source. Each entry maps the bare specifier a
// workspace package is imported by onto the directory that specifier resolves
// against, so `@awesome-myst/myst-awesome/layouts/X.astro` can be followed.
const packageRoots = {
  "@awesome-myst/myst-awesome": join(repoRoot, "packages", "myst-awesome", "src"),
};
const searchRoots = [
  join(repoRoot, "packages", "myst-awesome", "src"),
  join(repoRoot, "docs", "src"),
];

// Elements the theme defines itself rather than importing from Web Awesome.
const locallyDefinedElements = new Set(["wa-myst-editor"]);

/**
 * Recursively lists every `.astro` file under `dir`.
 *
 * @returns {string[]} absolute paths
 */
function astroFilesIn(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) found.push(...astroFilesIn(path));
    else if (entry.endsWith(".astro")) found.push(path);
  }
  return found;
}

/**
 * Splits an `.astro` file into the regions this check treats differently:
 * frontmatter (component imports), `<script>` bodies (element registrations),
 * and the template (rendered markup). `<style>` bodies are dropped entirely so
 * that `--wa-*` custom properties cannot be mistaken for elements.
 *
 * @returns {{ frontmatter: string, scripts: string, template: string }}
 */
function splitAstro(source) {
  let frontmatter = "";
  let body = source;
  const fence = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source);
  if (fence) {
    frontmatter = fence[1];
    body = source.slice(fence[0].length);
  }

  let scripts = "";
  const template = body
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, (_, inner) => {
      scripts += `${inner}\n`;
      return "";
    })
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  return { frontmatter, scripts, template };
}

/**
 * Collects the `wa-*` tags a template renders.
 *
 * Only opening tags count, so a closing tag or a `--wa-` custom property never
 * registers as a requirement.
 *
 * @returns {Set<string>}
 */
function renderedElements(template) {
  const elements = new Set();
  for (const [, tag] of template.matchAll(/<(wa-[a-z0-9-]+)[\s/>]/g)) {
    elements.add(tag);
  }
  return elements;
}

// Resolved from the theme, which is the workspace package that depends on Web
// Awesome directly; the repository root does not.
const webAwesomeRoot = dirname(
  createRequire(
    join(repoRoot, "packages", "myst-awesome", "package.json"),
  ).resolve("@awesome.me/webawesome/package.json"),
);

/**
 * Maps a Web Awesome module to every element importing it defines.
 *
 * The mapping cannot be assumed from the module name: `components/tab-group/
 * tab-group.js` also defines `<wa-tab>` and `<wa-tab-panel>` through the shared
 * chunks it pulls in, and a page relying on that is correct. Reading the
 * installed package instead of guessing keeps this check from reporting such a
 * page as a defect, and keeps it honest when an upgrade regroups the chunks.
 *
 * @returns {Set<string>} the elements the module tree registers
 */
const moduleRegistrations = new Map();
function elementsDefinedBy(modulePath) {
  const cached = moduleRegistrations.get(modulePath);
  if (cached) return cached;

  const elements = new Set();
  moduleRegistrations.set(modulePath, elements);
  if (!existsSync(modulePath)) return elements;

  const source = readFileSync(modulePath, "utf8");
  for (const [, tag] of source.matchAll(
    /customElement\(\s*["'](wa-[a-z0-9-]+)["']/g,
  )) {
    elements.add(tag);
  }
  for (const [, specifier] of source.matchAll(
    /(?:^|\s)(?:import|export)[^;]*?["'](\.[^"']+\.js)["']/g,
  )) {
    for (const tag of elementsDefinedBy(
      resolve(dirname(modulePath), specifier),
    )) {
      elements.add(tag);
    }
  }
  return elements;
}

/**
 * Collects the `wa-*` tags a `<script>` body registers.
 *
 * Importing the package root registers nothing on its own — it only re-exports
 * the classes — so only the per-component deep imports count.
 *
 * @returns {Set<string>}
 */
function registeredElements(scripts) {
  const elements = new Set();
  for (const [, path] of scripts.matchAll(
    /@awesome\.me\/webawesome\/(dist\/components\/[a-z0-9-]+\/[a-z0-9-]+\.js)/g,
  )) {
    for (const tag of elementsDefinedBy(join(webAwesomeRoot, path))) {
      elements.add(tag);
    }
  }
  return elements;
}

/**
 * Resolves the `.astro` files a component imports in its frontmatter, following
 * both relative paths and the workspace package specifiers in `packageRoots`.
 *
 * @returns {string[]} absolute paths that exist on disk
 */
function astroImports(frontmatter, fromFile) {
  const imported = [];
  for (const [, specifier] of frontmatter.matchAll(
    /^\s*import\s+[^;'"]*from\s*["']([^"']+\.astro)["']/gm,
  )) {
    let path;
    if (specifier.startsWith(".")) {
      path = resolve(dirname(fromFile), specifier);
    } else {
      const pkg = Object.keys(packageRoots).find((name) =>
        specifier.startsWith(`${name}/`),
      );
      if (!pkg) continue;
      path = join(packageRoots[pkg], specifier.slice(pkg.length + 1));
    }
    try {
      if (statSync(path).isFile()) imported.push(path);
    } catch {
      // A specifier this resolver cannot follow is reported by the build, not
      // by this check.
    }
  }
  return imported;
}

const files = new Map();
for (const root of searchRoots) {
  for (const path of astroFilesIn(root)) {
    const { frontmatter, scripts, template } = splitAstro(
      readFileSync(path, "utf8"),
    );
    files.set(path, {
      rendered: renderedElements(template),
      registered: registeredElements(scripts),
      imports: astroImports(frontmatter, path),
    });
  }
}

/**
 * Unions a page's own elements with those of every `.astro` file it transitively
 * imports, which is the set the browser actually sees for one document.
 *
 * @returns {{ rendered: Set<string>, registered: Set<string> }}
 */
function collect(entry) {
  const rendered = new Set();
  const registered = new Set();
  const queue = [entry];
  const seen = new Set();
  while (queue.length > 0) {
    const path = queue.pop();
    if (seen.has(path)) continue;
    seen.add(path);
    const file = files.get(path);
    if (!file) continue;
    for (const tag of file.rendered) rendered.add(tag);
    for (const tag of file.registered) registered.add(tag);
    queue.push(...file.imports);
  }
  return { rendered, registered };
}

const failures = [];
let pagesChecked = 0;
for (const path of [...files.keys()].sort()) {
  // `path` is built with `join`, so it is separator-native: `src\pages\` on
  // Windows. Compare in POSIX form so the filter — and the reported path —
  // behave identically on all three CI operating systems.
  const relativePath = relative(repoRoot, path).split(sep).join("/");
  if (!relativePath.includes("src/pages/")) continue;
  pagesChecked += 1;
  const { rendered, registered } = collect(path);
  const missing = [...rendered]
    .filter((tag) => !registered.has(tag) && !locallyDefinedElements.has(tag))
    .sort();
  if (missing.length > 0) {
    failures.push(`${relativePath}: ${missing.join(", ")}`);
  }
}

// A filter that matches nothing would report success while checking nothing,
// which is how a separator bug hides on one operating system. Every search root
// has pages, so an empty selection is a defect in this script.
if (pagesChecked === 0) {
  console.error(
    "Web Awesome registration check selected no pages — the `src/pages/` " +
      `filter matched none of the ${files.size} .astro files found. This is a ` +
      "bug in the check, not a clean result.",
  );
  process.exit(1);
}

if (failures.length > 0) {
  console.error(
    "Web Awesome registration check failed — these pages render custom " +
      "elements that no `<script>` in their component tree imports:",
  );
  for (const failure of failures) console.error(`  - ${failure}`);
  console.error(
    "\nAdd the matching " +
      "`@awesome.me/webawesome/dist/components/<name>/<name>.js` import to the " +
      "`<script>` block of the component that renders the element.",
  );
  process.exit(1);
}

console.log(
  `Web Awesome registration check passed for ${pagesChecked} pages ` +
    `(${files.size} .astro files).`,
);
