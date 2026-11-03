// Test du parcours complet dans un vrai navigateur (Chromium) : qualification → saisie → photo → PDF.
// Prérequis : npm run build. Lancer : npm run test:parcours  →  « OK » ou l'étape qui échoue.
const { spawn } = require("node:child_process");
const { mkdtempSync, writeFileSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");
const zlib = require("node:zlib");
const { chromium } = require("playwright");

function png(chemin) {
  const w = 64, h = 48, crc = (b) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); } return ~c >>> 0; };
  const ch = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const lignes = Buffer.concat(Array.from({ length: h }, () => Buffer.concat([Buffer.from([0]), Buffer.from(Array(w).fill([200, 100, 50]).flat())])));
  writeFileSync(chemin, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ch("IHDR", ihdr), ch("IDAT", zlib.deflateSync(lignes)), ch("IEND", Buffer.alloc(0))]));
}

(async () => {
  const dir = mkdtempSync(join(tmpdir(), "parcours-"));
  png(join(dir, "photo.png"));
  const serveur = spawn("npx", ["next", "start", "-p", "3999"], { stdio: "ignore" });
  const b = await chromium.launch();
  let etape = "ouverture";
  try {
    const p = await b.newPage({ viewport: { width: 1194, height: 834 } });
    const erreurs = []; p.on("pageerror", (e) => erreurs.push(e.message));
    for (let i = 0; i < 40; i++) { try { await p.goto("http://localhost:3999"); break; } catch { await new Promise((r) => setTimeout(r, 500)); } }
    etape = "qualification"; await p.click("text=+ Nouvelle visite"); await p.fill("#client", "Restaurant Test");
    await p.click('button.choix:has-text("Restaurant")');
    const formulaires = await p.locator("aside .carte strong").allTextContents();
    if (!formulaires.some((f) => f.includes("cuisson"))) throw new Error("l'annexe cuisson n'est pas proposée pour un restaurant");
    etape = "saisie"; await p.click("text=Démarrer la visite");
    await p.click('nav button:has-text("Bâtiment")'); await p.click('button.choix:has-text("Oui")');
    if (!(await p.locator("text=Activité du voisin mitoyen").count())) throw new Error("la question conditionnelle n'apparaît pas");
    etape = "photo"; await p.setInputFiles("label.ajout-photo input", join(dir, "photo.png"));
    await p.waitForSelector(".vignette img", { timeout: 10000 });
    etape = "génération du PDF"; await p.click("header >> text=Terminer"); await p.click("text=Générer le rapport PDF");
    await p.waitForSelector("text=Rapport prêt", { timeout: 20000 });
    const [dl] = await Promise.all([p.waitForEvent("download"), p.click('a:has-text("Télécharger")')]);
    const f = join(dir, "rapport.pdf"); await dl.saveAs(f);
    const pdf = readFileSync(f);
    if (!pdf.slice(0, 4).equals(Buffer.from("%PDF"))) throw new Error("le fichier téléchargé n'est pas un PDF");
    if (!pdf.includes("/Subtype /Image")) throw new Error("la photo n'est pas dans le PDF");
    if (erreurs.length) throw new Error("erreurs JavaScript : " + erreurs.join(" ; "));
    console.log(`OK : formulaires ${formulaires.join(" + ")} ; question conditionnelle ; photo ; PDF ${Math.round(pdf.length / 1024)} Ko (${dl.suggestedFilename()})`);
  } catch (e) {
    console.error(`ÉCHEC à l'étape « ${etape} » : ${e.message}`); process.exitCode = 1;
  } finally {
    await b.close(); serveur.kill();
  }
})();
