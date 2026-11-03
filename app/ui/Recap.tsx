"use client";

import { useEffect, useState } from "react";
import { rempli, sectionsVisite, visible } from "../../lib/formulaires";
import { genererPdf, nomFichier } from "../../lib/pdf";
import { lireVisite, supprimerVisite, type Visite } from "../../lib/stockage";

export default function Recap({ id, modifier, fini }: { id: string; modifier: () => void; fini: () => void }) {
  const [v, setV] = useState<Visite | null>(null);
  const [avecPhotos, setAvecPhotos] = useState(true);
  const [pdf, setPdf] = useState<{ url: string; blob: Blob } | null>(null);
  const [etat, setEtat] = useState<"" | "generation" | "erreur">("");

  useEffect(() => { lireVisite(id).then((x) => x && setV(x)); }, [id]);
  useEffect(() => () => { if (pdf) URL.revokeObjectURL(pdf.url); }, [pdf]);
  if (!v) return <div className="ecran"><p className="defile gris">Chargement…</p></div>;

  const lignes = sectionsVisite(v.formulaires).map((s) => {
    const champs = s.champs.filter((c) => visible(c, v.reponses));
    const nb = (cid: string) => v.photos.filter((p) => p.champ === cid).length;
    const manquants = champs.filter((c) => !rempli(c, v.reponses, nb(c.id)));
    const obligatoires = manquants.filter((c) => c.obligatoire);
    return { s, total: champs.length, manquants, obligatoires, photos: champs.reduce((n, c) => n + nb(c.id), 0) };
  });
  const nbObligatoires = lignes.reduce((n, l) => n + l.obligatoires.length, 0);
  const nbManquants = lignes.reduce((n, l) => n + l.manquants.length, 0);

  async function generer() {
    if (!v) return;
    setEtat("generation");
    try {
      const blob = await genererPdf(v, { photos: avecPhotos });
      setPdf({ url: URL.createObjectURL(blob), blob });
      setEtat("");
    } catch {
      setEtat("erreur");
    }
  }

  async function partager() {
    if (!pdf || !v) return;
    const f = new File([pdf.blob], nomFichier(v), { type: "application/pdf" });
    if (navigator.canShare?.({ files: [f] })) await navigator.share({ files: [f], title: nomFichier(v) });
    else alert("Le partage n'est pas disponible sur cet appareil : utilisez « Télécharger ».");
  }

  return (
    <div className="ecran">
      <header className="barre-haut">
        <button className="btn-rond" aria-label="Retour à la visite" onClick={modifier}>‹</button>
        <div className="pile" style={{ gap: 0, flex: 1 }}><strong>Vérifier et générer le rapport</strong><span className="gris tres-petit">{v.client} · {new Date(v.date).toLocaleDateString("fr-FR")}</span></div>
      </header>
      <div className="corps">
        <main className="defile">
          {nbManquants > 0 && (
            <p className={`message ${nbObligatoires ? "message-ko" : "message-ambre"}`}>
              {nbObligatoires ? `${nbObligatoires} réponse(s) obligatoire(s) manquante(s), ` : ""}{nbManquants} point(s) non renseigné(s) au total. Vous pouvez générer quand même : ils apparaîtront « Non renseigné » dans le rapport.
            </p>
          )}
          <div className="carte" style={{ padding: 0, gap: 0 }}>
            {lignes.map((l, i) => (
              <div key={l.s.formulaire + l.s.id} className="entre" style={{ padding: "14px 20px", borderTop: i ? "1px solid #F0F1F3" : 0, flexWrap: "wrap" }}>
                <span className="rangee" style={{ flexWrap: "nowrap", flex: "1 1 300px" }}>
                  <span className={`puce ${l.manquants.length ? "" : "fait"}`} style={l.manquants.length ? { background: "#DC6803", color: "#fff" } : undefined}>{l.manquants.length ? "!" : "✓"}</span>
                  <span className="pile" style={{ gap: 2 }}>
                    <strong>{l.s.titre}</strong>
                    <span className="tres-petit" style={{ color: l.manquants.length ? "var(--ambre)" : "var(--gris)" }}>
                      {l.manquants.length ? "Manque : " + l.manquants.map((c) => c.label).join(", ") : `Complet · ${l.total} réponses`}
                    </span>
                  </span>
                </span>
                <span className="gris tres-petit">{l.photos ? l.photos + " photo(s)" : ""}</span>
              </div>
            ))}
          </div>
        </main>
        <aside className="cote-droit">
          <h2>Rapport PDF</h2>
          <p className="gris petit">Structure et charte définies dans le dépôt (lib/charte.ts). Généré sur la tablette, sans envoi sur internet.</p>
          <label className="entre" style={{ minHeight: 44, cursor: "pointer" }}>Inclure les photos<input type="checkbox" checked={avecPhotos} onChange={() => { setAvecPhotos(!avecPhotos); setPdf(null); }} /></label>
          {!pdf && <button className="btn btn-large" onClick={generer} disabled={etat === "generation"}>{etat === "generation" ? "Génération…" : "Générer le rapport PDF"}</button>}
          {etat === "erreur" && <p className="message message-ko">La génération a échoué. Réessayez ; si ça persiste, retirez les photos puis régénérez.</p>}
          {pdf && (
            <div className="pile" style={{ gap: 10 }}>
              <p className="message message-vert">Rapport prêt · {nomFichier(v)}</p>
              <a className="btn btn-large btn-noir" href={pdf.url} download={nomFichier(v)}>Télécharger</a>
              <a className="btn btn-second" href={pdf.url} target="_blank" rel="noopener">Aperçu</a>
              <button className="btn btn-second" onClick={partager}>Partager…</button>
              <button className="lien petit" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={async () => {
                if (confirm("Le rapport est-il bien rangé dans le dossier client ? La visite et ses photos seront effacées de la tablette.")) { await supprimerVisite(v); fini(); }
              }}>Rapport rangé : effacer la visite de la tablette</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
