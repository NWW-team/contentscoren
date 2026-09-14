import { describe, expect, it } from "vitest";
import { afstandTotStreef, berekenScores, topSlechtste } from "./score";
import type { FeedbackItem } from "./types";

function maakItems(url: string, ja: number, nee: number, onbekend = 0): FeedbackItem[] {
  return [
    ...Array.from({ length: ja }, () => ({ url, nuttig: true })),
    ...Array.from({ length: nee }, () => ({ url, nuttig: false })),
    ...Array.from({ length: onbekend }, () => ({ url, nuttig: null })),
  ];
}

describe("berekenScores", () => {
  it("groepeert per pagina en rekent het percentage ja uit", () => {
    const scores = berekenScores([...maakItems("/a", 3, 1), ...maakItems("/b", 1, 1)]);
    const a = scores.find((s) => s.url === "/a")!;
    expect(a).toMatchObject({ ja: 3, nee: 1, totaal: 4, scorePct: 75 });
    expect(scores.find((s) => s.url === "/b")!.scorePct).toBe(50);
  });

  it("laat reacties zonder ja/nee buiten de score maar bewaart ze wel", () => {
    const [a] = berekenScores(maakItems("/a", 1, 1, 2));
    expect(a.totaal).toBe(2);
    expect(a.scorePct).toBe(50);
    expect(a.items).toHaveLength(4);
  });

  it("geeft score 0 bij uitsluitend onbruikbare reacties in plaats van NaN", () => {
    const [a] = berekenScores(maakItems("/a", 0, 0, 3));
    expect(a.totaal).toBe(0);
    expect(a.scorePct).toBe(0);
  });

  it("rondt af op één decimaal", () => {
    const [a] = berekenScores(maakItems("/a", 1, 2));
    expect(a.scorePct).toBe(33.3);
  });

  it("gebruikt de paginatitel zodra een rij die heeft", () => {
    const [a] = berekenScores([
      { url: "/a", nuttig: true },
      { url: "/a", nuttig: false, titel: "Paspoort aanvragen" },
    ]);
    expect(a.titel).toBe("Paspoort aanvragen");
  });

  it("valt terug op de url als er geen titel is", () => {
    const [a] = berekenScores(maakItems("/a", 1, 0));
    expect(a.titel).toBe("/a");
  });
});

describe("topSlechtste", () => {
  it("sorteert oplopend op score", () => {
    const scores = berekenScores([
      ...maakItems("/goed", 18, 2),
      ...maakItems("/slecht", 4, 16),
      ...maakItems("/matig", 12, 8),
    ]);
    expect(topSlechtste(scores).map((s) => s.url)).toEqual(["/slecht", "/matig", "/goed"]);
  });

  it("filtert pagina's met te weinig reacties weg", () => {
    const scores = berekenScores([...maakItems("/ruis", 0, 1), ...maakItems("/echt", 5, 15)]);
    expect(topSlechtste(scores).map((s) => s.url)).toEqual(["/echt"]);
  });

  it("respecteert een eigen drempel en limiet", () => {
    const scores = berekenScores([...maakItems("/a", 0, 2), ...maakItems("/b", 1, 2)]);
    expect(topSlechtste(scores, { minReacties: 2, limiet: 1 }).map((s) => s.url)).toEqual(["/a"]);
  });

  it("zet bij een gelijke score de pagina met meer reacties bovenaan", () => {
    const scores = berekenScores([...maakItems("/klein", 5, 5), ...maakItems("/groot", 25, 25)]);
    expect(topSlechtste(scores).map((s) => s.url)).toEqual(["/groot", "/klein"]);
  });

  it("geeft een lege lijst als geen enkele pagina de drempel haalt", () => {
    expect(topSlechtste(berekenScores(maakItems("/a", 1, 1)))).toEqual([]);
  });
});

describe("afstandTotStreef", () => {
  it("rekent het gat tot 80% uit", () => {
    const [a] = berekenScores(maakItems("/a", 1, 3));
    expect(afstandTotStreef(a)).toBe(55);
  });

  it("geeft 0 voor een pagina die de streefscore haalt", () => {
    const [a] = berekenScores(maakItems("/a", 9, 1));
    expect(afstandTotStreef(a)).toBe(0);
  });
});
