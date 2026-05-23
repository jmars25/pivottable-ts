import {
  PivotData,
  PivotStream,
  aggregatorTemplates,
  aggregators,
  derivers,
  getSort,
  locales,
  naturalSort,
  numberFormat,
  pivotTableRenderer,
  renderers,
  sortAs
} from "./chunk-KOKACGAB.mjs";

// src/adapters/vanilla.ts
import Sortable from "sortablejs";
function el(tag, cls) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  return node;
}
function deepMerge(...sources) {
  var _a;
  const result = {};
  for (const src of sources) {
    if (src == null) continue;
    for (const key of Object.keys(src)) {
      const val = src[key];
      if (val !== null && typeof val === "object" && !Array.isArray(val) && typeof val !== "function") {
        result[key] = deepMerge((_a = result[key]) != null ? _a : {}, val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}
function createPivot(container, input, opts = {}) {
  var _a, _b;
  const locale = opts.locale != null && locales[opts.locale] != null ? opts.locale : "en";
  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  const defaults = {
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    filter: () => true,
    aggregator: aggregatorTemplates.count()(),
    aggregatorName: "Count",
    sorters: {},
    derivedAttributes: {},
    renderer: pivotTableRenderer
  };
  const fullOpts = deepMerge(
    { rendererOptions: { localeStrings }, localeStrings },
    Object.assign({}, defaults, opts)
  );
  let result = el("span");
  try {
    const DataClass = (_a = fullOpts.dataClass) != null ? _a : PivotData;
    const pivotData = new DataClass(input, fullOpts);
    try {
      result = ((_b = fullOpts.renderer) != null ? _b : pivotTableRenderer)(pivotData, fullOpts.rendererOptions);
    } catch (e) {
      console.error(e);
      result.textContent = localeStrings.renderError;
    }
  } catch (e) {
    console.error(e);
    result.textContent = localeStrings.computeError;
  }
  container.innerHTML = "";
  container.appendChild(result);
}
var uiState = /* @__PURE__ */ new WeakMap();
function heatmap(table, scope = "heatmap", opts) {
  var _a, _b, _c, _d;
  const numRows = parseInt((_a = table.dataset.numrows) != null ? _a : "0", 10);
  const numCols = parseInt((_b = table.dataset.numcols) != null ? _b : "0", 10);
  const colorGen = (_d = (_c = opts == null ? void 0 : opts.heatmap) == null ? void 0 : _c.colorScaleGenerator) != null ? _d : ((values) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    return (x) => {
      const nonRed = 255 - Math.round(255 * (x - min) / (max - min));
      return `rgb(255,${nonRed},${nonRed})`;
    };
  });
  const applyScale = (selector) => {
    const cells = [];
    const values = [];
    table.querySelectorAll(selector).forEach((td) => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) {
          cells.push(td);
          values.push(x);
        }
      }
    });
    if (values.length === 0) return;
    const scale = colorGen(values);
    cells.forEach((td, i) => {
      td.style.backgroundColor = scale(values[i]);
    });
  };
  switch (scope) {
    case "heatmap":
      applyScale(".pvtVal");
      break;
    case "rowheatmap":
      for (let i = 0; i < numRows; i++) applyScale(`.pvtVal.row${i}`);
      break;
    case "colheatmap":
      for (let j = 0; j < numCols; j++) applyScale(`.pvtVal.col${j}`);
      break;
  }
  applyScale(".pvtTotal.rowTotal");
  applyScale(".pvtTotal.colTotal");
  return table;
}
function barchart(table) {
  var _a;
  const numRows = parseInt((_a = table.dataset.numrows) != null ? _a : "0", 10);
  const applyBars = (selector) => {
    const cells = [];
    const values = [];
    table.querySelectorAll(selector).forEach((td) => {
      const raw = td.dataset.value;
      if (raw != null && raw !== "") {
        const x = Number(raw);
        if (isFinite(x)) {
          cells.push(td);
          values.push(x);
        }
      }
    });
    if (values.length === 0) return;
    let max = Math.max(...values);
    if (max < 0) max = 0;
    const min = Math.min(...values);
    const range = min < 0 ? max - min : max;
    const scale = (x) => 100 * x / (1.4 * range);
    cells.forEach((td, i) => {
      var _a2;
      const x = values[i];
      const text = (_a2 = td.textContent) != null ? _a2 : "";
      let bgColor = "gray";
      let bBase = min < 0 ? scale(-min) : 0;
      let barX = x;
      if (x < 0) {
        bBase += scale(x);
        bgColor = "darkred";
        barX = -x;
      }
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:relative;height:55px";
      const bar = document.createElement("div");
      bar.style.cssText = `position:absolute;bottom:${bBase}%;left:0;right:0;height:${scale(barX)}%;background-color:${bgColor}`;
      const label = document.createElement("div");
      label.textContent = text;
      label.style.cssText = "position:relative;padding-left:5px;padding-right:5px";
      wrapper.append(bar, label);
      td.style.cssText = "padding:0;padding-top:5px;text-align:center";
      td.innerHTML = "";
      td.appendChild(wrapper);
    });
  };
  for (let i = 0; i < numRows; i++) applyBars(`.pvtVal.row${i}`);
  applyBars(".pvtTotal.colTotal");
  return table;
}
var vanillaRenderers = {
  "Table Barchart": (data, opts) => barchart(pivotTableRenderer(data, opts)),
  "Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "heatmap", opts),
  "Row Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "rowheatmap", opts),
  "Col Heatmap": (data, opts) => heatmap(pivotTableRenderer(data, opts), "colheatmap", opts)
};
function createPivotUI(container, input, inputOpts = {}, overwrite = false, locale = "en") {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  if (locales[locale] == null) locale = "en";
  const localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  const defaults = {
    derivedAttributes: {},
    aggregators: locales[locale].aggregators,
    renderers: Object.assign({}, renderers, vanillaRenderers),
    hiddenAttributes: [],
    hiddenFromAggregators: [],
    hiddenFromDragDrop: [],
    menuLimit: 500,
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    exclusions: {},
    inclusions: {},
    unusedAttrsVertical: 85,
    autoSortUnusedAttrs: false,
    onRefresh: null,
    showUI: true,
    filter: () => true,
    sorters: {}
  };
  const existingOpts = uiState.get(container);
  const opts = !existingOpts || overwrite ? deepMerge({ rendererOptions: { localeStrings }, localeStrings }, Object.assign({}, defaults, inputOpts)) : existingOpts;
  try {
    const attrValues = {};
    const materializedInput = [];
    let recordsProcessed = 0;
    PivotData.forEachRecord(input, (_a = opts.derivedAttributes) != null ? _a : {}, (record) => {
      var _a2;
      if (!opts.filter(record)) return;
      materializedInput.push(record);
      for (const attr of Object.keys(record)) {
        if (attrValues[attr] == null) {
          attrValues[attr] = {};
          if (recordsProcessed > 0) attrValues[attr]["null"] = recordsProcessed;
        }
      }
      for (const attr of Object.keys(attrValues)) {
        const value = record[attr] != null ? String(record[attr]) : "null";
        attrValues[attr][value] = ((_a2 = attrValues[attr][value]) != null ? _a2 : 0) + 1;
      }
      recordsProcessed++;
    });
    const shownAttributes = Object.keys(attrValues).filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenAttributes) != null ? _a2 : []).includes(a);
    });
    const shownInAggregators = shownAttributes.filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenFromAggregators) != null ? _a2 : []).includes(a);
    });
    const shownInDragDrop = shownAttributes.filter((a) => {
      var _a2;
      return !((_a2 = opts.hiddenFromDragDrop) != null ? _a2 : []).includes(a);
    });
    let unusedVertical = opts.unusedAttrsVertical === true;
    if (!unusedVertical && opts.unusedAttrsVertical !== false) {
      const cutoff = opts.unusedAttrsVertical === "auto" ? 120 : Number(opts.unusedAttrsVertical);
      if (!isNaN(cutoff)) {
        unusedVertical = shownInDragDrop.reduce((sum, a) => sum + a.length, 0) > cutoff;
      }
    }
    const rendererControl = el("td", "pvtUiCell");
    const rendererSelect = el("select", "pvtRenderer");
    for (const name of Object.keys((_b = opts.renderers) != null ? _b : {})) {
      const o = el("option");
      o.value = name;
      o.textContent = name;
      rendererSelect.appendChild(o);
    }
    rendererControl.appendChild(rendererSelect);
    const unused = el("td", `pvtAxisContainer pvtUnused pvtUiCell ${unusedVertical ? "pvtVertList" : "pvtHorizList"}`);
    for (let i = 0; i < shownInDragDrop.length; i++) {
      const attr = shownInDragDrop[i];
      const values = Object.keys(attrValues[attr]);
      const filterBox = el("div", "pvtFilterBox");
      filterBox.style.display = "none";
      const h4 = el("h4");
      const nameSpan = el("span");
      nameSpan.textContent = attr;
      const countSpan = el("span", "count");
      countSpan.textContent = `(${values.length})`;
      h4.append(nameSpan, countSpan);
      filterBox.appendChild(h4);
      let hasExcludedItem = false;
      if (values.length > ((_c = opts.menuLimit) != null ? _c : 500)) {
        const p = el("p");
        p.innerHTML = localeStrings.tooMany;
        filterBox.appendChild(p);
      } else {
        if (values.length > 5) {
          const controls = el("p");
          const sorter = getSort(opts.sorters, attr);
          const searchBox = el("input");
          searchBox.className = "pvtSearch";
          searchBox.setAttribute("type", "text");
          searchBox.setAttribute("placeholder", localeStrings.filterResults);
          searchBox.addEventListener("keyup", () => {
            const filter = searchBox.value.toLowerCase().trim();
            const acceptGen = (prefix, accepted) => (v) => {
              const real = filter.substring(prefix.length).trim();
              return real.length === 0 || accepted.includes(Math.sign(sorter(v.toLowerCase(), real)));
            };
            const accept = filter.startsWith(">=") ? acceptGen(">=", [1, 0]) : filter.startsWith("<=") ? acceptGen("<=", [-1, 0]) : filter.startsWith(">") ? acceptGen(">", [1]) : filter.startsWith("<") ? acceptGen("<", [-1]) : filter.startsWith("~") ? (v) => filter.length <= 1 || !!v.toLowerCase().match(filter.slice(1)) : (v) => v.toLowerCase().includes(filter);
            filterBox.querySelectorAll(".pvtCheckContainer p").forEach((p) => {
              var _a2;
              const span = p.querySelector("label span.value");
              p.style.display = span && accept((_a2 = span.textContent) != null ? _a2 : "") ? "" : "none";
            });
          });
          const selectAllBtn = el("button");
          selectAllBtn.type = "button";
          const selectNoneBtn = el("button");
          selectNoneBtn.type = "button";
          selectAllBtn.innerHTML = localeStrings.selectAll;
          selectNoneBtn.innerHTML = localeStrings.selectNone;
          selectAllBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll("input.pvtFilter").forEach((cb) => {
              if (cb.offsetParent !== null && !cb.checked) {
                cb.checked = true;
                cb.classList.toggle("changed");
              }
            });
          });
          selectNoneBtn.addEventListener("click", (e) => {
            e.preventDefault();
            filterBox.querySelectorAll("input.pvtFilter").forEach((cb) => {
              if (cb.offsetParent !== null && cb.checked) {
                cb.checked = false;
                cb.classList.toggle("changed");
              }
            });
          });
          controls.append(searchBox, el("br"), selectAllBtn, selectNoneBtn);
          filterBox.appendChild(controls);
        }
        const checkContainer = el("div", "pvtCheckContainer");
        const sortedVals = [...values].sort(getSort(opts.sorters, attr));
        for (const value of sortedVals) {
          const valueCount = attrValues[attr][value];
          let excluded = false;
          if (((_d = opts.inclusions) != null ? _d : {})[attr]) {
            excluded = !opts.inclusions[attr].includes(value);
          } else if (((_e = opts.exclusions) != null ? _e : {})[attr]) {
            excluded = opts.exclusions[attr].includes(value);
          }
          hasExcludedItem = hasExcludedItem || excluded;
          const cb = el("input");
          cb.type = "checkbox";
          cb.className = "pvtFilter";
          cb.checked = !excluded;
          cb.dataset.filterAttr = attr;
          cb.dataset.filterValue = value;
          cb.addEventListener("change", () => cb.classList.toggle("changed"));
          const valSpan = el("span", "value");
          valSpan.textContent = value;
          const cntSpan = el("span", "count");
          cntSpan.textContent = `(${valueCount})`;
          const label = el("label");
          label.append(cb, valSpan, cntSpan);
          const row = el("p");
          row.appendChild(label);
          checkContainer.appendChild(row);
        }
        filterBox.appendChild(checkContainer);
      }
      const attrElem = el("li", `axis_${i}`);
      const closeFilterBox = () => {
        const all = filterBox.querySelectorAll("[type='checkbox']").length;
        const checked = filterBox.querySelectorAll("[type='checkbox']:checked").length;
        attrElem.classList.toggle("pvtFilteredAttribute", all > checked);
        const search = filterBox.querySelector(".pvtSearch");
        if (search) search.value = "";
        filterBox.querySelectorAll(".pvtCheckContainer p").forEach((p) => p.style.display = "");
        filterBox.style.display = "none";
      };
      const finalBtns = el("p");
      if (values.length <= ((_f = opts.menuLimit) != null ? _f : 500)) {
        const applyBtn = el("button");
        applyBtn.type = "button";
        applyBtn.textContent = localeStrings.apply;
        applyBtn.addEventListener("click", () => {
          const changed = [...filterBox.querySelectorAll(".changed")];
          changed.forEach((n) => n.classList.remove("changed"));
          if (changed.length > 0) refresh();
          closeFilterBox();
        });
        finalBtns.appendChild(applyBtn);
      }
      const cancelBtn = el("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = localeStrings.cancel;
      cancelBtn.addEventListener("click", () => {
        filterBox.querySelectorAll(".changed:checked").forEach((cb) => {
          cb.classList.remove("changed");
          cb.checked = false;
        });
        filterBox.querySelectorAll(".changed:not(:checked)").forEach((cb) => {
          cb.classList.remove("changed");
          cb.checked = true;
        });
        closeFilterBox();
      });
      finalBtns.appendChild(cancelBtn);
      filterBox.appendChild(finalBtns);
      const triangleLink = el("span", "pvtTriangle");
      triangleLink.innerHTML = " &#x25BE;";
      triangleLink.addEventListener("click", (e) => {
        const trigRect = e.currentTarget.getBoundingClientRect();
        const tableRect = uiTable.getBoundingClientRect();
        filterBox.style.left = `${trigRect.left - tableRect.left + 10}px`;
        filterBox.style.top = `${trigRect.top - tableRect.top + 10}px`;
        filterBox.style.display = "";
      });
      const attrSpan = el("span", "pvtAttr");
      attrSpan.textContent = attr;
      attrSpan.dataset.attrName = attr;
      attrSpan.appendChild(triangleLink);
      attrElem.appendChild(attrSpan);
      if (hasExcludedItem) attrElem.classList.add("pvtFilteredAttribute");
      unused.appendChild(attrElem);
      unused.appendChild(filterBox);
    }
    const aggregatorSelect = el("select", "pvtAggregator");
    for (const name of Object.keys((_g = opts.aggregators) != null ? _g : {})) {
      const o = el("option");
      o.value = name;
      o.textContent = name;
      aggregatorSelect.appendChild(o);
    }
    const ordering = {
      key_a_to_z: { rowSymbol: "&varr;", colSymbol: "&harr;", next: "value_a_to_z" },
      value_a_to_z: { rowSymbol: "&darr;", colSymbol: "&rarr;", next: "value_z_to_a" },
      value_z_to_a: { rowSymbol: "&uarr;", colSymbol: "&larr;", next: "key_a_to_z" }
    };
    const rowOrderBtn = el("a", "pvtRowOrder");
    rowOrderBtn.setAttribute("role", "button");
    rowOrderBtn.dataset.order = (_h = opts.rowOrder) != null ? _h : "key_a_to_z";
    rowOrderBtn.innerHTML = ordering[rowOrderBtn.dataset.order].rowSymbol;
    rowOrderBtn.addEventListener("click", () => {
      rowOrderBtn.dataset.order = ordering[rowOrderBtn.dataset.order].next;
      rowOrderBtn.innerHTML = ordering[rowOrderBtn.dataset.order].rowSymbol;
      refresh();
    });
    const colOrderBtn = el("a", "pvtColOrder");
    colOrderBtn.setAttribute("role", "button");
    colOrderBtn.dataset.order = (_i = opts.colOrder) != null ? _i : "key_a_to_z";
    colOrderBtn.innerHTML = ordering[colOrderBtn.dataset.order].colSymbol;
    colOrderBtn.addEventListener("click", () => {
      colOrderBtn.dataset.order = ordering[colOrderBtn.dataset.order].next;
      colOrderBtn.innerHTML = ordering[colOrderBtn.dataset.order].colSymbol;
      refresh();
    });
    const uiTable = el("table", "pvtUi");
    uiTable.setAttribute("cellpadding", "5");
    const valsCell = el("td", "pvtVals pvtUiCell");
    valsCell.append(aggregatorSelect, rowOrderBtn, colOrderBtn, el("br"));
    const colsCell = el("td", "pvtAxisContainer pvtHorizList pvtCols pvtUiCell");
    const tr1 = el("tr");
    tr1.append(valsCell, colsCell);
    const rowsCell = el("td", "pvtAxisContainer pvtRows pvtUiCell");
    rowsCell.setAttribute("valign", "top");
    const pivotTableCell = el("td", "pvtRendererArea");
    pivotTableCell.setAttribute("valign", "top");
    const tr2 = el("tr");
    tr2.append(rowsCell, pivotTableCell);
    if (unusedVertical) {
      tr1.insertBefore(rendererControl, tr1.firstChild);
      tr2.insertBefore(unused, tr2.firstChild);
      uiTable.append(tr1, tr2);
    } else {
      const topRow = el("tr");
      topRow.append(rendererControl, unused);
      uiTable.append(topRow, tr1, tr2);
    }
    container.innerHTML = "";
    container.appendChild(uiTable);
    for (const colAttr of (_j = opts.cols) != null ? _j : []) {
      const idx = shownInDragDrop.indexOf(colAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) colsCell.appendChild(pill);
    }
    for (const rowAttr of (_k = opts.rows) != null ? _k : []) {
      const idx = shownInDragDrop.indexOf(rowAttr);
      const pill = idx !== -1 ? container.querySelector(`.axis_${idx}`) : null;
      if (pill) rowsCell.appendChild(pill);
    }
    if (opts.aggregatorName) aggregatorSelect.value = opts.aggregatorName;
    if (opts.rendererName) rendererSelect.value = opts.rendererName;
    if (!opts.showUI) {
      container.querySelectorAll(".pvtUiCell").forEach((c) => c.style.display = "none");
    }
    let initialRender = true;
    const refreshDelayed = () => {
      var _a2, _b2, _c2, _d2, _e2, _f2;
      const currentRows = [];
      const currentCols = [];
      container.querySelectorAll(".pvtRows li span.pvtAttr").forEach((s) => currentRows.push(s.dataset.attrName));
      container.querySelectorAll(".pvtCols li span.pvtAttr").forEach((s) => currentCols.push(s.dataset.attrName));
      let numInputsNeeded = (_d2 = (_c2 = (_b2 = (_a2 = opts.aggregators) == null ? void 0 : _a2[aggregatorSelect.value]) == null ? void 0 : _b2.call(_a2, [])) == null ? void 0 : _c2().numInputs) != null ? _d2 : 0;
      const vals = [];
      for (const dd of [...container.querySelectorAll(".pvtVals select.pvtAttrDropdown")]) {
        if (numInputsNeeded === 0) {
          dd.remove();
        } else {
          numInputsNeeded--;
          if (dd.value !== "") vals.push(dd.value);
        }
      }
      for (let t = 0; t < numInputsNeeded; t++) {
        const dd = el("select", "pvtAttrDropdown");
        const emptyOpt = el("option");
        emptyOpt.value = "";
        dd.appendChild(emptyOpt);
        for (const a of shownInAggregators) {
          const o = el("option");
          o.value = a;
          o.textContent = a;
          dd.appendChild(o);
        }
        dd.addEventListener("change", refresh);
        valsCell.appendChild(dd);
      }
      if (initialRender) {
        const initVals = (_e2 = opts.vals) != null ? _e2 : [];
        let vi = 0;
        container.querySelectorAll(".pvtVals select.pvtAttrDropdown").forEach((dd) => {
          var _a3;
          dd.value = (_a3 = initVals[vi++]) != null ? _a3 : "";
        });
        initialRender = false;
      }
      const currentVals = [];
      container.querySelectorAll(".pvtVals select.pvtAttrDropdown").forEach((dd) => {
        if (dd.value !== "") currentVals.push(dd.value);
      });
      const exclusions = {};
      container.querySelectorAll("input.pvtFilter:not(:checked)").forEach((cb) => {
        var _a3;
        const attr = cb.dataset.filterAttr;
        const val = cb.dataset.filterValue;
        (exclusions[attr] = (_a3 = exclusions[attr]) != null ? _a3 : []).push(val);
      });
      const inclusions = {};
      container.querySelectorAll("input.pvtFilter:checked").forEach((cb) => {
        var _a3;
        const attr = cb.dataset.filterAttr;
        const val = cb.dataset.filterValue;
        if (exclusions[attr] != null) (inclusions[attr] = (_a3 = inclusions[attr]) != null ? _a3 : []).push(val);
      });
      const subopts = {
        derivedAttributes: opts.derivedAttributes,
        localeStrings: opts.localeStrings,
        rendererOptions: opts.rendererOptions,
        sorters: opts.sorters,
        cols: currentCols,
        rows: currentRows,
        vals: currentVals,
        dataClass: opts.dataClass,
        aggregatorName: aggregatorSelect.value,
        aggregator: opts.aggregators[aggregatorSelect.value](currentVals),
        renderer: opts.renderers[rendererSelect.value],
        rowOrder: rowOrderBtn.dataset.order,
        colOrder: colOrderBtn.dataset.order,
        filter: (record) => {
          if (!opts.filter(record)) return false;
          for (const k of Object.keys(exclusions)) {
            const v = record[k] != null ? String(record[k]) : "null";
            if (exclusions[k].includes(v)) return false;
          }
          return true;
        }
      };
      createPivot(pivotTableCell, materializedInput, subopts);
      const savedState = Object.assign({}, opts, {
        cols: currentCols,
        rows: currentRows,
        vals: currentVals,
        colOrder: colOrderBtn.dataset.order,
        rowOrder: rowOrderBtn.dataset.order,
        exclusions,
        inclusions,
        inclusionsInfo: inclusions,
        aggregatorName: aggregatorSelect.value,
        rendererName: rendererSelect.value
      });
      uiState.set(container, savedState);
      if (opts.autoSortUnusedAttrs) {
        const uc = container.querySelector("td.pvtUnused.pvtAxisContainer");
        if (uc) {
          [...uc.querySelectorAll("li")].sort((a, b) => {
            var _a3, _b3;
            return naturalSort((_a3 = a.textContent) != null ? _a3 : "", (_b3 = b.textContent) != null ? _b3 : "");
          }).forEach((li) => uc.appendChild(li));
        }
      }
      pivotTableCell.style.opacity = "1";
      (_f2 = opts.onRefresh) == null ? void 0 : _f2.call(opts, savedState);
    };
    const refresh = () => {
      pivotTableCell.style.opacity = "0.5";
      setTimeout(refreshDelayed, 10);
    };
    aggregatorSelect.addEventListener("change", refresh);
    rendererSelect.addEventListener("change", refresh);
    const sortables = [];
    container.querySelectorAll(".pvtAxisContainer").forEach((axisEl) => {
      sortables.push(
        Sortable.create(axisEl, {
          group: "pvtAttrs",
          animation: 150,
          filter: ".pvtFilterBox",
          // don't accidentally drag the popup
          ghostClass: "pvtPlaceholder",
          // reuse pivot.css dashed-outline style
          onEnd: refresh
        })
      );
    });
    refresh();
    return {
      destroy() {
        sortables.forEach((s) => s.destroy());
        container.innerHTML = "";
        uiState.delete(container);
      }
    };
  } catch (e) {
    console.error(e);
    container.textContent = localeStrings.uiRenderError;
    return { destroy() {
      container.innerHTML = "";
    } };
  }
}
var pivotUtilities = {
  aggregatorTemplates,
  aggregators,
  renderers,
  vanillaRenderers,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  getSort,
  heatmap,
  barchart,
  PivotData,
  PivotStream
};

export {
  createPivot,
  heatmap,
  barchart,
  vanillaRenderers,
  createPivotUI,
  pivotUtilities
};
//# sourceMappingURL=chunk-6SPX3EUA.mjs.map