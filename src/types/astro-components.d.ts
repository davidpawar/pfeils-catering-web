/**
 * Lets a `.ts` module import an Astro component, as `src/routing/views.ts` does.
 *
 * Astro types component props inside `.astro` files. `tsc` never compiles those,
 * so this declaration only covers imports from TypeScript and takes no checking
 * away from the components themselves.
 *
 * This file must stay free of top-level `import` and `export`. A file with
 * either becomes a module, and a wildcard module declaration inside a module
 * is not global.
 */
declare module "*.astro" {
  const component: unknown;
  export default component;
}
