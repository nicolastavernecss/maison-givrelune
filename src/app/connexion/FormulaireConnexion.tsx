"use client";

import { useActionState, useEffect, useState } from "react";
import { actionConnexion, type EtatConnexion } from "@/app/actions/auth";
import { Champ, Saisie, BoutonEnvoi } from "@/components/ui/form";
import { Message } from "@/components/ui/base";

/**
 * Le décompte n'est qu'un affichage. Le blocage vit côté serveur : le
 * remettre à zéro dans le navigateur ne permet pas d'essayer plus tôt.
 */
function Decompte({ depart }: { depart: number }) {
  const [restant, setRestant] = useState(depart);

  useEffect(() => {
    setRestant(depart);
    if (depart <= 0) return;
    const t = setInterval(() => setRestant((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(t);
  }, [depart]);

  if (restant <= 0) return <>Vous pouvez réessayer.</>;
  return (
    <>
      Réessayez dans <span className="tabular-nums">{restant}</span> seconde
      {restant > 1 ? "s" : ""}.
    </>
  );
}

export function FormulaireConnexion() {
  const [etat, action] = useActionState<EtatConnexion, FormData>(actionConnexion, {});

  return (
    <form action={action} className="space-y-4">
      {etat.erreur && (
        <Message tone={etat.secondes ? "alerte" : "danger"} titre={etat.secondes ? "Trop de tentatives" : undefined}>
          {etat.secondes ? (
            <Decompte depart={etat.secondes} />
          ) : (
            <>
              {etat.erreur}
              {etat.essaisRestants !== undefined && etat.essaisRestants > 0 && (
                <span className="mt-1 block text-[0.72rem] opacity-80">
                  {etat.essaisRestants} tentative{etat.essaisRestants > 1 ? "s" : ""} restante
                  {etat.essaisRestants > 1 ? "s" : ""} avant blocage temporaire.
                </span>
              )}
            </>
          )}
        </Message>
      )}

      <Champ label="Identifiant" requis>
        <Saisie
          name="login"
          autoComplete="username"
          required
          maxLength={60}
          placeholder="prenom.nom"
          autoFocus
        />
      </Champ>

      <Champ label="Mot de passe" requis>
        <Saisie
          name="motDePasse"
          type="password"
          autoComplete="current-password"
          required
          maxLength={200}
          placeholder="••••••••••••"
        />
      </Champ>

      <BoutonEnvoi icone="loup" className="w-full !py-2" disabled={Boolean(etat.secondes)}>
        Franchir le seuil
      </BoutonEnvoi>
    </form>
  );
}
