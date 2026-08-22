"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigerMembre, peut } from "@/lib/auth";
import { tracer } from "@/lib/audit";
import { PERMISSIONS as P } from "@/lib/domain";
import { coursDuMarche } from "@/lib/economie";
import { calculerRevenu, prixMetier } from "@/lib/production";
import { enregistrerPiecesJointes, fichiersDe } from "@/lib/fichiers";

export type EtatEco = { erreur?: string; succes?: string };

const nb = (v: FormDataEntryValue | null, defaut = 0) => {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : defaut;
};
const txt = (v: FormDataEntryValue | null) => String(v ?? "").trim();

/* ══════════════════════════════════════════════════════════════
   Cours du marché
   ══════════════════════════════════════════════════════════════ */

export async function actionRelevePrix(_etat: EtatEco, data: FormData): Promise<EtatEco> {
  const membre = await exigerMembre();
  if (!peut(membre, P.MARKET_CREATE)) return { erreur: "Vous ne pouvez pas relever de prix." };

  const materialId = txt(data.get("materialId"));
  const price = nb(data.get("price"));
  if (!materialId) return { erreur: "Choisissez une matière." };
  if (price <= 0) return { erreur: "Le prix doit être supérieur à zéro." };

  const dateStr = txt(data.get("date"));
  await prisma.marketPrice.create({
    data: {
      materialId,
      price,
      date: dateStr ? new Date(dateStr) : new Date(),
      source: txt(data.get("source")).slice(0, 120),
      note: txt(data.get("note")).slice(0, 400),
      memberId: membre.id,
    },
  });

  const matiere = await prisma.material.findUnique({ where: { id: materialId } });
  await tracer({
    userId: membre.id,
    action: "creation",
    entityType: "MarketPrice",
    entityId: materialId,
    label: `Relevé : ${matiere?.label} à ${price} Septims`,
  });

  revalidatePath("/economie/cours-du-marche");
  revalidatePath(`/economie/cours-du-marche/${matiere?.key ?? ""}`);
  return { succes: `Cours de ${matiere?.label ?? "la matière"} relevé à ${price} Septims.` };
}

export async function actionSupprimerReleve(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const releve = await prisma.marketPrice.findUnique({ where: { id } });
  if (!releve) return;
  // Son propre relevé, ou un gradé qui corrige le registre.
  if (releve.memberId !== membre.id && !peut(membre, P.MARKET_MANAGE)) return;

  await prisma.marketPrice.delete({ where: { id } });
  revalidatePath("/economie/cours-du-marche");
}

/* ══════════════════════════════════════════════════════════════
   Référentiel des matières
   ══════════════════════════════════════════════════════════════ */

export async function actionMatiere(_etat: EtatEco, data: FormData): Promise<EtatEco> {
  const membre = await exigerMembre();
  if (!peut(membre, P.MATERIAL_MANAGE)) return { erreur: "Réservé à l'Intendant et aux gradés." };

  const id = txt(data.get("id"));
  const label = txt(data.get("label"));
  if (!label) return { erreur: "Le libellé est requis." };

  const cle =
    txt(data.get("key")) ||
    label
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const valeurs = {
    label,
    category: txt(data.get("category")) || "Produits finis",
    subcategory: txt(data.get("subcategory")),
    state: txt(data.get("state")) || "brut",
    unit: txt(data.get("unit")) || "unité",
    description: txt(data.get("description")),
    isCraftable: data.get("isCraftable") === "on",
  };

  try {
    if (id) {
      await prisma.material.update({ where: { id }, data: valeurs });
    } else {
      const existe = await prisma.material.findUnique({ where: { key: cle } });
      if (existe) return { erreur: `La clé « ${cle} » est déjà utilisée par « ${existe.label} ».` };
      await prisma.material.create({ data: { ...valeurs, key: cle } });
    }
  } catch {
    return { erreur: "Enregistrement impossible. Vérifiez la clé, elle doit être unique." };
  }

  await tracer({
    userId: membre.id,
    action: id ? "modification" : "creation",
    entityType: "Material",
    label: `Matière « ${label} »`,
  });
  revalidatePath("/economie/matieres");
  return { succes: id ? "Matière mise à jour." : "Matière ajoutée au référentiel." };
}

export async function actionSupprimerMatiere(data: FormData) {
  const membre = await exigerMembre();
  if (!peut(membre, P.MATERIAL_MANAGE)) return;
  const id = txt(data.get("id"));

  const [recettes, lignes] = await Promise.all([
    prisma.recipeItem.count({ where: { materialId: id } }),
    prisma.inventoryItem.count({ where: { materialId: id } }),
  ]);
  if (recettes > 0 || lignes > 0) return; // matière encore utilisée : on ne supprime pas

  await prisma.material.delete({ where: { id } });
  revalidatePath("/economie/matieres");
}

/* ══════════════════════════════════════════════════════════════
   Inventaires (stock commun, stash personnel, stock de métier)
   ══════════════════════════════════════════════════════════════ */

async function autoriseInventaire(
  membre: Awaited<ReturnType<typeof exigerMembre>>,
  ownerType: string,
  ownerUserId?: string | null,
) {
  if (ownerType === "maison") return peut(membre, P.INVENTORY_HOUSE_MANAGE);
  if (ownerType === "membre") return ownerUserId === membre.id || peut(membre, P.INVENTORY_HOUSE_MANAGE);
  if (ownerType === "metier") return peut(membre, P.INVENTORY_HOUSE_MANAGE, P.RECIPE_MANAGE, P.INVENTORY_OWN);
  return false;
}

export async function actionLigneInventaire(_etat: EtatEco, data: FormData): Promise<EtatEco> {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const ownerType = txt(data.get("ownerType")) || "membre";
  const ownerUserId = ownerType === "membre" ? txt(data.get("ownerUserId")) || membre.id : null;
  const ownerMetierId = ownerType === "metier" ? txt(data.get("ownerMetierId")) || null : null;

  if (!(await autoriseInventaire(membre, ownerType, ownerUserId))) {
    return { erreur: "Vous n'avez pas le droit de modifier cet inventaire." };
  }

  const materialId = txt(data.get("materialId")) || null;
  const customLabel = txt(data.get("customLabel"));
  if (!materialId && !customLabel) {
    return { erreur: "Choisissez une matière du référentiel ou donnez un libellé libre." };
  }

  const matiere = materialId
    ? await prisma.material.findUnique({ where: { id: materialId } })
    : null;

  const quantite = nb(data.get("quantity"));
  const valeurs = {
    ownerType,
    ownerUserId,
    ownerMetierId,
    materialId,
    customLabel,
    category: txt(data.get("category")) || matiere?.category || "",
    state: txt(data.get("state")) || matiere?.state || "",
    unit: txt(data.get("unit")) || matiere?.unit || "unité",
    quantity: quantite,
    unitValue: data.get("unitValue") ? nb(data.get("unitValue")) : null,
    seuilBas: data.get("seuilBas") ? nb(data.get("seuilBas")) : null,
    notes: txt(data.get("notes")).slice(0, 1000),
  };

  const ancienne = id ? await prisma.inventoryItem.findUnique({ where: { id } }) : null;
  const ligne = id
    ? await prisma.inventoryItem.update({ where: { id }, data: valeurs })
    : await prisma.inventoryItem.create({ data: valeurs });

  // Tout écart de quantité laisse une trace dans l'historique des mouvements.
  const delta = quantite - (ancienne?.quantity ?? 0);
  if (delta !== 0) {
    await prisma.inventoryMovement.create({
      data: {
        inventoryItemId: ligne.id,
        ownerType,
        materialId,
        label: matiere?.label ?? customLabel,
        delta,
        reason: txt(data.get("motif")) || (id ? "Correction d'inventaire" : "Saisie initiale"),
        userId: membre.id,
      },
    });
  }

  const fichiers = fichiersDe(data);
  if (fichiers.length > 0) {
    await enregistrerPiecesJointes(fichiers, { inventoryItemId: ligne.id }, membre.id);
  }

  if (ownerType === "maison") {
    await tracer({
      userId: membre.id,
      action: "stock",
      entityType: "InventoryItem",
      entityId: ligne.id,
      label: `${matiere?.label ?? customLabel} : ${delta > 0 ? "+" : ""}${delta}`,
      details: valeurs.notes,
    });
  }

  revalidatePath("/economie/stocks");
  revalidatePath("/economie/mon-stash");
  revalidatePath("/economie/ateliers");
  return { succes: id ? "Ligne mise à jour." : "Ligne ajoutée à l'inventaire." };
}

/** Entrée/sortie rapide sans passer par le formulaire complet. */
export async function actionMouvementStock(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const delta = nb(data.get("delta"));
  if (!id || delta === 0) return;

  const ligne = await prisma.inventoryItem.findUnique({
    where: { id },
    include: { material: true },
  });
  if (!ligne) return;
  if (!(await autoriseInventaire(membre, ligne.ownerType, ligne.ownerUserId))) return;

  const nouvelle = Math.max(0, ligne.quantity + delta);
  await prisma.inventoryItem.update({ where: { id }, data: { quantity: nouvelle } });
  await prisma.inventoryMovement.create({
    data: {
      inventoryItemId: id,
      ownerType: ligne.ownerType,
      materialId: ligne.materialId,
      label: ligne.material?.label ?? ligne.customLabel,
      delta: nouvelle - ligne.quantity,
      reason: txt(data.get("reason")) || (delta > 0 ? "Entrée" : "Sortie"),
      userId: membre.id,
    },
  });

  if (ligne.ownerType === "maison") {
    await tracer({
      userId: membre.id,
      action: "stock",
      entityType: "InventoryItem",
      entityId: id,
      label: `${ligne.material?.label ?? ligne.customLabel} : ${delta > 0 ? "+" : ""}${delta}`,
    });
  }

  revalidatePath("/economie/stocks");
  revalidatePath("/economie/mon-stash");
}

export async function actionSupprimerLigneInventaire(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const ligne = await prisma.inventoryItem.findUnique({ where: { id } });
  if (!ligne) return;
  if (!(await autoriseInventaire(membre, ligne.ownerType, ligne.ownerUserId))) return;

  await prisma.inventoryItem.delete({ where: { id } });
  revalidatePath("/economie/stocks");
  revalidatePath("/economie/mon-stash");
}

/* ══════════════════════════════════════════════════════════════
   Recettes d'atelier
   ══════════════════════════════════════════════════════════════ */

export async function actionRecette(_etat: EtatEco, data: FormData): Promise<EtatEco> {
  const membre = await exigerMembre();
  if (!peut(membre, P.RECIPE_MANAGE)) {
    return { erreur: "Seuls les maîtres du métier et les gradés éditent les recettes." };
  }

  const id = txt(data.get("id"));
  const label = txt(data.get("label"));
  const metierId = txt(data.get("metierId"));
  const outputMaterialId = txt(data.get("outputMaterialId"));

  if (!label) return { erreur: "Donnez un nom à la recette." };
  if (!metierId) return { erreur: "Rattachez la recette à un métier." };
  if (!outputMaterialId) return { erreur: "Indiquez ce que la recette produit." };

  const composants = data
    .getAll("itemMaterialId")
    .map((v, i) => ({
      materialId: String(v),
      quantity: nb(data.getAll("itemQuantity")[i], 1),
    }))
    .filter((c) => c.materialId && c.quantity > 0);

  if (composants.length === 0) return { erreur: "Une recette demande au moins un composant." };

  const valeurs = {
    label,
    metierId,
    outputMaterialId,
    outputQty: Math.max(1, Math.round(nb(data.get("outputQty"), 1))),
    station: txt(data.get("station")),
    isChain: data.get("isChain") === "on",
    description: txt(data.get("description")),
    notes: txt(data.get("notes")),
  };

  const recette = id
    ? await prisma.recipe.update({ where: { id }, data: valeurs })
    : await prisma.recipe.create({ data: { ...valeurs, createdById: membre.id } });

  await prisma.recipeItem.deleteMany({ where: { recipeId: recette.id } });
  await prisma.recipeItem.createMany({
    data: composants.map((c) => ({ ...c, recipeId: recette.id })),
  });

  const fichiers = fichiersDe(data);
  if (fichiers.length > 0) {
    await enregistrerPiecesJointes(fichiers, { recipeId: recette.id }, membre.id);
  }

  // La matière produite devient fabricable dans le référentiel.
  await prisma.material.update({ where: { id: outputMaterialId }, data: { isCraftable: true } });

  await tracer({
    userId: membre.id,
    action: id ? "modification" : "creation",
    entityType: "Recipe",
    entityId: recette.id,
    label: `Recette « ${label} »`,
  });

  const metier = await prisma.metier.findUnique({ where: { id: metierId } });
  revalidatePath(`/economie/ateliers/${metier?.key ?? ""}`);
  revalidatePath("/economie/ateliers");
  return { succes: id ? "Recette mise à jour." : "Recette ajoutée à la bibliothèque." };
}

/* ══════════════════════════════════════════════════════════════
   Fabrication — l'atelier consomme le stock et y range le produit
   ══════════════════════════════════════════════════════════════ */

export type EtatFabrication = {
  erreur?: string;
  succes?: string;
  manquants?: { label: string; requis: number; dispo: number; unite: string }[];
  revenu?: { brut: number; taxe: number; net: number; benefice: number };
};

/**
 * Fabrique une recette : déduit les composants du stock choisi, y ajoute
 * l'objet produit, et consigne chaque mouvement. Tout se fait en une seule
 * transaction — soit la fabrication passe entièrement, soit rien ne bouge.
 */
export async function actionFabriquer(
  _etat: EtatFabrication,
  data: FormData,
): Promise<EtatFabrication> {
  const membre = await exigerMembre();

  const recipeId = txt(data.get("recipeId"));
  const source = txt(data.get("source")) === "maison" ? "maison" : "membre";
  const fois = Math.max(1, Math.round(nb(data.get("fois"), 1)));

  if (source === "maison" && !peut(membre, P.INVENTORY_HOUSE_MANAGE)) {
    return { erreur: "Puiser dans le stock commun demande l'accord de l'Intendant." };
  }
  if (source === "membre" && !peut(membre, P.INVENTORY_OWN)) {
    return { erreur: "Vous ne tenez pas de stash." };
  }

  const recette = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: { items: { include: { material: true } }, outputMaterial: true, metier: true },
  });
  if (!recette) return { erreur: "Recette introuvable." };
  if (recette.items.length === 0) return { erreur: "Cette recette n'a aucun composant." };

  const ouStocke =
    source === "maison"
      ? { ownerType: "maison", ownerUserId: null }
      : { ownerType: "membre", ownerUserId: membre.id };

  // ── Ce que l'on a sous la main
  const lignes = await prisma.inventoryItem.findMany({
    where: {
      ownerType: ouStocke.ownerType,
      ...(ouStocke.ownerUserId ? { ownerUserId: ouStocke.ownerUserId } : {}),
      materialId: { in: recette.items.map((i) => i.materialId) },
    },
  });
  const dispoParMatiere = new Map<string, { id: string; quantity: number }[]>();
  for (const l of lignes) {
    if (!l.materialId) continue;
    const liste = dispoParMatiere.get(l.materialId) ?? [];
    liste.push({ id: l.id, quantity: l.quantity });
    dispoParMatiere.set(l.materialId, liste);
  }

  // ── Vérification avant de toucher quoi que ce soit
  const manquants: NonNullable<EtatFabrication["manquants"]> = [];
  for (const item of recette.items) {
    const requis = item.quantity * fois;
    const dispo = (dispoParMatiere.get(item.materialId) ?? []).reduce(
      (s, l) => s + l.quantity,
      0,
    );
    if (dispo < requis) {
      manquants.push({
        label: item.material.label,
        requis,
        dispo,
        unite: item.material.unit,
      });
    }
  }
  if (manquants.length > 0) {
    return {
      erreur:
        source === "maison"
          ? "Le stock commun ne suffit pas pour cette fabrication."
          : "Votre stash ne suffit pas pour cette fabrication.",
      manquants,
    };
  }

  const produit = recette.outputQty * fois;

  // ── Chiffrage : ce que ça coûte au métier, ce que ça rapporte au cours
  const [prixPropres, cours] = await Promise.all([
    prixMetier(recette.metierId),
    coursDuMarche(),
  ]);
  const prixDe = (materialId: string) =>
    prixPropres.get(materialId) ?? cours.get(materialId)?.dernier ?? 0;

  const coutMatiere = recette.items.reduce(
    (s, i) => s + i.quantity * fois * prixDe(i.materialId),
    0,
  );
  const prixUnitaire = prixDe(recette.outputMaterialId);
  const revenu = calculerRevenu(produit, prixUnitaire);
  const benefice = Math.round(revenu.net - coutMatiere);

  await prisma.$transaction(async (tx) => {
    // 1. Consommer les composants
    for (const item of recette.items) {
      let reste = item.quantity * fois;
      for (const ligne of dispoParMatiere.get(item.materialId) ?? []) {
        if (reste <= 0) break;
        const pris = Math.min(ligne.quantity, reste);
        reste -= pris;

        await tx.inventoryItem.update({
          where: { id: ligne.id },
          data: { quantity: ligne.quantity - pris },
        });
        await tx.inventoryMovement.create({
          data: {
            inventoryItemId: ligne.id,
            ownerType: ouStocke.ownerType,
            materialId: item.materialId,
            label: item.material.label,
            delta: -pris,
            reason: `Fabrication : ${recette.label}${fois > 1 ? ` ×${fois}` : ""}`,
            userId: membre.id,
          },
        });
      }
    }

    // 2. Ranger le produit dans le même stock
    const existante = await tx.inventoryItem.findFirst({
      where: {
        ownerType: ouStocke.ownerType,
        ...(ouStocke.ownerUserId ? { ownerUserId: ouStocke.ownerUserId } : {}),
        materialId: recette.outputMaterialId,
      },
    });

    const cible = existante
      ? await tx.inventoryItem.update({
          where: { id: existante.id },
          data: { quantity: existante.quantity + produit },
        })
      : await tx.inventoryItem.create({
          data: {
            ownerType: ouStocke.ownerType,
            ownerUserId: ouStocke.ownerUserId,
            materialId: recette.outputMaterialId,
            category: recette.outputMaterial.category,
            state: recette.outputMaterial.state,
            unit: recette.outputMaterial.unit,
            quantity: produit,
          },
        });

    await tx.inventoryMovement.create({
      data: {
        inventoryItemId: cible.id,
        ownerType: ouStocke.ownerType,
        materialId: recette.outputMaterialId,
        label: recette.outputMaterial.label,
        delta: produit,
        reason: `Sortie d'atelier : ${recette.label}${fois > 1 ? ` ×${fois}` : ""}`,
        userId: membre.id,
      },
    });

    // 3. Consigner la production : brut, taxe, net, coût, bénéfice
    await tx.productionEntry.create({
      data: {
        userId: membre.id,
        metierId: recette.metierId,
        recipeId: recette.id,
        materialId: recette.outputMaterialId,
        quantite: produit,
        source,
        prixUnitaire,
        revenuBrut: revenu.brut,
        tauxTaxe: revenu.taux,
        taxe: revenu.taxe,
        revenuNet: revenu.net,
        coutMatiere,
        benefice,
        note: recette.label,
      },
    });

    // 4. La part de la Maison tombe dans le coffre
    if (revenu.taxe > 0) {
      const coffre = await tx.treasury.findUnique({ where: { id: "maison" } });
      const solde = (coffre?.septims ?? 0) + revenu.taxe;
      await tx.treasury.upsert({
        where: { id: "maison" },
        update: { septims: solde },
        create: { id: "maison", septims: solde },
      });
      await tx.treasuryMovement.create({
        data: {
          montant: revenu.taxe,
          motif: `Taxe d'atelier (${Math.round(revenu.taux * 100)} %) — ${produit} × ${recette.outputMaterial.label}`,
          categorie: "taxe",
          soldeApres: solde,
          userId: membre.id,
        },
      });
    }
  });

  await tracer({
    userId: membre.id,
    action: source === "maison" ? "stock" : "creation",
    entityType: "Recipe",
    entityId: recette.id,
    label: `Fabriqué ${produit} × ${recette.outputMaterial.label}`,
    details: `${recette.metier.label} · ${source === "maison" ? "stock commun" : "stash personnel"} · brut ${revenu.brut} ⊙, taxe ${revenu.taxe} ⊙, net ${revenu.net} ⊙`,
  });

  revalidatePath("/economie/craft");
  revalidatePath("/economie/stocks");
  revalidatePath("/economie/mon-stash");
  revalidatePath("/economie/tresorerie");
  revalidatePath(`/economie/ateliers/${recette.metier.key}`);
  revalidatePath("/tableau-de-bord");

  const ou = source === "maison" ? "le stock commun" : "votre stash";
  const chiffres =
    revenu.brut > 0
      ? ` Revenu brut ${revenu.brut} ⊙ − taxe ${revenu.taxe} ⊙ = ${revenu.net} ⊙ net.`
      : " Aucun cours connu pour cet objet : le revenu reste à chiffrer.";

  return {
    succes: `${produit} × ${recette.outputMaterial.label} ${
      produit > 1 ? "rangés" : "rangé"
    } dans ${ou}.${chiffres}`,
    revenu: { brut: revenu.brut, taxe: revenu.taxe, net: revenu.net, benefice },
  };
}

/* ══════════════════════════════════════════════════════════════
   Prix d'achat par métier
   ══════════════════════════════════════════════════════════════ */

/** Le métier consigne ce qu'il paie réellement ses matières. */
export async function actionPrixMetier(data: FormData) {
  const membre = await exigerMembre();
  const metierId = txt(data.get("metierId"));
  const materialId = txt(data.get("materialId"));
  if (!metierId || !materialId) return;

  // Un membre du métier, ou un gradé qui tient les comptes.
  const duMetier = membre.metiers.some((um) => um.metierId === metierId);
  if (!duMetier && !peut(membre, P.MATERIAL_MANAGE, P.RECIPE_MANAGE, P.INVENTORY_HOUSE_MANAGE)) {
    return;
  }

  const brut = txt(data.get("prixAchat"));
  if (brut === "") {
    await prisma.metierPrice.deleteMany({ where: { metierId, materialId } });
  } else {
    const prixAchat = Math.max(0, nb(data.get("prixAchat")));
    await prisma.metierPrice.upsert({
      where: { metierId_materialId: { metierId, materialId } },
      update: { prixAchat, updatedById: membre.id, note: txt(data.get("note")).slice(0, 200) },
      create: {
        metierId,
        materialId,
        prixAchat,
        updatedById: membre.id,
        note: txt(data.get("note")).slice(0, 200),
      },
    });
  }

  const metier = await prisma.metier.findUnique({ where: { id: metierId } });
  revalidatePath("/economie/craft");
  revalidatePath(`/economie/ateliers/${metier?.key ?? ""}`);
}

export async function actionSupprimerRecette(data: FormData) {
  const membre = await exigerMembre();
  if (!peut(membre, P.RECIPE_MANAGE)) return;
  const id = txt(data.get("id"));

  const recette = await prisma.recipe.findUnique({ where: { id }, include: { metier: true } });
  if (!recette) return;

  await prisma.recipe.delete({ where: { id } });
  await tracer({
    userId: membre.id,
    action: "suppression",
    entityType: "Recipe",
    entityId: id,
    label: `Recette « ${recette.label} » supprimée`,
  });
  revalidatePath(`/economie/ateliers/${recette.metier.key}`);
}
