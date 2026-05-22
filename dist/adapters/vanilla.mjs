import {
  PivotData,
  PivotStream,
  aggregatorTemplates,
  aggregators,
  derivers,
  getSort,
  locales,
  naturalSort,
  numberFormat,
  pivotTableRenderer,
  renderers,
  sortAs
} from "../chunk-SEBP56Q2.mjs";

// src/adapters/vanilla.ts
function deepMerge(...sources) {
  var _a;
  const result = {};
  for (const src of sources) {
    if (src == null) continue;
    for (const key of Object.keys(src)) {
      const val = src[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val) && typeof val !== "function") {
        result[key] = deepMerge((_a = result[key]) != null ? _a : {}, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}
function createPivot(container, input, opts = {}) {
  var _a, _b;
  const locale = opts.locale != null && locales[opts.locale] != null ? opts.locale : "en";
  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  const defaults = {
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    filter: () => true,
    aggregator: aggregatorTemplates.count()(),
    aggregatorName: "Count",
    sorters: {},
    derivedAttributes: {},
    renderer: pivotTableRenderer
  };
  const fullOpts = deepMerge(
    { rendererOptions: { localeStrings }, localeStrings },
    Object.assign({}, defaults, opts)
  );
  let result = document.createElement("span");
  try {
    const DataClass = (_a = fullOpts.dataClass) != null ? _a : PivotData;
    const pivotData = new DataClass(input, fullOpts);
    try {
      result = ((_b = fullOpts.renderer) != null ? _b : pivotTableRenderer)(pivotData, fullOpts.rendererOptions);
    } catch (e) {
      console.error(e);
      result.textContent = localeStrings.renderError;
    }
  } catch (e) {
    console.error(e);
    result.textContent = localeStrings.computeError;
  }
  container.innerHTML = "";
  container.appendChild(result);
}
var pivotUtilities = {
  aggregatorTemplates,
  aggregators,
  renderers,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  getSort,
  PivotData,
  PivotStream
};
export {
  createPivot,
  pivotUtilities
};
//# sourceMappingURL=vanilla.mjs.map