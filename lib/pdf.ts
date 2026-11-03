import { jsPDF } from "jspdf";
import { CHARTE } from "./charte";
import { sectionsVisite, texteReponse, visible, FORMULAIRES } from "./formulaires";
import { lirePhoto, type Visite } from "./stockage";

const enDataUrl = (b: Blob) => new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsDataURL(b); });
const tailleImage = (src: string) => new Promise<{ w: number; h: number }>((ok) => { const i = new Image(); i.onload = () => ok({ w: i.width, h: i.height }); i.src = src; });

export function nomFichier(v: Visite) {
  const propre = v.client.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `rapport-${propre || "visite"}-${v.date}.pdf`;
}

// Génère le PDF dans le navigateur : rien ne quitte la tablette.
export async function genererPdf(v: Visite, opts: { photos: boolean }): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const L = 210, M = 16, LARG = L - 2 * M, BAS = 297 - 18;
  let y = M;

  const police = (taille: number, gras = false, couleur = CHARTE.couleurTexte) => {
    doc.setFont("helvetica", gras ? "bold" : "normal"); doc.setFontSize(taille); doc.setTextColor(...couleur);
  };
  const place = (h: number) => { if (y + h > BAS) { doc.addPage(); y = M; } };

  // En-tête
  doc.setDrawColor(...CHARTE.couleurBandeau); doc.setLineWidth(0.8);
  police(9, true, CHARTE.couleurGris); doc.text(CHARTE.cabinet, M, y + 4);
  police(9, false, CHARTE.couleurGris); doc.text(`Visite du ${new Date(v.date).toLocaleDateString("fr-FR")}`, L - M, y + 4, { align: "right" });
  y += 8; doc.line(M, y, L - M, y); y += 8;
  police(9, true, CHARTE.couleurGris);
  doc.text(`${CHARTE.titreRapport.toUpperCase()} · ${v.formulaires.map((f) => FORMULAIRES[f]?.titre).filter(Boolean).join(" + ")}`, M, y); y += 8;
  police(20, true); doc.text(v.client || "Client", M, y); y += 6;
  if (v.adresse) { police(11, false, CHARTE.couleurGris); doc.text(v.adresse, M, y + 2); y += 6; }
  y += 4;

  for (const s of sectionsVisite(v.formulaires)) {
    const champs = s.champs.filter((c) => visible(c, v.reponses));
    if (!champs.length) continue;
    place(20);
    doc.setFillColor(...CHARTE.couleurBandeau); doc.rect(M, y, LARG, 8, "F");
    police(10, true, [255, 255, 255]); doc.text(s.titre.toUpperCase(), M + 3, y + 5.5); y += 11;

    for (const c of champs) {
      if (c.type === "photos" || c.type === "attestation") {
        const photos = v.photos.filter((p) => p.champ === c.id);
        place(8);
        police(10, false, CHARTE.couleurGris); doc.text(c.label, M, y + 4);
        police(10, true, photos.length ? CHARTE.couleurTexte : CHARTE.couleurManquant);
        doc.text(photos.length ? `${photos.length} photo(s)${opts.photos ? "" : " (non incluses)"}` : "Non renseigné", M + LARG * 0.58, y + 4); y += 8;
        if (opts.photos && photos.length) {
          const col = 3, gap = 4, w = (LARG - gap * (col - 1)) / col, h = w * 0.75;
          for (let i = 0; i < photos.length; i++) {
            if (i % col === 0) place(h + 8);
            const blob = await lirePhoto(photos[i].id);
            if (!blob) continue;
            const src = await enDataUrl(blob);
            const t = await tailleImage(src);
            const r = Math.min(w / t.w, h / t.h);
            const x = M + (i % col) * (w + gap);
            doc.addImage(src, "JPEG", x + (w - t.w * r) / 2, y + (h - t.h * r) / 2, t.w * r, t.h * r);
            police(8, false, CHARTE.couleurGris); doc.text(`${c.label} · ${i + 1}`, x, y + h + 4, { maxWidth: w });
            if (i % col === col - 1 || i === photos.length - 1) y += h + 8;
          }
        }
        continue;
      }
      const rep = texteReponse(c, v.reponses);
      const lignesQ = doc.splitTextToSize(c.label, LARG * 0.55);
      const lignesR = doc.splitTextToSize(rep, LARG * 0.42);
      const h = Math.max(lignesQ.length, lignesR.length) * 5 + 3;
      place(h);
      police(10, false, CHARTE.couleurGris); doc.text(lignesQ, M, y + 4);
      police(10, true, rep === "Non renseigné" ? CHARTE.couleurManquant : CHARTE.couleurTexte); doc.text(lignesR, M + LARG * 0.58, y + 4);
      y += h;
      doc.setDrawColor(228, 231, 236); doc.setLineWidth(0.2); doc.line(M, y, L - M, y); y += 1;
    }
    y += 6;
  }

  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    police(8, false, CHARTE.couleurGris);
    doc.text(CHARTE.mentionBasDePage, M, 297 - 10);
    doc.text(`Page ${p} / ${n}`, L - M, 297 - 10, { align: "right" });
  }
  return doc.output("blob");
}
