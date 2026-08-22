import type { Metadata } from "next";
import { Ornement } from "@/components/ui/Embleme";
import { Icone } from "@/components/ui/Icone";
import { prisma } from "@/lib/db";
import { FormulaireDemande } from "./FormulaireDemande";

export const metadata: Metadata = { title: "Nous rejoindre" };
export const dynamic = "force-dynamic";

const ETAPES = [
  {
    icone: "demande",
    titre: "1. La demande",
    texte: "Vous remplissez ce formulaire. Il arrive directement au registre des demandes de rôle.",
  },
  {
    icone: "membres",
    titre: "2. L'examen",
    texte: "Un gradé la lit, vérifie votre parcours et interroge votre parrain s'il y en a un.",
  },
  {
    icone: "lune",
    titre: "3. La présentation",
    texte: "La demande est présentée aux Patriarches, qui tranchent. C'est la seule voie d'entrée.",
  },
  {
    icone: "givre",
    titre: "4. La période d'essai",
    texte: "Vous entrez sous statut d'essai. Ce sont vos actes qui le lèveront, rien d'autre.",
  },
] as const;

export default async function PageRejoindre() {
  const [branches, cercles, metiers] = await Promise.all([
    prisma.branch.findMany({
      orderBy: { position: "asc" },
      include: { grades: { orderBy: { level: "asc" } } },
    }),
    prisma.circle.findMany({ orderBy: { label: "asc" } }),
    prisma.metier.findMany({ orderBy: { position: "asc" } }),
  ]);

  const familles: Record<string, string> = {
    extraction: "Extraction & récolte",
    transformation: "Transformation & production",
    service: "Services & protection",
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <header className="mb-12 text-center">
        <p className="sur-titre">Entrer dans la Maison</p>
        <h1 className="titre-imperial mt-2 text-3xl text-givre-50 sm:text-4xl">Demande de rôle</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-givre-300/75">
          Nous ne demandons ni titre, ni lignage, ni fortune. Nous demandons ce que vous savez faire et ce
          que vaut votre parole. Le reste, vous le bâtirez ici.
        </p>
        <Ornement className="mt-7" />
      </header>

      <div className="mb-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {ETAPES.map((e) => (
          <div key={e.titre} className="carte p-4">
            <Icone nom={e.icone} taille={18} className="text-or-400" epaisseur={1.3} />
            <p className="titre-imperial mt-2.5 text-[0.82rem] text-givre-50">{e.titre}</p>
            <p className="mt-1.5 text-[0.75rem] leading-relaxed text-givre-300/70">{e.texte}</p>
          </div>
        ))}
      </div>

      <FormulaireDemande
        branches={branches.map((b) => ({
          value: b.label,
          label: b.label,
          grades: b.grades.map((g) => g.label),
        }))}
        cercles={cercles.map((c) => ({ value: c.label, label: c.label }))}
        metiers={metiers.map((m) => ({
          value: m.key,
          label: m.label,
          group: familles[m.category] ?? "Autres",
        }))}
      />
    </div>
  );
}
