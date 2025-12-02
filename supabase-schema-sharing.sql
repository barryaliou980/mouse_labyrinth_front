-- Script SQL pour le système de partage de simulations
-- À exécuter dans Supabase SQL Editor

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
CREATE INDEX IF NOT EXISTS idx_shared_simulations_token ON shared_simulations(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_simulations_simulation_id ON shared_simulations(simulation_id);

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS update_shared_simulations_updated_at ON shared_simulations;

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_shared_simulations_updated_at BEFORE UPDATE ON shared_simulations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security)
ALTER TABLE shared_simulations ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes s'ils existent
DROP POLICY IF EXISTS "Allow public read access to shared_simulations" ON shared_simulations;
DROP POLICY IF EXISTS "Allow public insert access to shared_simulations" ON shared_simulations;
DROP POLICY IF EXISTS "Allow public update access to shared_simulations" ON shared_simulations;
DROP POLICY IF EXISTS "Allow public delete access to shared_simulations" ON shared_simulations;

-- Politiques RLS pour permettre l'accès public en lecture
CREATE POLICY "Allow public read access to shared_simulations" ON shared_simulations
    FOR SELECT USING (true);

-- Politiques RLS pour permettre l'insertion publique
CREATE POLICY "Allow public insert access to shared_simulations" ON shared_simulations
    FOR INSERT WITH CHECK (true);

-- Politiques RLS pour permettre la mise à jour publique
CREATE POLICY "Allow public update access to shared_simulations" ON shared_simulations
    FOR UPDATE USING (true);

-- Politiques RLS pour permettre la suppression publique
CREATE POLICY "Allow public delete access to shared_simulations" ON shared_simulations
    FOR DELETE USING (true);

