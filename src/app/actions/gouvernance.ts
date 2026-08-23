"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { exigerDroit, exigerMembre, hacherMotDePasse, peut, utilisateurCourant } from "@/lib/auth";
import { tracer } from "@/lib/audit";
import { PERMISSIONS } from "@/lib/domain";
import { adresseAppelant, limiterAction } from "@/lib/securite/limitation";
import { verifierMotDePasse } from "@/lib/securite/motsDePasse";

/* ══════════════════════════════════════════════════════════════
   Demandes de rôle
   ══════════════════════════════════════════════════════════════ */

export type EtatDemande = { erreur?: string; erreurs?: string[]; succes?: boolean };

const schemaDemande = z.object({
  nomRp: z.string().trim().min(2, "Le nom RP est requis.").max(80),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(5, "L'adresse email est requise.")
    .max(160)
    .email("Cette adresse email n'est pas valide."),
  loginSouhaite: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "L'identifiant doit faire au moins 3 caractères.")
    .max(40)
    .regex(
      /^[a-z0-9._-]+$/,
      "Identifiant : lettres minuscules, chiffres, point, tiret et souligné uniquement.",
    ),
  discordTag: z.string().trim().max(60).optional().default(""),
  contact: z.string().trim().max(120).optional().default(""),
  rangSouhaite: z.string().trim().max(60).optional().default(""),
  gradeSouhaite: z.string().trim().max(60).optional().default(""),
  branche: z.string().trim().max(60).optional().default(""),
  cercle: z.string().trim().max(60).optional().default(""),
  metiers: z.string().trim().max(200).optional().default(""),
  presentePar: z.string().trim().max(80).optional().default(""),
  message: z.string().trim().min(20, "Présentez-vous en quelques lignes (20 caractères minimum).").max(4000),
});

/**
 * Formulaire public de demande de rôle.
 *
 * Le candidat choisit lui-même son identifiant, son email et son mot de passe.
 * Le mot de passe n'est jamais stocké en clair ni transmis à quiconque : seule
 * son empreinte bcrypt est conservée sur la demande, puis reprise telle quelle
 * si un Patriarche accepte. Personne, pas même le Sénéchal, ne le connaît.
 *
 * Ce n'est pas une inscription libre : tant que la demande n'est pas acceptée,
 * aucun compte n'existe et aucune connexion n'est possible.
 */
export async function actionDemandeRole(
  _etat: EtatDemande,
  data: FormData,
): Promise<EtatDemande> {
  const parse = schemaDemande.safeParse(Object.fromEntries(data.entries()));
  if (!parse.success) {
    return { erreur: parse.error.issues[0]?.message ?? "Formulaire incomplet." };
  }
  const d = parse.data;

  const motDePasse = String(data.get("motDePasse") ?? "");
  const confirmation = String(data.get("confirmation") ?? "");
  if (motDePasse !== confirmation) {
    return { erreur: "Les deux saisies du mot de passe ne correspondent pas." };
  }

  const verdict = await verifierMotDePasse(motDePasse, {
    personnel: [d.loginSouhaite, d.nomRp, d.email, d.discordTag],
  });
  if (!verdict.ok) {
    return { erreur: verdict.erreurs[0], erreurs: verdict.erreurs };
  }

  // L'identifiant doit être libre, côté comptes comme côté demandes en cours.
  const [compteExistant, demandeExistante] = await Promise.all([
    prisma.user.findFirst({ where: { login: d.loginSouhaite }, select: { id: true } }),
    prisma.roleRequest.findFirst({
      where: { loginSouhaite: d.loginSouhaite, statut: { in: ["en_attente", "examinee"] } },
      select: { id: true },
    }),
  ]);
  if (compteExistant || demandeExistante) {
    return { erreur: "Cet identifiant est déjà pris. Choisissez-en un autre." };
  }

  // Garde-fou contre les envois en rafale. Ce formulaire est la seule
  // écriture accessible sans être connecté : on le limite par adresse et
  // par nom RP, avec un compteur tenu en base.
  const ip = await adresseAppelant();
  const [autoriseIp, autoriseNom] = await Promise.all([
    limiterAction("demande", ip, 3, 60),
    limiterAction("demande", `nom:${d.nomRp.toLowerCase()}`, 1, 60),
  ]);
  if (!autoriseIp || !autoriseNom) {
    return {
      erreur: "Une demande est déjà en attente d'examen. Patientez, un gradé la lira.",
    };
  }

  const demande = await prisma.roleRequest.create({
    data: { ...d, passwordHash: await hacherMotDePasse(motDePasse) },
  });
  await tracer({
    action: "creation",
    entityType: "RoleRequest",
    entityId: demande.id,
    label: `Demande de rôle — ${demande.nomRp}`,
    details: `identifiant souhaité : ${d.loginSouhaite}`,
  });

  revalidatePath("/gouvernance/demandes");
  return { succes: true };
}

/**
 * Renvoie au registre des demandes en disant ce qui a bloqué.
 *
 * Déclarée comme fonction nommée, et non comme constante fléchée : c'est à
 * cette condition que TypeScript comprend qu'elle ne rend jamais la main et
 * réduit correctement les types après l'appel.
 */
function abandon(motif: string): never {
  redirect(`/gouvernance/demandes?probleme=${motif}`);
}

/**
 * Ouvre le compte d'un candidat accepté, à partir des identifiants qu'il a
 * lui-même choisis. Aucun mot de passe n'a besoin d'être communiqué.
 *
 * Un abandon silencieux laisserait le gradé devant un bouton qui « ne fait
 * rien » : chaque sortie dit donc pourquoi elle a lieu.
 */
export async function actionCreerCompteDepuisDemande(id: string, _data: FormData) {
  const membre = await exigerDroit(PERMISSIONS.ADMIN_MEMBERS);

  const demande = await prisma.roleRequest.findUnique({ where: { id } });
  if (!demande) abandon("introuvable");
  if (demande.statut !== "acceptee") abandon("non_acceptee");
  if (!demande.loginSouhaite) abandon("sans_identifiant");
  if (!demande.passwordHash) abandon("sans_mot_de_passe");

  const pris = await prisma.user.findFirst({
    where: { login: demande.loginSouhaite },
    select: { id: true },
  });
  if (pris) abandon("identifiant_pris");

  const rangFils = await prisma.rank.findUnique({ where: { key: "fils" } });
  if (!rangFils) abandon("rang_fils_absent");

  const branche = demande.branche
    ? await prisma.branch.findFirst({ where: { label: demande.branche } })
    : null;
  const cercle = demande.cercle
    ? await prisma.circle.findFirst({ where: { label: demande.cercle } })
    : null;
  const parrain = demande.presentePar
    ? await prisma.user.findFirst({ where: { nomRp: demande.presentePar }, select: { id: true } })
    : null;

  const compte = await prisma.user.create({
    data: {
      login: demande.loginSouhaite,
      email: demande.email,
      passwordHash: demande.passwordHash,
      nomRp: demande.nomRp,
      discordUsername: demande.discordTag,
      rankId: rangFils.id,
      branchId: branche?.id ?? null,
      circleId: cercle?.id ?? null,
      presentedById: parrain?.id ?? null,
      // Le règlement veut que l'on entre en période d'essai.
      status: "essai",
      bio: "",
    },
  });

  // L'empreinte n'a plus lieu d'être conservée sur la demande.
  await prisma.roleRequest.update({
    where: { id },
    data: {
      passwordHash: null,
      decisionNote: [demande.decisionNote, "compte ouvert"].filter(Boolean).join(" — "),
    },
  });

  await tracer({
    userId: membre.id,
    action: "membre",
    entityType: "User",
    entityId: compte.id,
    label: `Compte ouvert pour ${compte.nomRp} (${compte.login})`,
    details: "Identifiants choisis par le candidat lors de sa demande.",
  });

  revalidatePath("/gouvernance/demandes");
  revalidatePath("/gouvernance/membres");
  revalidatePath("/annuaire");
}

/**
 * Examen d'une demande : le statut visé et l'identifiant de la demande sont
 * liés à l'action côté serveur plutôt que transmis par le bouton d'envoi.
 * Next.js les signe, le navigateur ne peut donc ni les altérer ni les omettre —
 * là où la valeur d'un bouton pouvait se perdre à l'envoi.
 */
export async function actionExaminerDemande(id: string, statut: string, data: FormData) {
  const membre = await exigerDroit(PERMISSIONS.ROLE_REQUEST_REVIEW, PERMISSIONS.ROLE_REQUEST_APPROVE);
  const note = String(data.get("decisionNote") ?? "");

  if (!["examinee", "acceptee", "refusee", "en_attente"].includes(statut)) return;
  if ((statut === "acceptee" || statut === "refusee") && !peut(membre, PERMISSIONS.ROLE_REQUEST_APPROVE)) {
    return;
  }

  const demande = await prisma.roleRequest.update({
    where: { id },
    data: { statut, decisionNote: note, examineParId: membre.id },
  });

  await tracer({
    userId: membre.id,
    action: statut === "refusee" ? "refus" : statut === "acceptee" ? "validation" : "modification",
    entityType: "RoleRequest",
    entityId: id,
    label: `Demande de ${demande.nomRp} → ${statut}`,
  });
  revalidatePath("/gouvernance/demandes");
}

/* ══════════════════════════════════════════════════════════════
   Membres
   ══════════════════════════════════════════════════════════════ */

export type EtatMembre = { erreur?: string; erreurs?: string[]; succes?: string };

const schemaMembre = z.object({
  login: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "L'identifiant doit faire au moins 3 caractères.")
    .max(40)
    .regex(/^[a-z0-9._-]+$/, "Identifiant : lettres minuscules, chiffres, point, tiret et souligné."),
  nomRp: z.string().trim().min(2, "Le nom RP est requis.").max(80),
  rankId: z.string().min(1, "Le rang est requis."),
  branchId: z.string().optional().default(""),
  gradeId: z.string().optional().default(""),
  councilRoleId: z.string().optional().default(""),
  circleId: z.string().optional().default(""),
  status: z.enum(["actif", "essai", "archive"]),
  discordUsername: z.string().trim().max(60).optional().default(""),
  bio: z.string().trim().max(2000).optional().default(""),
  presentedById: z.string().optional().default(""),
});

export async function actionEnregistrerMembre(
  _etat: EtatMembre,
  data: FormData,
): Promise<EtatMembre> {
  const membre = await exigerDroit(PERMISSIONS.ADMIN_MEMBERS);
  const id = String(data.get("id") ?? "");
  const motDePasse = String(data.get("motDePasse") ?? "");

  const parse = schemaMembre.safeParse(Object.fromEntries(data.entries()));
  if (!parse.success) return { erreur: parse.error.issues[0]?.message ?? "Formulaire incomplet." };
  const d = parse.data;

  const doublon = await prisma.user.findFirst({
    where: { login: d.login, ...(id ? { NOT: { id } } : {}) },
    select: { id: true },
  });
  if (doublon) return { erreur: "Cet identifiant est déjà pris par un autre membre." };

  // ── Garde contre l'élévation de privilège ────────────────
  // Seul un Patriarche peut nommer à son rang ou au-dessus, et nul ne
  // modifie sa propre fiche d'administration : ni son rang, ni son statut.
  if (!membre.estAdmin) {
    if (id === membre.id) {
      return {
        erreur:
          "Vous ne pouvez pas modifier votre propre fiche d'administration. Passez par un Patriarche.",
      };
    }

    const rangVise = await prisma.rank.findUnique({
      where: { id: d.rankId },
      select: { level: true, label: true },
    });
    if (!rangVise) return { erreur: "Rang inconnu." };

    if (rangVise.level <= membre.rank.level) {
      return {
        erreur: `Vous ne pouvez pas nommer quelqu'un ${rangVise.level === membre.rank.level ? "à votre rang" : "au-dessus de votre rang"} (${rangVise.label}). Cette décision revient aux Patriarches.`,
      };
    }

    if (id) {
      const actuel = await prisma.user.findUnique({
        where: { id },
        select: { rank: { select: { level: true } } },
      });
      if (actuel && actuel.rank.level <= membre.rank.level) {
        return {
          erreur: "Vous ne pouvez pas modifier la fiche d'un membre de rang égal ou supérieur au vôtre.",
        };
      }
    }
  }

  const valeurs = {
    login: d.login,
    nomRp: d.nomRp,
    rankId: d.rankId,
    branchId: d.branchId || null,
    gradeId: d.gradeId || null,
    councilRoleId: d.councilRoleId || null,
    circleId: d.circleId || null,
    status: d.status,
    discordUsername: d.discordUsername,
    bio: d.bio,
    presentedById: d.presentedById || null,
    ...(d.status === "archive" ? { dateSortie: new Date() } : { dateSortie: null }),
  };

  // Même exigence pour un mot de passe posé par un gradé que pour celui
  // qu'un membre choisit lui-même : la politique ne se contourne pas par
  // l'administration.
  if (motDePasse || !id) {
    const verdict = await verifierMotDePasse(motDePasse, {
      personnel: [d.login, d.nomRp, d.discordUsername],
    });
    if (!verdict.ok) return { erreur: verdict.erreurs[0], erreurs: verdict.erreurs };
  }

  let cible: { id: string };
  if (id) {
    cible = await prisma.user.update({ where: { id }, data: valeurs });
    if (motDePasse) {
      await prisma.user.update({
        where: { id },
        data: {
          passwordHash: await hacherMotDePasse(motDePasse),
          // Changer le mot de passe ferme les sessions ouvertes.
          sessionsDepuis: new Date(),
        },
      });
    }
  } else {
    cible = await prisma.user.create({
      data: { ...valeurs, passwordHash: await hacherMotDePasse(motDePasse) },
    });
  }

  // Métiers
  const metiers = data.getAll("metiers").map(String).filter(Boolean);
  if (metiers.length > 0 || id) {
    await prisma.userMetier.deleteMany({ where: { userId: cible.id } });
    for (const [i, entree] of metiers.entries()) {
      const [metierId, niveau] = entree.split(":");
      if (!metierId) continue;
      await prisma.userMetier.create({
        data: { userId: cible.id, metierId, niveau: niveau || "apprenti", isPrimary: i === 0 },
      });
    }
  }

  await tracer({
    userId: membre.id,
    action: "membre",
    entityType: "User",
    entityId: cible.id,
    label: `${id ? "Modification" : "Création"} du membre ${d.nomRp}`,
  });

  revalidatePath("/gouvernance/membres");
  revalidatePath("/annuaire");
  revalidatePath("/organigramme");
  return { succes: id ? "Fiche mise à jour." : "Membre créé." };
}

/** Octroi ou retrait ponctuel d'une permission. */
/** `mode` vaut « accorder », « retirer » ou « defaut ». */
export async function actionDroitMembre(
  userId: string,
  permissionId: string,
  mode: string,
  _data: FormData,
) {
  const membre = await exigerDroit(PERMISSIONS.ADMIN_ROLES);

  // On ne distribue pas les clés de la Maison sans les avoir soi-même :
  // seul un Patriarche peut accorder l'administration totale.
  const permission = await prisma.permission.findUnique({
    where: { id: permissionId },
    select: { key: true },
  });
  if (!permission) return;
  if (permission.key === PERMISSIONS.ADMIN_FULL && !membre.estAdmin) return;

  // Et l'on ne s'accorde rien à soi-même : la décision vient d'un autre.
  if (userId === membre.id && mode === "accorder" && !membre.estAdmin) return;

  if (mode === "defaut") {
    await prisma.userPermission.deleteMany({ where: { userId, permissionId } });
  } else {
    const granted = mode === "accorder";
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId } },
      update: { granted },
      create: { userId, permissionId, granted },
    });
  }

  await tracer({
    userId: membre.id,
    action: mode === "retirer" ? "revocation" : "octroi",
    entityType: "UserPermission",
    entityId: userId,
    label: `Permission ${mode}`,
  });
  revalidatePath(`/gouvernance/membres/${userId}`);
}

/* ══════════════════════════════════════════════════════════════
   Sanctions
   ══════════════════════════════════════════════════════════════ */

export async function actionSanction(data: FormData) {
  const membre = await exigerDroit(PERMISSIONS.ADMIN_SANCTIONS);
  const id = String(data.get("id") ?? "");

  if (id) {
    const statut = String(data.get("statut"));
    await prisma.sanction.update({ where: { id }, data: { statut } });
    await tracer({
      userId: membre.id,
      action: "sanction",
      entityType: "Sanction",
      entityId: id,
      label: `Sanction → ${statut}`,
    });
  } else {
    const finLe = String(data.get("finLe") ?? "");
    const sanction = await prisma.sanction.create({
      data: {
        userId: String(data.get("userId")),
        type: String(data.get("type")),
        motif: String(data.get("motif") ?? ""),
        finLe: finLe ? new Date(finLe) : null,
        decideParId: membre.id,
      },
      include: { user: { select: { nomRp: true } } },
    });
    await tracer({
      userId: membre.id,
      action: "sanction",
      entityType: "Sanction",
      entityId: sanction.id,
      label: `${sanction.type} — ${sanction.user.nomRp}`,
      details: sanction.motif,
    });
  }
  revalidatePath("/gouvernance/sanctions");
}

/* ══════════════════════════════════════════════════════════════
   Tickets
   ══════════════════════════════════════════════════════════════ */

export async function actionTicket(data: FormData) {
  const membre = await exigerMembre();
  const id = String(data.get("id") ?? "");

  if (id) {
    const statut = String(data.get("statut") ?? "");
    const reponse = String(data.get("reponse") ?? "").trim();
    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) return;

    const gestionnaire = peut(membre, PERMISSIONS.TICKET_MANAGE);
    if (!gestionnaire && ticket.auteurId !== membre.id) return;

    if (reponse) {
      await prisma.ticketMessage.create({
        data: { ticketId: id, userId: membre.id, contenu: reponse },
      });
    }
    if (statut && gestionnaire) {
      await prisma.ticket.update({
        where: { id },
        data: { statut, assigneId: ticket.assigneId ?? membre.id },
      });
    }
  } else {
    await prisma.ticket.create({
      data: {
        titre: String(data.get("titre") ?? "").slice(0, 160),
        categorie: String(data.get("categorie") ?? "question"),
        contenu: String(data.get("contenu") ?? ""),
        auteurId: membre.id,
      },
    });
  }
  revalidatePath("/gouvernance/tickets");
}

/* ══════════════════════════════════════════════════════════════
   Pages institutionnelles
   ══════════════════════════════════════════════════════════════ */

/**
 * Réécriture du règlement ou de l'histoire de la Maison.
 * Réservé aux Patriarches : ce sont les textes fondateurs, pas des annonces.
 */
export async function actionPageSite(data: FormData) {
  const membre = await utilisateurCourant();
  if (!peut(membre, PERMISSIONS.ADMIN_FULL)) return;

  const key = String(data.get("key"));
  const titre = String(data.get("titre"));
  const contenu = String(data.get("contenu"));

  await prisma.sitePage.upsert({
    where: { key },
    update: { titre, contenu },
    create: { key, titre, contenu },
  });
  await tracer({
    userId: membre!.id,
    action: "modification",
    entityType: "SitePage",
    entityId: key,
    label: `Page « ${titre} » mise à jour`,
  });
  revalidatePath(`/${key}`);
}
