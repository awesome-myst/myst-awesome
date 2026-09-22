#!/usr/bin/env node
// Verifies the theme's scienceicon name list against the installed package.
//
// `src/lib/scienceicons-names.ts` is an allowlist: the icon library's resolver
// refuses any name outside it, so an icon the upstream package ships but the
// list omits simply never renders, and a name the list keeps after upstream
// drops it resolves to a 404. Neither failure raises a build error — the
// scienceicons 0.0.13 to 0.0.14 bump added `semble` and nothing noticed — so
// the two are compared here instead of by eye. See
// docs/roadmap/01-dependency-updates.md.

import { createRequire } from "node:module";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themeDir = join("packages", "myst-awesome");
const namesModule = join(themeDir, "src", "lib", "scienceicons-names.ts");
// The icon set the theme registers; the package also ships a 20px set and an
// `outline` variant, which the theme does not use.
const variant = join("24", "solid");

/**
 * Reads the string literals of the module's `SCIENCEICONS` array.
 *
 * The list is TypeScript, and this repository's checks run on plain Node, so
 * the array literal is read rather than imported. The shape is pinned by the
 * `as const` terminator: anything between it and the declaration that is not a
 * quoted name is reported rather than skipped, so a future computed entry
 * fails the check instead of silently shrinking the list.
 *
 * @returns {string[]} the declared icon names, in declaration order
 */
function declaredNames() {
  const source = readFileSync(join(repoRoot, namesModule), "utf8").replace(/\r\n/g, "\n");
  const match = /export const SCIENCEICONS = \[\n([\s\S]*?)\n\] as const;/.exec(source);
  if (!match) {
    throw new Error(`${namesModule}: no \`export const SCIENCEICONS = [...] as const;\` found`);
  }
  return match[1].split("\n").map((line, index) => {
    const name = /^ {2}'([^']+)',$/.exec(line.trimEnd());
    if (!name) {
      throw new Error(
        `${namesModule}: line ${index + 1} of SCIENCEICONS is not a quoted name: ${line.trim()}`,
      );
    }
    return name[1];
  });
}

/**
 * Lists the icon names the installed `scienceicons` package ships.
 *
 * Resolved through Node so the check does not assume a package layout, and
 * anchored at the theme's manifest because `scienceicons` is the theme's
 * dependency and pnpm does not hoist it to this script's directory. The
 * package declares no `exports` map, so its manifest is addressable and the
 * icon directories sit beside it.
 *
 * @returns {string[]} the shipped icon names
 */
function installedNames() {
  const fromTheme = createRequire(pathToFileURL(join(repoRoot, themeDir, "package.json")));
  const dir = join(dirname(fromTheme.resolve("scienceicons/package.json")), variant);
  return readdirSync(dir)
    .filter((file) => file.endsWith(".svg"))
    .map((file) => file.slice(0, -".svg".length));
}

const declared = declaredNames();
const installed = installedNames();
const errors = [];

const installedSet = new Set(installed);
const missing = installed.filter((name) => !declared.includes(name));
const extra = declared.filter((name) => !installedSet.has(name));

if (missing.length > 0) {
  errors.push(
    `${namesModule}: the installed scienceicons ship ${missing.join(", ")}, which the list ` +
      "omits; the icon library's resolver refuses names outside it",
  );
}
if (extra.length > 0) {
  errors.push(
    `${namesModule}: lists ${extra.join(", ")}, which the installed scienceicons no longer ` +
      `ship under ${variant}; those names resolve to a 404`,
  );
}

if (errors.length > 0) {
  console.error("Scienceicons check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Scienceicons list matches the installed package: ${declared.length} icons under ${variant}.`,
);
