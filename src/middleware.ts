import { NextResponse, type NextRequest } from "next/server";

/**
 * Nettoyage des paramètres de pistage.
 *
 * Les plateformes qui relaient un lien y accrochent souvent une étiquette :
 * `?utm_source=chatgpt.com`, `?fbclid=…`, `?gclid=…`. Elle ne sert qu'à celui
 * qui l'a posée, elle traîne ensuite dans la barre d'adresse de tous ceux à
 * qui l'on transmet le lien, et elle finit par salir l'adresse de la Maison.
 *
 * On les retire donc à l'entrée, en renvoyant vers l'adresse propre.
 *
 * Liste fermée, et non un filtre sur préfixe : le site a ses propres
 * paramètres — `statut`, `q`, `edit`, `droits`, `probleme` — et il n'est pas
 * question d'en perdre un par excès de zèle.
 */
const PISTAGE = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_name",
  "fbclid",
  "gclid",
  "dclid",
  "gbraid",
  "wbraid",
  "msclkid",
  "twclid",
  "ttclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "vero_id",
  "_hsenc",
  "_hsmi",
  "ref_src",
  "ref_url",
]);

export function middleware(requete: NextRequest) {
  // Une redirection ne conserverait ni la méthode ni le corps : on laisse
  // passer tout ce qui n'est pas une simple navigation.
  if (requete.method !== "GET") return NextResponse.next();

  const url = requete.nextUrl;
  const aRetirer = [...url.searchParams.keys()].filter((c) => PISTAGE.has(c.toLowerCase()));
  if (aRetirer.length === 0) return NextResponse.next();

  const propre = url.clone();
  for (const cle of aRetirer) propre.searchParams.delete(cle);
  return NextResponse.redirect(propre, 308);
}

export const config = {
  // Ni les ressources internes de Next, ni les fichiers servis tels quels :
  // seules les pages que l'on visite méritent ce détour.
  matcher: ["/((?!_next/static|_next/image|api/|favicon.ico|.*\\.[^/]+$).*)"],
};
