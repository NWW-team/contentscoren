import Papa from "papaparse";
import type { FeedbackItem, KolomMapping } from "./types";

export type CsvRij = Record<string, string>;

export type CsvBestand = {
  headers: string[];
  rijen: CsvRij[];
};

/**
 * Leest CSV-tekst in. Papaparse detecteert zelf het scheidingsteken, zodat
 * zowel komma- als puntkomma-exports (Excel NL) werken.
 */
export function leesCsv(tekst: string): CsvBestand {
  const resultaat = Papa.parse<CsvRij>(tekst.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });

  const rijen = resultaat.data.filter((rij) =>
    Object.values(rij).some((waarde) => (waarde ?? "").toString().trim() !== ""),
  );

  return { headers: resultaat.meta.fields ?? [], rijen };
}

const URL_NAMEN = ["url", "pagina", "page", "paginaurl", "pageurl", "adres", "link"];
const NUTTIG_NAMEN = [
  "nuttig",
  "helpful",
  "gevonden",
  "antwoordgevonden",
  "oordeel",
  "waardering",
  "janee",
  "tevreden",
];
const TOELICHTING_NAMEN = [
  "toelichting",
  "opmerking",
  "opmerkingen",
  "comment",
  "comments",
  "feedback",
  "reactie",
  "tekst",
  "waarom",
];
const TITEL_NAMEN = ["titel", "title", "paginatitel", "pagetitle", "onderwerp"];
const DATUM_NAMEN = ["datum", "date", "tijdstip", "timestamp", "aangemaakt"];

function normaliseerNaam(naam: string): string {
  return naam.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function zoekKolom(headers: string[], kandidaten: string[]): string | null {
  const genormaliseerd = headers.map((h) => ({ origineel: h, plat: normaliseerNaam(h) }));

  // Exacte match gaat voor op een gedeeltelijke, zodat "url" wint van "referrer_url".
  for (const kandidaat of kandidaten) {
    const treffer = genormaliseerd.find((h) => h.plat === kandidaat);
    if (treffer) return treffer.origineel;
  }
  for (const kandidaat of kandidaten) {
    const treffer = genormaliseerd.find((h) => h.plat.includes(kandidaat));
    if (treffer) return treffer.origineel;
  }
  return null;
}

/**
 * Raadt op gangbare kolomnamen welke kolom welke betekenis heeft. De redacteur
 * kan de uitkomst in de UI overrulen: de exportkolommen verschillen per bron.
 */
export function detecteerKolommen(headers: string[]): Partial<KolomMapping> {
  return {
    url: zoekKolom(headers, URL_NAMEN) ?? undefined,
    nuttig: zoekKolom(headers, NUTTIG_NAMEN) ?? undefined,
    toelichting: zoekKolom(headers, TOELICHTING_NAMEN),
    titel: zoekKolom(headers, TITEL_NAMEN),
    datum: zoekKolom(headers, DATUM_NAMEN),
  };
}

const JA_WAARDEN = new Set(["ja", "yes", "y", "true", "1", "wel", "positief", "goed"]);
const NEE_WAARDEN = new Set(["nee", "neen", "no", "n", "false", "0", "niet", "negatief", "slecht"]);

/** Zet een ruwe celwaarde om naar ja / nee / onbekend. */
export function leesNuttig(waarde: string | undefined): boolean | null {
  const plat = (waarde ?? "").trim().toLowerCase();
  if (plat === "") return null;
  if (JA_WAARDEN.has(plat)) return true;
  if (NEE_WAARDEN.has(plat)) return false;
  return null;
}

/**
 * Verwijdert querystring, fragment en trailing slash, zodat dezelfde pagina met
 * verschillende campagneparameters als één pagina telt.
 */
export function normaliseerUrl(ruw: string): string {
  const schoon = ruw.trim().split("#")[0].split("?")[0];
  if (schoon.length > 1 && schoon.endsWith("/")) return schoon.slice(0, -1);
  return schoon;
}

/** Zet CSV-rijen om naar feedback-items. Rijen zonder URL vallen af. */
export function naarFeedbackItems(rijen: CsvRij[], mapping: KolomMapping): FeedbackItem[] {
  const items: FeedbackItem[] = [];

  for (const rij of rijen) {
    const url = normaliseerUrl(rij[mapping.url] ?? "");
    if (url === "") continue;

    items.push({
      url,
      titel: mapping.titel ? (rij[mapping.titel] ?? "").trim() || undefined : undefined,
      datum: mapping.datum ? (rij[mapping.datum] ?? "").trim() || undefined : undefined,
      nuttig: leesNuttig(rij[mapping.nuttig]),
      toelichting: mapping.toelichting
        ? (rij[mapping.toelichting] ?? "").trim() || undefined
        : undefined,
    });
  }

  return items;
}
