"use client";

import type { KolomMapping } from "@/lib/types";

type Props = {
  headers: string[];
  mapping: Partial<KolomMapping>;
  onWijzig: (mapping: Partial<KolomMapping>) => void;
};

const VELDEN: { sleutel: keyof KolomMapping; label: string; uitleg: string; verplicht: boolean }[] = [
  { sleutel: "url", label: "Pagina-URL", uitleg: "Waar de reactie over gaat", verplicht: true },
  { sleutel: "nuttig", label: "Ja/nee-antwoord", uitleg: "Vond de bezoeker wat die zocht?", verplicht: true },
  { sleutel: "toelichting", label: "Toelichting", uitleg: "De open opmerking — voer voor de AI-analyse", verplicht: false },
  { sleutel: "titel", label: "Paginatitel", uitleg: "Optioneel, leest prettiger dan een URL", verplicht: false },
  { sleutel: "datum", label: "Datum", uitleg: "Optioneel", verplicht: false },
];

export default function KolomMappingKiezer({ headers, mapping, onWijzig }: Props) {
  const ontbreekt = VELDEN.filter((veld) => veld.verplicht && !mapping[veld.sleutel]);

  return (
    <section className="rounded-xl border border-rand bg-kaart p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gedempt">Kolommen</h2>
      <p className="mt-1 text-sm text-gedempt">
        {ontbreekt.length > 0
          ? "Kies zelf welke kolom welke betekenis heeft — deze export week af van wat we herkennen."
          : "Automatisch herkend. Klopt er iets niet, pas het hier aan."}
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {VELDEN.map((veld) => (
          <label key={veld.sleutel} className="block text-sm">
            <span className="font-medium">
              {veld.label}
              {veld.verplicht && <span className="text-red-600"> *</span>}
            </span>
            <select
              value={mapping[veld.sleutel] ?? ""}
              onChange={(e) =>
                onWijzig({ ...mapping, [veld.sleutel]: e.target.value === "" ? null : e.target.value })
              }
              className={`mt-1 w-full rounded-lg border bg-white px-2 py-1.5 text-sm ${
                veld.verplicht && !mapping[veld.sleutel] ? "border-red-400" : "border-rand"
              }`}
            >
              <option value="">— geen —</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-gedempt">{veld.uitleg}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
