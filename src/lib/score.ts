import type { FeedbackItem, PaginaScore } from "./types";
import { STREEFSCORE } from "./types";

/**
 * Groepeert feedback per pagina en berekent het percentage "ja".
 * Reacties zonder bruikbaar ja/nee-antwoord tellen niet mee in de score, maar
 * blijven wel bewaard in `items` — de toelichting is voor de AI-analyse waardevol.
 */
export function berekenScores(items: FeedbackItem[]): PaginaScore[] {
  const perUrl = new Map<string, PaginaScore>();

  for (const item of items) {
    let pagina = perUrl.get(item.url);
    if (!pagina) {
      pagina = { url: item.url, titel: item.titel ?? item.url, totaal: 0, ja: 0, nee: 0, scorePct: 0, items: [] };
      perUrl.set(item.url, pagina);
    }

    pagina.items.push(item);
    if (item.titel && pagina.titel === pagina.url) pagina.titel = item.titel;
    if (item.nuttig === true) pagina.ja += 1;
    if (item.nuttig === false) pagina.nee += 1;
  }

  for (const pagina of perUrl.values()) {
    pagina.totaal = pagina.ja + pagina.nee;
    pagina.scorePct = pagina.totaal === 0 ? 0 : Math.round((pagina.ja / pagina.totaal) * 1000) / 10;
  }

  return [...perUrl.values()];
}

export type TopOpties = {
  /**
   * Minimum aantal ja/nee-reacties voordat een pagina meetelt. Zonder deze
   * drempel vult de top zich met pagina's die toevallig één keer "nee" kregen.
   */
  minReacties?: number;
  limiet?: number;
};

/** De slechtst scorende pagina's met genoeg respons om betekenis te hebben. */
export function topSlechtste(
  scores: PaginaScore[],
  { minReacties = 10, limiet = 10 }: TopOpties = {},
): PaginaScore[] {
  return scores
    .filter((pagina) => pagina.totaal >= minReacties)
    .sort((a, b) => a.scorePct - b.scorePct || b.totaal - a.totaal || a.url.localeCompare(b.url))
    .slice(0, limiet);
}

/** Hoeveel procentpunt een pagina nog tekortkomt voor de streefscore van 80%. */
export function afstandTotStreef(pagina: PaginaScore): number {
  return Math.max(0, Math.round((STREEFSCORE - pagina.scorePct) * 10) / 10);
}
