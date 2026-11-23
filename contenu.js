---
layout: null
# Ce fichier est fabriqué automatiquement par GitHub à partir des fichiers de Pages CMS.
# Ne le modifiez pas : modifiez le contenu dans Pages CMS.
---
{% assign jeux = site.jeux | sort: "date" | reverse %}{% assign fests = site.festivals | sort: "date" | reverse %}window.CONTENU = {
"site": {{ site.data.site | jsonify }},
"piliers": {{ site.data.accueil.piliers | jsonify }},
"histoire": {{ site.data.accueil.histoire | jsonify }},
"organisateurs": {{ site.data.accueil.organisateurs | jsonify }},
"evenement": {{ site.data.evenement | jsonify }},
"membres": {{ site.data.equipe.membres | jsonify }},
"galerie": {{ site.data.galerie.photos | jsonify }},
"temoignages": {{ site.data.temoignages.liste | jsonify }},
"echanges": {{ site.data.contact.discord | jsonify }},
"contact": {{ site.data.contact.contact | jsonify }},
"bgg": {{ site.data.bgg | jsonify }},
"ludotheque": {{ site.data.ludotheque | jsonify }},
"fiches": {{ site.data.fiches | jsonify }},
"strategies": [{% assign gsl = site.strategies | sort: "title" %}{% for g in gsl %}{% assign tt = site.jeux | where: "title", g.title | first %}
  {"id": {{ g.slug | jsonify }}, "url": {{ g.url | jsonify }}, "nom": {{ g.title | jsonify }}, "resume": {{ g.resume | jsonify }}, "onglets": [{% for o in g.guides %}{{ o.titre | jsonify }}{% unless forloop.last %}, {% endunless %}{% endfor %}], "couverture": {% if g.couverture and g.couverture != "" %}{{ g.couverture | jsonify }}{% elsif tt %}{{ tt.couverture | jsonify }}{% else %}null{% endif %}, "test": {% if tt %}{{ tt.url | jsonify }}{% else %}null{% endif %}, "poids": {% if tt %}{{ tt.poids | jsonify }}{% else %}null{% endif %}}{% unless forloop.last %},{% endunless %}{% endfor %}
],
"festivals": [{% for f in fests %}
  {"id": {{ f.slug | jsonify }}, "url": {{ f.url | jsonify }}, "debut": {{ f.date | date: "%Y-%m-%d" | jsonify }}, "retour": {% if site.data.site.comptes_rendus != true %}false{% elsif f.apres.recit and f.apres.recit != "" %}true{% elsif f.apres.joueurs or f.apres.parties or f.apres.stars.size > 0 or f.apres.mentions.size > 0 %}true{% else %}false{% endif %}, "nbphotos": {% assign nph = 0 %}{% for p in f.photos %}{% if p.image and p.image != "" %}{% assign nph = nph | plus: 1 %}{% endif %}{% endfor %}{% if site.data.site.comptes_rendus %}{% for p in f.apres.galerie %}{% if p and p != "" %}{% assign nph = nph | plus: 1 %}{% endif %}{% endfor %}{% for p in f.apres.photos %}{% if p.image and p.image != "" %}{% assign nph = nph | plus: 1 %}{% endif %}{% endfor %}{% endif %}{{ nph }}, "chiffres": {{ f.apres | jsonify }}, "fin": {% if f.fin %}{{ f.fin | date: "%Y-%m-%d" | jsonify }}{% else %}null{% endif %}, "jeux": {{ f.jeux | jsonify }}, "nom": {{ f.title | jsonify }}, "date": {{ f.dates | jsonify }}, "lieu": {{ f.lieu | jsonify }}, "role": {{ f.role | jsonify }}, "texte": {{ f.resume | jsonify }}, "couverture": {{ f.couverture | jsonify }}, "photos": {{ f.photos | jsonify }}, "exemple": {{ f.exemple | jsonify }}, "article_html": {{ f.content | markdownify | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}
],
"tests": [{% for t in jeux %}
  {"id": {{ t.slug | jsonify }}, "url": {{ t.url | jsonify }}, "jeu": {{ t.title | jsonify }}, "redacteur": {{ t.redacteur | jsonify }}, {% assign gst = site.strategies | where: "title", t.title | first %}"strategie": {% if gst %}{{ gst.url | jsonify }}{% else %}false{% endif %}, "bgg": {{ t.bgg | jsonify }}, "auteurs": {{ t.auteurs | jsonify }}, "joueurs": {{ t.joueurs | jsonify }}, "duree": {{ t.duree | jsonify }}, "poids": {{ t.poids | jsonify }}, "verdict": {{ t.verdict | jsonify }}, "texte": {{ t.resume | jsonify }}, "couverture": {{ t.couverture | jsonify }}, "avis": {{ t.avis | jsonify }}, "photos": {{ t.photos | jsonify }}, "exemple": {{ t.exemple | jsonify }}, "article_html": {{ t.content | markdownify | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}
]
};
