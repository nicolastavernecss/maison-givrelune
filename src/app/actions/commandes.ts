"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigerMembre, peut } from "@/lib/auth";
import { tracer } from "@/lib/audit";
import { PERMISSIONS as P } from "@/lib/domain";
import { enregistrerPiecesJointes, fichiersDe } from "@/lib/fichiers";

export type EtatCommande = { erreur?: string; succes?: string };

const txt = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const ent = (v: FormDataEntryValue | null) => {
  const n = Math.round(Number(String(v ?? "0").replace(",", ".")));
  return Number.isFinite(n) ? n : 0;
};

/* ══════════════════════════════════════════════════════════════
   Commandes  (gabarit réel du Discord — §5.4)
   ══════════════════════════════════════════════════════════════ */

export async function actionCommande(
  _etat: EtatCommande,
  data: FormData,
): Promise<EtatCommande> {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));

  if (!peut(membre, P.ORDER_CREATE, P.ORDER_VALIDATE)) {
    return { erreur: "Vous ne pouvez pas enregistrer de commande." };
  }

  const clientNomRp = txt(data.get("clientNomRp"));
  const objets = txt(data.get("objets"));
  if (!clientNomRp) return { erreur: "Le nom RP du client est requis." };
  if (!objets) return { erreur: "Précisez le ou les objets demandés." };

  const prixConvenu = Math.max(0, ent(data.get("prixConvenu")));
  const acompte = Math.max(0, ent(data.get("acompte")));
  if (acompte > prixConvenu) {
    return { erreur: "L'acompte ne peut pas dépasser le prix convenu." };
  }

  const dateCommande = txt(data.get("dateCommande"));
  const dateLivraison = txt(data.get("dateLivraisonPrevue"));
  const coutMatiere = txt(data.get("coutMatiereEstime"));

  const valeurs = {
    clientNomRp,
    clientMaison: txt(data.get("clientMaison")),
    clientContact: txt(data.get("clientContact")),
    artisanId: txt(data.get("artisanId")) || membre.id,
    metierId: txt(data.get("metierId")) || null,
    objets,
    quantite: Math.max(1, ent(data.get("quantite")) || 1),
    materiauxFournisParClient: data.get("materiauxFournisParClient") === "on",
    materiauxAFournir: txt(data.get("materiauxAFournir")),
    prixConvenu,
    acompte,
    // Le « Reste à payer » du gabarit est calculé, jamais saisi.
    resteAPayer: prixConvenu - acompte,
    dateCommande: dateCommande ? new Date(dateCommande) : new Date(),
    dateLivraisonPrevue: dateLivraison ? new Date(dateLivraison) : null,
    etat: txt(data.get("etat")) || "en_attente",
    observations: txt(data.get("observations")),
    recipeId: txt(data.get("recipeId")) || null,
    coutMatiereEstime: coutMatiere ? Number(coutMatiere.replace(",", ".")) : null,
  };

  const commande = id
    ? await prisma.craftOrder.update({ where: { id }, data: valeurs })
    : await prisma.craftOrder.create({ data: { ...valeurs, createdById: membre.id } });

  const fichiers = fichiersDe(data);
  if (fichiers.length > 0) {
    await enregistrerPiecesJointes(fichiers, { craftOrderId: commande.id }, membre.id);
  }

  await tracer({
    userId: membre.id,
    action: id ? "modification" : "creation",
    entityType: "CraftOrder",
    entityId: commande.id,
    label: `Commande ${clientNomRp} — ${objets}`.slice(0, 160),
    details: `${prixConvenu} Septims, reste ${valeurs.resteAPayer}`,
  });

  revalidatePath("/economie/commandes");
  revalidatePath("/economie/impayes");
  revalidatePath("/tableau-de-bord");
  return { succes: id ? "Commande mise à jour." : "Commande enregistrée." };
}

export async function actionEtatCommande(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const etat = txt(data.get("etat"));

  const commande = await prisma.craftOrder.findUnique({ where: { id } });
  if (!commande) return;

  const sien = commande.artisanId === membre.id || commande.createdById === membre.id;
  if (!sien && !peut(membre, P.ORDER_VALIDATE)) return;

  await prisma.craftOrder.update({ where: { id }, data: { etat } });
  await tracer({
    userId: membre.id,
    action: etat === "annulee" ? "refus" : "validation",
    entityType: "CraftOrder",
    entityId: id,
    label: `Commande ${commande.clientNomRp} → ${etat.replace(/_/g, " ")}`,
  });

  revalidatePath("/economie/commandes");
  revalidatePath("/economie/impayes");
}

/**
 * Enregistre un versement du client. Le reste à payer se recalcule tout seul ;
 * la somme peut être versée au coffre dans la foulée.
 */
export async function actionPaiement(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const montant = ent(data.get("montant"));
  if (montant <= 0) return;

  const commande = await prisma.craftOrder.findUnique({ where: { id } });
  if (!commande) return;

  const sien = commande.artisanId === membre.id || commande.createdById === membre.id;
  if (!sien && !peut(membre, P.ORDER_VALIDATE)) return;

  const acompte = Math.min(commande.prixConvenu, commande.acompte + montant);
  await prisma.craftOrder.update({
    where: { id },
    data: { acompte, resteAPayer: commande.prixConvenu - acompte },
  });

  await tracer({
    userId: membre.id,
    action: "validation",
    entityType: "CraftOrder",
    entityId: id,
    label: `Versement de ${montant} Septims — ${commande.clientNomRp}`,
  });

  // Versement au coffre commun, si le membre en a le droit et l'a demandé.
  if (data.get("verserAuCoffre") === "on" && peut(membre, P.TREASURY_MANAGE)) {
    const coffre = await prisma.treasury.findUnique({ where: { id: "maison" } });
    const solde = (coffre?.septims ?? 0) + montant;
    await prisma.treasury.upsert({
      where: { id: "maison" },
      update: { septims: solde },
      create: { id: "maison", septims: solde },
    });
    await prisma.treasuryMovement.create({
      data: {
        montant,
        motif: `Commande ${commande.clientNomRp} — ${commande.objets}`.slice(0, 200),
        categorie: "commande",
        soldeApres: solde,
        userId: membre.id,
      },
    });
    await tracer({
      userId: membre.id,
      action: "tresorerie",
      entityType: "Treasury",
      label: `+${montant} Septims (commande ${commande.clientNomRp})`,
    });
    revalidatePath("/economie/tresorerie");
  }

  revalidatePath("/economie/commandes");
  revalidatePath("/economie/impayes");
  revalidatePath("/tableau-de-bord");
}

export async function actionSupprimerCommande(data: FormData) {
  const membre = await exigerMembre();
  if (!peut(membre, P.ORDER_VALIDATE)) return;
  const id = txt(data.get("id"));

  await prisma.craftOrder.delete({ where: { id } });
  await tracer({
    userId: membre.id,
    action: "suppression",
    entityType: "CraftOrder",
    entityId: id,
    label: "Commande supprimée",
  });
  revalidatePath("/economie/commandes");
  revalidatePath("/economie/impayes");
}

/* ══════════════════════════════════════════════════════════════
   Trésorerie
   ══════════════════════════════════════════════════════════════ */

export type EtatTresorerie = { erreur?: string; succes?: string };

export async function actionMouvementTresorerie(
  _etat: EtatTresorerie,
  data: FormData,
): Promise<EtatTresorerie> {
  const membre = await exigerMembre();
  if (!peut(membre, P.TREASURY_MANAGE)) {
    return { erreur: "Seuls l'Intendant, les Hauts-Pères et les Patriarches mouvementent le coffre." };
  }

  const sens = txt(data.get("sens")); // entree | sortie
  const montantBrut = Math.abs(ent(data.get("montant")));
  const motif = txt(data.get("motif"));

  if (montantBrut <= 0) return { erreur: "Indiquez un montant supérieur à zéro." };
  if (!motif) return { erreur: "Tout mouvement doit être motivé (règlement §VI)." };

  const montant = sens === "sortie" ? -montantBrut : montantBrut;
  const coffre = await prisma.treasury.findUnique({ where: { id: "maison" } });
  const solde = (coffre?.septims ?? 0) + montant;

  if (solde < 0) return { erreur: "Le coffre ne peut pas passer en négatif." };

  const dateStr = txt(data.get("date"));
  await prisma.treasuryMovement.create({
    data: {
      montant,
      motif: motif.slice(0, 200),
      categorie: txt(data.get("categorie")) || "divers",
      date: dateStr ? new Date(dateStr) : new Date(),
      soldeApres: solde,
      userId: membre.id,
    },
  });

  await prisma.treasury.upsert({
    where: { id: "maison" },
    update: { septims: solde, responsableId: membre.id },
    create: { id: "maison", septims: solde, responsableId: membre.id },
  });

  await tracer({
    userId: membre.id,
    action: "tresorerie",
    entityType: "Treasury",
    label: `${montant > 0 ? "+" : ""}${montant} Septims — ${motif}`.slice(0, 160),
  });

  revalidatePath("/economie/tresorerie");
  revalidatePath("/tableau-de-bord");
  return { succes: `Mouvement consigné. Nouveau solde : ${solde} Septims.` };
}

/** Recalcule la valeur estimée du stock commun au cours du marché. */
export async function actionReevaluerStock() {
  const membre = await exigerMembre();
  if (!peut(membre, P.TREASURY_MANAGE)) return;

  const { coursDuMarche, valoriser } = await import("@/lib/economie");
  const [cours, lignes] = await Promise.all([
    coursDuMarche(),
    prisma.inventoryItem.findMany({
      where: { ownerType: "maison" },
      select: { materialId: true, quantity: true, unitValue: true },
    }),
  ]);

  const prix = new Map([...cours].map(([id, c]) => [id, c.dernier]));
  const valeur = Math.round(valoriser(lignes, prix));

  await prisma.treasury.upsert({
    where: { id: "maison" },
    update: { valeurStock: valeur, responsableId: membre.id },
    create: { id: "maison", valeurStock: valeur, responsableId: membre.id },
  });

  await tracer({
    userId: membre.id,
    action: "tresorerie",
    entityType: "Treasury",
    label: `Stock réévalué à ${valeur} Septims`,
  });
  revalidatePath("/economie/tresorerie");
}
