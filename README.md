# 🐭 Mouse AI - Landing Page

Développée avec **Next.js 14 (App Router)**, **TypeScript** et **TailwindCSS**.  
Elle présente le projet **Mouse AI**, une simulation où des souris virtuelles explorent des labyrinthes guidées par une IA.  

---
## 🚀 Fonctionnalités

- **Présentation du projet Mouse AI** et de son objectif pédagogique  
- **Explication de l’IA** qui guide les souris dans un labyrinthe  
- **Création d’un labyrinthe personnalisé** (taille et configuration choisies par l’utilisateur)  
- **Choix du nombre de souris** à lancer dans le labyrinthe  
- **Simulation interactive** où les souris évoluent vers l’objectif  
- **Lien direct vers l’API backend FastAPI** pour tester les endpoints  
- **Design responsive** avec TailwindCSS  

---

## 📦 Installation

```bash
# Cloner le projet
git clone <repository_url>
cd mouse_ai_front

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## Structure du projet 

```bash
app/                           # App Router Next.js
  layout.tsx                   # Layout global (navbar, thème, etc.)
  page.tsx                     # Page d’accueil 

  simulation/                  # Pages liées à la simulation
    components/                # Composants spécifiques simulation

  api/                         # API Routes (Server Actions/REST)
    simulation/
      route.ts                 # POST → démarrer simulation (mocké ou réel)

  globals.css                  # Styles globaux (import Tailwind)

components/                    # Composants UI réutilisables

lib/                           # Logique utilitaire
  apiClient.ts                 # Fonctions fetch/REST mockées
  websocketClient.ts           # Gestion client WebSocket
  mocks/                       # Données mock pour dev rapide


public/                        # Images/icônes statiques

tests/                         # Tests unitaires (Jest / React Testing Library)

tailwind.config.js             # Config Tailwind
tsconfig.json                  # Config TypeScript
package.json
README.md
```