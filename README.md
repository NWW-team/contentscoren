# Contentscoren

Upload een export van je webfeedback, zie welke pagina's het slechtst scoren, en laat de AI
per pagina de oorzaken en een kant-en-klaar verbetervoorstel opstellen.

Zie [STRATEGY.md](STRATEGY.md) voor het probleem en de aanpak. Dit is stap 1: de kortste route
van "export" naar "top 10 + verbetervoorstel", nog zonder database, login of koppelingen.

## Aan de slag

```bash
npm install
cp .env.example .env.local   # vul je eigen ANTHROPIC_API_KEY in
npm run dev                  # http://localhost:3000
```

Klik op **Voorbeelddata laden** om het meteen te proberen met verzonnen feedback over
reisdocumenten (`data/voorbeeld-feedback.csv`).

De API-sleutel wordt alleen server-side gebruikt en komt nooit in de browser. Zonder sleutel
werkt alles behalve de AI-analyse; die geeft dan een melding in plaats van een foutpagina.

## Je eigen export gebruiken

Een CSV met per regel één reactie. Twee kolommen zijn nodig:

| Kolom | Betekenis | Voorbeelden van namen die worden herkend |
| --- | --- | --- |
| Pagina-URL | Waar de reactie over gaat | `url`, `pagina`, `page_url` |
| Ja/nee-antwoord | Vond de bezoeker wat die zocht? | `nuttig`, `helpful`, `gevonden` |

Optioneel, maar sterk aanbevolen: een kolom met de **toelichting** (`toelichting`, `opmerking`,
`comment`). Zonder die open antwoorden heeft de AI weinig om op te analyseren. Ook `titel` en
`datum` worden gebruikt als ze er zijn.

Kolomnamen worden automatisch herkend; klopt er iets niet, dan pas je het in de app aan. Komma-
en puntkomma-gescheiden bestanden werken allebei, en `ja/nee`, `yes/no` en `1/0` worden gelezen.

## Hoe de score werkt

Per pagina: het percentage bezoekers dat "ja" antwoordde. Reacties zonder bruikbaar ja/nee-antwoord
tellen niet mee in de score, maar hun toelichting gaat wél mee naar de analyse. De streefwaarde
is 80%, conform de strategie.

Pagina's met minder dan 10 ja/nee-reacties vallen buiten de ranglijst — anders vult de top zich
met pagina's die toevallig één keer "nee" kregen.

## Ontwikkelen

```bash
npm test     # unit-tests voor het inlezen en scoren
npm run build
```

De domeinlogica in `src/lib/` (`csv.ts`, `score.ts`) staat los van React en is volledig getest;
`src/lib/voorbeelddata.test.ts` draait de hele keten op het voorbeeldbestand.

De AI-analyse loopt via `src/app/api/analyze/route.ts`: die roept Claude aan met een vast
JSON-schema (`src/lib/analyse-schema.ts`), zodat het antwoord altijd dezelfde vorm heeft.

## Nog niet in deze versie

Telefoondata, schrijfwijzers als context, opslag van analyses, gebruikersbeheer en een directe
koppeling met het feedbacksysteem. De scorelogica is bronneutraal opgezet, zodat die er additief
bij kunnen.
