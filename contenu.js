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
"festivals": [{% for f in fests %}
  {"id": {{ f.slug | jsonify }}, "nom": {{ f.title | jsonify }}, "date": {{ f.dates | jsonify }}, "lieu": {{ f.lieu | jsonify }}, "role": {{ f.role | jsonify }}, "texte": {{ f.resume | jsonify }}, "couverture": {{ f.couverture | jsonify }}, "photos": {{ f.photos | jsonify }}, "exemple": {{ f.exemple | jsonify }}, "article_html": {{ f.content | markdownify | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}
],
"tests": [{% for t in jeux %}
  {"id": {{ t.slug | jsonify }}, "jeu": {{ t.title | jsonify }}, "auteurs": {{ t.auteurs | jsonify }}, "joueurs": {{ t.joueurs | jsonify }}, "duree": {{ t.duree | jsonify }}, "poids": {{ t.poids | jsonify }}, "verdict": {{ t.verdict | jsonify }}, "texte": {{ t.resume | jsonify }}, "couverture": {{ t.couverture | jsonify }}, "avis": {{ t.avis | jsonify }}, "photos": {{ t.photos | jsonify }}, "exemple": {{ t.exemple | jsonify }}, "article_html": {{ t.content | markdownify | jsonify }}}{% unless forloop.last %},{% endunless %}{% endfor %}
]
};
