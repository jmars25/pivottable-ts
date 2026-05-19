// Simple NDJSON streaming server for testing PivotStream.fromFetch()
// Run with: node bench/stream-server.js
// Then hit "Stream from server" in examples/columnar_test.html

var http = require("http");
var url  = require("url");

var DICTS = {
    region:   ["North", "South", "East", "West"],
    category: ["Electronics", "Furniture", "Clothing", "Food", "Sports"],
    year:     ["2020", "2021", "2022", "2023", "2024"],
    quarter:  ["Q1", "Q2", "Q3", "Q4"]
};

var PORT       = 3001;
var CHUNK_SIZE = 500; // rows per write — tune this to simulate different network conditions

function makeRow(i) {
    return {
        region:   DICTS.region[i   % DICTS.region.length],
        category: DICTS.category[i % DICTS.category.length],
        year:     DICTS.year[i     % DICTS.year.length],
        quarter:  DICTS.quarter[i  % DICTS.quarter.length],
        sales:    Math.round((((i * 1664525 + 1013904223) & 0x7fffffff) % 90000) + 10000) / 100,
        quantity: ((i * 22695477 + 1) & 0x7fffffff) % 100 + 1
    };
}

var server = http.createServer(function(req, res) {
    var parsed = url.parse(req.url, true);

    // CORS headers so the browser test page can hit this from a different port
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");

    if (parsed.pathname !== "/stream") {
        res.writeHead(404);
        res.end("Use /stream?n=100000");
        return;
    }

    var n = Math.min(parseInt(parsed.query.n, 10) || 100000, 2000000);

    res.writeHead(200, {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache"
    });

    console.log("Streaming " + n.toLocaleString() + " rows...");
    var t0   = Date.now();
    var sent = 0;

    // Write rows in chunks using setImmediate so the event loop stays free.
    // This is what makes it a real stream — the browser receives and processes
    // chunks as they arrive rather than waiting for the full response.
    function writeChunk() {
        var end = Math.min(sent + CHUNK_SIZE, n);
        var lines = [];
        for (var i = sent; i < end; i++) {
            lines.push(JSON.stringify(makeRow(i)));
        }
        // Write all lines in this chunk as one TCP write — newline delimited
        var ok = res.write(lines.join("\n") + "\n");
        sent = end;

        if (sent >= n) {
            res.end();
            console.log("Done — " + n.toLocaleString() + " rows in " + (Date.now() - t0) + "ms");
        } else if (ok) {
            // Socket buffer has room — send next chunk immediately
            setImmediate(writeChunk);
        } else {
            // Socket buffer is full — wait for drain before sending more.
            // This is backpressure: we don't generate rows faster than the
            // client can consume them, keeping server memory flat too.
            res.once("drain", writeChunk);
        }
    }

    writeChunk();
});

server.listen(PORT, function() {
    console.log("Stream server running at http://localhost:" + PORT);
    console.log("Open examples/columnar_test.html and click 'Stream from server'");
    console.log("Or test directly: curl http://localhost:" + PORT + "/stream?n=1000 | head -5");
});
