"use client";

import { useEffect, useState } from "react";
import { FORMULAIRES, rempli, sectionsVisite, visible } from "../../lib/formulaires";
import { listerVisites, supprimerVisite, type Visite } from "../../lib/stockage";

export function pourcentage(v: Visite) {
  const champs = sectionsVisite(v.formulaires).flatMap((s) => s.champs).filter((c) => visible(c, v.reponses));
  const faits = champs.filter((c) => rempli(c, v.reponses, v.photos.filter((p) => p.champ === c.id).length)).length;
  return champs.length ? Math.round((faits / champs.length) * 100) : 0;
}

export default function Accueil({ nouvelle, reprendre }: { nouvelle: () => void; reprendre: (id: string) => void }) {
  const [visites, setVisites] = useState<Visite[] | null>(null);
  const charger = () => listerVisites().then(setVisites);
  useEffect(() => { charger(); }, []);
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="ecran">
      <div className="defile" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", padding: "32px 28px", gap: 24 }}>
        <div className="entre" style={{ flexWrap: "wrap" }}>
          <div className="pile" style={{ gap: 4 }}>
            <span className="gris" style={{ fontWeight: 500, textTransform: "capitalize" }}>{aujourdhui}</span>
            <h1>Mes visites</h1>
          </div>
          <button className="btn" onClick={nouvelle} style={{ height: 56 }}>+ Nouvelle visite</button>
        </div>

        {visites && visites.length === 0 && (
          <div className="carte" style={{ alignItems: "flex-start" }}>
            <h2>Aucune visite en cours sur cette tablette</h2>
            <p className="gris">Touchez « Nouvelle visite » au début du rendez-vous. Tout est enregistré sur la tablette au fur et à mesure, même sans réseau.</p>
          </div>
        )}

        {visites?.map((v) => {
          const pct = pourcentage(v);
          return (
            <div key={v.id} className="carte" style={{ flexDirection: "row", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div className="pile" style={{ flex: "1 1 280px", gap: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>{v.client}</span>
                <span className="gris">{v.adresse}</span>
                <span className="rangee" style={{ gap: 6, marginTop: 4 }}>
                  {v.formulaires.map((f) => <span key={f} className="badge" style={{ background: "var(--fond)" }}>{FORMULAIRES[f]?.titre}</span>)}
                </span>
              </div>
              <div className="pile" style={{ width: 170 }}>
                <span className={`badge ${pct === 100 ? "badge-vert" : "badge-indigo"}`} style={{ alignSelf: "flex-start" }}>{pct === 100 ? "Prête" : "En cours · " + pct + " %"}</span>
                <span className="progression" style={{ width: "100%" }}><span style={{ width: pct + "%" }} /></span>
              </div>
              <button className="btn" onClick={() => reprendre(v.id)}>Reprendre</button>
              <button className="lien petit" onClick={async () => { if (confirm(`Supprimer la visite « ${v.client} » de cette tablette ? Les réponses et photos seront effacées.`)) { await supprimerVisite(v); charger(); } }}>Supprimer</button>
            </div>
          );
        })}
        <p className="gris tres-petit">Les visites et les photos restent uniquement sur cette tablette, jusqu'à leur suppression.</p>
      </div>
    </div>
  );
}
