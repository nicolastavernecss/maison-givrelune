import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Embleme, Ornement } from "@/components/ui/Embleme";
import { Icone } from "@/components/ui/Icone";
import { Message } from "@/components/ui/base";
import { discordConfigure, utilisateurCourant } from "@/lib/auth";
import { MAISON } from "@/lib/domain";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const metadata: Metadata = { title: "Connexion" };

const MOTIFS: Record<string, string> = {
  inconnu:
    "Ce compte Discord n'est rattaché à aucun membre de la Maison. Adressez une demande de rôle : un Patriarche vous ouvrira l'accès.",
  refus: "L'autorisation Discord a été refusée ou interrompue.",
  etat: "La demande a expiré. Relancez la connexion Discord.",
  erreur: "Discord n'a pas répondu correctement. Réessayez dans un instant.",
  archive: "Ce compte a été versé aux archives de la Maison.",
};

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ discord?: string }>;
}) {
  if (await utilisateurCourant()) redirect("/tableau-de-bord");
  const { discord } = await searchParams;
  const avecDiscord = discordConfigure();

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_minmax(0,520px)]">
      {/* ── Volet d'ambiance ── */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-or-600/20 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background:
              "radial-gradient(700px 420px at 25% 20%, #2a3d63, transparent 65%), radial-gradient(500px 500px at 80% 80%, #17233d, transparent 70%)",
          }}
        />
        <Link href="/" className="relative flex items-center gap-2 text-xs text-givre-300/70 hover:text-or-300">
          <Icone nom="retour" taille={14} />
          Retour à la présentation
        </Link>

        <div className="relative">
          <Embleme taille={168} className="scintille" />
          <h1 className="titre-imperial mt-8 text-4xl leading-tight text-givre-50">
            Maison
            <br />
            <span className="text-or-300">Givrelune</span>
          </h1>
          <Ornement className="my-6 max-w-md" />
          <p className="recit max-w-md text-givre-200/85 italic">« {MAISON.citations[0]} »</p>
        </div>

        <div className="relative flex items-center gap-6 text-[0.68rem] tracking-[0.28em] text-or-400/70 uppercase">
          {MAISON.valeurs.map((v) => (
            <span key={v}>{v}</span>
          ))}
        </div>
      </aside>

      {/* ── Volet formulaire ── */}
      <section className="flex flex-col justify-center px-6 py-14 sm:px-12">
        <div className="mx-auto w-full max-w-sm animer-monter">
          <div className="mb-8 text-center lg:text-left">
            <div className="mb-5 flex justify-center lg:hidden">
              <Embleme taille={92} />
            </div>
            <p className="sur-titre">Entrée des membres</p>
            <h2 className="titre-imperial mt-1.5 text-2xl text-givre-50">Se présenter au seuil</h2>
            <p className="mt-2 text-sm text-givre-300/70">
              L'accès est réservé aux membres de la Maison. Aucune inscription libre.
            </p>
          </div>

          {discord && MOTIFS[discord] && (
            <div className="mb-5">
              <Message tone="alerte" titre="Connexion Discord">
                {MOTIFS[discord]}
              </Message>
            </div>
          )}

          <FormulaireConnexion />

          {avecDiscord && (
            <>
              <div className="my-6 flex items-center gap-3 text-[0.65rem] tracking-[0.24em] text-givre-300/40 uppercase">
                <span className="h-px flex-1 bg-argent-500/15" />
                ou
                <span className="h-px flex-1 bg-argent-500/15" />
              </div>
              <a
                href="/api/auth/discord"
                className="flex w-full items-center justify-center gap-2.5 rounded-[2px] border border-[#5865F2]/45 bg-[#5865F2]/12 px-4 py-2.5 text-sm text-givre-100 transition-colors hover:border-[#5865F2]/70 hover:bg-[#5865F2]/22"
              >
                <Icone nom="discord" taille={17} />
                Se connecter avec Discord
              </a>
            </>
          )}

          <Ornement className="my-7" />

          <p className="text-center text-xs text-givre-300/60">
            Pas encore des nôtres ?{" "}
            <Link href="/rejoindre" className="text-or-300 underline-offset-4 hover:underline">
              Adresser une demande de rôle
            </Link>
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="mt-8 rounded-[2px] border border-argent-500/15 bg-nuit-950/50 p-3 text-[0.68rem] text-givre-300/55">
              <p className="mb-1 font-semibold text-givre-200/80">Comptes de démonstration</p>
              <p>
                <code className="text-or-300">nicolas.varian</code> (Patriarche) ·{" "}
                <code className="text-or-300">berit.mainsure</code> (Intendant) ·{" "}
                <code className="text-or-300">taga.duriff</code> (Garde-Chasse) ·{" "}
                <code className="text-or-300">grumm</code> (Fils, essai)
              </p>
              <p className="mt-1">
                Mot de passe : <code className="text-or-300">givrelune</code>
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
