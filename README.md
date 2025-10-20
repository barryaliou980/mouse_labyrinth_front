# Souris IA - Simulation de Labyrinthe

Un système de simulation de souris guidées par intelligence artificielle dans des labyrinthes, développé pour l'Agence Spatiale Canadienne dans le cadre du projet SCS INF756.

## 🎯 Objectif

Créer une preuve de concept (prototype fonctionnel) capable de :
- Simuler plusieurs souris
- Chacune guidée par une intelligence artificielle distincte
- Évoluant dans des labyrinthes différents
- Selon des règles de simulation variables

## 🏗️ Architecture du Système

Le système est réparti avec plusieurs composants interconnectés :

### 1. Client (Next.js)
- Interface pour configurer et visualiser la simulation
- Fonctionne sur Windows 11 (obligatoire)
- Version mobile Android acceptée

### 2. Serveur de Labyrinthes
- Contient plusieurs labyrinthes (au moins 2, idéalement 3)
- Fournit au client la liste des labyrinthes disponibles
- Stockage persistant dans Supabase (PostgreSQL)

### 3. Intelligences Comportementales
- Modules externes contrôlant les souris
- Communication via API REST avec serveur Python
- Au moins 2 intelligences distinctes (aléatoire, directionnelle, etc.)

### 4. Serveur de Règles
- Définit comment la simulation progresse
- Fréquence des tours, consommation d'énergie, effets psychologiques
- Au moins 2 ensembles de règles différents

### 5. Simulation Principale
- Cœur du système
- Maintient l'état des souris, positions, fromages
- Interagit avec les autres composants
- Stocke les résultats dans Supabase

## 🛠️ Technologies Utilisées

- **Frontend/Backend**: Next.js 14+ avec App Router
- **Langage**: TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Communication**: API Routes + WebSocket
- **IA**: Serveur Python externe
- **Outils**: ESLint + Prettier

## 📁 Structure du Projet

```
/
├── app/
│   ├── page.tsx                   → Page d'accueil
│   ├── simulation/
│   │   ├── page.tsx               → Interface de simulation
│   │   └── components/
│   │       ├── MazeGrid.tsx       → Affichage du labyrinthe
│   │       ├── Mouse.tsx          → Représentation d'une souris
│   │       └── SimulationPanel.tsx → Contrôles de simulation
│   └── api/
│       ├── labyrinths/            → API des labyrinthes
│       ├── simulation/            → API de simulation
│       └── ia/                    → Proxy vers serveur Python IA
├── lib/
│   ├── types.ts                   → Définitions TypeScript
│   ├── rules.ts                   → Règles de simulation
│   ├── supabaseClient.ts          → Client Supabase
│   ├── simulationEngine.ts        → Moteur de simulation
│   └── websocket.ts               → Gestion WebSocket
└── public/
    └── images/                    → Images (souris, fromage)
```

## 🚀 Installation et Configuration

### 1. Prérequis
- Node.js 18+
- Compte Supabase
- Serveur Python IA (optionnel pour les tests)

### 2. Installation
```bash
# Cloner le projet
git clone <repository-url>
cd mouse_labyrinth_front

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase
```

### 3. Configuration Supabase
```sql
-- Créer les tables nécessaires
CREATE TABLE labyrinths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  grid_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  labyrinth_id UUID REFERENCES labyrinths(id),
  rules_id TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'idle',
  results JSONB
);

CREATE TABLE mice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID REFERENCES simulations(id),
  name TEXT NOT NULL,
  intelligence_type TEXT NOT NULL,
  initial_position JSONB NOT NULL,
  final_position JSONB,
  health INTEGER DEFAULT 100,
  happiness INTEGER DEFAULT 100,
  energy INTEGER DEFAULT 100,
  cheese_found INTEGER DEFAULT 0,
  moves INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT true
);
```

### 4. Démarrage
```bash
# Mode développement
npm run dev

# Build de production
npm run build
npm start
```

## 🎮 Utilisation

### 1. Configuration d'une Simulation
1. Sélectionner un labyrinthe
2. Ajouter 1 à 3 souris
3. Choisir le type d'IA pour chaque souris
4. Sélectionner un ensemble de règles
5. Lancer la simulation

### 2. Types d'Intelligence
- **Aléatoire**: Mouvements aléatoires
- **Directionnelle**: Se dirige vers le fromage
- **Intelligente**: Algorithme de recherche de chemin
- **Sociale**: Évite l'isolement

### 3. Règles de Simulation
- **Classique**: Règles équilibrées
- **Survie**: Consommation d'énergie élevée
- **Social**: Mode coopératif avec bonus de proximité
- **Vitesse**: Tours courts et rapides

## 🔌 API Endpoints

### Labyrinthes
- `GET /api/labyrinths` - Liste des labyrinthes
- `GET /api/labyrinths/[id]` - Détails d'un labyrinthe

### Simulation
- `POST /api/simulation/start` - Démarrer une simulation
- `GET /api/simulation/status?id=[id]` - Statut d'une simulation
- `GET /api/simulation/results?id=[id]` - Résultats d'une simulation

### IA
- `POST /api/ia/move` - Proxy vers serveur Python IA
- `GET /api/ia/move` - Vérifier la disponibilité du serveur IA

## 🤖 Serveur Python IA

Le système communique avec un serveur Python externe pour les décisions d'IA :

### Format de Requête
```json
{
  "mouseId": "uuid",
  "position": {"x": 5, "y": 3},
  "environment": {
    "grid": [["wall", "path", ...], ...],
    "width": 10,
    "height": 10,
    "cheesePositions": [{"x": 8, "y": 1}],
    "otherMice": [...],
    "walls": [...],
    "paths": [...]
  },
  "mouseState": {
    "health": 80,
    "happiness": 70,
    "energy": 90,
    "cheeseFound": 1
  },
  "availableMoves": ["north", "south", "east", "west"]
}
```

### Format de Réponse
```json
{
  "mouseId": "uuid",
  "move": "north",
  "reasoning": "Se dirige vers le fromage le plus proche"
}
```

## 📊 Base de Données

### Tables Principales
- **labyrinths**: Stockage des labyrinthes
- **simulations**: Historique des simulations
- **mice**: Données des souris par simulation

### Données Stockées
- Positions et mouvements
- États de santé, bonheur, énergie
- Fromages trouvés
- Résultats et statistiques

## 🔄 WebSocket

Communication temps réel pour :
- Mises à jour des positions des souris
- Événements (fromage trouvé, souris morte)
- Progression de la simulation
- Logs en temps réel

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Tests E2E
npm run test:e2e
```

## 📈 Performance

- Simulation jusqu'à 3 souris simultanément
- Mises à jour temps réel via WebSocket
- Persistance des données dans Supabase
- Interface responsive (desktop + mobile)

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm install -g vercel
vercel --prod
```

### Docker
```bash
docker build -t mouse-labyrinth .
docker run -p 3000:3000 mouse-labyrinth
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 Licence

Ce projet est développé dans le cadre du cours INF756 - Systèmes Client-Serveur de l'Université de Sherbrooke.

## 👥 Équipe

- Développé pour l'Agence Spatiale Canadienne
- Projet SCS INF756
- Université de Sherbrooke

## 📞 Support

Pour toute question ou problème :
- Créer une issue sur GitHub
- Contacter l'équipe de développement
- Consulter la documentation Supabase

---

**Note**: Ce projet est une preuve de concept développée dans un cadre académique. Pour une utilisation en production, des améliorations supplémentaires seraient nécessaires.