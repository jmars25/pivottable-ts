import { PivotDataOptions, PivotDataInstance, RendererOptions, numberFormat, PivotData, PivotStream } from '../pivot.js';

interface PivotOptions extends PivotDataOptions {
    renderer?: (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement;
    rendererOptions?: RendererOptions;
    dataClass?: new (input: any, opts?: PivotDataOptions) => PivotDataInstance;
    locale?: string;
}
declare function createPivot(container: HTMLElement, input: any, opts?: PivotOptions): void;
declare const pivotUtilities: {
    aggregatorTemplates: Record<string, any>;
    aggregators: Record<string, any>;
    renderers: Record<string, any>;
    derivers: Record<string, any>;
    locales: Record<string, any>;
    naturalSort: (as: any, bs: any) => number;
    numberFormat: typeof numberFormat;
    sortAs: (order: any[]) => (a: any, b: any) => number;
    getSort: (sorters: any, attr: string) => (a: any, b: any) => number;
    PivotData: typeof PivotData;
    PivotStream: typeof PivotStream;
};

export { type PivotOptions, createPivot, pivotUtilities };
