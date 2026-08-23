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

  /** Reproche fait à ce champ par le serveur, s'il y en a un. */
  const err = (nom: string) => etat.champs?.[nom];
  /** Ce qui avait été saisi, pour ne pas le faire retaper. */
  const val = (nom: string) => etat.valeurs?.[nom] ?? "";
  /** Marque visuelle du champ fautif. */
  const marque = (nom: string) =>
    err(nom) ? { "aria-invalid": true as const, className: "border-danger/60 bg-danger/5" } : {};

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
        <div
          role="alert"
          aria-live="polite"
          className="mb-6 rounded-[2px] border border-danger/50 bg-danger/10 px-4 py-3.5"
        >
          <p className="flex items-center gap-2 text-[0.88rem] font-semibold text-[#e69a8c]">
            <Icone nom="alerte" taille={16} />
            {etat.erreur}
          </p>

          {etat.erreurs && etat.erreurs.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {etat.erreurs.map((e) => (
                <li key={e} className="flex gap-2 text-[0.82rem] leading-relaxed text-[#e69a8c]/95">
                  <span aria-hidden className="select-none">
                    ·
                  </span>
                  <span>{e}</span>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-3 text-[0.72rem] leading-relaxed text-givre-300/60">
            Corrigez les points ci-dessus et renvoyez la demande. Ce que vous aviez écrit a été
            conservé ; seul le mot de passe est à ressaisir.
          </p>
        </div>
      )}

      <GrilleChamps titre="Qui êtes-vous">
        <Champ label="Nom RP" requis erreur={err("nomRp")} aide="Le nom que porte votre personnage en jeu.">
          <Saisie
            name="nomRp"
            required
            maxLength={80}
            defaultValue={val("nomRp")}
            placeholder="Bjarke Fend-la-Brume"
            {...marque("nomRp")}
          />
        </Champ>
        <Champ
          label="Pseudo Discord"
          erreur={err("discordTag")}
          aide="Permet de vous répondre et, plus tard, de lier votre compte."
        >
          <Saisie
            name="discordTag"
            maxLength={60}
            defaultValue={val("discordTag")}
            placeholder="bjarke"
            {...marque("discordTag")}
          />
        </Champ>
        <Champ label="Autre moyen de contact" large erreur={err("contact")}>
          <Saisie
            name="contact"
            maxLength={120}
            defaultValue={val("contact")}
            placeholder="Facultatif"
            {...marque("contact")}
          />
        </Champ>
      </GrilleChamps>

      <GrilleChamps titre="Vos identifiants">
        <Champ
          label="Adresse email"
          requis
          erreur={err("email")}
          aide="Sert à vous joindre et à retrouver votre compte. Elle n'est visible que des Patriarches."
        >
          <Saisie
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            defaultValue={val("email")}
            placeholder="bjarke@exemple.fr"
            {...marque("email")}
          />
        </Champ>

        <Champ
          label="Identifiant de connexion"
          requis
          erreur={err("loginSouhaite")}
          aide="Minuscules, chiffres, point, tiret. C'est avec lui que vous vous connecterez."
        >
          <Saisie
            name="loginSouhaite"
            required
            maxLength={40}
            pattern="[a-z0-9._-]+"
            autoComplete="username"
            defaultValue={val("loginSouhaite")}
            placeholder="bjarke.fendlabrume"
            {...marque("loginSouhaite")}
          />
        </Champ>

        {/* La clé remonte le champ à chaque envoi : les deux saisies repartent
            vides ensemble, sans quoi la confirmation seule serait effacée. */}
        <ChampMotDePasse key={etat.tentative ?? 0} erreur={err("motDePasse")} />

        <Champ label="Confirmer le mot de passe" requis erreur={err("confirmation")}>
          <Saisie
            name="confirmation"
            type="password"
            required
            minLength={12}
            maxLength={200}
            autoComplete="new-password"
            placeholder="••••••••••••"
            {...marque("confirmation")}
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
        <Champ label="Branche" erreur={err("branche")}>
          <Selection
            name="branche"
            options={branches}
            defaultValue={val("branche")}
            vide="— Aucune préférence —"
          />
        </Champ>
        <Champ
          label="Grade actuel"
          erreur={err("gradeSouhaite")}
          aide="Le grade que vous tenez aujourd'hui, s'il y en a un."
        >
          <Selection
            name="gradeSouhaite"
            options={grades}
            defaultValue={val("gradeSouhaite")}
            vide="— Aucun pour l'instant —"
          />
        </Champ>
        <Champ label="Cercle" erreur={err("cercle")}>
          <Selection name="cercle" options={cercles} defaultValue={val("cercle")} vide="— Aucun —" />
        </Champ>
        <Champ
          label="Métiers"
          large
          erreur={err("metiers")}
          aide="Séparez par des virgules. Ex. : Chasseur, Pêcheur."
        >
          <Saisie
            name="metiers"
            maxLength={200}
            list="liste-metiers"
            defaultValue={val("metiers")}
            placeholder="Forgeron, Mineur"
            {...marque("metiers")}
          />
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
          erreur={err("presentePar")}
          aide="Un membre de la Maison qui répond de vous, s'il y en a un."
        >
          <Saisie
            name="presentePar"
            maxLength={80}
            defaultValue={val("presentePar")}
            placeholder="Taga Duriff"
            {...marque("presentePar")}
          />
        </Champ>
        <Champ
          label="Message aux Patriarches"
          requis
          erreur={err("message")}
          aide="Présentez-vous : votre parcours, ce que vous savez faire, ce que vous cherchez. 20 caractères minimum."
        >
          <Zone
            name="message"
            required
            minLength={20}
            maxLength={4000}
            rows={7}
            defaultValue={val("message")}
            placeholder="Je chasse dans ces bois depuis dix hivers. Je ne demande pas de titre, seulement de servir…"
            {...marque("message")}
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
