#!/usr/bin/env node
// Verifies that every installed package supports the repository's Node floor.
//
// The workspace manifests promise `engines.node` to their consumers, but a
// transitive dependency is free to declare a higher floor, and nothing
// surfaces it: pnpm only fails under `engine-strict`, and a contributor on a
// newer Node satisfies the range anyway. This walks the packages installed for
// the current platform — so each CI leg also covers the optional native
// binaries it installs — and fails on any whose `engines.node` the floor does
// not satisfy. See the dependency policy in docs/roadmap/01-dependency-updates.md.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import semver from "semver";

import { lockfile, lockfileVersions } from "./lib/lockfile.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const store = join("node_modules", ".pnpm");

// Packages whose declared floor is deliberately left above the repository's,
// with the evidence that they run on it anyway. Prefer pinning an older,
// compatible release through `pnpm.overrides`; an entry here is for the case
// where no such release can serve the dependent. Each entry must still be
// violating the floor; once it is not, the entry is reported as stale.
const DELIBERATE_ENGINE_EXCEPTIONS = {
  // `@astrojs/check` converts `.astro` files through a wasm build that pins
  // this runtime exactly. The `^22.13.0` marks where `require(esm)` stopped
  // printing an ExperimentalWarning, not a missing API: the converter itself
  // declares `>=22.12.0`, and `astro check` passes on 22.12.0. Only the
  // workspace's devDependencies pull it in.
  "@napi-rs/wasm-runtime": "astro check is verified on the floor; the range tracks a warning, not an API",
};

/**
 * Lists the manifests of every package in pnpm's virtual store.
 *
 * Each store directory holds its package under `node_modules/<name>` beside
 * links to that package's own dependencies, so reading every child and keying
 * by the manifest's `name@version` visits each installed package once without
 * telling real directories from links — which Windows junctions make
 * unreliable to do. Store directory names are never parsed: pnpm truncates
 * long ones.
 *
 * @returns {Map<string, object>} `name@version` to parsed manifest
 */
function storeManifests() {
  const manifests = new Map();
  for (const entry of readdirSync(join(repoRoot, store))) {
    const modules = join(repoRoot, store, entry, "node_modules");
    let children;
    try {
      if (!statSync(modules).isDirectory()) continue;
      children = readdirSync(modules);
    } catch {
      continue; // `lock.yaml`, `.modules.yaml`, and other non-package entries
    }
    for (const child of children) {
      if (child.startsWith(".")) continue;
      const names = child.startsWith("@")
        ? readdirSync(join(modules, child)).map((name) => `${child}/${name}`)
        : [child];
      for (const name of names) {
        let manifest;
        try {
          manifest = JSON.parse(readFileSync(join(modules, name, "package.json"), "utf8"));
        } catch {
          continue;
        }
        manifests.set(`${manifest.name}@${manifest.version}`, manifest);
      }
    }
  }
  return manifests;
}

const rootManifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const floorRange = rootManifest.engines?.node;
const floor = floorRange && semver.minVersion(floorRange)?.version;
if (!floor) {
  console.error(`package.json: cannot read a Node floor from "engines.node": ${floorRange}`);
  process.exit(1);
}

// Only what the lockfile resolves counts: the store keeps directories from
// earlier installs until they are pruned.
const resolved = lockfileVersions(repoRoot);
const errors = [];
const staleExceptions = new Set(Object.keys(DELIBERATE_ENGINE_EXCEPTIONS));
let checked = 0;
let excepted = 0;

for (const [key, manifest] of storeManifests()) {
  if (!resolved.get(manifest.name)?.has(manifest.version)) continue;
  checked++;
  const range = manifest.engines?.node;
  if (range === undefined) continue;
  if (semver.validRange(range) === null) {
    errors.push(`${key} declares "engines.node": "${range}", which is not a valid range`);
  } else if (!semver.satisfies(floor, range)) {
    if (manifest.name in DELIBERATE_ENGINE_EXCEPTIONS) {
      staleExceptions.delete(manifest.name);
      excepted++;
    } else {
      errors.push(
        `${key} declares "engines.node": "${range}", which excludes the supported ` +
          `floor ${floor}; pin a compatible release through pnpm.overrides`,
      );
    }
  }
}

for (const name of staleExceptions) {
  errors.push(
    `DELIBERATE_ENGINE_EXCEPTIONS: no installed "${name}" excludes Node ${floor} any more; ` +
      "drop the entry",
  );
}

if (checked === 0) {
  errors.push(`${store}: no packages from ${lockfile} are installed; run \`pnpm install\``);
}

if (errors.length > 0) {
  console.error("Installed engines check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Installed engines hold: ${checked - excepted} of ${checked} installed packages accept ` +
    `Node ${floor}` +
    (excepted === 0
      ? "."
      : excepted === 1
        ? "; the other is a recorded exception."
        : `; the other ${excepted} are recorded exceptions.`),
);
