import { Fragment, type ReactNode } from "react";

/**
 * Rendu de texte enrichi — sous-ensemble volontairement restreint du Markdown
 * (titres, listes, citations, gras, italique). Aucun HTML brut n'est interprété :
 * le contenu vient des membres, il ne doit pas pouvoir injecter de balise.
 */

function enligne(texte: string, cle: string): ReactNode[] {
  const morceaux: ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|«[^»]+»|`[^`]+`)/g;
  let dernier = 0;
  let m: RegExpExecArray | null;
  let i = 0;

  while ((m = regex.exec(texte)) !== null) {
    if (m.index > dernier) morceaux.push(texte.slice(dernier, m.index));
    const t = m[0];
    const k = `${cle}-${i++}`;
    if (t.startsWith("**")) morceaux.push(<strong key={k}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith("`"))
      morceaux.push(
        <code key={k} className="rounded-[2px] bg-current/10 px-1 py-px text-[0.85em]">
          {t.slice(1, -1)}
        </code>,
      );
    else if (t.startsWith("«")) morceaux.push(<em key={k}>{t}</em>);
    else morceaux.push(<em key={k}>{t.slice(1, -1)}</em>);
    dernier = m.index + t.length;
  }
  if (dernier < texte.length) morceaux.push(texte.slice(dernier));
  return morceaux;
}

export function Recit({ texte, className = "" }: { texte: string; className?: string }) {
  const lignes = texte.split("\n");
  const blocs: ReactNode[] = [];
  let liste: string[] = [];

  const viderListe = (i: number) => {
    if (liste.length === 0) return;
    blocs.push(
      <ul key={`ul-${i}`}>
        {liste.map((l, j) => (
          <li key={j}>{enligne(l, `li-${i}-${j}`)}</li>
        ))}
      </ul>,
    );
    liste = [];
  };

  lignes.forEach((ligne, i) => {
    const l = ligne.trim();

    if (l.startsWith("- ") || l.startsWith("• ")) {
      liste.push(l.slice(2));
      return;
    }
    viderListe(i);

    if (!l) return;
    if (l.startsWith("### ")) blocs.push(<h3 key={i}>{enligne(l.slice(4), `h3-${i}`)}</h3>);
    else if (l.startsWith("## ")) blocs.push(<h2 key={i}>{enligne(l.slice(3), `h2-${i}`)}</h2>);
    else if (l.startsWith("# ")) blocs.push(<h2 key={i}>{enligne(l.slice(2), `h1-${i}`)}</h2>);
    else if (l.startsWith("> "))
      blocs.push(<blockquote key={i}>{enligne(l.slice(2), `bq-${i}`)}</blockquote>);
    else if (l === "---" || l === "***")
      blocs.push(<hr key={i} className="my-6 border-0 border-t border-current/15" />);
    else blocs.push(<p key={i}>{enligne(l, `p-${i}`)}</p>);
  });
  viderListe(lignes.length);

  return <div className={`recit ${className}`}>{blocs.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</div>;
}
