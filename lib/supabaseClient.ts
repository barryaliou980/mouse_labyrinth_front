import { createClient } from '@supabase/supabase-js';
import { DatabaseLabyrinth, DatabaseSimulationRules, DatabaseSimulation, DatabaseMouse } from './types';
import { mockLabyrinths, getMockLabyrinthById, getAllMockLabyrinths } from './mockData';
import { predefinedRules, getAllRules } from './rules';

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Vérifier si Supabase est configuré
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' && 
  supabaseAnonKey !== 'your-anon-key';

// Client Supabase (seulement si configuré)
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Types pour la base de données Supabase
export interface Database {
  public: {
    Tables: {
      labyrinths: {
        Row: DatabaseLabyrinth;
        Insert: Omit<DatabaseLabyrinth, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseLabyrinth, 'id' | 'created_at' | 'updated_at'>>;
      };
      simulation_rules: {
        Row: DatabaseSimulationRules;
        Insert: Omit<DatabaseSimulationRules, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DatabaseSimulationRules, 'id' | 'created_at' | 'updated_at'>>;
      };
      simulations: {
        Row: DatabaseSimulation;
        Insert: Omit<DatabaseSimulation, 'id'>;
        Update: Partial<Omit<DatabaseSimulation, 'id'>>;
      };
      mice: {
        Row: DatabaseMouse;
        Insert: Omit<DatabaseMouse, 'id'>;
        Update: Partial<Omit<DatabaseMouse, 'id'>>;
      };
    };
  };
}

// Fonctions utilitaires pour Supabase

// Labyrinthes
export async function getLabyrinths() {
  // Si Supabase n'est pas configuré, utiliser les données mockées
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, utilisation des données mockées');
    return mockLabyrinths.map(labyrinth => ({
      id: labyrinth.id,
      name: labyrinth.name,
      description: labyrinth.description,
      grid_data: {
        width: labyrinth.width,
        height: labyrinth.height,
        grid: labyrinth.grid,
        startPositions: labyrinth.startPositions,
        cheesePositions: labyrinth.cheesePositions
      },
      created_at: labyrinth.createdAt,
      updated_at: labyrinth.updatedAt
    }));
  }

  const { data, error } = await supabase
    .from('labyrinths')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching labyrinths:', error);
    throw error;
  }
  
  return data;
}

export async function getLabyrinthById(id: string) {
  // Si Supabase n'est pas configuré, utiliser les données mockées
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, utilisation des données mockées');
    const mockLabyrinth = getMockLabyrinthById(id);
    if (!mockLabyrinth) {
      throw new Error('Labyrinth not found');
    }
    return {
      id: mockLabyrinth.id,
      name: mockLabyrinth.name,
      description: mockLabyrinth.description,
      grid_data: {
        width: mockLabyrinth.width,
        height: mockLabyrinth.height,
        grid: mockLabyrinth.grid,
        startPositions: mockLabyrinth.startPositions,
        cheesePositions: mockLabyrinth.cheesePositions
      },
      created_at: mockLabyrinth.createdAt,
      updated_at: mockLabyrinth.updatedAt
    };
  }

  const { data, error } = await supabase
    .from('labyrinths')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching labyrinth:', error);
    throw error;
  }
  
  return data;
}

export async function createLabyrinth(labyrinth: Database['public']['Tables']['labyrinths']['Insert']) {
  // Si Supabase n'est pas configuré, simuler la création
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de création de labyrinthe');
    return {
      id: `labyrinth-${Date.now()}`,
      ...labyrinth,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('labyrinths')
    .insert(labyrinth)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating labyrinth:', error);
    throw error;
  }
  
  return data;
}

export async function updateLabyrinth(id: string, updates: Database['public']['Tables']['labyrinths']['Update']) {
  // Si Supabase n'est pas configuré, simuler la mise à jour
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de mise à jour de labyrinthe');
    return {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('labyrinths')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating labyrinth:', error);
    throw error;
  }
  
  return data;
}

export async function deleteLabyrinth(id: string) {
  // Si Supabase n'est pas configuré, simuler la suppression
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de suppression de labyrinthe');
    return { id };
  }

  const { error } = await supabase
    .from('labyrinths')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting labyrinth:', error);
    throw error;
  }
  
  return { id };
}

// Règles de simulation
export async function getSimulationRules() {
  // Si Supabase n'est pas configuré, utiliser les règles prédéfinies
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, utilisation des règles prédéfinies');
    return getAllRules().map(rule => ({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      rules_data: rule,
      is_predefined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  }

  const { data, error } = await supabase
    .from('simulation_rules')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching simulation rules:', error);
    throw error;
  }
  
  return data;
}

export async function getSimulationRuleById(id: string) {
  // Si Supabase n'est pas configuré, utiliser les règles prédéfinies
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, utilisation des règles prédéfinies');
    const predefinedRule = predefinedRules[id];
    if (!predefinedRule) {
      throw new Error('Simulation rule not found');
    }
    return {
      id: predefinedRule.id,
      name: predefinedRule.name,
      description: predefinedRule.description,
      rules_data: predefinedRule,
      is_predefined: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('simulation_rules')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching simulation rule:', error);
    throw error;
  }
  
  return data;
}

export async function createSimulationRule(rule: Database['public']['Tables']['simulation_rules']['Insert']) {
  // Si Supabase n'est pas configuré, simuler la création
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de création de règle');
    return {
      id: `rule-${Date.now()}`,
      ...rule,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('simulation_rules')
    .insert(rule)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating simulation rule:', error);
    throw error;
  }
  
  return data;
}

export async function updateSimulationRule(id: string, updates: Database['public']['Tables']['simulation_rules']['Update']) {
  // Si Supabase n'est pas configuré, simuler la mise à jour
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de mise à jour de règle');
    return {
      id,
      ...updates,
      updated_at: new Date().toISOString()
    };
  }

  const { data, error } = await supabase
    .from('simulation_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating simulation rule:', error);
    throw error;
  }
  
  return data;
}

export async function deleteSimulationRule(id: string) {
  // Si Supabase n'est pas configuré, simuler la suppression
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, simulation de suppression de règle');
    return { id };
  }

  const { error } = await supabase
    .from('simulation_rules')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting simulation rule:', error);
    throw error;
  }
  
  return { id };
}

// Simulations
export async function getSimulations() {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  
  const { data, error } = await supabase
    .from('simulations')
    .select(`
      *,
      labyrinths (*)
    `)
    .order('start_time', { ascending: false });
  
  if (error) {
    console.error('Error fetching simulations:', error);
    throw error;
  }
  
  return data;
}

export async function getSimulationById(id: string) {
  const { data, error } = await supabase
    .from('simulations')
    .select(`
      *,
      labyrinths (*),
      mice (*)
    `)
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching simulation:', error);
    throw error;
  }
  
  return data;
}

export async function createSimulation(simulation: Database['public']['Tables']['simulations']['Insert']) {
  const { data, error } = await supabase
    .from('simulations')
    .insert(simulation)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating simulation:', error);
    throw error;
  }
  
  return data;
}

export async function updateSimulation(id: string, updates: Database['public']['Tables']['simulations']['Update']) {
  const { data, error } = await supabase
    .from('simulations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating simulation:', error);
    throw error;
  }
  
  return data;
}

// Souris
export async function getMiceBySimulation(simulationId: string) {
  const { data, error } = await supabase
    .from('mice')
    .select('*')
    .eq('simulation_id', simulationId)
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching mice:', error);
    throw error;
  }
  
  return data;
}

export async function createMouse(mouse: Database['public']['Tables']['mice']['Insert']) {
  const { data, error } = await supabase
    .from('mice')
    .insert(mouse)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating mouse:', error);
    throw error;
  }
  
  return data;
}

export async function updateMouse(id: string, updates: Database['public']['Tables']['mice']['Update']) {
  const { data, error } = await supabase
    .from('mice')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating mouse:', error);
    throw error;
  }
  
  return data;
}

// Fonction pour initialiser la base de données avec des labyrinthes et règles d'exemple
export async function initializeDatabase() {
  // Si Supabase n'est pas configuré, ne rien faire
  if (!isSupabaseConfigured || !supabase) {
    console.log('Supabase non configuré, initialisation ignorée');
    return;
  }

  // Vérifier si des labyrinths existent déjà
  const { data: existingLabyrinths } = await supabase
    .from('labyrinths')
    .select('id')
    .limit(1);
  
  // Vérifier si des règles existent déjà
  const { data: existingRules } = await supabase
    .from('simulation_rules')
    .select('id')
    .limit(1);
  
  if (existingLabyrinths && existingLabyrinths.length > 0 && existingRules && existingRules.length > 0) {
    console.log('Database already initialized');
    return;
  }
  
  // Créer des labyrinths d'exemple
  const exampleLabyrinths = [
    {
      name: 'Labyrinthe Simple',
      description: 'Un labyrinthe simple pour débuter',
      grid_data: {
        width: 10,
        height: 10,
        grid: [
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
          ['wall', 'start', 'path', 'path', 'wall', 'wall', 'path', 'path', 'cheese', 'wall'],
          ['wall', 'path', 'wall', 'path', 'wall', 'wall', 'path', 'wall', 'path', 'wall'],
          ['wall', 'path', 'wall', 'path', 'path', 'path', 'path', 'wall', 'path', 'wall'],
          ['wall', 'path', 'wall', 'wall', 'wall', 'wall', 'path', 'wall', 'path', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'wall', 'path', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall', 'path', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'wall', 'path', 'wall'],
          ['wall', 'cheese', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
        ],
        startPositions: [{ x: 1, y: 1 }],
        cheesePositions: [{ x: 8, y: 1 }, { x: 1, y: 8 }]
      }
    },
    {
      name: 'Labyrinthe Complexe',
      description: 'Un labyrinthe plus difficile avec plusieurs chemins',
      grid_data: {
        width: 15,
        height: 15,
        grid: [
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
          ['wall', 'start', 'path', 'path', 'wall', 'path', 'path', 'path', 'wall', 'path', 'path', 'path', 'wall', 'cheese', 'wall'],
          ['wall', 'path', 'wall', 'path', 'wall', 'path', 'wall', 'path', 'wall', 'path', 'wall', 'path', 'wall', 'path', 'wall'],
          ['wall', 'path', 'wall', 'path', 'path', 'path', 'wall', 'path', 'path', 'path', 'wall', 'path', 'path', 'path', 'wall'],
          ['wall', 'path', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
          ['wall', 'path', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
          ['wall', 'cheese', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
          ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'cheese', 'wall'],
          ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
        ],
        startPositions: [{ x: 1, y: 1 }],
        cheesePositions: [{ x: 13, y: 1 }, { x: 1, y: 11 }, { x: 13, y: 13 }]
      }
    }
  ];
  
  // Créer les règles prédéfinies
  const predefinedRulesList = getAllRules();
  
  try {
    // Créer les labyrinths s'ils n'existent pas
    if (!existingLabyrinths || existingLabyrinths.length === 0) {
      for (const labyrinth of exampleLabyrinths) {
        await createLabyrinth(labyrinth);
      }
      console.log('Database initialized with example labyrinths');
    }
    
    // Créer les règles prédéfinies si elles n'existent pas
    if (!existingRules || existingRules.length === 0) {
      for (const rule of predefinedRulesList) {
        await createSimulationRule({
          name: rule.name,
          description: rule.description,
          rules_data: rule as unknown as Record<string, unknown>,
          is_predefined: true
        });
      }
      console.log('Database initialized with predefined rules');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
