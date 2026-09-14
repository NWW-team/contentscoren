import { readFile } from "node:fs/promises";
import path from "node:path";
import { kortIn, type Schrijfwijzer } from "./schrijfwijzer";

export const SCHRIJFWIJZER_PAD = path.join("content", "schrijfwijzer.md");

/**
 * Bepaalt welke richtlijnen bij deze analyse horen. Een schrijfwijzer die de
 * redacteur in de app heeft ingeladen gaat voor op het bestand in de repo;
 * ontbreken ze allebei, dan analyseert de AI zonder richtlijnen verder.
 */
export async function laadSchrijfwijzer(eigen?: string): Promise<Schrijfwijzer> {
  const eigenTekst = (eigen ?? "").trim();
  if (eigenTekst !== "") {
    const { tekst, ingekort } = kortIn(eigenTekst);
    return { tekst, bron: "eigen", ingekort };
  }

  try {
    const bestand = await readFile(path.join(process.cwd(), SCHRIJFWIJZER_PAD), "utf8");
    const bestandTekst = bestand.trim();
    if (bestandTekst === "") return { tekst: "", bron: "geen", ingekort: false };
    const { tekst, ingekort } = kortIn(bestandTekst);
    return { tekst, bron: "bestand", ingekort };
  } catch {
    return { tekst: "", bron: "geen", ingekort: false };
  }
}
