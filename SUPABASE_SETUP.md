# Configuration Supabase pour Mouse Labyrinth

Ce guide explique comment configurer Supabase pour stocker et récupérer les labyrinthes et les règles de simulation.

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Choisissez votre organisation et donnez un nom à votre projet
5. Créez un mot de passe sécurisé pour la base de données
6. Choisissez une région proche de vous
7. Cliquez sur "Create new project"

## 2. Configurer les variables d'environnement

1. Dans votre projet Supabase, allez dans Settings > API
2. Copiez l'URL du projet et la clé publique (anon key)
3. Créez un fichier `.env.local` à la racine de votre projet Next.js :

```env
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-clé-publique
```

## 3. Créer les tables dans Supabase

1. Dans votre projet Supabase, allez dans l'onglet "SQL Editor"
2. Cliquez sur "New query"
3. Copiez et collez le contenu du fichier `supabase-schema.sql`
4. Cliquez sur "Run" pour exécuter le script

Le script va créer :
- Table `labyrinths` : pour stocker les labyrinthes
- Table `simulation_rules` : pour stocker les règles de simulation
- Table `simulations` : pour stocker les simulations
- Table `mice` : pour stocker les souris
- Index pour améliorer les performances
- Triggers pour mettre à jour automatiquement les timestamps
- Politiques RLS (Row Level Security) pour l'accès public

## 4. Vérifier la configuration

1. Redémarrez votre serveur de développement Next.js
2. Allez sur `/management` dans votre application
3. Vous devriez voir les labyrinthes et règles chargés depuis Supabase

## 5. Fonctionnalités disponibles

### Labyrinthes
- **Créer** : Nouveau labyrinthe avec éditeur visuel
- **Lire** : Voir tous les labyrinthes disponibles
- **Modifier** : Éditer un labyrinthe existant
- **Supprimer** : Supprimer un labyrinthe

### Règles de simulation
- **Créer** : Nouvelles règles personnalisées
- **Lire** : Voir toutes les règles disponibles
- **Modifier** : Éditer des règles existantes
- **Supprimer** : Supprimer des règles

### API Endpoints

#### Labyrinthes
- `GET /api/labyrinths` - Récupérer tous les labyrinthes
- `GET /api/labyrinths/[id]` - Récupérer un labyrinthe spécifique
- `POST /api/labyrinths` - Créer un nouveau labyrinthe
- `PUT /api/labyrinths/[id]` - Mettre à jour un labyrinthe
- `DELETE /api/labyrinths/[id]` - Supprimer un labyrinthe

#### Règles
- `GET /api/rules` - Récupérer toutes les règles
- `GET /api/rules/[id]` - Récupérer une règle spécifique
- `POST /api/rules` - Créer une nouvelle règle
- `PUT /api/rules/[id]` - Mettre à jour une règle
- `DELETE /api/rules/[id]` - Supprimer une règle

## 6. Mode de fonctionnement

L'application fonctionne en mode hybride :

- **Avec Supabase configuré** : Les données sont stockées et récupérées depuis Supabase
- **Sans Supabase** : L'application utilise les données mockées locales

Pour désactiver Supabase temporairement, commentez ou supprimez les variables d'environnement dans `.env.local`.

## 7. Structure des données

### Labyrinthe
```typescript
{
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  grid: CellType[][];
  startPositions: Position[];
  cheesePositions: Position[];
  createdAt: string;
  updatedAt: string;
}
```

### Règles de simulation
```typescript
{
  id: string;
  name: string;
  description: string;
  turnDuration: number;
  energyConsumption: number;
  happinessDecay: number;
  isolationPenalty: number;
  cheeseBonus: number;
  proximityBonus: number;
  maxEnergy: number;
  maxHappiness: number;
  winConditions: WinCondition[];
}
```

## 8. Sécurité

Les politiques RLS (Row Level Security) sont configurées pour permettre :
- Lecture publique de toutes les données
- Écriture publique (création, modification, suppression)

Pour un environnement de production, vous devriez :
1. Implémenter l'authentification utilisateur
2. Configurer des politiques RLS plus restrictives
3. Utiliser des rôles et permissions appropriés

## 9. Dépannage

### Problèmes courants

1. **Erreur de connexion** : Vérifiez que les variables d'environnement sont correctement définies
2. **Tables non trouvées** : Assurez-vous d'avoir exécuté le script SQL
3. **Permissions refusées** : Vérifiez que les politiques RLS sont activées

### Logs

Les erreurs sont loggées dans la console du navigateur et du serveur. Activez les logs détaillés en mode développement.
