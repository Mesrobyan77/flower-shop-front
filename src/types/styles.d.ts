/**
 * Ambient declarations for plain stylesheet imports.
 *
 * Next.js only ships declarations for CSS Modules (`*.module.css`) through
 * `next-env.d.ts`; global stylesheets imported for their side effect - such as
 * `import '@/app/globals.css'` in `src/app/layout.tsx` - have none. Without the
 * declarations below TypeScript reports TS2307 ("Cannot find module or type
 * declarations for side-effect import of '...'") whenever unresolved
 * side-effect imports are checked, for example with
 * `noUncheckedSideEffectImports` enabled.
 *
 * The shorthand declarations keep the imports side-effect only: nothing is
 * exported, so importing a value from a plain stylesheet stays an error.
 */
declare module '*.css';
declare module '*.scss';
declare module '*.sass';
declare module '*.less';
