import { defineConfig } from "tsup";

export default defineConfig([
  // ── Bundler build (CJS + ESM, unminified) ────────────────────────────────
  // Consumed by Vite / webpack / rollup — the app bundler handles minification.
  {
    entry: [
      "src/pivot.ts",
      "src/adapters/vanilla.ts",
      "src/renderers/chartjs.ts",
      "src/locales/index.ts",
    ],
    format: ["cjs", "esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    target: "es2018",
  },

  // ── Browser/CDN build (IIFE, minified) ───────────────────────────────────
  // Self-contained script for direct <script> tag / jsDelivr / unpkg usage.
  // SortableJS is bundled in.  Chart.js and locales are separate optional loads.
  {
    entry: { "pivot.min": "src/browser.ts" },
    format: ["iife"],
    globalName: "PivotTableTS",
    minify: true,
    sourcemap: true,
    platform: "browser",
    target: "es2018",
    dts: false,
    // Bundle SortableJS into the browser file so it needs only one <script> tag.
    // (jQuery and Chart.js remain external — too large to bundle by default.)
    noExternal: ["sortablejs"],
    // Override the default ".global.js" IIFE extension so the file is
    // cleanly named "pivot.min.js" rather than "pivot.min.global.js".
    outExtension: () => ({ js: ".js" }),
  },
]);
