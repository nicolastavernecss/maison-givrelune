"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps, ReactNode } from "react";
import { Icone, type NomIcone } from "./Icone";

/* ── Enveloppe de champ ──────────────────────────────────── */

export function Champ({
  label,
  aide,
  requis,
  erreur,
  children,
  large,
}: {
  label: ReactNode;
  aide?: ReactNode;
  requis?: boolean;
  erreur?: string;
  children: ReactNode;
  large?: boolean;
}) {
  return (
    <label className={`block ${large ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-baseline gap-1.5 text-[0.72rem] font-medium tracking-wide text-givre-200/85">
        {label}
        {requis && <span className="text-or-400">*</span>}
      </span>
      {children}
      {aide && <span className="mt-1 block text-[0.68rem] text-givre-300/55">{aide}</span>}
      {erreur && <span className="mt-1 block text-[0.7rem] text-[#e69a8c]">{erreur}</span>}
    </label>
  );
}

export function Saisie(props: ComponentProps<"input">) {
  return <input {...props} className={`champ ${props.className ?? ""}`} />;
}

export function Zone(props: ComponentProps<"textarea">) {
  return <textarea rows={4} {...props} className={`champ resize-y ${props.className ?? ""}`} />;
}

export function Selection({
  options,
  vide,
  ...props
}: ComponentProps<"select"> & {
  options: { value: string; label: string; group?: string }[];
  vide?: string;
}) {
  const groupes = options.some((o) => o.group);
  return (
    <select {...props} className={`champ ${props.className ?? ""}`}>
      {vide !== undefined && <option value="">{vide}</option>}
      {groupes
        ? [...new Set(options.map((o) => o.group ?? "Autres"))].map((g) => (
            <optgroup key={g} label={g}>
              {options
                .filter((o) => (o.group ?? "Autres") === g)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ))
        : options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
    </select>
  );
}

export function Case({
  label,
  aide,
  ...props
}: ComponentProps<"input"> & { label: ReactNode; aide?: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 rounded-[2px] border border-argent-500/18 bg-nuit-950/40 px-3 py-2.5 transition-colors hover:border-or-500/30">
      <input
        type="checkbox"
        {...props}
        className="mt-0.5 size-4 shrink-0 accent-[var(--color-or-500)]"
      />
      <span className="min-w-0">
        <span className="block text-[0.82rem] text-givre-100">{label}</span>
        {aide && <span className="block text-[0.68rem] text-givre-300/55">{aide}</span>}
      </span>
    </label>
  );
}

/* ── Grille de formulaire ────────────────────────────────── */

export function GrilleChamps({
  children,
  titre,
  colonnes = 2,
}: {
  children: ReactNode;
  titre?: string;
  colonnes?: 1 | 2 | 3;
}) {
  const g = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3" }[colonnes];
  return (
    <fieldset className="mb-6 last:mb-0">
      {titre && (
        <legend className="sur-titre mb-3 block w-full border-b border-or-600/25 pb-2">{titre}</legend>
      )}
      <div className={`grid grid-cols-1 gap-x-5 gap-y-4 ${g}`}>{children}</div>
    </fieldset>
  );
}

/* ── Boutons liés à un formulaire ────────────────────────── */

export function BoutonEnvoi({
  children = "Enregistrer",
  icone = "valider",
  variante = "or",
  className = "",
  ...props
}: ComponentProps<"button"> & { icone?: NomIcone; variante?: "or" | "argent" | "danger" }) {
  const { pending } = useFormStatus();
  const styles = {
    or: "bg-gradient-to-b from-or-400 to-or-600 text-nuit-950 border-or-300/50 hover:from-or-300 hover:to-or-500 font-semibold",
    argent: "bg-nuit-700/70 text-givre-100 border-argent-500/25 hover:bg-nuit-600/80",
    danger: "bg-danger/18 text-[#e69a8c] border-danger/40 hover:bg-danger/28",
  }[variante];

  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-[2px] border px-3.5 py-1.5 text-[0.82rem] transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 ${styles} ${className}`}
    >
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Icone nom={icone} taille={15} />
      )}
      {pending ? "En cours…" : children}
    </button>
  );
}

/** Bouton d'action rapide dans une ligne de tableau (valider, révoquer…). */
export function ActionLigne({
  children,
  icone,
  ton = "neutre",
  ...props
}: ComponentProps<"button"> & { icone?: NomIcone; ton?: "neutre" | "succes" | "danger" }) {
  const { pending } = useFormStatus();
  const styles = {
    neutre: "border-argent-500/25 text-givre-200 hover:bg-nuit-600/70",
    succes: "border-succes/35 text-[#8fd0a3] hover:bg-succes/15",
    danger: "border-danger/35 text-[#e69a8c] hover:bg-danger/15",
  }[ton];
  return (
    <button
      type="submit"
      disabled={pending || props.disabled}
      {...props}
      className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-1 text-[0.7rem] transition-colors disabled:opacity-40 ${styles}`}
    >
      {icone && <Icone nom={icone} taille={12} />}
      {children}
    </button>
  );
}
