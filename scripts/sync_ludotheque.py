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


def lire_collection(utilisateur, token):
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
            if j.get("poids") == 0:
                j["poids"] = None


def miniature(jeu):
    """Télécharge et réduit l'image de la boîte (400 px). Renvoie le chemin utilisé par le site."""
    chemin_rel = f"images/ludotheque/{jeu['id']}.jpg"
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

    jeux, lus, erreurs = {}, [], []
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
    if not lus:
        sys.exit("Erreur : aucun compte BoardGameGeek n'a pu être lu.\n" + "\n".join(erreurs))
    print(f"Ludothèque fusionnée : {len(jeux)} jeux différents.")
    if jeux:
        completer(jeux, token)

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
    if ancien.get("jeux") == liste and ancien.get("comptes") == comptes_lus:
        print("Aucun changement.")
    else:
        donnees = {"comptes": comptes_lus, "maj": time.strftime("%Y-%m-%d"), "jeux": liste}
        with open(FICHIER_DONNEES, "w", encoding="utf-8") as f:
            json.dump(donnees, f, ensure_ascii=False, indent=1)
            f.write("\n")
        print(f"Ludothèque mise à jour : {len(liste)} jeux.")
    if erreurs:
        sys.exit("Attention, certains comptes n'ont pas pu être lus :\n" + "\n".join(erreurs))


if __name__ == "__main__":
    main()
