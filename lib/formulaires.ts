import qualification from "../formulaires/qualification.json";
import multirisque from "../formulaires/multirisque.json";
import annexeCuisson from "../formulaires/annexe-cuisson.json";
import annexeStockage from "../formulaires/annexe-stockage.json";

export type TypeChamp = "texte" | "nombre" | "date" | "ouinon" | "choix" | "multi" | "photos" | "attestation" | "observation";
export type Condition = { champ: string; egal?: string; different?: string };
export type Champ = { id: string; label: string; type: TypeChamp; obligatoire?: boolean; options?: string[]; unite?: string; pas?: number; si?: Condition; aide?: string };
export type Section = { id: string; titre: string; champs: Champ[] };
export type Formulaire = { id: string; titre: string; source?: string; sections: Section[] };
export type Question = { id: string; titre: string; multiple: boolean; options: string[] };
export type Regle = { formulaire: string; toujours?: boolean; si?: { question: string; contient: string }[]; raison: string };

// Pour ajouter un formulaire : créer formulaires/<id>.json, l'importer ici, l'ajouter à FORMULAIRES,
// et ajouter sa règle dans formulaires/qualification.json.
export const FORMULAIRES: Record<string, Formulaire> = {
  [multirisque.id]: multirisque as Formulaire,
  [annexeCuisson.id]: annexeCuisson as Formulaire,
  [annexeStockage.id]: annexeStockage as Formulaire,
};

export const QUESTIONS = qualification.questions as Question[];
const REGLES = qualification.regles as Regle[];

export type Reponses = Record<string, string | number | string[] | undefined>;

// Réponses de qualification → formulaires à remplir (ordre des règles), avec la raison.
export function formulairesPour(q: Reponses): { id: string; raison: string }[] {
  return REGLES.filter((r) => r.toujours || (r.si ?? []).some((c) => {
    const v = q[c.question];
    return Array.isArray(v) ? v.includes(c.contient) : v === c.contient;
  })).filter((r) => FORMULAIRES[r.formulaire]).map((r) => ({ id: r.formulaire, raison: r.raison }));
}

export type SectionVisite = Section & { formulaire: string; annexe: boolean };

export function sectionsVisite(ids: string[]): SectionVisite[] {
  return ids.flatMap((id, i) => (FORMULAIRES[id]?.sections ?? []).map((s) => ({ ...s, formulaire: id, annexe: i > 0 })));
}

export function visible(c: Champ, r: Reponses): boolean {
  if (!c.si) return true;
  const v = r[c.si.champ];
  if (c.si.egal !== undefined) return v === c.si.egal;
  if (c.si.different !== undefined) return v !== undefined && v !== "" && v !== c.si.different;
  return true;
}

export function rempli(c: Champ, r: Reponses, nbPhotos: number): boolean {
  if (c.type === "photos" || c.type === "attestation") return nbPhotos > 0;
  const v = r[c.id];
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== "";
}

export function texteReponse(c: Champ, r: Reponses): string {
  const v = r[c.id];
  if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) return "Non renseigné";
  if (Array.isArray(v)) return v.join(", ");
  if (c.type === "date") return new Date(String(v)).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  if (c.type === "nombre") return `${v}${c.unite ? " " + c.unite : ""}`;
  return String(v);
}
