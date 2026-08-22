import Link from "next/link";
import { EmblemeCompact, Ornement } from "@/components/ui/Embleme";
import { Icone } from "@/components/ui/Icone";
import { LienBouton } from "@/components/ui/base";
import { utilisateurCourant } from "@/lib/auth";
import { MAISON } from "@/lib/domain";

const LIENS = [
  { href: "/", label: "La Maison" },
  { href: "/histoire", label: "Histoire" },
  { href: "/reglement", label: "Règlement" },
  { href: "/rejoindre", label: "Nous rejoindre" },
];

export default async function LayoutSite({ children }: { children: React.ReactNode }) {
  const membre = await utilisateurCourant();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-argent-500/12 bg-nuit-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <EmblemeCompact taille={30} />
            <span className="titre-imperial text-[0.92rem] tracking-[0.14em] text-givre-50">
              GIVRELUNE
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {LIENS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-[2px] px-3 py-1.5 text-[0.82rem] text-givre-200/75 transition-colors hover:bg-nuit-700/50 hover:text-givre-50"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            {membre ? (
              <LienBouton href="/tableau-de-bord" variante="or" taille="sm" icone="tableau">
                Mon espace
              </LienBouton>
            ) : (
              <LienBouton href="/connexion" variante="or" taille="sm" icone="loup">
                Connexion
              </LienBouton>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-argent-500/12 bg-nuit-950/60">
        <div className="mx-auto max-w-6xl px-5 py-12">
          <div className="grid gap-10 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2.5">
                <EmblemeCompact taille={28} />
                <span className="titre-imperial text-sm tracking-[0.12em] text-givre-50">
                  MAISON GIVRELUNE
                </span>
              </div>
              <p className="recit mt-3 text-[0.92rem] text-givre-300/70 italic">
                « {MAISON.devise} »
              </p>
              <p className="mt-3 text-xs text-givre-300/50">
                {MAISON.serveur} — Skyrim SE multijoueur, économie entièrement joueur.
              </p>
            </div>

            <div>
              <p className="sur-titre mb-3">La Maison</p>
              <ul className="space-y-1.5 text-[0.82rem] text-givre-300/70">
                {LIENS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-or-300">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="sur-titre mb-3">Valeurs</p>
              <ul className="space-y-1.5 text-[0.82rem] text-givre-300/70">
                {MAISON.valeurs.map((v) => (
                  <li key={v} className="flex items-center gap-2">
                    <Icone nom="givre" taille={12} className="text-or-500/60" />
                    {v}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-givre-300/45">
                Monnaie de la Maison : le {MAISON.monnaie}.
              </p>
            </div>
          </div>

          <Ornement className="mt-10" />
          <p className="mt-5 text-center text-[0.7rem] text-givre-300/40">
            Ce hub complète le Discord de la Maison — il ne le remplace pas.
          </p>
        </div>
      </footer>
    </div>
  );
}
