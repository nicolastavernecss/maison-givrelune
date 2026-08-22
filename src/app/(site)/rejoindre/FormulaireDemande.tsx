"use client";

import { useActionState } from "react";
import Link from "next/link";
import { actionDemandeRole, type EtatDemande } from "@/app/actions/gouvernance";
import { Champ, GrilleChamps, Saisie, Selection, Zone, BoutonEnvoi } from "@/components/ui/form";
import { ChampMotDePasse } from "@/components/ui/ChampMotDePasse";
import { Message, Ornement } from "@/components/ui/base";
import { Icone } from "@/components/ui/Icone";

export function FormulaireDemande({
  branches,
  cercles,
  metiers,
}: {
  branches: { value: string; label: string; grades: string[] }[];
  cercles: { value: string; label: string }[];
  metiers: { value: string; label: string; group: string }[];
}) {
  const [etat, action] = useActionState<EtatDemande, FormData>(actionDemandeRole, {});

  if (etat.succes) {
    return (
      <div className="carte carte-texture px-7 py-14 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-full border border-succes/40 bg-succes/10 text-[#8fd0a3]">
          <Icone nom="valider" taille={28} epaisseur={1.4} />
        </span>
        <h2 className="titre-imperial mt-6 text-xl text-givre-50">Votre demande est consignée</h2>
        <Ornement className="my-6 mx-auto max-w-xs" />
        <p className="mx-auto max-w-md text-sm leading-relaxed text-givre-300/80">
          Elle sera lue par un gradé, puis présentée aux Patriarches. La réponse vous parviendra sur le
          Discord de la Maison. Prenez le temps de lire le règlement en attendant.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/reglement"
            className="rounded-[2px] border border-argent-500/25 bg-nuit-700/60 px-4 py-2 text-[0.82rem] text-givre-100 transition-colors hover:bg-nuit-600/70"
          >
            Lire le règlement
          </Link>
          <Link
            href="/"
            className="rounded-[2px] px-4 py-2 text-[0.82rem] text-givre-300/70 transition-colors hover:text-or-300"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    );
  }

  const grades = branches.flatMap((b) =>
    b.grades.map((g) => ({ value: g, label: g, group: b.label })),
  );

  return (
    <form action={action} className="carte carte-texture p-6 sm:p-8">
      {etat.erreur && (
        <div className="mb-6">
          <Message tone="danger" titre={etat.erreurs && etat.erreurs.length > 1 ? "Mot de passe refusé" : undefined}>
            {etat.erreurs && etat.erreurs.length > 1 ? (
              <ul className="mt-1 space-y-1">
                {etat.erreurs.map((e) => (
                  <li key={e}>• {e}</li>
                ))}
              </ul>
            ) : (
              etat.erreur
            )}
          </Message>
        </div>
      )}

      <GrilleChamps titre="Qui êtes-vous">
        <Champ label="Nom RP" requis aide="Le nom que porte votre personnage en jeu.">
          <Saisie name="nomRp" required maxLength={80} placeholder="Bjarke Fend-la-Brume" />
        </Champ>
        <Champ label="Pseudo Discord" aide="Permet de vous répondre et, plus tard, de lier votre compte.">
          <Saisie name="discordTag" maxLength={60} placeholder="bjarke" />
        </Champ>
        <Champ label="Autre moyen de contact" large>
          <Saisie name="contact" maxLength={120} placeholder="Facultatif" />
        </Champ>
      </GrilleChamps>

      <GrilleChamps titre="Vos identifiants">
        <Champ
          label="Adresse email"
          requis
          aide="Sert à vous joindre et à retrouver votre compte. Elle n'est visible que des Patriarches."
        >
          <Saisie
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="bjarke@exemple.fr"
          />
        </Champ>

        <Champ
          label="Identifiant de connexion"
          requis
          aide="Minuscules, chiffres, point, tiret. C'est avec lui que vous vous connecterez."
        >
          <Saisie
            name="loginSouhaite"
            required
            maxLength={40}
            pattern="[a-z0-9._-]+"
            autoComplete="username"
            placeholder="bjarke.fendlabrume"
          />
        </Champ>

        <ChampMotDePasse />

        <Champ label="Confirmer le mot de passe" requis>
          <Saisie
            name="confirmation"
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
            placeholder="••••••••••••"
          />
        </Champ>

        <div className="sm:col-span-2">
          <Message tone="neutre" icone="senechal">
            Votre mot de passe est chiffré dès l'envoi et n'est jamais lisible — pas même par les
            Patriarches. Il est vérifié contre les listes de mots de passe ayant fuité : s'il y
            figure, il sera refusé. Votre compte ne sera ouvert qu'une fois la demande acceptée.
          </Message>
        </div>
      </GrilleChamps>

      <GrilleChamps titre="Votre place dans la Maison">
        <Champ label="Branche">
          <Selection name="branche" options={branches} vide="— Aucune préférence —" />
        </Champ>
        <Champ label="Grade actuel" aide="Le grade que vous tenez aujourd'hui, s'il y en a un.">
          <Selection name="gradeSouhaite" options={grades} vide="— Aucun pour l'instant —" />
        </Champ>
        <Champ label="Cercle">
          <Selection name="cercle" options={cercles} vide="— Aucun —" />
        </Champ>
        <Champ
          label="Métiers"
          large
          aide="Séparez par des virgules. Ex. : Chasseur, Pêcheur."
        >
          <Saisie name="metiers" maxLength={200} list="liste-metiers" placeholder="Forgeron, Mineur" />
          <datalist id="liste-metiers">
            {metiers.map((m) => (
              <option key={m.value} value={m.label} />
            ))}
          </datalist>
        </Champ>
      </GrilleChamps>

      <GrilleChamps titre="Votre parole" colonnes={1}>
        <Champ
          label="Présenté par"
          aide="Un membre de la Maison qui répond de vous, s'il y en a un."
        >
          <Saisie name="presentePar" maxLength={80} placeholder="Taga Duriff" />
        </Champ>
        <Champ
          label="Message aux Patriarches"
          requis
          aide="Présentez-vous : votre parcours, ce que vous savez faire, ce que vous cherchez."
        >
          <Zone
            name="message"
            required
            minLength={20}
            maxLength={4000}
            rows={7}
            placeholder="Je chasse dans ces bois depuis dix hivers. Je ne demande pas de titre, seulement de servir…"
          />
        </Champ>
      </GrilleChamps>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-argent-500/12 pt-5">
        <p className="max-w-sm text-[0.72rem] text-givre-300/55">
          En adressant cette demande, vous vous engagez à respecter le règlement de la Maison.
        </p>
        <BoutonEnvoi icone="demande">Adresser la demande</BoutonEnvoi>
      </div>
    </form>
  );
}
