#!/usr/bin/env node
// Verifies the repository's supported Node.js floor.
//
// Every workspace manifest must declare the same `engines.node` floor, and the
// Node.js running this script must satisfy it. CI pins its matrix to that exact
// floor, so this check is what keeps the manifests, the CI matrix, and the
// contributor toolchain from drifting apart.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal reader for this repo's `pnpm-workspace.yaml` package list. */
function workspaceManifests() {
  const yaml = readFileSync(join(repoRoot, "pnpm-workspace.yaml"), "utf8");
  const patterns = yaml
    .split("\n")
    .filter((line) => line.trimStart().startsWith("- "))
    .map((line) => line.trim().slice(2).trim().replace(/^["']|["']$/g, ""));

  const dirs = [];
  for (const pattern of patterns) {
    if (pattern.endsWith("/*")) {
      const parent = join(repoRoot, pattern.slice(0, -2));
      for (const entry of readdirSync(parent)) {
        const dir = join(parent, entry);
        if (statSync(dir).isDirectory()) dirs.push(dir);
      }
    } else {
      dirs.push(join(repoRoot, pattern));
    }
  }
  return [repoRoot, ...dirs].map((dir) => join(dir, "package.json"));
}

function parseVersion(version) {
  const [major, minor, patch] = version
    .replace(/^v/, "")
    .split("-")[0]
    .split(".")
    .map(Number);
  return [major, minor, patch];
}

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

for (const manifestPath of workspaceManifests()) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const relativePath = manifestPath.slice(repoRoot.length + 1);
  const range = manifest.engines?.node;
  if (!range) {
    errors.push(`${relativePath}: missing "engines.node"`);
    continue;
  }
  const match = /^>=(\d+\.\d+\.\d+)$/.exec(range.trim());
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
    `declared by ${floors.size} workspace manifests.`,
);
