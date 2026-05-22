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

export {
  numberFormat,
  naturalSort,
  sortAs,
  getSort,
  aggregatorTemplates,
  aggregators,
  derivers,
  locales,
  PivotData,
  PivotStream,
  pivotTableRenderer,
  renderers
};
//# sourceMappingURL=chunk-7ZP5X27I.mjs.map