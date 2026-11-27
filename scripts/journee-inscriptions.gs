/**
 * Inscriptions à la Journée des Experts — script Google Apps Script
 * ------------------------------------------------------------------
 * À coller dans une feuille Google Sheets (Extensions → Apps Script),
 * puis Déployer → Nouveau déploiement → Application Web
 *   - Exécuter en tant que : Moi
 *   - Qui a accès : Tout le monde
 * L'adresse obtenue (…/exec) se colle dans Pages CMS → Textes du site → Notre événement.
 *
 * - Chaque inscription envoyée par le site devient une ligne de l'onglet « Inscriptions ».
 * - Un e-mail est envoyé à l'association à chaque inscription.
 * - Le site lit uniquement les TOTAUX (personnes inscrites, intéressés par jeu) : jamais les noms ni les e-mails.
 * - Supprimer une ligne (doublon, annulation) corrige automatiquement les compteurs du site.
 */

var EMAIL_ASSO = "meeple@jeu-experts-perigord.fr,sobled24@gmail.com";
var COLONNES = ["Date", "Nom", "E-mail", "Personnes", "Jeux", "Autre jeu demandé", "Jeu apporté",
                "Restauration", "Repas midi", "Repas soir", "Régime / allergies", "Message"];

function feuille_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName("Inscriptions");
  if (!sh) {
    sh = ss.insertSheet("Inscriptions");
    sh.appendRow(COLONNES);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, COLONNES.length).setFontWeight("bold");
  }
  if (!ss.getSheetByName("Récap")) {
    var r = ss.insertSheet("Récap");
    r.getRange("A1:B5").setValues([
      ["Personnes inscrites", "=SUM(Inscriptions!D2:D)"],
      ["Inscriptions (groupes)", "=COUNTA(Inscriptions!B2:B)"],
      ["Repas du midi", "=SUM(Inscriptions!I2:I)"],
      ["Repas du soir", "=SUM(Inscriptions!J2:J)"],
      ["Sans repas (groupes)", "=COUNTIF(Inscriptions!H2:H,\"Non\")"]
    ]);
    r.getRange("A1:A5").setFontWeight("bold");
  }
  return sh;
}

function nombre_(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p._gotcha) return json_({ ok: true });            // robot : on ignore sans le dire
  if (!p.nom || !p.email) return json_({ ok: false, erreur: "Nom et e-mail obligatoires" });
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var sh = feuille_();
    var resto = p.restauration === "Oui";
    sh.appendRow([new Date(), p.nom, p.email, nombre_(p.personnes) || 1, p.jeux || "", p.autre_jeu || "",
                  p.jeu_apporte || "", p.restauration || "", resto ? nombre_(p.repas_midi) : 0,
                  resto ? nombre_(p.repas_soir) : 0, resto ? (p.regime || "") : "", p.message || ""]);
  } finally {
    lock.releaseLock();
  }
  try {
    var corps = [
      "Nouvelle inscription à la Journée des Experts", "",
      "Nom : " + p.nom, "E-mail : " + p.email, "Personnes : " + (p.personnes || 1),
      "Jeux : " + (p.jeux || "—"), "Autre jeu demandé : " + (p.autre_jeu || "—"),
      "Jeu apporté : " + (p.jeu_apporte || "—"),
      "Restauration : " + (p.restauration || "—") + (p.restauration === "Oui" ? " (midi " + nombre_(p.repas_midi) + ", soir " + nombre_(p.repas_soir) + ")" : ""),
      "Régime / allergies : " + (p.regime || "—"), "Message : " + (p.message || "—"), "",
      "Toutes les inscriptions : " + SpreadsheetApp.getActiveSpreadsheet().getUrl()
    ].join("\n");
    MailApp.sendEmail({ to: EMAIL_ASSO, replyTo: p.email, subject: p._subject || ("Journée des Experts : " + p.nom), body: corps });
  } catch (err) { /* l'inscription est enregistrée même si le mail échoue */ }
  return json_({ ok: true });
}

function doGet() {
  var sh = feuille_();
  var n = sh.getLastRow() - 1, total = 0, jeux = {}, groupes = 0;
  if (n > 0) {
    var lignes = sh.getRange(2, 1, n, 5).getValues();   // Date, Nom, E-mail, Personnes, Jeux
    lignes.forEach(function (l) {
      if (!l[1]) return;
      var pers = nombre_(l[3]) || 1;
      groupes++; total += pers;
      String(l[4] || "").split(",").forEach(function (j) {
        j = j.trim(); if (j && j !== "—") jeux[j] = (jeux[j] || 0) + pers;
      });
    });
  }
  return json_({ total: total, groupes: groupes, jeux: jeux, maj: new Date().toISOString() });
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
