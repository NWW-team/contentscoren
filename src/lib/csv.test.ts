import { describe, expect, it } from "vitest";
import { detecteerKolommen, leesCsv, leesNuttig, naarFeedbackItems, normaliseerUrl } from "./csv";
import type { KolomMapping } from "./types";

describe("leesCsv", () => {
  it("leest een komma-gescheiden bestand met headers", () => {
    const { headers, rijen } = leesCsv("url,nuttig\n/a,ja\n/b,nee\n");
    expect(headers).toEqual(["url", "nuttig"]);
    expect(rijen).toHaveLength(2);
    expect(rijen[0]).toEqual({ url: "/a", nuttig: "ja" });
  });

  it("leest ook puntkomma-gescheiden exports uit Excel", () => {
    const { headers, rijen } = leesCsv("url;nuttig\n/a;ja\n");
    expect(headers).toEqual(["url", "nuttig"]);
    expect(rijen[0].nuttig).toBe("ja");
  });

  it("negeert lege regels en een BOM", () => {
    const { rijen } = leesCsv("﻿url,nuttig\n/a,ja\n\n,\n");
    expect(rijen).toHaveLength(1);
  });

  it("houdt komma's binnen aanhalingstekens bij elkaar", () => {
    const { rijen } = leesCsv('url,toelichting\n/a,"onduidelijk, en te lang"\n');
    expect(rijen[0].toelichting).toBe("onduidelijk, en te lang");
  });
});

describe("detecteerKolommen", () => {
  it("herkent Nederlandse kolomnamen", () => {
    const mapping = detecteerKolommen(["URL", "Nuttig", "Toelichting", "Datum"]);
    expect(mapping.url).toBe("URL");
    expect(mapping.nuttig).toBe("Nuttig");
    expect(mapping.toelichting).toBe("Toelichting");
    expect(mapping.datum).toBe("Datum");
  });

  it("herkent Engelse kolomnamen met afwijkende schrijfwijze", () => {
    const mapping = detecteerKolommen(["page_url", "Helpful?", "Comments"]);
    expect(mapping.url).toBe("page_url");
    expect(mapping.nuttig).toBe("Helpful?");
    expect(mapping.toelichting).toBe("Comments");
  });

  it("geeft een exacte match voorrang boven een gedeeltelijke", () => {
    const mapping = detecteerKolommen(["referrer_url", "url"]);
    expect(mapping.url).toBe("url");
  });

  it("laat onbekende kolommen leeg, zodat de UI om mapping kan vragen", () => {
    const mapping = detecteerKolommen(["kolom_a", "kolom_b"]);
    expect(mapping.url).toBeUndefined();
    expect(mapping.nuttig).toBeUndefined();
  });
});

describe("leesNuttig", () => {
  it("herkent ja- en nee-waarden in beide talen", () => {
    expect(leesNuttig("ja")).toBe(true);
    expect(leesNuttig(" JA ")).toBe(true);
    expect(leesNuttig("yes")).toBe(true);
    expect(leesNuttig("1")).toBe(true);
    expect(leesNuttig("nee")).toBe(false);
    expect(leesNuttig("No")).toBe(false);
    expect(leesNuttig("0")).toBe(false);
  });

  it("geeft null bij leeg of onbekend", () => {
    expect(leesNuttig("")).toBeNull();
    expect(leesNuttig(undefined)).toBeNull();
    expect(leesNuttig("misschien")).toBeNull();
  });
});

describe("normaliseerUrl", () => {
  it("verwijdert querystring, fragment en trailing slash", () => {
    expect(normaliseerUrl("/paspoort/?utm_source=nb")).toBe("/paspoort");
    expect(normaliseerUrl("/paspoort#stap2")).toBe("/paspoort");
    expect(normaliseerUrl(" /paspoort/ ")).toBe("/paspoort");
  });

  it("laat de root-slash staan", () => {
    expect(normaliseerUrl("/")).toBe("/");
  });
});

const mapping: KolomMapping = {
  url: "url",
  nuttig: "nuttig",
  toelichting: "toelichting",
  titel: null,
  datum: null,
};

describe("naarFeedbackItems", () => {
  it("zet rijen om en normaliseert de url", () => {
    const items = naarFeedbackItems(
      [{ url: "/paspoort/?x=1", nuttig: "nee", toelichting: "onduidelijk" }],
      mapping,
    );
    expect(items).toEqual([
      { url: "/paspoort", titel: undefined, datum: undefined, nuttig: false, toelichting: "onduidelijk" },
    ]);
  });

  it("slaat rijen zonder url over", () => {
    const items = naarFeedbackItems(
      [
        { url: "", nuttig: "ja", toelichting: "" },
        { url: "/a", nuttig: "ja", toelichting: "" },
      ],
      mapping,
    );
    expect(items).toHaveLength(1);
  });

  it("maakt van een lege toelichting undefined in plaats van een lege string", () => {
    const items = naarFeedbackItems([{ url: "/a", nuttig: "ja", toelichting: "   " }], mapping);
    expect(items[0].toelichting).toBeUndefined();
  });
});
