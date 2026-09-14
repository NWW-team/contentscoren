"use client";

import { afstandTotStreef } from "@/lib/score";
import { STREEFSCORE, type PaginaScore } from "@/lib/types";

type Props = {
  paginas: PaginaScore[];
  geselecteerd: string | null;
  onSelecteer: (url: string) => void;
  minReacties: number;
};

function kleurVoorScore(score: number): string {
  if (score >= STREEFSCORE) return "bg-green-100 text-green-900";
  if (score >= 60) return "bg-amber-100 text-amber-900";
  return "bg-red-100 text-red-900";
}

export default function ScoreTabel({ paginas, geselecteerd, onSelecteer, minReacties }: Props) {
  if (paginas.length === 0) {
    return (
      <section className="rounded-xl border border-rand bg-kaart p-5">
        <p className="text-sm text-gedempt">
          Geen enkele pagina heeft minstens {minReacties} ja/nee-reacties. Verlaag de drempel of gebruik
          een export over een langere periode.
        </p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-rand bg-kaart">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-rand bg-achtergrond text-xs uppercase tracking-wide text-gedempt">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Pagina</th>
              <th className="px-4 py-3 text-right font-semibold">Score</th>
              <th className="px-4 py-3 text-right font-semibold">Reacties</th>
              <th className="px-4 py-3 text-right font-semibold">Tot {STREEFSCORE}%</th>
            </tr>
          </thead>
          <tbody>
            {paginas.map((pagina, index) => {
              const actief = pagina.url === geselecteerd;
              return (
                <tr
                  key={pagina.url}
                  onClick={() => onSelecteer(pagina.url)}
                  className={`cursor-pointer border-b border-rand last:border-0 ${
                    actief ? "bg-blue-50" : "hover:bg-achtergrond"
                  }`}
                >
                  <td className="px-4 py-3 text-gedempt">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{pagina.titel}</div>
                    {pagina.titel !== pagina.url && (
                      <div className="text-xs text-gedempt">{pagina.url}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`inline-block rounded-md px-2 py-1 font-semibold tabular-nums ${kleurVoorScore(
                        pagina.scorePct,
                      )}`}
                    >
                      {pagina.scorePct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gedempt">
                    {pagina.totaal}
                    <span className="text-xs"> ({pagina.nee} nee)</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-gedempt">
                    {afstandTotStreef(pagina) === 0 ? "gehaald" : `${afstandTotStreef(pagina)} pp`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
