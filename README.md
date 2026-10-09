# Food Delivery App — Projet complet

Architecture monorepo pour une plateforme de livraison de nourriture avec 4 applications et un backend commun.

```
food-delivery-app/
├── backend/          ✅ Construit — API Node.js + Express + PostgreSQL (Prisma)
├── client-app/        ✅ Construit — App React Native (Expo) pour les clients
├── admin-app/         ✅ Construit — Back-office web (React) pour l'administration
├── restaurant-app/    ⏳ À construire — App pour les restaurants
└── driver-app/        ⏳ À construire — App pour les livreurs
```

## 1. Backend

### Installation
```bash
cd backend
npm install
cp .env.example .env
# Édite .env avec tes identifiants PostgreSQL, Twilio, Stripe
```

### Base de données
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Lancement
```bash
npm run dev
# Serveur disponible sur http://localhost:4000
```

### Fonctionnalités déjà codées
- Authentification par OTP (SMS via Twilio, code loggé en console en mode dev)
- Gestion des restaurants et du menu
- Création et suivi des commandes (statuts en temps réel via Socket.io)
- Gestion des livreurs (disponibilité, acceptation de courses)
- Back-office admin (approbation restaurants/livreurs, statistiques)

**Important** : le calcul des frais de livraison est simplifié (valeur fixe). L'intégration Stripe pour le paiement carte et l'intégration du portefeuille mobile local restent à brancher (clés API + webhooks).

## 2. App Client (React Native / Expo)

### Installation
```bash
cd client-app
npm install
```

### Lancement
```bash
npx expo start
```
Scanne le QR code avec l'app **Expo Go** sur ton téléphone (Android/iOS), ou lance un émulateur.

⚠️ Dans `src/api/client.js`, remplace `http://localhost:4000` par l'adresse IP locale de ta machine (ex: `http://192.168.1.10:4000`) si tu testes sur un vrai téléphone, car `localhost` ne fonctionnera pas depuis l'appareil.

### Écrans inclus
- Connexion par numéro de téléphone + vérification OTP
- Liste des restaurants avec recherche
- Détail restaurant + menu + ajout au panier
- Panier avec gestion des quantités
- Choix du mode de paiement (carte / cash / portefeuille mobile)
- Suivi de commande en temps réel (statuts mis à jour via Socket.io)

## 3. Back-office Admin (React + Vite)

### Installation
```bash
cd admin-app
npm install
```

### Lancement
```bash
npm run dev
# Disponible sur http://localhost:5173
```

### Créer le premier compte administrateur
Les nouveaux comptes ont par défaut le rôle `CLIENT`. Pour créer ton premier admin :
```bash
cd backend
node scripts/create-admin.js +213600000000
```
Connecte-toi ensuite sur le back-office avec ce numéro de téléphone (le code OTP s'affichera dans la console du backend en mode développement).

### Fonctionnalités incluses
- Connexion sécurisée par OTP (réservée au rôle ADMIN)
- Tableau de bord : nombre de commandes, revenu des commissions, restaurants/livreurs/clients actifs
- Approbation des nouveaux restaurants
- Approbation des nouveaux livreurs

### Prochaines améliorations possibles
- Graphiques d'évolution des ventes (Recharts est déjà installé)
- Liste et détail de toutes les commandes avec filtres
- Gestion fine des commissions par restaurant
- Rafraîchissement temps réel du tableau de bord via Socket.io

## Prochaines étapes

Dis-moi par laquelle continuer :
1. **App Restaurant** : réception des commandes en temps réel, gestion du menu, statistiques de vente
2. **App Livreur** : liste des courses disponibles, acceptation, navigation vers le client
3. **Intégration paiement réelle** (Stripe + portefeuille mobile local)
4. **Écran de gestion des adresses** dans l'app client (actuellement simplifié)
