import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/pivot.ts", "src/adapters/jquery.ts", "src/adapters/vanilla.ts"],
  format: ["cjs", "esm"],   // outputs pivot.js (CJS) and pivot.mjs (ESM)
  dts: true,
  sourcemap: true,
  clean: true,               // wipes dist/ before each build
  target: "es2018",          // matches tsconfig — supports TypedArrays, Map, async/await
});
