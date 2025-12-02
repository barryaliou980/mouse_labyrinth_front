-- Schéma Supabase pour le système de simulation de souris dans un labyrinthe

-- Table des labyrinthes
CREATE TABLE IF NOT EXISTS labyrinths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    grid_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des règles de simulation
CREATE TABLE IF NOT EXISTS simulation_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rules_data JSONB NOT NULL,
    is_predefined BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des simulations
CREATE TABLE IF NOT EXISTS simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    labyrinth_id UUID REFERENCES labyrinths(id) ON DELETE CASCADE,
    rules_id UUID REFERENCES simulation_rules(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'idle',
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des souris
CREATE TABLE IF NOT EXISTS mice (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    intelligence_type VARCHAR(50) NOT NULL,
    initial_position JSONB NOT NULL,
    final_position JSONB,
    health INTEGER DEFAULT 100,
    happiness INTEGER DEFAULT 100,
    energy INTEGER DEFAULT 100,
    cheese_found INTEGER DEFAULT 0,
    moves INTEGER DEFAULT 0,
    is_alive BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des simulations partagées
CREATE TABLE IF NOT EXISTS shared_simulations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    simulation_id UUID REFERENCES simulations(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    view_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_labyrinths_created_at ON labyrinths(created_at);
CREATE INDEX IF NOT EXISTS idx_simulation_rules_created_at ON simulation_rules(created_at);
CREATE INDEX IF NOT EXISTS idx_simulations_labyrinth_id ON simulations(labyrinth_id);
CREATE INDEX IF NOT EXISTS idx_simulations_rules_id ON simulations(rules_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON simulations(status);
CREATE INDEX IF NOT EXISTS idx_mice_simulation_id ON mice(simulation_id);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_token ON shared_simulations(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_simulation_id ON shared_simulations(simulation_id);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer les triggers existants s'ils existent
DROP TRIGGER IF EXISTS update_labyrinths_updated_at ON labyrinths;
DROP TRIGGER IF EXISTS update_simulation_rules_updated_at ON simulation_rules;
DROP TRIGGER IF EXISTS update_simulations_updated_at ON simulations;
DROP TRIGGER IF EXISTS update_mice_updated_at ON mice;
DROP TRIGGER IF EXISTS update_shared_simulations_updated_at ON shared_simulations;

-- Triggers pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_labyrinths_updated_at BEFORE UPDATE ON labyrinths
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulation_rules_updated_at BEFORE UPDATE ON simulation_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_simulations_updated_at BEFORE UPDATE ON simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mice_updated_at BEFORE UPDATE ON mice
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shared_simulations_updated_at BEFORE UPDATE ON shared_simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Règles de sécurité RLS (Row Level Security)
ALTER TABLE labyrinths ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mice ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_simulations ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes s'ils existent
DROP POLICY IF EXISTS "Allow public read access to labyrinths" ON labyrinths;
DROP POLICY IF EXISTS "Allow public read access to simulation_rules" ON simulation_rules;
DROP POLICY IF EXISTS "Allow public read access to simulations" ON simulations;
DROP POLICY IF EXISTS "Allow public read access to mice" ON mice;
DROP POLICY IF EXISTS "Allow public read access to shared_simulations" ON shared_simulations;

-- Politiques RLS pour permettre l'accès public en lecture
CREATE POLICY "Allow public read access to labyrinths" ON labyrinths
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to simulation_rules" ON simulation_rules
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to simulations" ON simulations
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to mice" ON mice
    FOR SELECT USING (true);

CREATE POLICY "Allow public read access to shared_simulations" ON shared_simulations
    FOR SELECT USING (true);

-- Supprimer les politiques d'insertion existantes
DROP POLICY IF EXISTS "Allow public insert access to labyrinths" ON labyrinths;
DROP POLICY IF EXISTS "Allow public insert access to simulation_rules" ON simulation_rules;
DROP POLICY IF EXISTS "Allow public insert access to simulations" ON simulations;
DROP POLICY IF EXISTS "Allow public insert access to mice" ON mice;
DROP POLICY IF EXISTS "Allow public insert access to shared_simulations" ON shared_simulations;

-- Politiques RLS pour permettre l'insertion publique
CREATE POLICY "Allow public insert access to labyrinths" ON labyrinths
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to simulation_rules" ON simulation_rules
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to simulations" ON simulations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to mice" ON mice
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert access to shared_simulations" ON shared_simulations
    FOR INSERT WITH CHECK (true);

-- Supprimer les politiques de mise à jour existantes
DROP POLICY IF EXISTS "Allow public update access to labyrinths" ON labyrinths;
DROP POLICY IF EXISTS "Allow public update access to simulation_rules" ON simulation_rules;
DROP POLICY IF EXISTS "Allow public update access to simulations" ON simulations;
DROP POLICY IF EXISTS "Allow public update access to mice" ON mice;
DROP POLICY IF EXISTS "Allow public update access to shared_simulations" ON shared_simulations;

-- Politiques RLS pour permettre la mise à jour publique
CREATE POLICY "Allow public update access to labyrinths" ON labyrinths
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to simulation_rules" ON simulation_rules
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to simulations" ON simulations
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to mice" ON mice
    FOR UPDATE USING (true);

CREATE POLICY "Allow public update access to shared_simulations" ON shared_simulations
    FOR UPDATE USING (true);

-- Supprimer les politiques de suppression existantes
DROP POLICY IF EXISTS "Allow public delete access to labyrinths" ON labyrinths;
DROP POLICY IF EXISTS "Allow public delete access to simulation_rules" ON simulation_rules;
DROP POLICY IF EXISTS "Allow public delete access to simulations" ON simulations;
DROP POLICY IF EXISTS "Allow public delete access to mice" ON mice;
DROP POLICY IF EXISTS "Allow public delete access to shared_simulations" ON shared_simulations;

-- Politiques RLS pour permettre la suppression publique
CREATE POLICY "Allow public delete access to labyrinths" ON labyrinths
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete access to simulation_rules" ON simulation_rules
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete access to simulations" ON simulations
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete access to mice" ON mice
    FOR DELETE USING (true);

CREATE POLICY "Allow public delete access to shared_simulations" ON shared_simulations
    FOR DELETE USING (true);
