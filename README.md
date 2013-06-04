README
======

Cette application parse un fichier de log de `slow-queries` généré par MySQL et affiche :
* un graphique permettant de visualier le nombre de requêtes longues par jour
* une liste détaillant les requêtes incriminées

Elle est basée sur [https://code.google.com/p/mysql-slow-query-log-visualizer/](https://code.google.com/p/mysql-slow-query-log-visualizer/).

Les différences par rapport à ce projet de base sont :
* la possibilité de lire un fichier sur le serveur sur lequel l'application est installée (et non uniquement depuis un fichier local)
* des corrections du parser
* la possibilité de parser plusieurs fichiers
* la coloration syntaxique et l'indentation des requêtes longues

![](img/preview.png?raw=true)

# Installation

Pour utiliser cette application sur votre serveur, il suffit de 

* télécharger les sources dans un dossier accessible par votre serveur web `git clone git://github.com/yllieth/my-slow.git /document-root/your-path`
* accéder à l'application
	* `/document-root/your-path/index.html`
	* `/document-root/your-path/index.html?remote_path=/var/log/mysql` pour pré-remplir le chemin du dossier où se trouvent les fichiers de log à analyser sur une serveur distant

# Notes de développement

**Toujours en phase de développement.**

## Technologies

* [HTML5] `Drag & Drop` pour l'upload des fichiers de log
* [HTML5] `XmlHttpRequest` pour récupérer les fichiers de log
* [HTML5] `FileAPI` pour la lecture des fichiers
* [HTML5] `svg` pour le dessin du graph
* [CSS3]  box-shadow

## Compatibilité

Cette application est testée fonctionnelle sur les navigateurs suivants :
* Chromium (Version 25.0.1364.160 Ubuntu 13.04 (25.0.1364.160-0ubuntu3))
* Chrome (Version 27.0.1453.93)

## TODO list

* Améliorer la compatibilité entre les navigateurs
* Afficher les échelles du graphique
* Trier la liste
* Tester le format du fichier donné à parser AVANT de le lire en entier
* Gestion des erreurs