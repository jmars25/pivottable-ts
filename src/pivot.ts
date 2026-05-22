/*
 * PivotTable — core data layer.  Zero jQuery dependency.
 * jQuery UI adapter ($.fn.pivot, $.fn.pivotUI, etc.) lives in
 * src/adapters/jquery.ts and is built to dist/adapters/jquery.js.
 */



export interface AggregatorInstance {
  push(record: Record<string, any>): void;
  value(): number | string | null;
  format(x: number | string | null): string;
  numInputs?: number;
}

export interface NumberFormatOptions {
  digitsAfterDecimal?: number;
  scaler?: number;
  thousandsSep?: string;
  decimalSep?: string;
  prefix?: string;
  suffix?: string;
}

export interface ColumnarInput {
  columnFormat: true;
  columnNames: string[];
  columns: Record<string, Uint16Array | Float64Array>;
  dicts?: Record<string, string[]>;
}

export type SortOrder = "key_a_to_z" | "key_z_to_a" | "value_a_to_z" | "value_z_to_a";

export interface PivotDataOptions {
  aggregator?:        (pivotData: any, rowKey: string[], colKey: string[]) => AggregatorInstance;
  aggregatorName?:    string;
  cols?:              string[];
  rows?:              string[];
  vals?:              string[];
  sorters?:           Record<string, (a: any, b: any) => number> | ((attr: string) => (a: any, b: any) => number);
  rowOrder?:          SortOrder;
  colOrder?:          SortOrder;
  derivedAttributes?: Record<string, (record: Record<string, any>) => any>;
  filter?:            (record: Record<string, any>) => boolean;
  lazy?:              boolean;
}

export interface PivotDataInstance {
  rowAttrs:  string[];
  colAttrs:  string[];
  valAttrs:  string[];
  getRowKeys(): string[][];
  getColKeys(): string[][];
  getAggregator(rowKey: string[], colKey: string[]): AggregatorInstance;
  forEachMatchingRecord(
    criteria: Record<string, string>,
    callback:  (record: Record<string, any>) => void
  ): void;
  pushRecord(record: Record<string, any>): void;
  pushChunk(input: ColumnarInput, start: number, end: number): void;
}

export interface RendererOptions {
  table?: {
    clickCallback?: ((
      e:         MouseEvent,
      value:     number | string | null,
      rowKey:    string[],
      colKey:    string[],
      pivotData: PivotDataInstance
    ) => void) | null;
    rowTotals?: boolean;
    colTotals?: boolean;
  };
  localeStrings?: {
    totals?: string;
  };
}

export interface PivotStreamOptions {
  onComplete?: (error: null, count: number, stream: PivotStreamInstance) => void;
}

export interface PivotStreamInstance {
  push(record: Record<string, any>): void;
  done(): void;
  toColumnar(): ColumnarInput;
  fromFetch(url: string, fetchOpts?: RequestInit): Promise<void>;
}

// ─── Formatting utilities ─────────────────────────────────────────────────

function addSeparators(nStr: any, thousandsSep: string, decimalSep: string): string {
  nStr += '';
  const x  = nStr.split('.');
  let   x1 = x[0];
  const x2 = x.length > 1 ? decimalSep + x[1] : '';
  const rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + thousandsSep + '$2');
  }
  return x1 + x2;
}

export function numberFormat(opts?: NumberFormatOptions): (x: any) => string {
  const defaults = {
    digitsAfterDecimal: 2,
    scaler: 1,
    thousandsSep: ",",
    decimalSep: ".",
    prefix: "",
    suffix: ""
  };
  opts = Object.assign({}, defaults, opts);
  return function(x: any): string {
    if (isNaN(x) || !isFinite(x)) return "";
    const result = addSeparators(
      (opts.scaler * x).toFixed(opts.digitsAfterDecimal),
      opts.thousandsSep,
      opts.decimalSep
    );
    return "" + opts.prefix + result + opts.suffix;
  };
}

const usFmt    = numberFormat();
const usFmtInt = numberFormat({ digitsAfterDecimal: 0 });
const usFmtPct = numberFormat({ digitsAfterDecimal: 1, scaler: 100, suffix: "%" });

// ─── Sort utilities ───────────────────────────────────────────────────────

const rx = /(\d+)|(\D+)/g;
const rd = /\d/;
const rz = /^0/;

export const naturalSort = function(as: any, bs: any): number {
  if ((bs != null) && (as == null)) return -1;
  if ((as != null) && (bs == null)) return  1;
  if (typeof as === "number" && isNaN(as)) return -1;
  if (typeof bs === "number" && isNaN(bs)) return  1;
  const nas = +as;
  const nbs = +bs;
  if (nas < nbs) return -1;
  if (nas > nbs) return  1;
  if (typeof as === "number" && typeof bs !== "number") return -1;
  if (typeof bs === "number" && typeof as !== "number") return  1;
  if (typeof as === "number" && typeof bs === "number") return  0;
  if (isNaN(nbs) && !isNaN(nas)) return -1;
  if (isNaN(nas) && !isNaN(nbs)) return  1;
  const a = String(as);
  const b = String(bs);
  if (a === b) return 0;
  if (!(rd.test(a) && rd.test(b))) return a > b ? 1 : -1;
  const aParts: any[] = a.match(rx)!;
  const bParts: any[] = b.match(rx)!;
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

export const sortAs = function(order: any[]): (a: any, b: any) => number {
  const mapping:   Record<string, any> = {};
  const l_mapping: Record<string, any> = {};
  for (const i in order) {
    const x = order[i];
    mapping[x] = i;
    if (typeof x === "string") l_mapping[x.toLowerCase()] = i;
  }
  return function(a: any, b: any): number {
    if ((mapping[a] != null) && (mapping[b] != null)) return mapping[a]   - mapping[b];
    if (mapping[a] != null)                           return -1;
    if (mapping[b] != null)                           return  1;
    if ((l_mapping[a] != null) && (l_mapping[b] != null)) return l_mapping[a] - l_mapping[b];
    if (l_mapping[a] != null) return -1;
    if (l_mapping[b] != null) return  1;
    return naturalSort(a, b);
  };
};

export const getSort = function(sorters: any, attr: string): (a: any, b: any) => number {
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

// ─── Aggregator templates ─────────────────────────────────────────────────

export const aggregatorTemplates: Record<string, any> = {
  count: function(formatter?: any) {
    if (formatter == null) formatter = usFmtInt;
    return function() {
      return function(data: any, rowKey: any, colKey: any) {
        return {
          count: 0,
          push:   function()       { this.count++; },
          value:  function()       { return this.count; },
          format: formatter
        };
      };
    };
  },

  uniques: function(fn: any, formatter?: any) {
    if (formatter == null) formatter = usFmtInt;
    return function(arg: any) {
      const attr = arg[0];
      return function(data: any, rowKey: any, colKey: any) {
        return {
          uniq: [] as any[],
          push: function(record: any) {
            if (this.uniq.indexOf(record[attr]) < 0) this.uniq.push(record[attr]);
          },
          value:  function() { return fn(this.uniq); },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },

  sum: function(formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const attr = arg[0];
      return function(data: any, rowKey: any, colKey: any) {
        return {
          sum: 0,
          push: function(record: any) {
            if (!isNaN(parseFloat(record[attr]))) this.sum += parseFloat(record[attr]);
          },
          value:  function() { return this.sum; },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },

  extremes: function(mode: string, formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const attr = arg[0];
      return function(data: any, rowKey: any, colKey: any) {
        return {
          val: null as any,
          sorter: getSort(data != null ? data.sorters : void 0, attr),
          push: function(record: any) {
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
          value:  function() { return this.val; },
          format: function(x: any) { return isNaN(x) ? x : formatter(x); },
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },

  quantile: function(q: number, formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const attr = arg[0];
      return function(data: any, rowKey: any, colKey: any) {
        return {
          vals: [] as number[],
          push: function(record: any) {
            const x = parseFloat(record[attr]);
            if (!isNaN(x)) this.vals.push(x);
          },
          value: function() {
            if (this.vals.length === 0) return null;
            this.vals.sort((a: number, b: number) => a - b);
            const i = (this.vals.length - 1) * q;
            return (this.vals[Math.floor(i)] + this.vals[Math.ceil(i)]) / 2.0;
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },

  runningStat: function(mode: string = "mean", ddof: number = 1, formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const attr = arg[0];
      return function(data: any, rowKey: any, colKey: any) {
        return {
          n: 0.0, m: 0.0, s: 0.0,
          push: function(record: any) {
            const x = parseFloat(record[attr]);
            if (isNaN(x)) return;
            this.n += 1.0;
            if (this.n === 1.0) {
              this.m = x;
            } else {
              const m_new = this.m + (x - this.m) / this.n;
              this.s = this.s + (x - this.m) * (x - m_new);
              this.m = m_new;
            }
          },
          value: function() {
            if (mode === "mean") return this.n === 0 ? 0 / 0 : this.m;
            if (this.n <= ddof)  return 0;
            if (mode === "var")   return this.s / (this.n - ddof);
            if (mode === "stdev") return Math.sqrt(this.s / (this.n - ddof));
          },
          format: formatter,
          numInputs: attr != null ? 0 : 1
        };
      };
    };
  },

  sumOverSum: function(formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const [num, denom] = arg;
      return function(data: any, rowKey: any, colKey: any) {
        return {
          sumNum: 0, sumDenom: 0,
          push: function(record: any) {
            if (!isNaN(parseFloat(record[num])))   this.sumNum   += parseFloat(record[num]);
            if (!isNaN(parseFloat(record[denom]))) this.sumDenom += parseFloat(record[denom]);
          },
          value:  function() { return this.sumNum / this.sumDenom; },
          format: formatter,
          numInputs: (num != null) && (denom != null) ? 0 : 2
        };
      };
    };
  },

  sumOverSumBound80: function(upper: boolean = true, formatter?: any) {
    if (formatter == null) formatter = usFmt;
    return function(arg: any) {
      const [num, denom] = arg;
      return function(data: any, rowKey: any, colKey: any) {
        return {
          sumNum: 0, sumDenom: 0,
          push: function(record: any) {
            if (!isNaN(parseFloat(record[num])))   this.sumNum   += parseFloat(record[num]);
            if (!isNaN(parseFloat(record[denom]))) this.sumDenom += parseFloat(record[denom]);
          },
          value: function() {
            const sign = upper ? 1 : -1;
            return (0.821187207574908 / this.sumDenom + this.sumNum / this.sumDenom +
              1.2815515655446004 * sign * Math.sqrt(
                0.410593603787454 / (this.sumDenom * this.sumDenom) +
                (this.sumNum * (1 - this.sumNum / this.sumDenom)) / (this.sumDenom * this.sumDenom)
              )) / (1 + 1.642374415149816 / this.sumDenom);
          },
          format: formatter,
          numInputs: (num != null) && (denom != null) ? 0 : 2
        };
      };
    };
  },

  fractionOf: function(wrapped: any, type: string = "total", formatter?: any) {
    if (formatter == null) formatter = usFmtPct;
    // rest params replaces the old `slice.call(arguments, 0)` pattern
    return function(...x: any[]) {
      return function(data: any, rowKey: any, colKey: any) {
        return {
          selector: ({ total: [[], []], row: [rowKey, []], col: [[], colKey] } as any)[type],
          inner:    wrapped.apply(null, x)(data, rowKey, colKey),
          push:     function(record: any) { return this.inner.push(record); },
          format:   formatter,
          value:    function() {
            return this.inner.value() / data.getAggregator.apply(data, this.selector).inner.value();
          },
          numInputs: wrapped.apply(null, x)().numInputs
        };
      };
    };
  }
};

aggregatorTemplates.countUnique = (f?: any) =>
  aggregatorTemplates.uniques((x: any[]) => x.length, f);

aggregatorTemplates.listUnique = (s: string) =>
  aggregatorTemplates.uniques((x: any[]) => x.sort(naturalSort).join(s), (x: any) => x);

aggregatorTemplates.max   = (f?: any) => aggregatorTemplates.extremes("max",   f);
aggregatorTemplates.min   = (f?: any) => aggregatorTemplates.extremes("min",   f);
aggregatorTemplates.first = (f?: any) => aggregatorTemplates.extremes("first", f);
aggregatorTemplates.last  = (f?: any) => aggregatorTemplates.extremes("last",  f);
aggregatorTemplates.median  = (f?: any) => aggregatorTemplates.quantile(0.5, f);
aggregatorTemplates.average = (f?: any) => aggregatorTemplates.runningStat("mean",  1, f);
aggregatorTemplates["var"]  = (ddof?: any, f?: any) => aggregatorTemplates.runningStat("var",   ddof, f);
aggregatorTemplates.stdev   = (ddof?: any, f?: any) => aggregatorTemplates.runningStat("stdev", ddof, f);

export const aggregators: Record<string, any> = (function(tpl) {
  return {
    "Count":                        tpl.count(usFmtInt),
    "Count Unique Values":          tpl.countUnique(usFmtInt),
    "List Unique Values":           tpl.listUnique(", "),
    "Sum":                          tpl.sum(usFmt),
    "Integer Sum":                  tpl.sum(usFmtInt),
    "Average":                      tpl.average(usFmt),
    "Median":                       tpl.median(usFmt),
    "Sample Variance":              tpl["var"](1, usFmt),
    "Sample Standard Deviation":    tpl.stdev(1, usFmt),
    "Minimum":                      tpl.min(usFmt),
    "Maximum":                      tpl.max(usFmt),
    "First":                        tpl.first(usFmt),
    "Last":                         tpl.last(usFmt),
    "Sum over Sum":                 tpl.sumOverSum(usFmt),
    "80% Upper Bound":              tpl.sumOverSumBound80(true,  usFmt),
    "80% Lower Bound":              tpl.sumOverSumBound80(false, usFmt),
    "Sum as Fraction of Total":     tpl.fractionOf(tpl.sum(),   "total", usFmtPct),
    "Sum as Fraction of Rows":      tpl.fractionOf(tpl.sum(),   "row",   usFmtPct),
    "Sum as Fraction of Columns":   tpl.fractionOf(tpl.sum(),   "col",   usFmtPct),
    "Count as Fraction of Total":   tpl.fractionOf(tpl.count(), "total", usFmtPct),
    "Count as Fraction of Rows":    tpl.fractionOf(tpl.count(), "row",   usFmtPct),
    "Count as Fraction of Columns": tpl.fractionOf(tpl.count(), "col",   usFmtPct),
  };
})(aggregatorTemplates);

// ─── Date utilities and derivers ──────────────────────────────────────────

const mthNamesEn = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const dayNamesEn = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function zeroPad(number: number): string {
  return ("0" + number).substr(-2, 2);
}

export const derivers: Record<string, any> = {
  bin: function(col: string, binWidth: number) {
    return function(record: any) { return record[col] - record[col] % binWidth; };
  },
  dateFormat: function(
    col: string,
    formatString: string,
    utcOutput: boolean = false,
    mthNames: string[] = mthNamesEn,
    dayNames: string[] = dayNamesEn
  ) {
    const utc = utcOutput ? "UTC" : "";
    return function(record: any) {
      const date = new Date(Date.parse(record[col]));
      if (isNaN(date as any)) return "";
      return formatString.replace(/%(.)/g, function(_m: string, p: string) {
        switch (p) {
          case "y": return date["get" + utc + "FullYear"]();
          case "m": return zeroPad(date["get" + utc + "Month"]() + 1);
          case "n": return mthNames[date["get" + utc + "Month"]()];
          case "d": return zeroPad(date["get" + utc + "Date"]());
          case "w": return dayNames[date["get" + utc + "Day"]()];
          case "x": return date["get" + utc + "Day"]();
          case "H": return zeroPad(date["get" + utc + "Hours"]());
          case "M": return zeroPad(date["get" + utc + "Minutes"]());
          case "S": return zeroPad(date["get" + utc + "Seconds"]());
          default:  return "%" + p;
        }
      });
    };
  }
};

// ─── Locale ───────────────────────────────────────────────────────────────
// renderers are populated by src/adapters/jquery.ts; the plain "Table"
// renderer is added below after pivotTableRenderer is defined.

export const locales: Record<string, any> = {
  en: {
    aggregators,
    renderers: {} as Record<string, any>,   // filled in at bottom of this file
    localeStrings: {
      renderError:   "An error occurred rendering the PivotTable results.",
      computeError:  "An error occurred computing the PivotTable results.",
      uiRenderError: "An error occurred rendering the PivotTable UI.",
      selectAll:     "Select All",
      selectNone:    "Select None",
      tooMany:       "(too many to list)",
      filterResults: "Filter values",
      apply:         "Apply",
      cancel:        "Cancel",
      totals:        "Totals",
      vs:            "vs",
      by:            "by"
    }
  }
};

// ─── PivotData ────────────────────────────────────────────────────────────

export class PivotData implements PivotDataInstance {

  // ── Public typed properties (required by PivotDataInstance) ───────────────
  rowAttrs:  string[];
  colAttrs:  string[];
  valAttrs:  string[];

  // ── Internal properties ───────────────────────────────────────────────────
  input:             any;
  aggregator:        any;
  aggregatorName:    string;
  sorters:           any;
  rowOrder:          SortOrder;
  colOrder:          SortOrder;
  derivedAttributes: Record<string, (record: Record<string, any>) => any>;
  filter:            (record: Record<string, any>) => boolean;
  tree:              Record<string, Record<string, AggregatorInstance>>;
  rowKeys:           string[][];
  colKeys:           string[][];
  rowTotals:         Record<string, AggregatorInstance>;
  colTotals:         Record<string, AggregatorInstance>;
  allTotal!:         AggregatorInstance;   // ! = set in constructor via aggregator call
  sorted:            boolean;

  constructor(input: any, opts: PivotDataOptions = {}) {
    this.input             = input;
    this.aggregator        = opts.aggregator        ?? aggregatorTemplates.count()();
    this.aggregatorName    = opts.aggregatorName    ?? "Count";
    this.colAttrs          = opts.cols              ?? [];
    this.rowAttrs          = opts.rows              ?? [];
    this.valAttrs          = opts.vals              ?? [];
    this.sorters           = opts.sorters           ?? {};
    this.rowOrder          = opts.rowOrder          ?? "key_a_to_z";
    this.colOrder          = opts.colOrder          ?? "key_a_to_z";
    this.derivedAttributes = opts.derivedAttributes ?? {};
    this.filter            = opts.filter            ?? (() => true);

    this.tree      = {};
    this.rowKeys   = [];
    this.colKeys   = [];
    this.rowTotals = {};
    this.colTotals = {};
    this.allTotal  = this.aggregator(this, [], []);
    this.sorted    = false;

    if (!opts.lazy) {
      // Fast path: columnar input with no derived attrs or custom filter
      if (input.columnFormat && Object.keys(this.derivedAttributes).length === 0 && !opts.filter) {
        const len = input.columns[input.columnNames[0]].length;
        for (let i = 0; i < len; i++) {
          this.processRecord(i, input);
        }
      } else {
        PivotData.forEachRecord(this.input, this.derivedAttributes, (record: any) => {
          if (this.filter(record)) this.processRecord(record);
        });
      }
    }
  }

  // ── Static ────────────────────────────────────────────────────────────────

  static forEachRecord(
    input:             any,
    derivedAttributes: Record<string, (record: Record<string, any>) => any>,
    f:                 (record: Record<string, any>) => void
  ): void {
    // Fast path: no derived attributes — skip wrapper entirely
    let addRecord: (record: any) => void;
    if (Object.keys(derivedAttributes).length === 0) {
      addRecord = f;
    } else {
      addRecord = function(record: any) {
        for (const attr in derivedAttributes) {
          const derived = derivedAttributes[attr](record);
          record[attr]  = derived != null ? derived : record[attr];
        }
        f(record);
      };
    }

    // 1. Function — caller drives iteration
    if (typeof input === "function") {
      input(addRecord);

    // 2. Columnar TypedArrays — decode on the fly, reuse one record object
    } else if (input.columnFormat) {
      const len    = input.columns[input.columnNames[0]].length;
      const record: any = {};
      for (let i = 0; i < len; i++) {
        for (const name of input.columnNames) {
          const col  = input.columns[name];
          const dict = input.dicts != null ? input.dicts[name] : void 0;
          record[name] = dict ? dict[col[i]] : col[i];
        }
        addRecord(record);
      }

    // 3. Array of arrays — first row is headers
    } else if (Array.isArray(input) && Array.isArray(input[0])) {
      const headers = input[0];
      for (let i = 1; i < input.length; i++) {
        const row    = input[i];
        const record: any = {};
        for (let j = 0; j < headers.length; j++) {
          record[headers[j]] = row[j];
        }
        addRecord(record);
      }

    // 4. Array of objects — simplest case
    } else if (Array.isArray(input)) {
      for (const record of input) {
        addRecord(record);
      }

    // 5. HTML table — headers from thead th, rows from tbody tr
    } else if (input instanceof HTMLElement) {
      const headers = Array.prototype.slice
        .call(input.querySelectorAll("thead > tr > th"))
        .map((th: any) => th.textContent);
      input.querySelectorAll("tbody > tr").forEach((tr: any) => {
        const record: any = {};
        tr.querySelectorAll("td").forEach((td: any, j: number) => {
          record[headers[j]] = td.textContent;
        });
        addRecord(record);
      });

    } else {
      throw new Error("unknown input format");
    }
  }

  // ── Instance methods ──────────────────────────────────────────────────────

  forEachMatchingRecord(
    criteria: Record<string, string>,
    callback: (record: Record<string, any>) => void
  ): void {
    PivotData.forEachRecord(this.input, this.derivedAttributes, (record: any) => {
      if (!this.filter(record)) return;
      for (const k in criteria) {
        if (criteria[k] !== (record[k] != null ? record[k] : "null")) return;
      }
      callback(record);
    });
  }

  arrSort(attrs: string[]): (a: any[], b: any[]) => number {
    // Build a per-attribute sorter array, then compare element-by-element
    const sortersArr = attrs.map(a => getSort(this.sorters, a));
    return function(a: any[], b: any[]) {
      for (let i = 0; i < sortersArr.length; i++) {
        const comparison = sortersArr[i](a[i], b[i]);
        if (comparison !== 0) return comparison;
      }
      return 0;
    };
  }

  sortKeys(): void {
    if (!this.sorted) {
      this.sorted = true;
      const v = (r: any, c: any) => this.getAggregator(r, c).value();
      switch (this.rowOrder) {
        case "value_a_to_z":
          this.rowKeys.sort((a, b) =>  naturalSort(v(a, []), v(b, [])));
          break;
        case "value_z_to_a":
          this.rowKeys.sort((a, b) => -naturalSort(v(a, []), v(b, [])));
          break;
        default:
          this.rowKeys.sort(this.arrSort(this.rowAttrs));
      }
      switch (this.colOrder) {
        case "value_a_to_z":
          this.colKeys.sort((a, b) =>  naturalSort(v([], a), v([], b)));
          break;
        case "value_z_to_a":
          this.colKeys.sort((a, b) => -naturalSort(v([], a), v([], b)));
          break;
        default:
          this.colKeys.sort(this.arrSort(this.colAttrs));
      }
    }
  }

  getColKeys(): string[][] {
    this.sortKeys();
    return this.colKeys;
  }

  getRowKeys(): string[][] {
    this.sortKeys();
    return this.rowKeys;
  }

  processRecord(recordOrIndex: any, columnarInput?: ColumnarInput): void {
    const NULL_STR = String.fromCharCode(0);

    // Read a single value from a columnar column at row i, decoding dict if present
    function readColumnarValue(col: any, dict: any[] | undefined, i: number): any {
      if (col == null) return "null";
      return dict ? dict[col[i]] : col[i];
    }

    const colKey: any[] = [];
    const rowKey: any[] = [];
    let record: any;

    if (columnarInput != null) {
      // Columnar path: recordOrIndex is an integer row index
      const i = recordOrIndex as number;
      for (const attr of this.colAttrs) {
        colKey.push(readColumnarValue(columnarInput.columns[attr], columnarInput.dicts?.[attr], i));
      }
      for (const attr of this.rowAttrs) {
        rowKey.push(readColumnarValue(columnarInput.columns[attr], columnarInput.dicts?.[attr], i));
      }
      record = {};
      for (const attr of this.valAttrs) {
        record[attr] = readColumnarValue(columnarInput.columns[attr], columnarInput.dicts?.[attr], i);
      }
    } else {
      // Row-oriented path: recordOrIndex is a plain object
      record = recordOrIndex;
      for (const attr of this.colAttrs) colKey.push(record[attr] != null ? record[attr] : "null");
      for (const attr of this.rowAttrs) rowKey.push(record[attr] != null ? record[attr] : "null");
    }

    // Null char separator — safe because it never appears in real field values
    const flatRowKey = rowKey.join(NULL_STR);
    const flatColKey = colKey.join(NULL_STR);

    // Push into four aggregator buckets
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

  pushRecord(record: Record<string, any>): void {
    if (this.filter(record)) {
      this.sorted = false;
      this.processRecord(record);
    }
  }

  pushChunk(columnarInput: ColumnarInput, startIdx: number, endIdx: number): void {
    this.sorted = false;
    for (let i = startIdx; i < endIdx; i++) {
      this.processRecord(i, columnarInput);
    }
  }

  getAggregator(rowKey: string[], colKey: string[]): AggregatorInstance {
    const flatRowKey = rowKey.join(String.fromCharCode(0));
    const flatColKey = colKey.join(String.fromCharCode(0));
    let agg: AggregatorInstance | undefined;
    if (rowKey.length === 0 && colKey.length === 0) {
      agg = this.allTotal;
    } else if (rowKey.length === 0) {
      agg = this.colTotals[flatColKey];
    } else if (colKey.length === 0) {
      agg = this.rowTotals[flatRowKey];
    } else {
      agg = this.tree[flatRowKey]?.[flatColKey];
    }
    // Fallback stub for cells that have no data — satisfies AggregatorInstance
    return agg ?? { push: () => {}, value: () => null, format: () => "" };
  }
}

// ─── PivotStream ──────────────────────────────────────────────────────────
// Builds columnar TypedArrays from a streaming source.
// Strings are dictionary-encoded on the fly; numbers stored as Float64.
// Call stream.toColumnar() inside onComplete to get a ColumnarInput
// ready to pass straight into new PivotData(...).

export class PivotStream implements PivotStreamInstance {

  // Called when done() is invoked — receives (null, recordCount, stream)
  onComplete: (error: null, count: number, stream: PivotStreamInstance) => void;

  private _count:       number;
  private _colsInit:    boolean;
  private _stringCols:  string[];
  private _numericCols: string[];
  private _dicts:       Record<string, string[]>;
  private _dictIndex:   Record<string, Map<string, number>>;
  private _arrays:      Record<string, number[]>;

  constructor(opts?: PivotStreamOptions) {
    this.onComplete    = opts?.onComplete ?? (() => {});
    this._count        = 0;
    this._colsInit     = false;
    this._stringCols   = [];
    this._numericCols  = [];
    this._dicts        = {};
    this._dictIndex    = {};
    this._arrays       = {};
  }

  // Detect column types from the first record and initialise storage
  private _initCols(record: Record<string, any>): void {
    for (const col of Object.keys(record)) {
      const val = record[col];
      if (typeof val === "number") {
        this._numericCols.push(col);
      } else {
        this._stringCols.push(col);
        this._dicts[col]     = [];
        this._dictIndex[col] = new Map();
      }
      this._arrays[col] = [];
    }
    this._colsInit = true;
  }

  // O(1) dictionary encoding via Map
  private _enc(col: string, val: any): number {
    const str = val != null ? String(val) : "null";
    if (!this._dictIndex[col].has(str)) {
      this._dictIndex[col].set(str, this._dicts[col].length);
      this._dicts[col].push(str);
    }
    return this._dictIndex[col].get(str)!;
  }

  // Push one record — values immediately encoded, no JS object retained
  push(record: Record<string, any>): void {
    if (!this._colsInit) this._initCols(record);
    for (const col of this._stringCols)  this._arrays[col].push(this._enc(col, record[col]));
    for (const col of this._numericCols) this._arrays[col].push(Number(record[col]) || 0);
    this._count++;
  }

  // Convert accumulated arrays → ColumnarInput ready for PivotData
  toColumnar(): ColumnarInput {
    const columns:     Record<string, Uint16Array | Float64Array> = {};
    const columnNames: string[]                                   = [];
    const dicts:       Record<string, string[]>                   = {};
    for (const col of this._stringCols) {
      columnNames.push(col);
      columns[col] = new Uint16Array(this._arrays[col]);
      dicts[col]   = this._dicts[col];
    }
    for (const col of this._numericCols) {
      columnNames.push(col);
      columns[col] = new Float64Array(this._arrays[col]);
    }
    return { columnFormat: true, columnNames, columns, dicts };
  }

  // Signal end of stream — fires onComplete(null, totalCount, stream)
  done(): void {
    this.onComplete(null, this._count, this);
  }

  // Consume a fetch() response as NDJSON (one JSON object per line)
  fromFetch(url: string, fetchOpts?: RequestInit): Promise<void> {
    return fetch(url, fetchOpts ?? {}).then(res => {
      if (!res.ok) throw new Error("PivotStream fetch failed: " + res.status + " " + res.statusText);
      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      // Arrow function so `this` stays bound to the PivotStream instance
      const pump = (): Promise<void> => {
        return reader.read().then(({ done, value }) => {
          if (done) {
            buffer.split("\n").forEach(line => {
              if (line.trim().length > 0) {
                try { this.push(JSON.parse(line)); } catch(e) {}
              }
            });
            this.done();
            return;
          }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop()!;
          lines.forEach(line => {
            if (line.trim().length > 0) this.push(JSON.parse(line));
          });
          return pump();
        });
      };
      return pump();
    });
  }
}

// ─── Default table renderer ───────────────────────────────────────────────

export function pivotTableRenderer(pivotData: PivotDataInstance, opts?: RendererOptions): HTMLTableElement {
  const table         = Object.assign({ clickCallback: null, rowTotals: true, colTotals: true }, opts && opts.table);
  const localeStrings = Object.assign({ totals: "Totals" }, opts && opts.localeStrings);

  const colAttrs = pivotData.colAttrs;
  const rowAttrs = pivotData.rowAttrs;
  const rowKeys  = pivotData.getRowKeys();
  const colKeys  = pivotData.getColKeys();

  // Returns span size for a merged header cell; -1 means "skip, covered by span above"
  function spanSize(arr: any[][], i: number, j: number): number {
    if (i !== 0) {
      let noDraw = true;
      for (let x = 0; x <= j; x++) {
        if (arr[i - 1][x] !== arr[i][x]) { noDraw = false; break; }
      }
      if (noDraw) return -1;
    }
    let len = 0;
    while (i + len < arr.length) {
      let stop = false;
      for (let x = 0; x <= j; x++) {
        if (arr[i][x] !== arr[i + len][x]) { stop = true; break; }
      }
      if (stop) break;
      len++;
    }
    return len;
  }

  const getClickHandler = table.clickCallback
    ? function(value: any, rowValues: any[], colValues: any[]) {
        const filters: Record<string, any> = {};
        colAttrs.forEach((attr: string, i: number) => { if (colValues[i] != null) filters[attr] = colValues[i]; });
        rowAttrs.forEach((attr: string, i: number) => { if (rowValues[i] != null) filters[attr] = rowValues[i]; });
        return (e: Event) => table.clickCallback(e, value, filters, pivotData);
      }
    : null;

  const result = document.createElement("table");
  result.className = "pvtTable";

  // ── thead ──────────────────────────────────────────────────────────────
  const thead = document.createElement("thead");

  colAttrs.forEach((c: string, j: number) => {
    const tr = document.createElement("tr");

    if (j === 0 && rowAttrs.length !== 0) {
      const th = document.createElement("th");
      th.setAttribute("colspan", String(rowAttrs.length));
      th.setAttribute("rowspan", String(colAttrs.length));
      tr.appendChild(th);
    }

    const axisLabel = document.createElement("th");
    axisLabel.className   = "pvtAxisLabel";
    axisLabel.textContent = c;
    tr.appendChild(axisLabel);

    colKeys.forEach((colKey: any[], i: number) => {
      const span = spanSize(colKeys, i, j);
      if (span !== -1) {
        const th = document.createElement("th");
        th.className   = "pvtColLabel";
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
    rowAttrs.forEach((r: string) => {
      const th = document.createElement("th");
      th.className   = "pvtAxisLabel";
      th.textContent = r;
      tr.appendChild(th);
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

  // ── tbody ──────────────────────────────────────────────────────────────
  const tbody = document.createElement("tbody");

  rowKeys.forEach((rowKey: any[], i: number) => {
    const tr = document.createElement("tr");

    rowKey.forEach((txt: any, j: number) => {
      const span = spanSize(rowKeys, i, j);
      if (span !== -1) {
        const th = document.createElement("th");
        th.className   = "pvtRowLabel";
        th.textContent = txt;
        th.setAttribute("rowspan", String(span));
        if (j === rowAttrs.length - 1 && colAttrs.length !== 0) {
          th.setAttribute("colspan", "2");
        }
        tr.appendChild(th);
      }
    });

    colKeys.forEach((colKey: any[], j: number) => {
      const aggregator: AggregatorInstance = pivotData.getAggregator(rowKey, colKey);
      const val = aggregator.value();
      const td  = document.createElement("td");
      td.className   = "pvtVal row" + i + " col" + j;
      td.textContent = aggregator.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      if (getClickHandler) td.onclick = getClickHandler(val, rowKey, colKey);
      tr.appendChild(td);
    });

    if (table.rowTotals || colAttrs.length === 0) {
      const agg = pivotData.getAggregator(rowKey, []);
      const val = agg.value();
      const td  = document.createElement("td");
      td.className   = "pvtTotal rowTotal";
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

    colKeys.forEach((colKey: any[], j: number) => {
      const agg = pivotData.getAggregator([], colKey);
      const val = agg.value();
      const td  = document.createElement("td");
      td.className   = "pvtTotal colTotal";
      td.textContent = agg.format(val);
      td.setAttribute("data-value", val == null ? "" : String(val));
      td.setAttribute("data-for", "col" + j);
      if (getClickHandler) td.onclick = getClickHandler(val, [], colKey);
      tr.appendChild(td);
    });

    if (table.rowTotals || colAttrs.length === 0) {
      const agg = pivotData.getAggregator([], []);
      const val = agg.value();
      const td  = document.createElement("td");
      td.className   = "pvtGrandTotal";
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

// ─── Renderers (plain, no jQuery) ────────────────────────────────────────
// The jQuery adapter adds "Table Barchart", "Heatmap" etc.

export const renderers: Record<string, any> = {
  "Table": pivotTableRenderer
};

// Wire "Table" into locales so the locale object is self-contained for plain usage
locales.en.renderers = renderers;
