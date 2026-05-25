import { useState, useMemo } from "react";
import { pivotUtilities } from "pivottable-ts/vanilla";
import { chartjsRenderers } from "pivottable-ts/renderers/chartjs";
import PivotTable from "./components/PivotTable";

// ─── Renderers ────────────────────────────────────────────────────────────────

const allRenderers = { ...pivotUtilities.renderers, ...chartjsRenderers };

// ─── Data ────────────────────────────────────────────────────────────────────

function makeData(n: number) {
  const regions  = ["North", "South", "East", "West", "Central"];
  const products = ["Widget", "Gadget", "Doohickey", "Thingamajig", "Whatchamacallit"];
  const years    = [2021, 2022, 2023, 2024];
  const ri = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a;
  return Array.from({ length: n }, () => ({
    Region:  regions[ri(0, 4)],
    Product: products[ri(0, 4)],
    Year:    years[ri(0, 3)],
    Sales:   ri(50, 500),
    Qty:     ri(1, 20),
  }));
}

// ─── Locale list ─────────────────────────────────────────────────────────────

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

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [locale,       setLocale]       = useState("en");
  const [rowCount,     setRowCount]     = useState(500);
  const [mounted,      setMounted]      = useState(true);
  const [rendererName, setRendererName] = useState("Bar Chart");

  const data        = useMemo(() => makeData(rowCount), [rowCount]);
  const localeLabel = LOCALES.find(l => l.code === locale)?.label ?? locale;
  // Static array literals — memoised so PivotTable's useEffect dep stays stable
  const defaultRows = useMemo(() => ["Region"],  []);
  const defaultCols = useMemo(() => ["Product"], []);
  const defaultVals = useMemo(() => ["Sales"],   []);

  return (
    <>
      <header>
        <span className="react-logo">⚛</span>
        <div>
          <h1>PivotTable + React</h1>
          <span>vanilla adapter · Chart.js renderers · locale switching</span>
        </div>
      </header>

      <div className="page">

        {/* Controls */}
        <div className="card">
          <p className="card-title">Controls</p>
          <div className="controls">

            <div className="control-group">
              <label>Locale</label>
              <select value={locale} onChange={e => setLocale(e.target.value)}>
                {LOCALES.map(l => (
                  <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Default renderer</label>
              <select value={rendererName} onChange={e => setRendererName(e.target.value)}>
                {Object.keys(allRenderers).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            <div className="control-group">
              <label>Row count</label>
              <div className="range-row">
                <input
                  type="range" min={50} max={2000} step={50}
                  value={rowCount}
                  onChange={e => setRowCount(Number(e.target.value))}
                />
                <span className="range-badge">{rowCount}</span>
              </div>
            </div>

            <div className="control-group">
              <label>Component</label>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-mount"   onClick={() => setMounted(true)}  disabled={mounted}>Mount</button>
                <button className="btn btn-unmount" onClick={() => setMounted(false)} disabled={!mounted}>Unmount</button>
              </div>
            </div>

            <div className="control-group">
              <label>Status</label>
              <span className={`status-pill ${mounted ? "mounted" : "unmounted"}`}>
                <span className="status-dot" />
                {mounted ? "Mounted" : "Unmounted"}
              </span>
            </div>

          </div>
        </div>

        {/* Pivot */}
        <div className="card">
          <p className="card-title">PivotTable — {localeLabel}</p>
          {mounted ? (
            <PivotTable
              data={data}
              locale={locale}
              renderers={allRenderers}
              rendererName={rendererName}
              rows={defaultRows}
              cols={defaultCols}
              vals={defaultVals}
            />
          ) : (
            <div className="empty-state">
              Component unmounted — click <strong>Mount</strong> to restore.
            </div>
          )}
        </div>

      </div>
    </>
  );
}
