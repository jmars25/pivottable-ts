/*
 * jQuery adapter — thin wrapper around the vanilla adapter.
 *
 * Provides the legacy plugin API for projects that still depend on
 * the jQuery interface.  All real logic lives in vanilla.ts.
 *
 * Load order in the browser:
 *   <script src="jquery.min.js"></script>
 *   <script src="dist/adapters/jquery.js"></script>
 *
 * With a bundler:
 *   import "pivottable/jquery";   // side-effectful: wires up $.fn.*
 *
 * Migration path — replace:
 *   $(el).pivotUI(data, opts)
 * with:
 *   import { createPivotUI } from "pivottable/vanilla";
 *   const ui = createPivotUI(el, data, opts);
 *   // later: ui.destroy();
 */

declare var $: any;

import {
  createPivot,
  createPivotUI,
  heatmap,
  barchart,
  pivotUtilities,
  vanillaRenderers,
} from "./vanilla";

import type { PivotUIOptions } from "./vanilla";

// ─── $.pivotUtilities ─────────────────────────────────────────────────────
// Same namespace shape as before.  Renderers now include the vanilla
// post-processors (Heatmap, Row Heatmap, Col Heatmap, Table Barchart).

$.pivotUtilities = Object.assign({}, pivotUtilities, {
  renderers: Object.assign({}, pivotUtilities.renderers, vanillaRenderers),
});

// ─── $.fn.pivot ───────────────────────────────────────────────────────────
// Renders a static pivot table into the matched element.

$.fn.pivot = function(input: any, opts: any = {}, locale = "en") {
  createPivot(this[0] as HTMLElement, input, { locale, ...opts });
  return this;
};

// ─── $.fn.pivotUI ─────────────────────────────────────────────────────────
// Full drag-and-drop pivot UI.  Stores the PivotUIHandle in jQuery's .data()
// so a second call on the same element correctly tears down the first.

$.fn.pivotUI = function(
  input:     any,
  opts:      PivotUIOptions = {},
  overwrite                 = false,
  locale                    = "en"
) {
  const prev = this.data("pvtUIHandle");
  if (prev?.destroy) prev.destroy();

  const handle = createPivotUI(this[0] as HTMLElement, input, opts, overwrite, locale);
  this.data("pvtUIHandle", handle);
  return this;
};

// ─── $.fn.heatmap ─────────────────────────────────────────────────────────
// Colorizes the cells of a rendered pivot table by value.

$.fn.heatmap = function(
  scope: "heatmap" | "rowheatmap" | "colheatmap" = "heatmap",
  opts?: any
) {
  heatmap(this[0] as HTMLElement, scope, opts);
  return this;
};

// ─── $.fn.barchart ────────────────────────────────────────────────────────
// Replaces each data cell with a proportional bar chart.

$.fn.barchart = function() {
  barchart(this[0] as HTMLElement);
  return this;
};
