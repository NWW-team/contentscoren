/**
 * Pure logica rond de schrijfwijzer, bruikbaar in de browser én op de server.
 * Het inlezen van het bestand staat in schrijfwijzer-server.ts, zodat de
 * browserbundel geen node-modules binnentrekt.
 */

/** Bovengrens, zodat een uit de hand gelopen document het verzoek niet opblaast. */
export const MAX_SCHRIJFWIJZER_TEKENS = 40_000;

export type SchrijfwijzerBron = "eigen" | "bestand" | "geen";

export type Schrijfwijzer = {
  tekst: string;
  bron: SchrijfwijzerBron;
  /** True als de tekst is ingekort omdat die boven de limiet uitkwam. */
  ingekort: boolean;
};

/** Kort in op de limiet, maar houd het op een regelgrens zodat er geen halve zin overblijft. */
export function kortIn(
  tekst: string,
  limiet = MAX_SCHRIJFWIJZER_TEKENS,
): { tekst: string; ingekort: boolean } {
  if (tekst.length <= limiet) return { tekst, ingekort: false };
  const afgekapt = tekst.slice(0, limiet);
  const laatsteRegel = afgekapt.lastIndexOf("\n");
  return {
    tekst: laatsteRegel > limiet / 2 ? afgekapt.slice(0, laatsteRegel) : afgekapt,
    ingekort: true,
  };
}
