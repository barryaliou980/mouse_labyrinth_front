// Client API pour interagir avec les routes Next.js
import { Labyrinth, SimulationRules } from './types';

const API_BASE_URL = '/api';

// Types pour les réponses API
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
}

// Service pour les labyrinthes
export class LabyrinthService {
  static async getAll(): Promise<Labyrinth[]> {
    const response = await fetch(`${API_BASE_URL}/labyrinths`);
    const result: ApiResponse<Labyrinth[]> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch labyrinths');
    }
    
    return result.data || [];
  }

  static async getById(id: string): Promise<Labyrinth> {
    const response = await fetch(`${API_BASE_URL}/labyrinths/${id}`);
    const result: ApiResponse<Labyrinth> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch labyrinth');
    }
    
    return result.data!;
  }

  static async create(labyrinth: Omit<Labyrinth, 'id' | 'createdAt' | 'updatedAt'>): Promise<Labyrinth> {
    const response = await fetch(`${API_BASE_URL}/labyrinths`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labyrinth),
    });
    
    const result: ApiResponse<Labyrinth> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create labyrinth');
    }
    
    return result.data!;
  }

  static async update(id: string, labyrinth: Partial<Omit<Labyrinth, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Labyrinth> {
    const response = await fetch(`${API_BASE_URL}/labyrinths/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(labyrinth),
    });
    
    const result: ApiResponse<Labyrinth> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update labyrinth');
    }
    
    return result.data!;
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/labyrinths/${id}`, {
      method: 'DELETE',
    });
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete labyrinth');
    }
  }
}

// Service pour les règles de simulation
export class RulesService {
  static async getAll(): Promise<SimulationRules[]> {
    try {
      // Ajouter un timeout de 10 secondes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_BASE_URL}/rules`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result: ApiResponse<SimulationRules[]> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch rules');
      }
      
      return result.data || [];
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Timeout: La requête a pris trop de temps. Vérifiez votre connexion.');
        }
        throw error;
      }
      throw new Error('Erreur inconnue lors du chargement des règles');
    }
  }

  static async getById(id: string): Promise<SimulationRules> {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`);
    const result: ApiResponse<SimulationRules> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch rule');
    }
    
    return result.data!;
  }

  static async create(rule: Omit<SimulationRules, 'id'>): Promise<SimulationRules> {
    const response = await fetch(`${API_BASE_URL}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    });
    
    const result: ApiResponse<SimulationRules> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to create rule');
    }
    
    return result.data!;
  }

  static async update(id: string, rule: Partial<Omit<SimulationRules, 'id'>>): Promise<SimulationRules> {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    });
    
    const result: ApiResponse<SimulationRules> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update rule');
    }
    
    return result.data!;
  }

  static async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/rules/${id}`, {
      method: 'DELETE',
    });
    
    const result: ApiResponse<void> = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete rule');
    }
  }
}
