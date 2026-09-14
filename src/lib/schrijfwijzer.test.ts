import { describe, expect, it } from "vitest";
import { kortIn, MAX_SCHRIJFWIJZER_TEKENS } from "./schrijfwijzer";
import { laadSchrijfwijzer } from "./schrijfwijzer-server";

describe("kortIn", () => {
  it("laat tekst binnen de limiet ongemoeid", () => {
    expect(kortIn("korte tekst", 100)).toEqual({ tekst: "korte tekst", ingekort: false });
  });

  it("kort in op een regelgrens zodat er geen halve zin overblijft", () => {
    const tekst = "regel een is lang genoeg\nregel twee\nregel drie";
    const { tekst: uitkomst, ingekort } = kortIn(tekst, 30);
    expect(ingekort).toBe(true);
    expect(uitkomst).toBe("regel een is lang genoeg");
  });

  it("kapt hard af als er geen bruikbare regelgrens is", () => {
    const { tekst, ingekort } = kortIn("a".repeat(100), 10);
    expect(ingekort).toBe(true);
    expect(tekst).toHaveLength(10);
  });
});

describe("laadSchrijfwijzer", () => {
  it("geeft een eigen schrijfwijzer voorrang op het bestand", async () => {
    const resultaat = await laadSchrijfwijzer("Onze eigen richtlijnen");
    expect(resultaat).toEqual({ tekst: "Onze eigen richtlijnen", bron: "eigen", ingekort: false });
  });

  it("negeert een eigen schrijfwijzer die alleen uit witruimte bestaat", async () => {
    expect((await laadSchrijfwijzer("   \n  ")).bron).toBe("bestand");
  });

  it("valt terug op het bestand in de repo", async () => {
    const resultaat = await laadSchrijfwijzer();
    expect(resultaat.bron).toBe("bestand");
    expect(resultaat.tekst).toContain("B1");
  });

  it("kort een te lange eigen schrijfwijzer in", async () => {
    const resultaat = await laadSchrijfwijzer("x".repeat(MAX_SCHRIJFWIJZER_TEKENS + 500));
    expect(resultaat.ingekort).toBe(true);
    expect(resultaat.tekst.length).toBeLessThanOrEqual(MAX_SCHRIJFWIJZER_TEKENS);
  });
});
