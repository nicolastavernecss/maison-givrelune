import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Carte, Definitions, EnTetePage, LienBouton, Message } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";
import { exigerMembre } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LONGUEUR_MIN } from "@/lib/securite/motsDePasse";
import { ESSAIS_AVANT_BLOCAGE } from "@/lib/securite/limitation";
import { date, dateHeure, relatif } from "@/lib/format";
import { FormulaireMotDePasse } from "./FormulaireMotDePasse";

export const metadata: Metadata = { title: "Mon compte" };
export const dynamic = "force-dynamic";

export default async function MonCompte() {
  const membre = await exigerMembre();

  const [compte, dernieresConnexions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: membre.id },
      select: {
        login: true,
        email: true,
        discordId: true,
        discordUsername: true,
        passwordHash: true,
        sessionsDepuis: true,
        lastSeenAt: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.findMany({
      where: { userId: membre.id, action: "connexion" },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  return (
    <>
      <EnTetePage
        surTitre="Vos identifiants"
        titre="Mon compte"
        icone="senechal"
        texte="Votre identifiant, votre email et votre mot de passe. Ces informations ne regardent que vous et les Patriarches."
        actions={
          <LienBouton href={`/membres/${membre.id}`} variante="argent" icone="membres">
            Ma fiche publique
          </LienBouton>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Carte
            titre="Changer mon mot de passe"
            sousTitre={`Au moins ${LONGUEUR_MIN} caractères, refusé s'il figure dans une fuite connue`}
            icone="senechal"
          >
            {compte?.passwordHash ? (
              <FormulaireMotDePasse />
            ) : (
              <Message tone="alerte" titre="Aucun mot de passe défini">
                Ce compte se connecte uniquement par Discord. Pour définir un mot de passe,
                adressez-vous au Sénéchal ou à un Patriarche.
              </Message>
            )}
          </Carte>

          <Carte titre="Comment vos identifiants sont protégés" icone="audit">
            <ul className="space-y-2.5 text-[0.84rem] text-givre-200/80">
              {[
                [
                  "Votre mot de passe n'est jamais lisible",
                  "Il est haché avec bcrypt dès la saisie. Ni les Patriarches, ni le Sénéchal, ni personne d'autre ne peut le lire — au mieux le remplacer.",
                ],
                [
                  "Les mots de passe ayant fuité sont refusés",
                  "Chaque mot de passe est comparé à une liste embarquée et aux fuites publiques recensées. La vérification se fait sans jamais transmettre votre mot de passe.",
                ],
                [
                  `Après ${ESSAIS_AVANT_BLOCAGE} tentatives, la porte se ferme`,
                  "Le blocage est compté sur le serveur, par identifiant et par adresse, et il s'allonge à chaque nouvelle série. Recharger la page n'y change rien.",
                ],
                [
                  "Changer de mot de passe ferme les autres sessions",
                  "Si quelqu'un s'était introduit, il est éjecté à l'instant même où vous changez.",
                ],
              ].map(([titre, texte]) => (
                <li key={titre} className="flex gap-2.5">
                  <Icone nom="valider" taille={14} className="mt-0.5 shrink-0 text-[#8fd0a3]" />
                  <span>
                    <span className="block text-givre-50">{titre}</span>
                    <span className="block text-[0.78rem] text-givre-300/70">{texte}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Carte>
        </div>

        <div className="space-y-6">
          <Carte titre="État du compte" icone="registre">
            <Definitions
              colonnes={1}
              items={[
                ["Identifiant", <code key="l" className="text-or-200">{compte?.login}</code>],
                [
                  "Email",
                  compte?.email || <span className="text-givre-300/40">non renseigné</span>,
                ],
                [
                  "Mot de passe",
                  compte?.passwordHash ? (
                    <Badge tone="succes">défini</Badge>
                  ) : (
                    <Badge tone="alerte">aucun</Badge>
                  ),
                ],
                [
                  "Connexion Discord",
                  compte?.discordId ? (
                    <Badge tone="succes">liée ({compte.discordUsername})</Badge>
                  ) : (
                    <Badge tone="neutre">non liée</Badge>
                  ),
                ],
                [
                  "Sessions valides depuis",
                  compte?.sessionsDepuis ? dateHeure(compte.sessionsDepuis) : "—",
                ],
                ["Dernière présence", compte?.lastSeenAt ? relatif(compte.lastSeenAt) : "—"],
                ["Compte créé le", compte ? date(compte.createdAt) : "—"],
              ]}
            />
          </Carte>

          <Carte
            titre="Activité de connexion"
            sousTitre="Vos dernières connexions et déconnexions"
            icone="audit"
            padding={false}
          >
            {dernieresConnexions.length === 0 ? (
              <p className="px-4 py-5 text-[0.8rem] text-givre-300/55">
                Rien à signaler pour l'instant.
              </p>
            ) : (
              <ul className="divide-y divide-argent-500/10">
                {dernieresConnexions.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Icone nom="loup" taille={13} className="shrink-0 text-givre-300/50" />
                    <span className="min-w-0 flex-1 truncate text-[0.8rem] text-givre-100">
                      {e.label}
                    </span>
                    <span className="shrink-0 text-[0.68rem] text-givre-300/45">
                      {relatif(e.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Carte>

          <Carte titre="Un doute ?" icone="ticket">
            <p className="text-[0.82rem] leading-relaxed text-givre-300/75">
              Si vous constatez une connexion que vous ne reconnaissez pas, changez votre mot de
              passe immédiatement — cela ferme toutes les autres sessions — puis{" "}
              <Link href="/gouvernance/tickets" className="text-or-300 hover:underline">
                ouvrez un ticket
              </Link>{" "}
              auprès du Sénéchal.
            </p>
          </Carte>
        </div>
      </div>
    </>
  );
}
