"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { exigerMembre, peut } from "@/lib/auth";
import { tracer } from "@/lib/audit";
import { ETATS_POSTE, PERMISSIONS as P } from "@/lib/domain";
import { monPoste, seuilPoste } from "@/lib/presence";

export type EtatVie = { erreur?: string; succes?: string };

const txt = (v: FormDataEntryValue | null) => String(v ?? "").trim();

/* ── Annonces ────────────────────────────────────────────── */

export async function actionAnnonce(_etat: EtatVie, data: FormData): Promise<EtatVie> {
  const membre = await exigerMembre();
  if (!peut(membre, P.ANNOUNCEMENT_CREATE)) {
    return { erreur: "Seuls les gradés publient des annonces." };
  }

  const titre = txt(data.get("titre"));
  const contenu = txt(data.get("contenu"));
  if (!titre) return { erreur: "Donnez un titre à l'annonce." };
  if (contenu.length < 10) return { erreur: "Le contenu de l'annonce est trop court." };

  const id = txt(data.get("id"));
  const valeurs = {
    titre: titre.slice(0, 180),
    contenu,
    branchId: txt(data.get("branchId")) || null,
    epingle: data.get("epingle") === "on",
  };

  const annonce = id
    ? await prisma.announcement.update({ where: { id }, data: valeurs })
    : await prisma.announcement.create({ data: { ...valeurs, auteurId: membre.id } });

  await tracer({
    userId: membre.id,
    action: id ? "modification" : "creation",
    entityType: "Announcement",
    entityId: annonce.id,
    label: `Annonce « ${titre} »`,
  });

  revalidatePath("/annonces");
  revalidatePath("/tableau-de-bord");
  return { succes: id ? "Annonce mise à jour." : "Annonce publiée." };
}

export async function actionSupprimerAnnonce(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const annonce = await prisma.announcement.findUnique({ where: { id } });
  if (!annonce) return;
  if (annonce.auteurId !== membre.id && !peut(membre, P.ADMIN_FULL)) return;

  await prisma.announcement.delete({ where: { id } });
  revalidatePath("/annonces");
}

/* ── Événements ──────────────────────────────────────────── */

export async function actionEvenement(_etat: EtatVie, data: FormData): Promise<EtatVie> {
  const membre = await exigerMembre();
  if (!peut(membre, P.EVENT_CREATE)) {
    return { erreur: "Seuls les gradés organisent des événements." };
  }

  const titre = txt(data.get("titre"));
  const dateStr = txt(data.get("date"));
  if (!titre) return { erreur: "Donnez un titre à l'événement." };
  if (!dateStr) return { erreur: "Indiquez une date." };

  const id = txt(data.get("id"));
  const valeurs = {
    titre: titre.slice(0, 180),
    description: txt(data.get("description")),
    date: new Date(dateStr),
    heure: txt(data.get("heure")),
    heureRdv: txt(data.get("heureRdv")),
    lieu: txt(data.get("lieu")),
    statut: txt(data.get("statut")) || "planifie",
  };

  const ev = id
    ? await prisma.event.update({ where: { id }, data: valeurs })
    : await prisma.event.create({ data: { ...valeurs, createdById: membre.id } });

  await tracer({
    userId: membre.id,
    action: id ? "modification" : "creation",
    entityType: "Event",
    entityId: ev.id,
    label: `Événement « ${titre} »`,
  });

  revalidatePath("/calendrier");
  revalidatePath("/tableau-de-bord");
  return { succes: id ? "Événement mis à jour." : "Événement inscrit au calendrier." };
}

export async function actionRSVP(data: FormData) {
  const membre = await exigerMembre();
  const eventId = txt(data.get("eventId"));
  const reponse = txt(data.get("reponse"));
  if (!["present", "absent", "peut_etre"].includes(reponse)) return;

  await prisma.eventRSVP.upsert({
    where: { eventId_userId: { eventId, userId: membre.id } },
    update: { reponse },
    create: { eventId, userId: membre.id, reponse },
  });
  revalidatePath("/calendrier");
  revalidatePath("/tableau-de-bord");
}

export async function actionSupprimerEvenement(data: FormData) {
  const membre = await exigerMembre();
  if (!peut(membre, P.EVENT_CREATE)) return;
  await prisma.event.delete({ where: { id: txt(data.get("id")) } });
  revalidatePath("/calendrier");
}

/* ── Présence & absences ─────────────────────────────────── */

export async function actionAbsence(_etat: EtatVie, data: FormData): Promise<EtatVie> {
  const membre = await exigerMembre();
  if (!peut(membre, P.ATTENDANCE_CREATE)) return { erreur: "Action non autorisée." };

  const debut = txt(data.get("dateDebut"));
  if (!debut) return { erreur: "Indiquez la date de début." };

  const fin = txt(data.get("dateFin"));
  const cible = txt(data.get("userId"));
  const userId =
    cible && peut(membre, P.ATTENDANCE_VALIDATE) ? cible : membre.id;

  await prisma.attendance.create({
    data: {
      userId,
      type: txt(data.get("type")) || "absence",
      dateDebut: new Date(debut),
      dateFin: fin ? new Date(fin) : null,
      motif: txt(data.get("motif")).slice(0, 600),
      statut: peut(membre, P.ATTENDANCE_VALIDATE) ? "validee" : "declaree",
    },
  });

  await tracer({
    userId: membre.id,
    action: "creation",
    entityType: "Attendance",
    label: "Absence déclarée",
  });

  revalidatePath("/presence");
  return { succes: "Absence déclarée. Le règlement §VII est respecté." };
}

export async function actionStatutAbsence(data: FormData) {
  const membre = await exigerMembre();
  if (!peut(membre, P.ATTENDANCE_VALIDATE)) return;

  await prisma.attendance.update({
    where: { id: txt(data.get("id")) },
    data: { statut: txt(data.get("statut")) },
  });
  revalidatePath("/presence");
}

export async function actionSupprimerAbsence(data: FormData) {
  const membre = await exigerMembre();
  const id = txt(data.get("id"));
  const a = await prisma.attendance.findUnique({ where: { id } });
  if (!a) return;
  if (a.userId !== membre.id && !peut(membre, P.ATTENDANCE_VALIDATE)) return;

  await prisma.attendance.delete({ where: { id } });
  revalidatePath("/presence");
}

/* ── Prise de poste ──────────────────────────────────────── */

/** « Je prends mon poste » : le membre se déclare en jeu et disponible. */
export async function actionPrisePoste(data: FormData) {
  const membre = await exigerMembre();
  const dejaOuvert = await monPoste(membre.id);

  if (dejaOuvert) {
    // Déjà en poste : on ne crée pas de doublon, on met juste l'état à jour.
    const etat = txt(data.get("etat"));
    if (etat && ETATS_POSTE.some((e) => e.value === etat)) {
      await prisma.dutySession.update({ where: { id: dejaOuvert.id }, data: { etat } });
    }
  } else {
    await prisma.dutySession.create({
      data: {
        userId: membre.id,
        etat: txt(data.get("etat")) || "disponible",
        note: txt(data.get("note")).slice(0, 200),
      },
    });
    await prisma.user.update({ where: { id: membre.id }, data: { lastSeenAt: new Date() } });
  }

  revalidatePath("/presence");
  revalidatePath("/tableau-de-bord");
}

/** « Je quitte mon poste ». */
export async function actionFinPoste(data: FormData) {
  const membre = await exigerMembre();
  const cible = txt(data.get("userId"));

  // Un gradé peut clore le poste oublié d'un autre.
  const pourAutrui = cible && cible !== membre.id;
  if (pourAutrui && !peut(membre, P.ATTENDANCE_VALIDATE)) return;

  const poste = await monPoste(pourAutrui ? cible : membre.id);
  if (!poste) return;

  await prisma.dutySession.update({
    where: { id: poste.id },
    data: { finLe: new Date() },
  });

  revalidatePath("/presence");
  revalidatePath("/tableau-de-bord");
}

/** Change l'état sans quitter le poste : disponible / occupé / en patrouille. */
export async function actionEtatPoste(data: FormData) {
  const membre = await exigerMembre();
  const etat = txt(data.get("etat"));
  if (!ETATS_POSTE.some((e) => e.value === etat)) return;

  const poste = await monPoste(membre.id);
  if (!poste) return;

  await prisma.dutySession.update({ where: { id: poste.id }, data: { etat } });
  revalidatePath("/presence");
}

export type EtatPatrouille = { erreur?: string; succes?: string };

/**
 * Compose une patrouille à partir des membres actuellement en poste.
 * C'est l'intérêt du tableau de présence : on voit qui est là, on coche,
 * et la ronde part — les participants passent automatiquement « en patrouille ».
 */
export async function actionPatrouilleDepuisPresents(
  _etat: EtatPatrouille,
  data: FormData,
): Promise<EtatPatrouille> {
  const membre = await exigerMembre();
  if (!peut(membre, P.PATROL_CREATE)) {
    return { erreur: "Seuls les gradés du Garde-Chasse peuvent lancer une ronde." };
  }

  const zone = txt(data.get("zone"));
  if (!zone) return { erreur: "Indiquez la zone à patrouiller." };

  const participants = data.getAll("participants").map(String).filter(Boolean);
  if (participants.length === 0) {
    return { erreur: "Cochez au moins un membre pour composer la patrouille." };
  }

  const membres = await prisma.user.findMany({
    where: { id: { in: participants } },
    select: { id: true, nomRp: true },
  });
  if (membres.length === 0) return { erreur: "Aucun membre valide sélectionné." };

  const dateStr = txt(data.get("date"));
  const patrouille = await prisma.patrol.create({
    data: {
      patrouilleurs: membres.map((m) => m.nomRp).join(", "),
      zone: zone.slice(0, 200),
      type: txt(data.get("type")) || "routes",
      date: dateStr ? new Date(dateStr) : new Date(),
      heureDebut: txt(data.get("heureDebut")),
      heureFin: txt(data.get("heureFin")),
      circleId: txt(data.get("circleId")) || null,
      statut: "planifiee",
      authorId: membre.id,
    },
  });

  // Les participants basculent « en patrouille » sur le tableau de présence.
  await prisma.dutySession.updateMany({
    where: { userId: { in: participants }, finLe: null, debutLe: { gte: seuilPoste() } },
    data: { etat: "en_patrouille", patrolId: patrouille.id },
  });

  await tracer({
    userId: membre.id,
    action: "creation",
    entityType: "Patrol",
    entityId: patrouille.id,
    label: `Ronde composée depuis les présents — ${zone}`,
    details: membres.map((m) => m.nomRp).join(", "),
  });

  revalidatePath("/presence");
  revalidatePath("/registres/patrouilles");
  revalidatePath("/tableau-de-bord");

  return {
    succes: `Patrouille lancée sur « ${zone} » avec ${membres.length} membre(s) : ${membres
      .map((m) => m.nomRp)
      .join(", ")}.`,
  };
}
