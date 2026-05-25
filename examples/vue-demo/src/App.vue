<script setup lang="ts">
import { ref, computed } from "vue";
import { pivotUtilities } from "@jmars25/pivottable-ts/vanilla";
import { chartjsRenderers } from "@jmars25/pivottable-ts/renderers/chartjs";
import PivotTable from "./components/PivotTable.vue";

// ─── Renderers ────────────────────────────────────────────────────────────────

const allRenderers = { ...pivotUtilities.renderers, ...chartjsRenderers };
const rendererNames = Object.keys(allRenderers);

// ─── Data ─────────────────────────────────────────────────────────────────────

const REGIONS  = ["North", "South", "East", "West", "Central"];
const PRODUCTS = ["Widget", "Gadget", "Doohickey", "Thingamajig", "Whatchamacallit"];
const YEARS    = [2021, 2022, 2023, 2024];

function ri(a: number, b: number) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function makeData(n: number) {
  return Array.from({ length: n }, () => ({
    Region:  REGIONS[ri(0, 4)],
    Product: PRODUCTS[ri(0, 4)],
    Year:    YEARS[ri(0, 3)],
    Sales:   ri(50, 500),
    Qty:     ri(1, 20),
  }));
}

// ─── State ────────────────────────────────────────────────────────────────────

const locale       = ref("en");
const rowCount     = ref(500);
const mounted      = ref(true);
const rendererName = ref("Bar Chart");

const data = computed(() => makeData(rowCount.value));

// ─── Locale list ──────────────────────────────────────────────────────────────

const LOCALES = [
  { code: "en", label: "🇬🇧 English"    },
  { code: "de", label: "🇩🇪 Deutsch"    },
  { code: "fr", label: "🇫🇷 Français"   },
  { code: "es", label: "🇪🇸 Español"    },
  { code: "it", label: "🇮🇹 Italiano"   },
  { code: "pt", label: "🇧🇷 Português"  },
  { code: "nl", label: "🇳🇱 Nederlands" },
  { code: "pl", label: "🇵🇱 Polski"     },
  { code: "cs", label: "🇨🇿 Čeština"   },
  { code: "da", label: "🇩🇰 Dansk"      },
  { code: "ru", label: "🇷🇺 Русский"    },
  { code: "ja", label: "🇯🇵 日本語"      },
  { code: "zh", label: "🇨🇳 中文"        },
  { code: "tr", label: "🇹🇷 Türkçe"     },
  { code: "sq", label: "🇦🇱 Shqip"      },
];

const localeLabel = computed(
  () => LOCALES.find(l => l.code === locale.value)?.label ?? locale.value,
);
</script>

<template>
  <header>
    <span class="vue-logo">▲</span>
    <div>
      <h1>PivotTable + Vue</h1>
      <span>vanilla adapter · Chart.js renderers · locale switching</span>
    </div>
  </header>

  <div class="page">

    <!-- Controls -->
    <div class="card">
      <p class="card-title">Controls</p>
      <div class="controls">

        <div class="control-group">
          <label>Locale</label>
          <select v-model="locale">
            <option v-for="l in LOCALES" :key="l.code" :value="l.code">
              {{ l.label }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label>Default renderer</label>
          <select v-model="rendererName">
            <option v-for="name in rendererNames" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>

        <div class="control-group">
          <label>Row count</label>
          <div class="range-row">
            <input
              type="range" :min="50" :max="2000" :step="50"
              v-model.number="rowCount"
            />
            <span class="range-badge">{{ rowCount }}</span>
          </div>
        </div>

        <div class="control-group">
          <label>Component</label>
          <div style="display: flex; gap: 8px">
            <button class="btn btn-mount"   @click="mounted = true"  :disabled="mounted">Mount</button>
            <button class="btn btn-unmount" @click="mounted = false" :disabled="!mounted">Unmount</button>
          </div>
        </div>

        <div class="control-group">
          <label>Status</label>
          <span :class="['status-pill', mounted ? 'mounted' : 'unmounted']">
            <span class="status-dot" />
            {{ mounted ? "Mounted" : "Unmounted" }}
          </span>
        </div>

      </div>
    </div>

    <!-- Pivot -->
    <div class="card">
      <p class="card-title">PivotTable — {{ localeLabel }}</p>
      <PivotTable
        v-if="mounted"
        :data="data"
        :locale="locale"
        :renderers="allRenderers"
        :rendererName="rendererName"
        :rows="['Region']"
        :cols="['Product']"
        :vals="['Sales']"
      />
      <div v-else class="empty-state">
        Component unmounted — click <strong>Mount</strong> to restore.
      </div>
    </div>

  </div>
</template>
