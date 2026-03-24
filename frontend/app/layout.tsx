import type { Metadata } from "next";
import { Sora, Manrope } from "next/font/google";

import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-title" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "BI Manutencao | Corretivas",
  description: "Painel de chamados corretivos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${sora.variable} ${manrope.variable}`}>{children}</body>
    </html>
  );
}
