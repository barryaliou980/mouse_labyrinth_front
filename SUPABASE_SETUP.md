# Configuration Supabase - Guide Rapide

## 🚀 Étapes pour configurer Supabase

### 1. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte ou connectez-vous
3. Cliquez sur "New Project"
4. Choisissez votre organisation
5. Donnez un nom à votre projet (ex: "mouse-labyrinth")
6. Créez un mot de passe fort pour la base de données
7. Choisissez une région proche de vous
8. Cliquez sur "Create new project"

### 2. Récupérer les clés

1. Dans le dashboard de votre projet Supabase
2. Allez dans **Settings** → **API**
3. Copiez les valeurs suivantes :
   - **Project URL** (ex: `https://abcdefgh.supabase.co`)
   - **anon public** key (ex: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Configurer l'environnement

Modifiez le fichier `.env.local` :

```bash
# Configuration Supabase
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-anon-key-ici
```

### 4. Créer les tables

Exécutez le script SQL dans l'éditeur SQL de Supabase :

```sql
-- Copiez le contenu de supabase-schema.sql dans l'éditeur SQL
-- Ou exécutez les commandes suivantes :

-- Table labyrinths
CREATE TABLE IF NOT EXISTS labyrinths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  grid_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table simulation_rules
CREATE TABLE IF NOT EXISTS simulation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rules_data JSONB NOT NULL,
  is_predefined BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table simulations
CREATE TABLE IF NOT EXISTS simulations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  labyrinth_id UUID REFERENCES labyrinths(id),
  rules_id UUID REFERENCES simulation_rules(id),
  status TEXT DEFAULT 'pending',
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table mice
CREATE TABLE IF NOT EXISTS mice (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  simulation_id UUID REFERENCES simulations(id),
  name TEXT NOT NULL,
  position JSONB NOT NULL,
  health INTEGER DEFAULT 100,
  happiness INTEGER DEFAULT 50,
  energy INTEGER DEFAULT 100,
  cheese_found INTEGER DEFAULT 0,
  moves INTEGER DEFAULT 0,
  is_alive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE labyrinths ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mice ENABLE ROW LEVEL SECURITY;

-- Politiques pour permettre l'accès public (lecture seule)
CREATE POLICY "Allow public read access on labyrinths" ON labyrinths FOR SELECT USING (true);
CREATE POLICY "Allow public read access on simulation_rules" ON simulation_rules FOR SELECT USING (true);
CREATE POLICY "Allow public read access on simulations" ON simulations FOR SELECT USING (true);
CREATE POLICY "Allow public read access on mice" ON mice FOR SELECT USING (true);

-- Politiques pour permettre l'insertion publique
CREATE POLICY "Allow public insert on labyrinths" ON labyrinths FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on simulation_rules" ON simulation_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on simulations" ON simulations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert on mice" ON mice FOR INSERT WITH CHECK (true);
```

### 5. Redémarrer l'application

```bash
# Arrêter le serveur de développement
# Puis redémarrer
npm run dev
```

### 6. Vérifier la configuration

1. Allez sur `http://localhost:3000/simulation`
2. Les labyrinthes devraient maintenant venir de Supabase
3. Vous pouvez créer de nouveaux labyrinthes via l'interface

## 🔧 Dépannage

### Problème : "Supabase non configuré"
- Vérifiez que `.env.local` existe et contient les bonnes valeurs
- Redémarrez le serveur de développement
- Vérifiez que les variables commencent par `NEXT_PUBLIC_`

### Problème : "Failed to fetch labyrinths"
- Vérifiez que les tables existent dans Supabase
- Vérifiez que les politiques RLS sont correctes
- Vérifiez les logs dans la console du navigateur

### Problème : "CORS error"
- Supabase gère automatiquement CORS
- Vérifiez que l'URL du projet est correcte

## 📝 Notes importantes

- Les variables `NEXT_PUBLIC_*` sont exposées côté client
- Ne jamais commiter `.env.local` dans Git
- Utilisez des politiques RLS appropriées en production
- Le fallback mock fonctionne si Supabase n'est pas configuré