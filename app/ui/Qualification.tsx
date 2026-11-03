"use client";

import { useMemo, useState } from "react";
import { FORMULAIRES, QUESTIONS, formulairesPour, sectionsVisite, type Reponses } from "../../lib/formulaires";
import { enregistrerVisite, nouvelId } from "../../lib/stockage";

export default function Qualification({ retour, demarrer }: { retour: () => void; demarrer: (id: string) => void }) {
  const [client, setClient] = useState("");
  const [adresse, setAdresse] = useState("");
  const [q, setQ] = useState<Reponses>({});
  const choisis = useMemo(() => formulairesPour(q), [q]);
  const nbSections = sectionsVisite(choisis.map((c) => c.id)).length;

  function basculer(id: string, option: string, multiple: boolean) {
    if (!multiple) return setQ({ ...q, [id]: q[id] === option ? undefined : option });
    const liste = (q[id] as string[] | undefined) ?? [];
    setQ({ ...q, [id]: liste.includes(option) ? liste.filter((x) => x !== option) : [...liste, option] });
  }

  async function lancer() {
    const id = nouvelId();
    const date = new Date().toISOString().slice(0, 10);
    await enregistrerVisite({
      id, client: client.trim(), adresse: adresse.trim(), date, qualification: q, formulaires: choisis.map((c) => c.id),
      reponses: { raison: client.trim(), datev: date }, photos: [], section: 0, creeLe: new Date().toISOString(), modifieLe: "",
    });
    demarrer(id);
  }

  return (
    <div className="ecran">
      <header className="barre-haut">
        <button className="btn-rond" aria-label="Retour" onClick={retour}>‹</button>
        <div className="pile" style={{ gap: 0, flex: 1 }}><strong>Nouvelle visite · Qualification</strong><span className="gris tres-petit">Quelques questions pour choisir les bons formulaires</span></div>
      </header>
      <div className="corps">
        <main className="defile">
          <div className="carte">
            <label htmlFor="client" style={{ fontWeight: 700 }}>Client</label>
            <input id="client" type="text" placeholder="Nom du client ou de la société" value={client} onChange={(e) => setClient(e.target.value)} />
            <input aria-label="Adresse" type="text" placeholder="Adresse du site visité" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </div>
          {QUESTIONS.map((question) => (
            <div key={question.id} className="carte">
              <div className="entre"><strong style={{ fontSize: 17 }}>{question.titre}</strong><span className="gris tres-petit">{question.multiple ? "Plusieurs choix" : "Un seul choix"}</span></div>
              <div className="rangee">
                {question.options.map((o) => {
                  const v = q[question.id];
                  const on = Array.isArray(v) ? v.includes(o) : v === o;
                  return <button key={o} className={on ? "choix on" : "choix"} onClick={() => basculer(question.id, o, question.multiple)}>{on ? "✓ " : ""}{o}</button>;
                })}
              </div>
            </div>
          ))}
        </main>
        <aside className="cote-droit">
          <h2>Formulaires de la visite</h2>
          <p className="gris petit">Choisis automatiquement d'après vos réponses.</p>
          {choisis.map((c) => (
            <div key={c.id} className="carte" style={{ background: "#F7F7FF", borderColor: "#E0E3FF", padding: "14px 16px", gap: 2 }}>
              <strong>{FORMULAIRES[c.id].titre}</strong>
              <span className="gris tres-petit">{c.raison} · {FORMULAIRES[c.id].sections.length} section(s)</span>
            </div>
          ))}
          <span className="gris petit" style={{ marginTop: "auto" }}>{nbSections} sections au total</span>
          <button className="btn btn-large" onClick={lancer} disabled={!client.trim()}>Démarrer la visite →</button>
        </aside>
      </div>
    </div>
  );
}
