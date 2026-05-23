import { PivotDataInstance, RendererOptions } from '../pivot.mjs';

/**
 * Drop-in replacement for (or addition to) the default renderers map.
 *
 * @example
 * createPivotUI(el, data, { renderers: chartjsRenderers });
 *
 * @example  // merge with table renderers
 * import { pivotUtilities } from "pivottable/vanilla";
 * createPivotUI(el, data, {
 *   renderers: { ...pivotUtilities.renderers, ...chartjsRenderers },
 * });
 */
declare const chartjsRenderers: Record<string, (pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement>;

export { chartjsRenderers };
