import Link from "next/link";
import { Embleme, BanniereVerticale, Ornement } from "@/components/ui/Embleme";
import { Icone, iconeMetier } from "@/components/ui/Icone";
import { LienBouton } from "@/components/ui/base";
import { prisma } from "@/lib/db";
import { MAISON } from "@/lib/domain";

export const dynamic = "force-dynamic";

const OUTILS = [
  {
    icone: "permis",
    titre: "Permis & registres",
    texte:
      "Droits de passage, patrouilles, permis de récolte : demandés, accordés, horodatés et signés. Plus rien ne se perd dans le fil du salon.",
  },
  {
    icone: "marche",
    titre: "Cours du marché",
    texte:
      "Chaque membre relève les prix qu'il constate. Le site en tire une courbe, une moyenne, un minimum et un maximum par matière.",
  },
  {
    icone: "atelier",
    titre: "Ateliers & recettes",
    texte:
      "La nomenclature de chaque objet, la chaîne minerai → lingot → pièce, et le coût de fabrication calculé au cours du jour.",
  },
  {
    icone: "stock",
    titre: "Stocks & stash",
    texte:
      "Le stock commun de la Maison et le stash de chaque membre, avec photos des pièces, valorisation et alertes de seuil bas.",
  },
  {
    icone: "commande",
    titre: "Commandes & impayés",
    texte:
      "Le gabarit de commande de la Maison, le reste à payer calculé tout seul, et le tableau des impayés en évidence.",
  },
  {
    icone: "tresorerie",
    titre: "Trésorerie",
    texte:
      "Le coffre, la valeur estimée du stock et le journal des mouvements — réservés au Conseil et à l'Intendant.",
  },
] as const;

export default async function Accueil() {
  const [branches, metiers, conseil, nbMembres, nbMatieres, nbRecettes] = await Promise.all([
    prisma.branch.findMany({
      orderBy: { position: "asc" },
      include: { grades: { orderBy: { level: "asc" } } },
    }),
    prisma.metier.findMany({ orderBy: { position: "asc" } }),
    prisma.councilRole.findMany({ orderBy: { position: "asc" } }),
    prisma.user.count({ where: { status: { not: "archive" } } }),
    prisma.material.count(),
    prisma.recipe.count(),
  ]);

  const familles = [
    { cle: "extraction", titre: "Extraction & récolte", texte: "Ceux qui prennent à la terre." },
    { cle: "transformation", titre: "Transformation & production", texte: "Ceux qui donnent une forme." },
    { cle: "service", titre: "Services & protection", texte: "Ceux qui portent et défendent le nom." },
  ];

  return (
    <>
      {/* ══ Hero ══ */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(760px 420px at 50% -6%, rgba(42,61,99,0.55), transparent 68%), radial-gradient(500px 320px at 12% 30%, rgba(123,164,200,0.12), transparent 70%)",
          }}
        />
        <div className="mx-auto flex max-w-6xl flex-col items-center px-5 py-20 text-center sm:py-28">
          <div className="animer-apparaitre">
            <Embleme taille={150} className="scintille" />
          </div>

          <p className="sur-titre mt-8 animer-monter">{MAISON.serveur} · Bordeciel</p>
          <h1 className="titre-imperial mt-3 animer-monter text-4xl leading-[1.1] text-givre-50 sm:text-6xl">
            Maison <span className="text-or-300">Givrelune</span>
          </h1>

          <Ornement className="my-7 w-full max-w-md" />

          <p className="recit max-w-2xl animer-monter text-lg text-givre-200/90 italic sm:text-xl">
            « {MAISON.devise} »
          </p>
          <p className="mt-5 max-w-2xl text-[0.95rem] leading-relaxed text-givre-300/75">
            Fondée par {MAISON.fondateurs.join(" et ")}, sans lignage noble, pour bâtir un nom par les
            actes. Le givre pour la patience, la lune pour l'ambition.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <LienBouton href="/rejoindre" variante="or" icone="loup" className="!px-5 !py-2.5">
              Adresser une demande de rôle
            </LienBouton>
            <LienBouton href="/histoire" variante="argent" icone="histoire" className="!px-5 !py-2.5">
              Lire notre histoire
            </LienBouton>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {[
              ["Membres", nbMembres],
              ["Branches", branches.length],
              ["Métiers", metiers.length],
              ["Matières suivies", nbMatieres],
              ["Recettes", nbRecettes],
            ].map(([label, valeur]) => (
              <div key={String(label)} className="text-center">
                <p className="titre-imperial text-2xl text-or-300 tabular-nums">{valeur as number}</p>
                <p className="mt-0.5 text-[0.62rem] tracking-[0.2em] text-givre-300/50 uppercase">
                  {label as string}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Manifeste ══ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="flex items-stretch gap-8">
          <BanniereVerticale className="hidden shrink-0 self-start lg:block" />
          <div className="parchemin flex-1 px-7 py-9 sm:px-12 sm:py-12">
            <div className="relative z-10 recit mx-auto max-w-2xl text-parchemin-900">
              <p className="sur-titre !text-parchemin-700 mb-4">Ce que nous sommes</p>
              <p className="text-xl leading-relaxed italic">« {MAISON.citations[0]} »</p>
              <div className="my-6 h-px bg-parchemin-700/25" />
              <p>
                La Maison Givrelune ne descend d'aucun sang noble. Elle a été fondée par deux hommes qui
                n'avaient rien à hériter et qui ont fait le même constat : en Bordeciel, on ne vous demande pas
                d'où vous venez si votre travail est irréprochable et votre parole tenue.
              </p>
              <p>
                Nous cherchons la richesse, les terres, la réputation et le pouvoir. Nous ne nous en cachons
                pas. Mais rien de tout cela ne se prend : cela se <strong>mérite</strong> — contrat après
                contrat, patrouille après patrouille, commande après commande.
              </p>
              <p className="mb-0 font-semibold">
                Chez Givrelune, le rang ne se reçoit pas par la naissance. Les actes forgent le nom.
              </p>
            </div>
          </div>
          <BanniereVerticale className="hidden shrink-0 self-start lg:block" />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {MAISON.valeurs.map((v) => (
            <span
              key={v}
              className="rounded-full border border-or-500/30 bg-or-500/8 px-5 py-1.5 text-[0.72rem] tracking-[0.26em] text-or-300 uppercase"
            >
              {v}
            </span>
          ))}
        </div>
      </section>

      {/* ══ Branches ══ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <header className="mb-10 text-center">
          <p className="sur-titre">L'organisation</p>
          <h2 className="titre-imperial mt-2 text-3xl text-givre-50">Les quatre branches</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-givre-300/70">
            Chaque branche a ses grades, ses registres et ses responsabilités. Un membre y progresse par ses
            actes, jamais par sa naissance.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {branches.map((b) => (
            <article
              key={b.id}
              className="carte carte-texture group relative overflow-hidden p-6 transition-colors duration-200 hover:border-or-500/30"
            >
              <div
                className="absolute inset-x-0 top-0 h-px opacity-70"
                style={{ background: `linear-gradient(90deg, transparent, ${b.color}, transparent)` }}
              />
              <div className="flex items-start gap-4">
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-[2px] border"
                  style={{
                    borderColor: `${b.color}55`,
                    background: `${b.color}14`,
                    color: b.color,
                  }}
                >
                  <Icone nom={b.icon} taille={24} epaisseur={1.3} />
                </span>
                <div className="min-w-0">
                  <h3 className="titre-imperial text-lg text-givre-50">{b.label}</h3>
                  {b.motto && (
                    <p className="recit mt-0.5 text-[0.9rem] text-givre-300/70 italic">« {b.motto} »</p>
                  )}
                </div>
              </div>

              <p className="mt-4 text-[0.85rem] leading-relaxed text-givre-200/75">{b.description}</p>

              <ol className="mt-5 space-y-1.5">
                {b.grades.map((g) => (
                  <li key={g.id} className="flex items-center gap-2.5 text-[0.8rem]">
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full border text-[0.6rem] tabular-nums"
                      style={{
                        borderColor: g.level === 1 ? "rgba(210,184,115,0.6)" : "rgba(147,167,189,0.25)",
                        color: g.level === 1 ? "#e3cd94" : "#93a7bd",
                      }}
                    >
                      {g.level}
                    </span>
                    <span className={g.level === 1 ? "text-or-200" : "text-givre-200/80"}>{g.label}</span>
                  </li>
                ))}
              </ol>
            </article>
          ))}
        </div>
      </section>

      {/* ══ Conseil ══ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <header className="mb-10 text-center">
          <p className="sur-titre">Au-dessus des branches</p>
          <h2 className="titre-imperial mt-2 text-3xl text-givre-50">Le Conseil de la Maison</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-givre-300/70">
            Cinq fonctions transverses, portées par des membres qui ont déjà fait leurs preuves. Elles
            traversent les branches et répondent aux Patriarches.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {conseil.map((c) => (
            <div key={c.id} className="carte carte-texture p-5 text-center">
              <span className="mx-auto grid size-11 place-items-center rounded-full border border-or-500/30 bg-or-500/8 text-or-300">
                <Icone nom={c.icon} taille={20} epaisseur={1.3} />
              </span>
              <h3 className="titre-imperial mt-3 text-[0.95rem] text-givre-50">{c.label}</h3>
              <p className="mt-2 text-[0.76rem] leading-relaxed text-givre-300/70">{c.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Métiers ══ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <header className="mb-10 text-center">
          <p className="sur-titre">Le travail</p>
          <h2 className="titre-imperial mt-2 text-3xl text-givre-50">Les métiers de la Maison</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-givre-300/70">
            Sur Keizaal, l'économie est entièrement tenue par les joueurs. Ce que nous extrayons, ce que nous
            transformons et ce que nous vendons fait la richesse de la Maison.
          </p>
        </header>

        <div className="space-y-8">
          {familles.map((f) => (
            <div key={f.cle}>
              <div className="mb-4 flex items-baseline gap-3">
                <h3 className="titre-imperial text-[0.95rem] tracking-[0.1em] text-or-300">{f.titre}</h3>
                <span className="filet flex-1" />
                <span className="text-[0.72rem] text-givre-300/50">{f.texte}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {metiers
                  .filter((m) => m.category === f.cle)
                  .map((m) => (
                    <div
                      key={m.id}
                      title={m.description}
                      className="carte flex flex-col items-center gap-2 p-3.5 text-center transition-colors duration-150 hover:border-or-500/30"
                    >
                      <Icone
                        nom={iconeMetier(m.key, m.category)}
                        taille={20}
                        epaisseur={1.3}
                        className="text-givre-300/80"
                      />
                      <span className="text-[0.75rem] leading-tight text-givre-100">{m.label}</span>
                      {m.isProducer && (
                        <span className="text-[0.58rem] tracking-[0.14em] text-or-400/70 uppercase">
                          Atelier
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ Outils du hub ══ */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <header className="mb-10 text-center">
          <p className="sur-titre">Le hub</p>
          <h2 className="titre-imperial mt-2 text-3xl text-givre-50">
            Pour faciliter la gestion de la Maison
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-givre-300/70">
            Registres, ateliers, stocks et comptes réunis au même endroit — tenus à jour, chiffrés et
            consultables par chacun selon son rang.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OUTILS.map((o) => (
            <article key={o.titre} className="carte carte-texture p-5">
              <span className="grid size-10 place-items-center rounded-[2px] border border-or-500/25 bg-nuit-950/50 text-or-400">
                <Icone nom={o.icone} taille={19} epaisseur={1.3} />
              </span>
              <h3 className="titre-imperial mt-3.5 text-[0.95rem] text-givre-50">{o.titre}</h3>
              <p className="mt-2 text-[0.82rem] leading-relaxed text-givre-300/75">{o.texte}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ══ Rejoindre ══ */}
      <section className="mx-auto max-w-4xl px-5 py-20">
        <div className="carte carte-texture relative overflow-hidden px-7 py-12 text-center sm:px-14">
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(420px 220px at 50% 0%, rgba(189,156,77,0.16), transparent 70%)",
            }}
          />
          <div className="relative">
            <Icone nom="loup" taille={34} className="mx-auto text-or-400" epaisseur={1.2} />
            <h2 className="titre-imperial mt-5 text-2xl text-givre-50 sm:text-3xl">
              Vous n'avez pas de titre ? Nous non plus.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[0.9rem] leading-relaxed text-givre-300/80">
              Adressez une demande de rôle. Elle est examinée par un gradé, puis validée par un Patriarche.
              L'entrée se fait en période d'essai : ce sont vos actes qui la lèveront.
            </p>
            <Ornement className="my-7 mx-auto max-w-xs" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <LienBouton href="/rejoindre" variante="or" icone="demande" className="!px-5 !py-2.5">
                Demander un rôle
              </LienBouton>
              <Link
                href="/reglement"
                className="text-[0.82rem] text-givre-300/70 underline-offset-4 transition-colors hover:text-or-300 hover:underline"
              >
                Lire d'abord le règlement
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
