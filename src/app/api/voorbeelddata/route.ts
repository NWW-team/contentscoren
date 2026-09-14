import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Serveert het meegeleverde voorbeeldbestand, zodat er maar één kopie in de repo
 * staat: dezelfde die de tests gebruiken.
 */
export async function GET() {
  try {
    const bestand = await readFile(
      path.join(process.cwd(), "data", "voorbeeld-feedback.csv"),
      "utf8",
    );
    return new NextResponse(bestand, {
      headers: { "content-type": "text/csv; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ fout: "Voorbeeldbestand niet gevonden." }, { status: 404 });
  }
}
