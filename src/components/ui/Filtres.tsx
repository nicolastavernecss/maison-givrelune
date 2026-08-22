import Link from "next/link";
import { Icone } from "./Icone";

export type ChampFiltre =
  | { type: "recherche"; nom: string; placeholder?: string }
  | { type: "select"; nom: string; label: string; options: { value: string; label: string }[] };

/**
 * Barre de filtres d'un registre.
 * Formulaire GET : l'état vit dans l'URL, donc il se partage, se met en favori
 * et survit au rechargement — sans une ligne de JavaScript.
 */
export function Filtres({
  action,
  champs,
  valeurs,
  total,
  children,
}: {
  action: string;
  champs: ChampFiltre[];
  valeurs: Record<string, string | undefined>;
  total?: number;
  children?: React.ReactNode;
}) {
  const actifs = champs.some((c) => valeurs[c.nom]);

  return (
    <form
      method="get"
      action={action}
      className="mb-4 flex flex-wrap items-end gap-2.5 rounded-[2px] border border-argent-500/12 bg-nuit-900/40 px-3.5 py-3"
    >
      {champs.map((c) =>
        c.type === "recherche" ? (
          <div key={c.nom} className="relative min-w-[190px] flex-1">
            <Icone
              nom="recherche"
              taille={14}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-argent-500"
            />
            <input
              type="search"
              name={c.nom}
              defaultValue={valeurs[c.nom] ?? ""}
              placeholder={c.placeholder ?? "Rechercher…"}
              className="champ !pl-8"
            />
          </div>
        ) : (
          <label key={c.nom} className="min-w-[150px]">
            <span className="mb-1 block text-[0.62rem] tracking-[0.16em] text-givre-300/50 uppercase">
              {c.label}
            </span>
            <select name={c.nom} defaultValue={valeurs[c.nom] ?? ""} className="champ !py-1.5">
              <option value="">Tous</option>
              {c.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ),
      )}

      <button
        type="submit"
        className="inline-flex items-center gap-1.5 rounded-[2px] border border-or-500/35 bg-or-500/12 px-3 py-1.5 text-[0.78rem] text-or-200 transition-colors hover:bg-or-500/22"
      >
        <Icone nom="filtre" taille={13} />
        Filtrer
      </button>

      {actifs && (
        <Link
          href={action}
          className="inline-flex items-center gap-1.5 rounded-[2px] px-2.5 py-1.5 text-[0.75rem] text-givre-300/60 transition-colors hover:text-[#e69a8c]"
        >
          <Icone nom="refuser" taille={12} />
          Réinitialiser
        </Link>
      )}

      {children}

      {total !== undefined && (
        <span className="ml-auto text-[0.72rem] tabular-nums text-givre-300/50">
          {total} entrée{total > 1 ? "s" : ""}
        </span>
      )}
    </form>
  );
}
