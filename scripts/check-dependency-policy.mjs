#!/usr/bin/env node
// Verifies the workspace's dependency-override policy.
//
// A root `pnpm.overrides` entry exists to collapse one dependency to a single
// installed copy, so every entry must be an exact version: a range there
// re-admits the duplicate majors and minors the override was added to remove.
// The workspace manifests still publish caret ranges to their own consumers,
// and each of those ranges must both be a caret range and admit the pinned
// version: admitting it is not enough on its own, because an exact or tilde
// range publishes something narrower than intended and stops tracking the
// override at the next bump. `astro` is the one dependency pinned exactly
// everywhere, because its major migrations are gated per pull request.
//
// pnpm applies an override without consulting the range its dependents
// declare, so a pin can drift outside the family a sibling expects with no
// warning at install time. The final check reads the installed manifests and
// reports any overridden package whose declared range for another overridden
// package the pins no longer satisfy — the drift that separates one coherent
// MyST release family from a mixed one. See docs/roadmap/01-dependency-updates.md.

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { lockfile, lockfileVersions } from "./lib/lockfile.mjs";
import { workspaceManifests } from "./lib/workspace-manifests.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const store = join("node_modules", ".pnpm");

// Pins deliberately held outside the range one specific dependent declares,
// keyed `dependent>dependency` so the exception excuses only that pair: the
// same pin violated from a second dependent is new information. Each entry
// must still be violating its range; once the dependent admits the pin, the
// entry is reported as stale so the pin can be dropped.
const DELIBERATE_RANGE_VIOLATIONS = {
  // Every unifont from 0.7.5 depends on undici 8, which requires Node 22.19,
  // and holding 0.7.4 keeps the tree on the 22.12.0 floor. Astro's font APIs
  // are unused in this workspace, so the module is never loaded.
  "astro>unifont": "keeps undici 8 (Node >=22.19.0) out of a tree that supports Node 22.12.0",
};

const EXACT = /^(\d+)\.(\d+)\.(\d+)$/;
// Fields a workspace manifest resolves against the overrides.
const WORKSPACE_DEPENDENCY_FIELDS = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
// Fields that shape the tree when a package is installed as a dependency;
// a published `devDependencies` block is never installed for consumers.
const INSTALLED_DEPENDENCY_FIELDS = ["dependencies", "optionalDependencies", "peerDependencies"];

/**
 * @returns {[number, number, number] | undefined} the numeric parts of an
 *   exact `x.y.z` version, or `undefined` for anything else
 */
function parseVersion(version) {
  const match = EXACT.exec(version.trim());
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] < b[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Reports whether the exact `version` satisfies `range`.
 *
 * Supports the syntaxes the workspace and its MyST dependencies actually use:
 * exact, `^`, `~`, and space-separated comparator clauses. Anything else
 * yields `undefined` so an unfamiliar range is reported rather than silently
 * accepted.
 *
 * @returns {boolean | undefined}
 */
function satisfies(version, range) {
  const actual = parseVersion(version);
  if (!actual) return undefined;
  const bounds = [];
  for (const clause of range.trim().split(/\s+/)) {
    const match = /^(\^|~|>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(clause);
    if (!match) return undefined;
    const operator = match[1] ?? "=";
    const base = parseVersion(match[2]);
    const [major, minor, patch] = base;
    if (operator === "^") {
      const upper =
        major > 0 ? [major + 1, 0, 0] : minor > 0 ? [0, minor + 1, 0] : [0, 0, patch + 1];
      bounds.push([">=", base], ["<", upper]);
    } else if (operator === "~") {
      bounds.push([">=", base], ["<", [major, minor + 1, 0]]);
    } else {
      bounds.push([operator, base]);
    }
  }
  return bounds.every(([operator, bound]) => {
    const order = compareVersions(actual, bound);
    if (operator === "=") return order === 0;
    if (operator === ">=") return order >= 0;
    if (operator === ">") return order > 0;
    if (operator === "<=") return order <= 0;
    return order < 0;
  });
}

/**
 * Runs `pnpm why` for a package so a duplicate is explained in the failure
 * output instead of needing a second command.
 *
 * @returns {string | undefined} the dependency tree, if pnpm could produce one
 */
function explainResolution(name) {
  const result = spawnSync("pnpm", ["why", "-r", name], {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

/**
 * Indexes the manifests installed in pnpm's virtual store by `name@version`.
 *
 * The store directory names cannot be matched by prefix: pnpm truncates any
 * name longer than `virtual-store-dir-max-length` — 60 on Windows, 120
 * elsewhere — and appends a hash, and a peer-resolved copy of a scoped
 * package overruns 60 inside its version. Each directory does still hold the
 * package under `node_modules/<name>/package.json`, so the manifest's own
 * `name` and `version` are read instead. Only the packages named in
 * `wanted` are opened; the store holds hundreds of others.
 *
 * @param {Set<string>} wanted package names worth reading
 * @returns {Map<string, object>} `name@version` to parsed manifest
 */
function installedManifests(wanted) {
  const manifests = new Map();
  for (const entry of readdirSync(join(repoRoot, store))) {
    for (const name of wanted) {
      const manifestPath = join(repoRoot, store, entry, "node_modules", name, "package.json");
      if (!existsSync(manifestPath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
      if (manifest.name === name) manifests.set(`${name}@${manifest.version}`, manifest);
    }
  }
  return manifests;
}

const errors = [];
const rootManifest = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
const overrides = Object.entries(rootManifest.pnpm?.overrides ?? {});

// Every override is an exact version. The checks below only make sense for
// exact pins, so a ranged override is reported once here and skipped after.
const pinned = new Map();
for (const [name, version] of overrides) {
  if (EXACT.test(version)) pinned.set(name, version);
  else errors.push(`package.json: override "${name}": "${version}" must be an exact x.y.z version`);
}

// Every direct range in a workspace manifest admits the pinned version, and
// astro is pinned exactly rather than ranged.
let rangesChecked = 0;
let manifestsChecked = 0;
for (const { path: manifestPath, globbed } of workspaceManifests(repoRoot)) {
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
  manifestsChecked++;
  for (const field of WORKSPACE_DEPENDENCY_FIELDS) {
    for (const [name, range] of Object.entries(manifest[field] ?? {})) {
      const version = pinned.get(name);
      if (version === undefined) continue;
      rangesChecked++;
      if (name === "astro") {
        if (range !== version) {
          errors.push(`${relativePath}: "astro" must be pinned exactly to ${version}, got "${range}"`);
        }
        continue;
      }
      // A range that merely admits the pin is not enough: an exact or tilde
      // range here would publish a narrower range to this package's own
      // consumers than the policy intends, and it would silently stop
      // tracking the override on the next bump.
      if (!range.startsWith("^")) {
        errors.push(
          `${relativePath}: "${name}": "${range}" must be a caret range admitting the override ` +
            `${version}; only astro is pinned exactly in a workspace manifest`,
        );
        continue;
      }
      const admits = satisfies(version, range);
      if (admits === undefined) {
        errors.push(
          `${relativePath}: "${name}": "${range}" uses a range syntax this check cannot ` +
            "evaluate; extend satisfies() rather than skipping it",
        );
      } else if (!admits) {
        errors.push(
          `${relativePath}: "${name}": "${range}" does not admit the override ${version}; ` +
            "move the direct range with the pin",
        );
      }
    }
  }
}

// The lockfile resolves each overridden package to the pin and nothing else.
// pnpm guarantees this for a lockfile it generated; the check catches a
// hand-edited or stale one, which a frozen install does not always reject.
const resolved = lockfileVersions(repoRoot);
const unused = new Set();
for (const [name, version] of pinned) {
  const versions = [...(resolved.get(name) ?? [])].sort();
  if (versions.length === 0) {
    unused.add(name);
    errors.push(`${lockfile}: nothing depends on the overridden "${name}"; drop the override`);
  } else if (versions.length !== 1 || versions[0] !== version) {
    const why = explainResolution(name);
    errors.push(
      `${lockfile}: "${name}" resolves to ${versions.join(", ")} but the override pins ${version}` +
        (why ? `\n${why.replace(/^/gm, "      ")}` : ""),
    );
  }
}

// Every range one overridden package declares for another is satisfied by the
// pins, so the overrides describe one coherent family. This needs the
// installed manifests, which the lockfile does not carry.
let declaredRangesChecked = 0;
if (!existsSync(join(repoRoot, store))) {
  errors.push(`${store}: not found; run \`pnpm install\` before this check`);
} else {
  const installed = installedManifests(new Set(pinned.keys()));
  const staleExceptions = new Set(Object.keys(DELIBERATE_RANGE_VIOLATIONS));
  for (const [name, version] of pinned) {
    if (unused.has(name)) continue; // already reported against the lockfile
    const manifest = installed.get(`${name}@${version}`);
    if (!manifest) {
      errors.push(`${store}: ${name}@${version} is not installed; run \`pnpm install\``);
      continue;
    }
    for (const field of INSTALLED_DEPENDENCY_FIELDS) {
      for (const [dependency, range] of Object.entries(manifest[field] ?? {})) {
        const dependencyVersion = pinned.get(dependency);
        if (dependencyVersion === undefined) continue;
        declaredRangesChecked++;
        const admits = satisfies(dependencyVersion, range);
        if (admits === undefined) {
          errors.push(
            `${name}@${version} declares "${dependency}": "${range}", which this check ` +
              "cannot evaluate; extend satisfies() rather than skipping it",
          );
        } else if (!admits) {
          const exception = `${name}>${dependency}`;
          if (exception in DELIBERATE_RANGE_VIOLATIONS) {
            staleExceptions.delete(exception);
          } else {
            errors.push(
              `${name}@${version} declares "${dependency}": "${range}" but the override pins ` +
                `${dependencyVersion}; move the family together or record a deliberate exception`,
            );
          }
        }
      }
    }
  }
  for (const exception of staleExceptions) {
    errors.push(
      `DELIBERATE_RANGE_VIOLATIONS: "${exception}" no longer covers a violated range; ` +
        "drop the entry and the pin it excused",
    );
  }
}

if (errors.length > 0) {
  console.error("Dependency policy check failed:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(
  `Dependency policy holds: ${pinned.size} exact overrides, ${rangesChecked} direct ranges ` +
    `across ${manifestsChecked} workspace manifests, and ${declaredRangesChecked} declared ` +
    "ranges between overridden packages.",
);
