import { Ornement } from "@/components/ui/Embleme";

/**
 * Squelette affiché pendant qu'une page se charge.
 * Next.js le montre instantanément au clic : l'ancienne page ne reste plus
 * figée, on voit tout de suite que la navigation est partie.
 */
function Barre({ largeur, hauteur = 12 }: { largeur: string; hauteur?: number }) {
  return (
    <span
      className="block animate-pulse rounded-[2px] bg-argent-500/12"
      style={{ width: largeur, height: hauteur }}
    />
  );
}

export default function Chargement() {
  return (
    <div className="animer-apparaitre" aria-busy="true" aria-live="polite">
      <span className="sr-only">Chargement de la page…</span>

      {/* En-tête */}
      <header className="mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-3">
            <Barre largeur="120px" hauteur={9} />
            <Barre largeur="280px" hauteur={26} />
            <Barre largeur="min(460px, 70vw)" hauteur={11} />
          </div>
          <div className="flex gap-2">
            <Barre largeur="118px" hauteur={30} />
            <Barre largeur="96px" hauteur={30} />
          </div>
        </div>
        <Ornement className="mt-5 opacity-40" />
      </header>

      {/* Chiffres clés */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="carte space-y-2.5 p-3.5">
            <Barre largeur="60%" hauteur={8} />
            <Barre largeur="45%" hauteur={20} />
            <Barre largeur="75%" hauteur={8} />
          </div>
        ))}
      </div>

      {/* Corps */}
      <div className="carte carte-texture overflow-hidden">
        <div className="flex items-center gap-3 border-b border-argent-500/12 bg-nuit-900/40 px-4 py-3">
          <span className="size-8 shrink-0 animate-pulse rounded-[2px] bg-argent-500/12" />
          <Barre largeur="180px" hauteur={13} />
        </div>
        <ul className="divide-y divide-argent-500/10">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li
              key={i}
              className="flex items-center gap-4 px-4 py-3.5"
              style={{ opacity: 1 - i * 0.13 }}
            >
              <Barre largeur="26%" />
              <Barre largeur="18%" />
              <span className="flex-1" />
              <Barre largeur="10%" />
              <Barre largeur="72px" hauteur={18} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
