/** Eén reactie van een bezoeker op één pagina. */
export type FeedbackItem = {
  /** Genormaliseerde URL van de pagina waarover de reactie gaat. */
  url: string;
  titel?: string;
  datum?: string;
  /** true = "ja, ik vond wat ik zocht", false = "nee", null = onbekend/leeg. */
  nuttig: boolean | null;
  toelichting?: string;
};

/** Alle feedback van één pagina, samengevat tot een score. */
export type PaginaScore = {
  url: string;
  titel: string;
  /** Aantal reacties met een bruikbaar ja/nee-antwoord. */
  totaal: number;
  ja: number;
  nee: number;
  /** Percentage "ja" van alle ja/nee-reacties, afgerond op 1 decimaal. */
  scorePct: number;
  items: FeedbackItem[];
};

/** Welke CSV-kolom welke betekenis heeft. */
export type KolomMapping = {
  url: string;
  nuttig: string;
  toelichting: string | null;
  titel: string | null;
  datum: string | null;
};

/** De streefwaarde uit de strategie: belangrijke content haalt 80%+. */
export const STREEFSCORE = 80;
