"""Synchronise la ludothèque du site avec la collection BoardGameGeek de l'association.

Lancé chaque nuit (et à la demande) par GitHub Actions : voir .github/workflows/ludotheque.yml.
- lit le nom d'utilisateur BoardGameGeek de chaque membre dans _data/equipe.yml (fiche du membre
  dans Pages CMS), plus celui de l'association s'il est renseigné dans _data/bgg.yml ;
- récupère les jeux marqués « Je possède » de chaque compte (sans les extensions), les fusionne
  sans doublon en notant à qui ils appartiennent, avec joueurs, durée, âge et poids ;
- télécharge une miniature de chaque boîte dans images/ludotheque/ ;
- écrit _data/ludotheque.json, que le site affiche sur la page Ludothèque.

La clé d'accès à l'API BoardGameGeek est lue dans la variable d'environnement BGG_TOKEN
(un secret GitHub : elle n'est jamais écrite dans le dépôt).
"""
import io, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FICHIER_REGLAGES = os.path.join(RACINE, "_data", "bgg.yml")
FICHIER_EQUIPE = os.path.join(RACINE, "_data", "equipe.yml")
FICHIER_DONNEES = os.path.join(RACINE, "_data", "ludotheque.json")
DOSSIER_IMAGES = os.path.join(RACINE, "images", "ludotheque")
DOSSIER_FESTIVALS = os.path.join(RACINE, "_festivals")
FICHIER_FICHES = os.path.join(RACINE, "_data", "fiches.json")
DOSSIER_FICHES = os.path.join(RACINE, "images", "fiches")

# Traduction des mécaniques BoardGameGeek les plus courantes (les autres restent en anglais)
MECANIQUES = {
    "Worker Placement": "Placement d'ouvriers", "Deck, Bag, and Pool Building": "Construction de deck",
    "Hand Management": "Gestion de main", "Tile Placement": "Pose de tuiles", "Area Majority / Influence": "Majorité",
    "Dice Rolling": "Lancer de dés", "Cooperative Game": "Coopératif", "Variable Player Powers": "Pouvoirs asymétriques",
    "Set Collection": "Collection", "Drafting": "Draft", "Card Drafting": "Draft de cartes", "Open Drafting": "Draft ouvert",
    "Engine Building": "Moteur de combos", "Network and Route Building": "Construction de réseau",
    "Action Points": "Points d'action", "Action Drafting": "Choix d'actions", "Auction/Bidding": "Enchères",
    "Area Movement": "Déplacement sur zones", "Grid Movement": "Déplacement sur grille", "Hexagon Grid": "Plateau hexagonal",
    "Modular Board": "Plateau modulable", "End Game Bonuses": "Bonus de fin de partie", "Income": "Revenus",
    "Loans": "Emprunts", "Market": "Marché", "Negotiation": "Négociation", "Trading": "Échanges",
    "Take That": "Interaction directe", "Player Elimination": "Élimination", "Push Your Luck": "Stop ou encore",
    "Simultaneous Action Selection": "Actions simultanées", "Programmed Movement": "Programmation",
    "Action Queue": "File d'actions", "Variable Set-up": "Mise en place variable", "Scenario / Mission / Campaign Game": "Campagne",
    "Narrative Choice / Paragraph": "Narratif", "Storytelling": "Narratif", "Semi-Cooperative Game": "Semi-coopératif",
    "Team-Based Game": "En équipes", "Solo / Solitaire Game": "Jouable en solo", "Hidden Roles": "Rôles cachés",
    "Traitor Game": "Traître", "Deduction": "Déduction", "Memory": "Mémoire", "Pattern Building": "Motifs à construire",
    "Contracts": "Contrats", "Track Movement": "Pistes de progression", "Race": "Course", "Turn Order: Progressive": "Ordre du tour variable",
    "Turn Order: Stat-Based": "Ordre du tour variable", "Card Play Conflict Resolution": "Combats aux cartes",
    "Dice Placement": "Placement de dés", "Worker Placement, Different Worker Types": "Placement d'ouvriers",
    "Rondel": "Rondelle", "Mancala": "Mancala", "Tech Trees / Tech Tracks": "Arbre technologique",
    "Resource to Move": "Ressources pour se déplacer", "Pick-up and Deliver": "Livraisons", "Measurement Movement": "Mesure",
    "Line of Sight": "Ligne de vue", "Command Cards": "Cartes d'ordres", "Events": "Événements",
    "Victory Points as a Resource": "Points de victoire comme ressource", "Multi-Use Cards": "Cartes à usages multiples",
    "Square Grid": "Grille", "Enclosure": "Enclos", "Map Addition": "Carte qui s'agrandit", "Bias": "Majorités",
}
API = "https://boardgamegeek.com/xmlapi2"   # sans « www », sinon la clé est ignorée
AGENT = "LesExpertsEnPerigord-ludotheque/1.0 (+https://jeu-experts-perigord.fr)"
_dernier_appel = [0.0]


def nettoyer(compte):
    """Accepte un nom d'utilisateur ou l'adresse d'un profil (boardgamegeek.com/user/NOM)."""
    compte = str(compte or "").strip()
    m = re.search(r"boardgamegeek\.com/(?:user|collection/user)/([^/?#\s]+)", compte)
    return urllib.parse.unquote(m.group(1)) if m else compte.strip("@ ")


def lire_comptes():
    """Liste des (propriétaire, nom d'utilisateur BGG) : chaque membre, puis l'association."""
    import yaml
    comptes = []
    try:
        equipe = yaml.safe_load(open(FICHIER_EQUIPE, encoding="utf-8")) or {}
    except FileNotFoundError:
        equipe = {}
    for m in equipe.get("membres") or []:
        u = nettoyer((m or {}).get("bgg"))
        if u:
            comptes.append(((m.get("nom") or u).strip(), u))
    try:
        reglages = yaml.safe_load(open(FICHIER_REGLAGES, encoding="utf-8")) or {}
    except FileNotFoundError:
        reglages = {}
    u = nettoyer(reglages.get("utilisateur"))
    if u and u.lower() not in {c[1].lower() for c in comptes}:
        comptes.append(("L'association", u))
    return comptes


def lire_manuels():
    """Liste des (propriétaire, nom du jeu) saisis à la main pour les membres sans collection BGG."""
    import yaml
    try:
        equipe = yaml.safe_load(open(FICHIER_EQUIPE, encoding="utf-8")) or {}
    except FileNotFoundError:
        return []
    res = []
    for m in equipe.get("membres") or []:
        for n in (m or {}).get("jeux_hors_bgg") or []:
            if str(n or "").strip() and (m.get("nom") or "").strip():
                res.append((m["nom"].strip(), str(n).strip()))
    return res


def appel(url, token, binaire=False):
    """GET avec au plus un appel toutes les 2 s, et nouvelles tentatives sur 202 / 429 / 5xx."""
    attentes = [2, 5, 10, 30, 60]
    for essai in range(len(attentes) + 1):
        pause = 2.1 - (time.time() - _dernier_appel[0])
        if pause > 0:
            time.sleep(pause)
        _dernier_appel[0] = time.time()
        entetes = {"User-Agent": AGENT}
        if token and "boardgamegeek.com" in url:
            entetes["Authorization"] = "Bearer " + token
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=entetes), timeout=60) as r:
                corps = r.read()
                if r.status == 202:          # BGG prépare l'export de la collection : on réessaie
                    raise urllib.error.HTTPError(url, 202, "en file d'attente", r.headers, None)
                return corps if binaire else corps.decode("utf-8")
        except urllib.error.HTTPError as e:
            if e.code == 401:
                sys.exit("Erreur : BoardGameGeek refuse la clé d'accès (401). Vérifiez le secret BGG_TOKEN.")
            if e.code in (202, 429, 500, 502, 503, 504) and essai < len(attentes):
                print(f"  BoardGameGeek répond {e.code}, nouvel essai dans {attentes[essai]} s…")
                time.sleep(attentes[essai])
                continue
            raise
    raise RuntimeError("BoardGameGeek ne répond pas, réessayez plus tard.")


def entier(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None


def nombre(v):
    try:
        return round(float(v), 2)
    except (TypeError, ValueError):
        return None


def lire_collection(utilisateur, token, extensions=False):
    if extensions:
        params = urllib.parse.urlencode({"username": utilisateur, "own": 1, "subtype": "boardgameexpansion"})
    else:
        params = urllib.parse.urlencode({"username": utilisateur, "own": 1, "stats": 1,
                                         "excludesubtype": "boardgameexpansion"})
    racine = ET.fromstring(appel(f"{API}/collection?{params}", token))
    erreur = racine.find(".//error/message")
    if erreur is not None or racine.tag == "errors":
        raise ValueError(f"{erreur.text if erreur is not None else 'réponse inattendue'}")
    jeux = {}
    for it in racine.findall("item"):
        id_ = it.get("objectid")
        st = it.find("stats")
        jeux[id_] = {
            "id": id_,
            "nom": (it.findtext("name") or "").strip(),
            "annee": entier(it.findtext("yearpublished")),
            "image_bgg": (it.findtext("image") or it.findtext("thumbnail") or "").strip(),
            "joueurs_min": entier(st.get("minplayers")) if st is not None else None,
            "joueurs_max": entier(st.get("maxplayers")) if st is not None else None,
            "duree_min": entier(st.get("minplaytime")) if st is not None else None,
            "duree_max": entier(st.get("maxplaytime")) if st is not None else None,
        }
    return jeux


def completer(jeux, token):
    """Ajoute le poids, l'âge et la note moyenne depuis les fiches des jeux (par lots de 20)."""
    ids = list(jeux)
    for i in range(0, len(ids), 20):
        lot = ",".join(ids[i:i + 20])
        racine = ET.fromstring(appel(f"{API}/thing?id={lot}&stats=1", token))
        for it in racine.findall("item"):
            j = jeux.get(it.get("id"))
            if not j:
                continue
            val = lambda chemin: (it.find(chemin).get("value") if it.find(chemin) is not None else None)
            j["poids"] = nombre(val("statistics/ratings/averageweight"))
            j["age"] = entier(val("minage"))
            j["note_bgg"] = nombre(val("statistics/ratings/average"))
            for cle, chemin in (("joueurs_min", "minplayers"), ("joueurs_max", "maxplayers"),
                                ("duree_min", "minplaytime"), ("duree_max", "maxplaytime")):
                if not j.get(cle):
                    j[cle] = entier(val(chemin))
            if not j["image_bgg"]:
                j["image_bgg"] = (it.findtext("image") or it.findtext("thumbnail") or "").strip()
            if not j.get("nom"):   # jeu saisi à la main : nom et année officiels de BGG
                prim = it.find("name[@type='primary']")
                j["nom"] = prim.get("value") if prim is not None else j.get("nom_saisi", "")
                j["annee"] = entier(val("yearpublished"))
            j.pop("nom_saisi", None)
            if j.get("poids") == 0:
                j["poids"] = None


def jeux_de_base(extensions, token):
    """Pour chaque extension, les numéros BGG des jeux qu'elle complète (par lots de 20)."""
    ids, bases = list(extensions), {}
    for i in range(0, len(ids), 20):
        racine = ET.fromstring(appel(f"{API}/thing?id={','.join(ids[i:i + 20])}", token))
        for it in racine.findall("item"):
            bases[it.get("id")] = [l.get("id") for l in it.findall("link")
                                   if l.get("type") == "boardgameexpansion" and l.get("inbound") == "true"]
    return bases


def lire_festivals():
    """Liste des (festival, nom du jeu, numéro BGG facultatif) des jeux apportés en festival."""
    import yaml
    res = []
    if not os.path.isdir(DOSSIER_FESTIVALS):
        return res
    for f in sorted(os.listdir(DOSSIER_FESTIVALS)):
        if not f.endswith(".md"):
            continue
        texte = open(os.path.join(DOSSIER_FESTIVALS, f), encoding="utf-8").read()
        m = re.match(r"^---\s*\n(.*?)\n---", texte, re.S)
        fm = yaml.safe_load(m.group(1)) if m else {}
        for j in (fm or {}).get("jeux") or []:
            if (j or {}).get("nom"):
                res.append((f[:-3], str(j["nom"]).strip(), str(j.get("bgg") or "").strip()))
    return res


def norm_nom(n):
    import unicodedata
    n = unicodedata.normalize("NFD", str(n)).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", n).strip()


def meme_nom(a, b):
    A, B = norm_nom(a), norm_nom(b)
    ca, cb = norm_nom(re.split(r"[:–—(]", str(a))[0]), norm_nom(re.split(r"[:–—(]", str(b))[0])
    return bool(A) and (A == B or A == cb or ca == B)


def chercher_bgg(nom, token):
    """Numéro BGG d'un jeu à partir de son nom (recherche exacte, puis approchée)."""
    import unicodedata
    requete = unicodedata.normalize("NFD", str(nom)).encode("ascii", "ignore").decode()   # « Créatures » → « Creatures »
    for exact in (1, 0):
        q = urllib.parse.urlencode({"query": requete, "type": "boardgame", "exact": exact})
        racine = ET.fromstring(appel(f"{API}/search?{q}", token))
        # jamais une extension : « Wondrous Creatures » ne doit pas devenir « Wondrous Creatures: Winterfall »
        items = [it for it in racine.findall("item") if it.get("type", "boardgame") == "boardgame"]
        noms = lambda it: [n.get("value") for n in it.findall("name")]
        pile = [it for it in items if any(norm_nom(nom) == norm_nom(n) for n in noms(it))]
        bons = pile or [it for it in items if any(meme_nom(nom, n) for n in noms(it))]
        choix = bons or (items if exact else [])
        if choix:
            # le plus récent en cas d'homonymes (rééditions)
            annee = lambda it: entier(it.find("yearpublished").get("value")) if it.find("yearpublished") is not None else 0
            choix.sort(key=lambda it: -(annee(it) or 0))
            return choix[0].get("id")
    return None


def fiches_festivals(jeux_ludo, token):
    """Infos de chaque jeu apporté en festival, pour les fiches imprimables (_data/fiches.json)."""
    entrees = lire_festivals()
    if not entrees:
        return
    try:
        ancien = json.load(open(FICHIER_FICHES, encoding="utf-8"))
    except (FileNotFoundError, ValueError):
        ancien = {"jeux": {}, "festivals": {}}
    ids, festivals = {}, {}
    for fest, nom, bgg in entrees:
        id_ = bgg or next((j["id"] for j in jeux_ludo if meme_nom(j["nom"], nom)), None)
        if not id_:   # déjà trouvé lors d'une synchronisation précédente
            id_ = (ancien.get("festivals") or {}).get(fest, {}).get(nom)
        if not id_:
            try:
                id_ = chercher_bgg(nom, token)
            except Exception as e:
                print(f"  Recherche BGG impossible pour {nom} : {e}")
            print(f"  {nom} : trouvé sur BGG sous le n° {id_}" if id_ else f"  {nom} : introuvable sur BGG (ajoutez son numéro BGG dans Pages CMS)")
        if id_:
            festivals.setdefault(fest, {})[nom] = id_
            ids[id_] = nom
    infos = {}
    liste = list(ids)
    for i in range(0, len(liste), 20):
        racine = ET.fromstring(appel(f"{API}/thing?id={','.join(liste[i:i + 20])}&stats=1", token))
        for it in racine.findall("item"):
            v = lambda chemin: (it.find(chemin).get("value") if it.find(chemin) is not None else None)
            nom_bgg = next((n.get("value") for n in it.findall("name") if n.get("type") == "primary"), "")
            meca = [l.get("value") for l in it.findall("link") if l.get("type") == "boardgamemechanic"]
            meca_fr = []
            for m in meca:
                t = MECANIQUES.get(m)
                if t and t not in meca_fr:
                    meca_fr.append(t)
            infos[it.get("id")] = {
                "id": it.get("id"), "nom_bgg": nom_bgg, "annee": entier(v("yearpublished")),
                "joueurs_min": entier(v("minplayers")), "joueurs_max": entier(v("maxplayers")),
                "duree_min": entier(v("minplaytime")), "duree_max": entier(v("maxplaytime")),
                "age": entier(v("minage")), "poids": nombre(v("statistics/ratings/averageweight")) or None,
                "note_bgg": nombre(v("statistics/ratings/average")),
                "mecaniques": meca_fr[:5],
                "auteurs": [l.get("value") for l in it.findall("link") if l.get("type") == "boardgamedesigner"][:3],
                "editeur": next((l.get("value") for l in it.findall("link") if l.get("type") == "boardgamepublisher"), None),
                "image_bgg": (it.findtext("image") or it.findtext("thumbnail") or "").strip(),
                "url_bgg": f"https://boardgamegeek.com/boardgame/{it.get('id')}",
            }
    os.makedirs(DOSSIER_FICHES, exist_ok=True)
    for id_, f in infos.items():
        local = next((j.get("image") for j in jeux_ludo if j["id"] == id_ and j.get("image")), "")
        if not local:
            chemin_rel = f"images/fiches/{id_}.jpg"
            if not os.path.exists(os.path.join(RACINE, chemin_rel)) and f["image_bgg"]:
                miniature({"id": id_, "nom": f["nom_bgg"], "image_bgg": f["image_bgg"]}, chemin_rel)
            local = chemin_rel if os.path.exists(os.path.join(RACINE, chemin_rel)) else ""
        f["image"] = local
        f.pop("image_bgg", None)
    donnees = {"festivals": festivals, "jeux": infos}
    if donnees != ancien:
        with open(FICHIER_FICHES, "w", encoding="utf-8") as fh:
            json.dump(donnees, fh, ensure_ascii=False, indent=1)
            fh.write("\n")
        print(f"Fiches de festival : {len(infos)} jeux.")


def miniature(jeu, chemin_rel=None):
    """Télécharge et réduit l'image de la boîte (400 px). Renvoie le chemin utilisé par le site."""
    chemin_rel = chemin_rel or f"images/ludotheque/{jeu['id']}.jpg"
    chemin = os.path.join(RACINE, chemin_rel)
    if os.path.exists(chemin):
        return chemin_rel
    if not jeu["image_bgg"]:
        return ""
    try:
        donnees = appel(jeu["image_bgg"], None, binaire=True)
    except Exception as e:  # une image manquante ne doit pas bloquer la synchronisation
        print(f"  Miniature indisponible pour {jeu['nom']} : {e}")
        return ""
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(donnees)).convert("RGB")
        img.thumbnail((400, 400))
        img.save(chemin, "JPEG", quality=82, optimize=True, progressive=True)
    except ImportError:
        open(chemin, "wb").write(donnees)
    return chemin_rel


def main():
    comptes = lire_comptes()
    if not comptes:
        print("Aucun compte BoardGameGeek renseigné (fiches de l'équipe ou réglage de l'association) : rien à synchroniser.")
        return
    token = os.environ.get("BGG_TOKEN", "").strip()
    if not token:
        print("La clé BoardGameGeek (secret BGG_TOKEN) n'est pas encore enregistrée : synchronisation reportée.")
        return

    jeux, lus, erreurs, extensions = {}, [], [], {}
    for proprietaire, utilisateur in comptes:
        print(f"Collection BoardGameGeek de {proprietaire} (« {utilisateur} »)…")
        try:
            coll = lire_collection(utilisateur, token)
        except ValueError as e:
            print(f"  Compte ignoré : {e}")
            erreurs.append(f"{proprietaire} (« {utilisateur} ») : {e}")
            continue
        print(f"  {len(coll)} jeux possédés (extensions exclues).")
        lus.append(utilisateur)
        for id_, j in coll.items():
            if id_ not in jeux:
                j["proprietaires"] = []
                jeux[id_] = j
            if proprietaire not in jeux[id_]["proprietaires"]:
                jeux[id_]["proprietaires"].append(proprietaire)
        try:
            ext = lire_collection(utilisateur, token, extensions=True)
        except ValueError as e:
            print(f"  Extensions illisibles : {e}")
            ext = {}
        print(f"  {len(ext)} extensions possédées.")
        for id_, x in ext.items():
            e = extensions.setdefault(id_, {"id": id_, "nom": x["nom"], "proprietaires": []})
            if proprietaire not in e["proprietaires"]:
                e["proprietaires"].append(proprietaire)
    if not lus:
        sys.exit("Erreur : aucun compte BoardGameGeek n'a pu être lu.\n" + "\n".join(erreurs))

    # Jeux saisis à la main (membres sans collection BGG) : retrouvés par leur nom, une fois pour toutes
    ancien_cache = {}
    if os.path.exists(FICHIER_DONNEES):
        try:
            ancien_cache = json.load(open(FICHIER_DONNEES, encoding="utf-8")).get("manuels") or {}
        except ValueError:
            pass
    manuels, introuvables = {}, []
    for proprietaire, nom in lire_manuels():
        cle = norm_nom(nom)
        id_ = ancien_cache.get(cle)
        if not id_:
            try:
                id_ = chercher_bgg(nom, token)
            except Exception as e:
                print(f"  Recherche impossible pour « {nom} » : {e}")
                id_ = None
        if not id_:
            introuvables.append(f"{nom} ({proprietaire})")
            continue
        manuels[cle] = id_
        if id_ not in jeux:
            jeux[id_] = {"id": id_, "nom": "", "nom_saisi": nom, "annee": None, "image_bgg": "", "proprietaires": [],
                         "joueurs_min": None, "joueurs_max": None, "duree_min": None, "duree_max": None}
        if proprietaire not in jeux[id_]["proprietaires"]:
            jeux[id_]["proprietaires"].append(proprietaire)
    if manuels or introuvables:
        print(f"Jeux saisis à la main : {len(manuels)} retrouvés sur BGG" + (f", introuvables : {', '.join(introuvables)}" if introuvables else "."))
    print(f"Ludothèque fusionnée : {len(jeux)} jeux différents.")
    if jeux:
        completer(jeux, token)
    for j in jeux.values():   # jeu saisi à la main que BGG n'a pas renvoyé : on garde le nom tapé
        if not j.get("nom"):
            j["nom"] = j.get("nom_saisi", "")
        j.pop("nom_saisi", None)

    # Rattacher chaque extension à son jeu de base (s'il est dans la ludothèque)
    for id_ in [i for i in extensions if i in jeux]:   # extension autonome déjà comptée comme jeu
        extensions.pop(id_)
    seules = []
    if extensions:
        bases = jeux_de_base(extensions, token)
        for id_, e in sorted(extensions.items(), key=lambda kv: kv[1]["nom"].lower()):
            e["url_bgg"] = f"https://boardgamegeek.com/boardgame/{id_}"
            cible = next((b for b in bases.get(id_, []) if b in jeux), None)
            if cible:
                jeux[cible].setdefault("extensions", []).append(e)
            else:
                seules.append(e)
        print(f"Extensions : {len(extensions) - len(seules)} rattachées à leur jeu, {len(seules)} sans le jeu de base.")

    os.makedirs(DOSSIER_IMAGES, exist_ok=True)
    liste = []
    for j in sorted(jeux.values(), key=lambda x: x["nom"].lower()):
        j["image"] = miniature(j)
        j["url_bgg"] = f"https://boardgamegeek.com/boardgame/{j['id']}"
        j.pop("image_bgg", None)
        liste.append(j)

    # Un compte en erreur (nom mal saisi, BGG indisponible) ne doit pas vider sa part de la ludothèque :
    # dans ce cas on garde les miniatures existantes et on ne supprime rien.
    if not erreurs:
        gardees = {os.path.basename(j["image"]) for j in liste if j["image"]}
        for f in os.listdir(DOSSIER_IMAGES):
            if f.endswith(".jpg") and f not in gardees:
                os.remove(os.path.join(DOSSIER_IMAGES, f))

    ancien = {}
    if os.path.exists(FICHIER_DONNEES):
        try:
            ancien = json.load(open(FICHIER_DONNEES, encoding="utf-8"))
        except ValueError:
            ancien = {}
    if erreurs and ancien.get("jeux"):
        # Garder les jeux des comptes illisibles tels qu'ils étaient
        illisibles = {e.split(" (")[0] for e in erreurs}
        presents = {j["id"] for j in liste}
        for j in ancien["jeux"]:
            garde = [p for p in j.get("proprietaires", []) if p in illisibles]
            if not garde:
                continue
            if j["id"] in presents:
                cible = next(x for x in liste if x["id"] == j["id"])
                cible["proprietaires"] += [p for p in garde if p not in cible["proprietaires"]]
            else:
                j = dict(j, proprietaires=garde)
                liste.append(j)
        liste.sort(key=lambda x: x["nom"].lower())

    comptes_lus = [u for _, u in comptes]
    if erreurs and ancien.get("extensions_seules"):
        seules += [e for e in ancien["extensions_seules"]
                   if any(p in {x.split(" (")[0] for x in erreurs} for p in e.get("proprietaires", []))
                   and e["id"] not in {x["id"] for x in seules}]
    if ancien.get("jeux") == liste and ancien.get("comptes") == comptes_lus and ancien.get("extensions_seules", []) == seules and (ancien.get("manuels") or {}) == manuels:
        print("Aucun changement.")
    else:
        donnees = {"comptes": comptes_lus, "maj": time.strftime("%Y-%m-%d"), "jeux": liste, "extensions_seules": seules, "manuels": manuels}
        with open(FICHIER_DONNEES, "w", encoding="utf-8") as f:
            json.dump(donnees, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"Ludothèque mise à jour : {len(liste)} jeux.")
    try:
        fiches_festivals(liste, token)
    except Exception as e:  # les fiches ne doivent jamais bloquer la ludothèque
        print(f"Fiches de festival non mises à jour : {e}")
    if erreurs:
        sys.exit("Attention, certains comptes n'ont pas pu être lus :\n" + "\n".join(erreurs))


if __name__ == "__main__":
    main()
