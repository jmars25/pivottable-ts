import { PivotDataOptions, PivotDataInstance, RendererOptions, numberFormat, PivotData, PivotStream } from '../pivot.mjs';

interface PivotOptions extends PivotDataOptions {
    renderer?: (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement;
    rendererOptions?: RendererOptions;
    dataClass?: new (input: any, opts?: PivotDataOptions) => PivotDataInstance;
    locale?: string;
    /** Locale string overrides (e.g. button labels, error messages). */
    localeStrings?: Record<string, any>;
}
declare function createPivot(container: HTMLElement, input: any, opts?: PivotOptions): void;
interface PivotUIOptions extends PivotOptions {
    aggregators?: Record<string, any>;
    renderers?: Record<string, (data: PivotDataInstance, opts?: any) => HTMLElement>;
    rendererName?: string;
    hiddenAttributes?: string[];
    hiddenFromAggregators?: string[];
    hiddenFromDragDrop?: string[];
    menuLimit?: number;
    exclusions?: Record<string, string[]>;
    inclusions?: Record<string, string[]>;
    unusedAttrsVertical?: boolean | number | "auto";
    autoSortUnusedAttrs?: boolean;
    onRefresh?: ((opts: Record<string, any>) => void) | null;
    showUI?: boolean;
}
interface PivotUIHandle {
    /** Remove the pivot UI from the container and free all resources. */
    destroy(): void;
}
interface HeatmapOptions {
    heatmap?: {
        /** Override the default red-scale color generator. */
        colorScaleGenerator?: (values: number[]) => (x: number) => string;
    };
}
declare function heatmap(table: HTMLElement, scope?: "heatmap" | "rowheatmap" | "colheatmap", opts?: HeatmapOptions): HTMLElement;
declare function barchart(table: HTMLElement): HTMLElement;
declare const vanillaRenderers: Record<string, (data: PivotDataInstance, opts?: any) => HTMLElement>;
declare function createPivotUI(container: HTMLElement, input: any, inputOpts?: PivotUIOptions, overwrite?: boolean, locale?: string): PivotUIHandle;
declare const pivotUtilities: {
    aggregatorTemplates: Record<string, any>;
    aggregators: Record<string, any>;
    renderers: Record<string, any>;
    vanillaRenderers: Record<string, (data: PivotDataInstance, opts?: any) => HTMLElement>;
    derivers: Record<string, any>;
    locales: Record<string, any>;
    naturalSort: (as: any, bs: any) => number;
    numberFormat: typeof numberFormat;
    sortAs: (order: any[]) => (a: any, b: any) => number;
    getSort: (sorters: any, attr: string) => (a: any, b: any) => number;
    heatmap: typeof heatmap;
    barchart: typeof barchart;
    PivotData: typeof PivotData;
    PivotStream: typeof PivotStream;
};

export { type HeatmapOptions, type PivotOptions, type PivotUIHandle, type PivotUIOptions, barchart, createPivot, createPivotUI, heatmap, pivotUtilities, vanillaRenderers };
