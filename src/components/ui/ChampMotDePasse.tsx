"use client";

import { useState } from "react";
import { Champ, Saisie } from "./form";
import { Icone } from "./Icone";
// Uniquement l'indicateur : les règles de refus et la liste des mots de passe
// compromis restent côté serveur, hors de portée du navigateur.
import { LONGUEUR_MIN, forceIndicative } from "@/lib/securite/indicateur";

/**
 * Champ de mot de passe avec aide à la saisie.
 *
 * L'indicateur est purement visuel : il n'autorise ni ne refuse rien.
 * La décision appartient au serveur, qui revérifie tout — longueur, liste
 * des fuites, suites clavier — au moment de l'envoi.
 */
export function ChampMotDePasse({
  nom = "motDePasse",
  label = "Mot de passe",
  aide,
  requis = true,
  autoComplete = "new-password",
  avecIndicateur = true,
  large,
  erreur,
}: {
  nom?: string;
  label?: string;
  aide?: string;
  requis?: boolean;
  autoComplete?: string;
  avecIndicateur?: boolean;
  large?: boolean;
  /** Reproche fait par le serveur, affiché sous le champ. */
  erreur?: string;
}) {
  const [valeur, setValeur] = useState("");
  const [visible, setVisible] = useState(false);

  const force = forceIndicative(valeur);
  const couleurs = ["bg-danger", "bg-danger", "bg-alerte", "bg-attente", "bg-succes"];
  const textes = ["text-[#e69a8c]", "text-[#e69a8c]", "text-[#e5a877]", "text-[#e3c47c]", "text-[#8fd0a3]"];

  return (
    <Champ
      label={label}
      requis={requis}
      large={large}
      erreur={erreur}
      aide={aide ?? `${LONGUEUR_MIN} caractères minimum. Une phrase dont vous seul vous souvenez vaut mieux qu'un mot compliqué.`}
    >
      <div className="relative">
        <Saisie
          name={nom}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={requis}
          minLength={LONGUEUR_MIN}
          maxLength={200}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          aria-invalid={erreur ? true : undefined}
          className={`!pr-10 ${erreur ? "border-danger/60 bg-danger/5" : ""}`}
          placeholder="••••••••••••"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute top-1/2 right-2 -translate-y-1/2 text-givre-300/50 transition-colors hover:text-givre-100"
        >
          <Icone nom={visible ? "refuser" : "audit"} taille={15} />
        </button>
      </div>

      {avecIndicateur && valeur.length > 0 && (
        <span className="mt-2 block">
          <span className="flex gap-1" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < force.score ? couleurs[force.score] : "bg-argent-500/15"
                }`}
              />
            ))}
          </span>
          <span className={`mt-1 block text-[0.68rem] ${textes[force.score]}`}>
            Robustesse : {force.label}
            {force.score < 2 && " — le serveur refusera probablement ce mot de passe."}
          </span>
        </span>
      )}
    </Champ>
  );
}
