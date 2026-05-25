import { useEffect, useRef, useMemo } from "react";
import { createPivotUI } from "@jmars25/pivottable-ts/vanilla";
import type { PivotUIOptions } from "@jmars25/pivottable-ts/vanilla";

// ─── usePivotUI ──────────────────────────────────────────────────────────────
// Core hook: mounts a pivot UI into a div, cleans up on unmount or locale change.

function usePivotUI(data: unknown, opts: PivotUIOptions, locale: string) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handle = createPivotUI(el, data, opts, /* overwrite */ true, locale);
    return () => handle.destroy();
  }, [data, opts, locale]);

  return ref;
}

// ─── PivotTable ──────────────────────────────────────────────────────────────

interface PivotTableProps {
  data:         unknown[];
  locale?:      string;
  renderers?:   PivotUIOptions["renderers"];
  rendererName?: string;
  rows?:        string[];
  cols?:        string[];
  vals?:        string[];
}

export default function PivotTable({
  data,
  locale        = "en",
  renderers,
  rendererName,
  rows          = [],
  cols          = [],
  vals          = [],
}: PivotTableProps) {
  const opts = useMemo<PivotUIOptions>(() => ({
    renderers,
    rendererName,
    rows,
    cols,
    vals,
  }), [renderers, rendererName, rows, cols, vals]);

  const ref = usePivotUI(data, opts, locale);

  return <div ref={ref} style={{ width: "100%" }} />;
}
