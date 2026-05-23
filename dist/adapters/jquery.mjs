import {
  barchart,
  createPivot,
  createPivotUI,
  heatmap,
  pivotUtilities,
  vanillaRenderers
} from "../chunk-6SPX3EUA.mjs";
import "../chunk-KOKACGAB.mjs";

// src/adapters/jquery.ts
$.pivotUtilities = Object.assign({}, pivotUtilities, {
  renderers: Object.assign({}, pivotUtilities.renderers, vanillaRenderers)
});
$.fn.pivot = function(input, opts = {}, locale = "en") {
  createPivot(this[0], input, { locale, ...opts });
  return this;
};
$.fn.pivotUI = function(input, opts = {}, overwrite = false, locale = "en") {
  const prev = this.data("pvtUIHandle");
  if (prev == null ? void 0 : prev.destroy) prev.destroy();
  const handle = createPivotUI(this[0], input, opts, overwrite, locale);
  this.data("pvtUIHandle", handle);
  return this;
};
$.fn.heatmap = function(scope = "heatmap", opts) {
  heatmap(this[0], scope, opts);
  return this;
};
$.fn.barchart = function() {
  barchart(this[0]);
  return this;
};
//# sourceMappingURL=jquery.mjs.map