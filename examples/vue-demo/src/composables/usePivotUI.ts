import { type Ref, watch, onUnmounted } from "vue";
import { createPivotUI, type PivotUIOptions } from "pivottable-ts/vanilla";

/**
 * Vue composable that mounts a PivotUI inside `containerRef`.
 *
 * Mirrors the React `usePivotUI` hook:
 *   - Rebuilds the table whenever `locale` changes (full destroy + reinit).
 *   - Destroys cleanly when the component is unmounted.
 *   - `data` and `opts` are expected to be reactive refs so the caller
 *     controls which changes trigger a rebuild.
 */
export function usePivotUI(
  containerRef: Ref<HTMLElement | null>,
  data: Ref<unknown[]>,
  opts: Ref<PivotUIOptions>,
  locale: Ref<string>,
) {
  let handle: ReturnType<typeof createPivotUI> | null = null;

  function init() {
    if (!containerRef.value) return;
    handle?.destroy();
    handle = createPivotUI(
      containerRef.value,
      data.value,
      opts.value,
      /* overwrite */ true,
      locale.value,
    );
  }

  // Re-run whenever locale, data, or opts change.
  watch([locale, data, opts], init);

  onUnmounted(() => {
    handle?.destroy();
    handle = null;
  });

  return { init };
}
