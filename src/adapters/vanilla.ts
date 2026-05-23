/*
 * Vanilla JS adapter — zero jQuery dependency.
 *
 * Exports:
 *   createPivot()    — static pivot table renderer  (replaces $.fn.pivot)
 *   createPivotUI()  — full drag-and-drop UI        (replaces $.fn.pivotUI)
 *   pivotUtilities   — namespace object             (replaces $.pivotUtilities)
 */

import Sortable from "sortablejs";

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

// ─── Shared helpers ───────────────────────────────────────────────────────

// Tiny element factory — avoids typing document.createElement everywhere.
function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}

// Deep-merge plain objects — same logic as jquery.ts.
// Will move to src/utils.ts once there are 3+ consumers.
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

export interface PivotOptions extends PivotDataOptions {
  renderer?:        (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement;
  rendererOptions?: RendererOptions;
  dataClass?:       new (input: any, opts?: PivotDataOptions) => PivotDataInstance;
  locale?:          string;
  /** Locale string overrides (e.g. button labels, error messages). */
  localeStrings?:   Record<string, any>;
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

  let result: HTMLElement = el("span");

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

// ─── PivotUIOptions ───────────────────────────────────────────────────────

export interface PivotUIOptions extends PivotOptions {
  aggregators?:           Record<string, any>;
  renderers?:             Record<string, (data: PivotDataInstance, opts?: any) => HTMLElement>;
  rendererName?:          string;
  hiddenAttributes?:      string[];
  hiddenFromAggregators?: string[];
  hiddenFromDragDrop?:    string[];
  menuLimit?:             number;
  exclusions?:            Record<string, string[]>;
  inclusions?:            Record<string, string[]>;
  unusedAttrsVertical?:   boolean | number | "auto";
  autoSortUnusedAttrs?:   boolean;
  onRefresh?:             ((opts: Record<string, any>) => void) | null;
  showUI?:                boolean;
}

// State map — replaces jQuery's .data("pivotUIOptions") on the element.
// WeakMap means the stored state is garbage-collected when the element is removed.
const uiState = new WeakMap<HTMLElement, PivotUIOptions>();

// ─── PivotUIHandle ────────────────────────────────────────────────────────
// Returned by createPivotUI. Call destroy() to tear down the UI and free
// SortableJS instances (important in SPA / framework component unmount).

export interface PivotUIHandle {
  /** Remove the pivot UI from the container and free all resources. */
  destroy(): void;
}

// ─── Heatmap post-processor ───────────────────────────────────────────────
// Vanilla equivalent of $.fn.heatmap().
// Takes the <table> element returned by pivotTableRenderer and colorizes cells
// by value.  Returns the same element so it can be used inline as a renderer.

export interface HeatmapOptions {
  heatmap?: {
    /** Override the default red-scale color generator. */
    colorScaleGenerator?: (values: number[]) => (x: number) => string;
  };
}

export function heatmap(
  table: HTMLElement,
  scope: "heatmap" | "rowheatmap" | "colheatmap" = "heatmap",
  opts?: HeatmapOptions
): HTMLElement {
  const numRows = parseInt(table.dataset.numrows ?? "0", 10);
  const numCols = parseInt(table.dataset.numcols ?? "0", 10);

  const colorGen =
    opts?.heatmap?.colorScaleGenerator ??
    ((values: number[]) => {
      const min = Math.min(...values);
      const max = Math.max(...values);
      return (x: number) => {
        const nonRed = 255 - Math.round(255 * (x - min) / (max - min));
        return `rgb(255,${nonRed},${nonRed})`;
      };
    });

  const applyScale = (selector: string) => {
    const cells:  HTMLElement[] = [];
    const values: number[]      = [];
    table.querySelectorAll<HTMLElement>(selector).forEach(td => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) { cells.push(td); values.push(x); }
      }
    });
    if (values.length === 0) return;
    const scale = colorGen(values);
    cells.forEach((td, i) => { td.style.backgroundColor = scale(values[i]); });
  };

  switch (scope) {
    case "heatmap":    applyScale(".pvtVal"); break;
    case "rowheatmap": for (let i = 0; i < numRows; i++) applyScale(`.pvtVal.row${i}`); break;
    case "colheatmap": for (let j = 0; j < numCols; j++) applyScale(`.pvtVal.col${j}`); break;
  }
  applyScale(".pvtTotal.rowTotal");
  applyScale(".pvtTotal.colTotal");
  return table;
}

// ─── Barchart post-processor ──────────────────────────────────────────────
// Vanilla equivalent of $.fn.barchart().
// Replaces each data cell's text with a proportional bar + label.

export function barchart(table: HTMLElement): HTMLElement {
  const numRows = parseInt(table.dataset.numrows ?? "0", 10);

  const applyBars = (selector: string) => {
    const cells:  HTMLElement[] = [];
    const values: number[]      = [];
    table.querySelectorAll<HTMLElement>(selector).forEach(td => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) { cells.push(td); values.push(x); }
      }
    });
    if (values.length === 0) return;

    let max = Math.max(...values);
    if (max < 0) max = 0;
    const min   = Math.min(...values);
    const range = min < 0 ? max - min : max;
    const scale = (x: number) => (100 * x) / (1.4 * range);

    cells.forEach((td, i) => {
      const x    = values[i];
      const text = td.textContent ?? "";

      let bgColor = "gray";
      let bBase   = min < 0 ? scale(-min) : 0;
      let barX    = x;

      if (x < 0) { bBase += scale(x); bgColor = "darkred"; barX = -x; }

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;height:55px";

      const bar = document.createElement("div");
      bar.style.cssText =
        `position:absolute;bottom:${bBase}%;left:0;right:0;` +
        `height:${scale(barX)}%;background-color:${bgColor}`;

      const label = document.createElement("div");
      label.textContent   = text;
      label.style.cssText = "position:relative;padding-left:5px;padding-right:5px";

      wrapper.append(bar, label);
      td.style.cssText = "padding:0;padding-top:5px;text-align:center";
      td.innerHTML     = "";
      td.appendChild(wrapper);
    });
  };

  for (let i = 0; i < numRows; i++) applyBars(`.pvtVal.row${i}`);
  applyBars(".pvtTotal.colTotal");
  return table;
}

// ─── Vanilla renderer set ─────────────────────────────────────────────────
// Drop-in equivalents of the jQuery-only "Table Barchart" / Heatmap renderers.
// Each is a standard renderer function: (pivotData, opts?) → HTMLElement.

export const vanillaRenderers: Record<string, (data: PivotDataInstance, opts?: any) => HTMLElement> = {
  "Table Barchart": (data, opts) => barchart(pivotTableRenderer(data, opts)),
  "Heatmap":        (data, opts) => heatmap(pivotTableRenderer(data, opts), "heatmap",    opts),
  "Row Heatmap":    (data, opts) => heatmap(pivotTableRenderer(data, opts), "rowheatmap", opts),
  "Col Heatmap":    (data, opts) => heatmap(pivotTableRenderer(data, opts), "colheatmap", opts),
};

// ─── createPivotUI ────────────────────────────────────────────────────────
// Full drag-and-drop pivot UI — vanilla equivalent of $(el).pivotUI(input, opts).

export function createPivotUI(
  container: HTMLElement,
  input:     any,
  inputOpts: PivotUIOptions = {},
  overwrite: boolean        = false,
  locale:    string         = "en"
): PivotUIHandle {
  if (locales[locale] == null) locale = "en";

  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);

  const defaults: PivotUIOptions = {
    derivedAttributes:     {},
    aggregators:           locales[locale].aggregators,
    renderers:             Object.assign({}, renderers, vanillaRenderers),
    hiddenAttributes:      [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop:    [],
    menuLimit:             500,
    cols:                  [],
    rows:                  [],
    vals:                  [],
    rowOrder:              "key_a_to_z",
    colOrder:              "key_a_to_z",
    dataClass:             PivotData,
    exclusions:            {},
    inclusions:            {},
    unusedAttrsVertical:   85,
    autoSortUnusedAttrs:   false,
    onRefresh:             null,
    showUI:                true,
    filter:                () => true,
    sorters:               {},
  };

  const existingOpts = uiState.get(container);
  const opts = (!existingOpts || overwrite)
    ? deepMerge({ rendererOptions: { localeStrings }, localeStrings }, Object.assign({}, defaults, inputOpts)) as PivotUIOptions
    : existingOpts;

  try {

    // ── 1. Materialize input ───────────────────────────────────────────────
    // Scan every record once to build:
    //   attrValues        — { attr: { value: count } }  (for filter checkboxes)
    //   materializedInput — filtered copy of all records (re-used on every refresh)

    const attrValues:        Record<string, Record<string, number>> = {};
    const materializedInput: Record<string, any>[]                  = [];
    let   recordsProcessed = 0;

    PivotData.forEachRecord(input, opts.derivedAttributes ?? {}, (record) => {
      if (!opts.filter!(record)) return;
      materializedInput.push(record);
      for (const attr of Object.keys(record)) {
        if (attrValues[attr] == null) {
          attrValues[attr] = {};
          if (recordsProcessed > 0) attrValues[attr]["null"] = recordsProcessed;
        }
      }
      for (const attr of Object.keys(attrValues)) {
        const value = record[attr] != null ? String(record[attr]) : "null";
        attrValues[attr][value] = (attrValues[attr][value] ?? 0) + 1;
      }
      recordsProcessed++;
    });

    // ── 2. Determine visible attribute lists ───────────────────────────────

    const shownAttributes    = Object.keys(attrValues).filter(a => !(opts.hiddenAttributes    ?? []).includes(a));
    const shownInAggregators = shownAttributes.filter(a =>          !(opts.hiddenFromAggregators ?? []).includes(a));
    const shownInDragDrop    = shownAttributes.filter(a =>          !(opts.hiddenFromDragDrop    ?? []).includes(a));

    // ── 3. Unused-attrs orientation ────────────────────────────────────────

    let unusedVertical = opts.unusedAttrsVertical === true;
    if (!unusedVertical && opts.unusedAttrsVertical !== false) {
      const cutoff = opts.unusedAttrsVertical === "auto" ? 120 : Number(opts.unusedAttrsVertical);
      if (!isNaN(cutoff)) {
        unusedVertical = shownInDragDrop.reduce((sum, a) => sum + a.length, 0) > cutoff;
      }
    }

    // ── 4. Renderer select ─────────────────────────────────────────────────

    const rendererControl = el("td", "pvtUiCell");
    const rendererSelect  = el("select", "pvtRenderer");
    for (const name of Object.keys(opts.renderers ?? {})) {
      const o = el("option"); o.value = name; o.textContent = name;
      rendererSelect.appendChild(o);
    }
    rendererControl.appendChild(rendererSelect);

    // ── 5. Unused attrs container + attribute filter pills ─────────────────

    const unused = el("td", `pvtAxisContainer pvtUnused pvtUiCell ${unusedVertical ? "pvtVertList" : "pvtHorizList"}`);

    for (let i = 0; i < shownInDragDrop.length; i++) {
      const attr   = shownInDragDrop[i];
      const values = Object.keys(attrValues[attr]);

      // Filter popup box
      const filterBox = el("div", "pvtFilterBox");
      filterBox.style.display = "none";

      const h4 = el("h4");
      const nameSpan  = el("span"); nameSpan.textContent = attr;
      const countSpan = el("span", "count"); countSpan.textContent = `(${values.length})`;
      h4.append(nameSpan, countSpan);
      filterBox.appendChild(h4);

      let hasExcludedItem = false;

      if (values.length > (opts.menuLimit ?? 500)) {
        const p = el("p"); p.innerHTML = localeStrings.tooMany;
        filterBox.appendChild(p);
      } else {
        // Search + Select All/None controls (only shown when > 5 values)
        if (values.length > 5) {
          const controls  = el("p");
          const sorter    = getSort(opts.sorters, attr);
          const searchBox = el("input");
          searchBox.className   = "pvtSearch";
          searchBox.setAttribute("type", "text");
          searchBox.setAttribute("placeholder", localeStrings.filterResults);

          searchBox.addEventListener("keyup", () => {
            const filter    = (searchBox as HTMLInputElement).value.toLowerCase().trim();
            const acceptGen = (prefix: string, accepted: number[]) => (v: string) => {
              const real = filter.substring(prefix.length).trim();
              return real.length === 0 || accepted.includes(Math.sign(sorter(v.toLowerCase(), real)));
            };
            const accept: (v: string) => boolean =
              filter.startsWith(">=") ? acceptGen(">=", [1, 0])  :
              filter.startsWith("<=") ? acceptGen("<=", [-1, 0]) :
              filter.startsWith(">")  ? acceptGen(">",  [1])     :
              filter.startsWith("<")  ? acceptGen("<",  [-1])    :
              filter.startsWith("~")  ? (v) => filter.length <= 1 || !!v.toLowerCase().match(filter.slice(1)) :
                                        (v) => v.toLowerCase().includes(filter);

            filterBox.querySelectorAll<HTMLElement>(".pvtCheckContainer p").forEach(p => {
              const span = p.querySelector<HTMLElement>("label span.value");
              p.style.display = span && accept(span.textContent ?? "") ? "" : "none";
            });
          });

          const selectAllBtn  = el("button"); (selectAllBtn as HTMLButtonElement).type  = "button";
          const selectNoneBtn = el("button"); (selectNoneBtn as HTMLButtonElement).type = "button";
          selectAllBtn.innerHTML  = localeStrings.selectAll;
          selectNoneBtn.innerHTML = localeStrings.selectNone;

          selectAllBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll<HTMLInputElement>("input.pvtFilter").forEach(cb => {
              if (cb.offsetParent !== null && !cb.checked) { cb.checked = true; cb.classList.toggle("changed"); }
            });
          });
          selectNoneBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll<HTMLInputElement>("input.pvtFilter").forEach(cb => {
              if (cb.offsetParent !== null && cb.checked) { cb.checked = false; cb.classList.toggle("changed"); }
            });
          });

          controls.append(searchBox, el("br"), selectAllBtn, selectNoneBtn);
          filterBox.appendChild(controls);
        }

        // Checkbox list
        const checkContainer = el("div", "pvtCheckContainer");
        const sortedVals = [...values].sort(getSort(opts.sorters, attr));

        for (const value of sortedVals) {
          const valueCount = attrValues[attr][value];
          let excluded = false;
          if ((opts.inclusions ?? {})[attr]) {
            excluded = !opts.inclusions![attr].includes(value);
          } else if ((opts.exclusions ?? {})[attr]) {
            excluded = opts.exclusions![attr].includes(value);
          }
          hasExcludedItem = hasExcludedItem || excluded;

          const cb = el("input") as HTMLInputElement;
          cb.type  = "checkbox";
          cb.className = "pvtFilter";
          cb.checked   = !excluded;
          cb.dataset.filterAttr  = attr;
          cb.dataset.filterValue = value;
          cb.addEventListener("change", () => cb.classList.toggle("changed"));

          const valSpan = el("span", "value"); valSpan.textContent = value;
          const cntSpan = el("span", "count"); cntSpan.textContent = `(${valueCount})`;
          const label = el("label");
          label.append(cb, valSpan, cntSpan);
          const row = el("p"); row.appendChild(label);
          checkContainer.appendChild(row);
        }
        filterBox.appendChild(checkContainer);
      }

      // Close handler — hides box, updates filtered indicator on pill
      const attrElem = el("li", `axis_${i}`);   // declared before closeFilterBox uses it
      const closeFilterBox = () => {
        const all     = filterBox.querySelectorAll("[type='checkbox']").length;
        const checked = filterBox.querySelectorAll("[type='checkbox']:checked").length;
        attrElem.classList.toggle("pvtFilteredAttribute", all > checked);
        const search = filterBox.querySelector<HTMLInputElement>(".pvtSearch");
        if (search) search.value = "";
        filterBox.querySelectorAll<HTMLElement>(".pvtCheckContainer p").forEach(p => p.style.display = "");
        filterBox.style.display = "none";
      };

      // Apply / Cancel buttons
      const finalBtns = el("p");
      if (values.length <= (opts.menuLimit ?? 500)) {
        const applyBtn = el("button"); (applyBtn as HTMLButtonElement).type = "button";
        applyBtn.textContent = localeStrings.apply;
        applyBtn.addEventListener("click", () => {
          const changed = [...filterBox.querySelectorAll(".changed")];
          changed.forEach(n => n.classList.remove("changed"));
          if (changed.length > 0) refresh();
          closeFilterBox();
        });
        finalBtns.appendChild(applyBtn);
      }
      const cancelBtn = el("button"); (cancelBtn as HTMLButtonElement).type = "button";
      cancelBtn.textContent = localeStrings.cancel;
      cancelBtn.addEventListener("click", () => {
        filterBox.querySelectorAll<HTMLInputElement>(".changed:checked").forEach(cb => {
          cb.classList.remove("changed"); cb.checked = false;
        });
        filterBox.querySelectorAll<HTMLInputElement>(".changed:not(:checked)").forEach(cb => {
          cb.classList.remove("changed"); cb.checked = true;
        });
        closeFilterBox();
      });
      finalBtns.appendChild(cancelBtn);
      filterBox.appendChild(finalBtns);

      // Triangle toggle — opens filter box near the click position
      const triangleLink = el("span", "pvtTriangle");
      triangleLink.innerHTML = " &#x25BE;";
      triangleLink.addEventListener("click", (e) => {
        const trigRect   = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const tableRect  = uiTable.getBoundingClientRect();
        filterBox.style.left    = `${trigRect.left - tableRect.left + 10}px`;
        filterBox.style.top     = `${trigRect.top  - tableRect.top  + 10}px`;
        filterBox.style.display = "";
      });

      // Attribute pill
      const attrSpan = el("span", "pvtAttr");
      attrSpan.textContent     = attr;
      attrSpan.dataset.attrName = attr;
      attrSpan.appendChild(triangleLink);
      attrElem.appendChild(attrSpan);
      if (hasExcludedItem) attrElem.classList.add("pvtFilteredAttribute");

      unused.appendChild(attrElem);
      unused.appendChild(filterBox);
    }

    // ── 6. Aggregator select + sort-order arrows ───────────────────────────

    const aggregatorSelect = el("select", "pvtAggregator");
    for (const name of Object.keys(opts.aggregators ?? {})) {
      const o = el("option"); o.value = name; o.textContent = name;
      aggregatorSelect.appendChild(o);
    }

    const ordering: Record<string, { rowSymbol: string; colSymbol: string; next: string }> = {
      key_a_to_z:   { rowSymbol: "&varr;", colSymbol: "&harr;", next: "value_a_to_z" },
      value_a_to_z: { rowSymbol: "&darr;", colSymbol: "&rarr;", next: "value_z_to_a" },
      value_z_to_a: { rowSymbol: "&uarr;", colSymbol: "&larr;", next: "key_a_to_z"   },
    };

    const rowOrderBtn = el("a", "pvtRowOrder");
    rowOrderBtn.setAttribute("role", "button");
    rowOrderBtn.dataset.order = opts.rowOrder ?? "key_a_to_z";
    rowOrderBtn.innerHTML     = ordering[rowOrderBtn.dataset.order].rowSymbol;
    rowOrderBtn.addEventListener("click", () => {
      rowOrderBtn.dataset.order = ordering[rowOrderBtn.dataset.order!].next;
      rowOrderBtn.innerHTML     = ordering[rowOrderBtn.dataset.order].rowSymbol;
      refresh();
    });

    const colOrderBtn = el("a", "pvtColOrder");
    colOrderBtn.setAttribute("role", "button");
    colOrderBtn.dataset.order = opts.colOrder ?? "key_a_to_z";
    colOrderBtn.innerHTML     = ordering[colOrderBtn.dataset.order].colSymbol;
    colOrderBtn.addEventListener("click", () => {
      colOrderBtn.dataset.order = ordering[colOrderBtn.dataset.order!].next;
      colOrderBtn.innerHTML     = ordering[colOrderBtn.dataset.order].colSymbol;
      refresh();
    });

    // ── 7. Build the 2×2 UI table layout ──────────────────────────────────
    //
    //  Horizontal layout (default):
    //    [ renderer | unused attrs                      ]
    //    [ vals+arrows | cols drop zone                 ]
    //    [ rows drop zone | pivot table                 ]
    //
    //  Vertical layout (unusedAttrsVertical = true):
    //    [ renderer | vals+arrows | cols drop zone      ]
    //    [ unused attrs | rows drop zone | pivot table  ]

    const uiTable = el("table", "pvtUi");
    uiTable.setAttribute("cellpadding", "5");

    const valsCell = el("td", "pvtVals pvtUiCell");
    valsCell.append(aggregatorSelect, rowOrderBtn, colOrderBtn, el("br"));

    const colsCell = el("td", "pvtAxisContainer pvtHorizList pvtCols pvtUiCell");
    const tr1      = el("tr");
    tr1.append(valsCell, colsCell);

    const rowsCell       = el("td", "pvtAxisContainer pvtRows pvtUiCell");
    rowsCell.setAttribute("valign", "top");
    const pivotTableCell = el("td", "pvtRendererArea");
    pivotTableCell.setAttribute("valign", "top");
    const tr2 = el("tr");
    tr2.append(rowsCell, pivotTableCell);

    if (unusedVertical) {
      // Renderer goes before valsCell in tr1, unused before rowsCell in tr2
      tr1.insertBefore(rendererControl, tr1.firstChild);
      tr2.insertBefore(unused, tr2.firstChild);
      uiTable.append(tr1, tr2);
    } else {
      // Renderer and unused share a top row above the main layout
      const topRow = el("tr");
      topRow.append(rendererControl, unused);
      uiTable.append(topRow, tr1, tr2);
    }

    container.innerHTML = "";
    container.appendChild(uiTable);

    // Move initially configured cols/rows from unused into their drop zones
    for (const colAttr of (opts.cols ?? [])) {
      const idx = shownInDragDrop.indexOf(colAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) colsCell.appendChild(pill);
    }
    for (const rowAttr of (opts.rows ?? [])) {
      const idx = shownInDragDrop.indexOf(rowAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) rowsCell.appendChild(pill);
    }

    // Restore aggregator / renderer selections
    if (opts.aggregatorName) aggregatorSelect.value = opts.aggregatorName;
    if (opts.rendererName)   rendererSelect.value   = opts.rendererName;

    // Hide all UI cells when showUI is false (data-only render mode)
    if (!opts.showUI) {
      container.querySelectorAll<HTMLElement>(".pvtUiCell").forEach(c => c.style.display = "none");
    }

    // ── 8. Refresh ─────────────────────────────────────────────────────────
    // refreshDelayed does the actual work; refresh() sets opacity and debounces.

    let initialRender = true;

    const refreshDelayed = () => {

      // Collect current rows/cols from the DOM
      const currentRows: string[] = [];
      const currentCols: string[] = [];
      container.querySelectorAll<HTMLElement>(".pvtRows li span.pvtAttr").forEach(s => currentRows.push(s.dataset.attrName!));
      container.querySelectorAll<HTMLElement>(".pvtCols li span.pvtAttr").forEach(s => currentCols.push(s.dataset.attrName!));

      // Manage value-field dropdowns (added/removed based on aggregator's numInputs)
      let numInputsNeeded = (opts.aggregators as any)?.[aggregatorSelect.value]?.([])?.().numInputs ?? 0;
      const vals: string[] = [];

      for (const dd of [...container.querySelectorAll<HTMLSelectElement>(".pvtVals select.pvtAttrDropdown")]) {
        if (numInputsNeeded === 0) {
          dd.remove();
        } else {
          numInputsNeeded--;
          if (dd.value !== "") vals.push(dd.value);
        }
      }
      for (let t = 0; t < numInputsNeeded; t++) {
        const dd = el("select", "pvtAttrDropdown") as HTMLSelectElement;
        const emptyOpt = el("option") as HTMLOptionElement; emptyOpt.value = "";
        dd.appendChild(emptyOpt);
        for (const a of shownInAggregators) {
          const o = el("option") as HTMLOptionElement; o.value = a; o.textContent = a;
          dd.appendChild(o);
        }
        dd.addEventListener("change", refresh);
        valsCell.appendChild(dd);
      }

      if (initialRender) {
        const initVals = opts.vals ?? [];
        let vi = 0;
        container.querySelectorAll<HTMLSelectElement>(".pvtVals select.pvtAttrDropdown").forEach(dd => {
          dd.value = initVals[vi++] ?? "";
        });
        initialRender = false;
      }

      // Read current vals after dropdowns are synced
      const currentVals: string[] = [];
      container.querySelectorAll<HTMLSelectElement>(".pvtVals select.pvtAttrDropdown").forEach(dd => {
        if (dd.value !== "") currentVals.push(dd.value);
      });

      // Build exclusions from unchecked filter checkboxes
      const exclusions: Record<string, string[]> = {};
      container.querySelectorAll<HTMLInputElement>("input.pvtFilter:not(:checked)").forEach(cb => {
        const attr = cb.dataset.filterAttr!; const val = cb.dataset.filterValue!;
        (exclusions[attr] = exclusions[attr] ?? []).push(val);
      });

      // Build inclusions for attrs that have at least one exclusion
      const inclusions: Record<string, string[]> = {};
      container.querySelectorAll<HTMLInputElement>("input.pvtFilter:checked").forEach(cb => {
        const attr = cb.dataset.filterAttr!; const val = cb.dataset.filterValue!;
        if (exclusions[attr] != null) (inclusions[attr] = inclusions[attr] ?? []).push(val);
      });

      // Build subopts for this render pass
      const subopts: PivotOptions = {
        derivedAttributes: opts.derivedAttributes,
        localeStrings:     (opts as any).localeStrings,
        rendererOptions:   opts.rendererOptions,
        sorters:           opts.sorters,
        cols:              currentCols,
        rows:              currentRows,
        vals:              currentVals,
        dataClass:         opts.dataClass,
        aggregatorName:    aggregatorSelect.value,
        aggregator:        (opts.aggregators as any)[aggregatorSelect.value](currentVals),
        renderer:          (opts.renderers   as any)[rendererSelect.value],
        rowOrder:          rowOrderBtn.dataset.order as any,
        colOrder:          colOrderBtn.dataset.order as any,
        filter: (record) => {
          if (!opts.filter!(record)) return false;
          for (const k of Object.keys(exclusions)) {
            const v = record[k] != null ? String(record[k]) : "null";
            if (exclusions[k].includes(v)) return false;
          }
          return true;
        },
      };

      createPivot(pivotTableCell, materializedInput, subopts);

      // Persist state for re-initialisation without data re-scan
      const savedState: PivotUIOptions = Object.assign({}, opts, {
        cols:           currentCols,
        rows:           currentRows,
        vals:           currentVals,
        colOrder:       colOrderBtn.dataset.order,
        rowOrder:       rowOrderBtn.dataset.order,
        exclusions,
        inclusions,
        inclusionsInfo: inclusions,
        aggregatorName: aggregatorSelect.value,
        rendererName:   rendererSelect.value,
      });
      uiState.set(container, savedState);

      // Auto-sort unused attrs alphabetically if requested
      if (opts.autoSortUnusedAttrs) {
        const uc = container.querySelector<HTMLElement>("td.pvtUnused.pvtAxisContainer");
        if (uc) {
          [...uc.querySelectorAll<HTMLElement>("li")]
            .sort((a, b) => naturalSort(a.textContent ?? "", b.textContent ?? ""))
            .forEach(li => uc.appendChild(li));
        }
      }

      pivotTableCell.style.opacity = "1";
      opts.onRefresh?.(savedState);
    };

    const refresh = () => {
      pivotTableCell.style.opacity = "0.5";
      setTimeout(refreshDelayed, 10);
    };

    aggregatorSelect.addEventListener("change", refresh);
    rendererSelect.addEventListener("change",   refresh);

    // ── 9. Drag-and-drop (SortableJS) ─────────────────────────────────────
    // One Sortable instance per axis container (rows, cols, unused).
    // Shared group name means items can be dragged freely between all three.
    // onEnd fires once per drop — no need for a sender-check like jQuery UI.

    const sortables: Sortable[] = [];
    container.querySelectorAll<HTMLElement>(".pvtAxisContainer").forEach(axisEl => {
      sortables.push(
        Sortable.create(axisEl, {
          group:      "pvtAttrs",
          animation:  150,
          filter:     ".pvtFilterBox",     // don't accidentally drag the popup
          ghostClass: "pvtPlaceholder",    // reuse pivot.css dashed-outline style
          onEnd:      refresh,
        })
      );
    });

    refresh();

    return {
      destroy() {
        sortables.forEach(s => s.destroy());
        container.innerHTML = "";
        uiState.delete(container);
      },
    };

  } catch (e) {
    console.error(e);
    container.textContent = localeStrings.uiRenderError;
    return { destroy() { container.innerHTML = ""; } };
  }
}

// ─── pivotUtilities ───────────────────────────────────────────────────────
// Mirrors $.pivotUtilities — all core exports in one namespace.

export const pivotUtilities = {
  aggregatorTemplates,
  aggregators,
  renderers,
  vanillaRenderers,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  getSort,
  heatmap,
  barchart,
  PivotData,
  PivotStream,
};
