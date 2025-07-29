// Type declarations for Astro modules in this package
declare module "astro:content" {
  export function defineCollection<T>(config: {
    loader: () => Promise<any[]>;
    schema: T;
  }): any;

  export const z: typeof import("zod").z;
}
