interface AggregatorInstance {
    push(record: Record<string, any>): void;
    value(): number | string | null;
    format(x: number | string | null): string;
    numInputs?: number;
}
interface NumberFormatOptions {
    digitsAfterDecimal?: number;
    scaler?: number;
    thousandsSep?: string;
    decimalSep?: string;
    prefix?: string;
    suffix?: string;
}
interface ColumnarInput {
    columnFormat: true;
    columnNames: string[];
    columns: Record<string, Uint16Array | Float64Array>;
    dicts?: Record<string, string[]>;
}
type SortOrder = "key_a_to_z" | "key_z_to_a" | "value_a_to_z" | "value_z_to_a";
interface PivotDataOptions {
    aggregator?: (pivotData: any, rowKey: string[], colKey: string[]) => AggregatorInstance;
    aggregatorName?: string;
    cols?: string[];
    rows?: string[];
    vals?: string[];
    sorters?: Record<string, (a: any, b: any) => number> | ((attr: string) => (a: any, b: any) => number);
    rowOrder?: SortOrder;
    colOrder?: SortOrder;
    derivedAttributes?: Record<string, (record: Record<string, any>) => any>;
    filter?: (record: Record<string, any>) => boolean;
    lazy?: boolean;
}
interface PivotDataInstance {
    rowAttrs: string[];
    colAttrs: string[];
    valAttrs: string[];
    getRowKeys(): string[][];
    getColKeys(): string[][];
    getAggregator(rowKey: string[], colKey: string[]): AggregatorInstance;
    forEachMatchingRecord(criteria: Record<string, string>, callback: (record: Record<string, any>) => void): void;
    pushRecord(record: Record<string, any>): void;
    pushChunk(input: ColumnarInput, start: number, end: number): void;
}
interface RendererOptions {
    table?: {
        clickCallback?: ((e: MouseEvent, value: number | string | null, rowKey: string[], colKey: string[], pivotData: PivotDataInstance) => void) | null;
        rowTotals?: boolean;
        colTotals?: boolean;
    };
    localeStrings?: {
        totals?: string;
    };
}
interface PivotStreamOptions {
    onComplete?: (error: null, count: number, stream: PivotStreamInstance) => void;
}
interface PivotStreamInstance {
    push(record: Record<string, any>): void;
    done(): void;
    toColumnar(): ColumnarInput;
    fromFetch(url: string, fetchOpts?: RequestInit): Promise<void>;
}
declare function numberFormat(opts?: NumberFormatOptions): (x: any) => string;
declare const naturalSort: (as: any, bs: any) => number;
declare const sortAs: (order: any[]) => (a: any, b: any) => number;
declare const getSort: (sorters: any, attr: string) => (a: any, b: any) => number;
declare const aggregatorTemplates: Record<string, any>;
declare const aggregators: Record<string, any>;
declare const derivers: Record<string, any>;
declare const locales: Record<string, any>;
declare class PivotData implements PivotDataInstance {
    rowAttrs: string[];
    colAttrs: string[];
    valAttrs: string[];
    input: any;
    aggregator: any;
    aggregatorName: string;
    sorters: any;
    rowOrder: SortOrder;
    colOrder: SortOrder;
    derivedAttributes: Record<string, (record: Record<string, any>) => any>;
    filter: (record: Record<string, any>) => boolean;
    tree: Record<string, Record<string, AggregatorInstance>>;
    rowKeys: string[][];
    colKeys: string[][];
    rowTotals: Record<string, AggregatorInstance>;
    colTotals: Record<string, AggregatorInstance>;
    allTotal: AggregatorInstance;
    sorted: boolean;
    constructor(input: any, opts?: PivotDataOptions);
    static forEachRecord(input: any, derivedAttributes: Record<string, (record: Record<string, any>) => any>, f: (record: Record<string, any>) => void): void;
    forEachMatchingRecord(criteria: Record<string, string>, callback: (record: Record<string, any>) => void): void;
    arrSort(attrs: string[]): (a: any[], b: any[]) => number;
    sortKeys(): void;
    getColKeys(): string[][];
    getRowKeys(): string[][];
    processRecord(recordOrIndex: any, columnarInput?: ColumnarInput): void;
    pushRecord(record: Record<string, any>): void;
    pushChunk(columnarInput: ColumnarInput, startIdx: number, endIdx: number): void;
    getAggregator(rowKey: string[], colKey: string[]): AggregatorInstance;
}
declare class PivotStream implements PivotStreamInstance {
    onComplete: (error: null, count: number, stream: PivotStreamInstance) => void;
    private _count;
    private _colsInit;
    private _stringCols;
    private _numericCols;
    private _dicts;
    private _dictIndex;
    private _arrays;
    constructor(opts?: PivotStreamOptions);
    private _initCols;
    private _enc;
    push(record: Record<string, any>): void;
    toColumnar(): ColumnarInput;
    done(): void;
    fromFetch(url: string, fetchOpts?: RequestInit): Promise<void>;
}
declare function pivotTableRenderer(pivotData: PivotDataInstance, opts?: RendererOptions): HTMLTableElement;
declare const renderers: Record<string, any>;

export { type AggregatorInstance, type ColumnarInput, type NumberFormatOptions, PivotData, type PivotDataInstance, type PivotDataOptions, PivotStream, type PivotStreamInstance, type PivotStreamOptions, type RendererOptions, type SortOrder, aggregatorTemplates, aggregators, derivers, getSort, locales, naturalSort, numberFormat, pivotTableRenderer, renderers, sortAs };
