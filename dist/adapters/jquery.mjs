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
} from "../chunk-SEBP56Q2.mjs";

// src/adapters/jquery.ts
var indexOf = [].indexOf;
var hasProp = {}.hasOwnProperty;
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
var renderers2 = Object.assign({}, renderers, {
  "Table Barchart": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).barchart();
  },
  "Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("heatmap", opts);
  },
  "Row Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("rowheatmap", opts);
  },
  "Col Heatmap": function(data, opts) {
    return $(pivotTableRenderer(data, opts)).heatmap("colheatmap", opts);
  }
});
$.pivotUtilities = {
  aggregatorTemplates,
  aggregators,
  renderers: renderers2,
  derivers,
  locales,
  naturalSort,
  numberFormat,
  sortAs,
  PivotData,
  PivotStream
};
$.fn.pivot = function(input, inputOpts, locale) {
  var defaults, e, localeDefaults, localeStrings, opts, pivotData, result, x;
  if (locale == null) {
    locale = "en";
  }
  if (locales[locale] == null) {
    locale = "en";
  }
  defaults = {
    cols: [],
    rows: [],
    vals: [],
    rowOrder: "key_a_to_z",
    colOrder: "key_a_to_z",
    dataClass: PivotData,
    filter: function() {
      return true;
    },
    aggregator: aggregatorTemplates.count()(),
    aggregatorName: "Count",
    sorters: {},
    derivedAttributes: {},
    renderer: pivotTableRenderer
  };
  localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = {
    rendererOptions: {
      localeStrings
    },
    localeStrings
  };
  opts = deepMerge(localeDefaults, Object.assign({}, defaults, inputOpts));
  result = null;
  try {
    pivotData = new opts.dataClass(input, opts);
    try {
      result = opts.renderer(pivotData, opts.rendererOptions);
    } catch (error) {
      e = error;
      if (typeof console !== "undefined" && console !== null) {
        console.error(e.stack);
      }
      result = $("<span>").html(opts.localeStrings.renderError);
    }
  } catch (error) {
    e = error;
    if (typeof console !== "undefined" && console !== null) {
      console.error(e.stack);
    }
    result = $("<span>").html(opts.localeStrings.computeError);
  }
  x = this[0];
  while (x.hasChildNodes()) {
    x.removeChild(x.lastChild);
  }
  return this.append(result);
};
$.fn.pivotUI = function(input, inputOpts, overwrite, locale) {
  var a, aggregator, attr, attrLength, attrValues, c, colOrderArrow, defaults, e, existingOpts, fn1, i, initialRender, l, len1, len2, len3, localeDefaults, localeStrings, materializedInput, n, o, opts, ordering, pivotTable, recordsProcessed, ref, ref1, ref2, ref3, refresh, refreshDelayed, renderer, rendererControl, rowOrderArrow, shownAttributes, shownInAggregators, shownInDragDrop, tr1, tr2, uiTable, unused, unusedAttrsVerticalAutoCutoff, unusedAttrsVerticalAutoOverride, x;
  if (overwrite == null) {
    overwrite = false;
  }
  if (locale == null) {
    locale = "en";
  }
  if (locales[locale] == null) {
    locale = "en";
  }
  defaults = {
    derivedAttributes: {},
    aggregators: locales[locale].aggregators,
    renderers: renderers2,
    // use jQuery renderers, not just core "Table"
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
    filter: function() {
      return true;
    },
    sorters: {}
  };
  localeStrings = Object.assign({}, locales.en.localeStrings, locales[locale].localeStrings);
  localeDefaults = {
    rendererOptions: {
      localeStrings
    },
    localeStrings
  };
  existingOpts = this.data("pivotUIOptions");
  if (existingOpts == null || overwrite) {
    opts = deepMerge(localeDefaults, Object.assign({}, defaults, inputOpts));
  } else {
    opts = existingOpts;
  }
  try {
    attrValues = {};
    materializedInput = [];
    recordsProcessed = 0;
    PivotData.forEachRecord(input, opts.derivedAttributes, function(record) {
      var attr2, base, ref4, value;
      if (!opts.filter(record)) {
        return;
      }
      materializedInput.push(record);
      for (attr2 in record) {
        if (!hasProp.call(record, attr2)) continue;
        if (attrValues[attr2] == null) {
          attrValues[attr2] = {};
          if (recordsProcessed > 0) {
            attrValues[attr2]["null"] = recordsProcessed;
          }
        }
      }
      for (attr2 in attrValues) {
        value = (ref4 = record[attr2]) != null ? ref4 : "null";
        if ((base = attrValues[attr2])[value] == null) {
          base[value] = 0;
        }
        attrValues[attr2][value]++;
      }
      return recordsProcessed++;
    });
    uiTable = $("<table>", {
      "class": "pvtUi"
    }).attr("cellpadding", 5);
    rendererControl = $("<td>").addClass("pvtUiCell");
    renderer = $("<select>").addClass("pvtRenderer").appendTo(rendererControl).bind("change", function() {
      return refresh();
    });
    ref = opts.renderers;
    for (x in ref) {
      if (!hasProp.call(ref, x)) continue;
      $("<option>").val(x).html(x).appendTo(renderer);
    }
    unused = $("<td>").addClass("pvtAxisContainer pvtUnused pvtUiCell");
    shownAttributes = (function() {
      var results;
      results = [];
      for (a in attrValues) {
        if (indexOf.call(opts.hiddenAttributes, a) < 0) {
          results.push(a);
        }
      }
      return results;
    })();
    shownInAggregators = (function() {
      var l2, len12, results;
      results = [];
      for (l2 = 0, len12 = shownAttributes.length; l2 < len12; l2++) {
        c = shownAttributes[l2];
        if (indexOf.call(opts.hiddenFromAggregators, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    shownInDragDrop = (function() {
      var l2, len12, results;
      results = [];
      for (l2 = 0, len12 = shownAttributes.length; l2 < len12; l2++) {
        c = shownAttributes[l2];
        if (indexOf.call(opts.hiddenFromDragDrop, c) < 0) {
          results.push(c);
        }
      }
      return results;
    })();
    unusedAttrsVerticalAutoOverride = false;
    if (opts.unusedAttrsVertical === "auto") {
      unusedAttrsVerticalAutoCutoff = 120;
    } else {
      unusedAttrsVerticalAutoCutoff = parseInt(opts.unusedAttrsVertical);
    }
    if (!isNaN(unusedAttrsVerticalAutoCutoff)) {
      attrLength = 0;
      for (l = 0, len1 = shownInDragDrop.length; l < len1; l++) {
        a = shownInDragDrop[l];
        attrLength += a.length;
      }
      unusedAttrsVerticalAutoOverride = attrLength > unusedAttrsVerticalAutoCutoff;
    }
    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      unused.addClass("pvtVertList");
    } else {
      unused.addClass("pvtHorizList");
    }
    fn1 = function(attr2) {
      var attrElem, checkContainer, closeFilterBox, controls, filterItem, filterItemExcluded, finalButtons, hasExcludedItem, len22, n2, placeholder, ref12, sorter, triangleLink, v, value, valueCount, valueList, values;
      values = (function() {
        var results;
        results = [];
        for (v in attrValues[attr2]) {
          results.push(v);
        }
        return results;
      })();
      hasExcludedItem = false;
      valueList = $("<div>").addClass("pvtFilterBox").hide();
      valueList.append($("<h4>").append($("<span>").text(attr2), $("<span>").addClass("count").text("(" + values.length + ")")));
      if (values.length > opts.menuLimit) {
        valueList.append($("<p>").html(opts.localeStrings.tooMany));
      } else {
        if (values.length > 5) {
          controls = $("<p>").appendTo(valueList);
          sorter = getSort(opts.sorters, attr2);
          placeholder = opts.localeStrings.filterResults;
          $("<input>", {
            type: "text"
          }).appendTo(controls).attr({
            placeholder,
            "class": "pvtSearch"
          }).bind("keyup", function() {
            var accept, accept_gen, filter;
            filter = $(this).val().toLowerCase().trim();
            accept_gen = function(prefix, accepted) {
              return function(v2) {
                var real_filter, ref13;
                real_filter = filter.substring(prefix.length).trim();
                if (real_filter.length === 0) {
                  return true;
                }
                return ref13 = Math.sign(sorter(v2.toLowerCase(), real_filter)), indexOf.call(accepted, ref13) >= 0;
              };
            };
            accept = filter.indexOf(">=") === 0 ? accept_gen(">=", [1, 0]) : filter.indexOf("<=") === 0 ? accept_gen("<=", [-1, 0]) : filter.indexOf(">") === 0 ? accept_gen(">", [1]) : filter.indexOf("<") === 0 ? accept_gen("<", [-1]) : filter.indexOf("~") === 0 ? function(v2) {
              if (filter.substring(1).trim().length === 0) {
                return true;
              }
              return v2.toLowerCase().match(filter.substring(1));
            } : function(v2) {
              return v2.toLowerCase().indexOf(filter) !== -1;
            };
            return valueList.find(".pvtCheckContainer p label span.value").each(function() {
              if (accept($(this).text())) {
                return $(this).parent().parent().show();
              } else {
                return $(this).parent().parent().hide();
              }
            });
          });
          controls.append($("<br>"));
          $("<button>", {
            type: "button"
          }).appendTo(controls).html(opts.localeStrings.selectAll).bind("click", function() {
            valueList.find("input:visible:not(:checked)").prop("checked", true).toggleClass("changed");
            return false;
          });
          $("<button>", {
            type: "button"
          }).appendTo(controls).html(opts.localeStrings.selectNone).bind("click", function() {
            valueList.find("input:visible:checked").prop("checked", false).toggleClass("changed");
            return false;
          });
        }
        checkContainer = $("<div>").addClass("pvtCheckContainer").appendTo(valueList);
        ref12 = values.sort(getSort(opts.sorters, attr2));
        for (n2 = 0, len22 = ref12.length; n2 < len22; n2++) {
          value = ref12[n2];
          valueCount = attrValues[attr2][value];
          filterItem = $("<label>");
          filterItemExcluded = false;
          if (opts.inclusions[attr2]) {
            filterItemExcluded = indexOf.call(opts.inclusions[attr2], value) < 0;
          } else if (opts.exclusions[attr2]) {
            filterItemExcluded = indexOf.call(opts.exclusions[attr2], value) >= 0;
          }
          hasExcludedItem || (hasExcludedItem = filterItemExcluded);
          $("<input>").attr("type", "checkbox").addClass("pvtFilter").attr("checked", !filterItemExcluded).data("filter", [attr2, value]).appendTo(filterItem).bind("change", function() {
            return $(this).toggleClass("changed");
          });
          filterItem.append($("<span>").addClass("value").text(value));
          filterItem.append($("<span>").addClass("count").text("(" + valueCount + ")"));
          checkContainer.append($("<p>").append(filterItem));
        }
      }
      closeFilterBox = function() {
        if (valueList.find("[type='checkbox']").length > valueList.find("[type='checkbox']:checked").length) {
          attrElem.addClass("pvtFilteredAttribute");
        } else {
          attrElem.removeClass("pvtFilteredAttribute");
        }
        valueList.find(".pvtSearch").val("");
        valueList.find(".pvtCheckContainer p").show();
        return valueList.hide();
      };
      finalButtons = $("<p>").appendTo(valueList);
      if (values.length <= opts.menuLimit) {
        $("<button>", {
          type: "button"
        }).text(opts.localeStrings.apply).appendTo(finalButtons).bind("click", function() {
          if (valueList.find(".changed").removeClass("changed").length) {
            refresh();
          }
          return closeFilterBox();
        });
      }
      $("<button>", {
        type: "button"
      }).text(opts.localeStrings.cancel).appendTo(finalButtons).bind("click", function() {
        valueList.find(".changed:checked").removeClass("changed").prop("checked", false);
        valueList.find(".changed:not(:checked)").removeClass("changed").prop("checked", true);
        return closeFilterBox();
      });
      triangleLink = $("<span>").addClass("pvtTriangle").html(" &#x25BE;").bind("click", function(e2) {
        var left, ref22, top;
        ref22 = $(e2.currentTarget).position(), left = ref22.left, top = ref22.top;
        return valueList.css({
          left: left + 10,
          top: top + 10
        }).show();
      });
      attrElem = $("<li>").addClass("axis_" + i).append($("<span>").addClass("pvtAttr").text(attr2).data("attrName", attr2).append(triangleLink));
      if (hasExcludedItem) {
        attrElem.addClass("pvtFilteredAttribute");
      }
      return unused.append(attrElem).append(valueList);
    };
    for (i in shownInDragDrop) {
      if (!hasProp.call(shownInDragDrop, i)) continue;
      attr = shownInDragDrop[i];
      fn1(attr);
    }
    tr1 = $("<tr>").appendTo(uiTable);
    aggregator = $("<select>").addClass("pvtAggregator").bind("change", function() {
      return refresh();
    });
    ref1 = opts.aggregators;
    for (x in ref1) {
      if (!hasProp.call(ref1, x)) continue;
      aggregator.append($("<option>").val(x).html(x));
    }
    ordering = {
      key_a_to_z: {
        rowSymbol: "&varr;",
        colSymbol: "&harr;",
        next: "value_a_to_z"
      },
      value_a_to_z: {
        rowSymbol: "&darr;",
        colSymbol: "&rarr;",
        next: "value_z_to_a"
      },
      value_z_to_a: {
        rowSymbol: "&uarr;",
        colSymbol: "&larr;",
        next: "key_a_to_z"
      }
    };
    rowOrderArrow = $("<a>", {
      role: "button"
    }).addClass("pvtRowOrder").data("order", opts.rowOrder).html(ordering[opts.rowOrder].rowSymbol).bind("click", function() {
      $(this).data("order", ordering[$(this).data("order")].next);
      $(this).html(ordering[$(this).data("order")].rowSymbol);
      return refresh();
    });
    colOrderArrow = $("<a>", {
      role: "button"
    }).addClass("pvtColOrder").data("order", opts.colOrder).html(ordering[opts.colOrder].colSymbol).bind("click", function() {
      $(this).data("order", ordering[$(this).data("order")].next);
      $(this).html(ordering[$(this).data("order")].colSymbol);
      return refresh();
    });
    $("<td>").addClass("pvtVals pvtUiCell").appendTo(tr1).append(aggregator).append(rowOrderArrow).append(colOrderArrow).append($("<br>"));
    $("<td>").addClass("pvtAxisContainer pvtHorizList pvtCols pvtUiCell").appendTo(tr1);
    tr2 = $("<tr>").appendTo(uiTable);
    tr2.append($("<td>").addClass("pvtAxisContainer pvtRows pvtUiCell").attr("valign", "top"));
    pivotTable = $("<td>").attr("valign", "top").addClass("pvtRendererArea").appendTo(tr2);
    if (opts.unusedAttrsVertical === true || unusedAttrsVerticalAutoOverride) {
      uiTable.find("tr:nth-child(1)").prepend(rendererControl);
      uiTable.find("tr:nth-child(2)").prepend(unused);
    } else {
      uiTable.prepend($("<tr>").append(rendererControl).append(unused));
    }
    this.html(uiTable);
    ref2 = opts.cols;
    for (n = 0, len2 = ref2.length; n < len2; n++) {
      x = ref2[n];
      this.find(".pvtCols").append(this.find(".axis_" + $.inArray(x, shownInDragDrop)));
    }
    ref3 = opts.rows;
    for (o = 0, len3 = ref3.length; o < len3; o++) {
      x = ref3[o];
      this.find(".pvtRows").append(this.find(".axis_" + $.inArray(x, shownInDragDrop)));
    }
    if (opts.aggregatorName != null) {
      this.find(".pvtAggregator").val(opts.aggregatorName);
    }
    if (opts.rendererName != null) {
      this.find(".pvtRenderer").val(opts.rendererName);
    }
    if (!opts.showUI) {
      this.find(".pvtUiCell").hide();
    }
    initialRender = true;
    refreshDelayed = /* @__PURE__ */ (function(_this) {
      return function() {
        var exclusions, inclusions, len4, newDropdown, numInputsToProcess, pivotUIOptions, pvtVals, ref4, ref5, subopts, t, u, unusedAttrsContainer, vals;
        subopts = {
          derivedAttributes: opts.derivedAttributes,
          localeStrings: opts.localeStrings,
          rendererOptions: opts.rendererOptions,
          sorters: opts.sorters,
          cols: [],
          rows: [],
          dataClass: opts.dataClass
        };
        numInputsToProcess = (ref4 = opts.aggregators[aggregator.val()]([])().numInputs) != null ? ref4 : 0;
        vals = [];
        _this.find(".pvtRows li span.pvtAttr").each(function() {
          return subopts.rows.push($(this).data("attrName"));
        });
        _this.find(".pvtCols li span.pvtAttr").each(function() {
          return subopts.cols.push($(this).data("attrName"));
        });
        _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
          if (numInputsToProcess === 0) {
            return $(this).remove();
          } else {
            numInputsToProcess--;
            if ($(this).val() !== "") {
              return vals.push($(this).val());
            }
          }
        });
        if (numInputsToProcess !== 0) {
          pvtVals = _this.find(".pvtVals");
          for (x = t = 0, ref5 = numInputsToProcess; 0 <= ref5 ? t < ref5 : t > ref5; x = 0 <= ref5 ? ++t : --t) {
            newDropdown = $("<select>").addClass("pvtAttrDropdown").append($("<option>")).bind("change", function() {
              return refresh();
            });
            for (u = 0, len4 = shownInAggregators.length; u < len4; u++) {
              attr = shownInAggregators[u];
              newDropdown.append($("<option>").val(attr).text(attr));
            }
            pvtVals.append(newDropdown);
          }
        }
        if (initialRender) {
          vals = opts.vals;
          i = 0;
          _this.find(".pvtVals select.pvtAttrDropdown").each(function() {
            $(this).val(vals[i]);
            return i++;
          });
          initialRender = false;
        }
        subopts.aggregatorName = aggregator.val();
        subopts.vals = vals;
        subopts.aggregator = opts.aggregators[aggregator.val()](vals);
        subopts.renderer = opts.renderers[renderer.val()];
        subopts.rowOrder = rowOrderArrow.data("order");
        subopts.colOrder = colOrderArrow.data("order");
        exclusions = {};
        _this.find("input.pvtFilter").not(":checked").each(function() {
          var filter;
          filter = $(this).data("filter");
          if (exclusions[filter[0]] != null) {
            return exclusions[filter[0]].push(filter[1]);
          } else {
            return exclusions[filter[0]] = [filter[1]];
          }
        });
        inclusions = {};
        _this.find("input.pvtFilter:checked").each(function() {
          var filter;
          filter = $(this).data("filter");
          if (exclusions[filter[0]] != null) {
            if (inclusions[filter[0]] != null) {
              return inclusions[filter[0]].push(filter[1]);
            } else {
              return inclusions[filter[0]] = [filter[1]];
            }
          }
        });
        subopts.filter = function(record) {
          var excludedItems, k, ref6, ref7;
          if (!opts.filter(record)) {
            return false;
          }
          for (k in exclusions) {
            excludedItems = exclusions[k];
            if (ref6 = "" + ((ref7 = record[k]) != null ? ref7 : "null"), indexOf.call(excludedItems, ref6) >= 0) {
              return false;
            }
          }
          return true;
        };
        pivotTable.pivot(materializedInput, subopts);
        pivotUIOptions = Object.assign({}, opts, {
          cols: subopts.cols,
          rows: subopts.rows,
          colOrder: subopts.colOrder,
          rowOrder: subopts.rowOrder,
          vals,
          exclusions,
          inclusions,
          inclusionsInfo: inclusions,
          aggregatorName: aggregator.val(),
          rendererName: renderer.val()
        });
        _this.data("pivotUIOptions", pivotUIOptions);
        if (opts.autoSortUnusedAttrs) {
          unusedAttrsContainer = _this.find("td.pvtUnused.pvtAxisContainer");
          $(unusedAttrsContainer).children("li").sort(function(a2, b) {
            return naturalSort($(a2).text(), $(b).text());
          }).appendTo(unusedAttrsContainer);
        }
        pivotTable.css("opacity", 1);
        if (opts.onRefresh != null) {
          return opts.onRefresh(pivotUIOptions);
        }
      };
    })(this);
    refresh = /* @__PURE__ */ (function(_this) {
      return function() {
        pivotTable.css("opacity", 0.5);
        return setTimeout(refreshDelayed, 10);
      };
    })(this);
    refresh();
    this.find(".pvtAxisContainer").sortable({
      update: function(e2, ui) {
        if (ui.sender == null) {
          return refresh();
        }
      },
      connectWith: this.find(".pvtAxisContainer"),
      items: "li",
      placeholder: "pvtPlaceholder"
    });
  } catch (error) {
    e = error;
    if (typeof console !== "undefined" && console !== null) {
      console.error(e.stack);
    }
    this.html(opts.localeStrings.uiRenderError);
  }
  return this;
};
$.fn.heatmap = function(scope, opts) {
  var colorScaleGenerator, heatmapper, i, j, l, n, numCols, numRows, ref, ref1, ref2;
  if (scope == null) {
    scope = "heatmap";
  }
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  colorScaleGenerator = opts != null ? (ref = opts.heatmap) != null ? ref.colorScaleGenerator : void 0 : void 0;
  if (colorScaleGenerator == null) {
    colorScaleGenerator = function(values) {
      var max, min;
      min = Math.min.apply(Math, values);
      max = Math.max.apply(Math, values);
      return function(x) {
        var nonRed;
        nonRed = 255 - Math.round(255 * (x - min) / (max - min));
        return "rgb(255," + nonRed + "," + nonRed + ")";
      };
    };
  }
  heatmapper = /* @__PURE__ */ (function(_this) {
    return function(scope2) {
      var colorScale, forEachCell, values;
      forEachCell = function(f) {
        return _this.find(scope2).each(function() {
          var x;
          x = $(this).data("value");
          if (x != null && isFinite(x)) {
            return f(x, $(this));
          }
        });
      };
      values = [];
      forEachCell(function(x) {
        return values.push(x);
      });
      colorScale = colorScaleGenerator(values);
      return forEachCell(function(x, elem) {
        return elem.css("background-color", colorScale(x));
      });
    };
  })(this);
  switch (scope) {
    case "heatmap":
      heatmapper(".pvtVal");
      break;
    case "rowheatmap":
      for (i = l = 0, ref1 = numRows; 0 <= ref1 ? l < ref1 : l > ref1; i = 0 <= ref1 ? ++l : --l) {
        heatmapper(".pvtVal.row" + i);
      }
      break;
    case "colheatmap":
      for (j = n = 0, ref2 = numCols; 0 <= ref2 ? n < ref2 : n > ref2; j = 0 <= ref2 ? ++n : --n) {
        heatmapper(".pvtVal.col" + j);
      }
  }
  heatmapper(".pvtTotal.rowTotal");
  heatmapper(".pvtTotal.colTotal");
  return this;
};
$.fn.barchart = function(opts) {
  var barcharter, i, l, numCols, numRows, ref;
  numRows = this.data("numrows");
  numCols = this.data("numcols");
  barcharter = /* @__PURE__ */ (function(_this) {
    return function(scope) {
      var forEachCell, max, min, range, scaler, values;
      forEachCell = function(f) {
        return _this.find(scope).each(function() {
          var x;
          x = $(this).data("value");
          if (x != null && isFinite(x)) {
            return f(x, $(this));
          }
        });
      };
      values = [];
      forEachCell(function(x) {
        return values.push(x);
      });
      max = Math.max.apply(Math, values);
      if (max < 0) {
        max = 0;
      }
      range = max;
      min = Math.min.apply(Math, values);
      if (min < 0) {
        range = max - min;
      }
      scaler = function(x) {
        return 100 * x / (1.4 * range);
      };
      return forEachCell(function(x, elem) {
        var bBase, bgColor, text, wrapper;
        text = elem.text();
        wrapper = $("<div>").css({
          "position": "relative",
          "height": "55px"
        });
        bgColor = "gray";
        bBase = 0;
        if (min < 0) {
          bBase = scaler(-min);
        }
        if (x < 0) {
          bBase += scaler(x);
          bgColor = "darkred";
          x = -x;
        }
        wrapper.append($("<div>").css({
          "position": "absolute",
          "bottom": bBase + "%",
          "left": 0,
          "right": 0,
          "height": scaler(x) + "%",
          "background-color": bgColor
        }));
        wrapper.append($("<div>").text(text).css({
          "position": "relative",
          "padding-left": "5px",
          "padding-right": "5px"
        }));
        return elem.css({
          "padding": 0,
          "padding-top": "5px",
          "text-align": "center"
        }).html(wrapper);
      });
    };
  })(this);
  for (i = l = 0, ref = numRows; 0 <= ref ? l < ref : l > ref; i = 0 <= ref ? ++l : --l) {
    barcharter(".pvtVal.row" + i);
  }
  barcharter(".pvtTotal.colTotal");
  return this;
};
//# sourceMappingURL=jquery.mjs.map