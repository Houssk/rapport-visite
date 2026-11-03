"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { rempli, sectionsVisite, visible, type Champ } from "../../lib/formulaires";
import { enregistrerVisite, garderPhoto, lirePhoto, lireVisite, supprimerPhoto, type Visite } from "../../lib/stockage";
import { pourcentage } from "./Accueil";

function Vignettes({ ids, retirer }: { ids: string[]; retirer: (id: string) => void }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  useEffect(() => {
    let actif = true;
    const crees: string[] = [];
    Promise.all(ids.map(async (id) => {
      const b = await lirePhoto(id);
      if (!b) return [id, ""] as const;
      const u = URL.createObjectURL(b); crees.push(u);
      return [id, u] as const;
    })).then((paires) => actif && setUrls(Object.fromEntries(paires)));
    return () => { actif = false; crees.forEach((u) => URL.revokeObjectURL(u)); };
  }, [ids.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{ids.map((id, i) => (
    <div key={id} className="vignette">
      {urls[id] && <img src={urls[id]} alt={`Photo ${i + 1}`} />}
      <button className="retirer" aria-label="Retirer la photo" onClick={() => retirer(id)}>×</button>
    </div>
  ))}</>;
}

function ZonePhoto({ libelle, ajouter, unique }: { libelle: string; ajouter: (f: File[]) => void; unique?: boolean }) {
  const [survol, setSurvol] = useState(false);
  const surDepot = (e: DragEvent) => { e.preventDefault(); setSurvol(false); ajouter(Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"))); };
  return (
    <label className={survol ? "ajout-photo survol" : "ajout-photo"} onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)} onDrop={surDepot}>
      <input type="file" accept="image/*" capture="environment" multiple={!unique} onChange={(e) => { if (e.target.files) ajouter(Array.from(e.target.files)); e.target.value = ""; }} />
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
      {libelle}
      <span className="gris tres-petit" style={{ fontWeight: 500 }}>ou glisser une image</span>
    </label>
  );
}

export default function Saisie({ id, retour, terminer }: { id: string; retour: () => void; terminer: () => void }) {
  const [v, setV] = useState<Visite | null>(null);
  const [enregistre, setEnregistre] = useState(true);
  const haut = useRef<HTMLElement>(null);

  useEffect(() => { lireVisite(id).then((x) => x && setV(x)); }, [id]);

  const sections = useMemo(() => (v ? sectionsVisite(v.formulaires) : []), [v?.formulaires.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!v) return <div className="ecran"><p className="defile gris">Chargement…</p></div>;

  const maj = (nv: Visite) => { setV(nv); setEnregistre(false); enregistrerVisite(nv).then(() => setEnregistre(true)); };
  const repondre = (champ: string, val: Visite["reponses"][string]) => maj({ ...v, reponses: { ...v.reponses, [champ]: val } });
  const allerA = (i: number) => { maj({ ...v, section: i }); haut.current?.scrollTo({ top: 0 }); };
  const nbPhotos = (c: Champ) => v.photos.filter((p) => p.champ === c.id).length;

  async function ajouterPhotos(champ: string, fichiers: File[], unique = false) {
    if (!v) return;
    let photos = v.photos;
    if (unique) { for (const p of photos.filter((x) => x.champ === champ)) await supprimerPhoto(p.id); photos = photos.filter((x) => x.champ !== champ); }
    for (const f of unique ? fichiers.slice(0, 1) : fichiers) photos = [...photos, { id: await garderPhoto(f), champ, nom: f.name }];
    maj({ ...v, photos });
  }
  async function retirerPhoto(pid: string) {
    if (!v) return;
    await supprimerPhoto(pid);
    maj({ ...v, photos: v.photos.filter((p) => p.id !== pid) });
  }

  const sec = sections[Math.min(v.section, sections.length - 1)];
  const champs = sec.champs.filter((c) => visible(c, v.reponses));

  return (
    <div className="ecran">
      <header className="barre-haut">
        <button className="btn-rond" aria-label="Retour aux visites" onClick={retour}>‹</button>
        <div className="pile" style={{ gap: 0, flex: 1, minWidth: 0 }}>
          <strong style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.client}</strong>
          <span className="gris tres-petit">{v.adresse}</span>
        </div>
        <span className="tres-petit" style={{ color: enregistre ? "var(--vert)" : "var(--gris)", fontWeight: 600 }}>{enregistre ? "✓ Enregistré sur la tablette" : "Enregistrement…"}</span>
        <span className="rangee petit" style={{ fontWeight: 700, gap: 8 }}><span className="progression"><span style={{ width: pourcentage(v) + "%" }} /></span>{pourcentage(v)} %</span>
        <button className="btn btn-noir" onClick={terminer}>Terminer</button>
      </header>

      <div className="corps">
        <nav className="cote" aria-label="Sections">
          {sections.map((s, i) => {
            const vis = s.champs.filter((c) => visible(c, v.reponses));
            const faits = vis.filter((c) => rempli(c, v.reponses, nbPhotos(c))).length;
            const fait = vis.length > 0 && faits === vis.length;
            const actif = s === sec;
            return (
              <button key={s.formulaire + s.id} className={actif ? "nav-section actif" : "nav-section"} onClick={() => allerA(i)}>
                <span className={`puce ${fait ? "fait" : actif ? "actif" : ""}`}>{fait ? "✓" : i + 1}</span>
                <span className="pile" style={{ gap: 0, minWidth: 0 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>{s.titre}</span>
                  <span className="gris tres-petit">{faits}/{vis.length} réponses{s.annexe ? " · annexe" : ""}</span>
                </span>
              </button>
            );
          })}
        </nav>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <main className="defile" ref={haut}>
            <div className="rangee"><h1 style={{ fontSize: 28 }}>{sec.titre}</h1>{sec.annexe && <span className="badge badge-ambre">Annexe</span>}</div>
            {champs.map((c) => {
              const val = v.reponses[c.id];
              return (
                <div key={c.id} className="carte">
                  <div className="entre"><strong>{c.label}{c.obligatoire ? " *" : ""}</strong>{c.type === "multi" && <span className="gris tres-petit">Plusieurs choix</span>}</div>

                  {c.type === "ouinon" && (
                    <div className="ouinon">
                      {["Oui", "Non", "Sans objet"].map((o) => <button key={o} className={val === o ? "choix on" : "choix"} onClick={() => repondre(c.id, val === o ? undefined : o)}>{o}</button>)}
                    </div>
                  )}
                  {c.type === "choix" && (
                    <div className="rangee">{c.options?.map((o) => <button key={o} className={val === o ? "choix on" : "choix"} onClick={() => repondre(c.id, val === o ? undefined : o)}>{o}</button>)}</div>
                  )}
                  {c.type === "multi" && (
                    <div className="rangee">{c.options?.map((o) => {
                      const liste = (val as string[] | undefined) ?? [];
                      const on = liste.includes(o);
                      return <button key={o} className={on ? "choix on" : "choix"} onClick={() => repondre(c.id, on ? liste.filter((x) => x !== o) : [...liste, o])}>{o}</button>;
                    })}</div>
                  )}
                  {c.type === "nombre" && (
                    <div className="compteur">
                      <button aria-label="Moins" onClick={() => repondre(c.id, Math.max(0, Number(val ?? 0) - (c.pas ?? 1)))}>−</button>
                      <span className="valeur">{val ?? 0} <span className="gris" style={{ fontSize: 15, fontWeight: 500 }}>{c.unite}</span></span>
                      <button aria-label="Plus" onClick={() => repondre(c.id, Number(val ?? 0) + (c.pas ?? 1))}>+</button>
                    </div>
                  )}
                  {c.type === "texte" && <input type="text" aria-label={c.label} value={String(val ?? "")} onChange={(e) => repondre(c.id, e.target.value)} />}
                  {c.type === "date" && <input type="date" aria-label={c.label} value={String(val ?? "")} onChange={(e) => repondre(c.id, e.target.value)} style={{ maxWidth: 280 }} />}
                  {c.type === "observation" && (
                    <textarea aria-label={c.label} rows={4} placeholder="Ce que vous avez constaté… (astuce : le micro du clavier permet de dicter)" value={String(val ?? "")} onChange={(e) => repondre(c.id, e.target.value)} />
                  )}
                  {c.type === "photos" && (
                    <div className="grille-photos">
                      <Vignettes ids={v.photos.filter((p) => p.champ === c.id).map((p) => p.id)} retirer={retirerPhoto} />
                      <ZonePhoto libelle="Prendre une photo" ajouter={(f) => ajouterPhotos(c.id, f)} />
                    </div>
                  )}
                  {c.type === "attestation" && (
                    nbPhotos(c) > 0 ? (
                      <div className="attestation ok">
                        <div style={{ width: 120 }}><Vignettes ids={v.photos.filter((p) => p.champ === c.id).map((p) => p.id)} retirer={retirerPhoto} /></div>
                        <span className="pile" style={{ flex: 1, gap: 2 }}><strong style={{ color: "var(--vert)" }}>Attestation ajoutée</strong><span className="gris petit">Vérifiez qu'elle est lisible avant de partir.</span></span>
                        <div style={{ width: 150 }}><ZonePhoto libelle="Reprendre" unique ajouter={(f) => ajouterPhotos(c.id, f, true)} /></div>
                      </div>
                    ) : (
                      <div className="attestation">
                        <span className="pile" style={{ flex: 1, gap: 2 }}><strong style={{ color: "var(--ambre)" }}>À photographier</strong><span className="gris petit">Cadrez le document à plat, bien éclairé.</span></span>
                        <div style={{ width: 170 }}><ZonePhoto libelle="Photographier" unique ajouter={(f) => ajouterPhotos(c.id, f, true)} /></div>
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </main>
          <footer className="barre-bas">
            <button className="btn btn-second" disabled={v.section === 0} onClick={() => allerA(v.section - 1)}>← Précédente</button>
            <span className="gris petit">Section {Math.min(v.section, sections.length - 1) + 1} sur {sections.length}</span>
            {v.section < sections.length - 1
              ? <button className="btn" onClick={() => allerA(v.section + 1)}>{sections[v.section + 1].titre} →</button>
              : <button className="btn btn-noir" onClick={terminer}>Vérifier et générer →</button>}
          </footer>
        </div>
      </div>
    </div>
  );
}
