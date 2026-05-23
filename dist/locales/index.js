"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/locales/index.ts
var locales_exports = {};
__export(locales_exports, {
  locales: () => locales
});
module.exports = __toCommonJS(locales_exports);

// src/pivot.ts
function addSeparators(nStr, thousandsSep, decimalSep) {
  nStr += "";
  const x = nStr.split(".");
  let x1 = x[0];
  const x2 = x.length > 1 ? decimalSep + x[1] : "";
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, "$1" + thousandsSep + "$2");
  }
  return x1 + x2;
}
function numberFormat(opts) {
  const defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ",",
    decimalSep: ".",
    prefix: "",
    suffix: ""
  };
  const merged = Object.assign({}, defaults, opts);
  return function(x) {
    if (isNaN(x) || !isFinite(x)) return "";
    const result = addSeparators(
      (merged.scaler * x).toFixed(merged.digitsAfterDecimal),
      merged.thousandsSep,
      merged.decimalSep
    );
    return "" + merged.prefix + result + merged.suffix;
  };
}
var usFmt = numberFormat();
var usFmtInt = numberFormat({ digitsAfterDecimal: 0 });
var usFmtPct = numberFormat({ digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
var rx = /(\d+)|(\D+)/g;
var rd = /\d/;
var rz = /^0/;
var naturalSort = function(as, bs) {
  if (bs != null && as == null) return -1;
  if (as != null && bs == null) return 1;
  if (typeof as === "number" && isNaN(as)) return -1;
  if (typeof bs === "number" && isNaN(bs)) return 1;
  const nas = +as;
  const nbs = +bs;
  if (nas < nbs) return -1;
  if (nas > nbs) return 1;
  if (typeof as === "number" && typeof bs !== "number") return -1;
  if (typeof bs === "number" && typeof as !== "number") return 1;
  if (typeof as === "number" && typeof bs === "number") return 0;
  if (isNaN(nbs) && !isNaN(nas)) return -1;
  if (isNaN(nas) && !isNaN(nbs)) return 1;
  const a = String(as);
  const b = String(bs);
  if (a === b) return 0;
  if (!(rd.test(a) && rd.test(b))) return a > b ? 1 : -1;
  const aParts = a.match(rx);
  const bParts = b.match(rx);
  while (aParts.length && bParts.length) {
    const a1 = aParts.shift();
    const b1 = bParts.shift();
    if (a1 !== b1) {
      if (rd.test(a1) && rd.test(b1)) {
        return a1.replace(rz, ".0") - b1.replace(rz, ".0");
      } else {
        return a1 > b1 ? 1 : -1;
      }
    }
  }
  return aParts.length - bParts.length;
};
var getSort = function(sorters, attr) {
  if (sorters != null) {
    if (typeof sorters === "function") {
      const sort = sorters(attr);
      if (typeof sort === "function") return sort;
    } else if (sorters[attr] != null) {
      return sorters[attr];
    }
  }
  return naturalSort;
};
var aggregatorTemplates = {
  count: function(formatter) {
    if (formatter == null) formatter = usFmtInt;
    return function() {
      return function(data, rowKey, colKey) {
        return {
          count: 0,
          push: function() {
            this.count++;
          },
          value: function() {
            return this.count;
          },
          format: formatter
        };
      };
    };
  },
  uniques: function(fn, formatter) {
    if (formatter == null) formatter = usFmtInt;
    return function(arg) {
      const attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          uniq: [],
          push: function(record) {
            if (this.uniq.indexOf(record[attr]) < 0) this.uniq.push(record[attr]);
          },
          value: function() {
            return fn(this.uniq);
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  sum: function(formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          sum: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[attr]))) this.sum += parseFloat(record[attr]);
          },
          value: function() {
            return this.sum;
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  extremes: function(mode, formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          val: null,
          sorter: getSort(data != null ? data.sorters : void 0, attr),
          push: function(record) {
            let x = record[attr];
            if (mode === "min" || mode === "max") {
              x = parseFloat(x);
              if (!isNaN(x)) this.val = Math[mode](x, this.val != null ? this.val : x);
            }
            if (mode === "first") {
              if (this.sorter(x, this.val != null ? this.val : x) <= 0) this.val = x;
            }
            if (mode === "last") {
              if (this.sorter(x, this.val != null ? this.val : x) >= 0) this.val = x;
            }
          },
          value: function() {
            return this.val;
          },
          format: function(x) {
            return isNaN(x) ? x : formatter(x);
          },
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  quantile: function(q, formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          vals: [],
          push: function(record) {
            const x = parseFloat(record[attr]);
            if (!isNaN(x)) this.vals.push(x);
          },
          value: function() {
            if (this.vals.length === 0) return null;
            this.vals.sort((a, b) => a - b);
            const i = (this.vals.length - 1) * q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2;
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  runningStat: function(mode = "mean", ddof = 1, formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const attr = arg[0];
      return function(data, rowKey, colKey) {
        return {
          n: 0,
          m: 0,
          s: 0,
          push: function(record) {
            const x = parseFloat(record[attr]);
            if (isNaN(x)) return;
            this.n += 1;
            if (this.n === 1) {
              this.m = x;
            } else {
              const m_new = this.m + (x - this.m) / this.n;
              this.s = this.s + (x - this.m) * (x - m_new);
              this.m = m_new;
            }
          },
          value: function() {
            if (mode === "mean") return this.n === 0 ? 0 / 0 : this.m;
            if (this.n <= ddof) return 0;
            if (mode === "var") return this.s / (this.n - ddof);
            if (mode === "stdev") return Math.sqrt(this.s / (this.n - ddof));
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },
  sumOverSum: function(formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const [num, denom] = arg;
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[num]))) this.sumNum += parseFloat(record[num]);
            if (!isNaN(parseFloat(record[denom]))) this.sumDenom += parseFloat(record[denom]);
          },
          value: function() {
            return this.sumNum / this.sumDenom;
          },
          format: formatter,
          numInputs: num != null && denom != null ? 0 : 2
        };
      };
    };
  },
  sumOverSumBound80: function(upper = true, formatter) {
    if (formatter == null) formatter = usFmt;
    return function(arg) {
      const [num, denom] = arg;
      return function(data, rowKey, colKey) {
        return {
          sumNum: 0,
          sumDenom: 0,
          push: function(record) {
            if (!isNaN(parseFloat(record[num]))) this.sumNum += parseFloat(record[num]);
            if (!isNaN(parseFloat(record[denom]))) this.sumDenom += parseFloat(record[denom]);
          },
          value: function() {
            const sign = upper ? 1 : -1;
            return (0.821187207574908 / this.sumDenom + this.sumNum / this.sumDenom + 1.2815515655446004 * sign * Math.sqrt(
              0.410593603787454 / (this.sumDenom * this.sumDenom) + this.sumNum * (1 - this.sumNum / this.sumDenom) / (this.sumDenom * this.sumDenom)
            )) / (1 + 1.642374415149816 / this.sumDenom);
          },
          format: formatter,
          numInputs: num != null && denom != null ? 0 : 2
        };
      };
    };
  },
  fractionOf: function(wrapped, type = "total", formatter) {
    if (formatter == null) formatter = usFmtPct;
    return function(...x) {
      return function(data, rowKey, colKey) {
        return {
          selector: { total: [[], []], row: [rowKey, []], col: [[], colKey] }[type],
          inner: wrapped.apply(null, x)(data, rowKey, colKey),
          push: function(record) {
            return this.inner.push(record);
          },
          format: formatter,
          value: function() {
            return this.inner.value() / data.getAggregator.apply(data, this.selector).inner.value();
          },
          numInputs: wrapped.apply(null, x)().numInputs
        };
      };
    };
  }
};
aggregatorTemplates.countUnique = (f) => aggregatorTemplates.uniques((x) => x.length, f);
aggregatorTemplates.listUnique = (s) => aggregatorTemplates.uniques((x) => x.sort(naturalSort).join(s), (x) => x);
aggregatorTemplates.max = (f) => aggregatorTemplates.extremes("max", f);
aggregatorTemplates.min = (f) => aggregatorTemplates.extremes("min", f);
aggregatorTemplates.first = (f) => aggregatorTemplates.extremes("first", f);
aggregatorTemplates.last = (f) => aggregatorTemplates.extremes("last", f);
aggregatorTemplates.median = (f) => aggregatorTemplates.quantile(0.5, f);
aggregatorTemplates.average = (f) => aggregatorTemplates.runningStat("mean", 1, f);
aggregatorTemplates["var"] = (ddof, f) => aggregatorTemplates.runningStat("var", ddof, f);
aggregatorTemplates.stdev = (ddof, f) => aggregatorTemplates.runningStat("stdev", ddof, f);
var aggregators = (function(tpl2) {
  return {
    "Count": tpl2.count(usFmtInt),
    "Count Unique Values": tpl2.countUnique(usFmtInt),
    "List Unique Values": tpl2.listUnique(", "),
    "Sum": tpl2.sum(usFmt),
    "Integer Sum": tpl2.sum(usFmtInt),
    "Average": tpl2.average(usFmt),
    "Median": tpl2.median(usFmt),
    "Sample Variance": tpl2["var"](1, usFmt),
    "Sample Standard Deviation": tpl2.stdev(1, usFmt),
    "Minimum": tpl2.min(usFmt),
    "Maximum": tpl2.max(usFmt),
    "First": tpl2.first(usFmt),
    "Last": tpl2.last(usFmt),
    "Sum over Sum": tpl2.sumOverSum(usFmt),
    "80% Upper Bound": tpl2.sumOverSumBound80(true, usFmt),
    "80% Lower Bound": tpl2.sumOverSumBound80(false, usFmt),
    "Sum as Fraction of Total": tpl2.fractionOf(tpl2.sum(), "total", usFmtPct),
    "Sum as Fraction of Rows": tpl2.fractionOf(tpl2.sum(), "row", usFmtPct),
    "Sum as Fraction of Columns": tpl2.fractionOf(tpl2.sum(), "col", usFmtPct),
    "Count as Fraction of Total": tpl2.fractionOf(tpl2.count(), "total", usFmtPct),
    "Count as Fraction of Rows": tpl2.fractionOf(tpl2.count(), "row", usFmtPct),
    "Count as Fraction of Columns": tpl2.fractionOf(tpl2.count(), "col", usFmtPct)
  };
})(aggregatorTemplates);
var locales = {
  en: {
    aggregators,
    renderers: {},
    // filled in at bottom of this file
    localeStrings: {
      renderError: "An error occurred rendering the PivotTable results.",
      computeError: "An error occurred computing the PivotTable results.",
      uiRenderError: "An error occurred rendering the PivotTable UI.",
      selectAll: "Select All",
      selectNone: "Select None",
      tooMany: "(too many to list)",
      filterResults: "Filter values",
      apply: "Apply",
      cancel: "Cancel",
      totals: "Totals",
      vs: "vs",
      by: "by"
    }
  }
};
function pivotTableRenderer(pivotData, opts) {
  var _a;
  const {
    clickCallback = null,
    rowTotals = true,
    colTotals = true
  } = (_a = opts == null ? void 0 : opts.table) != null ? _a : {};
  const table = { clickCallback, rowTotals, colTotals };
  const localeStrings = Object.assign({ totals: "Totals" }, opts == null ? void 0 : opts.localeStrings);
  const colAttrs = pivotData.colAttrs;
  const rowAttrs = pivotData.rowAttrs;
  const rowKeys = pivotData.getRowKeys();
  const colKeys = pivotData.getColKeys();
  function spanSize(arr, i, j) {
    if (i !== 0) {
      let noDraw = true;
      for (let x = 0; x <= j; x++) {
        if (arr[i - 1][x] !== arr[i][x]) {
          noDraw = false;
          break;
        }
      }
      if (noDraw) return -1;
    }
    let len = 0;
    while (i + len < arr.length) {
      let stop = false;
      for (let x = 0; x <= j; x++) {
        if (arr[i][x] !== arr[i + len][x]) {
          stop = true;
          break;
        }
      }
      if (stop) break;
      len++;
    }
    return len;
  }
  const getClickHandler = clickCallback ? function(value, rowKey, colKey) {
    return (e) => clickCallback(e, value, rowKey, colKey, pivotData);
  } : null;
  const result = document.createElement("table");
  result.className = "pvtTable";
  const thead = document.createElement("thead");
  colAttrs.forEach((c, j) => {
    const tr = document.createElement("tr");
    if (j === 0 && rowAttrs.length !== 0) {
      const th = document.createElement("th");
      th.setAttribute("colspan", String(rowAttrs.length));
      th.setAttribute("rowspan", String(colAttrs.length));
      tr.appendChild(th);
    }
    const axisLabel = document.createElement("th");
    axisLabel.className = "pvtAxisLabel";
    axisLabel.textContent = c;
    tr.appendChild(axisLabel);
    colKeys.forEach((colKey, i) => {
      const span = spanSize(colKeys, i, j);
      if (span !== -1) {
        const th = document.createElement("th");
        th.className = "pvtColLabel";
        th.textContent = colKey[j];
        th.setAttribute("colspan", String(span));
        if (j === colAttrs.length - 1 && rowAttrs.length !== 0) {
          th.setAttribute("rowspan", "2");
        }
        tr.appendChild(th);
      }
    });
    if (j === 0 && table.rowTotals) {
      const th = document.createElement("th");
      th.className = "pvtTotalLabel pvtRowTotalLabel";
      th.innerHTML = localeStrings.totals;
      th.setAttribute("rowspan", String(colAttrs.length + (rowAttrs.length === 0 ? 0 : 1)));
      tr.appendChild(th);
    }
    thead.appendChild(tr);
  });
  if (rowAttrs.length !== 0) {
    const tr = document.createElement("tr");
    rowAttrs.forEach((r) => {
      const th2 = document.createElement("th");
      th2.className = "pvtAxisLabel";
      th2.textContent = r;
      tr.appendChild(th2);
    });
    const th = document.createElement("th");
    if (colAttrs.length === 0) {
      th.className = "pvtTotalLabel pvtRowTotalLabel";
      th.innerHTML = localeStrings.totals;
    }
    tr.appendChild(th);
    thead.appendChild(tr);
  }
  result.appendChild(thead);
  const tbody = document.createElement("tbody");
  rowKeys.forEach((rowKey, i) => {
    const tr = document.createElement("tr");
    rowKey.forEach((txt, j) => {
      const span = spanSize(rowKeys, i, j);
      if (span !== -1) {
        const th = document.createElement("th");
        th.className = "pvtRowLabel";
        th.textContent = txt;
        th.setAttribute("rowspan", String(span));
        if (j === rowAttrs.length - 1 && colAttrs.length !== 0) {
          th.setAttribute("colspan", "2");
        }
        tr.appendChild(th);
      }
    });
    colKeys.forEach((colKey, j) => {
      const aggregator = pivotData.getAggregator(rowKey, colKey);
      const val = aggregator.value();
      const td = document.createElement("td");
      td.className = "pvtVal row" + i + " col" + j;
      td.textContent = aggregator.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      if (getClickHandler) td.onclick = getClickHandler(val, rowKey, colKey);
      tr.appendChild(td);
    });
    if (table.rowTotals || colAttrs.length === 0) {
      const agg = pivotData.getAggregator(rowKey, []);
      const val = agg.value();
      const td = document.createElement("td");
      td.className = "pvtTotal rowTotal";
      td.textContent = agg.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      td.setAttribute("data-for", "row" + i);
      if (getClickHandler) td.onclick = getClickHandler(val, rowKey, []);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  });
  if (table.colTotals || rowAttrs.length === 0) {
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.className = "pvtTotalLabel pvtColTotalLabel";
    th.innerHTML = localeStrings.totals;
    th.setAttribute("colspan", String(rowAttrs.length + (colAttrs.length === 0 ? 0 : 1)));
    tr.appendChild(th);
    colKeys.forEach((colKey, j) => {
      const agg = pivotData.getAggregator([], colKey);
      const val = agg.value();
      const td = document.createElement("td");
      td.className = "pvtTotal colTotal";
      td.textContent = agg.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      td.setAttribute("data-for", "col" + j);
      if (getClickHandler) td.onclick = getClickHandler(val, [], colKey);
      tr.appendChild(td);
    });
    if (table.rowTotals || colAttrs.length === 0) {
      const agg = pivotData.getAggregator([], []);
      const val = agg.value();
      const td = document.createElement("td");
      td.className = "pvtGrandTotal";
      td.textContent = agg.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      if (getClickHandler) td.onclick = getClickHandler(val, [], []);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  result.appendChild(tbody);
  result.setAttribute("data-numrows", String(rowKeys.length));
  result.setAttribute("data-numcols", String(colKeys.length));
  return result;
}
var renderers = {
  "Table": pivotTableRenderer
};
locales.en.renderers = renderers;

// src/adapters/vanilla.ts
var import_sortablejs = __toESM(require("sortablejs"));
function heatmap(table, scope = "heatmap", opts) {
  var _a, _b, _c, _d;
  const numRows = parseInt((_a = table.dataset.numrows) != null ? _a : "0", 10);
  const numCols = parseInt((_b = table.dataset.numcols) != null ? _b : "0", 10);
  const colorGen = (_d = (_c = opts == null ? void 0 : opts.heatmap) == null ? void 0 : _c.colorScaleGenerator) != null ? _d : ((values) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (x) => {
      const nonRed = 255 - Math.round(255 * (x - min) / (max - min));
      return `rgb(255,${nonRed},${nonRed})`;
    };
  });
  const applyScale = (selector) => {
    const cells = [];
    const values = [];
    table.querySelectorAll(selector).forEach((td) => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) {
          cells.push(td);
          values.push(x);
        }
      }
    });
    if (values.length === 0) return;
    const scale = colorGen(values);
    cells.forEach((td, i) => {
      td.style.backgroundColor = scale(values[i]);
    });
  };
  switch (scope) {
    case "heatmap":
      applyScale(".pvtVal");
      break;
    case "rowheatmap":
      for (let i = 0; i < numRows; i++) applyScale(`.pvtVal.row${i}`);
      break;
    case "colheatmap":
      for (let j = 0; j < numCols; j++) applyScale(`.pvtVal.col${j}`);
      break;
  }
  applyScale(".pvtTotal.rowTotal");
  applyScale(".pvtTotal.colTotal");
  return table;
}
function barchart(table) {
  var _a;
  const numRows = parseInt((_a = table.dataset.numrows) != null ? _a : "0", 10);
  const applyBars = (selector) => {
    const cells = [];
    const values = [];
    table.querySelectorAll(selector).forEach((td) => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) {
          cells.push(td);
          values.push(x);
        }
      }
    });
    if (values.length === 0) return;
    let max = Math.max(...values);
    if (max < 0) max = 0;
    const min = Math.min(...values);
    const range = min < 0 ? max - min : max;
    const scale = (x) => 100 * x / (1.4 * range);
    cells.forEach((td, i) => {
      var _a2;
      const x = values[i];
      const text = (_a2 = td.textContent) != null ? _a2 : "";
      let bgColor = "gray";
      let bBase = min < 0 ? scale(-min) : 0;
      let barX = x;
      if (x < 0) {
        bBase += scale(x);
        bgColor = "darkred";
        barX = -x;
      }
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;height:55px";
      const bar = document.createElement("div");
      bar.style.cssText = `position:absolute;bottom:${bBase}%;left:0;right:0;height:${scale(barX)}%;background-color:${bgColor}`;
      const label = document.createElement("div");
      label.textContent = text;
      label.style.cssText = "position:relative;padding-left:5px;padding-right:5px";
      wrapper.append(bar, label);
      td.style.cssText = "padding:0;padding-top:5px;text-align:center";
      td.innerHTML = "";
      td.appendChild(wrapper);
    });
  };
  for (let i = 0; i < numRows; i++) applyBars(`.pvtVal.row${i}`);
  applyBars(".pvtTotal.colTotal");
  return table;
}
var vanillaRenderers = {
  "Table Barchart": (data, opts) => barchart(pivotTableRenderer(data, opts)),
  "Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "heatmap", opts),
  "Row Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "rowheatmap", opts),
  "Col Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "colheatmap", opts)
};

// src/locales/index.ts
var tpl = aggregatorTemplates;
var allR = { ...renderers, ...vanillaRenderers };
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["cs"] = {
    localeStrings: {
      renderError: "Do\u0161lo k chyb\u011B p\u0159i vykreslov\xE1n\xED v\xFDsledk\u016F PivotTable.",
      computeError: "Do\u0161lo k chyb\u011B p\u0159i v\xFDpo\u010Dtu v\xFDsledk\u016F PivotTable.",
      uiRenderError: "Do\u0161lo k chyb\u011B p\u0159i vykreslov\xE1n\xED PivotTable UI.",
      selectAll: "Vybrat v\u0161e",
      selectNone: "Zru\u0161it v\xFDb\u011Br",
      tooMany: "(p\u0159\xEDli\u0161 mnoho polo\u017Eek)",
      filterResults: "Hodnoty pro filtr",
      apply: "Pou\u017E\xEDt",
      cancel: "Zru\u0161it",
      totals: "Celkem",
      vs: "ku",
      by: "z"
    },
    aggregators: {
      "Po\u010Det": tpl.count(fmtInt),
      "Po\u010Det unik\xE1tn\xEDch hodnot": tpl.countUnique(fmtInt),
      "V\xFD\u010Det unik\xE1tn\xEDch hodnot": tpl.listUnique(", "),
      "Sou\u010Det": tpl.sum(fmt),
      "Celo\u010D\xEDseln\xFD sou\u010Det": tpl.sum(fmtInt),
      "Pr\u016Fm\u011Br": tpl.average(fmt),
      "Medi\xE1n": tpl.median(fmt),
      "Rozptyl": tpl["var"](1, fmt),
      "Sm\u011Brodatn\xE1 odchylka": tpl.stdev(1, fmt),
      "Minimum": tpl.min(fmt),
      "Maximum": tpl.max(fmt),
      "Prvn\xED": tpl.first(fmt),
      "Posledn\xED": tpl.last(fmt),
      "Sou\u010Det p\u0159es sou\u010Det": tpl.sumOverSum(fmt),
      "80% horn\xED hranice": tpl.sumOverSumBound80(true, fmt),
      "80% spodn\xED hranice": tpl.sumOverSumBound80(false, fmt),
      "Sou\u010Det jako pom\u011Br z celku": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Sou\u010Det jako pom\u011Br z \u0159\xE1dk\u016F": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Sou\u010Det jako pom\u011Br ze sloupc\u016F": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Po\u010Det jako pom\u011Br z celku": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Po\u010Det jako pom\u011Br z \u0159\xE1dk\u016F": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Po\u010Det jako pom\u011Br ze sloupc\u016F": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabulka": allR["Table"],
      "Tabulka se sloupcov\xFDm grafem": allR["Table Barchart"],
      "Teplotn\xED mapa": allR["Heatmap"],
      "Teplotn\xED mapa z \u0159\xE1dk\u016F": allR["Row Heatmap"],
      "Teplotn\xED mapa ze sloupc\u016F": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["da"] = {
    localeStrings: {
      renderError: "Der opstod en fejl, mens du trak i feltet",
      computeError: "Der opstod en fejl ved beregningen af feltet",
      uiRenderError: "Der opstod en fejl, mens den grafiske brugerflade blev beregnet",
      selectAll: "V\xE6lg alle",
      selectNone: "V\xE6lg ingen",
      tooMany: "(for mange v\xE6rdier til at vise)",
      filterResults: "Filter v\xE6rdier",
      totals: "I alt",
      vs: "vs",
      by: "af"
    },
    aggregators: {
      "Antal": tpl.count(fmtInt),
      "Antal Unikke v\xE6rdier": tpl.countUnique(fmtInt),
      "Liste unikke v\xE6rdier": tpl.listUnique(", "),
      "Sum": tpl.sum(fmt),
      "Sum i heltal": tpl.sum(fmtInt),
      "Gennemsnit": tpl.average(fmt),
      "Minimum": tpl.min(fmt),
      "Maximum": tpl.max(fmt),
      "Sum iforhold til sum": tpl.sumOverSum(fmt),
      "Sum iforhold til sum, \xF8verst 80%": tpl.sumOverSumBound80(true, fmt),
      "Sum iforhold til sum, lavest 80%": tpl.sumOverSumBound80(false, fmt),
      "Andel af i alt sum": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Andel af r\xE6kke sum": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Andel af kolonner sum": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Andel af i alt antal": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Andel af r\xE6kke antal": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Andel af kolonner antal": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabel": allR["Table"],
      "Tabel med s\xF8jler": allR["Table Barchart"],
      "Heatmap": allR["Heatmap"],
      "Heatmap per r\xE6kke": allR["Row Heatmap"],
      "Heatmap per kolonne": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["de"] = {
    localeStrings: {
      renderError: "Bei der Darstellung der Pivot-Tabelle ist ein Fehler aufgetreten.",
      computeError: "Bei der Berechnung der Pivot-Tabelle ist ein Fehler aufgetreten.",
      uiRenderError: "Bei der Darstellung der Oberfl\xE4che der Pivot-Tabelle ist ein Fehler aufgetreten.",
      selectAll: "Alles ausw\xE4hlen",
      selectNone: "Nichts ausw\xE4hlen",
      tooMany: "(zu viele f\xFCr Liste)",
      filterResults: "Ergebnisse filtern",
      totals: "Gesamt",
      vs: "gegen",
      by: "pro"
    },
    aggregators: {
      "Anzahl": tpl.count(fmtInt),
      "Anzahl eindeutiger Werte": tpl.countUnique(fmtInt),
      "Liste eindeutiger Werte": tpl.listUnique(", "),
      "Summe": tpl.sum(fmt),
      "Ganzzahlige Summe": tpl.sum(fmtInt),
      "Durchschnitt": tpl.average(fmt),
      "Minimum": tpl.min(fmt),
      "Maximum": tpl.max(fmt),
      "Summe \xFCber Summe": tpl.sumOverSum(fmt),
      "80% Obergrenze": tpl.sumOverSumBound80(true, fmt),
      "80% Untergrenze": tpl.sumOverSumBound80(false, fmt),
      "Summe als Anteil von Gesamt": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Summe als Anteil von Zeile": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Summe als Anteil von Spalte": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Anzahl als Anteil von Gesamt": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Anzahl als Anteil von Zeile": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Anzahl als Anteil von Spalte": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabelle": allR["Table"],
      "Tabelle mit Balkendiagramm": allR["Table Barchart"],
      "Heatmap": allR["Heatmap"],
      "Heatmap pro Zeile": allR["Row Heatmap"],
      "Heatmap pro Spalte": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["es"] = {
    localeStrings: {
      renderError: "Ocurri\xF3 un error durante la interpretaci\xF3n de la tabla din\xE1mica.",
      computeError: "Ocurri\xF3 un error durante el c\xE1lculo de la tabla din\xE1mica.",
      uiRenderError: "Ocurri\xF3 un error durante el dibujado de la tabla din\xE1mica.",
      selectAll: "Seleccionar todo",
      selectNone: "Deseleccionar todo",
      tooMany: "(demasiados valores)",
      filterResults: "Filtrar resultados",
      apply: "Aplicar",
      cancel: "Cancelar",
      totals: "Totales",
      vs: "vs",
      by: "por"
    },
    aggregators: {
      "Cuenta": tpl.count(fmtInt),
      "Cuenta de valores \xFAnicos": tpl.countUnique(fmtInt),
      "Lista de valores \xFAnicos": tpl.listUnique(", "),
      "Suma": tpl.sum(fmt),
      "Suma de enteros": tpl.sum(fmtInt),
      "Promedio": tpl.average(fmt),
      "Mediana": tpl.median(fmt),
      "Varianza": tpl["var"](1, fmt),
      "Desviaci\xF3n est\xE1ndar": tpl.stdev(1, fmt),
      "M\xEDnimo": tpl.min(fmt),
      "M\xE1ximo": tpl.max(fmt),
      "Primero": tpl.first(fmt),
      "\xDAltimo": tpl.last(fmt),
      "Suma de sumas": tpl.sumOverSum(fmt),
      "Cota 80% superior": tpl.sumOverSumBound80(true, fmt),
      "Cota 80% inferior": tpl.sumOverSumBound80(false, fmt),
      "Proporci\xF3n del total (suma)": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Proporci\xF3n de la fila (suma)": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Proporci\xF3n de la columna (suma)": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Proporci\xF3n del total (cuenta)": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Proporci\xF3n de la fila (cuenta)": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Proporci\xF3n de la columna (cuenta)": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabla": allR["Table"],
      "Tabla con barras": allR["Table Barchart"],
      "Heatmap": allR["Heatmap"],
      "Heatmap por filas": allR["Row Heatmap"],
      "Heatmap por columnas": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["fr"] = {
    localeStrings: {
      renderError: "Une erreur est survenue en dessinant le tableau crois\xE9.",
      computeError: "Une erreur est survenue en calculant le tableau crois\xE9.",
      uiRenderError: "Une erreur est survenue en dessinant l'interface du tableau crois\xE9 dynamique.",
      selectAll: "S\xE9lectionner tout",
      selectNone: "S\xE9lectionner rien",
      tooMany: "(trop de valeurs \xE0 afficher)",
      filterResults: "Filtrer les valeurs",
      apply: "Appliquer",
      cancel: "Annuler",
      totals: "Totaux",
      vs: "sur",
      by: "par"
    },
    aggregators: {
      "Nombre": tpl.count(fmtInt),
      "Nombre de valeurs uniques": tpl.countUnique(fmtInt),
      "Liste de valeurs uniques": tpl.listUnique(", "),
      "Somme": tpl.sum(fmt),
      "Somme en entiers": tpl.sum(fmtInt),
      "Moyenne": tpl.average(fmt),
      "Minimum": tpl.min(fmt),
      "Maximum": tpl.max(fmt),
      "Premier": tpl.first(fmt),
      "Dernier": tpl.last(fmt),
      "Ratio de sommes": tpl.sumOverSum(fmt),
      "Borne sup\xE9rieure 80%": tpl.sumOverSumBound80(true, fmt),
      "Borne inf\xE9rieure 80%": tpl.sumOverSumBound80(false, fmt),
      "Somme en proportion du total": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Somme en proportion de la ligne": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Somme en proportion de la colonne": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Nombre en proportion du total": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Nombre en proportion de la ligne": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Nombre en proportion de la colonne": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Table": allR["Table"],
      "Table avec barres": allR["Table Barchart"],
      "Carte de chaleur": allR["Heatmap"],
      "Carte de chaleur par ligne": allR["Row Heatmap"],
      "Carte de chaleur par colonne": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["it"] = {
    localeStrings: {
      renderError: "Si \xE8 verificato un errore durante la creazione della tabella.",
      computeError: "Si \xE8 verificato un errore di calcolo nella tabella.",
      uiRenderError: "Si \xE8 verificato un errore durante il disegno dell'interfaccia della tabella pivot.",
      selectAll: "Seleziona tutto",
      selectNone: "Deseleziona tutto",
      tooMany: "(troppi valori da visualizzare)",
      filterResults: "Filtra i valori",
      apply: "Applica",
      cancel: "Annulla",
      totals: "Totali",
      vs: "su",
      by: "da"
    },
    aggregators: {
      "Numero": tpl.count(fmtInt),
      "Numero di valori unici": tpl.countUnique(fmtInt),
      "Elenco di valori unici": tpl.listUnique(", "),
      "Somma": tpl.sum(fmt),
      "Somma intera": tpl.sum(fmtInt),
      "Media": tpl.average(fmt),
      "Minimo": tpl.min(fmt),
      "Massimo": tpl.max(fmt),
      "Rapporto": tpl.sumOverSum(fmt),
      "Limite superiore 80%": tpl.sumOverSumBound80(true, fmt),
      "Limite inferiore 80%": tpl.sumOverSumBound80(false, fmt),
      "Somma proporzionale al totale": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Somma proporzionale alla riga": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Somma proporzionale alla colonna": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Numero proporzionale al totale": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Numero proporzionale alla riga": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Numero proporzionale alla colonna": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabella": allR["Table"],
      "Tabella con grafico": allR["Table Barchart"],
      "Mappa di calore": allR["Heatmap"],
      "Mappa di calore per righe": allR["Row Heatmap"],
      "Mappa di calore per colonne": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: ",", decimalSep: "." });
  const fmtInt = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["ja"] = {
    localeStrings: {
      renderError: "\u63CF\u753B\u51E6\u7406\u3067\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002",
      computeError: "\u51E6\u7406\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002",
      uiRenderError: "\u8868\u793A\u51E6\u7406\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002",
      selectAll: "\u5168\u9078\u629E",
      selectNone: "\u9078\u629E\u89E3\u9664",
      tooMany: "\u9805\u76EE\u304C\u591A\u3059\u304E\u307E\u3059",
      filterResults: "\u9805\u76EE\u3092\u691C\u7D22\u3059\u308B",
      apply: "\u9069\u7528\u3059\u308B",
      cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
      totals: "\u5408\u8A08",
      vs: "vs",
      by: "per"
    },
    aggregators: {
      "\u4EF6\u6570": tpl.count(fmtInt),
      "\u4EF6\u6570\uFF08\u30E6\u30CB\u30FC\u30AF\uFF09": tpl.countUnique(fmtInt),
      "\u30E6\u30CB\u30FC\u30AF\u5024\u3092\u8868\u793A (CSV)": tpl.listUnique(", "),
      "\u5408\u8A08": tpl.sum(fmt),
      "\u5408\u8A08\uFF08\u6574\u6570\uFF09": tpl.sum(fmtInt),
      "\u5E73\u5747": tpl.average(fmt),
      "\u6700\u5C0F": tpl.min(fmt),
      "\u6700\u5927": tpl.max(fmt),
      "\u9078\u629E\uFF12\u9805\u76EE\u306E\u6BD4\u7387": tpl.sumOverSum(fmt),
      "\u9078\u629E\uFF12\u9805\u76EE\u306E\u6BD4\u7387\uFF08\u4E0A\u965080%\uFF09": tpl.sumOverSumBound80(true, fmt),
      "\u9078\u629E\uFF12\u9805\u76EE\u306E\u6BD4\u7387\uFF08\u4E0B\u965080%\uFF09": tpl.sumOverSumBound80(false, fmt),
      "\u5408\u8A08\u5272\u5408": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "\u5408\u8A08\u5272\u5408\uFF08\u884C\uFF09": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "\u5408\u8A08\u5272\u5408\uFF08\u5217\uFF09": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "\u4EF6\u6570\u5272\u5408": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "\u4EF6\u6570\u5272\u5408\uFF08\u884C\uFF09": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "\u4EF6\u6570\u5272\u5408\uFF08\u5217\uFF09": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "\u8868": allR["Table"],
      "\u8868\uFF08\u68D2\u30B0\u30E9\u30D5\uFF09": allR["Table Barchart"],
      "\u30D2\u30FC\u30C8\u30DE\u30C3\u30D7": allR["Heatmap"],
      "\u30D2\u30FC\u30C8\u30DE\u30C3\u30D7\uFF08\u884C\uFF09": allR["Row Heatmap"],
      "\u30D2\u30FC\u30C8\u30DE\u30C3\u30D7\uFF08\u5217\uFF09": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["nl"] = {
    localeStrings: {
      renderError: "Er is een fout opgetreden bij het renderen van de kruistabel.",
      computeError: "Er is een fout opgetreden bij het berekenen van de kruistabel.",
      uiRenderError: "Er is een fout opgetreden bij het tekenen van de interface van de kruistabel.",
      selectAll: "Alles selecteren",
      selectNone: "Niets selecteren",
      tooMany: "(te veel waarden om weer te geven)",
      filterResults: "Filter resultaten",
      totals: "Totaal",
      vs: "versus",
      by: "per"
    },
    aggregators: {
      "Aantal": tpl.count(fmtInt),
      "Aantal unieke waarden": tpl.countUnique(fmtInt),
      "Lijst unieke waarden": tpl.listUnique(", "),
      "Som": tpl.sum(fmt),
      "Som van gehele getallen": tpl.sum(fmtInt),
      "Gemiddelde": tpl.average(fmt),
      "Minimum": tpl.min(fmt),
      "Maximum": tpl.max(fmt),
      "Eerste": tpl.first(fmt),
      "Laatste": tpl.last(fmt),
      "Som over som": tpl.sumOverSum(fmt),
      "80% bovengrens": tpl.sumOverSumBound80(true, fmt),
      "80% ondergrens": tpl.sumOverSumBound80(false, fmt),
      "Som in verhouding tot het totaal": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Som in verhouding tot de rij": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Som in verhouding tot de kolom": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Aantal in verhouding tot het totaal": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Aantal in verhouding tot de rij": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Aantal in verhouding tot de kolom": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabel": allR["Table"],
      "Tabel met staafdiagrammen": allR["Table Barchart"],
      "Warmtekaart": allR["Heatmap"],
      "Warmtekaart per rij": allR["Row Heatmap"],
      "Warmtekaart per kolom": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["pl"] = {
    localeStrings: {
      renderError: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas renderowania wynik\xF3w PivotTable.",
      computeError: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas obliczania wynik\xF3w PivotTable.",
      uiRenderError: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas renderowania UI PivotTable.",
      selectAll: "Zaznacz wszystko",
      selectNone: "Odznacz wszystkie",
      tooMany: "(za du\u017Co do wylistowania)",
      filterResults: "Filtruj warto\u015Bci",
      apply: "Zastosuj",
      cancel: "Anuluj",
      totals: "Podsumowanie",
      vs: "vs",
      by: "przez"
    },
    aggregators: {
      "Liczba": tpl.count(fmtInt),
      "Liczba Unikatowych Warto\u015Bci": tpl.countUnique(fmtInt),
      "Lista Unikatowych Warto\u015Bci": tpl.listUnique(", "),
      "Suma": tpl.sum(fmt),
      "Ca\u0142kowita Suma": tpl.sum(fmtInt),
      "\u015Arednia": tpl.average(fmt),
      "Minimum": tpl.min(fmt),
      "Maksimum": tpl.max(fmt),
      "Pierwszy": tpl.first(fmt),
      "Ostatni": tpl.last(fmt),
      "Suma po Sumie": tpl.sumOverSum(fmt),
      "80% Kres Dolny": tpl.sumOverSumBound80(true, fmt),
      "80% Kres G\xF3rny": tpl.sumOverSumBound80(false, fmt),
      "Suma jako U\u0142amek Ca\u0142o\u015Bci": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Suma jako U\u0142amek w Wierszach": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Suma jako U\u0142amek w Kolumnach": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Liczba jako U\u0142amek Ca\u0142o\u015Bci": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Liczba jako U\u0142amek w Wierszach": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Liczba jako U\u0142amek w Kolumnach": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabela": allR["Table"],
      "Tabela z Wykresem S\u0142upkowym": allR["Table Barchart"],
      "Mapa cieplna": allR["Heatmap"],
      "Mapa cieplna po Wierszach": allR["Row Heatmap"],
      "Mapa cieplna po Kolumnach": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["pt"] = {
    localeStrings: {
      renderError: "Ocorreu um erro ao renderizar os resultados da Tabela Din\xE2mica.",
      computeError: "Ocorreu um erro ao computar os resultados da Tabela Din\xE2mica.",
      uiRenderError: "Ocorreu um erro ao renderizar a interface da Tabela Din\xE2mica.",
      selectAll: "Selecionar Tudo",
      selectNone: "Selecionar Nenhum",
      tooMany: "(demais para listar)",
      filterResults: "Filtrar resultados",
      apply: "Aplicar",
      cancel: "Cancelar",
      totals: "Totais",
      vs: "vs",
      by: "por"
    },
    aggregators: {
      "Contagem": tpl.count(fmtInt),
      "Contagem de Valores \xFAnicos": tpl.countUnique(fmtInt),
      "Lista de Valores \xFAnicos": tpl.listUnique(", "),
      "Soma": tpl.sum(fmt),
      "Soma de Inteiros": tpl.sum(fmtInt),
      "M\xE9dia": tpl.average(fmt),
      "Mediana": tpl.median(fmt),
      "Vari\xE2ncia": tpl["var"](1, fmt),
      "Desvio Padr\xE3o da Amostra": tpl.stdev(1, fmt),
      "M\xEDnimo": tpl.min(fmt),
      "M\xE1ximo": tpl.max(fmt),
      "Primeiro": tpl.first(fmt),
      "\xDAltimo": tpl.last(fmt),
      "Soma sobre Soma": tpl.sumOverSum(fmt),
      "Limite Superior a 80%": tpl.sumOverSumBound80(true, fmt),
      "Limite Inferior a 80%": tpl.sumOverSumBound80(false, fmt),
      "Soma como Fra\xE7\xE3o do Total": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Soma como Fra\xE7\xE3o da Linha": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Soma como Fra\xE7\xE3o da Coluna": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Contagem como Fra\xE7\xE3o do Total": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Contagem como Fra\xE7\xE3o da Linha": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Contagem como Fra\xE7\xE3o da Coluna": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabela": allR["Table"],
      "Tabela com Barras": allR["Table Barchart"],
      "Mapa de Calor": allR["Heatmap"],
      "Mapa de Calor por Linhas": allR["Row Heatmap"],
      "Mapa de Calor por Colunas": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["ru"] = {
    localeStrings: {
      renderError: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0440\u0435\u043D\u0434\u0435\u0440\u0438\u043D\u0433\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u044B.",
      computeError: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0442\u0430\u0431\u043B\u0438\u0447\u043D\u044B\u0445 \u0440\u0430\u0441\u0447\u0435\u0442\u043E\u0432.",
      uiRenderError: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u043E \u0432\u0440\u0435\u043C\u044F \u043F\u0440\u043E\u0440\u0438\u0441\u043E\u0432\u043A\u0438 \u0438 \u0434\u0438\u043D\u0430\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0440\u0430\u0441\u0447\u0435\u0442\u0430 \u0442\u0430\u0431\u043B\u0438\u0446\u044B.",
      selectAll: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435",
      selectNone: "\u0421\u043D\u044F\u0442\u044C \u0432\u044B\u0434\u0435\u043B\u0435\u043D\u0438\u0435",
      tooMany: "(\u0412\u044B\u0431\u0440\u0430\u043D\u043E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0439)",
      filterResults: "\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F",
      totals: "\u0412\u0441\u0435\u0433\u043E",
      vs: "\u043D\u0430",
      by: "\u0441"
    },
    aggregators: {
      "\u041A\u043E\u043B-\u0432\u043E": tpl.count(fmtInt),
      "\u041A\u043E\u043B-\u0432\u043E \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445": tpl.countUnique(fmtInt),
      "\u0421\u043F\u0438\u0441\u043E\u043A \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0445": tpl.listUnique(", "),
      "\u0421\u0443\u043C\u043C\u0430": tpl.sum(fmt),
      "\u0421\u0443\u043C\u043C\u0430 \u0446\u0435\u043B\u044B\u0445": tpl.sum(fmtInt),
      "\u0421\u0440\u0435\u0434\u043D\u0435\u0435": tpl.average(fmt),
      "\u041C\u0438\u043D\u0438\u043C\u0443\u043C": tpl.min(fmt),
      "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C": tpl.max(fmt),
      "\u0421\u0443\u043C\u043C\u0430 \u043F\u043E \u0441\u0443\u043C\u043C\u0435": tpl.sumOverSum(fmt),
      "80% \u0432\u0435\u0440\u0445\u043D\u0435\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u044B": tpl.sumOverSumBound80(true, fmt),
      "80% \u043D\u0438\u0436\u043D\u0435\u0439 \u0433\u0440\u0430\u043D\u0438\u0446\u044B": tpl.sumOverSumBound80(false, fmt),
      "\u0414\u043E\u043B\u044F \u043F\u043E \u0432\u0441\u0435\u043C\u0443": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "\u0414\u043E\u043B\u044F \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "\u0414\u043E\u043B\u044F \u043F\u043E \u0441\u0442\u043E\u043B\u0431\u0446\u0443": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "\u041A\u043E\u043B-\u0432\u043E \u043F\u043E \u0432\u0441\u0435\u043C\u0443": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "\u041A\u043E\u043B-\u0432\u043E \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "\u041A\u043E\u043B-\u0432\u043E \u043F\u043E \u0441\u0442\u043E\u043B\u0431\u0446\u0443": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "\u0422\u0430\u0431\u043B\u0438\u0446\u0430": allR["Table"],
      "\u0413\u0440\u0430\u0444\u0438\u043A \u0441\u0442\u043E\u043B\u0431\u0446\u044B": allR["Table Barchart"],
      "\u0422\u0435\u043F\u043B\u043E\u0432\u0430\u044F \u043A\u0430\u0440\u0442\u0430": allR["Heatmap"],
      "\u0422\u0435\u043F\u043B\u043E\u0432\u0430\u044F \u043A\u0430\u0440\u0442\u0430 \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0435": allR["Row Heatmap"],
      "\u0422\u0435\u043F\u043B\u043E\u0432\u0430\u044F \u043A\u0430\u0440\u0442\u0430 \u043F\u043E \u0441\u0442\u043E\u043B\u0431\u0446\u0443": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: "\xA0", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: "\xA0", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["sq"] = {
    localeStrings: {
      renderError: "Ka ndodhur nj\xEB gabim gjat\xEB shfaqjes s\xEB rezultateve t\xEB PivotTable.",
      computeError: "Ka ndodhur nj\xEB gabim gjat\xEB llogaritjes s\xEB rezultateve t\xEB PivotTable.",
      uiRenderError: "Ka ndodhur nj\xEB gabim gjat\xEB shfaqjes s\xEB nd\xEBrfaqes s\xEB PivotTable.",
      selectAll: "P\xEBrzgjedh t\xEB gjitha",
      selectNone: "Mos p\xEBrzgjedh asnj\xEBr\xEBn",
      tooMany: "(shum\xEB p\xEBr t'u listuar)",
      filterResults: "Filtro vlerat",
      totals: "Totalet",
      vs: "kund\xEBr",
      by: "p\xEBr"
    },
    aggregators: {
      "Num\xEBro": tpl.count(fmtInt),
      "Num\xEBro vlerat unike": tpl.countUnique(fmtInt),
      "Listo vlerat unike": tpl.listUnique(", "),
      "Shuma": tpl.sum(fmt),
      "Shuma si num\xEBr i plot\xEB": tpl.sum(fmtInt),
      "Mesatarja": tpl.average(fmt),
      "Minimumi": tpl.min(fmt),
      "Maksimumi": tpl.max(fmt),
      "Shuma mbi shum\xEB": tpl.sumOverSum(fmt),
      "80% kufiri i sip\xEBrm": tpl.sumOverSumBound80(true, fmt),
      "80% kufiri i posht\xEBm": tpl.sumOverSumBound80(false, fmt),
      "Shuma si thyes\xEB e totalit": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Shuma si thyes\xEB e rreshtave": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "Shuma si thyes\xEB e kolonave": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Num\xEBrimi si thyes\xEB e totalit": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Num\xEBrimi si thyes\xEB e rreshtave": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "Num\xEBrimi si thyes\xEB e kolonave": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tabela": allR["Table"],
      "Tabela me diagram vertikal": allR["Table Barchart"],
      "Heatmap": allR["Heatmap"],
      "Heatmap p\xEBr rresht": allR["Row Heatmap"],
      "Heatmap p\xEBr kolon\xEB": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["tr"] = {
    localeStrings: {
      renderError: "PivotTable sonu\xE7lar\u0131n\u0131 olu\u015Ftururken hata olu\u015Ftu",
      computeError: "PivotTable sonu\xE7lar\u0131n\u0131 i\u015Flerken hata olu\u015Ftu",
      uiRenderError: "PivotTable UI sonu\xE7lar\u0131n\u0131 olu\u015Ftururken hata olu\u015Ftu",
      selectAll: "T\xFCm\xFCn\xFC Se\xE7",
      selectNone: "T\xFCm\xFCn\xFC B\u0131rak",
      tooMany: "(listelemek i\xE7in fazla)",
      filterResults: "Sonu\xE7lar\u0131 filtrele",
      totals: "Toplam",
      vs: "vs",
      by: "ile"
    },
    aggregators: {
      "Say\u0131": tpl.count(fmtInt),
      "Benzersiz de\u011Ferler say\u0131s\u0131": tpl.countUnique(fmtInt),
      "Benzersiz de\u011Ferler listesi": tpl.listUnique(", "),
      "Toplam": tpl.sum(fmt),
      "Toplam (tam say\u0131)": tpl.sum(fmtInt),
      "Ortalama": tpl.average(fmt),
      "Min": tpl.min(fmt),
      "Maks": tpl.max(fmt),
      "Miktarlar\u0131n toplam\u0131": tpl.sumOverSum(fmt),
      "%80 daha y\xFCksek": tpl.sumOverSumBound80(true, fmt),
      "%80 daha d\xFC\u015F\xFCk": tpl.sumOverSumBound80(false, fmt),
      "Toplam oran\u0131 (toplam)": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "Sat\u0131r oran\u0131 (toplam)": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "S\xFCtunun oran\u0131 (toplam)": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "Toplam oran\u0131 (say\u0131)": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Sat\u0131r oran\u0131 (say\u0131)": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "S\xFCtunun oran\u0131 (say\u0131)": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "Tablo": allR["Table"],
      "Tablo (\xC7ubuklar)": allR["Table Barchart"],
      "\u0130lgi haritas\u0131": allR["Heatmap"],
      "Sat\u0131r ilgi haritas\u0131": allR["Row Heatmap"],
      "S\xFCtun ilgi haritas\u0131": allR["Col Heatmap"]
    }
  };
}
{
  const fmt = numberFormat({ thousandsSep: ",", decimalSep: "." });
  const fmtInt = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["zh"] = {
    localeStrings: {
      renderError: "\u5C55\u793A\u7ED3\u679C\u65F6\u51FA\u9519\u3002",
      computeError: "\u8BA1\u7B97\u7ED3\u679C\u65F6\u51FA\u9519\u3002",
      uiRenderError: "\u5C55\u793A\u754C\u9762\u65F6\u51FA\u9519\u3002",
      selectAll: "\u9009\u62E9\u5168\u90E8",
      selectNone: "\u5168\u90E8\u4E0D\u9009",
      tooMany: "(\u56E0\u6570\u636E\u8FC7\u591A\u800C\u65E0\u6CD5\u5217\u51FA)",
      filterResults: "\u8F93\u5165\u503C\u5E2E\u52A9\u7B5B\u9009",
      totals: "\u5408\u8BA1",
      vs: "\u4E8E",
      by: "\u5206\u7EC4\u4E8E"
    },
    aggregators: {
      "\u9891\u6570": tpl.count(fmtInt),
      "\u975E\u91CD\u590D\u503C\u7684\u4E2A\u6570": tpl.countUnique(fmtInt),
      "\u5217\u51FA\u975E\u91CD\u590D\u503C": tpl.listUnique(", "),
      "\u6C42\u548C": tpl.sum(fmt),
      "\u6C42\u548C\u540E\u53D6\u6574": tpl.sum(fmtInt),
      "\u5E73\u5747\u503C": tpl.average(fmt),
      "\u4E2D\u4F4D\u6570": tpl.median(fmt),
      "\u65B9\u5DEE": tpl["var"](1, fmt),
      "\u6837\u672C\u6807\u51C6\u504F\u5DEE": tpl.stdev(1, fmt),
      "\u6700\u5C0F\u503C": tpl.min(fmt),
      "\u6700\u5927\u503C": tpl.max(fmt),
      "\u7B2C\u4E00": tpl.first(fmt),
      "\u6700\u540E": tpl.last(fmt),
      "\u4E24\u548C\u4E4B\u6BD4": tpl.sumOverSum(fmt),
      "\u7F6E\u4FE1\u5EA680%\u65F6\u7684\u533A\u95F4\u4E0A\u9650": tpl.sumOverSumBound80(true, fmt),
      "\u7F6E\u4FE1\u5EA680%\u65F6\u7684\u533A\u95F4\u4E0B\u9650": tpl.sumOverSumBound80(false, fmt),
      "\u548C\u5728\u603B\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.sum(), "total", fmtPct),
      "\u548C\u5728\u884C\u5408\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.sum(), "row", fmtPct),
      "\u548C\u5728\u5217\u5408\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.sum(), "col", fmtPct),
      "\u9891\u6570\u5728\u603B\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.count(), "total", fmtPct),
      "\u9891\u6570\u5728\u884C\u5408\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.count(), "row", fmtPct),
      "\u9891\u6570\u5728\u5217\u5408\u8BA1\u4E2D\u7684\u6BD4\u4F8B": tpl.fractionOf(tpl.count(), "col", fmtPct)
    },
    renderers: {
      "\u8868\u683C": allR["Table"],
      "\u8868\u683C\u5185\u67F1\u72B6\u56FE": allR["Table Barchart"],
      "\u70ED\u56FE": allR["Heatmap"],
      "\u884C\u70ED\u56FE": allR["Row Heatmap"],
      "\u5217\u70ED\u56FE": allR["Col Heatmap"]
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  locales
});
//# sourceMappingURL=index.js.map