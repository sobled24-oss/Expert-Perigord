/* Les Experts en Périgord : affichage commun à toutes les pages.
   Le contenu vient de contenu.js ; chaque page indique son nom dans <body data-page="...">. */
(function(){
"use strict";
const C = window.CONTENU || {};
["site","histoire","organisateurs","evenement","echanges","contact"].forEach(k=>C[k]=C[k]||{});
["piliers","festivals","tests","membres","galerie","temoignages"].forEach(k=>C[k]=C[k]||[]);
const PAGE = document.body.dataset.page || "accueil";
const ETAPES = ["Idée","Recherche du lieu","Date fixée","Programme","Ouverture"];
const VERDICTS = {coeur:"Coup de cœur", rejouer:"À rejouer", mitige:"Mitigé", non:"Pas pour nous"};
const VCLASS = {coeur:"v-coeur", rejouer:"v-rejouer", mitige:"v-mitige", non:"v-non"};
const MEEPLE = "M12 1.6a3.4 3.4 0 0 1 3.4 3.4c0 1.1-.5 2.1-1.3 2.7 3 .4 7.4 1.6 8.1 2.9.6 1.1-1.7 2.2-5.1 2.8l3.8 8.1c.3.7-.2 1.5-1 1.5h-3.6L12 17.6 7.7 23H4.1c-.8 0-1.3-.8-1-1.5l3.8-8.1C3.5 12.8 1.2 11.7 1.8 10.6c.7-1.3 5.1-2.5 8.1-2.9A3.4 3.4 0 0 1 12 1.6z";
const meeple = () => `<svg class="meeple" viewBox="0 0 24 24" aria-hidden="true"><path d="${MEEPLE}"/></svg>`;
const ICONS = [
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${MEEPLE}"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>`,
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="7" r="3"/><circle cx="5" cy="9.5" r="2.3"/><circle cx="19" cy="9.5" r="2.3"/><path d="M6.5 20v-1.5a5.5 5.5 0 0 1 11 0V20M1.5 19v-.8A3.6 3.6 0 0 1 5 14.6M22.5 19v-.8a3.6 3.6 0 0 0-3.5-3.6"/></svg>`];
const esc = s => String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const lines = s => String(s||"").split("\n").map(x=>x.trim()).filter(Boolean);
const fr1 = v => v.toFixed(1).replace(".",",");
const url = u => /^(https?:|mailto:)/.test(u) ? u : "https://" + u;
function hueOf(s){ let h=0; for(const ch of String(s)) h=(h*31+ch.codePointAt(0))%360; return h; }
function initials(n){ return String(n||"?").split(/\s+/).map(w=>w[0]||"").join("").slice(0,2).toUpperCase(); }
const ex = x => x.exemple ? `<span class="chip">Exemple à remplacer</span>` : "";
const S = C.site, NOM = S.nom || "Les Experts en Périgord";
const hasPhotos = C.galerie.some(g=>g.photo);

/* ---------- Menu et pied de page ---------- */
const PAGES = [
  ["accueil","index.html","Accueil"],["festivals","festivals.html","Festivals"],["jeux","jeux.html","Jeux testés"],
  ["evenement","evenement.html","Notre événement"],["equipe","equipe.html","L'équipe"],["photos","photos.html","Photos"],["contact","contact.html","Contact"]
].filter(p=>p[0]!=="photos" || hasPhotos);
const navLinks = PAGES.map(([id,href,label])=>`<a href="${href}"${id===PAGE?' aria-current="page"':""}${id==="contact"?' class="cta"':""}>${label}</a>`).join("");
document.getElementById("top").innerHTML = `<div class="wrap">
  <a class="brand" href="index.html"><img src="images/logo.jpg" alt=""><span>${esc(NOM)}</span></a>
  <button class="burger" type="button" aria-expanded="false" aria-controls="menu" id="burger"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><b>Menu</b></button>
  <nav class="menu" aria-label="Menu principal" id="menu">${navLinks}</nav>
</div>`;
const burger = document.getElementById("burger");
burger.addEventListener("click", ()=>{ const o = burger.getAttribute("aria-expanded")!=="true"; burger.setAttribute("aria-expanded", o); document.body.classList.toggle("menu-open", o); });
document.getElementById("bas").innerHTML = `<div class="wrap foot">
  <div class="foot-brand"><a class="brand" href="index.html"><img src="images/logo.jpg" alt=""><span>${esc(NOM)}</span></a>
    <span class="hand">Jouer · Apprendre · Partager</span><p>Association de jeux de société experts${S.ville?" · "+esc(S.ville):""}</p></div>
  <nav class="foot-nav" aria-label="Pages">${PAGES.map(([,h,l])=>`<a href="${h}">${l}</a>`).join("")}</nav>
  <div class="foot-cta">${C.echanges.discord?`<a class="btn white small" href="${esc(url(C.echanges.discord))}" target="_blank" rel="noopener">Notre Discord</a>`:""}<a class="btn yellow small" href="contact.html?objet=festival">Inviter les Experts</a></div>
</div>`;

/* ---------- Blocs réutilisables ---------- */
function pageHero(hand, title, lead, pos){
  return `<header class="page-hero" style="--pos:${pos||"50%"}"><div class="wrap"><span class="hand">${esc(hand)}</span><h1>${esc(title)}</h1>${lead?`<p>${esc(lead)}</p>`:""}</div></header>`;
}
function poids(p){
  const v = Math.max(0, Math.min(5, Number(p)||0)); let c="";
  for(let i=0;i<5;i++){ const f=Math.max(0,Math.min(1,v-i))*100;
    c += `<span class="m"><svg viewBox="0 0 24 24"><path class="bg" d="${MEEPLE}"/></svg><svg viewBox="0 0 24 24" style="clip-path:inset(0 ${100-f}% 0 0)"><path class="fg" d="${MEEPLE}"/></svg></span>`; }
  return `<div class="poids"><div class="row"><span>Poids</span><b>${v?fr1(v):"–"} / 5</b></div><div class="bar" aria-hidden="true">${c}</div></div>`;
}
function slug(s){ return String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"") || "article"; }
function idOf(x){ return x.id || slug(x.nom || x.jeu); }
function artUrl(type, x){ return `article.html?type=${type}&id=${encodeURIComponent(idOf(x))}`; }
function gameCover(t){
  return t.couverture
    ? `<div class="cover photo-cover"><img src="${esc(t.couverture)}" alt="" loading="lazy"><h3>${esc(t.jeu)}</h3></div>`
    : `<div class="cover" style="--h:${hueOf(t.jeu)}"><span class="mono" aria-hidden="true">${esc(String(t.jeu||"?").slice(0,2))}</span><h3>${esc(t.jeu)}</h3></div>`;
}
function gameCard(t){
  return `<a class="card game ${VCLASS[t.verdict]||""}" href="${artUrl("jeu",t)}">
    ${gameCover(t)}
    <div class="inner">
      <div class="game-top">${t.verdict?`<span class="verdict">${esc(VERDICTS[t.verdict]||t.verdict)}</span>`:"<span></span>"}${ex(t)}</div>
      ${poids(t.poids)}
      <div class="meta">${t.joueurs?`<span class="tag">${meeple()} ${esc(t.joueurs)}</span>`:""}${t.duree?`<span class="tag">${esc(t.duree)}</span>`:""}</div>
      ${t.texte?`<p>${esc(t.texte)}</p>`:""}
      <span class="read">Lire l'article →</span>
    </div></a>`;
}
function festCard(f){
  return `<a class="card fest${f.couverture?" has-cover":""}" href="${artUrl("festival",f)}">
    ${f.couverture?`<div class="fest-cover"><img src="${esc(f.couverture)}" alt="" loading="lazy"></div>`:""}
    <div class="fest-row"><div class="cal"><span>Date</span><b>${esc(f.date||"À venir")}</b></div>
    <div class="body">${ex(f)}<h3>${esc(f.nom)}</h3>
      <div class="meta">${f.lieu?`<span class="tag">${esc(f.lieu)}</span>`:""}${f.role?`<span class="tag">${esc(f.role)}</span>`:""}</div>
      ${f.texte?`<p>${esc(f.texte)}</p>`:""}<span class="read">Lire l'article →</span></div></div></a>`;
}
function orgaBand(){
  const O = C.organisateurs;
  return `<div class="orga"><div class="wrap"><div><span class="hand">Organisateurs</span><h2>${esc(O.titre||"Vous organisez un festival ?")}</h2><p>${esc(O.texte)}</p></div>
    <a class="btn yellow" href="contact.html?objet=festival">${esc(O.bouton||"Nous contacter")}</a></div></div>`;
}
function eventBlock(){
  const E = C.evenement, k = Number(E.etape)||0;
  return `<div class="event">
    <div class="card main"><p>${esc(E.texte)}</p>
      <ol class="steps" aria-label="Avancement du projet">${ETAPES.map((x,i)=>`<li class="${i<k?"done":i===k?"now":""}">${esc(x)}</li>`).join("")}</ol>
      <dl class="kv"><dt>Date</dt><dd>${esc(E.date||"À définir")}</dd><dt>Lieu</dt><dd>${esc(E.lieu||"À définir")}</dd></dl></div>
    <div class="card"><h3>Ce que nous cherchons</h3>
      <ul class="besoins">${lines(E.besoins).map(b=>`<li>${meeple()}<span>${esc(b)}</span></li>`).join("")}</ul>
      <a class="btn" href="contact.html?objet=evenement" style="margin-top:auto">Proposer votre aide</a></div>
  </div>`;
}
function sec(inner, cls){ return `<section class="block${cls?" "+cls:""}"><div class="wrap">${inner}</div></section>`; }
function head(hand, title, lead, side){ return `<div class="sec-head"><div>${hand?`<span class="hand">${esc(hand)}</span>`:""}<h2>${esc(title)}</h2>${lead?`<p class="lead">${esc(lead)}</p>`:""}</div>${side||""}</div>`; }
const empty = t => `<div class="empty">${esc(t)}</div>`;

/* ---------- Pages ---------- */
const R = {};
R.accueil = () => {
  const H = C.histoire, T = C.tests.slice(0,3), F = C.festivals[0], E = C.evenement, k = Number(E.etape)||0;
  return `
  <div class="banner"><h1 class="sr">${esc(NOM)}, association de jeux de société experts</h1>
    <picture><source media="(max-width:1300px)" srcset="images/banniere-1200.jpg"><img src="images/banniere.jpg" width="2048" height="768" alt="Le logo des Experts en Périgord au-dessus d'une table de jeu experts. Association de jeux de société experts : jouer, apprendre, partager."></picture></div>
  <div class="piliers"><div class="wrap">${C.piliers.slice(0,3).map((p,i)=>`<div class="pilier"><span class="ico">${ICONS[i]}</span><h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p></div>`).join("")}</div></div>
  ${sec(`<div class="intro-home">
      <div class="photo${H.photo?"":" is-logo"}">${H.photo?`<img src="${esc(H.photo)}" alt="Les membres de l'association">`:`<img class="logo" src="images/logo-detoure.webp" alt="Logo des Experts en Périgord">`}</div>
      <div class="txt"><span class="hand">Qui sommes-nous</span><h2>${esc(H.titre||NOM)}</h2><p class="lead" style="color:var(--ink)">${esc(S.intro)}</p>
        <div class="meta">${lines(S.criteres).map(c=>`<span class="tag">${meeple()} ${esc(c)}</span>`).join("")}</div>
        <div class="btnrow"><a class="btn" href="equipe.html">Découvrir l'équipe</a><a class="btn ghost" href="contact.html?objet=seance">Venir jouer avec nous</a></div></div></div>`)}
  ${sec(head("Banc d'essai","Nos derniers jeux testés","",`<a class="btn ghost" href="jeux.html">Tous nos tests →</a>`) + (T.length?`<div class="grid g3">${T.map(gameCard).join("")}</div>`:empty("Aucun test publié pour le moment.")), "dark")}
  ${sec(`<div class="duo">
      <a class="card link" href="${F?artUrl("festival",F):"festivals.html"}"><span class="hand">Prochaine table</span>${F?`<h3 class="big">${esc(F.nom)}</h3><div class="meta">${F.date?`<span class="tag">${esc(F.date)}</span>`:""}${F.lieu?`<span class="tag">${esc(F.lieu)}</span>`:""}</div>${F.texte?`<p class="note">${esc(F.texte)}</p>`:""}`:`<h3 class="big">Annonce à venir</h3>`}<span class="go">${F?"Lire l'article →":"Tous nos festivals →"}</span></a>
      <a class="card link dark" href="evenement.html"><span class="hand">Notre projet</span><h3 class="big">${esc(E.titre)}</h3><div class="progress"><i style="width:${(k+1)*20}%"></i></div><p>Étape ${k+1} sur 5 : ${esc(ETAPES[k])}</p><span class="go">Suivre le projet →</span></a>
    </div>`)}
  ${orgaBand()}`;
};
R.festivals = () => pageHero("Sur le terrain","Nos tables en festival","Explication des règles, parties complètes et conseils pour se lancer dans les jeux experts.","30%")
  + sec(C.festivals.length?`<div class="grid">${C.festivals.map(festCard).join("")}</div>`:empty("Aucun festival annoncé pour le moment."))
  + orgaBand();
R.jeux = () => {
  const used = Object.keys(VERDICTS).filter(v=>C.tests.some(t=>t.verdict===v));
  const filters = C.tests.length>1 && used.length>1 ? `<div class="filters" role="group" aria-label="Filtrer par verdict"><button type="button" aria-pressed="true" data-f="">Tous (${C.tests.length})</button>${used.map(v=>`<button type="button" aria-pressed="false" data-f="${v}">${VERDICTS[v]}</button>`).join("")}</div>` : "";
  return pageHero("Banc d'essai","Les jeux qu'on a testés","Notre avis après plusieurs parties, et le poids de chaque jeu sur l'échelle BoardGameGeek : de 1 meeple (léger) à 5 meeples (très lourd).","8%")
    + sec(filters + (C.tests.length?`<div class="grid g3" id="games">${C.tests.map(gameCard).join("")}</div>`:empty("Aucun test publié pour le moment.")), "dark");
};
R.evenement = () => pageHero("Projet en cours", C.evenement.titre || "Notre événement", "", "62%") + sec(eventBlock()) + orgaBand();
R.equipe = () => {
  const H = C.histoire, M = C.membres, TM = C.temoignages.filter(t=>t.texte);
  return pageHero("Qui sommes-nous","L'équipe","","45%")
  + sec(`<div class="histoire">
      <div class="photo${H.photo?"":" is-logo"}">${H.photo?`<img src="${esc(H.photo)}" alt="Les membres de l'association">`:`<img class="logo" src="images/logo-detoure.webp" alt="Logo des Experts en Périgord">`}</div>
      <div class="txt"><span class="hand">Notre histoire</span><h2>${esc(H.titre)}</h2>${S.intro?`<p class="lead" style="color:var(--ink)">${esc(S.intro)}</p>`:""}${H.texte?`<p>${esc(H.texte)}</p>`:""}
        ${S.ville||S.seances?`<p class="note">${S.ville?`Où : <b>${esc(S.ville)}</b>`:""}${S.ville&&S.seances?" · ":""}${S.seances?`Séances : <b>${esc(S.seances)}</b>`:""}</p>`:""}
        ${H.signature?`<span class="signature">${esc(H.signature)}</span>`:""}</div></div>`)
  + sec(head("","Les membres") + (M.length?`<div class="grid g4">${M.map(m=>`
      <article class="card membre" data-c="${esc(m.couleur||"")}"><div class="ph${/^images\/membres\//.test(m.photo||"")?" avatar-ill":""}">${m.photo?`<img src="${esc(m.photo)}" alt="Portrait de ${esc(m.nom)}" loading="lazy">`:`<span class="ini" aria-hidden="true">${esc(initials(m.nom))}</span>`}</div>
        <div class="txt">${m.role?`<span class="role">${esc(m.role)}</span>`:""}<h3${/^images\/membres\//.test(m.photo||"")?' class="sr"':""}>${esc(m.nom)}</h3>${m.jeux?`<p>Jeux préférés : ${esc(m.jeux)}</p>`:""}${m.texte?`<p>${esc(m.texte)}</p>`:""}</div></article>`).join("")}</div>`:empty("La présentation des membres arrive bientôt.")), "sand")
  + (TM.length ? sec(head("Ils ont joué avec nous","Ce qu'on dit de nos tables") + `<div class="grid">${TM.map(t=>`<blockquote class="card temoin"><p>${esc(t.texte)}</p><footer>${esc(t.auteur||"")}${t.contexte?`<span>${esc(t.contexte)}</span>`:""}</footer></blockquote>`).join("")}</div>`) : "");
};
R.photos = () => {
  const G = C.galerie.filter(g=>g.photo);
  return pageHero("En images","Autour de nos tables","","70%")
    + sec(G.length?`<div class="galerie">${G.map(g=>`<figure><img src="${esc(g.photo)}" alt="${esc(g.legende||"Photo de l'association")}" loading="lazy">${g.legende?`<figcaption>${esc(g.legende)}</figcaption>`:""}</figure>`).join("")}</div>`:empty("Les photos arrivent bientôt."));
};
R.contact = () => {
  const K = C.contact, X = C.echanges, b = [];
  if(K.texte) b.push(`<p>${esc(K.texte)}</p>`);
  if(K.email) b.push(`<div><span class="k">E-mail</span><div class="copyline"><code>${esc(K.email)}</code><a class="btn ghost small" href="mailto:${esc(K.email)}">Écrire</a></div></div>`);
  if(K.telephone) b.push(`<div><span class="k">Téléphone</span><div class="copyline"><code>${esc(K.telephone)}</code><a class="btn ghost small" href="tel:${esc(K.telephone.replace(/\s/g,""))}">Appeler</a></div></div>`);
  const soc = [["Facebook",K.facebook],["Instagram",K.instagram]].filter(x=>x[1]);
  if(soc.length) b.push(`<div><span class="k">Nous suivre</span><div class="meta" style="margin-top:8px">${soc.map(([n,u])=>`<a class="btn ghost small" href="${esc(url(u))}" target="_blank" rel="noopener">${n}</a>`).join("")}</div></div>`);
  if(!K.email && !K.telephone && !K.formspree) b.push(`<p class="note">Les coordonnées de l'association seront bientôt affichées ici.</p>`);
  const form = K.formspree ? `<form class="form" id="contact-form">
      <h3>Envoyer un message</h3>
      <div class="row2"><label for="c-nom">Votre nom<input id="c-nom" name="nom" maxlength="80" required></label>
      <label for="c-email">Votre e-mail<input id="c-email" name="email" type="email" maxlength="120" required></label></div>
      <label for="c-objet">Objet<select id="c-objet" name="objet"><option value="adhesion">Rejoindre l'association</option><option value="seance">Venir jouer à une séance</option><option value="festival">Inviter l'association sur un festival</option><option value="evenement">Notre événement</option><option value="autre">Autre</option></select></label>
      <label for="c-message">Message<textarea id="c-message" name="message" maxlength="3000" required></textarea></label>
      <div class="btnrow"><button class="btn" type="submit" id="c-btn">Envoyer</button><span class="status" id="c-status" role="status"></span></div>
    </form>` : "";
  return pageHero("Contact","Nous écrire","Une question, une envie de rejoindre une table, une invitation pour un festival : on vous répond.","88%")
    + sec(`<div class="contact${form?"":" solo"}"><div class="coord">${b.join("")}</div>${form}</div>`)
    + sec(`<div class="discord">
        <div class="card big"><span class="hand">Espace d'échange</span><h2>Rejoignez-nous sur Discord</h2><p>${esc(X.texte)}</p>
          ${X.discord?`<a class="btn white" href="${esc(url(X.discord))}" target="_blank" rel="noopener">Rejoindre notre Discord</a>`:`<p class="note" style="color:#fff">Lien d'invitation bientôt disponible.</p>`}</div>
        <div class="card"><h3>Ce qu'on y trouve</h3><ul>${lines(X.salons).map(l=>`<li>${meeple()}<span>${esc(l)}</span></li>`).join("")}</ul></div></div>`, "sand");
};


R.article = () => {
  const q = new URLSearchParams(location.search), type = q.get("type")==="festival" ? "festival" : "jeu", id = q.get("id")||"";
  const list = type==="festival" ? C.festivals : C.tests, x = list.find(it=>idOf(it)===id);
  const back = type==="festival" ? ["festivals.html","Tous nos festivals"] : ["jeux.html","Tous nos jeux testés"];
  if(!x) return pageHero(type==="festival"?"Festival":"Jeu testé","Article introuvable","Cet article a peut-être été retiré ou renommé.","40%") + sec(`<a class="btn" href="${back[0]}">← ${back[1]}</a>`);
  const titre = type==="festival" ? x.nom : x.jeu;
  document.title = `${titre} · ${NOM}`;
  const photos = ((window.PHOTOS||{})[idOf(x)]||[]).filter(p=>p&&p.src);
  const texte = String(x.article||x.texte||"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const fiche = type==="festival"
    ? `<dl class="kv"><dt>Date</dt><dd>${esc(x.date||"À venir")}</dd>${x.lieu?`<dt>Lieu</dt><dd>${esc(x.lieu)}</dd>`:""}${x.role?`<dt>Notre table</dt><dd>${esc(x.role)}</dd>`:""}</dl>`
    : `${x.verdict?`<span class="verdict ${VCLASS[x.verdict]||""}">${esc(VERDICTS[x.verdict]||"")}</span>`:""}${poids(x.poids)}
       <dl class="kv">${x.joueurs?`<dt>Joueurs</dt><dd>${esc(x.joueurs)}</dd>`:""}${x.duree?`<dt>Durée</dt><dd>${esc(x.duree)}</dd>`:""}${x.auteurs?`<dt>Auteurs</dt><dd>${esc(x.auteurs)}</dd>`:""}</dl>`;
  const others = list.filter(it=>it!==x).slice(0,3);
  return pageHero(type==="festival"?"Festival":"Jeu testé", titre, "", "40%")
    + sec(`<a class="back" href="${back[0]}">← ${back[1]}</a>
      <div class="article-layout">
        <article class="article-body">
          ${x.couverture?`<img class="article-cover" src="${esc(x.couverture)}" alt="">`:""}
          ${ex(x)}
          ${texte.length?texte.map(p=>`<p>${esc(p)}</p>`).join(""):`<p class="note">L'article arrive bientôt.</p>`}
        </article>
        <aside class="card article-fiche"><h3>${type==="festival"?"En bref":"Fiche du jeu"}</h3>${fiche}
          ${type==="festival"?`<a class="btn yellow" href="contact.html?objet=festival">Inviter les Experts</a>`:`<a class="btn" href="contact.html?objet=seance">Y jouer avec nous</a>`}</aside>
      </div>
      ${photos.length?`<h2 class="photos-title">Photos <span>${photos.length}</span></h2><div class="art-gallery">${photos.map((p,i)=>`<button type="button" class="ph-btn" data-ph="${i}"><img src="${esc(p.src)}" alt="${esc(p.legende||"Photo "+(i+1))}" loading="lazy">${p.legende?`<span>${esc(p.legende)}</span>`:""}</button>`).join("")}</div>
        <dialog class="lightbox" id="lightbox"><figure><img id="lb-img" alt=""><figcaption id="lb-cap"></figcaption></figure>
          <button type="button" class="lb-close" id="lb-close" aria-label="Fermer">✕</button><button type="button" class="lb-nav prev" id="lb-prev" aria-label="Photo précédente">‹</button><button type="button" class="lb-nav next" id="lb-next" aria-label="Photo suivante">›</button></dialog>`:""}`)
    + (others.length ? sec(head("", type==="festival"?"Nos autres festivals":"D'autres jeux testés") + `<div class="grid g3">${others.map(type==="festival"?festCard:gameCard).join("")}</div>`, type==="jeu"?"dark":"sand") : "");
};

const main = document.getElementById("main");
main.innerHTML = (R[PAGE] || R.accueil)();
const titles = {accueil:"", festivals:"Festivals", jeux:"Jeux testés", evenement:"Notre événement", equipe:"L'équipe", photos:"Photos", contact:"Contact"};
if(PAGE!=="article") document.title = titles[PAGE] ? `${titles[PAGE]} · ${NOM}` : NOM;

/* Filtres des jeux testés */
document.addEventListener("click", e=>{
  const b = e.target.closest("[data-f]"); if(!b) return;
  document.querySelectorAll("[data-f]").forEach(x=>x.setAttribute("aria-pressed", x===b));
  const v = b.dataset.f, cards = document.querySelectorAll("#games .game");
  C.tests.forEach((t,i)=>{ if(cards[i]) cards[i].hidden = !!v && t.verdict!==v; });
});

/* Formulaire de contact (Formspree) */
const form = document.getElementById("contact-form");
if(form){
  const o = new URLSearchParams(location.search).get("objet");
  if(o && form.querySelector(`option[value="${o}"]`)) form.elements.objet.value = o;
  form.addEventListener("submit", async e=>{
    e.preventDefault();
    const st = document.getElementById("c-status"), btn = document.getElementById("c-btn");
    btn.disabled = true; st.className="status"; st.textContent="Envoi…";
    const data = new FormData(form); data.set("objet", form.elements.objet.selectedOptions[0].textContent);
    try{
      const r = await fetch(C.contact.formspree, {method:"POST", headers:{"Accept":"application/json"}, body:data});
      if(!r.ok) throw new Error(r.status);
      form.reset(); st.className="status ok"; st.textContent="Message envoyé. Nous vous répondrons par e-mail.";
    }catch(_){ st.className="status err"; st.textContent = C.contact.email ? "L'envoi a échoué. Écrivez-nous à "+C.contact.email+"." : "L'envoi a échoué. Réessayez dans un moment."; }
    btn.disabled = false;
  });
}

/* Galerie photo d'un article : agrandissement */
const lbx = document.getElementById("lightbox");
if(lbx){
  const q = new URLSearchParams(location.search), t = q.get("type")==="festival" ? C.festivals : C.tests;
  const it = t.find(x=>idOf(x)===(q.get("id")||""));
  const P = ((window.PHOTOS||{})[it?idOf(it):""]||[]).filter(p=>p&&p.src);
  let cur = 0;
  const show = i => { cur = (i+P.length)%P.length; document.getElementById("lb-img").src = P[cur].src; document.getElementById("lb-img").alt = P[cur].legende||""; document.getElementById("lb-cap").textContent = (P[cur].legende?P[cur].legende+" · ":"")+(cur+1)+" / "+P.length; };
  document.querySelectorAll("[data-ph]").forEach(b=>b.addEventListener("click",()=>{ show(Number(b.dataset.ph)); lbx.showModal(); }));
  document.getElementById("lb-close").addEventListener("click",()=>lbx.close());
  document.getElementById("lb-prev").addEventListener("click",()=>show(cur-1));
  document.getElementById("lb-next").addEventListener("click",()=>show(cur+1));
  lbx.addEventListener("click",e=>{ if(e.target===lbx) lbx.close(); });
  lbx.addEventListener("keydown",e=>{ if(e.key==="ArrowLeft") show(cur-1); if(e.key==="ArrowRight") show(cur+1); });
  if(P.length<2){ document.getElementById("lb-prev").hidden = true; document.getElementById("lb-next").hidden = true; }
}
})();
