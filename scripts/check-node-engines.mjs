#!/usr/bin/env node
// Verifies the repository's supported Node.js floor.
//
// Every workspace manifest must declare the same `engines.node` floor, the CI
// matrix must pin that exact version, and the Node.js running this script must
// satisfy it. Checking all three together is what keeps the manifests, the CI
// matrix, and the contributor toolchain from drifting apart.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ciWorkflow = join(".github", "workflows", "ci.yml");

/**
 * Minimal reader for this repo's `pnpm-workspace.yaml` package list.
 *
 * Returns one entry per candidate manifest. `globbed` marks manifests found by
 * expanding a `dir/*` pattern: pnpm treats a directory without a `package.json`
 * as simply not a package, so those are allowed to be absent. An explicitly
 * listed package (and the root) must exist.
 *
 * @returns {{ path: string, globbed: boolean }[]}
 */
function workspaceManifests() {
  const yaml = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");
  const patterns = yaml
    .split("\n")
    .filter((line) => line.trimStart().startsWith("- "))
    .map((line) => line.trim().slice(2).trim().replace(/^["']|["']$/g, ""));

  const dirs = [{ dir: repoRoot, globbed: false }];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const parent = join(repoRoot, pattern.slice(0, -2));
      for (const entry of readdirSync(parent)) {
        const dir = join(parent, entry);
        if (statSync(dir).isDirectory()) dirs.push({ dir, globbed: true });
      }
    } else {
      dirs.push({ dir: join(repoRoot, pattern), globbed: false });
    }
  }
  return dirs.map(({ dir, globbed }) => ({
    path: join(dir, "package.json"),
    globbed,
  }));
}

/**
 * Reads the exact Node.js version the CI matrix pins its runners to, so the
 * manifests and the workflow cannot declare different floors.
 *
 * @returns {string | undefined} the pinned `x.y.z` version, if one is declared
 */
function ciMatrixNodeVersion() {
  const workflow = readFileSync(join(repoRoot, ciWorkflow), "utf8");
  return /^\s*node:\s*\[\s*"(\d+\.\d+\.\d+)"\s*\]/m.exec(workflow)?.[1];
}

/**
 * Splits an `x.y.z` (or `vx.y.z`, or `x.y.z-pre`) version into numeric parts.
 *
 * @returns {[number, number, number]} the major, minor, and patch numbers
 */
function parseVersion(version) {
  const [major, minor, patch] = version
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map(Number);
  return [major, minor, patch];
}

/**
 * Reports whether `version` is at or above the `floor` version.
 *
 * @returns {boolean} true when `version >= floor`
 */
function satisfiesFloor(version, floor) {
  const actual = parseVersion(version);
  const required = parseVersion(floor);
  for (let i = 0; i < 3; i++) {
    if (actual[i] !== required[i]) return actual[i] > required[i];
  }
  return true;
}

const errors = [];
const floors = new Map();

for (const { path: manifestPath, globbed } of workspaceManifests()) {
  const relativePath = manifestPath.slice(repoRoot.length + 1);
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    // A globbed directory without a manifest is not a workspace package.
    if (globbed && error.code === "ENOENT") continue;
    errors.push(`${relativePath}: cannot be read as JSON (${error.message})`);
    continue;
  }
  const range = manifest.engines?.node;
  if (!range) {
    errors.push(`${relativePath}: missing "engines.node"`);
    continue;
  }
  const match = /^>=(\d+\.\d+\.\d+)$/.exec(String(range).trim());
  if (!match) {
    errors.push(
      `${relativePath}: "engines.node" must be a ">=x.y.z" floor, got ${range}`,
    );
    continue;
  }
  floors.set(relativePath, match[1]);
}

const distinctFloors = [...new Set(floors.values())];
if (distinctFloors.length > 1) {
  errors.push(
    `workspace manifests declare conflicting Node floors: ${[...floors]
      .map(([file, floor]) => `${file} (>=${floor})`)
      .join(", ")}`,
  );
}

// Only meaningful once the manifests agree; a conflict is its own error above.
const floor = distinctFloors.length === 1 ? distinctFloors[0] : undefined;

// The manifests alone cannot define the supported floor: lowering every one of
// them in lockstep would otherwise pass while CI still proves only the higher
// version. Requiring the CI pin to equal the declared floor means moving the
// floor is always a deliberate, reviewable edit to both.
const ciVersion = ciMatrixNodeVersion();
if (!ciVersion) {
  errors.push(`${ciWorkflow}: no pinned \`node: ["x.y.z"]\` matrix entry found`);
} else if (floor && ciVersion !== floor) {
  errors.push(
    `${ciWorkflow} pins Node.js ${ciVersion} but the workspace manifests ` +
      `declare >=${floor}; CI must build on the exact declared floor`,
  );
}

if (floor && !satisfiesFloor(process.versions.node, floor)) {
  errors.push(
    `running Node.js v${process.versions.node} is below the supported floor >=${floor}`,
  );
}

if (errors.length > 0) {
  console.error("Node.js engine check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Node.js v${process.versions.node} satisfies the supported floor >=${floor} ` +
    `declared by ${floors.size} workspace manifests and pinned by ${ciWorkflow}.`,
);
