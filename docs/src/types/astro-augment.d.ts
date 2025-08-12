// Augment Props of the external DocsLayout component to include baseDir
// This helps the Astro/TS checker in the docs app accept the new prop across workspaces.
declare module "@awesome-myst/myst-awesome/layouts/DocsLayout.astro" {
  const Component: any;
  export default Component;
  export interface Props {
    baseDir?: string;
  }
}
