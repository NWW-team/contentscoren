"use client";

import { useState } from "react";
import type { PaginaAnalyse } from "@/lib/analyse-schema";
import { afstandTotStreef } from "@/lib/score";
import type { PaginaScore } from "@/lib/types";

type Status = { soort: "leeg" } | { soort: "bezig" } | { soort: "klaar"; analyse: PaginaAnalyse } | { soort: "fout"; melding: string };

const IMPACT_KLEUR: Record<string, string> = {
  hoog: "bg-red-100 text-red-900",
  midden: "bg-amber-100 text-amber-900",
  laag: "bg-slate-100 text-slate-700",
};

export default function AnalysePaneel({ pagina }: { pagina: PaginaScore }) {
  const [status, setStatus] = useState<Status>({ soort: "leeg" });
  const [gekopieerd, setGekopieerd] = useState<number | null>(null);

  async function analyseer() {
    setStatus({ soort: "bezig" });
    try {
      const respons = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          url: pagina.url,
          titel: pagina.titel,
          scorePct: pagina.scorePct,
          items: pagina.items.map(({ nuttig, toelichting, datum }) => ({ nuttig, toelichting, datum })),
        }),
      });
      const data = await respons.json();
      if (!respons.ok) {
        setStatus({ soort: "fout", melding: data.fout ?? "Er ging iets mis." });
        return;
      }
      setStatus({ soort: "klaar", analyse: data.analyse });
    } catch {
      setStatus({ soort: "fout", melding: "Kon de server niet bereiken." });
    }
  }

  const toelichtingen = pagina.items.filter((item) => item.toelichting);

  return (
    <section className="rounded-xl border border-rand bg-kaart p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{pagina.titel}</h2>
          <p className="text-sm text-gedempt">{pagina.url}</p>
          <p className="mt-2 text-sm text-gedempt">
            {pagina.scorePct.toFixed(1)}% van {pagina.totaal} reacties positief
            {afstandTotStreef(pagina) > 0 && ` — ${afstandTotStreef(pagina)} procentpunt onder de streefscore`}
            . {toelichtingen.length} reacties met toelichting.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void analyseer()}
          disabled={status.soort === "bezig"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status.soort === "bezig" ? "Bezig met analyseren…" : "Analyseer met AI"}
        </button>
      </div>

      {status.soort === "bezig" && (
        <p className="mt-5 text-sm text-gedempt">
          De AI leest alle {toelichtingen.length} toelichtingen door. Dit duurt meestal een halve minuut.
        </p>
      )}

      {status.soort === "fout" && (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900">{status.melding}</p>
      )}

      {status.soort === "klaar" && (
        <div className="mt-6 space-y-7">
          <div>
            <p className="text-base leading-relaxed">{status.analyse.samenvatting}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-gedempt">
              Vertrouwen in deze analyse: {status.analyse.vertrouwen}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gedempt">Oorzaken</h3>
            <ol className="mt-3 space-y-4">
              {status.analyse.oorzaken.map((oorzaak, index) => (
                <li key={index} className="rounded-lg border border-rand p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium">{oorzaak.oorzaak}</p>
                    <span
                      className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                        IMPACT_KLEUR[oorzaak.impact] ?? IMPACT_KLEUR.laag
                      }`}
                    >
                      {oorzaak.impact}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {oorzaak.bewijs.map((citaat, i) => (
                      <li key={i} className="border-l-2 border-rand pl-3 text-sm italic text-gedempt">
                        “{citaat}”
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gedempt">
              Verbetersuggesties
            </h3>
            <ol className="mt-3 space-y-4">
              {status.analyse.verbetersuggesties.map((suggestie, index) => (
                <li key={index} className="rounded-lg border border-rand p-4">
                  <p className="font-medium">{suggestie.titel}</p>
                  <p className="mt-1 text-sm text-gedempt">{suggestie.waarom}</p>
                  <div className="mt-3 rounded-lg bg-achtergrond p-3">
                    <p className="whitespace-pre-wrap text-sm">{suggestie.voorbeeldtekst}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(suggestie.voorbeeldtekst);
                      setGekopieerd(index);
                      setTimeout(() => setGekopieerd((huidig) => (huidig === index ? null : huidig)), 2000);
                    }}
                    className="mt-2 text-sm font-medium text-blue-700 hover:underline"
                  >
                    {gekopieerd === index ? "Gekopieerd" : "Kopieer voorbeeldtekst"}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {status.soort === "leeg" && (
        <details className="mt-5">
          <summary className="cursor-pointer text-sm font-medium text-gedempt">
            Bekijk de {toelichtingen.length} toelichtingen
          </summary>
          <ul className="mt-3 space-y-1.5">
            {toelichtingen.map((item, index) => (
              <li key={index} className="border-l-2 border-rand pl-3 text-sm text-gedempt">
                <span className={item.nuttig === false ? "text-red-700" : ""}>
                  [{item.nuttig === true ? "ja" : item.nuttig === false ? "nee" : "—"}]
                </span>{" "}
                {item.toelichting}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
