"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/renderers/chartjs.ts
var chartjs_exports = {};
__export(chartjs_exports, {
  chartjsRenderers: () => chartjsRenderers
});
module.exports = __toCommonJS(chartjs_exports);
var import_chart = require("chart.js");
import_chart.Chart.register(
  import_chart.BarController,
  import_chart.LineController,
  import_chart.PieController,
  import_chart.ScatterController,
  import_chart.BarElement,
  import_chart.LineElement,
  import_chart.PointElement,
  import_chart.ArcElement,
  import_chart.CategoryScale,
  import_chart.LinearScale,
  import_chart.Legend,
  import_chart.Tooltip,
  import_chart.Filler
);
var PALETTE = [
  "rgba( 31, 119, 180, 0.8)",
  "rgba(255, 127,  14, 0.8)",
  "rgba( 44, 160,  44, 0.8)",
  "rgba(214,  39,  40, 0.8)",
  "rgba(148, 103, 189, 0.8)",
  "rgba(140,  86,  75, 0.8)",
  "rgba(227, 119, 194, 0.8)",
  "rgba(127, 127, 127, 0.8)",
  "rgba(188, 189,  34, 0.8)",
  "rgba( 23, 190, 207, 0.8)"
];
function colour(i) {
  return PALETTE[i % PALETTE.length];
}
function colourSolid(i) {
  return colour(i).replace("0.8", "1");
}
function keyLabel(key) {
  return key.length === 0 ? "(blank)" : key.join(" \u2013 ");
}
function numericValue(pivotData, rowKey, colKey) {
  const raw = pivotData.getAggregator(rowKey, colKey).value();
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return isFinite(n) ? n : 0;
}
function noDataDiv() {
  const div = document.createElement("div");
  div.textContent = "No data to display.";
  div.style.cssText = "padding:1em;font-style:italic;color:#666;";
  return div;
}
function makeCanvas() {
  const wrap = document.createElement("div");
  wrap.style.cssText = "position:relative;width:100%;min-height:520px;";
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  return { wrap, canvas };
}
function makeCartesianRenderer(cfg) {
  return function renderer(pivotData, _opts) {
    const rowKeys = pivotData.getRowKeys();
    const colKeys = pivotData.getColKeys();
    if (rowKeys.length === 0 || colKeys.length === 0) return noDataDiv();
    const labels = colKeys.map(keyLabel);
    const datasets = rowKeys.map((rk, i) => {
      const base = {
        label: keyLabel(rk),
        data: colKeys.map((ck) => numericValue(pivotData, rk, ck)),
        backgroundColor: colour(i),
        borderColor: colourSolid(i),
        borderWidth: 1
      };
      return cfg.fill ? { ...base, fill: true } : base;
    });
    const { wrap, canvas } = makeCanvas();
    const scales = cfg.stacked ? { x: { stacked: true }, y: { stacked: true } } : {};
    const extraOpts = cfg.indexAxis === "y" ? { indexAxis: "y" } : {};
    new import_chart.Chart(canvas, {
      type: cfg.type,
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        ...extraOpts,
        plugins: { legend: { position: "top" } },
        scales
      }
    });
    return wrap;
  };
}
function scatterRenderer(pivotData, _opts) {
  var _a;
  const rowKeys = pivotData.getRowKeys();
  const colKeys = pivotData.getColKeys();
  if (rowKeys.length === 0 || colKeys.length === 0) return noDataDiv();
  const datasets = rowKeys.map((rk, i) => ({
    label: keyLabel(rk),
    data: colKeys.map((ck) => ({
      x: parseFloat(ck[0]) || 0,
      y: numericValue(pivotData, rk, ck)
    })),
    backgroundColor: colour(i),
    borderColor: colourSolid(i)
  }));
  const { wrap, canvas } = makeCanvas();
  new import_chart.Chart(canvas, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "top" } },
      scales: {
        x: { type: "linear", title: { display: !!pivotData.colAttrs[0], text: (_a = pivotData.colAttrs[0]) != null ? _a : "" } },
        y: { type: "linear" }
      }
    }
  });
  return wrap;
}
function multiplePieRenderer(pivotData, _opts) {
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
    new import_chart.Chart(canvas, {
      type: "pie",
      data: {
        labels,
        datasets: [{
          data: colKeys.map((ck) => numericValue(pivotData, rk, ck)),
          backgroundColor: bgColors
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } }
      }
    });
  }
  return container;
}
var chartjsRenderers = {
  "Bar Chart": makeCartesianRenderer({ type: "bar" }),
  "Stacked Bar Chart": makeCartesianRenderer({ type: "bar", stacked: true }),
  "Horizontal Bar Chart": makeCartesianRenderer({ type: "bar", indexAxis: "y" }),
  "Line Chart": makeCartesianRenderer({ type: "line" }),
  "Area Chart": makeCartesianRenderer({ type: "line", fill: true }),
  "Scatter Chart": scatterRenderer,
  "Multiple Pie Chart": multiplePieRenderer
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  chartjsRenderers
});
//# sourceMappingURL=chartjs.js.map