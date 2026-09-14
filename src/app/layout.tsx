import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contentscoren",
  description:
    "Vind de slechtst scorende pagina's uit je webfeedback en krijg per pagina de oorzaken en een verbetervoorstel.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl">
      <body className="antialiased">{children}</body>
    </html>
  );
}
