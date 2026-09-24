// Reads the resolved package set from `pnpm-lock.yaml` for the check scripts.

import { readFileSync } from "node:fs";
import { join } from "node:path";

export const lockfile = "pnpm-lock.yaml";

/**
 * Collects every resolved version of every package in `pnpm-lock.yaml`.
 *
 * Reads the `packages:` section, whose keys are `name@version` (quoted when
 * the name is scoped), rather than `snapshots:`, whose keys also carry peer
 * suffixes. The lockfile is the source of truth here: `node_modules/.pnpm`
 * keeps directories from earlier installs around until it is pruned.
 *
 * @param {string} repoRoot absolute path of the repository root
 * @returns {Map<string, Set<string>>} package name to resolved versions
 */
export function lockfileVersions(repoRoot) {
  // A Windows checkout with autocrlf hands back CRLF; normalise so the
  // section markers and line matches below hold on every CI leg.
  const text = readFileSync(join(repoRoot, lockfile), "utf8").replace(/\r\n/g, "\n");
  const start = text.indexOf("\npackages:\n");
  const end = text.indexOf("\nsnapshots:\n", start);
  if (start < 0 || end < 0) {
    throw new Error(`${lockfile}: expected top-level packages: and snapshots: sections`);
  }
  const versions = new Map();
  for (const line of text.slice(start, end).split("\n")) {
    const match = /^ {2}'?((?:@[^/']+\/)?[^@']+)@([^':]+)'?:$/.exec(line);
    if (!match) continue;
    const [, name, version] = match;
    if (!versions.has(name)) versions.set(name, new Set());
    versions.get(name).add(version);
  }
  return versions;
}
