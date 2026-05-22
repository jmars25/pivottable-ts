import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/pivot.ts", "src/adapters/jquery.ts"],
  format: ["cjs", "esm"],   // outputs pivot.js (CJS) and pivot.mjs (ESM)
  dts: false,                // re-enable once TypeScript types are added to src/pivot.ts
  sourcemap: true,
  clean: true,               // wipes dist/ before each build
  target: "es2018",          // matches tsconfig — supports TypedArrays, Map, async/await
});
