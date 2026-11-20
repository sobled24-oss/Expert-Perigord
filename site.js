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
const hasPhotos = C.galerie.some(g=>g && (g.image||g.photo));
const LUDO = ((C.ludotheque||{}).jeux)||[];
const EXT_SEULES = ((C.ludotheque||{}).extensions_seules)||[];
const NB_EXT = LUDO.reduce((n,j)=>n+(j.extensions||[]).length,0) + EXT_SEULES.length;

/* ---------- Menu et pied de page ---------- */
const PAGES = [
  ["accueil","index.html","Accueil"],["festivals","festivals.html","Festivals"],["jeux","jeux.html","Jeux testés"],["ludotheque","ludotheque.html","Ludothèque"],
  ["evenement","evenement.html","Notre événement"],["equipe","equipe.html","L'équipe"],["photos","photos.html","Photos"],["contact","contact.html","Contact"],["inviter","contact.html?objet=festival","Inviter les Experts"]
].filter(p=>(p[0]!=="photos" || hasPhotos) && (p[0]!=="ludotheque" || LUDO.length || PAGE==="ludotheque"));
const navLinks = PAGES.map(([id,href,label])=>`<a href="${href}"${id===PAGE?' aria-current="page"':""}${id==="inviter"?' class="cta"':""}>${label}</a>`).join("");
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
  <nav class="foot-nav" aria-label="Pages">${PAGES.filter(p=>p[0]!=="inviter").map(([,h,l])=>`<a href="${h}">${l}</a>`).join("")}</nav>
  <div class="foot-cta">${C.echanges.discord?`<a class="btn white small" href="${esc(url(C.echanges.discord))}" target="_blank" rel="noopener">Notre Discord</a>`:""}</div>
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
function mkey(m){ return slug(m.nom); }
function notes(t){ const a = t.avis||{}; return C.membres.map(m=>a[mkey(m)]).filter(v=>v && v.note!=="" && v.note!=null && !isNaN(Number(v.note))).map(v=>Number(v.note)); }
function moyenne(t){ const n = notes(t); return n.length ? n.reduce((a,b)=>a+b,0)/n.length : null; }
const fr = v => (Math.round(v*10)/10).toString().replace(".",",");
const AUJ = (()=>{ const d = new Date(); d.setDate(d.getDate()-2); return d.toISOString().slice(0,10); })();
function aVenir(){ return C.festivals.filter(f=>f.debut && f.debut >= AUJ).sort((a,b)=>a.debut<b.debut?-1:1); }
function passes(){ return C.festivals.filter(f=>!f.debut || f.debut < AUJ).sort((a,b)=>(a.debut||"")<(b.debut||"")?1:-1); }
function artUrl(type, x){ return x.url ? String(x.url).replace(/^\//,"") : `${type==="festival"?"festivals":"jeux"}/${encodeURIComponent(idOf(x))}/`; }
function gameCover(t){
  return t.couverture
    ? `<div class="cover photo-cover"><img src="${esc(t.couverture)}" alt="" loading="lazy"><h3>${esc(t.jeu)}</h3></div>`
    : `<div class="cover" style="--h:${hueOf(t.jeu)}"><span class="mono" aria-hidden="true">${esc(String(t.jeu||"?").slice(0,2))}</span><h3>${esc(t.jeu)}</h3></div>`;
}
function gameCard(t){
  return `<a class="card game ${VCLASS[t.verdict]||""}" href="${artUrl("jeu",t)}">
    ${gameCover(t)}
    <div class="inner">
      <div class="game-top">${t.verdict?`<span class="verdict">${esc(VERDICTS[t.verdict]||t.verdict)}${t.redacteur?` de ${esc(t.redacteur)}`:""}</span>`:(t.redacteur?`<span class="verdict">Article de ${esc(t.redacteur)}</span>`:"<span></span>")}${ex(t)}</div>
      ${poids(t.poids)}
      <div class="meta">${moyenne(t)!==null?`<span class="tag score">Experts ${fr(moyenne(t))}/10</span>`:""}${t.strategie?`<span class="tag strat">Guide stratégie</span>`:""}${t.joueurs?`<span class="tag">${meeple()} ${esc(t.joueurs)}</span>`:""}${t.duree?`<span class="tag">${esc(t.duree)}</span>`:""}</div>
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
  return `<div class="orga"><div class="wrap"><div><span class="hand">Organisateurs</span><h2>${esc(O.titre||"Vous organisez un festival ?")}</h2><p>${esc(O.texte)}</p></div></div></div>`;
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
  const H = C.histoire, T = C.tests.slice(0,4), NEXT = aVenir()[0], F = NEXT || passes()[0], E = C.evenement, k = Number(E.etape)||0;
  return `
  <div class="banner"><h1 class="sr">${esc(NOM)}, association de jeux de société experts</h1>
    <picture><source media="(max-width:1300px)" srcset="images/banniere-1200.jpg?v=2"><img src="images/banniere.jpg?v=2" width="2048" height="768" alt="Le logo des Experts en Périgord au-dessus d'une table de jeu experts. Association de jeux de société experts : jouer, apprendre, partager."></picture></div>
  <div class="piliers"><div class="wrap">${C.piliers.slice(0,3).map((p,i)=>`<div class="pilier"><span class="ico">${ICONS[i]}</span><h3>${esc(p.titre)}</h3><p>${esc(p.texte)}</p></div>`).join("")}</div></div>
  ${sec(`<div class="intro-home">
      <div class="photo${H.photo?"":" is-logo"}">${H.photo?`<img src="${esc(H.photo)}" alt="Les membres de l'association">`:`<img class="logo" src="images/logo-detoure.webp" alt="Logo des Experts en Périgord">`}</div>
      <div class="txt"><span class="hand">Qui sommes-nous</span><h2>${esc(H.titre||NOM)}</h2><p class="lead" style="color:var(--ink)">${esc(S.intro)}</p>
        <div class="meta">${lines(S.criteres).map(c=>`<span class="tag">${meeple()} ${esc(c)}</span>`).join("")}</div>
        <div class="btnrow"><a class="btn" href="equipe.html">Découvrir l'équipe</a><a class="btn ghost" href="contact.html?objet=seance">Venir jouer avec nous</a></div></div></div>`)}
  ${sec(`<div class="duo">
      <a class="card link duo-fest${F&&F.couverture?" has-cover":""}" href="${F?artUrl("festival",F):"festivals.html"}"><div class="duo-in"><div class="duo-txt"><span class="hand">${NEXT||!F?"Prochaine table":"Dernière table"}</span>${F?`<h3 class="big">${esc(F.nom)}</h3><div class="meta">${F.date?`<span class="tag">${esc(F.date)}</span>`:""}${F.lieu?`<span class="tag">${esc(F.lieu)}</span>`:""}</div>${F.texte?`<p class="note">${esc(F.texte)}</p>`:""}`:`<h3 class="big">Annonce à venir</h3>`}</div>${F&&F.couverture?`<img class="duo-thumb" src="${esc(F.couverture)}" alt="Affiche de ${esc(F.nom)}" loading="lazy">`:""}</div><span class="go">${F?"Lire l'article →":"Tous nos festivals →"}</span></a>
      <a class="card link dark" href="evenement.html"><span class="hand">Notre projet</span><h3 class="big">${esc(E.titre)}</h3><div class="progress"><i style="width:${(k+1)*20}%"></i></div><p>Étape ${k+1} sur 5 : ${esc(ETAPES[k])}</p><span class="go">Suivre le projet →</span></a>
    </div>`, "sand")}
  ${sec(head("Banc d'essai","Nos derniers jeux testés","",`<a class="btn ghost" href="jeux.html">Tous nos tests →</a>`) + (T.length?`<div class="grid g3">${T.map(gameCard).join("")}</div>`:empty("Aucun test publié pour le moment.")), "dark")}
  ${orgaBand()}`;
};
R.festivals = () => pageHero("Sur le terrain","Nos tables en festival","Explication des règles, parties complètes et conseils pour se lancer dans les jeux experts.","30%")
  + (()=>{ const V = aVenir(), P = passes();
      if(!V.length && !P.length) return sec(empty("Aucun festival annoncé pour le moment."));
      return sec(head("","À venir","",`<a class="btn ghost" href="webcal://${location.host}/festivals.ics" title="Ajoute tous nos festivals à votre agenda (iPhone, Outlook, Google…), mis à jour automatiquement">S'abonner à notre agenda</a>`) + (V.length?`<div class="grid">${V.map(festCard).join("")}</div>`:empty("Aucun festival annoncé pour le moment. Suivez-nous sur Discord pour connaître nos prochaines tables.")))
        + (P.length ? sec(head("","Ils sont passés") + `<div class="grid">${P.map(festCard).join("")}</div>`, "sand") : ""); })()
  + orgaBand();
function nums(s){ return (String(s||"").match(/\d+/g)||[]).map(Number); }
function avisDe(t){ const a = t.avis||{}; return C.membres.filter(m=>{ const v = a[mkey(m)]; return v && (v.texte || (v.note!=="" && v.note!=null)); }).map(m=>m.nom).concat(t.redacteur && !C.membres.some(m=>m.nom===t.redacteur && (t.avis||{})[mkey(m)] && ((t.avis||{})[mkey(m)].texte || ((t.avis||{})[mkey(m)].note!=="" && (t.avis||{})[mkey(m)].note!=null))) ? [t.redacteur] : []); }
R.jeux = () => {
  const hero = pageHero("Banc d'essai","Les jeux qu'on a testés","Notre avis après plusieurs parties, et le poids de chaque jeu sur l'échelle BoardGameGeek : de 1 meeple (léger) à 5 meeples (très lourd).","8%");
  if(!C.tests.length) return hero + sec(empty("Aucun test publié pour le moment."), "dark");
  const opt = (v,l)=>`<option value="${esc(v)}">${esc(l)}</option>`;
  const used = Object.keys(VERDICTS).filter(v=>C.tests.some(t=>t.verdict===v));
  const auteurs = C.membres.map(m=>m.nom).filter(n=>C.tests.some(t=>avisDe(t).includes(n)));
  return hero + sec(`<form class="ludo-filters" id="jeux-filters" role="search" onsubmit="return false">
      <label for="jf-q">Rechercher<input id="jf-q" type="search" placeholder="Nom du jeu, auteur…" autocomplete="off"></label>
      ${used.length>1?`<label for="jf-v">Verdict<select id="jf-v">${opt("","Tous")}${used.map(v=>opt(v,VERDICTS[v])).join("")}</select></label>`:""}
      <label for="jf-j">Joueurs<select id="jf-j">${opt("","Tous")}${[1,2,3,4,5,6].map(n=>opt(n, n===6?"6 et +":n)).join("")}</select></label>
      <label for="jf-p">Poids<select id="jf-p">${opt("","Tous")}${opt("0-3","Moins de 3")}${opt("3-4","3 à 4")}${opt("4-6","4 et plus")}</select></label>
      ${auteurs.length>1?`<label for="jf-a">Avis de<select id="jf-a">${opt("","Tout le monde")}${auteurs.map(n=>opt(n,n)).join("")}</select></label>`:""}
      ${C.tests.some(t=>t.strategie)?`<label for="jf-s">Stratégie<select id="jf-s">${opt("","Tous les jeux")}${opt("1","Avec guide stratégie")}</select></label>`:""}
      <label for="jf-t">Trier par<select id="jf-t">${opt("date","Plus récents d'abord")}${opt("note","Mieux notés d'abord")}${opt("poids","Plus lourds d'abord")}${opt("nom","Nom")}</select></label>
    </form>
    <p class="note ludo-count" id="jeux-count" aria-live="polite"></p>
    <div class="grid g3" id="games"></div>`, "dark");
};
function jeuxFiltre(){
  const g = document.getElementById("games"), f = document.getElementById("jeux-filters"); if(!g || !f) return;
  const v = id => { const e = document.getElementById(id); return e ? e.value : ""; };
  const strat = v("jf-s"), q = norm(v("jf-q")), ver = v("jf-v"), nj = Number(v("jf-j")), p = v("jf-p"), au = v("jf-a"), tri = v("jf-t");
  let L = C.tests.filter(t=>{
    if(q && !norm(t.jeu+" "+(t.auteurs||"")).includes(q)) return false;
    if(ver && t.verdict!==ver) return false;
    if(strat && !t.strategie) return false;
    if(nj){ const n = nums(t.joueurs); if(!n.length) return false; const mn = n[0], mx = n[n.length-1]; if(nj===6 ? mx<6 : (nj<mn || nj>mx)) return false; }
    if(p){ const [a,b] = p.split("-").map(Number), w = Number(t.poids); if(!w || w<a || w>=b) return false; }
    if(au && !avisDe(t).includes(au)) return false;
    return true;
  });
  if(tri==="note") L = L.slice().sort((a,b)=>(moyenne(b)??-1)-(moyenne(a)??-1));
  if(tri==="poids") L = L.slice().sort((a,b)=>(Number(b.poids)||0)-(Number(a.poids)||0));
  if(tri==="nom") L = L.slice().sort((a,b)=>String(a.jeu).localeCompare(String(b.jeu),"fr"));
  g.innerHTML = L.length ? L.map(gameCard).join("") : `<div class="empty">Aucun jeu ne correspond à ces critères.</div>`;
  document.getElementById("jeux-count").textContent = L.length===C.tests.length ? `${L.length} jeu${L.length>1?"x":""} testé${L.length>1?"s":""}` : `${L.length} jeu${L.length>1?"x":""} sur ${C.tests.length}`;
}
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
        <div class="txt">${m.role?`<span class="role">${esc(m.role)}</span>`:""}<h3${/^images\/membres\//.test(m.photo||"")?' class="sr"':""}>${esc(m.nom)}</h3>${m.jeux?`<p>Jeux préférés : ${esc(m.jeux)}</p>`:""}${m.texte?`<p>${esc(m.texte)}</p>`:""}${bggUser(m.bgg)?`<a class="ludo-bgg" href="https://boardgamegeek.com/collection/user/${encodeURIComponent(bggUser(m.bgg))}?own=1" target="_blank" rel="noopener">Sa collection BoardGameGeek ↗</a>`:""}</div></article>`).join("")}</div>`:empty("La présentation des membres arrive bientôt.")), "sand")
  + (TM.length ? sec(head("Ils ont joué avec nous","Ce qu'on dit de nos tables") + `<div class="grid">${TM.map(t=>`<blockquote class="card temoin"><p>${esc(t.texte)}</p><footer>${esc(t.auteur||"")}${t.contexte?`<span>${esc(t.contexte)}</span>`:""}</footer></blockquote>`).join("")}</div>`) : "");
};
R.photos = () => {
  const G = C.galerie.filter(g=>g && (g.image||g.photo)).map(g=>({photo:g.image||g.photo, legende:g.legende}));
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
  const photos = (x.photos||[]).map(p=>({src:p.image||p.src, legende:p.legende||""})).filter(p=>p.src);
  const texte = String(x.article||x.texte||"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
  const fiche = type==="festival"
    ? `<dl class="kv"><dt>Date</dt><dd>${esc(x.date||"À venir")}</dd>${x.lieu?`<dt>Lieu</dt><dd>${esc(x.lieu)}</dd>`:""}${x.role?`<dt>Notre table</dt><dd>${esc(x.role)}</dd>`:""}</dl>`
    : `${moyenne(x)!==null?`<div class="moy"><b>${fr(moyenne(x))}</b><span>/10<br>note moyenne des Experts (${notes(x).length} avis)</span></div>`:""}${x.verdict?`<span class="verdict ${VCLASS[x.verdict]||""}">${esc(VERDICTS[x.verdict]||"")}${x.redacteur?` de ${esc(x.redacteur)}`:""}</span>`:""}${poids(x.poids)}
       <dl class="kv">${x.joueurs?`<dt>Joueurs</dt><dd>${esc(x.joueurs)}</dd>`:""}${x.duree?`<dt>Durée</dt><dd>${esc(x.duree)}</dd>`:""}${x.auteurs?`<dt>Auteurs</dt><dd>${esc(x.auteurs)}</dd>`:""}</dl>`;
  const others = list.filter(it=>it!==x).slice(0,3);
  return pageHero(type==="festival"?"Festival":"Jeu testé", titre, "", "40%")
    + sec(`<a class="back" href="${back[0]}">← ${back[1]}</a>
      <div class="article-layout">
        <article class="article-body">
          ${x.couverture?`<img class="article-cover" src="${esc(x.couverture)}" alt="">`:""}
          ${ex(x)}
          ${x.article_html && x.article_html.trim() ? `<div class="prose">${x.article_html}</div>` : texte.length?texte.map(p=>`<p>${esc(p)}</p>`).join(""):`<p class="note">L'article arrive bientôt.</p>`}
        </article>
        <aside class="card article-fiche"><h3>${type==="festival"?"En bref":"Fiche du jeu"}</h3>${fiche}
          ${type==="festival"?"":`<a class="btn" href="contact.html?objet=seance">Y jouer avec nous</a>`}</aside>
      </div>
      ${type==="jeu" && C.membres.length ? `<h2 class="photos-title">L'avis des Experts</h2><div class="avis-grid">${C.membres.map(m=>{ const v = (x.avis||{})[mkey(m)]||{}; const has = v.texte || (v.note!==""&&v.note!=null);
        return `<article class="avis${has?"":" vide"}" data-c="${esc(m.couleur||"")}"><header>${m.photo?`<img src="${esc(m.photo)}" alt="">`:`<span class="ini">${esc(initials(m.nom))}</span>`}<div><b>${esc(m.nom)}</b>${m.role?`<span>${esc(m.role)}</span>`:""}</div>${v.note!==""&&v.note!=null?`<span class="note10">${fr(Number(v.note))}<small>/10</small></span>`:""}</header>
          ${v.texte?String(v.texte).split(/\n\s*\n/).map(p=>`<p>${esc(p.trim())}</p>`).join(""):(has?"":`<p class="note">${esc(m.nom)} n'a pas encore donné son avis.</p>`)}</article>`; }).join("")}</div>` : ""}
      ${photos.length?`<h2 class="photos-title">Photos <span>${photos.length}</span></h2><div class="art-gallery">${photos.map((p,i)=>`<button type="button" class="ph-btn" data-ph="${i}"><img src="${esc(p.src)}" alt="${esc(p.legende||"Photo "+(i+1))}" loading="lazy">${p.legende?`<span>${esc(p.legende)}</span>`:""}</button>`).join("")}</div>
        <dialog class="lightbox" id="lightbox"><figure><img id="lb-img" alt=""><figcaption id="lb-cap"></figcaption></figure>
          <button type="button" class="lb-close" id="lb-close" aria-label="Fermer">✕</button><button type="button" class="lb-nav prev" id="lb-prev" aria-label="Photo précédente">‹</button><button type="button" class="lb-nav next" id="lb-next" aria-label="Photo suivante">›</button></dialog>`:""}`)
    + (others.length ? sec(head("", type==="festival"?"Nos autres festivals":"D'autres jeux testés") + `<div class="grid g3">${others.map(type==="festival"?festCard:gameCard).join("")}</div>`, type==="jeu"?"dark":"sand") : "");
};

/* ---------- Ludothèque (synchronisée avec BoardGameGeek) ---------- */
function bggUser(v){ v = String(v||"").trim(); const m = v.match(/boardgamegeek\.com\/(?:user|collection\/user)\/([^/?#\s]+)/); return m ? decodeURIComponent(m[1]) : v.replace(/^@/,""); }
function chez(j){
  const P = j.proprietaires||[]; if(!P.length) return "";
  return `<div class="chez"><span>Chez</span>${P.map(n=>{ const m = C.membres.find(x=>x.nom===n); return `<b data-c="${esc(m&&m.couleur||"")}">${esc(n)}</b>`; }).join("")}</div>`;
}
function plage(a, b, unite){ if(!a && !b) return ""; if(!b || a===b) return `${a||b}${unite}`; return `${a}–${b}${unite}`; }
/* Reconnaître le même jeu sous deux écritures : « Dune: Imperium » = « Dune Imperium », « SETI: Search for… » = « SETI » */
const norm = s => String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/&/g," and ").replace(/[^a-z0-9]+/g," ").trim();
function memeNom(a, b){
  const A = norm(a), B = norm(b); if(!A || !B) return false;
  const ca = norm(String(a).split(/[:–—(]/)[0]), cb = norm(String(b).split(/[:–—(]/)[0]);
  return A===B || A===cb || ca===B || (ca.length>3 && ca===cb && (ca===A || cb===B));
}
function testDe(j){ return C.tests.find(t=>(t.bgg && String(t.bgg).trim()===String(j.id)) ) || C.tests.find(t=>memeNom(t.jeu, j.nom)); }
function ludoDe(nom, bgg){ return (bgg && LUDO.find(j=>String(j.id)===String(bgg).trim())) || LUDO.find(j=>memeNom(j.nom, nom)); }
function testParNom(nom){ return C.tests.find(t=>memeNom(t.jeu, nom)); }
function extListe(j){
  const X = j.extensions||[]; if(!X.length) return "";
  const nomCourt = n => { const base = String(j.nom).split(/[:–—]/)[0].trim(); const m = String(n).match(/^(.+?)\s*[:–—]\s*(.+)$/); return m && norm(m[1]).startsWith(norm(base).slice(0,6)) ? m[2] : n; };
  const li = e => `<li><a href="${esc(e.url_bgg)}" target="_blank" rel="noopener">${esc(nomCourt(e.nom))}</a>${OWNERS.length>1?`<span>chez ${esc((e.proprietaires||[]).join(", "))}</span>`:""}</li>`;
  const vis = X.slice(0,3), reste = X.slice(3);
  return `<div class="ludo-ext"><span class="k">Extension${X.length>1?"s":""} (${X.length})</span><ul>${vis.map(li).join("")}</ul>${reste.length?`<details><summary>et ${reste.length} autre${reste.length>1?"s":""}</summary><ul>${reste.map(li).join("")}</ul></details>`:""}</div>`;
}
function ludoCard(j){
  const t = testDe(j);
  return `<article class="card ludo-card">
    <a class="ludo-img" href="${esc(j.url_bgg)}" target="_blank" rel="noopener" aria-label="Fiche BoardGameGeek de ${esc(j.nom)}">${j.image?`<img src="${esc(j.image)}" alt="Boîte de ${esc(j.nom)}" loading="lazy">`:`<span class="mono">${esc(String(j.nom||"?").slice(0,2))}</span>`}</a>
    <div class="ludo-body">
      <h3>${esc(j.nom)}</h3>${j.annee?`<span class="note">${j.annee}</span>`:""}
      <div class="meta">${j.joueurs_min||j.joueurs_max?`<span class="tag">${meeple()} ${plage(j.joueurs_min,j.joueurs_max,"")}</span>`:""}${j.duree_min||j.duree_max?`<span class="tag">${plage(j.duree_min,j.duree_max," min")}</span>`:""}${j.age?`<span class="tag">${j.age}+</span>`:""}</div>
      ${j.poids?poids(j.poids):""}
      ${chez(j)}
      ${extListe(j)}
      <div class="ludo-links">${t?`<a class="tag score" href="${artUrl("jeu",t)}">Testé par les Experts →</a>`:""}<a class="ludo-bgg" href="${esc(j.url_bgg)}" target="_blank" rel="noopener">BoardGameGeek ↗</a></div>
    </div></article>`;
}
const OWNERS = (()=>{ const seen = []; C.membres.forEach(m=>{ if(LUDO.some(j=>(j.proprietaires||[]).includes(m.nom))) seen.push(m.nom); }); LUDO.forEach(j=>(j.proprietaires||[]).forEach(n=>{ if(!seen.includes(n)) seen.push(n); })); return seen; })();
R.ludotheque = () => {
  const B = C.bgg||{}, maj = (C.ludotheque||{}).maj;
  const hero = pageHero("Notre ludothèque","Les jeux de la ludothèque", B.intro||"", "60%");
  if(!LUDO.length) return hero + sec(empty("La ludothèque arrive bientôt : elle sera mise à jour automatiquement à partir de notre collection BoardGameGeek."));
  const opt = (v,l)=>`<option value="${v}">${l}</option>`;
  const parMembre = OWNERS.map(n=>`<span><b>${LUDO.filter(j=>(j.proprietaires||[]).includes(n)).length}</b> chez ${esc(n)}</span>`).join("");
  return hero + sec(`<div class="ludo-total"><div class="lt-main"><b>${LUDO.length}</b><span>jeux différents${NB_EXT?`<br><i>et ${NB_EXT} extension${NB_EXT>1?"s":""}</i>`:""}</span></div>${OWNERS.length>1?`<div class="lt-detail">${parMembre}<em>Un jeu possédé par plusieurs membres n'est compté qu'une fois.</em></div>`:""}</div>
    <form class="ludo-filters" id="ludo-filters" role="search" onsubmit="return false">
      <label for="lf-q">Rechercher<input id="lf-q" type="search" placeholder="Nom du jeu" autocomplete="off"></label>
      <label for="lf-j">Joueurs<select id="lf-j">${opt("","Tous")}${[1,2,3,4,5,6].map(n=>opt(n, n===6?"6 et +":n)).join("")}</select></label>
      <label for="lf-d">Durée<select id="lf-d">${opt("","Toutes")}${opt("60","1 h ou moins")}${opt("120","2 h ou moins")}${opt("180","3 h ou moins")}${opt("999","Plus de 3 h")}</select></label>
      <label for="lf-p">Poids<select id="lf-p">${opt("","Tous")}${opt("0-3","Moins de 3")}${opt("3-4","3 à 4")}${opt("4-6","4 et plus")}</select></label>
      ${OWNERS.length>1?`<label for="lf-c">Chez<select id="lf-c">${opt("","Tout le monde")}${OWNERS.map(n=>opt(esc(n),esc(n))).join("")}</select></label>`:""}
      ${NB_EXT?`<label for="lf-e">Extensions<select id="lf-e">${opt("","Tous les jeux")}${opt("1","Avec extensions")}</select></label>`:""}
      <label for="lf-t">Trier par<select id="lf-t">${opt("nom","Nom")}${opt("poids","Plus lourds d'abord")}${opt("duree","Plus courts d'abord")}${opt("annee","Plus récents d'abord")}</select></label>
    </form>
    <p class="note ludo-count" id="ludo-count" aria-live="polite"></p>
    <nav class="ludo-az" id="ludo-az" aria-label="Aller à la lettre"></nav>
    <div class="grid ludo-grid" id="ludo-grid"></div>
    ${EXT_SEULES.length?`<details class="ludo-orphelines"><summary>Extensions sans le jeu de base (${EXT_SEULES.length})</summary><ul>${EXT_SEULES.map(e=>`<li><a href="${esc(e.url_bgg)}" target="_blank" rel="noopener">${esc(e.nom)}</a>${OWNERS.length>1?` <span>chez ${esc((e.proprietaires||[]).join(", "))}</span>`:""}</li>`).join("")}</ul></details>`:""}
    <div class="bgg-credit">
      <p class="note">Données et images : <a href="https://boardgamegeek.com" target="_blank" rel="noopener">BoardGameGeek</a>, d'après les collections de nos membres.${maj?` Liste mise à jour automatiquement, dernière modification le ${esc(new Date(maj+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}))}.`:""}</p>
      <a class="bgg-logo" href="https://boardgamegeek.com" target="_blank" rel="noopener"><img src="images/powered-by-bgg.png" alt="Powered by BGG" width="220" height="64"></a>
    </div>`);
};
function ludoFiltre(){
  const g = document.getElementById("ludo-grid"); if(!g) return;
  const v = id => document.getElementById(id).value;
  const ch = document.getElementById("lf-c") ? v("lf-c") : "", ex = document.getElementById("lf-e") ? v("lf-e") : "";
  const q = v("lf-q").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,""), nj = Number(v("lf-j")), d = v("lf-d"), p = v("lf-p"), tri = v("lf-t");
  let L = LUDO.filter(j=>{
    if(ch && !(j.proprietaires||[]).includes(ch)) return false;
    if(q && ![j.nom].concat((j.extensions||[]).map(e=>e.nom)).some(n=>String(n).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").includes(q))) return false;
    if(ex && !(j.extensions||[]).length) return false;
    if(nj){ const mn = j.joueurs_min||1, mx = j.joueurs_max||mn; if(nj===6 ? mx<6 : (nj<mn || nj>mx)) return false; }
    if(d){ const dm = j.duree_max||j.duree_min||0; if(d==="999" ? dm<=180 : (!dm || dm>Number(d))) return false; }
    if(p){ const [a,b] = p.split("-").map(Number); if(!j.poids || j.poids<a || j.poids>=b) return false; }
    return true;
  });
  const cmp = {nom:(a,b)=>String(a.nom).localeCompare(String(b.nom),"fr"), poids:(a,b)=>(b.poids||0)-(a.poids||0), duree:(a,b)=>(a.duree_max||999)-(b.duree_max||999), annee:(a,b)=>(b.annee||0)-(a.annee||0)}[tri];
  L = L.slice().sort(cmp);
  const az = document.getElementById("ludo-az");
  if(tri==="nom" && L.length>12){
    const lettre = j => { const c = norm(j.nom).charAt(0).toUpperCase(); return /[A-Z]/.test(c) ? c : "#"; };
    let html = "", cur = null; const vues = [];
    L.forEach(j=>{ const l = lettre(j); if(l!==cur){ cur = l; vues.push(l); html += `<h3 class="ludo-lettre" id="lettre-${l==="#"?"0":l}">${l}</h3>`; } html += ludoCard(j); });
    g.innerHTML = html;
    az.innerHTML = vues.map(l=>`<a href="#lettre-${l==="#"?"0":l}">${l}</a>`).join("");
    az.hidden = false;
  } else {
    g.innerHTML = L.length ? L.map(ludoCard).join("") : `<div class="empty">Aucun jeu ne correspond à ces critères.</div>`;
    az.hidden = true;
  }
  document.getElementById("ludo-count").textContent = L.length===LUDO.length ? `${LUDO.length} jeux` : `${L.length} jeu${L.length>1?"x":""} sur ${LUDO.length}`;
}

const main = document.getElementById("main");
if(!main.hasAttribute("data-ssr")) main.innerHTML = (R[PAGE] || R.accueil)();
if(document.getElementById("ludo-filters")){ ludoFiltre(); document.getElementById("ludo-filters").addEventListener("input", ludoFiltre); }
if(document.getElementById("jeux-filters")){ jeuxFiltre(); document.getElementById("jeux-filters").addEventListener("input", jeuxFiltre); }

/* Pages d'article fabriquées par GitHub : on ajoute les autres articles en bas */
const oth = document.getElementById("others");
if(oth){
  const isF = oth.dataset.kind==="festival", list = isF ? C.festivals : C.tests;
  const others = list.filter(it=>idOf(it)!==oth.dataset.slug).slice(0,3);
  if(others.length) oth.outerHTML = sec(head("", isF?"Nos autres festivals":"D'autres jeux testés") + `<div class="grid g3">${others.map(isF?festCard:gameCard).join("")}</div>`, isF?"sand":"dark");
  else oth.remove();
}

/* Page d'un festival : jeux apportés, festival passé, ajout à l'agenda */
const HIER = (()=>{ const d = new Date(); d.setDate(d.getDate()-1); return d.toISOString().slice(0,10); })();
const av = document.querySelector(".a-venir");
const passe = av && av.dataset.fin && av.dataset.fin < HIER;
if(passe){ const inv = av.querySelector(".resa-inviter"); if(inv) av.before(inv); av.remove(); document.querySelectorAll(".tj-resa,.tj-libre").forEach(e=>e.remove()); const h = document.querySelector("#nos-jeux .photos-title"); if(h) h.textContent = "Les jeux qu'on avait apportés"; document.querySelectorAll(".tj-titre span").forEach(e=>e.remove()); }
document.querySelectorAll(".tj[data-nom]").forEach(el=>{
  const nom = el.dataset.nom, l = ludoDe(nom), t = testParNom(nom), box = el.querySelector(".tj-img");
  const img = (l && l.image) || (t && t.couverture);
  if(img && !box.querySelector("img")) box.innerHTML = `<img src="${esc(img)}" alt="Boîte de ${esc(nom)}" loading="lazy">`;
  const info = [];
  if(l){ const j = plage(l.joueurs_min,l.joueurs_max,""), d = plage(l.duree_min,l.duree_max," min"); if(j) info.push(`<span class="tag">${meeple()} ${j}</span>`); if(d) info.push(`<span class="tag">${d}</span>`); }
  else if(t){ if(t.joueurs) info.push(`<span class="tag">${meeple()} ${esc(t.joueurs)}</span>`); if(t.duree) info.push(`<span class="tag">${esc(t.duree)}</span>`); }
  if(t) info.push(`<a class="tag score" href="${artUrl("jeu",t)}">Notre avis →</a>`);
  el.querySelector(".tj-info").innerHTML = info.join("");
});
const ag = document.getElementById("agenda");
if(ag){
  const D = ag.dataset, compact = d => d.replace(/-/g,""), lendemain = d => { const x = new Date(d+"T12:00:00"); x.setDate(x.getDate()+1); return x.toISOString().slice(0,10); };
  const fin = D.fin || D.debut, details = `Table de jeux experts animée par ${NOM}. ${D.url}`;
  document.getElementById("ag-google").href = "https://calendar.google.com/calendar/render?" + new URLSearchParams({action:"TEMPLATE", text:D.titre, dates:compact(D.debut)+"/"+compact(lendemain(fin)), location:D.lieu||"", details}).toString();
  document.getElementById("ag-ics").addEventListener("click", ()=>{
    const e = s => String(s||"").replace(/\\/g,"\\\\").replace(/([,;])/g,"\\$1").replace(/\n/g,"\\n");
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Les Experts en Perigord//Festivals//FR","CALSCALE:GREGORIAN","BEGIN:VEVENT",
      `UID:${D.slug}@jeu-experts-perigord.fr`, "DTSTAMP:"+new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d+/,""),
      "DTSTART;VALUE=DATE:"+compact(D.debut), "DTEND;VALUE=DATE:"+compact(lendemain(fin)),
      "SUMMARY:"+e(D.titre), "LOCATION:"+e(D.lieu), "URL:"+D.url, "DESCRIPTION:"+e(details), "END:VEVENT","END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"})); a.download = (D.slug||"festival")+".ics";
    document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  });
}

/* Guides de stratégie en onglets */
document.querySelectorAll(".strat-tabs").forEach(tl=>{
  const tabs = [...tl.querySelectorAll("[role=tab]")], sec = tl.closest(".strategie");
  sec.classList.add("tabs-on");
  const show = (t, focus) => { tabs.forEach(x=>{ const on = x===t; x.setAttribute("aria-selected", on); x.tabIndex = on?0:-1; document.getElementById(x.getAttribute("aria-controls")).hidden = !on; }); if(focus) t.focus(); };
  tabs.forEach((t,i)=>{ t.addEventListener("click", ()=>show(t)); t.addEventListener("keydown", e=>{ const d = e.key==="ArrowRight"?1:e.key==="ArrowLeft"?-1:0; if(d){ e.preventDefault(); show(tabs[(i+d+tabs.length)%tabs.length], true); } }); });
  const h = location.hash.match(/^#guide-(\d+)$/); show(h && tabs[h[1]-1] ? tabs[h[1]-1] : tabs[0]);
});

/* Page d'un jeu testé : où le trouver dans la ludothèque, sur quel festival on l'apporte */
if(oth && oth.dataset.kind==="jeu"){
  const t = C.tests.find(x=>idOf(x)===oth.dataset.slug), fiche = document.querySelector(".article-fiche");
  if(t && fiche){
    const l = ludoDe(t.jeu, t.bgg), fests = aVenir().filter(f=>(f.jeux||[]).some(j=>memeNom(j.nom, t.jeu)));
    let h = "";
    if(l && (l.proprietaires||[]).length) h += `<div class="fiche-plus"><span class="k">Dans notre ludothèque</span>${chez(l)}</div>`;
    if(fests.length) h += `<div class="fiche-plus"><span class="k">On l'apporte à</span>${fests.map(f=>`<a class="tag" href="${artUrl("festival",f)}#nos-jeux">${esc(f.nom)}${f.date?` · ${esc(f.date)}`:""} →</a>`).join("")}</div>`;
    if(h) fiche.querySelector(".btn").insertAdjacentHTML("beforebegin", h);
  }
}

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
  const P = [...document.querySelectorAll(".ph-btn")].map(b=>({src:b.querySelector("img").getAttribute("src"), legende:b.dataset.leg||""}));
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
