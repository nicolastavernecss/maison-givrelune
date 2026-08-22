import Link from "next/link";
import { Embleme, Ornement } from "@/components/ui/Embleme";

export default function Introuvable() {
  return (
    <main className="grid min-h-screen place-items-center px-6 py-20">
      <div className="max-w-md text-center">
        <Embleme taille={110} className="mx-auto opacity-70" />
        <p className="sur-titre mt-8">Sentier perdu</p>
        <h1 className="titre-imperial mt-2 text-3xl text-givre-50">Cette page n'existe pas</h1>
        <Ornement className="my-6" />
        <p className="text-sm leading-relaxed text-givre-300/75">
          Le givre a recouvert ce chemin. Peut-être l'adresse a-t-elle changé, peut-être n'a-t-elle
          jamais existé.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/tableau-de-bord"
            className="rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-4 py-2 text-[0.84rem] font-semibold text-nuit-950 transition-all hover:from-or-300 hover:to-or-500"
          >
            Retour au tableau de bord
          </Link>
          <Link
            href="/"
            className="rounded-[2px] border border-argent-500/25 bg-nuit-700/60 px-4 py-2 text-[0.84rem] text-givre-100 transition-colors hover:bg-nuit-600/70"
          >
            Page d'accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
