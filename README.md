# AUTO LED BLIDA — Plateforme Web Bilingue & Back-Office Admin

Site web officiel et plateforme de réservation pour **AutoLedBlida** (Ouled Yaïch, Blida, Algérie), atelier et magasin spécialisé en optique automobile, projecteurs Bi-LED retrofit, kits xénon et ampoules LED haute performance.

---

## 🌟 Caractéristiques Clés

1. **Expérience Bilingue & RTL Totale** :
   - Switch instantané **Français ⇄ العربية** avec adaptation automatique du sens de lecture (`dir="rtl"`), de la typographie (Cairo/Tajawal) et des composants.
2. **Identité Visuelle & Animations Phares** :
   - Thème sombre luxueux avec auras néon rouge et halo xénon.
   - Logo officiel Aigle Rouge (Red Eagle).
   - **Simulation d'éclairage interactive** : bouton pour allumer/éteindre les phares Bi-LED du bolide en direct.
   - **Curseur comparatif Avant / Après** : curseur interactif permettant de comparer l'éclairage halogène jaune d'origine avec le faisceau laser Bi-LED 6000K.
3. **Boutique & Livraison 69 Wilayas** :
   - Deux boutons sous chaque produit : **"Acheter / Commander"** (ou *شراء / طلب الآن*) et **"Faire un rendez-vous"** (ou *حجز موعد للتركيب*).
   - Formulaire de commande client complet avec sélection des **69 Wilayas d'Algérie**, calcul automatique du total en DZD, mention *Paiement à la livraison* et transmission facultative sur WhatsApp.
   - Filtre dynamique par catégorie (Projecteurs Bi-LED, Ampoules LED, Kits Xénon, Accessoires).
4. **Prise de Rendez-vous en Atelier** :
   - Formulaire simple et rapide : Nom, Téléphone, Véhicule, Service souhaité, Jour préféré, Message.
   - Enregistrement immédiat dans la base de données du tableau de bord.
   - Effet confettis festif et bouton 1-clic pour **confirmer directement sur WhatsApp**.
5. **Back-Office Administrateur Sécurisé par PIN (`#admin`)** :
   - Accès protégé par code PIN (par défaut : **`1234`**, modifiable dans les paramètres).
   - **Onglet Commandes** : suivi des commandes clients avec alertes temps réel, statuts (*Nouveau / Confirmé / Expédié / Livré / Annulé*), boutons 1-clic Appel et WhatsApp, export CSV pour transporteur.
   - **Onglet Rendez-vous** : gestion des réservations d'installation à l'atelier, statuts, boutons d'action rapide, export CSV.
   - **Onglet Téléphones (Gestion Dynamique)** : modifiez vos numéros existants ou ajoutez de nouvelles lignes téléphoniques à tout moment.
   - **Onglet Produits** : ajout/modification/suppression de produits avec upload de photos, saisie de lien/nom, sélecteur de galerie atelier et prévisualisation directe.
   - **Onglet Catégories** : ajout et suppression des catégories du magasin.
   - **Onglet Contenu & Annonces** : activation et personnalisation de la bannière d'annonce / congés annuels ("عطلة سنوية"), horaires, adresse.
   - **Onglet Statistiques & Export** : volume des ventes, compteurs de commandes et de rendez-vous, sauvegarde CSV.
6. **Stockage Persistant Zéro Configuration** :
   - Toutes les données persistent sur disque dans `server/data/store.json` sans besoin de configurer une base de données externe ou un cloud.

---

## 🚀 Démarrage Rapide

### 1. Lancer le serveur complet (API + Site) :
```bash
npm run server
```
Ouvrez votre navigateur sur : **`http://localhost:5000`**

### 2. Lancer en mode développement complet :
```bash
npm run dev
```
- Client Vite : `http://localhost:3000`
- Serveur Express : `http://localhost:5000`

### 3. Accès Administrateur :
- Cliquez sur l'icône de cadenas dans le menu ou le pied de page, ou naviguez directement vers : **`http://localhost:5000/#admin`**
- Code PIN par défaut : **`1234`**

---

## 📞 Coordonnées Authentiques Intégrées
- **Service Client Principal** : `0561 14 70 39`
- **Lignes directes** : `0549 80 43 96` / `0558 36 13 65` / `0541 96 04 74`
- **Atelier** : Ouled Yaïch, Blida, Algérie
- **Réseaux** : TikTok `@auto.led.blida` (95K) | Instagram `@autoledblida`