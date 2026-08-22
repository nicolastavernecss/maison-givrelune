import type { Metadata, Viewport } from "next";
import { Cinzel, EB_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { MAISON } from "@/lib/domain";

const imperial = Cinzel({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--police-imperial",
  display: "swap",
});

const corps = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--police-corps",
  display: "swap",
});

const recit = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--police-recit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${MAISON.nom} — Hub de la Maison`,
    template: `%s · ${MAISON.nom}`,
  },
  description: `${MAISON.devise} Hub de la Maison Givrelune sur ${MAISON.serveur} : registres, ateliers, cours du marché, commandes et trésorerie.`,
  applicationName: MAISON.nom,
  icons: {
    icon: [{ url: "/embleme.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${imperial.variable} ${corps.variable} ${recit.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
