// Run with: node --expose-gc bench/memory.js
// --expose-gc lets us call global.gc() to force garbage collection before
// each measurement so we're not including leftover allocations from setup.

if (typeof global.gc !== "function") {
    console.error("Run with: node --expose-gc bench/memory.js");
    process.exit(1);
}

var DICTS = {
    region:   ["North", "South", "East", "West"],
    category: ["Electronics", "Furniture", "Clothing", "Food", "Sports"],
    year:     ["2020", "2021", "2022", "2023", "2024"],
    quarter:  ["Q1", "Q2", "Q3", "Q4"]
};

var N = parseInt(process.argv[2], 10) || 100000;
console.log("Row count:", N.toLocaleString(), "\n");

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mb(bytes) {
    return (bytes / 1048576).toFixed(2) + " MB";
}

// Force GC and return a snapshot of all relevant memory counters.
//
// Three numbers matter here:
//   heapUsed  — V8-managed objects: plain JS objects, strings, closures.
//               Row-objects live here. TypedArray *metadata* lives here but
//               the actual data buffer does not.
//   external  — ArrayBuffer backing stores and other C++-owned memory that
//               is bound to a JS object. TypedArray data lives here.
//   rss       — Resident Set Size: total physical RAM the process is using
//               (heap + external + stack + code). The most honest single number
//               for "how much memory does this actually cost the machine".
function memNow() {
    global.gc();
    global.gc(); // twice — first pass frees, second confirms
    var m = process.memoryUsage();
    return { heap: m.heapUsed, external: m.external, rss: m.rss };
}

function measure(label, fn) {
    var before = memNow();
    var t0 = process.hrtime.bigint();

    var result = fn();

    var elapsed = Number(process.hrtime.bigint() - t0) / 1e6; // ms
    var after = memNow();

    var dHeap     = after.heap     - before.heap;
    var dExternal = after.external - before.external;
    var dRss      = after.rss      - before.rss;
    var dTotal    = dHeap + dExternal;

    console.log(label);
    console.log("  heap delta     : " + mb(dHeap)     + "  (JS objects — row-objects land here)");
    console.log("  external delta : " + mb(dExternal) + "  (ArrayBuffer data — TypedArrays land here)");
    console.log("  total delta    : " + mb(dTotal)    + "  (heap + external — apples-to-apples comparison)");
    console.log("  rss delta      : " + mb(dRss)      + "  (actual RAM used by process)");
    console.log("  time           : " + elapsed.toFixed(1) + " ms");
    console.log();

    return { result, heap: dHeap, external: dExternal, total: dTotal, rss: dRss, elapsed };
}

// ─── Data generators ──────────────────────────────────────────────────────────

function generateRowObjects(n) {
    var rows = [];
    for (var i = 0; i < n; i++) {
        rows.push({
            region:   DICTS.region[i   % DICTS.region.length],
            category: DICTS.category[i % DICTS.category.length],
            year:     DICTS.year[i     % DICTS.year.length],
            quarter:  DICTS.quarter[i  % DICTS.quarter.length],
            sales:    Math.round((((i * 1664525 + 1013904223) & 0x7fffffff) % 90000) + 10000) / 100,
            quantity: ((i * 22695477 + 1) & 0x7fffffff) % 100 + 1
        });
    }
    return rows;
}

function generateColumnar(n) {
    var regionIdx   = new Uint8Array(n);
    var categoryIdx = new Uint8Array(n);
    var yearIdx     = new Uint8Array(n);
    var quarterIdx  = new Uint8Array(n);
    var sales       = new Float64Array(n);
    var quantity    = new Float64Array(n);

    for (var i = 0; i < n; i++) {
        regionIdx[i]   = i % DICTS.region.length;
        categoryIdx[i] = i % DICTS.category.length;
        yearIdx[i]     = i % DICTS.year.length;
        quarterIdx[i]  = i % DICTS.quarter.length;
        sales[i]       = Math.round((((i * 1664525 + 1013904223) & 0x7fffffff) % 90000) + 10000) / 100;
        quantity[i]    = ((i * 22695477 + 1) & 0x7fffffff) % 100 + 1;
    }

    return {
        columnFormat: true,
        columnNames: ["region", "category", "year", "quarter", "sales", "quantity"],
        columns: { region: regionIdx, category: categoryIdx, year: yearIdx,
                   quarter: quarterIdx, sales, quantity },
        dicts: { region: DICTS.region, category: DICTS.category,
                 year: DICTS.year, quarter: DICTS.quarter }
    };
}

// ─── Run ──────────────────────────────────────────────────────────────────────

var r1 = measure("Row-objects allocation", function() {
    return generateRowObjects(N);
});

// Drop the reference and GC before next test
r1.result = null;
global.gc();
global.gc();

var r2 = measure("Columnar allocation", function() {
    return generateColumnar(N);
});

r2.result = null;
global.gc();
global.gc();

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log("─────────────────────────────────────────");
console.log("Fair comparison uses heap+external (total), not heap alone.");
console.log("TypedArray data is off-heap so heapUsed alone makes columnar look free.\n");
if (r1.total > 0 && r2.total > 0) {
    var ratio = (r1.total / r2.total).toFixed(1);
    console.log("Memory ratio : " + ratio + "x  (" + mb(r1.total) + " vs " + mb(r2.total) + ")");
    console.log("Speed ratio  : " + (r1.elapsed / r2.elapsed).toFixed(2) + "x generation");
    console.log("Saved        : " + mb(r1.total - r2.total) + " for " + N.toLocaleString() + " rows");
} else {
    console.log("A GC pass ran mid-measurement — rerun for clean numbers.");
}
