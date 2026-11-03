import { del, get, keys, set } from "idb-keyval";
import type { Reponses } from "./formulaires";

// Tout reste sur l'appareil (IndexedDB) : rien n'est envoyé sur un serveur.
export type Photo = { id: string; champ: string; nom: string };
export type Visite = {
  id: string; client: string; adresse: string; date: string;
  qualification: Reponses; formulaires: string[]; reponses: Reponses; photos: Photo[];
  section: number; creeLe: string; modifieLe: string;
};

export const nouvelId = () => (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

export async function listerVisites(): Promise<Visite[]> {
  const ks = (await keys()).filter((k) => String(k).startsWith("visite:"));
  const vs = await Promise.all(ks.map((k) => get<Visite>(k)));
  return vs.filter((v): v is Visite => !!v).sort((a, b) => b.modifieLe.localeCompare(a.modifieLe));
}
export const lireVisite = (id: string) => get<Visite>("visite:" + id);
export const enregistrerVisite = (v: Visite) => set("visite:" + v.id, { ...v, modifieLe: new Date().toISOString() });
export async function supprimerVisite(v: Visite) {
  await Promise.all(v.photos.map((p) => del("photo:" + p.id)));
  await del("visite:" + v.id);
}

// Les photos sont réduites (1600 px max, JPEG) avant d'être gardées : PDF plus léger, tablette moins chargée.
export async function garderPhoto(fichier: File): Promise<string> {
  const id = nouvelId();
  const blob = await reduire(fichier);
  await set("photo:" + id, blob);
  return id;
}
export const lirePhoto = (id: string) => get<Blob>("photo:" + id);
export const supprimerPhoto = (id: string) => del("photo:" + id);

async function reduire(f: File, max = 1600): Promise<Blob> {
  if (!f.type.startsWith("image/")) return f;
  const img = await createImageBitmap(f);
  const ratio = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((ok) => canvas.toBlob((b) => ok(b ?? f), "image/jpeg", 0.82));
}
