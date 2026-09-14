"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_SCHRIJFWIJZER_TEKENS } from "@/lib/schrijfwijzer";

const OPSLAGSLEUTEL = "contentscoren.schrijfwijzer";

type Props = {
  waarde: string;
  onWijzig: (tekst: string) => void;
};

/**
 * Laat de redacteur een eigen schrijfwijzer inladen zonder deploy. Die gaat voor
 * op het bestand in de repo en wordt bij elke analyse meegestuurd.
 */
export default function SchrijfwijzerKiezer({ waarde, onWijzig }: Props) {
  const [open, setOpen] = useState(false);
  const [melding, setMelding] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Eenmalig terughalen wat de redacteur eerder inlaadde.
  useEffect(() => {
    try {
      const bewaard = localStorage.getItem(OPSLAGSLEUTEL);
      if (bewaard) onWijzig(bewaard);
    } catch {
      // Privémodus of geblokkeerde opslag: dan werkt het gewoon zonder onthouden.
    }
    // Alleen bij het monteren: hierna is de gebruiker leidend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function bewaar(tekst: string) {
    onWijzig(tekst);
    try {
      if (tekst.trim() === "") localStorage.removeItem(OPSLAGSLEUTEL);
      else localStorage.setItem(OPSLAGSLEUTEL, tekst);
    } catch {
      // Niet kunnen onthouden is geen reden om de analyse te blokkeren.
    }
  }

  async function laadBestand(bestand: File) {
    const tekst = await bestand.text();
    if (tekst.length > MAX_SCHRIJFWIJZER_TEKENS) {
      setMelding(
        `Dit bestand is langer dan ${MAX_SCHRIJFWIJZER_TEKENS.toLocaleString("nl-NL")} tekens en wordt ingekort.`,
      );
    } else {
      setMelding(null);
    }
    bewaar(tekst);
    setOpen(true);
  }

  const eigen = waarde.trim() !== "";

  return (
    <section className="rounded-xl border border-rand bg-kaart p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gedempt">Schrijfwijzer</h2>
          <p className="mt-1 text-sm text-gedempt">
            {eigen
              ? "De AI toetst aan je eigen schrijfwijzer en noemt per suggestie welke richtlijn die volgt."
              : "De AI toetst aan de schrijfwijzer in de repo (content/schrijfwijzer.md). Laad hier je eigen versie in om die te overrulen."}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-rand px-3 py-1.5 text-sm font-medium hover:bg-achtergrond"
          >
            Bestand laden
          </button>
          <button
            type="button"
            onClick={() => setOpen((huidig) => !huidig)}
            className="rounded-lg border border-rand px-3 py-1.5 text-sm font-medium hover:bg-achtergrond"
          >
            {open ? "Verbergen" : eigen ? "Bekijken" : "Plakken"}
          </button>
        </div>
      </div>

      {melding && <p className="mt-3 text-sm text-amber-800">{melding}</p>}

      {open && (
        <div className="mt-4">
          <textarea
            value={waarde}
            onChange={(e) => bewaar(e.target.value)}
            rows={12}
            placeholder="Plak hier de schrijfwijzer of dienstverleningsstrategie van je redactie…"
            className="w-full rounded-lg border border-rand bg-white p-3 font-mono text-xs leading-relaxed"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-gedempt">
            <span>
              {waarde.length.toLocaleString("nl-NL")} van {MAX_SCHRIJFWIJZER_TEKENS.toLocaleString("nl-NL")} tekens
              — wordt in deze browser onthouden, niet op de server opgeslagen.
            </span>
            {eigen && (
              <button
                type="button"
                onClick={() => {
                  bewaar("");
                  setMelding(null);
                }}
                className="font-medium text-blue-700 hover:underline"
              >
                Wissen en het bestand uit de repo gebruiken
              </button>
            )}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".md,.txt,.markdown,text/plain,text/markdown"
        className="hidden"
        onChange={(e) => {
          const bestand = e.target.files?.[0];
          if (bestand) void laadBestand(bestand);
          e.target.value = "";
        }}
      />
    </section>
  );
}
