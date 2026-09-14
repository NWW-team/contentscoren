import { z } from "zod";

/**
 * Wat de AI per pagina teruggeeft. Gedeeld tussen de server-route (om het
 * antwoord af te dwingen) en de UI (om het te typeren).
 */
export const PaginaAnalyseSchema = z.object({
  samenvatting: z
    .string()
    .describe("Twee tot drie zinnen: waarom haalt deze pagina de streefscore niet?"),
  oorzaken: z
    .array(
      z.object({
        oorzaak: z.string().describe("Wat er misgaat, in één zin"),
        bewijs: z
          .array(z.string())
          .describe("Letterlijke citaten uit de feedback die deze oorzaak ondersteunen"),
        impact: z.enum(["hoog", "midden", "laag"]),
      }),
    )
    .describe("De belangrijkste oorzaken, meest bepalende eerst"),
  verbetersuggesties: z
    .array(
      z.object({
        titel: z.string().describe("Korte actietitel voor de redacteur"),
        waarom: z.string().describe("Welke oorzaak dit wegneemt"),
        voorbeeldtekst: z
          .string()
          .describe("Kant-en-klare tekst op B1-niveau die de redacteur kan redigeren en plaatsen"),
      }),
    )
    .describe("Concrete verbeteringen, belangrijkste eerst"),
  vertrouwen: z
    .enum(["hoog", "midden", "laag"])
    .describe("Hoe stevig de feedback deze conclusies draagt"),
});

export type PaginaAnalyse = z.infer<typeof PaginaAnalyseSchema>;

/** Wat de client naar /api/analyze stuurt. */
export const AnalyseVerzoekSchema = z.object({
  url: z.string().min(1),
  titel: z.string().min(1),
  scorePct: z.number(),
  items: z
    .array(
      z.object({
        nuttig: z.boolean().nullable(),
        toelichting: z.string().optional(),
        datum: z.string().optional(),
      }),
    )
    .min(1),
});

export type AnalyseVerzoek = z.infer<typeof AnalyseVerzoekSchema>;
