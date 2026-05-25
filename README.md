# pivottable-ts

A TypeScript pivot table library with drag-and-drop UI, Chart.js renderers, and 15-language locale support. Framework-agnostic — works with vanilla JS, React, Vue, or any other stack.

Forked from the original [pivottable](https://github.com/nicolaskruchten/pivottable) by Nicolas Kruchten and rewritten in TypeScript with a vanilla adapter (no jQuery required), columnar and streaming data input, and a modern build pipeline.

---

## Installation

```bash
npm install @jmars25/pivottable-ts
```

For Chart.js renderers:
```bash
npm install chart.js
```

---

## Quick start

### Static table

```ts
import { createPivot } from "@jmars25/pivottable-ts/vanilla";
import "@jmars25/pivottable-ts/dist/pivot.css";

const data = [
  { Region: "North", Product: "Widget", Sales: 120 },
  { Region: "South", Product: "Gadget", Sales: 340 },
  // ...
];

createPivot(document.getElementById("output"), data, {
  rows: ["Region"],
  cols: ["Product"],
  vals: ["Sales"],
});
```

### Interactive drag-and-drop UI

```ts
import { createPivotUI } from "@jmars25/pivottable-ts/vanilla";
import "@jmars25/pivottable-ts/dist/pivot.css";

const handle = createPivotUI(document.getElementById("output"), data, {
  rows: ["Region"],
  cols: ["Product"],
  vals: ["Sales"],
});

// Clean up when done (important in SPAs)
handle.destroy();
```

---

## Chart.js renderers

```ts
import { createPivotUI, pivotUtilities } from "@jmars25/pivottable-ts/vanilla";
import { chartjsRenderers } from "@jmars25/pivottable-ts/renderers/chartjs";

createPivotUI(el, data, {
  renderers: { ...pivotUtilities.renderers, ...chartjsRenderers },
  rendererName: "Bar Chart",
});
```

Available renderers: `Bar Chart`, `Stacked Bar Chart`, `Horizontal Bar Chart`, `Line Chart`, `Area Chart`, `Scatter Chart`, `Multiple Pie Chart`.

---

## Locales

Import the side-effect module once at your app entry point to register all 15 locales, then pass `locale` to any create function:

```ts
import "@jmars25/pivottable-ts/locales"; // registers: cs, da, de, es, fr, it, ja, nl, pl, pt, ru, sq, tr, zh

createPivotUI(el, data, { locale: "de" });
```

Supported locales: `cs` `da` `de` `es` `fr` `it` `ja` `nl` `pl` `pt` `ru` `sq` `tr` `zh` (plus the default `en`).

---

## React

```tsx
import { useEffect, useRef, useMemo } from "react";
import { createPivotUI } from "@jmars25/pivottable-ts/vanilla";
import type { PivotUIOptions } from "@jmars25/pivottable-ts/vanilla";
import "@jmars25/pivottable-ts/dist/pivot.css";
import "@jmars25/pivottable-ts/locales";

function PivotTable({ data, locale = "en", ...opts }: { data: unknown[]; locale?: string } & PivotUIOptions) {
  const ref  = useRef<HTMLDivElement>(null);
  const stable = useMemo(() => opts, Object.values(opts)); // eslint-disable-line

  useEffect(() => {
    if (!ref.current) return;
    const handle = createPivotUI(ref.current, data, stable, true, locale);
    return () => handle.destroy();
  }, [locale]);

  return <div ref={ref} style={{ width: "100%" }} />;
}
```

See [`examples/react-demo/`](examples/react-demo/) for a full working example with locale switching and Chart.js renderers.

---

## Vue

```vue
<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";
import { createPivotUI } from "@jmars25/pivottable-ts/vanilla";
import "@jmars25/pivottable-ts/dist/pivot.css";
import "@jmars25/pivottable-ts/locales";

const props  = defineProps<{ data: unknown[]; locale?: string }>();
const el     = ref<HTMLElement | null>(null);
let   handle: ReturnType<typeof createPivotUI> | null = null;

function init() {
  if (!el.value) return;
  handle?.destroy();
  handle = createPivotUI(el.value, props.data, {}, true, props.locale ?? "en");
}

onMounted(init);
watch(() => props.locale, init);
onUnmounted(() => handle?.destroy());
</script>

<template>
  <div ref="el" style="width: 100%" />
</template>
```

See [`examples/vue-demo/`](examples/vue-demo/) for a full working example.

---

## Columnar input

For large datasets, pass data as typed arrays instead of an array of row objects. Strings are dictionary-encoded (`Uint16Array`), numbers use `Float64Array`. This avoids per-row object allocation and speeds up pivot computation significantly.

```ts
import { PivotData } from "@jmars25/pivottable-ts";
import type { ColumnarInput } from "@jmars25/pivottable-ts";

const input: ColumnarInput = {
  columnFormat: true,
  columnNames: ["Region", "Product", "Sales"],
  columns: {
    Region:  new Uint16Array([0, 1, 0, 1]),   // indices into dicts.Region
    Product: new Uint16Array([0, 0, 1, 1]),   // indices into dicts.Product
    Sales:   new Float64Array([120, 340, 80, 210]),
  },
  dicts: {
    Region:  ["North", "South"],
    Product: ["Widget", "Gadget"],
  },
};

createPivot(el, input, { rows: ["Region"], cols: ["Product"], vals: ["Sales"] });
```

---

## Streaming input

`PivotStream` accepts records one at a time, accumulates them into columnar format internally, then hands off to `PivotData` when done. Useful for WebSockets, CSV parsing, or any source where data arrives incrementally.

```ts
import { PivotStream } from "@jmars25/pivottable-ts";

const stream = new PivotStream({
  onComplete: (_err, count, s) => {
    console.log(`Loaded ${count} rows`);
    createPivot(el, s.toColumnar(), { rows: ["Region"], cols: ["Product"], vals: ["Sales"] });
  },
});

// Push records as they arrive
stream.push({ Region: "North", Product: "Widget", Sales: 120 });
stream.push({ Region: "South", Product: "Gadget", Sales: 340 });
stream.done();
```

### Fetch a CSV stream directly

```ts
await stream.fromFetch("/api/data.csv");
// onComplete fires automatically when the fetch finishes
```

---

## CDN / script tag

No build step needed. SortableJS is bundled in — only two tags required:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@jmars25/pivottable-ts/dist/pivot.css">
<script src="https://cdn.jsdelivr.net/npm/@jmars25/pivottable-ts/dist/pivot.min.js"></script>
<script>
  const { createPivotUI } = PivotTableTS;
  createPivotUI(document.getElementById("output"), data, {
    rows: ["Region"],
    cols: ["Product"],
  });
</script>
```

---

## API reference

### `createPivot(container, data, opts?)`

Renders a static (non-interactive) pivot table into `container`.

| Option | Type | Default | Description |
|---|---|---|---|
| `rows` | `string[]` | `[]` | Row attributes |
| `cols` | `string[]` | `[]` | Column attributes |
| `vals` | `string[]` | `[]` | Value attributes |
| `aggregator` | `function` | `count()` | Aggregation function |
| `aggregatorName` | `string` | `"Count"` | Display name for the aggregator |
| `renderer` | `function` | table renderer | Output renderer |
| `filter` | `(record) => boolean` | — | Exclude records |
| `sorters` | `Record / function` | — | Custom sort order per attribute |
| `derivedAttributes` | `Record<string, fn>` | — | Computed columns |
| `locale` | `string` | `"en"` | UI locale |

### `createPivotUI(container, data, opts?, overwrite?, locale?)`

Renders a drag-and-drop pivot UI. Returns a `PivotUIHandle` with a `.destroy()` method.

Additional options beyond `createPivot`:

| Option | Type | Description |
|---|---|---|
| `renderers` | `Record<string, fn>` | Map of renderer name → renderer function |
| `rendererName` | `string` | Initially selected renderer |
| `hiddenAttributes` | `string[]` | Attributes hidden from all lists |
| `hiddenFromAggregators` | `string[]` | Hidden from the aggregator value picker |
| `hiddenFromDragDrop` | `string[]` | Hidden from drag-and-drop but still usable |
| `inclusions` / `exclusions` | `Record<string, string[]>` | Pre-filter attribute values |
| `onRefresh` | `(opts) => void` | Called on every UI interaction |

### `pivotUtilities`

Namespace re-exported from the vanilla adapter. Contains:
- `aggregatorTemplates` — factory functions for building aggregators
- `aggregators` — ready-to-use aggregator map
- `renderers` — built-in table/heatmap renderers
- `numberFormat` — number formatting helper
- `sortAs`, `naturalSort`, `getSort` — sorting utilities

---

## License

MIT — see [LICENSE.md](LICENSE.md).
© 2026 jmars25. Original pivottable © 2012 Nicolas Kruchten.
