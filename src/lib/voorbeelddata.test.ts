import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { detecteerKolommen, leesCsv, naarFeedbackItems } from "./csv";
import { berekenScores, topSlechtste } from "./score";
import type { KolomMapping } from "./types";

/** De hele keten op het meegeleverde voorbeeldbestand: inlezen -> mappen -> scoren. */
describe("voorbeeld-feedback.csv", () => {
  const tekst = readFileSync("data/voorbeeld-feedback.csv", "utf8");
  const bestand = leesCsv(tekst);
  const gedetecteerd = detecteerKolommen(bestand.headers);

  it("laat alle kolommen automatisch herkennen", () => {
    expect(gedetecteerd).toEqual({
      url: "url",
      nuttig: "nuttig",
      toelichting: "toelichting",
      titel: "titel",
      datum: "datum",
    });
  });

  const items = naarFeedbackItems(bestand.rijen, gedetecteerd as KolomMapping);
  const scores = berekenScores(items);

  it("leest alle rijen in zonder er stilletjes te laten vallen", () => {
    expect(items).toHaveLength(bestand.rijen.length);
  });

  it("verdeelt de feedback over meerdere pagina's", () => {
    expect(scores.length).toBeGreaterThanOrEqual(6);
  });

  it("zet de spoedpagina bovenaan de top en houdt de goed scorende pagina onderaan", () => {
    const top = topSlechtste(scores);
    expect(top[0].url).toBe("/paspoort-spoedaanvraag-buitenland");
    expect(top[top.length - 1].url).toBe("/paspoort-verlengen-nederland");
  });

  it("filtert de pagina met te weinig reacties uit de top", () => {
    expect(topSlechtste(scores).map((p) => p.url)).not.toContain("/paspoort-kosten");
  });

  it("levert per pagina in de top toelichtingen op om te analyseren", () => {
    for (const pagina of topSlechtste(scores)) {
      expect(pagina.items.some((item) => item.toelichting)).toBe(true);
    }
  });
});
