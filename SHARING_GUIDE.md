# Guide de Partage de Simulations

Ce guide explique comment partager une simulation avec d'autres observateurs.

## 📋 Vue d'ensemble

Le système de partage permet de créer un lien unique pour chaque simulation, permettant à d'autres personnes de visualiser la simulation en mode **observateur** (lecture seule).

## 🚀 Comment partager une simulation

### 1. Démarrer une simulation

Avant de pouvoir partager une simulation, vous devez d'abord en démarrer une :

1. Allez sur la page de simulation (`/simulation`)
2. Sélectionnez un labyrinthe
3. Configurez vos souris
4. Démarrez la simulation

### 2. Créer un lien de partage

Une fois la simulation démarrée :

1. Cliquez sur le bouton **"Partager"** dans le header de la page
2. Une modal s'ouvre avec le lien de partage
3. Cliquez sur **"Copier"** pour copier le lien dans le presse-papier
4. Partagez ce lien avec les personnes que vous souhaitez inviter

### 3. Accéder à une simulation partagée

Les observateurs peuvent :

1. Ouvrir le lien de partage dans leur navigateur
2. Visualiser la simulation en temps réel
3. Voir les statistiques des souris
4. Consulter les résultats si la simulation est terminée

**Note :** Les observateurs ne peuvent pas contrôler la simulation (démarrer, arrêter, mettre en pause).

## 🔧 Configuration technique

### Base de données

Le système utilise une table `shared_simulations` dans Supabase pour stocker les informations de partage :

- `share_token` : Token unique pour le partage
- `simulation_id` : ID de la simulation partagée
- `expires_at` : Date d'expiration (optionnel, 30 jours par défaut)
- `view_count` : Nombre de vues
- `is_active` : Statut actif/inactif

### Endpoints API

- `POST /api/simulation/share` : Créer un lien de partage
- `GET /api/simulation/view/[token]` : Récupérer une simulation partagée
- `DELETE /api/simulation/share?token=...` : Désactiver un partage

### Structure des URLs

Les liens de partage suivent ce format :
```
https://votre-domaine.com/simulation/view/[token]
```

## 📝 Exemple d'utilisation

```typescript
// Créer un partage
const response = await fetch('/api/simulation/share', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    simulationId: 'sim-123',
    expiresInDays: 30 // Optionnel
  })
});

const { shareUrl } = await response.json();
// shareUrl: "https://votre-domaine.com/simulation/view/share-1234567890-abc123"
```

## 🔒 Sécurité

- Les liens de partage sont **uniques** et **non devinables**
- Les partages peuvent avoir une **date d'expiration**
- Les partages peuvent être **désactivés** à tout moment
- Les observateurs ont un accès **lecture seule**

## ⚠️ Limitations

1. **Simulations non sauvegardées** : Seules les simulations sauvegardées dans Supabase peuvent être partagées
2. **Mode observateur** : Les observateurs ne peuvent pas contrôler la simulation
3. **Expiration** : Les liens expirent après 30 jours par défaut (configurable)

## 🛠️ Dépannage

### Le lien de partage ne fonctionne pas

1. Vérifiez que la simulation existe toujours dans la base de données
2. Vérifiez que le partage n'a pas expiré
3. Vérifiez que le partage est toujours actif

### Erreur "Simulation not found"

- La simulation a peut-être été supprimée
- Le token de partage est peut-être invalide
- Vérifiez que Supabase est correctement configuré

## 📚 Ressources

- [Documentation Supabase](https://supabase.com/docs)
- [Schéma de base de données](./supabase-schema.sql)

