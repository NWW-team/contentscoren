import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { AnalyseVerzoekSchema, PaginaAnalyseSchema } from "@/lib/analyse-schema";
import { STREEFSCORE } from "@/lib/types";

export const runtime = "nodejs";

/** Bovengrens op het aantal reacties per verzoek, zodat één uitschieterpagina het verzoek niet opblaast. */
const MAX_REACTIES = 300;

const SYSTEEM_PROMPT = `Je bent contentspecialist bij een Nederlandse overheidsorganisatie en analyseert bezoekersfeedback op webpagina's.

Je taak: bepaal waarom bezoekers op deze pagina geen antwoord kregen, en schrijf verbeteringen die de redacteur direct kan gebruiken.

Werkwijze:
- Baseer je uitsluitend op de meegeleverde feedback. Verzin geen oorzaken die de reacties niet ondersteunen.
- Neem als bewijs altijd letterlijke citaten over uit de toelichtingen, woord voor woord.
- Groepeer reacties die op hetzelfde neerkomen tot één oorzaak; noem de vaakst genoemde eerst.
- Schrijf voorbeeldteksten op taalniveau B1: korte zinnen, actieve vorm, geen ambtelijk jargon, spreek de bezoeker aan met "u".
- Een voorbeeldtekst is echte paginatekst die de redacteur kan plakken en redigeren, geen instructie aan de redacteur.
- Zeg het eerlijk als de feedback te dun of te divers is voor harde conclusies: zet "vertrouwen" dan op "laag".
- Antwoord volledig in het Nederlands.`;

function bouwGebruikersPrompt(verzoek: {
  url: string;
  titel: string;
  scorePct: number;
  items: { nuttig: boolean | null; toelichting?: string; datum?: string }[];
}): string {
  const metToelichting = verzoek.items.filter((item) => item.toelichting);
  const nee = verzoek.items.filter((item) => item.nuttig === false).length;
  const ja = verzoek.items.filter((item) => item.nuttig === true).length;

  const regels = metToelichting
    .map((item) => {
      const oordeel = item.nuttig === true ? "ja" : item.nuttig === false ? "nee" : "geen oordeel";
      return `- [${oordeel}${item.datum ? `, ${item.datum}` : ""}] ${item.toelichting}`;
    })
    .join("\n");

  return `Pagina: ${verzoek.titel}
URL: ${verzoek.url}
Feedbackscore: ${verzoek.scorePct.toFixed(1)}% van de bezoekers vond wat die zocht (${ja} ja, ${nee} nee). De streefwaarde is ${STREEFSCORE}%.

Reacties met toelichting (${metToelichting.length} van ${verzoek.items.length}):
${regels || "(geen toelichtingen aanwezig)"}

Geef de belangrijkste oorzaken met letterlijke citaten als bewijs, en verbetersuggesties met kant-en-klare voorbeeldtekst.`;
}

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        fout:
          "Geen ANTHROPIC_API_KEY ingesteld. Zet de sleutel in .env.local (zie .env.example) en start de server opnieuw.",
      },
      { status: 503 },
    );
  }

  let verzoek;
  try {
    verzoek = AnalyseVerzoekSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ fout: "Ongeldig verzoek." }, { status: 400 });
  }

  // Nieuwste reacties eerst, en die met een toelichting hebben voorrang: daar zit de analysewaarde.
  const gesorteerd = [...verzoek.items].sort((a, b) => {
    const toelichtingVerschil = Number(Boolean(b.toelichting)) - Number(Boolean(a.toelichting));
    if (toelichtingVerschil !== 0) return toelichtingVerschil;
    return (b.datum ?? "").localeCompare(a.datum ?? "");
  });

  const client = new Anthropic();

  try {
    const respons = await client.beta.messages.parse({
      model: "claude-opus-5",
      max_tokens: 16000,
      // Thinking wordt bewust weggelaten: op Opus 5 draait adaptief denken dan standaard.
      output_config: { effort: "high" },
      output_format: betaZodOutputFormat(PaginaAnalyseSchema),
      system: [
        {
          type: "text",
          text: SYSTEEM_PROMPT,
          // De instructies zijn bij elke pagina gelijk; caching maakt een reeks analyses goedkoper.
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: bouwGebruikersPrompt({ ...verzoek, items: gesorteerd.slice(0, MAX_REACTIES) }),
        },
      ],
    });

    if (respons.stop_reason === "refusal") {
      return NextResponse.json(
        { fout: "Het model heeft dit verzoek geweigerd te beantwoorden." },
        { status: 422 },
      );
    }

    if (!respons.parsed_output) {
      return NextResponse.json(
        { fout: "Het model gaf geen bruikbaar antwoord terug. Probeer het opnieuw." },
        { status: 502 },
      );
    }

    return NextResponse.json({ analyse: respons.parsed_output });
  } catch (fout) {
    if (fout instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ fout: "De API-sleutel wordt niet geaccepteerd." }, { status: 401 });
    }
    if (fout instanceof Anthropic.RateLimitError) {
      return NextResponse.json(
        { fout: "Te veel verzoeken achter elkaar. Wacht even en probeer opnieuw." },
        { status: 429 },
      );
    }
    if (fout instanceof Anthropic.APIError) {
      return NextResponse.json({ fout: `Fout van de API: ${fout.message}` }, { status: 502 });
    }
    console.error("Onverwachte fout bij analyseren:", fout);
    return NextResponse.json({ fout: "Onverwachte fout bij het analyseren." }, { status: 500 });
  }
}
