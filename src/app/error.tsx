"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Embleme, Ornement } from "@/components/ui/Embleme";

export default function Erreur({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[givrelune]", error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-6 py-20">
      <div className="max-w-lg text-center">
        <Embleme taille={110} className="mx-auto opacity-70" />
        <p className="sur-titre mt-8">Le fourneau a craqué</p>
        <h1 className="titre-imperial mt-2 text-3xl text-givre-50">Quelque chose a échoué</h1>
        <Ornement className="my-6" />
        <p className="text-sm leading-relaxed text-givre-300/75">
          L'opération n'a pas abouti. Réessayez ; si cela persiste, ouvrez un ticket auprès du
          Sénéchal en précisant ce que vous faisiez.
        </p>
        {error.digest && (
          <p className="mt-3 text-[0.7rem] text-givre-300/40">
            Référence technique : <code className="text-or-300/70">{error.digest}</code>
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-[2px] border border-or-300/50 bg-gradient-to-b from-or-400 to-or-600 px-4 py-2 text-[0.84rem] font-semibold text-nuit-950 transition-all hover:from-or-300 hover:to-or-500"
          >
            Réessayer
          </button>
          <Link
            href="/tableau-de-bord"
            className="rounded-[2px] border border-argent-500/25 bg-nuit-700/60 px-4 py-2 text-[0.84rem] text-givre-100 transition-colors hover:bg-nuit-600/70"
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </main>
  );
}
