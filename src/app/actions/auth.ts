"use server";

import { redirect } from "next/navigation";
import { connexionClassique, exigerMembre, hacherMotDePasse } from "@/lib/auth";
import { fermerSession, idSession, ouvrirSession } from "@/lib/session";
import { tracer } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { adresseAppelant } from "@/lib/securite/limitation";
import { verifierMotDePasse } from "@/lib/securite/motsDePasse";
import { compare } from "bcryptjs";

export type EtatConnexion = {
  erreur?: string;
  /** Secondes de blocage restantes, renvoyées par le serveur. */
  secondes?: number;
  /** Essais restants avant blocage. */
  essaisRestants?: number;
};

export async function actionConnexion(
  _etat: EtatConnexion,
  data: FormData,
): Promise<EtatConnexion> {
  const login = String(data.get("login") ?? "");
  const motDePasse = String(data.get("motDePasse") ?? "");

  const res = await connexionClassique(login, motDePasse);

  if (!res.ok) {
    await tracer({
      action: "connexion",
      entityType: "Auth",
      label: `Échec de connexion — ${login.trim().toLowerCase().slice(0, 60)}`,
      details: `depuis ${await adresseAppelant()}`,
    });
    return { erreur: res.erreur, secondes: res.secondes, essaisRestants: res.essaisRestants };
  }

  redirect("/tableau-de-bord");
}

export async function actionDeconnexion() {
  const uid = await idSession();
  if (uid) await tracer({ userId: uid, action: "connexion", label: "Déconnexion" });
  await fermerSession();
  redirect("/");
}

/* ══════════════════════════════════════════════════════════════
   Changement de mot de passe en libre-service
   ══════════════════════════════════════════════════════════════ */

export type EtatMotDePasse = { erreur?: string; erreurs?: string[]; succes?: string };

/**
 * Un membre change son propre mot de passe. Il doit fournir l'ancien :
 * une session volée ne suffit pas à s'emparer du compte. Toutes les autres
 * sessions sont invalidées dans la foulée.
 */
export async function actionChangerMotDePasse(
  _etat: EtatMotDePasse,
  data: FormData,
): Promise<EtatMotDePasse> {
  const membre = await exigerMembre();

  const ancien = String(data.get("ancien") ?? "");
  const nouveau = String(data.get("nouveau") ?? "");
  const confirmation = String(data.get("confirmation") ?? "");

  const compte = await prisma.user.findUnique({
    where: { id: membre.id },
    select: { passwordHash: true },
  });

  if (!compte?.passwordHash) {
    return {
      erreur:
        "Ce compte n'a pas de mot de passe : il se connecte par Discord. Adressez-vous au Sénéchal pour en définir un.",
    };
  }
  if (!(await compare(ancien, compte.passwordHash))) {
    return { erreur: "Le mot de passe actuel est incorrect." };
  }
  if (nouveau !== confirmation) {
    return { erreur: "Les deux saisies du nouveau mot de passe ne correspondent pas." };
  }
  if (await compare(nouveau, compte.passwordHash)) {
    return { erreur: "Le nouveau mot de passe doit être différent de l'ancien." };
  }

  const verdict = await verifierMotDePasse(nouveau, {
    personnel: [membre.login, membre.nomRp, membre.email],
  });
  if (!verdict.ok) return { erreur: verdict.erreurs[0], erreurs: verdict.erreurs };

  await prisma.user.update({
    where: { id: membre.id },
    data: {
      passwordHash: await hacherMotDePasse(nouveau),
      // Invalide toutes les sessions déjà émises, y compris celles d'un intrus.
      sessionsDepuis: new Date(),
    },
  });

  // On rouvre la nôtre pour ne pas se déconnecter soi-même.
  await ouvrirSession(membre.id);

  await tracer({
    userId: membre.id,
    action: "membre",
    entityType: "User",
    entityId: membre.id,
    label: "Mot de passe changé",
    details: "Toutes les autres sessions ont été invalidées.",
  });

  return { succes: "Mot de passe changé. Vos autres sessions ont été fermées." };
}
