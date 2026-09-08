// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

// Module resolution hooks that make `astro:content` importable outside an Astro
// build.
//
// `collections.ts` imports `defineCollection` from `astro:content`, a virtual
// module Astro injects into its own build. This package compiles with plain
// `tsc` and its tests run under plain `node`, where that specifier has no
// scheme the ESM loader understands, so importing the built collection builders
// fails before any assertion can run.
//
// The stub mirrors what Astro's `defineCollection` does for our purposes: it is
// an identity function over the collection config, which lets a test inspect
// the `loader` and `schema` each builder assembled.
//
// Registered via `module.register()` rather than `module.registerHooks()`,
// which only exists from Node 22.15 and would not run on this repository's
// declared 22.12.0 floor.

const STUB = "export function defineCollection(config) { return config; }";

/** @type {import("node:module").ResolveHook} */
export function resolve(specifier, context, nextResolve) {
  if (specifier === "astro:content") {
    return {
      url: `data:text/javascript,${encodeURIComponent(STUB)}`,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
