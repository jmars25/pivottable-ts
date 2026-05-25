/*
 * Chart.js renderers for PivotTable.
 *
 * Provides 7 renderers that return canvas-based charts instead of <table>
 * elements.  Pass them via the `renderers` option of createPivotUI.
 *
 * Peer dependency: chart.js >= 4.0.0
 *   npm install chart.js
 *
 * Usage:
 *   import { chartjsRenderers } from "@jmars25/pivottable-ts/renderers/chartjs";
 *   createPivotUI(el, data, { renderers: chartjsRenderers });
 *
 * Renderers exported:
 *   "Bar Chart"            – colKeys on x-axis, rowKeys as series
 *   "Stacked Bar Chart"    – same, stacked: true
 *   "Horizontal Bar Chart" – same, indexAxis: "y"
 *   "Line Chart"           – line, colKeys on x-axis, rowKeys as series
 *   "Area Chart"           – line with fill: true
 *   "Scatter Chart"        – colKey[0] → x (numeric), value → y, rowKeys as series
 *   "Multiple Pie Chart"   – one pie per rowKey; colKeys are the slices
 */

import {
  Chart,
  BarController,
  LineController,
  PieController,
  ScatterController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
} from "chart.js";

import type { PivotDataInstance, RendererOptions } from "../pivot";

// Register every component we use.  Only these ship — proper tree-shaking.
Chart.register(
  BarController,
  LineController,
  PieController,
  ScatterController,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  Legend,
  Tooltip,
  Filler,
);

// ─── Colour palette ──────────────────────────────────────────────────────────

const PALETTE = [
  "rgba( 31, 119, 180, 0.8)",
  "rgba(255, 127,  14, 0.8)",
  "rgba( 44, 160,  44, 0.8)",
  "rgba(214,  39,  40, 0.8)",
  "rgba(148, 103, 189, 0.8)",
  "rgba(140,  86,  75, 0.8)",
  "rgba(227, 119, 194, 0.8)",
  "rgba(127, 127, 127, 0.8)",
  "rgba(188, 189,  34, 0.8)",
  "rgba( 23, 190, 207, 0.8)",
];

function colour(i: number): string {
  return PALETTE[i % PALETTE.length];
}

function colourSolid(i: number): string {
  return colour(i).replace("0.8", "1");
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Human-readable label for a composite key. */
function keyLabel(key: string[]): string {
  return key.length === 0 ? "(blank)" : key.join(" – ");
}

/** Safely pull a numeric value from the aggregator; returns 0 for non-finite. */
function numericValue(
  pivotData: PivotDataInstance,
  rowKey: string[],
  colKey: string[],
): number {
  const raw = pivotData.getAggregator(rowKey, colKey).value();
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return isFinite(n) ? n : 0;
}

/** "No data" placeholder div. */
function noDataDiv(): HTMLDivElement {
  const div = document.createElement("div");
  div.textContent = "No data to display.";
  div.style.cssText = "padding:1em;font-style:italic;color:#666;";
  return div;
}

/** Responsive wrapper with a fresh canvas inside. */
function makeCanvas(): { wrap: HTMLDivElement; canvas: HTMLCanvasElement } {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:100%;min-height:520px;";
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  return { wrap, canvas };
}

// ─── Cartesian renderers (bar, line, area, horizontal bar) ───────────────────
//
// Layout: colKeys → x-axis categories, rowKeys → datasets/series.

interface CartesianConfig {
  type:       "bar" | "line";
  stacked?:   boolean;
  indexAxis?: "x" | "y";
  fill?:      boolean;
}

function makeCartesianRenderer(cfg: CartesianConfig) {
  return function renderer(
    pivotData: PivotDataInstance,
    _opts?: RendererOptions,
  ): HTMLElement {
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0 || colKeys.length === 0) return noDataDiv();

    const labels = colKeys.map(keyLabel);

    const datasets = rowKeys.map((rk, i) => {
      const base = {
        label:           keyLabel(rk),
        data:            colKeys.map(ck => numericValue(pivotData, rk, ck)),
        backgroundColor: colour(i),
        borderColor:     colourSolid(i),
        borderWidth:     1,
      };
      return cfg.fill ? { ...base, fill: true } : base;
    });

    const { wrap, canvas } = makeCanvas();

    const scales: Record<string, object> = cfg.stacked
      ? { x: { stacked: true }, y: { stacked: true } }
      : {};

    // Chart.js v4 indexAxis is a top-level option on cartesian charts
    const extraOpts = cfg.indexAxis === "y" ? { indexAxis: "y" as const } : {};

    new Chart(canvas, {
      type: cfg.type,
      data: { labels, datasets } as any,
      options: {
        responsive:  true,
        maintainAspectRatio: false,
        ...extraOpts,
        plugins: { legend: { position: "top" } },
        scales,
      } as any,
    });

    return wrap;
  };
}

// ─── Scatter Chart ───────────────────────────────────────────────────────────
//
// Treats colKey[0] as the numeric x-value.
// Works best when the column attribute contains numeric values.

function scatterRenderer(
  pivotData: PivotDataInstance,
  _opts?: RendererOptions,
): HTMLElement {
  const rowKeys = pivotData.getRowKeys();
  const colKeys = pivotData.getColKeys();
  if (rowKeys.length === 0 || colKeys.length === 0) return noDataDiv();

  const datasets = rowKeys.map((rk, i) => ({
    label:           keyLabel(rk),
    data:            colKeys.map(ck => ({
      x: parseFloat(ck[0]) || 0,
      y: numericValue(pivotData, rk, ck),
    })),
    backgroundColor: colour(i),
    borderColor:     colourSolid(i),
  }));

  const { wrap, canvas } = makeCanvas();

  new Chart(canvas, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { type: "linear", title: { display: !!pivotData.colAttrs[0], text: pivotData.colAttrs[0] ?? "" } },
        y: { type: "linear" },
      },
    },
  });

  return wrap;
}

// ─── Multiple Pie Chart ──────────────────────────────────────────────────────
//
// One pie per rowKey (or one pie total when there are no rowAttrs).
// Slices correspond to colKeys; values are the aggregated cell values.

function multiplePieRenderer(
  pivotData: PivotDataInstance,
  _opts?: RendererOptions,
): HTMLElement {
  const rowKeys = pivotData.getRowKeys();
  const colKeys = pivotData.getColKeys();

  const container = document.createElement("div");
  container.style.cssText = "display:flex;flex-wrap:wrap;gap:1em;padding:0.5em;";

  if (rowKeys.length === 0 || colKeys.length === 0) {
    container.appendChild(noDataDiv());
    return container;
  }

  const labels = colKeys.map(keyLabel);
  const bgColors = colKeys.map((_, i) => colour(i));

  for (const rk of rowKeys) {
    const pieWrap = document.createElement("div");
    pieWrap.style.cssText = "position:relative;width:360px;height:400px;";

    const titleEl = document.createElement("p");
    titleEl.textContent = keyLabel(rk);
    titleEl.style.cssText = "margin:0 0 4px;text-align:center;font-weight:bold;font-size:0.9em;";
    pieWrap.appendChild(titleEl);

    const canvas = document.createElement("canvas");
    pieWrap.appendChild(canvas);
    container.appendChild(pieWrap);

    new Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data:            colKeys.map(ck => numericValue(pivotData, rk, ck)),
          backgroundColor: bgColors,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
      },
    });
  }

  return container;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * Drop-in replacement for (or addition to) the default renderers map.
 *
 * @example
 * createPivotUI(el, data, { renderers: chartjsRenderers });
 *
 * @example  // merge with table renderers
 * import { pivotUtilities } from "@jmars25/pivottable-ts/vanilla";
 * createPivotUI(el, data, {
 *   renderers: { ...pivotUtilities.renderers, ...chartjsRenderers },
 * });
 */
export const chartjsRenderers: Record<
  string,
  (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement
> = {
  "Bar Chart":            makeCartesianRenderer({ type: "bar" }),
  "Stacked Bar Chart":    makeCartesianRenderer({ type: "bar", stacked: true }),
  "Horizontal Bar Chart": makeCartesianRenderer({ type: "bar", indexAxis: "y" }),
  "Line Chart":           makeCartesianRenderer({ type: "line" }),
  "Area Chart":           makeCartesianRenderer({ type: "line", fill: true }),
  "Scatter Chart":        scatterRenderer,
  "Multiple Pie Chart":   multiplePieRenderer,
};
