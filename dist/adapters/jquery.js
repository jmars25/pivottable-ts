"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/adapters/vanilla.ts
var import_sortablejs = __toESM(require("sortablejs"));

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
var sortAs = function(order) {
  const mapping = {};
  const l_mapping = {};
  for (const i in order) {
    const x = order[i];
    mapping[x] = i;
    if (typeof x === "string") l_mapping[x.toLowerCase()] = i;
  }
  return function(a, b) {
    if (mapping[a] != null && mapping[b] != null) return mapping[a] - mapping[b];
    if (mapping[a] != null) return -1;
    if (mapping[b] != null) return 1;
    if (l_mapping[a] != null && l_mapping[b] != null) return l_mapping[a] - l_mapping[b];
    if (l_mapping[a] != null) return -1;
    if (l_mapping[b] != null) return 1;
    return naturalSort(a, b);
  };
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
var aggregators = (function(tpl) {
  return {
    "Count": tpl.count(usFmtInt),
    "Count Unique Values": tpl.countUnique(usFmtInt),
    "List Unique Values": tpl.listUnique(", "),
    "Sum": tpl.sum(usFmt),
    "Integer Sum": tpl.sum(usFmtInt),
    "Average": tpl.average(usFmt),
    "Median": tpl.median(usFmt),
    "Sample Variance": tpl["var"](1, usFmt),
    "Sample Standard Deviation": tpl.stdev(1, usFmt),
    "Minimum": tpl.min(usFmt),
    "Maximum": tpl.max(usFmt),
    "First": tpl.first(usFmt),
    "Last": tpl.last(usFmt),
    "Sum over Sum": tpl.sumOverSum(usFmt),
    "80% Upper Bound": tpl.sumOverSumBound80(true, usFmt),
    "80% Lower Bound": tpl.sumOverSumBound80(false, usFmt),
    "Sum as Fraction of Total": tpl.fractionOf(tpl.sum(), "total", usFmtPct),
    "Sum as Fraction of Rows": tpl.fractionOf(tpl.sum(), "row", usFmtPct),
    "Sum as Fraction of Columns": tpl.fractionOf(tpl.sum(), "col", usFmtPct),
    "Count as Fraction of Total": tpl.fractionOf(tpl.count(), "total", usFmtPct),
    "Count as Fraction of Rows": tpl.fractionOf(tpl.count(), "row", usFmtPct),
    "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col", usFmtPct)
  };
})(aggregatorTemplates);
var mthNamesEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
var dayNamesEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function zeroPad(number) {
  return ("0" + number).substr(-2, 2);
}
var derivers = {
  bin: function(col, binWidth) {
    return function(record) {
      return record[col] - record[col] % binWidth;
    };
  },
  dateFormat: function(col, formatString, utcOutput = false, mthNames = mthNamesEn, dayNames = dayNamesEn) {
    return function(record) {
      const date = new Date(Date.parse(record[col]));
      if (isNaN(date)) return "";
      const yr = utcOutput ? date.getUTCFullYear() : date.getFullYear();
      const mo = utcOutput ? date.getUTCMonth() : date.getMonth();
      const dy = utcOutput ? date.getUTCDate() : date.getDate();
      const dow = utcOutput ? date.getUTCDay() : date.getDay();
      const hr = utcOutput ? date.getUTCHours() : date.getHours();
      const min = utcOutput ? date.getUTCMinutes() : date.getMinutes();
      const sec = utcOutput ? date.getUTCSeconds() : date.getSeconds();
      return formatString.replace(/%(.)/g, function(_m, p) {
        switch (p) {
          case "y":
            return String(yr);
          case "m":
            return zeroPad(mo + 1);
          case "n":
            return mthNames[mo];
          case "d":
            return zeroPad(dy);
          case "w":
            return dayNames[dow];
          case "x":
            return String(dow);
          case "H":
            return zeroPad(hr);
          case "M":
            return zeroPad(min);
          case "S":
            return zeroPad(sec);
          default:
            return "%" + p;
        }
      });
    };
  }
};
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
var PivotData = class _PivotData {
  constructor(input, opts = {}) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
    this.input = input;
    this.aggregator = (_a = opts.aggregator) != null ? _a : aggregatorTemplates.count()();
    this.aggregatorName = (_b = opts.aggregatorName) != null ? _b : "Count";
    this.colAttrs = (_c = opts.cols) != null ? _c : [];
    this.rowAttrs = (_d = opts.rows) != null ? _d : [];
    this.valAttrs = (_e = opts.vals) != null ? _e : [];
    this.sorters = (_f = opts.sorters) != null ? _f : {};
    this.rowOrder = (_g = opts.rowOrder) != null ? _g : "key_a_to_z";
    this.colOrder = (_h = opts.colOrder) != null ? _h : "key_a_to_z";
    this.derivedAttributes = (_i = opts.derivedAttributes) != null ? _i : {};
    this.filter = (_j = opts.filter) != null ? _j : (() => true);
    this.tree = {};
    this.rowKeys = [];
    this.colKeys = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal = this.aggregator(this, [], []);
    this.sorted = false;
    if (!opts.lazy) {
      if (input.columnFormat && Object.keys(this.derivedAttributes).length === 0 && !opts.filter) {
        const len = input.columns[input.columnNames[0]].length;
        for (let i = 0; i < len; i++) {
          this.processRecord(i, input);
        }
      } else {
        _PivotData.forEachRecord(this.input, this.derivedAttributes, (record) => {
          if (this.filter(record)) this.processRecord(record);
        });
      }
    }
  }
  // ── Static ────────────────────────────────────────────────────────────────
  static forEachRecord(input, derivedAttributes, f) {
    let addRecord;
    if (Object.keys(derivedAttributes).length === 0) {
      addRecord = f;
    } else {
      addRecord = function(record) {
        for (const attr in derivedAttributes) {
          const derived = derivedAttributes[attr](record);
          record[attr] = derived != null ? derived : record[attr];
        }
        f(record);
      };
    }
    if (typeof input === "function") {
      input(addRecord);
    } else if (input.columnFormat) {
      const len = input.columns[input.columnNames[0]].length;
      const record = {};
      for (let i = 0; i < len; i++) {
        for (const name of input.columnNames) {
          const col = input.columns[name];
          const dict = input.dicts != null ? input.dicts[name] : void 0;
          record[name] = dict ? dict[col[i]] : col[i];
        }
        addRecord(record);
      }
    } else if (Array.isArray(input) && Array.isArray(input[0])) {
      const headers = input[0];
      for (let i = 1; i < input.length; i++) {
        const row = input[i];
        const record = {};
        for (let j = 0; j < headers.length; j++) {
          record[headers[j]] = row[j];
        }
        addRecord(record);
      }
    } else if (Array.isArray(input)) {
      for (const record of input) {
        addRecord(record);
      }
    } else if (input instanceof HTMLElement) {
      const headers = Array.prototype.slice.call(input.querySelectorAll("thead > tr > th")).map((th) => th.textContent);
      input.querySelectorAll("tbody > tr").forEach((tr) => {
        const record = {};
        tr.querySelectorAll("td").forEach((td, j) => {
          record[headers[j]] = td.textContent;
        });
        addRecord(record);
      });
    } else {
      throw new Error("unknown input format");
    }
  }
  // ── Instance methods ──────────────────────────────────────────────────────
  forEachMatchingRecord(criteria, callback) {
    _PivotData.forEachRecord(this.input, this.derivedAttributes, (record) => {
      if (!this.filter(record)) return;
      for (const k in criteria) {
        if (criteria[k] !== (record[k] != null ? record[k] : "null")) return;
      }
      callback(record);
    });
  }
  arrSort(attrs) {
    const sortersArr = attrs.map((a) => getSort(this.sorters, a));
    return function(a, b) {
      for (let i = 0; i < sortersArr.length; i++) {
        const comparison = sortersArr[i](a[i], b[i]);
        if (comparison !== 0) return comparison;
      }
      return 0;
    };
  }
  sortKeys() {
    if (!this.sorted) {
      this.sorted = true;
      const v = (r, c) => this.getAggregator(r, c).value();
      switch (this.rowOrder) {
        case "value_a_to_z":
          this.rowKeys.sort((a, b) => naturalSort(v(a, []), v(b, [])));
          break;
        case "value_z_to_a":
          this.rowKeys.sort((a, b) => -naturalSort(v(a, []), v(b, [])));
          break;
        default:
          this.rowKeys.sort(this.arrSort(this.rowAttrs));
      }
      switch (this.colOrder) {
        case "value_a_to_z":
          this.colKeys.sort((a, b) => naturalSort(v([], a), v([], b)));
          break;
        case "value_z_to_a":
          this.colKeys.sort((a, b) => -naturalSort(v([], a), v([], b)));
          break;
        default:
          this.colKeys.sort(this.arrSort(this.colAttrs));
      }
    }
  }
  getColKeys() {
    this.sortKeys();
    return this.colKeys;
  }
  getRowKeys() {
    this.sortKeys();
    return this.rowKeys;
  }
  processRecord(recordOrIndex, columnarInput) {
    var _a, _b, _c;
    const NULL_STR = String.fromCharCode(0);
    function readColumnarValue(col, dict, i) {
      if (col == null) return "null";
      return dict ? dict[col[i]] : col[i];
    }
    const colKey = [];
    const rowKey = [];
    let record;
    if (columnarInput != null) {
      const i = recordOrIndex;
      for (const attr of this.colAttrs) {
        colKey.push(readColumnarValue(columnarInput.columns[attr], (_a = columnarInput.dicts) == null ? void 0 : _a[attr], i));
      }
      for (const attr of this.rowAttrs) {
        rowKey.push(readColumnarValue(columnarInput.columns[attr], (_b = columnarInput.dicts) == null ? void 0 : _b[attr], i));
      }
      record = {};
      for (const attr of this.valAttrs) {
        record[attr] = readColumnarValue(columnarInput.columns[attr], (_c = columnarInput.dicts) == null ? void 0 : _c[attr], i);
      }
    } else {
      record = recordOrIndex;
      for (const attr of this.colAttrs) colKey.push(record[attr] != null ? record[attr] : "null");
      for (const attr of this.rowAttrs) rowKey.push(record[attr] != null ? record[attr] : "null");
    }
    const flatRowKey = rowKey.join(NULL_STR);
    const flatColKey = colKey.join(NULL_STR);
    this.allTotal.push(record);
    if (rowKey.length !== 0) {
      if (!this.rowTotals[flatRowKey]) {
        this.rowKeys.push(rowKey);
        this.rowTotals[flatRowKey] = this.aggregator(this, rowKey, []);
      }
      this.rowTotals[flatRowKey].push(record);
    }
    if (colKey.length !== 0) {
      if (!this.colTotals[flatColKey]) {
        this.colKeys.push(colKey);
        this.colTotals[flatColKey] = this.aggregator(this, [], colKey);
      }
      this.colTotals[flatColKey].push(record);
    }
    if (rowKey.length !== 0 && colKey.length !== 0) {
      if (!this.tree[flatRowKey]) this.tree[flatRowKey] = {};
      if (!this.tree[flatRowKey][flatColKey]) {
        this.tree[flatRowKey][flatColKey] = this.aggregator(this, rowKey, colKey);
      }
      this.tree[flatRowKey][flatColKey].push(record);
    }
  }
  pushRecord(record) {
    if (this.filter(record)) {
      this.sorted = false;
      this.processRecord(record);
    }
  }
  pushChunk(columnarInput, startIdx, endIdx) {
    this.sorted = false;
    for (let i = startIdx; i < endIdx; i++) {
      this.processRecord(i, columnarInput);
    }
  }
  getAggregator(rowKey, colKey) {
    var _a;
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));
    let agg;
    if (rowKey.length === 0 && colKey.length === 0) {
      agg = this.allTotal;
    } else if (rowKey.length === 0) {
      agg = this.colTotals[flatColKey];
    } else if (colKey.length === 0) {
      agg = this.rowTotals[flatRowKey];
    } else {
      agg = (_a = this.tree[flatRowKey]) == null ? void 0 : _a[flatColKey];
    }
    return agg != null ? agg : { push: () => {
    }, value: () => null, format: () => "" };
  }
};
var PivotStream = class {
  constructor(opts) {
    var _a;
    this.onComplete = (_a = opts == null ? void 0 : opts.onComplete) != null ? _a : (() => {
    });
    this._count = 0;
    this._colsInit = false;
    this._stringCols = [];
    this._numericCols = [];
    this._dicts = {};
    this._dictIndex = {};
    this._arrays = {};
  }
  // Detect column types from the first record and initialise storage
  _initCols(record) {
    for (const col of Object.keys(record)) {
      const val = record[col];
      if (typeof val === "number") {
        this._numericCols.push(col);
      } else {
        this._stringCols.push(col);
        this._dicts[col] = [];
        this._dictIndex[col] = /* @__PURE__ */ new Map();
      }
      this._arrays[col] = [];
    }
    this._colsInit = true;
  }
  // O(1) dictionary encoding via Map
  _enc(col, val) {
    const str = val != null ? String(val) : "null";
    if (!this._dictIndex[col].has(str)) {
      this._dictIndex[col].set(str, this._dicts[col].length);
      this._dicts[col].push(str);
    }
    return this._dictIndex[col].get(str);
  }
  // Push one record — values immediately encoded, no JS object retained
  push(record) {
    if (!this._colsInit) this._initCols(record);
    for (const col of this._stringCols) this._arrays[col].push(this._enc(col, record[col]));
    for (const col of this._numericCols) this._arrays[col].push(Number(record[col]) || 0);
    this._count++;
  }
  // Convert accumulated arrays → ColumnarInput ready for PivotData
  toColumnar() {
    const columns = {};
    const columnNames = [];
    const dicts = {};
    for (const col of this._stringCols) {
      columnNames.push(col);
      columns[col] = new Uint16Array(this._arrays[col]);
      dicts[col] = this._dicts[col];
    }
    for (const col of this._numericCols) {
      columnNames.push(col);
      columns[col] = new Float64Array(this._arrays[col]);
    }
    return { columnFormat: true, columnNames, columns, dicts };
  }
  // Signal end of stream — fires onComplete(null, totalCount, stream)
  done() {
    this.onComplete(null, this._count, this);
  }
  // Consume a fetch() response as NDJSON (one JSON object per line)
  fromFetch(url, fetchOpts) {
    return fetch(url, fetchOpts != null ? fetchOpts : {}).then((res) => {
      if (!res.ok) throw new Error("PivotStream fetch failed: " + res.status + " " + res.statusText);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const pump = () => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            buffer.split("\n").forEach((line) => {
              if (line.trim().length > 0) {
                try {
                  this.push(JSON.parse(line));
                } catch (e) {
                }
              }
            });
            this.done();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach((line) => {
            if (line.trim().length > 0) this.push(JSON.parse(line));
          });
          return pump();
        });
      };
      return pump();
    });
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
function el(tag, cls) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}
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
  let result = el("span");
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
var uiState = /* @__PURE__ */ new WeakMap();
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
function createPivotUI(container, input, inputOpts = {}, overwrite = false, locale = "en") {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  if (locales[locale] == null) locale = "en";
  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  const defaults = {
    derivedAttributes: {},
    aggregators: locales[locale].aggregators,
    renderers: Object.assign({}, renderers, vanillaRenderers),
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    menuLimit: 500,
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    exclusions: {},
    inclusions: {},
    unusedAttrsVertical: 85,
    autoSortUnusedAttrs: false,
    onRefresh: null,
    showUI: true,
    filter: () => true,
    sorters: {}
  };
  const existingOpts = uiState.get(container);
  const opts = !existingOpts || overwrite ? deepMerge({ rendererOptions: { localeStrings }, localeStrings }, Object.assign({}, defaults, inputOpts)) : existingOpts;
  try {
    const attrValues = {};
    const materializedInput = [];
    let recordsProcessed = 0;
    PivotData.forEachRecord(input, (_a = opts.derivedAttributes) != null ? _a : {}, (record) => {
      var _a2;
      if (!opts.filter(record)) return;
      materializedInput.push(record);
      for (const attr of Object.keys(record)) {
        if (attrValues[attr] == null) {
          attrValues[attr] = {};
          if (recordsProcessed > 0) attrValues[attr]["null"] = recordsProcessed;
        }
      }
      for (const attr of Object.keys(attrValues)) {
        const value = record[attr] != null ? String(record[attr]) : "null";
        attrValues[attr][value] = ((_a2 = attrValues[attr][value]) != null ? _a2 : 0) + 1;
      }
      recordsProcessed++;
    });
    const shownAttributes = Object.keys(attrValues).filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenAttributes) != null ? _a2 : []).includes(a);
    });
    const shownInAggregators = shownAttributes.filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenFromAggregators) != null ? _a2 : []).includes(a);
    });
    const shownInDragDrop = shownAttributes.filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenFromDragDrop) != null ? _a2 : []).includes(a);
    });
    let unusedVertical = opts.unusedAttrsVertical === true;
    if (!unusedVertical && opts.unusedAttrsVertical !== false) {
      const cutoff = opts.unusedAttrsVertical === "auto" ? 120 : Number(opts.unusedAttrsVertical);
      if (!isNaN(cutoff)) {
        unusedVertical = shownInDragDrop.reduce((sum, a) => sum + a.length, 0) > cutoff;
      }
    }
    const rendererControl = el("td", "pvtUiCell");
    const rendererSelect = el("select", "pvtRenderer");
    for (const name of Object.keys((_b = opts.renderers) != null ? _b : {})) {
      const o = el("option");
      o.value = name;
      o.textContent = name;
      rendererSelect.appendChild(o);
    }
    rendererControl.appendChild(rendererSelect);
    const unused = el("td", `pvtAxisContainer pvtUnused pvtUiCell ${unusedVertical ? "pvtVertList" : "pvtHorizList"}`);
    for (let i = 0; i < shownInDragDrop.length; i++) {
      const attr = shownInDragDrop[i];
      const values = Object.keys(attrValues[attr]);
      const filterBox = el("div", "pvtFilterBox");
      filterBox.style.display = "none";
      const h4 = el("h4");
      const nameSpan = el("span");
      nameSpan.textContent = attr;
      const countSpan = el("span", "count");
      countSpan.textContent = `(${values.length})`;
      h4.append(nameSpan, countSpan);
      filterBox.appendChild(h4);
      let hasExcludedItem = false;
      if (values.length > ((_c = opts.menuLimit) != null ? _c : 500)) {
        const p = el("p");
        p.innerHTML = localeStrings.tooMany;
        filterBox.appendChild(p);
      } else {
        if (values.length > 5) {
          const controls = el("p");
          const sorter = getSort(opts.sorters, attr);
          const searchBox = el("input");
          searchBox.className = "pvtSearch";
          searchBox.setAttribute("type", "text");
          searchBox.setAttribute("placeholder", localeStrings.filterResults);
          searchBox.addEventListener("keyup", () => {
            const filter = searchBox.value.toLowerCase().trim();
            const acceptGen = (prefix, accepted) => (v) => {
              const real = filter.substring(prefix.length).trim();
              return real.length === 0 || accepted.includes(Math.sign(sorter(v.toLowerCase(), real)));
            };
            const accept = filter.startsWith(">=") ? acceptGen(">=", [1, 0]) : filter.startsWith("<=") ? acceptGen("<=", [-1, 0]) : filter.startsWith(">") ? acceptGen(">", [1]) : filter.startsWith("<") ? acceptGen("<", [-1]) : filter.startsWith("~") ? (v) => filter.length <= 1 || !!v.toLowerCase().match(filter.slice(1)) : (v) => v.toLowerCase().includes(filter);
            filterBox.querySelectorAll(".pvtCheckContainer p").forEach((p) => {
              var _a2;
              const span = p.querySelector("label span.value");
              p.style.display = span && accept((_a2 = span.textContent) != null ? _a2 : "") ? "" : "none";
            });
          });
          const selectAllBtn = el("button");
          selectAllBtn.type = "button";
          const selectNoneBtn = el("button");
          selectNoneBtn.type = "button";
          selectAllBtn.innerHTML = localeStrings.selectAll;
          selectNoneBtn.innerHTML = localeStrings.selectNone;
          selectAllBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll("input.pvtFilter").forEach((cb) => {
              if (cb.offsetParent !== null && !cb.checked) {
                cb.checked = true;
                cb.classList.toggle("changed");
              }
            });
          });
          selectNoneBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll("input.pvtFilter").forEach((cb) => {
              if (cb.offsetParent !== null && cb.checked) {
                cb.checked = false;
                cb.classList.toggle("changed");
              }
            });
          });
          controls.append(searchBox, el("br"), selectAllBtn, selectNoneBtn);
          filterBox.appendChild(controls);
        }
        const checkContainer = el("div", "pvtCheckContainer");
        const sortedVals = [...values].sort(getSort(opts.sorters, attr));
        for (const value of sortedVals) {
          const valueCount = attrValues[attr][value];
          let excluded = false;
          if (((_d = opts.inclusions) != null ? _d : {})[attr]) {
            excluded = !opts.inclusions[attr].includes(value);
          } else if (((_e = opts.exclusions) != null ? _e : {})[attr]) {
            excluded = opts.exclusions[attr].includes(value);
          }
          hasExcludedItem = hasExcludedItem || excluded;
          const cb = el("input");
          cb.type = "checkbox";
          cb.className = "pvtFilter";
          cb.checked = !excluded;
          cb.dataset.filterAttr = attr;
          cb.dataset.filterValue = value;
          cb.addEventListener("change", () => cb.classList.toggle("changed"));
          const valSpan = el("span", "value");
          valSpan.textContent = value;
          const cntSpan = el("span", "count");
          cntSpan.textContent = `(${valueCount})`;
          const label = el("label");
          label.append(cb, valSpan, cntSpan);
          const row = el("p");
          row.appendChild(label);
          checkContainer.appendChild(row);
        }
        filterBox.appendChild(checkContainer);
      }
      const attrElem = el("li", `axis_${i}`);
      const closeFilterBox = () => {
        const all = filterBox.querySelectorAll("[type='checkbox']").length;
        const checked = filterBox.querySelectorAll("[type='checkbox']:checked").length;
        attrElem.classList.toggle("pvtFilteredAttribute", all > checked);
        const search = filterBox.querySelector(".pvtSearch");
        if (search) search.value = "";
        filterBox.querySelectorAll(".pvtCheckContainer p").forEach((p) => p.style.display = "");
        filterBox.style.display = "none";
      };
      const finalBtns = el("p");
      if (values.length <= ((_f = opts.menuLimit) != null ? _f : 500)) {
        const applyBtn = el("button");
        applyBtn.type = "button";
        applyBtn.textContent = localeStrings.apply;
        applyBtn.addEventListener("click", () => {
          const changed = [...filterBox.querySelectorAll(".changed")];
          changed.forEach((n) => n.classList.remove("changed"));
          if (changed.length > 0) refresh();
          closeFilterBox();
        });
        finalBtns.appendChild(applyBtn);
      }
      const cancelBtn = el("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = localeStrings.cancel;
      cancelBtn.addEventListener("click", () => {
        filterBox.querySelectorAll(".changed:checked").forEach((cb) => {
          cb.classList.remove("changed");
          cb.checked = false;
        });
        filterBox.querySelectorAll(".changed:not(:checked)").forEach((cb) => {
          cb.classList.remove("changed");
          cb.checked = true;
        });
        closeFilterBox();
      });
      finalBtns.appendChild(cancelBtn);
      filterBox.appendChild(finalBtns);
      const triangleLink = el("span", "pvtTriangle");
      triangleLink.innerHTML = " &#x25BE;";
      triangleLink.addEventListener("click", (e) => {
        const trigRect = e.currentTarget.getBoundingClientRect();
        const tableRect = uiTable.getBoundingClientRect();
        filterBox.style.left = `${trigRect.left - tableRect.left + 10}px`;
        filterBox.style.top = `${trigRect.top - tableRect.top + 10}px`;
        filterBox.style.display = "";
      });
      const attrSpan = el("span", "pvtAttr");
      attrSpan.textContent = attr;
      attrSpan.dataset.attrName = attr;
      attrSpan.appendChild(triangleLink);
      attrElem.appendChild(attrSpan);
      if (hasExcludedItem) attrElem.classList.add("pvtFilteredAttribute");
      unused.appendChild(attrElem);
      unused.appendChild(filterBox);
    }
    const aggregatorSelect = el("select", "pvtAggregator");
    for (const name of Object.keys((_g = opts.aggregators) != null ? _g : {})) {
      const o = el("option");
      o.value = name;
      o.textContent = name;
      aggregatorSelect.appendChild(o);
    }
    const ordering = {
      key_a_to_z: { rowSymbol: "&varr;", colSymbol: "&harr;", next: "value_a_to_z" },
      value_a_to_z: { rowSymbol: "&darr;", colSymbol: "&rarr;", next: "value_z_to_a" },
      value_z_to_a: { rowSymbol: "&uarr;", colSymbol: "&larr;", next: "key_a_to_z" }
    };
    const rowOrderBtn = el("a", "pvtRowOrder");
    rowOrderBtn.setAttribute("role", "button");
    rowOrderBtn.dataset.order = (_h = opts.rowOrder) != null ? _h : "key_a_to_z";
    rowOrderBtn.innerHTML = ordering[rowOrderBtn.dataset.order].rowSymbol;
    rowOrderBtn.addEventListener("click", () => {
      rowOrderBtn.dataset.order = ordering[rowOrderBtn.dataset.order].next;
      rowOrderBtn.innerHTML = ordering[rowOrderBtn.dataset.order].rowSymbol;
      refresh();
    });
    const colOrderBtn = el("a", "pvtColOrder");
    colOrderBtn.setAttribute("role", "button");
    colOrderBtn.dataset.order = (_i = opts.colOrder) != null ? _i : "key_a_to_z";
    colOrderBtn.innerHTML = ordering[colOrderBtn.dataset.order].colSymbol;
    colOrderBtn.addEventListener("click", () => {
      colOrderBtn.dataset.order = ordering[colOrderBtn.dataset.order].next;
      colOrderBtn.innerHTML = ordering[colOrderBtn.dataset.order].colSymbol;
      refresh();
    });
    const uiTable = el("table", "pvtUi");
    uiTable.setAttribute("cellpadding", "5");
    const valsCell = el("td", "pvtVals pvtUiCell");
    valsCell.append(aggregatorSelect, rowOrderBtn, colOrderBtn, el("br"));
    const colsCell = el("td", "pvtAxisContainer pvtHorizList pvtCols pvtUiCell");
    const tr1 = el("tr");
    tr1.append(valsCell, colsCell);
    const rowsCell = el("td", "pvtAxisContainer pvtRows pvtUiCell");
    rowsCell.setAttribute("valign", "top");
    const pivotTableCell = el("td", "pvtRendererArea");
    pivotTableCell.setAttribute("valign", "top");
    const tr2 = el("tr");
    tr2.append(rowsCell, pivotTableCell);
    if (unusedVertical) {
      tr1.insertBefore(rendererControl, tr1.firstChild);
      tr2.insertBefore(unused, tr2.firstChild);
      uiTable.append(tr1, tr2);
    } else {
      const topRow = el("tr");
      topRow.append(rendererControl, unused);
      uiTable.append(topRow, tr1, tr2);
    }
    container.innerHTML = "";
    container.appendChild(uiTable);
    for (const colAttr of (_j = opts.cols) != null ? _j : []) {
      const idx = shownInDragDrop.indexOf(colAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) colsCell.appendChild(pill);
    }
    for (const rowAttr of (_k = opts.rows) != null ? _k : []) {
      const idx = shownInDragDrop.indexOf(rowAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) rowsCell.appendChild(pill);
    }
    if (opts.aggregatorName) aggregatorSelect.value = opts.aggregatorName;
    if (opts.rendererName) rendererSelect.value = opts.rendererName;
    if (!opts.showUI) {
      container.querySelectorAll(".pvtUiCell").forEach((c) => c.style.display = "none");
    }
    let initialRender = true;
    const refreshDelayed = () => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      const currentRows = [];
      const currentCols = [];
      container.querySelectorAll(".pvtRows li span.pvtAttr").forEach((s) => currentRows.push(s.dataset.attrName));
      container.querySelectorAll(".pvtCols li span.pvtAttr").forEach((s) => currentCols.push(s.dataset.attrName));
      let numInputsNeeded = (_d2 = (_c2 = (_b2 = (_a2 = opts.aggregators) == null ? void 0 : _a2[aggregatorSelect.value]) == null ? void 0 : _b2.call(_a2, [])) == null ? void 0 : _c2().numInputs) != null ? _d2 : 0;
      const vals = [];
      for (const dd of [...container.querySelectorAll(".pvtVals select.pvtAttrDropdown")]) {
        if (numInputsNeeded === 0) {
          dd.remove();
        } else {
          numInputsNeeded--;
          if (dd.value !== "") vals.push(dd.value);
        }
      }
      for (let t = 0; t < numInputsNeeded; t++) {
        const dd = el("select", "pvtAttrDropdown");
        const emptyOpt = el("option");
        emptyOpt.value = "";
        dd.appendChild(emptyOpt);
        for (const a of shownInAggregators) {
          const o = el("option");
          o.value = a;
          o.textContent = a;
          dd.appendChild(o);
        }
        dd.addEventListener("change", refresh);
        valsCell.appendChild(dd);
      }
      if (initialRender) {
        const initVals = (_e2 = opts.vals) != null ? _e2 : [];
        let vi = 0;
        container.querySelectorAll(".pvtVals select.pvtAttrDropdown").forEach((dd) => {
          var _a3;
          dd.value = (_a3 = initVals[vi++]) != null ? _a3 : "";
        });
        initialRender = false;
      }
      const currentVals = [];
      container.querySelectorAll(".pvtVals select.pvtAttrDropdown").forEach((dd) => {
        if (dd.value !== "") currentVals.push(dd.value);
      });
      const exclusions = {};
      container.querySelectorAll("input.pvtFilter:not(:checked)").forEach((cb) => {
        var _a3;
        const attr = cb.dataset.filterAttr;
        const val = cb.dataset.filterValue;
        (exclusions[attr] = (_a3 = exclusions[attr]) != null ? _a3 : []).push(val);
      });
      const inclusions = {};
      container.querySelectorAll("input.pvtFilter:checked").forEach((cb) => {
        var _a3;
        const attr = cb.dataset.filterAttr;
        const val = cb.dataset.filterValue;
        if (exclusions[attr] != null) (inclusions[attr] = (_a3 = inclusions[attr]) != null ? _a3 : []).push(val);
      });
      const subopts = {
        derivedAttributes: opts.derivedAttributes,
        localeStrings: opts.localeStrings,
        rendererOptions: opts.rendererOptions,
        sorters: opts.sorters,
        cols: currentCols,
        rows: currentRows,
        vals: currentVals,
        dataClass: opts.dataClass,
        aggregatorName: aggregatorSelect.value,
        aggregator: opts.aggregators[aggregatorSelect.value](currentVals),
        renderer: opts.renderers[rendererSelect.value],
        rowOrder: rowOrderBtn.dataset.order,
        colOrder: colOrderBtn.dataset.order,
        filter: (record) => {
          if (!opts.filter(record)) return false;
          for (const k of Object.keys(exclusions)) {
            const v = record[k] != null ? String(record[k]) : "null";
            if (exclusions[k].includes(v)) return false;
          }
          return true;
        }
      };
      createPivot(pivotTableCell, materializedInput, subopts);
      const savedState = Object.assign({}, opts, {
        cols: currentCols,
        rows: currentRows,
        vals: currentVals,
        colOrder: colOrderBtn.dataset.order,
        rowOrder: rowOrderBtn.dataset.order,
        exclusions,
        inclusions,
        inclusionsInfo: inclusions,
        aggregatorName: aggregatorSelect.value,
        rendererName: rendererSelect.value
      });
      uiState.set(container, savedState);
      if (opts.autoSortUnusedAttrs) {
        const uc = container.querySelector("td.pvtUnused.pvtAxisContainer");
        if (uc) {
          [...uc.querySelectorAll("li")].sort((a, b) => {
            var _a3, _b3;
            return naturalSort((_a3 = a.textContent) != null ? _a3 : "", (_b3 = b.textContent) != null ? _b3 : "");
          }).forEach((li) => uc.appendChild(li));
        }
      }
      pivotTableCell.style.opacity = "1";
      (_f2 = opts.onRefresh) == null ? void 0 : _f2.call(opts, savedState);
    };
    const refresh = () => {
      pivotTableCell.style.opacity = "0.5";
      setTimeout(refreshDelayed, 10);
    };
    aggregatorSelect.addEventListener("change", refresh);
    rendererSelect.addEventListener("change", refresh);
    const sortables = [];
    container.querySelectorAll(".pvtAxisContainer").forEach((axisEl) => {
      sortables.push(
        import_sortablejs.default.create(axisEl, {
          group: "pvtAttrs",
          animation: 150,
          filter: ".pvtFilterBox",
          // don't accidentally drag the popup
          ghostClass: "pvtPlaceholder",
          // reuse pivot.css dashed-outline style
          onEnd: refresh
        })
      );
    });
    refresh();
    return {
      destroy() {
        sortables.forEach((s) => s.destroy());
        container.innerHTML = "";
        uiState.delete(container);
      }
    };
  } catch (e) {
    console.error(e);
    container.textContent = localeStrings.uiRenderError;
    return { destroy() {
      container.innerHTML = "";
    } };
  }
}
var pivotUtilities = {
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
  PivotStream
};

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
//# sourceMappingURL=jquery.js.map