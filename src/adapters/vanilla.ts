/*
 * Vanilla JS adapter — zero jQuery dependency.
 *
 * Step 3: createPivot() — thin renderer wrapper (equiv. of $.fn.pivot)
 * Step 4+: createPivotUI() — full drag-and-drop UI (coming next)
 */

import {
  PivotData,
  PivotStream,
  PivotDataInstance,
  PivotDataOptions,
  RendererOptions,
  aggregatorTemplates,
  aggregators,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  getSort,
  pivotTableRenderer,
  renderers,
} from "../pivot";

// Deep-merge plain objects — same logic as in jquery.ts.
// Extracted here so the vanilla adapter has no jQuery dependency at all.
// Will be moved to a shared src/utils.ts once there are 3+ consumers.
function deepMerge(...sources: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {};
  for (const src of sources) {
    if (src == null) continue;
    for (const key of Object.keys(src)) {
      const val = src[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val) && typeof val !== "function") {
        result[key] = deepMerge(result[key] ?? {}, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

// ─── PivotOptions ─────────────────────────────────────────────────────────
// Extends PivotDataOptions with adapter-level concerns (renderer, locale, etc.)

export interface PivotOptions extends PivotDataOptions {
  renderer?:        (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement;
  rendererOptions?: RendererOptions;
  dataClass?:       new (input: any, opts?: PivotDataOptions) => PivotDataInstance;
  locale?:          string;
}

// ─── createPivot ──────────────────────────────────────────────────────────
// Renders a static pivot table into `container`.
// Vanilla equivalent of $(el).pivot(input, opts).

export function createPivot(
  container: HTMLElement,
  input:     any,
  opts:      PivotOptions = {}
): void {
  const locale        = (opts.locale != null && locales[opts.locale] != null) ? opts.locale : "en";
  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);

  const defaults: PivotOptions = {
    cols:              [],
    rows:              [],
    vals:              [],
    rowOrder:          "key_a_to_z",
    colOrder:          "key_a_to_z",
    dataClass:         PivotData,
    filter:            () => true,
    aggregator:        aggregatorTemplates.count()(),
    aggregatorName:    "Count",
    sorters:           {},
    derivedAttributes: {},
    renderer:          pivotTableRenderer,
  };

  const fullOpts = deepMerge(
    { rendererOptions: { localeStrings }, localeStrings },
    Object.assign({}, defaults, opts)
  ) as PivotOptions;

  let result: HTMLElement = document.createElement("span");

  try {
    const DataClass = fullOpts.dataClass ?? PivotData;
    const pivotData = new DataClass(input, fullOpts);
    try {
      result = (fullOpts.renderer ?? pivotTableRenderer)(pivotData, fullOpts.rendererOptions);
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

// ─── pivotUtilities ───────────────────────────────────────────────────────
// Mirrors $.pivotUtilities — all core exports in one place for easy access.

export const pivotUtilities = {
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
  PivotStream,
};
