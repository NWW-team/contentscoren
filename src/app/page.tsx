"use client";

import { useMemo, useState } from "react";
import AnalysePaneel from "@/components/AnalysePaneel";
import KolomMappingKiezer from "@/components/KolomMappingKiezer";
import SchrijfwijzerKiezer from "@/components/SchrijfwijzerKiezer";
import ScoreTabel from "@/components/ScoreTabel";
import UploadZone from "@/components/UploadZone";
import { detecteerKolommen, leesCsv, naarFeedbackItems, type CsvBestand } from "@/lib/csv";
import { berekenScores, topSlechtste } from "@/lib/score";
import { STREEFSCORE, type KolomMapping } from "@/lib/types";

const MIN_REACTIES = 10;

export default function Home() {
  const [bestandsnaam, setBestandsnaam] = useState<string | null>(null);
  const [bestand, setBestand] = useState<CsvBestand | null>(null);
  const [mapping, setMapping] = useState<Partial<KolomMapping>>({});
  const [geselecteerd, setGeselecteerd] = useState<string | null>(null);
  const [fout, setFout] = useState<string | null>(null);
  const [schrijfwijzer, setSchrijfwijzer] = useState("");

  function verwerkBestand(naam: string, tekst: string) {
    setFout(null);
    setGeselecteerd(null);
    try {
      const gelezen = leesCsv(tekst);
      if (gelezen.rijen.length === 0) {
        setFout("Dit bestand bevat geen rijen met gegevens.");
        return;
      }
      setBestand(gelezen);
      setBestandsnaam(naam);
      setMapping(detecteerKolommen(gelezen.headers));
    } catch {
      setFout("Dit bestand kon niet worden gelezen als CSV.");
    }
  }

  const compleet = Boolean(mapping.url && mapping.nuttig);

  const top = useMemo(() => {
    if (!bestand || !compleet) return [];
    const items = naarFeedbackItems(bestand.rijen, {
      url: mapping.url!,
      nuttig: mapping.nuttig!,
      toelichting: mapping.toelichting ?? null,
      titel: mapping.titel ?? null,
      datum: mapping.datum ?? null,
    });
    return topSlechtste(berekenScores(items), { minReacties: MIN_REACTIES, limiet: 10 });
  }, [bestand, mapping, compleet]);

  const geselecteerdePagina = top.find((pagina) => pagina.url === geselecteerd) ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold">Contentscoren</h1>
        <p className="mt-2 max-w-2xl text-gedempt">
          Upload je webfeedback en zie welke pagina&apos;s het slechtst scoren. Kies een pagina en laat de
          AI de oorzaken en een verbetervoorstel opstellen. Streefscore: {STREEFSCORE}%.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        <UploadZone onBestand={verwerkBestand} onFout={setFout} bezig={false} />

        {fout && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {fout}
          </p>
        )}

        {bestand && (
          <>
            <p className="text-sm text-gedempt">
              <span className="font-medium text-tekst">{bestandsnaam}</span> — {bestand.rijen.length}{" "}
              reacties ingelezen.
            </p>

            <KolomMappingKiezer headers={bestand.headers} mapping={mapping} onWijzig={setMapping} />

            {compleet ? (
              <>
                <div>
                  <h2 className="text-lg font-semibold">
                    Slechtst scorende pagina&apos;s
                    <span className="ml-2 text-sm font-normal text-gedempt">
                      minstens {MIN_REACTIES} reacties
                    </span>
                  </h2>
                  <p className="mt-1 mb-3 text-sm text-gedempt">
                    Klik een pagina aan om de feedback te bekijken en te laten analyseren.
                  </p>
                  <ScoreTabel
                    paginas={top}
                    geselecteerd={geselecteerd}
                    onSelecteer={setGeselecteerd}
                    minReacties={MIN_REACTIES}
                  />
                </div>

                <SchrijfwijzerKiezer waarde={schrijfwijzer} onWijzig={setSchrijfwijzer} />

                {geselecteerdePagina && (
                  <AnalysePaneel
                    key={geselecteerdePagina.url}
                    pagina={geselecteerdePagina}
                    schrijfwijzer={schrijfwijzer}
                  />
                )}
              </>
            ) : (
              <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Kies hierboven welke kolom de pagina-URL bevat en welke het ja/nee-antwoord, dan verschijnt
                de ranglijst.
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
