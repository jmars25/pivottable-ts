/*
 * PivotTable locale pack — all 14 built-in translations.
 *
 * Side-effectful import: registers locales on the shared `locales` map so
 * that createPivotUI picks them up via the `locale` option.
 *
 * Usage:
 *   import "pivottable-ts/locales";                 // register all locales
 *   createPivotUI(el, data, { locale: "de" });      // use German
 *
 * Or import the map directly:
 *   import { locales } from "pivottable-ts/locales";
 *   createPivotUI(el, data, { locale: "fr", renderers: locales.fr.renderers });
 *
 * Included locales: cs da de es fr it ja nl pl pt ru sq tr zh
 */

import { locales, numberFormat, aggregatorTemplates, renderers } from "../pivot";
import { vanillaRenderers } from "../adapters/vanilla";

const tpl = aggregatorTemplates;

// All renderer functions merged (English keys → functions).
// Used below to map *translated* renderer names to the same functions.
const allR = { ...renderers, ...vanillaRenderers };

// ─── cs  Czech ───────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["cs"] = {
    localeStrings: {
      renderError:   "Došlo k chybě při vykreslování výsledků PivotTable.",
      computeError:  "Došlo k chybě při výpočtu výsledků PivotTable.",
      uiRenderError: "Došlo k chybě při vykreslování PivotTable UI.",
      selectAll:     "Vybrat vše",
      selectNone:    "Zrušit výběr",
      tooMany:       "(příliš mnoho položek)",
      filterResults: "Hodnoty pro filtr",
      apply:         "Použít",
      cancel:        "Zrušit",
      totals:        "Celkem",
      vs:            "ku",
      by:            "z",
    },
    aggregators: {
      "Počet":                           tpl.count(fmtInt),
      "Počet unikátních hodnot":         tpl.countUnique(fmtInt),
      "Výčet unikátních hodnot":         tpl.listUnique(", "),
      "Součet":                          tpl.sum(fmt),
      "Celočíselný součet":              tpl.sum(fmtInt),
      "Průměr":                          tpl.average(fmt),
      "Medián":                          tpl.median(fmt),
      "Rozptyl":                         tpl["var"](1, fmt),
      "Směrodatná odchylka":             tpl.stdev(1, fmt),
      "Minimum":                         tpl.min(fmt),
      "Maximum":                         tpl.max(fmt),
      "První":                           tpl.first(fmt),
      "Poslední":                        tpl.last(fmt),
      "Součet přes součet":              tpl.sumOverSum(fmt),
      "80% horní hranice":               tpl.sumOverSumBound80(true,  fmt),
      "80% spodní hranice":              tpl.sumOverSumBound80(false, fmt),
      "Součet jako poměr z celku":       tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Součet jako poměr z řádků":       tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Součet jako poměr ze sloupců":    tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Počet jako poměr z celku":        tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Počet jako poměr z řádků":        tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Počet jako poměr ze sloupců":     tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabulka":                         allR["Table"],
      "Tabulka se sloupcovým grafem":    allR["Table Barchart"],
      "Teplotní mapa":                   allR["Heatmap"],
      "Teplotní mapa z řádků":           allR["Row Heatmap"],
      "Teplotní mapa ze sloupců":        allR["Col Heatmap"],
    },
  };
}

// ─── da  Danish ──────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["da"] = {
    localeStrings: {
      renderError:   "Der opstod en fejl, mens du trak i feltet",
      computeError:  "Der opstod en fejl ved beregningen af feltet",
      uiRenderError: "Der opstod en fejl, mens den grafiske brugerflade blev beregnet",
      selectAll:     "Vælg alle",
      selectNone:    "Vælg ingen",
      tooMany:       "(for mange værdier til at vise)",
      filterResults: "Filter værdier",
      totals:        "I alt",
      vs:            "vs",
      by:            "af",
    },
    aggregators: {
      "Antal":                            tpl.count(fmtInt),
      "Antal Unikke værdier":             tpl.countUnique(fmtInt),
      "Liste unikke værdier":             tpl.listUnique(", "),
      "Sum":                              tpl.sum(fmt),
      "Sum i heltal":                     tpl.sum(fmtInt),
      "Gennemsnit":                       tpl.average(fmt),
      "Minimum":                          tpl.min(fmt),
      "Maximum":                          tpl.max(fmt),
      "Sum iforhold til sum":             tpl.sumOverSum(fmt),
      "Sum iforhold til sum, øverst 80%": tpl.sumOverSumBound80(true,  fmt),
      "Sum iforhold til sum, lavest 80%": tpl.sumOverSumBound80(false, fmt),
      "Andel af i alt sum":               tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Andel af række sum":               tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Andel af kolonner sum":            tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Andel af i alt antal":             tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Andel af række antal":             tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Andel af kolonner antal":          tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabel":                allR["Table"],
      "Tabel med søjler":     allR["Table Barchart"],
      "Heatmap":              allR["Heatmap"],
      "Heatmap per række":    allR["Row Heatmap"],
      "Heatmap per kolonne":  allR["Col Heatmap"],
    },
  };
}

// ─── de  German ──────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["de"] = {
    localeStrings: {
      renderError:   "Bei der Darstellung der Pivot-Tabelle ist ein Fehler aufgetreten.",
      computeError:  "Bei der Berechnung der Pivot-Tabelle ist ein Fehler aufgetreten.",
      uiRenderError: "Bei der Darstellung der Oberfläche der Pivot-Tabelle ist ein Fehler aufgetreten.",
      selectAll:     "Alles auswählen",
      selectNone:    "Nichts auswählen",
      tooMany:       "(zu viele für Liste)",
      filterResults: "Ergebnisse filtern",
      totals:        "Gesamt",
      vs:            "gegen",
      by:            "pro",
    },
    aggregators: {
      "Anzahl":                        tpl.count(fmtInt),
      "Anzahl eindeutiger Werte":      tpl.countUnique(fmtInt),
      "Liste eindeutiger Werte":       tpl.listUnique(", "),
      "Summe":                         tpl.sum(fmt),
      "Ganzzahlige Summe":             tpl.sum(fmtInt),
      "Durchschnitt":                  tpl.average(fmt),
      "Minimum":                       tpl.min(fmt),
      "Maximum":                       tpl.max(fmt),
      "Summe über Summe":              tpl.sumOverSum(fmt),
      "80% Obergrenze":                tpl.sumOverSumBound80(true,  fmt),
      "80% Untergrenze":               tpl.sumOverSumBound80(false, fmt),
      "Summe als Anteil von Gesamt":   tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Summe als Anteil von Zeile":    tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Summe als Anteil von Spalte":   tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Anzahl als Anteil von Gesamt":  tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Anzahl als Anteil von Zeile":   tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Anzahl als Anteil von Spalte":  tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabelle":                     allR["Table"],
      "Tabelle mit Balkendiagramm":  allR["Table Barchart"],
      "Heatmap":                     allR["Heatmap"],
      "Heatmap pro Zeile":           allR["Row Heatmap"],
      "Heatmap pro Spalte":          allR["Col Heatmap"],
    },
  };
}

// ─── es  Spanish ─────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["es"] = {
    localeStrings: {
      renderError:   "Ocurrió un error durante la interpretación de la tabla dinámica.",
      computeError:  "Ocurrió un error durante el cálculo de la tabla dinámica.",
      uiRenderError: "Ocurrió un error durante el dibujado de la tabla dinámica.",
      selectAll:     "Seleccionar todo",
      selectNone:    "Deseleccionar todo",
      tooMany:       "(demasiados valores)",
      filterResults: "Filtrar resultados",
      apply:         "Aplicar",
      cancel:        "Cancelar",
      totals:        "Totales",
      vs:            "vs",
      by:            "por",
    },
    aggregators: {
      "Cuenta":                               tpl.count(fmtInt),
      "Cuenta de valores únicos":             tpl.countUnique(fmtInt),
      "Lista de valores únicos":              tpl.listUnique(", "),
      "Suma":                                 tpl.sum(fmt),
      "Suma de enteros":                      tpl.sum(fmtInt),
      "Promedio":                             tpl.average(fmt),
      "Mediana":                              tpl.median(fmt),
      "Varianza":                             tpl["var"](1, fmt),
      "Desviación estándar":                  tpl.stdev(1, fmt),
      "Mínimo":                               tpl.min(fmt),
      "Máximo":                               tpl.max(fmt),
      "Primero":                              tpl.first(fmt),
      "Último":                               tpl.last(fmt),
      "Suma de sumas":                        tpl.sumOverSum(fmt),
      "Cota 80% superior":                    tpl.sumOverSumBound80(true,  fmt),
      "Cota 80% inferior":                    tpl.sumOverSumBound80(false, fmt),
      "Proporción del total (suma)":          tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Proporción de la fila (suma)":         tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Proporción de la columna (suma)":      tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Proporción del total (cuenta)":        tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Proporción de la fila (cuenta)":       tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Proporción de la columna (cuenta)":    tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabla":                  allR["Table"],
      "Tabla con barras":       allR["Table Barchart"],
      "Heatmap":                allR["Heatmap"],
      "Heatmap por filas":      allR["Row Heatmap"],
      "Heatmap por columnas":   allR["Col Heatmap"],
    },
  };
}

// ─── fr  French ──────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["fr"] = {
    localeStrings: {
      renderError:   "Une erreur est survenue en dessinant le tableau croisé.",
      computeError:  "Une erreur est survenue en calculant le tableau croisé.",
      uiRenderError: "Une erreur est survenue en dessinant l'interface du tableau croisé dynamique.",
      selectAll:     "Sélectionner tout",
      selectNone:    "Sélectionner rien",
      tooMany:       "(trop de valeurs à afficher)",
      filterResults: "Filtrer les valeurs",
      apply:         "Appliquer",
      cancel:        "Annuler",
      totals:        "Totaux",
      vs:            "sur",
      by:            "par",
    },
    aggregators: {
      "Nombre":                              tpl.count(fmtInt),
      "Nombre de valeurs uniques":           tpl.countUnique(fmtInt),
      "Liste de valeurs uniques":            tpl.listUnique(", "),
      "Somme":                               tpl.sum(fmt),
      "Somme en entiers":                    tpl.sum(fmtInt),
      "Moyenne":                             tpl.average(fmt),
      "Minimum":                             tpl.min(fmt),
      "Maximum":                             tpl.max(fmt),
      "Premier":                             tpl.first(fmt),
      "Dernier":                             tpl.last(fmt),
      "Ratio de sommes":                     tpl.sumOverSum(fmt),
      "Borne supérieure 80%":                tpl.sumOverSumBound80(true,  fmt),
      "Borne inférieure 80%":                tpl.sumOverSumBound80(false, fmt),
      "Somme en proportion du total":        tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Somme en proportion de la ligne":     tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Somme en proportion de la colonne":   tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Nombre en proportion du total":       tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Nombre en proportion de la ligne":    tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Nombre en proportion de la colonne":  tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Table":                          allR["Table"],
      "Table avec barres":              allR["Table Barchart"],
      "Carte de chaleur":               allR["Heatmap"],
      "Carte de chaleur par ligne":     allR["Row Heatmap"],
      "Carte de chaleur par colonne":   allR["Col Heatmap"],
    },
  };
}

// ─── it  Italian ─────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["it"] = {
    localeStrings: {
      renderError:   "Si è verificato un errore durante la creazione della tabella.",
      computeError:  "Si è verificato un errore di calcolo nella tabella.",
      uiRenderError: "Si è verificato un errore durante il disegno dell'interfaccia della tabella pivot.",
      selectAll:     "Seleziona tutto",
      selectNone:    "Deseleziona tutto",
      tooMany:       "(troppi valori da visualizzare)",
      filterResults: "Filtra i valori",
      apply:         "Applica",
      cancel:        "Annulla",
      totals:        "Totali",
      vs:            "su",
      by:            "da",
    },
    aggregators: {
      "Numero":                            tpl.count(fmtInt),
      "Numero di valori unici":            tpl.countUnique(fmtInt),
      "Elenco di valori unici":            tpl.listUnique(", "),
      "Somma":                             tpl.sum(fmt),
      "Somma intera":                      tpl.sum(fmtInt),
      "Media":                             tpl.average(fmt),
      "Minimo":                            tpl.min(fmt),
      "Massimo":                           tpl.max(fmt),
      "Rapporto":                          tpl.sumOverSum(fmt),
      "Limite superiore 80%":              tpl.sumOverSumBound80(true,  fmt),
      "Limite inferiore 80%":              tpl.sumOverSumBound80(false, fmt),
      "Somma proporzionale al totale":     tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Somma proporzionale alla riga":     tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Somma proporzionale alla colonna":  tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Numero proporzionale al totale":    tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Numero proporzionale alla riga":    tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Numero proporzionale alla colonna": tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabella":                      allR["Table"],
      "Tabella con grafico":          allR["Table Barchart"],
      "Mappa di calore":              allR["Heatmap"],
      "Mappa di calore per righe":    allR["Row Heatmap"],
      "Mappa di calore per colonne":  allR["Col Heatmap"],
    },
  };
}

// ─── ja  Japanese  (source file was pivot.jp.coffee) ─────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: ",", decimalSep: "." });
  const fmtInt = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["ja"] = {
    localeStrings: {
      renderError:   "描画処理でエラーが発生しました。",
      computeError:  "処理中にエラーが発生しました。",
      uiRenderError: "表示処理中にエラーが発生しました。",
      selectAll:     "全選択",
      selectNone:    "選択解除",
      tooMany:       "項目が多すぎます",
      filterResults: "項目を検索する",
      apply:         "適用する",
      cancel:        "キャンセル",
      totals:        "合計",
      vs:            "vs",
      by:            "per",
    },
    aggregators: {
      "件数":                        tpl.count(fmtInt),
      "件数（ユニーク）":            tpl.countUnique(fmtInt),
      "ユニーク値を表示 (CSV)":      tpl.listUnique(", "),
      "合計":                        tpl.sum(fmt),
      "合計（整数）":                tpl.sum(fmtInt),
      "平均":                        tpl.average(fmt),
      "最小":                        tpl.min(fmt),
      "最大":                        tpl.max(fmt),
      "選択２項目の比率":            tpl.sumOverSum(fmt),
      "選択２項目の比率（上限80%）": tpl.sumOverSumBound80(true,  fmt),
      "選択２項目の比率（下限80%）": tpl.sumOverSumBound80(false, fmt),
      "合計割合":                    tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "合計割合（行）":              tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "合計割合（列）":              tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "件数割合":                    tpl.fractionOf(tpl.count(), "total", fmtPct),
      "件数割合（行）":              tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "件数割合（列）":              tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "表":                   allR["Table"],
      "表（棒グラフ）":       allR["Table Barchart"],
      "ヒートマップ":         allR["Heatmap"],
      "ヒートマップ（行）":   allR["Row Heatmap"],
      "ヒートマップ（列）":   allR["Col Heatmap"],
    },
  };
}

// ─── nl  Dutch ───────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["nl"] = {
    localeStrings: {
      renderError:   "Er is een fout opgetreden bij het renderen van de kruistabel.",
      computeError:  "Er is een fout opgetreden bij het berekenen van de kruistabel.",
      uiRenderError: "Er is een fout opgetreden bij het tekenen van de interface van de kruistabel.",
      selectAll:     "Alles selecteren",
      selectNone:    "Niets selecteren",
      tooMany:       "(te veel waarden om weer te geven)",
      filterResults: "Filter resultaten",
      totals:        "Totaal",
      vs:            "versus",
      by:            "per",
    },
    aggregators: {
      "Aantal":                               tpl.count(fmtInt),
      "Aantal unieke waarden":                tpl.countUnique(fmtInt),
      "Lijst unieke waarden":                 tpl.listUnique(", "),
      "Som":                                  tpl.sum(fmt),
      "Som van gehele getallen":              tpl.sum(fmtInt),
      "Gemiddelde":                           tpl.average(fmt),
      "Minimum":                              tpl.min(fmt),
      "Maximum":                              tpl.max(fmt),
      "Eerste":                               tpl.first(fmt),
      "Laatste":                              tpl.last(fmt),
      "Som over som":                         tpl.sumOverSum(fmt),
      "80% bovengrens":                       tpl.sumOverSumBound80(true,  fmt),
      "80% ondergrens":                       tpl.sumOverSumBound80(false, fmt),
      "Som in verhouding tot het totaal":     tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Som in verhouding tot de rij":         tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Som in verhouding tot de kolom":       tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Aantal in verhouding tot het totaal":  tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Aantal in verhouding tot de rij":      tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Aantal in verhouding tot de kolom":    tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabel":                       allR["Table"],
      "Tabel met staafdiagrammen":   allR["Table Barchart"],
      "Warmtekaart":                 allR["Heatmap"],
      "Warmtekaart per rij":         allR["Row Heatmap"],
      "Warmtekaart per kolom":       allR["Col Heatmap"],
    },
  };
}

// ─── pl  Polish ──────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["pl"] = {
    localeStrings: {
      renderError:   "Wystąpił błąd podczas renderowania wyników PivotTable.",
      computeError:  "Wystąpił błąd podczas obliczania wyników PivotTable.",
      uiRenderError: "Wystąpił błąd podczas renderowania UI PivotTable.",
      selectAll:     "Zaznacz wszystko",
      selectNone:    "Odznacz wszystkie",
      tooMany:       "(za dużo do wylistowania)",
      filterResults: "Filtruj wartości",
      apply:         "Zastosuj",
      cancel:        "Anuluj",
      totals:        "Podsumowanie",
      vs:            "vs",
      by:            "przez",
    },
    aggregators: {
      "Liczba":                          tpl.count(fmtInt),
      "Liczba Unikatowych Wartości":     tpl.countUnique(fmtInt),
      "Lista Unikatowych Wartości":      tpl.listUnique(", "),
      "Suma":                            tpl.sum(fmt),
      "Całkowita Suma":                  tpl.sum(fmtInt),
      "Średnia":                         tpl.average(fmt),
      "Minimum":                         tpl.min(fmt),
      "Maksimum":                        tpl.max(fmt),
      "Pierwszy":                        tpl.first(fmt),
      "Ostatni":                         tpl.last(fmt),
      "Suma po Sumie":                   tpl.sumOverSum(fmt),
      "80% Kres Dolny":                  tpl.sumOverSumBound80(true,  fmt),
      "80% Kres Górny":                  tpl.sumOverSumBound80(false, fmt),
      "Suma jako Ułamek Całości":        tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Suma jako Ułamek w Wierszach":    tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Suma jako Ułamek w Kolumnach":    tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Liczba jako Ułamek Całości":      tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Liczba jako Ułamek w Wierszach":  tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Liczba jako Ułamek w Kolumnach":  tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabela":                        allR["Table"],
      "Tabela z Wykresem Słupkowym":   allR["Table Barchart"],
      "Mapa cieplna":                  allR["Heatmap"],
      "Mapa cieplna po Wierszach":     allR["Row Heatmap"],
      "Mapa cieplna po Kolumnach":     allR["Col Heatmap"],
    },
  };
}

// ─── pt  Portuguese ──────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["pt"] = {
    localeStrings: {
      renderError:   "Ocorreu um erro ao renderizar os resultados da Tabela Dinâmica.",
      computeError:  "Ocorreu um erro ao computar os resultados da Tabela Dinâmica.",
      uiRenderError: "Ocorreu um erro ao renderizar a interface da Tabela Dinâmica.",
      selectAll:     "Selecionar Tudo",
      selectNone:    "Selecionar Nenhum",
      tooMany:       "(demais para listar)",
      filterResults: "Filtrar resultados",
      apply:         "Aplicar",
      cancel:        "Cancelar",
      totals:        "Totais",
      vs:            "vs",
      by:            "por",
    },
    aggregators: {
      "Contagem":                            tpl.count(fmtInt),
      "Contagem de Valores únicos":          tpl.countUnique(fmtInt),
      "Lista de Valores únicos":             tpl.listUnique(", "),
      "Soma":                                tpl.sum(fmt),
      "Soma de Inteiros":                    tpl.sum(fmtInt),
      "Média":                               tpl.average(fmt),
      "Mediana":                             tpl.median(fmt),
      "Variância":                           tpl["var"](1, fmt),
      "Desvio Padrão da Amostra":            tpl.stdev(1, fmt),
      "Mínimo":                              tpl.min(fmt),
      "Máximo":                              tpl.max(fmt),
      "Primeiro":                            tpl.first(fmt),
      "Último":                              tpl.last(fmt),
      "Soma sobre Soma":                     tpl.sumOverSum(fmt),
      "Limite Superior a 80%":               tpl.sumOverSumBound80(true,  fmt),
      "Limite Inferior a 80%":               tpl.sumOverSumBound80(false, fmt),
      "Soma como Fração do Total":           tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Soma como Fração da Linha":           tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Soma como Fração da Coluna":          tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Contagem como Fração do Total":       tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Contagem como Fração da Linha":       tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Contagem como Fração da Coluna":      tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabela":                     allR["Table"],
      "Tabela com Barras":          allR["Table Barchart"],
      "Mapa de Calor":              allR["Heatmap"],
      "Mapa de Calor por Linhas":   allR["Row Heatmap"],
      "Mapa de Calor por Colunas":  allR["Col Heatmap"],
    },
  };
}

// ─── ru  Russian ─────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["ru"] = {
    localeStrings: {
      renderError:   "Ошибка рендеринга страницы.",
      computeError:  "Ошибка табличных расчетов.",
      uiRenderError: "Ошибка во время прорисовки и динамического расчета таблицы.",
      selectAll:     "Выбрать все",
      selectNone:    "Снять выделение",
      tooMany:       "(Выбрано слишком много значений)",
      filterResults: "Возможные значения",
      totals:        "Всего",
      vs:            "на",
      by:            "с",
    },
    aggregators: {
      "Кол-во":            tpl.count(fmtInt),
      "Кол-во уникальных": tpl.countUnique(fmtInt),
      "Список уникальных": tpl.listUnique(", "),
      "Сумма":             tpl.sum(fmt),
      "Сумма целых":       tpl.sum(fmtInt),
      "Среднее":           tpl.average(fmt),
      "Минимум":           tpl.min(fmt),
      "Максимум":          tpl.max(fmt),
      "Сумма по сумме":    tpl.sumOverSum(fmt),
      "80% верхней границы":            tpl.sumOverSumBound80(true,  fmt),
      "80% нижней границы":             tpl.sumOverSumBound80(false, fmt),
      "Доля по всему":                  tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Доля по строке":                 tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Доля по столбцу":                tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Кол-во по всему":                tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Кол-во по строке":               tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Кол-во по столбцу":              tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Таблица":                     allR["Table"],
      "График столбцы":              allR["Table Barchart"],
      "Тепловая карта":              allR["Heatmap"],
      "Тепловая карта по строке":    allR["Row Heatmap"],
      "Тепловая карта по столбцу":   allR["Col Heatmap"],
    },
  };
}

// ─── sq  Albanian ────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: " ", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: " ", decimalSep: ",", digitsAfterDecimal: 1, scaler: 100, suffix: "%" });
  locales["sq"] = {
    localeStrings: {
      renderError:   "Ka ndodhur një gabim gjatë shfaqjes së rezultateve të PivotTable.",
      computeError:  "Ka ndodhur një gabim gjatë llogaritjes së rezultateve të PivotTable.",
      uiRenderError: "Ka ndodhur një gabim gjatë shfaqjes së ndërfaqes së PivotTable.",
      selectAll:     "Përzgjedh të gjitha",
      selectNone:    "Mos përzgjedh asnjërën",
      tooMany:       "(shumë për t'u listuar)",
      filterResults: "Filtro vlerat",
      totals:        "Totalet",
      vs:            "kundër",
      by:            "për",
    },
    aggregators: {
      "Numëro":                           tpl.count(fmtInt),
      "Numëro vlerat unike":              tpl.countUnique(fmtInt),
      "Listo vlerat unike":               tpl.listUnique(", "),
      "Shuma":                            tpl.sum(fmt),
      "Shuma si numër i plotë":           tpl.sum(fmtInt),
      "Mesatarja":                        tpl.average(fmt),
      "Minimumi":                         tpl.min(fmt),
      "Maksimumi":                        tpl.max(fmt),
      "Shuma mbi shumë":                  tpl.sumOverSum(fmt),
      "80% kufiri i sipërm":              tpl.sumOverSumBound80(true,  fmt),
      "80% kufiri i poshtëm":             tpl.sumOverSumBound80(false, fmt),
      "Shuma si thyesë e totalit":        tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Shuma si thyesë e rreshtave":      tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Shuma si thyesë e kolonave":       tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Numërimi si thyesë e totalit":     tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Numërimi si thyesë e rreshtave":   tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Numërimi si thyesë e kolonave":    tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tabela":                       allR["Table"],
      "Tabela me diagram vertikal":   allR["Table Barchart"],
      "Heatmap":                      allR["Heatmap"],
      "Heatmap për rresht":           allR["Row Heatmap"],
      "Heatmap për kolonë":           allR["Col Heatmap"],
    },
  };
}

// ─── tr  Turkish ─────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: ".", decimalSep: "," });
  const fmtInt = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ".", decimalSep: ",", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["tr"] = {
    localeStrings: {
      renderError:   "PivotTable sonuçlarını oluştururken hata oluştu",
      computeError:  "PivotTable sonuçlarını işlerken hata oluştu",
      uiRenderError: "PivotTable UI sonuçlarını oluştururken hata oluştu",
      selectAll:     "Tümünü Seç",
      selectNone:    "Tümünü Bırak",
      tooMany:       "(listelemek için fazla)",
      filterResults: "Sonuçları filtrele",
      totals:        "Toplam",
      vs:            "vs",
      by:            "ile",
    },
    aggregators: {
      "Sayı":                           tpl.count(fmtInt),
      "Benzersiz değerler sayısı":      tpl.countUnique(fmtInt),
      "Benzersiz değerler listesi":     tpl.listUnique(", "),
      "Toplam":                         tpl.sum(fmt),
      "Toplam (tam sayı)":              tpl.sum(fmtInt),
      "Ortalama":                       tpl.average(fmt),
      "Min":                            tpl.min(fmt),
      "Maks":                           tpl.max(fmt),
      "Miktarların toplamı":            tpl.sumOverSum(fmt),
      "%80 daha yüksek":                tpl.sumOverSumBound80(true,  fmt),
      "%80 daha düşük":                 tpl.sumOverSumBound80(false, fmt),
      "Toplam oranı (toplam)":          tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "Satır oranı (toplam)":           tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "Sütunun oranı (toplam)":         tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "Toplam oranı (sayı)":            tpl.fractionOf(tpl.count(), "total", fmtPct),
      "Satır oranı (sayı)":             tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "Sütunun oranı (sayı)":           tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "Tablo":               allR["Table"],
      "Tablo (Çubuklar)":    allR["Table Barchart"],
      "İlgi haritası":       allR["Heatmap"],
      "Satır ilgi haritası": allR["Row Heatmap"],
      "Sütun ilgi haritası": allR["Col Heatmap"],
    },
  };
}

// ─── zh  Chinese ─────────────────────────────────────────────────────────────
{
  const fmt    = numberFormat({ thousandsSep: ",", decimalSep: "." });
  const fmtInt = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 0 });
  const fmtPct = numberFormat({ thousandsSep: ",", decimalSep: ".", digitsAfterDecimal: 2, scaler: 100, suffix: "%" });
  locales["zh"] = {
    localeStrings: {
      renderError:   "展示结果时出错。",
      computeError:  "计算结果时出错。",
      uiRenderError: "展示界面时出错。",
      selectAll:     "选择全部",
      selectNone:    "全部不选",
      tooMany:       "(因数据过多而无法列出)",
      filterResults: "输入值帮助筛选",
      totals:        "合计",
      vs:            "于",
      by:            "分组于",
    },
    aggregators: {
      "频数":                       tpl.count(fmtInt),
      "非重复值的个数":             tpl.countUnique(fmtInt),
      "列出非重复值":               tpl.listUnique(", "),
      "求和":                       tpl.sum(fmt),
      "求和后取整":                 tpl.sum(fmtInt),
      "平均值":                     tpl.average(fmt),
      "中位数":                     tpl.median(fmt),
      "方差":                       tpl["var"](1, fmt),
      "样本标准偏差":               tpl.stdev(1, fmt),
      "最小值":                     tpl.min(fmt),
      "最大值":                     tpl.max(fmt),
      "第一":                       tpl.first(fmt),
      "最后":                       tpl.last(fmt),
      "两和之比":                   tpl.sumOverSum(fmt),
      "置信度80%时的区间上限":      tpl.sumOverSumBound80(true,  fmt),
      "置信度80%时的区间下限":      tpl.sumOverSumBound80(false, fmt),
      "和在总计中的比例":           tpl.fractionOf(tpl.sum(),   "total", fmtPct),
      "和在行合计中的比例":         tpl.fractionOf(tpl.sum(),   "row",   fmtPct),
      "和在列合计中的比例":         tpl.fractionOf(tpl.sum(),   "col",   fmtPct),
      "频数在总计中的比例":         tpl.fractionOf(tpl.count(), "total", fmtPct),
      "频数在行合计中的比例":       tpl.fractionOf(tpl.count(), "row",   fmtPct),
      "频数在列合计中的比例":       tpl.fractionOf(tpl.count(), "col",   fmtPct),
    },
    renderers: {
      "表格":       allR["Table"],
      "表格内柱状图": allR["Table Barchart"],
      "热图":       allR["Heatmap"],
      "行热图":     allR["Row Heatmap"],
      "列热图":     allR["Col Heatmap"],
    },
  };
}

// Re-export locales so consumers can read the registered map directly.
export { locales } from "../pivot";
