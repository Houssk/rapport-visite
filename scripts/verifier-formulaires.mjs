// Vérifie la cohérence des formulaires JSON : à lancer après chaque ajout ou modification.
// npm run verifier-formulaires  →  « OK » ou la liste des problèmes.
import { readFileSync, readdirSync } from "node:fs";

const TYPES = ["texte", "nombre", "date", "ouinon", "choix", "multi", "photos", "attestation", "observation"];
const dossier = new URL("../formulaires/", import.meta.url);
const erreurs = [];
const formulaires = {};

for (const f of readdirSync(dossier).filter((x) => x.endsWith(".json") && x !== "qualification.json")) {
  let j;
  try { j = JSON.parse(readFileSync(new URL(f, dossier), "utf8")); } catch (e) { erreurs.push(`${f} : JSON invalide (${e.message})`); continue; }
  if (j.id + ".json" !== f) erreurs.push(`${f} : l'id « ${j.id} » doit être le nom du fichier`);
  if (!j.titre) erreurs.push(`${f} : titre manquant`);
  formulaires[j.id] = true;
  const ids = new Set();
  for (const s of j.sections ?? []) {
    if (!s.id || !s.titre) erreurs.push(`${f} : section sans id ou titre`);
    for (const c of s.champs ?? []) {
      const ou = `${f} > ${s.id} > ${c.id}`;
      if (!c.id || !c.label) erreurs.push(`${ou} : id ou label manquant`);
      if (ids.has(c.id)) erreurs.push(`${ou} : id en double`);
      ids.add(c.id);
      if (!TYPES.includes(c.type)) erreurs.push(`${ou} : type « ${c.type} » inconnu (${TYPES.join(", ")})`);
      if ((c.type === "choix" || c.type === "multi") && !(c.options?.length)) erreurs.push(`${ou} : options manquantes`);
    }
    for (const c of s.champs ?? []) if (c.si && !ids.has(c.si.champ)) erreurs.push(`${f} > ${c.id} : la condition vise « ${c.si.champ} », qui doit exister AVANT dans le formulaire`);
  }
}

const q = JSON.parse(readFileSync(new URL("qualification.json", dossier), "utf8"));
const qids = new Set(q.questions.map((x) => x.id));
for (const r of q.regles) {
  if (!formulaires[r.formulaire]) erreurs.push(`qualification.json : la règle vise « ${r.formulaire} », absent de formulaires/`);
  for (const c of r.si ?? []) {
    if (!qids.has(c.question)) erreurs.push(`qualification.json : question « ${c.question} » inconnue`);
    else if (!q.questions.find((x) => x.id === c.question).options.includes(c.contient)) erreurs.push(`qualification.json : « ${c.contient} » n'est pas une option de « ${c.question} »`);
  }
}
const importes = readFileSync(new URL("../lib/formulaires.ts", import.meta.url), "utf8");
for (const id of Object.keys(formulaires)) if (!importes.includes(`formulaires/${id}.json`)) erreurs.push(`lib/formulaires.ts : « ${id}.json » n'est pas importé`);

if (erreurs.length) { console.error("PROBLÈMES :\n- " + erreurs.join("\n- ")); process.exit(1); }
console.log(`OK : ${Object.keys(formulaires).length} formulaires, ${q.regles.length} règles de qualification.`);
