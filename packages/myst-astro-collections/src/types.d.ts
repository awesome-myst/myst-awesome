// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: 2025 Fideus Labs LLC

// Minimal ambient declaration for the `astro:content` virtual module.
//
// This package is compiled with plain `tsc`, outside of an Astro build, so the
// virtual module Astro injects at build time is not resolvable here. Only the
// surface this package actually consumes is declared.
//
// `z` is deliberately not re-declared: `import { z } from "astro:content"` is
// deprecated in Astro 6 and removed in Astro 7. Consumers that need Zod should
// import it from `astro/zod` (Zod 4) or from `@awesome-myst/myst-zod`.
declare module "astro:content" {
  export function defineCollection<T>(config: {
    loader: () => Promise<any[]>;
    schema: T;
  }): any;
}
