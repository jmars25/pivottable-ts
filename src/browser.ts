/**
 * pivottable-ts browser/CDN entry point.
 *
 * Bundles the core pivot engine + vanilla (SortableJS) adapter into a single
 * self-contained IIFE.  Available as the global `PivotTableTS`.
 *
 * CDN usage (SortableJS is bundled — only two tags needed):
 *   <link  rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pivottable-ts/dist/pivot.css">
 *   <script src="https://cdn.jsdelivr.net/npm/pivottable-ts/dist/pivot.min.js"></script>
 *   <script>
 *     const { createPivotUI } = PivotTableTS;
 *     createPivotUI(document.getElementById('output'), data, opts);
 *   </script>
 *
 * Chart.js renderers and locales are optional — load them separately:
 *   import { chartjsRenderers } from "pivottable-ts/renderers/chartjs";
 *   import "pivottable-ts/locales";
 */
export * from "./pivot";
export * from "./adapters/vanilla";
