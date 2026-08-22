import Link from "next/link";
import type { ReactNode } from "react";
import { Vide } from "./base";
import type { NomIcone } from "./Icone";

export type Colonne<T> = {
  cle: string;
  entete: ReactNode;
  rendu: (item: T) => ReactNode;
  /** Colonne mise en avant : sert de titre sur la vue mobile. */
  principal?: boolean;
  /** Masquée sur mobile (la carte n'affiche que l'essentiel). */
  masquerMobile?: boolean;
  numerique?: boolean;
  largeur?: string;
};

/**
 * Tableau de registre. Sur écran étroit, chaque ligne devient une carte
 * lisible : le cahier des charges impose que les données restent lisibles
 * sur mobile.
 */
export function Tableau<T>({
  colonnes,
  donnees,
  cle,
  lien,
  vide,
  videIcone,
  videTexte,
  actions,
}: {
  colonnes: Colonne<T>[];
  donnees: T[];
  cle: (item: T) => string;
  lien?: (item: T) => string | null;
  vide?: string;
  videIcone?: NomIcone;
  videTexte?: ReactNode;
  actions?: (item: T) => ReactNode;
}) {
  if (donnees.length === 0) {
    return <Vide titre={vide ?? "Aucune entrée"} texte={videTexte} icone={videIcone} />;
  }

  const principal = colonnes.find((c) => c.principal) ?? colonnes[0];
  const secondaires = colonnes.filter((c) => c !== principal);

  return (
    <>
      {/* ── Écrans larges : tableau ── */}
      <div className="hidden overflow-x-auto md:block">
        <table className="tableau">
          <thead>
            <tr>
              {colonnes.map((c) => (
                <th key={c.cle} style={c.largeur ? { width: c.largeur } : undefined}
                    className={c.numerique ? "!text-right" : ""}>
                  {c.entete}
                </th>
              ))}
              {actions && <th className="!text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {donnees.map((item) => {
              const href = lien?.(item);
              return (
                <tr key={cle(item)} className="group">
                  {colonnes.map((c, i) => (
                    <td key={c.cle} className={c.numerique ? "text-right tabular-nums" : ""}>
                      {i === 0 && href ? (
                        <Link
                          href={href}
                          className="text-givre-50 transition-colors hover:text-or-300"
                        >
                          {c.rendu(item)}
                        </Link>
                      ) : (
                        c.rendu(item)
                      )}
                    </td>
                  ))}
                  {actions && (
                    <td className="text-right">
                      <div className="flex justify-end gap-1.5">{actions(item)}</div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile : cartes ── */}
      <ul className="divide-y divide-argent-500/10 md:hidden">
        {donnees.map((item) => {
          const href = lien?.(item);
          const titre = principal.rendu(item);
          return (
            <li key={cle(item)} className="px-4 py-3.5">
              <div className="mb-2 text-[0.9rem] font-medium text-givre-50">
                {href ? (
                  <Link href={href} className="hover:text-or-300">
                    {titre}
                  </Link>
                ) : (
                  titre
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                {secondaires
                  .filter((c) => !c.masquerMobile)
                  .map((c) => (
                    <div key={c.cle} className="min-w-0">
                      <dt className="text-[0.6rem] uppercase tracking-[0.16em] text-givre-300/45">
                        {c.entete}
                      </dt>
                      <dd className="truncate text-[0.8rem] text-givre-100">{c.rendu(item)}</dd>
                    </div>
                  ))}
              </dl>
              {actions && <div className="mt-2.5 flex flex-wrap gap-1.5">{actions(item)}</div>}
            </li>
          );
        })}
      </ul>
    </>
  );
}
