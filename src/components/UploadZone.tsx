"use client";

import { useRef, useState } from "react";

type Props = {
  onBestand: (naam: string, tekst: string) => void;
  onFout: (melding: string) => void;
  bezig: boolean;
};

export default function UploadZone({ onBestand, onFout, bezig }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sleep, setSleep] = useState(false);

  async function verwerk(bestand: File) {
    if (!/\.(csv|tsv|txt)$/i.test(bestand.name)) {
      onFout(
        `"${bestand.name}" is geen CSV-bestand. Exporteer je feedback als CSV (in Excel: Opslaan als > CSV).`,
      );
      return;
    }
    onBestand(bestand.name, await bestand.text());
  }

  async function laadVoorbeeld() {
    try {
      const respons = await fetch("/api/voorbeelddata");
      if (!respons.ok) throw new Error("voorbeelddata niet beschikbaar");
      onBestand("voorbeeld-feedback.csv", await respons.text());
    } catch {
      onFout("De voorbeelddata kon niet worden geladen.");
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setSleep(true);
      }}
      onDragLeave={() => setSleep(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSleep(false);
        const bestand = e.dataTransfer.files?.[0];
        if (bestand) void verwerk(bestand);
      }}
      className={`rounded-xl border-2 border-dashed bg-kaart p-8 text-center transition ${
        sleep ? "border-blue-500 bg-blue-50" : "border-rand"
      }`}
    >
      <p className="text-base font-medium">Sleep hier je feedback-export naartoe</p>
      <p className="mt-1 text-sm text-gedempt">
        Een CSV met per regel één reactie: de pagina-URL en of de bezoeker vond wat die zocht.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          disabled={bezig}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Bestand kiezen
        </button>
        <button
          type="button"
          disabled={bezig}
          onClick={() => void laadVoorbeeld()}
          className="rounded-lg border border-rand px-4 py-2 text-sm font-medium hover:bg-achtergrond disabled:opacity-50"
        >
          Voorbeelddata laden
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.tsv,.txt,text/csv"
        className="hidden"
        onChange={(e) => {
          const bestand = e.target.files?.[0];
          if (bestand) void verwerk(bestand);
          e.target.value = "";
        }}
      />
    </div>
  );
}
