// Enumerates the workspace's `package.json` manifests for the check scripts.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Minimal reader for this repo's `pnpm-workspace.yaml` package list.
 *
 * Only the list under the top-level `packages:` key is read, so other lists
 * pnpm allows in this file are never mistaken for packages. The patterns are
 * expanded as a plain directory (`docs`) or a one-level glob (`packages/*`);
 * anything else pnpm would accept — `**`, negations, a wildcard elsewhere in
 * the path — is reported rather than silently misread, so the reader stays
 * honest without carrying a glob engine.
 *
 * Returns one entry per candidate manifest, including the root. `globbed`
 * marks manifests found by expanding a `dir/*` pattern: pnpm treats a
 * directory without a `package.json` as simply not a package, so those are
 * allowed to be absent. An explicitly listed package (and the root) must
 * exist.
 *
 * @param {string} repoRoot absolute path of the repository root
 * @returns {{ path: string, globbed: boolean }[]}
 */
export function workspaceManifests(repoRoot) {
  const lines = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8")
    .replace(/\r\n/g, "\n")
    .split("\n");
  const patterns = [];
  let inPackages = false;
  for (const line of lines) {
    if (/^\S/.test(line)) inPackages = /^packages:\s*$/.test(line);
    else if (inPackages && line.trimStart().startsWith("- ")) {
      patterns.push(line.trim().slice(2).trim().replace(/^["']|["']$/g, ""));
    }
  }
  if (patterns.length === 0) {
    throw new Error("pnpm-workspace.yaml: no entries found under a top-level packages: list");
  }

  const dirs = [{ dir: repoRoot, globbed: false }];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*") && !/[*!]/.test(pattern.slice(0, -2))) {
      const parent = join(repoRoot, pattern.slice(0, -2));
      for (const entry of readdirSync(parent)) {
        const dir = join(parent, entry);
        if (statSync(dir).isDirectory()) dirs.push({ dir, globbed: true });
      }
    } else if (!/[*!]/.test(pattern)) {
      dirs.push({ dir: join(repoRoot, pattern), globbed: false });
    } else {
      throw new Error(
        `pnpm-workspace.yaml: cannot expand "${pattern}"; this reader supports a plain ` +
          "directory or a trailing /* only — extend it before using other patterns",
      );
    }
  }
  return dirs.map(({ dir, globbed }) => ({
    path: join(dir, "package.json"),
    globbed,
  }));
}
