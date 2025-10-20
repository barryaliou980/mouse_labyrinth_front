import { Labyrinth } from './types';

// Labyrinthes statiques pour les tests sans Supabase
export const mockLabyrinths: Labyrinth[] = [
  {
    id: 'labyrinth-1',
    name: 'Labyrinthe Simple',
    description: 'Un labyrinthe simple pour débuter',
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
    cheesePositions: [{ x: 8, y: 1 }, { x: 1, y: 8 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'labyrinth-2',
    name: 'Labyrinthe Complexe',
    description: 'Un labyrinthe plus difficile avec plusieurs chemins',
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
    cheesePositions: [{ x: 13, y: 1 }, { x: 1, y: 11 }, { x: 13, y: 13 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'labyrinth-3',
    name: 'Labyrinthe Social',
    description: 'Labyrinthe optimisé pour les interactions sociales entre souris',
    width: 12,
    height: 12,
    grid: [
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'start', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'cheese', 'wall'],
      ['wall', 'path', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'path', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall'],
      ['wall', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
      ['wall', 'cheese', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'path', 'wall'],
      ['wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall', 'wall']
    ],
    startPositions: [{ x: 1, y: 1 }, { x: 1, y: 1 }], // Deux positions de départ pour les interactions
    cheesePositions: [{ x: 10, y: 1 }, { x: 1, y: 9 }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Fonction pour obtenir un labyrinthe par ID
export function getMockLabyrinthById(id: string): Labyrinth | undefined {
  return mockLabyrinths.find(labyrinth => labyrinth.id === id);
}

// Fonction pour obtenir tous les labyrinthes
export function getAllMockLabyrinths(): Labyrinth[] {
  return mockLabyrinths;
}
