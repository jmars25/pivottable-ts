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
  opts = Object.assign({}, defaults, opts);
  return function(x) {
    if (isNaN(x) || !isFinite(x)) return "";
    const result = addSeparators(
      (opts.scaler * x).toFixed(opts.digitsAfterDecimal),
      opts.thousandsSep,
      opts.decimalSep
    );
    return "" + opts.prefix + result + opts.suffix;
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
    const utc = utcOutput ? "UTC" : "";
    return function(record) {
      const date = new Date(Date.parse(record[col]));
      if (isNaN(date)) return "";
      return formatString.replace(/%(.)/g, function(_m, p) {
        switch (p) {
          case "y":
            return date["get" + utc + "FullYear"]();
          case "m":
            return zeroPad(date["get" + utc + "Month"]() + 1);
          case "n":
            return mthNames[date["get" + utc + "Month"]()];
          case "d":
            return zeroPad(date["get" + utc + "Date"]());
          case "w":
            return dayNames[date["get" + utc + "Day"]()];
          case "x":
            return date["get" + utc + "Day"]();
          case "H":
            return zeroPad(date["get" + utc + "Hours"]());
          case "M":
            return zeroPad(date["get" + utc + "Minutes"]());
          case "S":
            return zeroPad(date["get" + utc + "Seconds"]());
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
var PivotData = (function() {
  function PivotData2(input, opts) {
    if (opts == null) opts = {};
    this.getAggregator = this.getAggregator.bind(this);
    this.getRowKeys = this.getRowKeys.bind(this);
    this.getColKeys = this.getColKeys.bind(this);
    this.sortKeys = this.sortKeys.bind(this);
    this.arrSort = this.arrSort.bind(this);
    this.input = input;
    this.aggregator = opts.aggregator != null ? opts.aggregator : aggregatorTemplates.count()();
    this.aggregatorName = opts.aggregatorName != null ? opts.aggregatorName : "Count";
    this.colAttrs = opts.cols != null ? opts.cols : [];
    this.rowAttrs = opts.rows != null ? opts.rows : [];
    this.valAttrs = opts.vals != null ? opts.vals : [];
    this.sorters = opts.sorters != null ? opts.sorters : {};
    this.rowOrder = opts.rowOrder != null ? opts.rowOrder : "key_a_to_z";
    this.colOrder = opts.colOrder != null ? opts.colOrder : "key_a_to_z";
    this.derivedAttributes = opts.derivedAttributes != null ? opts.derivedAttributes : {};
    this.filter = opts.filter != null ? opts.filter : function() {
      return true;
    };
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
        PivotData2.forEachRecord(this.input, this.derivedAttributes, (record) => {
          if (this.filter(record)) this.processRecord(record);
        });
      }
    }
  }
  PivotData2.forEachRecord = function(input, derivedAttributes, f) {
    let addRecord;
    if (Object.keys(derivedAttributes).length === 0) {
      addRecord = f;
    } else {
      addRecord = function(record) {
        for (const attr in derivedAttributes) {
          const deriver = derivedAttributes[attr];
          const derived = deriver(record);
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
  };
  PivotData2.prototype.forEachMatchingRecord = function(criteria, callback) {
    return PivotData2.forEachRecord(this.input, this.derivedAttributes, (record) => {
      if (!this.filter(record)) return;
      for (const k in criteria) {
        const v = criteria[k];
        if (v !== (record[k] != null ? record[k] : "null")) return;
      }
      callback(record);
    });
  };
  PivotData2.prototype.arrSort = function(attrs) {
    const sortersArr = attrs.map((a) => getSort(this.sorters, a));
    return function(a, b) {
      for (let i = 0; i < sortersArr.length; i++) {
        const comparison = sortersArr[i](a[i], b[i]);
        if (comparison !== 0) return comparison;
      }
      return 0;
    };
  };
  PivotData2.prototype.sortKeys = function() {
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
  };
  PivotData2.prototype.getColKeys = function() {
    this.sortKeys();
    return this.colKeys;
  };
  PivotData2.prototype.getRowKeys = function() {
    this.sortKeys();
    return this.rowKeys;
  };
  PivotData2.prototype.processRecord = function(recordOrIndex, columnarInput) {
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
  };
  PivotData2.prototype.pushRecord = function(record) {
    if (this.filter(record)) {
      this.sorted = false;
      this.processRecord(record);
    }
  };
  PivotData2.prototype.pushChunk = function(columnarInput, startIdx, endIdx) {
    this.sorted = false;
    for (let i = startIdx; i < endIdx; i++) {
      this.processRecord(i, columnarInput);
    }
  };
  PivotData2.prototype.getAggregator = function(rowKey, colKey) {
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
  };
  return PivotData2;
})();
var PivotStream = (function() {
  function PivotStream2(opts) {
    if (opts == null) opts = {};
    this.onComplete = opts.onComplete != null ? opts.onComplete : function() {
    };
    this._count = 0;
    this._colsInit = false;
    this._stringCols = [];
    this._numericCols = [];
    this._dicts = {};
    this._dictIndex = {};
    this._arrays = {};
  }
  PivotStream2.prototype._initCols = function(record) {
    for (const col of Object.keys(record)) {
      const val = record[col];
      if (typeof val === "number") {
        this._numericCols.push(col);
        this._arrays[col] = [];
      } else {
        this._stringCols.push(col);
        this._dicts[col] = [];
        this._dictIndex[col] = /* @__PURE__ */ new Map();
        this._arrays[col] = [];
      }
    }
    this._colsInit = true;
  };
  PivotStream2.prototype._enc = function(col, val) {
    const str = val != null ? String(val) : "null";
    if (!this._dictIndex[col].has(str)) {
      this._dictIndex[col].set(str, this._dicts[col].length);
      this._dicts[col].push(str);
    }
    return this._dictIndex[col].get(str);
  };
  PivotStream2.prototype.push = function(record) {
    if (!this._colsInit) this._initCols(record);
    for (const col of this._stringCols) this._arrays[col].push(this._enc(col, record[col]));
    for (const col of this._numericCols) this._arrays[col].push(Number(record[col]) || 0);
    this._count++;
  };
  PivotStream2.prototype.toColumnar = function() {
    const columns = {};
    const columnNames = [];
    const dicts = {};
    const allCols = this._stringCols.concat(this._numericCols);
    for (const col of allCols) {
      columnNames.push(col);
      if (this._stringCols.indexOf(col) !== -1) {
        columns[col] = new Uint16Array(this._arrays[col]);
        dicts[col] = this._dicts[col];
      } else {
        columns[col] = new Float64Array(this._arrays[col]);
      }
    }
    return { columnFormat: true, columnNames, columns, dicts };
  };
  PivotStream2.prototype.done = function() {
    return this.onComplete(null, this._count, this);
  };
  PivotStream2.prototype.fromFetch = function(url, fetchOpts) {
    const self = this;
    return fetch(url, fetchOpts != null ? fetchOpts : {}).then(function(res) {
      if (!res.ok) throw new Error("PivotStream fetch failed: " + res.status + " " + res.statusText);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      function pump() {
        return reader.read().then(function({ done, value }) {
          if (done) {
            buffer.split("\n").forEach((line) => {
              if (line.trim().length > 0) {
                try {
                  self.push(JSON.parse(line));
                } catch (e) {
                }
              }
            });
            self.done();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop();
          lines.forEach((line) => {
            if (line.trim().length > 0) self.push(JSON.parse(line));
          });
          return pump();
        });
      }
      return pump();
    });
  };
  return PivotStream2;
})();
function pivotTableRenderer(pivotData, opts) {
  const table = Object.assign({ clickCallback: null, rowTotals: true, colTotals: true }, opts && opts.table);
  const localeStrings = Object.assign({ totals: "Totals" }, opts && opts.localeStrings);
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
  const getClickHandler = table.clickCallback ? function(value, rowValues, colValues) {
    const filters = {};
    colAttrs.forEach((attr, i) => {
      if (colValues[i] != null) filters[attr] = colValues[i];
    });
    rowAttrs.forEach((attr, i) => {
      if (rowValues[i] != null) filters[attr] = rowValues[i];
    });
    return (e) => table.clickCallback(e, value, filters, pivotData);
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

// src/adapters/jquery.ts
var indexOf = [].indexOf;
var hasProp = {}.hasOwnProperty;
var renderers2 = Object.assign({}, renderers, {
  "Table Barchart": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).barchart();
  },
  "Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("heatmap", opts);
  },
  "Row Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("rowheatmap", opts);
  },
  "Col Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("colheatmap", opts);
  }
});
$.pivotUtilities = {
  aggregatorTemplates,
  aggregators,
  renderers: renderers2,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  PivotData,
  PivotStream
};
$.fn.pivot = function(input, inputOpts, locale) {
  var defaults, e, localeDefaults, localeStrings, opts, pivotData, result, x;
  if (locale == null) {
    locale = "en";
  }
  if (locales[locale] == null) {
    locale = "en";
  }
  defaults = {
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    filter: function() {
      return true;
    },
    aggregator: aggregatorTemplates.count()(),
    aggregatorName: "Count",
    sorters: {},
    derivedAttributes: {},
    renderer: pivotTableRenderer
  };
  localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = {
    rendererOptions: {
      localeStrings
    },
    localeStrings
  };
  opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));
  result = null;
  try {
    pivotData = new opts.dataClass(input, opts);
    try {
      result = opts.renderer(pivotData, opts.rendererOptions);
    } catch (error) {
      e = error;
      if (typeof console !== "undefined" && console !== null) {
        console.error(e.stack);
      }
      result = $("<span>").html(opts.localeStrings.renderError);
    }
  } catch (error) {
    e = error;
    if (typeof console !== "undefined" && console !== null) {
      console.error(e.stack);
    }
    result = $("<span>").html(opts.localeStrings.computeError);
  }
  x = this[0];
  while (x.hasChildNodes()) {
    x.removeChild(x.lastChild);
  }
  return this.append(result);
};
$.fn.pivotUI = function(input, inputOpts, overwrite, locale) {
  var a, aggregator, attr, attrLength, attrValues, c, colOrderArrow, defaults, e, existingOpts, fn1, i, initialRender, l, len1, len2, len3, localeDefaults, localeStrings, materializedInput, n, o, opts, ordering, pivotTable, recordsProcessed, ref, ref1, ref2, ref3, refresh, refreshDelayed, renderer, rendererControl, rowOrderArrow, shownAttributes, shownInAggregators, shownInDragDrop, tr1, tr2, uiTable, unused, unusedAttrsVerticalAutoCutoff, unusedAttrsVerticalAutoOverride, x;
  if (overwrite == null) {
    overwrite = false;
  }
  if (locale == null) {
    locale = "en";
  }
  if (locales[locale] == null) {
    locale = "en";
  }
  defaults = {
    derivedAttributes: {},
    aggregators: locales[locale].aggregators,
    renderers: renderers2,
    // use jQuery renderers, not just core "Table"
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
    filter: function() {
      return true;
    },
    sorters: {}
  };
  localeStrings = $.extend(true, {}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = {
    rendererOptions: {
      localeStrings
    },
    localeStrings
  };
  existingOpts = this.data("pivotUIOptions");
  if (existingOpts == null || overwrite) {
    opts = $.extend(true, {}, localeDefaults, $.extend({}, defaults, inputOpts));
  } else {
    opts = existingOpts;
  }
  try {
    attrValues = {};
    materializedInput = [];
    recordsProcessed = 0;
    PivotData.forEachRecord(input, opts.derivedAttributes, function(record) {
      var attr2, base, ref4, value;
      if (!opts.filter(record)) {
        return;
      }
      materializedInput.push(record);
      for (attr2 in record) {
        if (!hasProp.call(record, attr2)) continue;
        if (attrValues[attr2] == null) {
          attrValues[attr2] = {};
          if (recordsProcessed > 0) {
            attrValues[attr2]["null"] = recordsProcessed;
          }
        }
      }
      for (attr2 in attrValues) {
        value = (ref4 = record[attr2]) != null ? ref4 : "null";
        if ((base = attrValues[attr2])[value] == null) {
          base[value] = 0;
        }
        attrValues[attr2][value]++;
      }
      return recordsProcessed++;
    });
    uiTable = $("<table>", {
      "class": "pvtUi"
    }).attr("cellpadding", 5);
    rendererControl = $("<td>").addClass("pvtUiCell");
    renderer = $("<select>").addClass("pvtRenderer").appendTo(rendererControl).bind("change", function() {
      return refresh();
    });
    ref = opts.renderers;
    for (x in ref) {
      if (!hasProp.call(ref, x)) continue;
      $("<option>").val(x).html(x).appendTo(renderer);
    }
    unused = $("<td>").addClass("pvtAxisContainer pvtUnused pvtUiCell");
    shownAttributes = (function() {
      var results;
      results = [];
      for (a in attrValues) {
        if (indexOf.call(opts.hiddenAttributes, a) < 0) {
          results.push(a);
        }
      }
      return results;
    })();
    shownInAggregators = (function() {
      var l2, len12, results;
      results = [];
      for (l2 = 0, len12 = shownAttributes.length; l2 < len12; l2++) {
        c = shownAttributes[l2];
        if (indexOf.call(opts.hiddenFromAggregators, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    shownInDragDrop = (function() {
      var l2, len12, results;
      results = [];
      for (l2 = 0, len12 = shownAttributes.length; l2 < len12; l2++) {
        c = shownAttributes[l2];
        if (indexOf.call(opts.hiddenFromDragDrop, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    unusedAttrsVerticalAutoOverride = false;
    if (opts.unusedAttrsVertical === "auto") {
      unusedAttrsVerticalAutoCutoff = 120;
    } else {
      unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
    }
    if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
      attrLength = 0;
      for (l = 0, len1 = shownInDragDrop.length; l < len1; l++) {
        a = shownInDragDrop[l];
        attrLength += a.length;
      }
      unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
    }
    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      unused.addClass("pvtVertList");
    } else {
      unused.addClass("pvtHorizList");
    }
    fn1 = function(attr2) {
      var attrElem, checkContainer, closeFilterBox, controls, filterItem, filterItemExcluded, finalButtons, hasExcludedItem, len22, n2, placeholder, ref12, sorter, triangleLink, v, value, valueCount, valueList, values;
      values = (function() {
        var results;
        results = [];
        for (v in attrValues[attr2]) {
          results.push(v);
        }
        return results;
      })();
      hasExcludedItem = false;
      valueList = $("<div>").addClass("pvtFilterBox").hide();
      valueList.append($("<h4>").append($("<span>").text(attr2), $("<span>").addClass("count").text("(" + values.length + ")")));
      if (values.length > opts.menuLimit) {
        valueList.append($("<p>").html(opts.localeStrings.tooMany));
      } else {
        if (values.length > 5) {
          controls = $("<p>").appendTo(valueList);
          sorter = getSort(opts.sorters, attr2);
          placeholder = opts.localeStrings.filterResults;
          $("<input>", {
            type: "text"
          }).appendTo(controls).attr({
            placeholder,
            "class": "pvtSearch"
          }).bind("keyup", function() {
            var accept, accept_gen, filter;
            filter = $(this).val().toLowerCase().trim();
            accept_gen = function(prefix, accepted) {
              return function(v2) {
                var real_filter, ref13;
                real_filter = filter.substring(prefix.length).trim();
                if (real_filter.length === 0) {
                  return true;
                }
                return ref13 = Math.sign(sorter(v2.toLowerCase(), real_filter)), indexOf.call(accepted, ref13) >= 0;
              };
            };
            accept = filter.indexOf(">=") === 0 ? accept_gen(">=", [1, 0]) : filter.indexOf("<=") === 0 ? accept_gen("<=", [-1, 0]) : filter.indexOf(">") === 0 ? accept_gen(">", [1]) : filter.indexOf("<") === 0 ? accept_gen("<", [-1]) : filter.indexOf("~") === 0 ? function(v2) {
              if (filter.substring(1).trim().length === 0) {
                return true;
              }
              return v2.toLowerCase().match(filter.substring(1));
            } : function(v2) {
              return v2.toLowerCase().indexOf(filter) !== -1;
            };
            return valueList.find(".pvtCheckContainer p label span.value").each(function() {
              if (accept($(this).text())) {
                return $(this).parent().parent().show();
              } else {
                return $(this).parent().parent().hide();
              }
            });
          });
          controls.append($("<br>"));
          $("<button>", {
            type: "button"
          }).appendTo(controls).html(opts.localeStrings.selectAll).bind("click", function() {
            valueList.find("input:visible:not(:checked)").prop("checked", true).toggleClass("changed");
            return false;
          });
          $("<button>", {
            type: "button"
          }).appendTo(controls).html(opts.localeStrings.selectNone).bind("click", function() {
            valueList.find("input:visible:checked").prop("checked", false).toggleClass("changed");
            return false;
          });
        }
        checkContainer = $("<div>").addClass("pvtCheckContainer").appendTo(valueList);
        ref12 = values.sort(getSort(opts.sorters, attr2));
        for (n2 = 0, len22 = ref12.length; n2 < len22; n2++) {
          value = ref12[n2];
          valueCount = attrValues[attr2][value];
          filterItem = $("<label>");
          filterItemExcluded = false;
          if (opts.inclusions[attr2]) {
            filterItemExcluded = indexOf.call(opts.inclusions[attr2], value) < 0;
          } else if (opts.exclusions[attr2]) {
            filterItemExcluded = indexOf.call(opts.exclusions[attr2], value) >= 0;
          }
          hasExcludedItem || (hasExcludedItem = filterItemExcluded);
          $("<input>").attr("type", "checkbox").addClass("pvtFilter").attr("checked", !filterItemExcluded).data("filter", [attr2, value]).appendTo(filterItem).bind("change", function() {
            return $(this).toggleClass("changed");
          });
          filterItem.append($("<span>").addClass("value").text(value));
          filterItem.append($("<span>").addClass("count").text("(" + valueCount + ")"));
          checkContainer.append($("<p>").append(filterItem));
        }
      }
      closeFilterBox = function() {
        if (valueList.find("[type='checkbox']").length > valueList.find("[type='checkbox']:checked").length) {
          attrElem.addClass("pvtFilteredAttribute");
        } else {
          attrElem.removeClass("pvtFilteredAttribute");
        }
        valueList.find(".pvtSearch").val("");
        valueList.find(".pvtCheckContainer p").show();
        return valueList.hide();
      };
      finalButtons = $("<p>").appendTo(valueList);
      if (values.length <= opts.menuLimit) {
        $("<button>", {
          type: "button"
        }).text(opts.localeStrings.apply).appendTo(finalButtons).bind("click", function() {
          if (valueList.find(".changed").removeClass("changed").length) {
            refresh();
          }
          return closeFilterBox();
        });
      }
      $("<button>", {
        type: "button"
      }).text(opts.localeStrings.cancel).appendTo(finalButtons).bind("click", function() {
        valueList.find(".changed:checked").removeClass("changed").prop("checked", false);
        valueList.find(".changed:not(:checked)").removeClass("changed").prop("checked", true);
        return closeFilterBox();
      });
      triangleLink = $("<span>").addClass("pvtTriangle").html(" &#x25BE;").bind("click", function(e2) {
        var left, ref22, top;
        ref22 = $(e2.currentTarget).position(), left = ref22.left, top = ref22.top;
        return valueList.css({
          left: left + 10,
          top: top + 10
        }).show();
      });
      attrElem = $("<li>").addClass("axis_" + i).append($("<span>").addClass("pvtAttr").text(attr2).data("attrName", attr2).append(triangleLink));
      if (hasExcludedItem) {
        attrElem.addClass("pvtFilteredAttribute");
      }
      return unused.append(attrElem).append(valueList);
    };
    for (i in shownInDragDrop) {
      if (!hasProp.call(shownInDragDrop, i)) continue;
      attr = shownInDragDrop[i];
      fn1(attr);
    }
    tr1 = $("<tr>").appendTo(uiTable);
    aggregator = $("<select>").addClass("pvtAggregator").bind("change", function() {
      return refresh();
    });
    ref1 = opts.aggregators;
    for (x in ref1) {
      if (!hasProp.call(ref1, x)) continue;
      aggregator.append($("<option>").val(x).html(x));
    }
    ordering = {
      key_a_to_z: {
        rowSymbol: "&varr;",
        colSymbol: "&harr;",
        next: "value_a_to_z"
      },
      value_a_to_z: {
        rowSymbol: "&darr;",
        colSymbol: "&rarr;",
        next: "value_z_to_a"
      },
      value_z_to_a: {
        rowSymbol: "&uarr;",
        colSymbol: "&larr;",
        next: "key_a_to_z"
      }
    };
    rowOrderArrow = $("<a>", {
      role: "button"
    }).addClass("pvtRowOrder").data("order", opts.rowOrder).html(ordering[opts.rowOrder].rowSymbol).bind("click", function() {
      $(this).data("order", ordering[$(this).data("order")].next);
      $(this).html(ordering[$(this).data("order")].rowSymbol);
      return refresh();
    });
    colOrderArrow = $("<a>", {
      role: "button"
    }).addClass("pvtColOrder").data("order", opts.colOrder).html(ordering[opts.colOrder].colSymbol).bind("click", function() {
      $(this).data("order", ordering[$(this).data("order")].next);
      $(this).html(ordering[$(this).data("order")].colSymbol);
      return refresh();
    });
    $("<td>").addClass("pvtVals pvtUiCell").appendTo(tr1).append(aggregator).append(rowOrderArrow).append(colOrderArrow).append($("<br>"));
    $("<td>").addClass("pvtAxisContainer pvtHorizList pvtCols pvtUiCell").appendTo(tr1);
    tr2 = $("<tr>").appendTo(uiTable);
    tr2.append($("<td>").addClass("pvtAxisContainer pvtRows pvtUiCell").attr("valign", "top"));
    pivotTable = $("<td>").attr("valign", "top").addClass("pvtRendererArea").appendTo(tr2);
    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      uiTable.find("tr:nth-child(1)").prepend(rendererControl);
      uiTable.find("tr:nth-child(2)").prepend(unused);
    } else {
      uiTable.prepend($("<tr>").append(rendererControl).append(unused));
    }
    this.html(uiTable);
    ref2 = opts.cols;
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      x = ref2[n];
      this.find(".pvtCols").append(this.find(".axis_" + $.inArray(x, shownInDragDrop)));
    }
    ref3 = opts.rows;
    for (o = 0, len3 = ref3.length; o < len3; o++) {
      x = ref3[o];
      this.find(".pvtRows").append(this.find(".axis_" + $.inArray(x, shownInDragDrop)));
    }
    if (opts.aggregatorName != null) {
      this.find(".pvtAggregator").val(opts.aggregatorName);
    }
    if (opts.rendererName != null) {
      this.find(".pvtRenderer").val(opts.rendererName);
    }
    if (!opts.showUI) {
      this.find(".pvtUiCell").hide();
    }
    initialRender = true;
    refreshDelayed = /* @__PURE__ */ (function(_this) {
      return function() {
        var exclusions, inclusions, len4, newDropdown, numInputsToProcess, pivotUIOptions, pvtVals, ref4, ref5, subopts, t, u, unusedAttrsContainer, vals;
        subopts = {
          derivedAttributes: opts.derivedAttributes,
          localeStrings: opts.localeStrings,
          rendererOptions: opts.rendererOptions,
          sorters: opts.sorters,
          cols: [],
          rows: [],
          dataClass: opts.dataClass
        };
        numInputsToProcess = (ref4 = opts.aggregators[aggregator.val()]([])().numInputs) != null ? ref4 : 0;
        vals = [];
        _this.find(".pvtRows li span.pvtAttr").each(function() {
          return subopts.rows.push($(this).data("attrName"));
        });
        _this.find(".pvtCols li span.pvtAttr").each(function() {
          return subopts.cols.push($(this).data("attrName"));
        });
        _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
          if (numInputsToProcess === 0) {
            return $(this).remove();
          } else {
            numInputsToProcess--;
            if ($(this).val() !== "") {
              return vals.push($(this).val());
            }
          }
        });
        if (numInputsToProcess !== 0) {
          pvtVals = _this.find(".pvtVals");
          for (x = t = 0, ref5 = numInputsToProcess; 0 <= ref5 ? t < ref5 : t > ref5; x = 0 <= ref5 ? ++t : --t) {
            newDropdown = $("<select>").addClass("pvtAttrDropdown").append($("<option>")).bind("change", function() {
              return refresh();
            });
            for (u = 0, len4 = shownInAggregators.length; u < len4; u++) {
              attr = shownInAggregators[u];
              newDropdown.append($("<option>").val(attr).text(attr));
            }
            pvtVals.append(newDropdown);
          }
        }
        if (initialRender) {
          vals = opts.vals;
          i = 0;
          _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
            $(this).val(vals[i]);
            return i++;
          });
          initialRender = false;
        }
        subopts.aggregatorName = aggregator.val();
        subopts.vals = vals;
        subopts.aggregator = opts.aggregators[aggregator.val()](vals);
        subopts.renderer = opts.renderers[renderer.val()];
        subopts.rowOrder = rowOrderArrow.data("order");
        subopts.colOrder = colOrderArrow.data("order");
        exclusions = {};
        _this.find("input.pvtFilter").not(":checked").each(function() {
          var filter;
          filter = $(this).data("filter");
          if (exclusions[filter[0]] != null) {
            return exclusions[filter[0]].push(filter[1]);
          } else {
            return exclusions[filter[0]] = [filter[1]];
          }
        });
        inclusions = {};
        _this.find("input.pvtFilter:checked").each(function() {
          var filter;
          filter = $(this).data("filter");
          if (exclusions[filter[0]] != null) {
            if (inclusions[filter[0]] != null) {
              return inclusions[filter[0]].push(filter[1]);
            } else {
              return inclusions[filter[0]] = [filter[1]];
            }
          }
        });
        subopts.filter = function(record) {
          var excludedItems, k, ref6, ref7;
          if (!opts.filter(record)) {
            return false;
          }
          for (k in exclusions) {
            excludedItems = exclusions[k];
            if (ref6 = "" + ((ref7 = record[k]) != null ? ref7 : "null"), indexOf.call(excludedItems, ref6) >= 0) {
              return false;
            }
          }
          return true;
        };
        pivotTable.pivot(materializedInput, subopts);
        pivotUIOptions = $.extend({}, opts, {
          cols: subopts.cols,
          rows: subopts.rows,
          colOrder: subopts.colOrder,
          rowOrder: subopts.rowOrder,
          vals,
          exclusions,
          inclusions,
          inclusionsInfo: inclusions,
          aggregatorName: aggregator.val(),
          rendererName: renderer.val()
        });
        _this.data("pivotUIOptions", pivotUIOptions);
        if (opts.autoSortUnusedAttrs) {
          unusedAttrsContainer = _this.find("td.pvtUnused.pvtAxisContainer");
          $(unusedAttrsContainer).children("li").sort(function(a2, b) {
            return naturalSort($(a2).text(), $(b).text());
          }).appendTo(unusedAttrsContainer);
        }
        pivotTable.css("opacity", 1);
        if (opts.onRefresh != null) {
          return opts.onRefresh(pivotUIOptions);
        }
      };
    })(this);
    refresh = /* @__PURE__ */ (function(_this) {
      return function() {
        pivotTable.css("opacity", 0.5);
        return setTimeout(refreshDelayed, 10);
      };
    })(this);
    refresh();
    this.find(".pvtAxisContainer").sortable({
      update: function(e2, ui) {
        if (ui.sender == null) {
          return refresh();
        }
      },
      connectWith: this.find(".pvtAxisContainer"),
      items: "li",
      placeholder: "pvtPlaceholder"
    });
  } catch (error) {
    e = error;
    if (typeof console !== "undefined" && console !== null) {
      console.error(e.stack);
    }
    this.html(opts.localeStrings.uiRenderError);
  }
  return this;
};
$.fn.heatmap = function(scope, opts) {
  var colorScaleGenerator, heatmapper, i, j, l, n, numCols, numRows, ref, ref1, ref2;
  if (scope == null) {
    scope = "heatmap";
  }
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  colorScaleGenerator = opts != null ? (ref = opts.heatmap) != null ? ref.colorScaleGenerator : void 0 : void 0;
  if (colorScaleGenerator == null) {
    colorScaleGenerator = function(values) {
      var max, min;
      min = Math.min.apply(Math, values);
      max = Math.max.apply(Math, values);
      return function(x) {
        var nonRed;
        nonRed = 255 - Math.round(255 * (x - min) / (max - min));
        return "rgb(255," + nonRed + "," + nonRed + ")";
      };
    };
  }
  heatmapper = /* @__PURE__ */ (function(_this) {
    return function(scope2) {
      var colorScale, forEachCell, values;
      forEachCell = function(f) {
        return _this.find(scope2).each(function() {
          var x;
          x = $(this).data("value");
          if (x != null && isFinite(x)) {
            return f(x, $(this));
          }
        });
      };
      values = [];
      forEachCell(function(x) {
        return values.push(x);
      });
      colorScale = colorScaleGenerator(values);
      return forEachCell(function(x, elem) {
        return elem.css("background-color", colorScale(x));
      });
    };
  })(this);
  switch (scope) {
    case "heatmap":
      heatmapper(".pvtVal");
      break;
    case "rowheatmap":
      for (i = l = 0, ref1 = numRows; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        heatmapper(".pvtVal.row" + i);
      }
      break;
    case "colheatmap":
      for (j = n = 0, ref2 = numCols; 0 <= ref2 ? n < ref2 : n > ref2; j = 0 <= ref2 ? ++n : --n) {
        heatmapper(".pvtVal.col" + j);
      }
  }
  heatmapper(".pvtTotal.rowTotal");
  heatmapper(".pvtTotal.colTotal");
  return this;
};
$.fn.barchart = function(opts) {
  var barcharter, i, l, numCols, numRows, ref;
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  barcharter = /* @__PURE__ */ (function(_this) {
    return function(scope) {
      var forEachCell, max, min, range, scaler, values;
      forEachCell = function(f) {
        return _this.find(scope).each(function() {
          var x;
          x = $(this).data("value");
          if (x != null && isFinite(x)) {
            return f(x, $(this));
          }
        });
      };
      values = [];
      forEachCell(function(x) {
        return values.push(x);
      });
      max = Math.max.apply(Math, values);
      if (max < 0) {
        max = 0;
      }
      range = max;
      min = Math.min.apply(Math, values);
      if (min < 0) {
        range = max - min;
      }
      scaler = function(x) {
        return 100 * x / (1.4 * range);
      };
      return forEachCell(function(x, elem) {
        var bBase, bgColor, text, wrapper;
        text = elem.text();
        wrapper = $("<div>").css({
          "position": "relative",
          "height": "55px"
        });
        bgColor = "gray";
        bBase = 0;
        if (min < 0) {
          bBase = scaler(-min);
        }
        if (x < 0) {
          bBase += scaler(x);
          bgColor = "darkred";
          x = -x;
        }
        wrapper.append($("<div>").css({
          "position": "absolute",
          "bottom": bBase + "%",
          "left": 0,
          "right": 0,
          "height": scaler(x) + "%",
          "background-color": bgColor
        }));
        wrapper.append($("<div>").text(text).css({
          "position": "relative",
          "padding-left": "5px",
          "padding-right": "5px"
        }));
        return elem.css({
          "padding": 0,
          "padding-top": "5px",
          "text-align": "center"
        }).html(wrapper);
      });
    };
  })(this);
  for (i = l = 0, ref = numRows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
    barcharter(".pvtVal.row" + i);
  }
  barcharter(".pvtTotal.colTotal");
  return this;
};
//# sourceMappingURL=jquery.js.map