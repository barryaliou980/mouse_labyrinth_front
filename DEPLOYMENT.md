# Guide de Déploiement - Mouse Labyrinth

Ce guide explique comment déployer l'application Mouse Labyrinth avec des variables d'environnement.

## 🚀 Configuration Rapide

### 1. Variables d'Environnement Frontend

Créez un fichier `.env.local` dans le dossier frontend :

```bash
# URL du serveur Python API
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
```

### 2. Variables d'Environnement Backend

Créez un fichier `.env` dans le dossier backend :

```bash
# Configuration du serveur
HOST=0.0.0.0
PORT=8000
DEBUG=true
CORS_ORIGINS=http://localhost:3000
```

## 🌍 Déploiement par Environnement

### Développement Local

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_PYTHON_API_URL=http://localhost:8000
NODE_ENV=development
```

**Backend (.env):**
```bash
HOST=0.0.0.0
PORT=8000
DEBUG=true
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Staging

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_PYTHON_API_URL=https://api-staging.votre-domaine.com
NODE_ENV=production
```

**Backend (.env):**
```bash
HOST=0.0.0.0
PORT=8000
DEBUG=false
CORS_ORIGINS=https://staging.votre-domaine.com
```

### Production

**Frontend (.env.local):**
```bash
NEXT_PUBLIC_PYTHON_API_URL=https://api.votre-domaine.com
NODE_ENV=production
```

**Backend (.env):**
```bash
HOST=0.0.0.0
PORT=8000
DEBUG=false
CORS_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

## 🐳 Docker

### Docker Compose

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  frontend:
    build: ./mouse_labyrinth_front
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_PYTHON_API_URL=http://python-api:8000
    depends_on:
      - python-api

  python-api:
    build: ./Mouse_AI_API
    ports:
      - "8000:8000"
    environment:
      - HOST=0.0.0.0
      - PORT=8000
      - DEBUG=false
      - CORS_ORIGINS=http://frontend:3000
```

### Docker individuel

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_PYTHON_API_URL=http://python-api:8000
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Backend Dockerfile:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV HOST=0.0.0.0
ENV PORT=8000
ENV DEBUG=false
EXPOSE 8000
CMD ["python", "start_server.py"]
```

## ☁️ Déploiement Cloud

### Vercel (Frontend)

1. Connectez votre repository GitHub
2. Ajoutez les variables d'environnement dans Vercel Dashboard :
   - `NEXT_PUBLIC_PYTHON_API_URL` = `https://votre-api.herokuapp.com`

### Heroku (Backend)

1. Créez une nouvelle app Heroku
2. Ajoutez les variables d'environnement :
   ```bash
   heroku config:set HOST=0.0.0.0
   heroku config:set PORT=8000
   heroku config:set DEBUG=false
   heroku config:set CORS_ORIGINS=https://votre-frontend.vercel.app
   ```

### Railway

**Frontend (railway.json):**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/"
  }
}
```

Variables d'environnement :
- `NEXT_PUBLIC_PYTHON_API_URL` = `https://votre-api.railway.app`

**Backend (railway.json):**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "python start_server.py",
    "healthcheckPath": "/api/health"
  }
}
```

Variables d'environnement :
- `HOST` = `0.0.0.0`
- `PORT` = `8000`
- `DEBUG` = `false`
- `CORS_ORIGINS` = `https://votre-frontend.railway.app`

## 🔧 Scripts de Démarrage

### Développement

**Frontend:**
```bash
cd mouse_labyrinth_front
cp env.example .env.local
# Éditez .env.local avec vos valeurs
npm run dev
```

**Backend:**
```bash
cd Mouse_AI_API
cp env.example .env
# Éditez .env avec vos valeurs
python start_server.py
```

### Production

**Frontend:**
```bash
cd mouse_labyrinth_front
npm run build
npm start
```

**Backend:**
```bash
cd Mouse_AI_API
python start_server.py
```

## 🛠️ Dépannage

### Problèmes Courants

1. **CORS Error**: Vérifiez que `CORS_ORIGINS` inclut l'URL de votre frontend
2. **Connection Refused**: Vérifiez que `NEXT_PUBLIC_PYTHON_API_URL` pointe vers le bon serveur
3. **Port Already in Use**: Changez le `PORT` dans les variables d'environnement

### Vérification

**Test de l'API:**
```bash
curl http://localhost:8000/api/health
```

**Test du Frontend:**
```bash
curl http://localhost:3000
```

## 📝 Notes Importantes

- Les variables `NEXT_PUBLIC_*` sont exposées côté client
- Les variables sans préfixe sont côté serveur uniquement
- Redémarrez les serveurs après modification des variables d'environnement
- Utilisez HTTPS en production pour la sécurité
