<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { type PivotUIOptions } from "pivottable-ts/vanilla";
import { usePivotUI } from "../composables/usePivotUI";

// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    data: unknown[];
    locale?: string;
    renderers?: Record<string, unknown>;
    rendererName?: string;
    rows?: string[];
    cols?: string[];
    vals?: string[];
  }>(),
  { locale: "en" },
);

// ─── Reactive refs passed into the composable ─────────────────────────────────

const localeRef = computed(() => props.locale);

const dataRef = computed(() => props.data);

/**
 * Build opts from current props. We do NOT include aggregatorName so that
 * locale switching can't break the aggregator dropdown (same fix as React demo).
 */
const optsRef = computed<PivotUIOptions>(() => ({
  renderers:    props.renderers,
  rendererName: props.rendererName,
  rows:         props.rows,
  cols:         props.cols,
  vals:         props.vals,
}));

// ─── Mount pivot ──────────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null);

const { init } = usePivotUI(containerRef, dataRef, optsRef, localeRef);

onMounted(init);
</script>

<template>
  <div ref="containerRef" style="width: 100%" />
</template>
