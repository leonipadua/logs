import type { Metadata } from "next";
import { Instrument_Serif, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const fontDisplay = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sabre Logs — Acompanhamento de projeto",
  description:
    "Painel de acompanhamento para clientes da Sabre: progresso do agente de IA contratado, em tempo real.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  );
}
