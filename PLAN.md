# PivotTable — Modernisation Plan

## Goal

Make the library usable in any modern framework (React, Vue, Svelte, plain JS)
without a jQuery dependency, and replace the legacy chart renderers with Chart.js.

---

## Current State (done)

### Core data layer — `src/pivot.ts`
- Pure ES module, zero jQuery, zero DOM dependency (except `HTMLTableElement`
  return type on `pivotTableRenderer`)
- Full TypeScript interfaces exported in `dist/pivot.d.ts`:
  - `AggregatorInstance` — shape of a live aggregator cell
  - `NumberFormatOptions` — options for `numberFormat()`
  - `ColumnarInput` — columnar TypedArray input format
  - `SortOrder` — `"key_a_to_z" | "key_z_to_a" | ...`
  - `PivotDataOptions` — constructor options for `PivotData`
  - `PivotDataInstance` — public API of a `PivotData` object
  - `RendererOptions` — options passed to any renderer function
  - `PivotStreamOptions` — constructor options for `PivotStream`
  - `PivotStreamInstance` — public API of a `PivotStream` object
- `PivotStream` typed with constructor signature in `.d.ts`
- Bug fixed: `pivotTableRenderer` now uses `pivotData.getAggregator()`
  instead of `this.aggregator()` (was creating empty aggregators, wrong values)
- Build: tsup, CJS + ESM + `.d.ts`, two entry points (`pivot` and `jquery` adapter)

### jQuery adapter — `src/adapters/jquery.ts`
- Separated from core, loaded independently
- Provides `$.fn.pivot`, `$.fn.pivotUI`, `$.fn.heatmap`, `$.fn.barchart`
- jQuery-specific renderers: Table Barchart, Heatmap, Row Heatmap, Col Heatmap
- Still functional — kept for backward compatibility during transition

### Build
- `tsup.config.ts` — two entry points, CJS + ESM, `dts: true`
- `tsconfig.json` — `strict: false`, `noImplicitAny: false` (intentional for now)
- `dist/pivot.d.ts` — 3.3 KB, all interfaces exported cleanly

### Deleted / cleaned up
- `src/pivot.js` — old pre-TypeScript source, deleted
- `src/pivot.ts` comment-only jQuery references removed

### Pending TypeScript (intentionally deferred)
- `PivotData` still declared as `any` — fix is converting IIFE to `class`
  (natural part of Phase 2)
- `strict: true` / `noImplicitAny: true` — enable after jQuery adapter is gone
- `aggregatorTemplates` / `aggregators` still `Record<string, any>` — low
  priority until aggregator system is reviewed

---

## Phase 2 — Vanilla Adapter (replace jQuery)

**Output:** `src/adapters/vanilla.ts` → `dist/adapters/vanilla.js`

### Key architectural change

Old pattern (jQuery plugin, side effect on global `$`):
```js
$("#container").pivotUI(data, opts);
```

New pattern (plain function, works anywhere):
```ts
import { createPivotUI } from "pivottable/vanilla";
const ui = createPivotUI(element, data, opts);
ui.destroy(); // cleanup
```

Framework usage is then trivial:
```ts
// React
useEffect(() => {
  const ui = createPivotUI(ref.current, data, opts);
  return () => ui.destroy();
}, []);

// Vue / Svelte — same with onMounted / onUnmounted
```

### What replaces what

| jQuery code | Vanilla replacement |
|---|---|
| `$.extend(true, {}, a, b)` | `Object.assign({}, a, b)` / small deepMerge helper |
| `$("<div>").addClass("x")` | `document.createElement("div")` + small `el()` helper |
| `.appendTo()` / `.append()` | `.appendChild()` |
| `.bind("click", fn)` | `.addEventListener("click", fn)` |
| `.val()` / `.html()` / `.text()` | `.value` / `.innerHTML` / `.textContent` |
| `.show()` / `.hide()` | `.style.display` |
| `.data("key", val)` | `el.dataset.key` or a `WeakMap` |
| `.find("selector")` | `.querySelectorAll("selector")` |
| `.css({ left, top })` | `.style.left / .style.top` |
| `$(...).sortable()` (jQuery UI) | **SortableJS** (see below) |
| `$(...).draggable()` (jQuery UI) | **SortableJS** |

### DOM helper pattern
Rather than writing `document.createElement` everywhere, use a tiny local helper
at the top of the file:
```ts
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (HTMLElement | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  for (const child of children) {
    node.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}
```

### Drag and drop — SortableJS

Install as a peer dependency:
```
npm install sortablejs
npm install --save-dev @types/sortablejs
```

The pivot UI has three droppable containers: Rows, Columns, Unused.
`$.fn.sortable({ connectWith })` becomes:
```ts
import Sortable from "sortablejs";

Sortable.create(rowsContainer, {
  group: "attrs",           // shared group name = can drag between containers
  animation: 150,
  onEnd: refresh            // rebuild pivot when an item is dropped
});
```
One `Sortable.create` call per container. Nearly 1:1 with the jQuery UI API.

### New entry point in `tsup.config.ts`
```ts
entry: ["src/pivot.ts", "src/adapters/jquery.ts", "src/adapters/vanilla.ts"],
```

Add to `package.json` exports:
```json
"./vanilla": {
  "import": "./dist/adapters/vanilla.mjs",
  "require": "./dist/adapters/vanilla.js"
}
```

### Convert `PivotData` IIFE to `class`

This is the natural first step of Phase 2 since the IIFE pattern is the last
big CoffeeScript-era structural pattern in the core.

Before:
```ts
export const PivotData: any = (function() {
  function PivotData(this: any, input: any, opts: PivotDataOptions) { ... }
  PivotData.prototype.getAggregator = function(...) { ... };
  return PivotData;
})();
```

After:
```ts
export class PivotData implements PivotDataInstance {
  rowAttrs: string[];
  // ...
  constructor(input: any, opts: PivotDataOptions = {}) { ... }
  getAggregator(rowKey: string[], colKey: string[]): AggregatorInstance { ... }
}
```

Benefits:
- `PivotData` loses the `any` type in `dist/pivot.d.ts`
- `new PivotData(...)` returns a typed `PivotData` instance
- `implements PivotDataInstance` makes TypeScript verify the public API matches

### Order of attack within Phase 2

1. Convert `PivotData` IIFE → `class` in `src/pivot.ts`
2. Convert `PivotStream` IIFE → `class` in `src/pivot.ts`
3. Write `src/adapters/vanilla.ts` — `$.fn.pivot` equivalent first (thin, ~30 lines)
4. Port `$.fn.pivotUI` DOM building to vanilla — biggest chunk, work top to bottom
5. Port filter menus and attribute pill logic
6. Wire in SortableJS for drag and drop
7. Port `heatmap` and `barchart` post-processors
8. Add `vanilla` entry to `tsup.config.ts` and `package.json`
9. Smoke test against `examples/dev_test.html`
10. Enable `strict: true` now that jQuery adapter is gone
11. Keep `src/adapters/jquery.ts` as a thin wrapper around the vanilla adapter
    for anyone still on the old API (optional — can also just deprecate it)

---

## Phase 3 — Chart.js Renderers

**Output:** `src/renderers/chartjs.ts` → `dist/renderers/chartjs.js`

### Why Chart.js

| Library | Size (min+gz) | Status | Notes |
|---|---|---|---|
| Plotly | ~150KB gz | Active | Massive, overkill |
| D3 | ~25KB gz | Active | Toolkit not charting library, complex |
| C3 | ~15KB gz | Abandoned | D3 wrapper, unmaintained |
| gchart | 0KB (CDN) | Active | Google API call required |
| **Chart.js** | **~60KB gz** | **Active** | HTML5 canvas, clean API |

### Renderer signature
Every renderer in this library is just:
```ts
(pivotData: PivotDataInstance, opts?: RendererOptions) => HTMLElement
```
Chart.js renderers return a `<canvas>` element instead of a `<table>`.

### Chart types to implement

| Renderer name | Chart.js type | Notes |
|---|---|---|
| `"Bar Chart"` | `bar` | cols on x-axis, rows as series |
| `"Stacked Bar Chart"` | `bar` (stacked) | same, `stacked: true` |
| `"Horizontal Bar Chart"` | `bar` (indexAxis: 'y') | |
| `"Line Chart"` | `line` | |
| `"Area Chart"` | `line` (fill: true) | |
| `"Scatter Chart"` | `scatter` | needs exactly 2 vals |
| `"Multiple Pie Chart"` | `pie` | one per row key |

### Install as peer dependency
```
// package.json — peer, not bundled
"peerDependencies": {
  "chart.js": ">=4.0.0"
}
```
Chart.js is optional — only needed if the chart renderers are imported.

### Entry point
```ts
// tsup.config.ts
entry: [
  "src/pivot.ts",
  "src/adapters/jquery.ts",
  "src/adapters/vanilla.ts",
  "src/renderers/chartjs.ts"
]
```

```json
// package.json
"./renderers/chartjs": {
  "import": "./dist/renderers/chartjs.mjs",
  "require": "./dist/renderers/chartjs.js"
}
```

Usage:
```ts
import { createPivotUI } from "pivottable/vanilla";
import { chartjsRenderers } from "pivottable/renderers/chartjs";

createPivotUI(el, data, { renderers: chartjsRenderers });
```

### Delete the old CoffeeScript renderer files
Once Chart.js renderers are in place, delete:
- `src/c3_renderers.coffee`
- `src/d3_renderers.coffee`
- `src/export_renderers.coffee`
- `src/gchart_renderers.coffee`
- `src/plotly_renderers.coffee`

These are not in the build already — they're just dead source files.

---

## Phase 4 — Framework Wrappers (optional, low effort)

Once Phase 2 is done, thin wrappers are straightforward because every framework
has the same pattern: call `createPivotUI` on mount, call `destroy` on unmount.

```
packages/
  react/      <PivotTable /> and <PivotUI /> components
  vue/        same
  svelte/     same
```

Each wrapper is ~50 lines. Can be separate npm packages or kept in a monorepo.
Defer until Phase 2 is stable and tested.

---

## TypeScript strictness progression

| Phase | Setting | Reason |
|---|---|---|
| Now | `strict: false`, `noImplicitAny: false` | jQuery adapter has too many `any` patterns |
| After Phase 2 | `noImplicitAny: true` | jQuery adapter gone, vanilla code written cleanly |
| After Phase 2 | `strict: true` | Full strict mode — catches null issues, improves types |
| After Phase 3 | Full `dts` coverage | All renderers typed, declaration file complete |

---

## File structure when complete

```
src/
  pivot.ts                  ← pure data layer (done)
  adapters/
    jquery.ts               ← legacy wrapper (thin, calls vanilla internally)
    vanilla.ts              ← new primary adapter
  renderers/
    chartjs.ts              ← Chart.js renderers

dist/
  pivot.js / .mjs / .d.ts
  adapters/
    jquery.js / .mjs / .d.ts
    vanilla.js / .mjs / .d.ts
  renderers/
    chartjs.js / .mjs / .d.ts

examples/
  dev_test.html             ← existing test page
  vanilla_test.html         ← new test page for vanilla adapter
```

---

## Decisions already made

- **SortableJS** for drag and drop (not native HTML5 DnD — poor touch support)
- **Chart.js** for chart renderers (not Plotly/D3/C3 — size and maintenance)
- **Vanilla function API** `createPivotUI(el, data, opts)` not Web Components
  (simpler, easier to wrap in framework components)
- **Keep jQuery adapter** as thin backward-compat wrapper, not hard-deleted
- `PivotData` and `PivotStream` become proper `class` declarations in Phase 2
- `strict: true` deferred until after jQuery adapter is replaced
