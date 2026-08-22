"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigerMembre, peut } from "@/lib/auth";
import { tracer } from "@/lib/audit";
import { registre, type ChampDef } from "@/lib/registres";

export type EtatRegistre = { erreur?: string; succes?: string };

/** Accès générique à un délégué Prisma à partir du nom de modèle du registre. */
function modele(nom: string) {
  const delegue = (prisma as unknown as Record<string, unknown>)[nom];
  if (!delegue) throw new Error(`Modèle inconnu : ${nom}`);
  return delegue as {
    create: (a: unknown) => Promise<{ id: string }>;
    update: (a: unknown) => Promise<{ id: string }>;
    delete: (a: unknown) => Promise<unknown>;
    findUnique: (a: unknown) => Promise<Record<string, unknown> | null>;
  };
}

/** Conversion d'une valeur de formulaire vers le type attendu par la base. */
function convertir(champ: ChampDef, brut: FormDataEntryValue | null, membreId: string): unknown {
  const v = brut === null ? "" : String(brut).trim();

  switch (champ.type) {
    case "nombre":
      return v === "" ? 0 : Number(v);
    case "septims":
    case "pourcentage": {
      if (v === "") return 0;
      const n = Math.round(Number(v));
      if (champ.type === "pourcentage") return Math.min(100, Math.max(0, n));
      return n;
    }
    case "date": {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    case "checkbox":
      return v === "on" || v === "true";
    case "membre":
    case "materiau":
    case "metier":
    case "branche":
    case "cercle":
    case "mission":
      if (v) return v;
      return champ.auteur ? membreId : null;
    default:
      return v;
  }
}

export async function actionEnregistrerEntree(
  _etat: EtatRegistre,
  data: FormData,
): Promise<EtatRegistre> {
  const membre = await exigerMembre();
  const cle = String(data.get("_registre") ?? "");
  const id = String(data.get("_id") ?? "");
  const def = registre(cle);
  if (!def) return { erreur: "Registre inconnu." };

  if (!peut(membre, def.droits.creer, def.droits.valider)) {
    return { erreur: "Votre rang ne vous permet pas d'écrire dans ce registre." };
  }

  /*
   * Corriger une entrée existante n'est pas la même chose que d'en créer une.
   * Le droit de création seul ne doit pas permettre de retoucher l'entrée
   * d'un autre — un permis déjà accordé, par exemple. On exige donc soit le
   * droit de validation, soit d'en être l'auteur.
   */
  if (id) {
    const peutValider = peut(membre, def.droits.valider);
    if (!peutValider) {
      if (!def.champAuteur) {
        return {
          erreur: "Seul un gradé peut corriger une entrée de ce registre.",
        };
      }
      const existante = await modele(def.modele).findUnique({ where: { id } });
      if (!existante) return { erreur: "Cette entrée n'existe plus." };
      if (existante[def.champAuteur] !== membre.id) {
        return {
          erreur: "Vous ne pouvez corriger que vos propres entrées. Demandez à un gradé.",
        };
      }
    }
  }

  const valeurs: Record<string, unknown> = {};
  for (const champ of def.champs) {
    const val = convertir(champ, data.get(champ.nom), membre.id);
    if (champ.requis && (val === "" || val === null)) {
      return { erreur: `Le champ « ${champ.label} » est requis.` };
    }
    valeurs[champ.nom] = val;
  }

  try {
    const m = modele(def.modele);
    const entree = id
      ? await m.update({ where: { id }, data: valeurs })
      : await m.create({ data: valeurs });

    await tracer({
      userId: membre.id,
      action: id ? "modification" : "creation",
      entityType: def.modele,
      entityId: entree.id,
      label: `${def.singulier} — ${String(valeurs[def.colonnes[0].champ] ?? "")}`.slice(0, 160),
    });

    revalidatePath(def.chemin);
    revalidatePath("/tableau-de-bord");
    return { succes: id ? "Entrée mise à jour." : `Nouvelle entrée consignée au registre.` };
  } catch (e) {
    console.error(`[registre:${cle}]`, e);
    return { erreur: "L'écriture au registre a échoué. Vérifiez les champs et réessayez." };
  }
}

/** Changement de statut : validation, refus, révocation, clôture. */
export async function actionTransition(data: FormData) {
  const membre = await exigerMembre();
  const cle = String(data.get("_registre") ?? "");
  const id = String(data.get("_id") ?? "");
  const vers = String(data.get("_vers") ?? "");

  const def = registre(cle);
  if (!def) return;

  const transition = def.transitions?.find((t) => t.vers === vers);
  if (!transition || !peut(membre, transition.droit)) return;

  const valeurs: Record<string, unknown> = { [def.champStatut]: vers };
  if (transition.marqueValideur) {
    if (def.champValideur) valeurs[def.champValideur] = membre.id;
    if (def.champValideLe) valeurs[def.champValideLe] = new Date();
  }

  await modele(def.modele).update({ where: { id }, data: valeurs });
  await tracer({
    userId: membre.id,
    action:
      vers.includes("refus") || vers.includes("revoq") || vers.includes("rompu") || vers.includes("annul")
        ? "refus"
        : "validation",
    entityType: def.modele,
    entityId: id,
    label: `${def.singulier} → ${transition.label}`,
  });

  revalidatePath(def.chemin);
  revalidatePath("/tableau-de-bord");
}

export async function actionSupprimerEntree(data: FormData) {
  const membre = await exigerMembre();
  const cle = String(data.get("_registre") ?? "");
  const id = String(data.get("_id") ?? "");
  const def = registre(cle);
  if (!def || !peut(membre, def.droits.valider)) return;

  await modele(def.modele).delete({ where: { id } });
  await tracer({
    userId: membre.id,
    action: "suppression",
    entityType: def.modele,
    entityId: id,
    label: `${def.singulier} supprimé du registre`,
  });
  revalidatePath(def.chemin);
}
