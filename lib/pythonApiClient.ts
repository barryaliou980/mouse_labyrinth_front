import { Mouse, Labyrinth, CellType, Algorithm } from './types';
import { getApiUrl } from './config';

export interface MouseMoveRequest {
  mouseId: string;
  position: { x: number; y: number };
  environment: {
    grid: string[][];
    width: number;
    height: number;
    cheesePositions: { x: number; y: number }[];
    otherMice: any[];
    walls: any[];
    paths: any[];
  };
  mouseState: {
    health: number;
    happiness: number;
    energy: number;
    cheeseFound: number;
    algorithm?: Algorithm;
  };
  availableMoves: string[];
  available_cheeses?: { x: number; y: number }[];
}

export interface MouseMoveResponse {
  mouseId: string;
  move: string;
  reasoning: string;
}

export class PythonApiClient {
  static async getMouseMove(request: MouseMoveRequest): Promise<MouseMoveResponse> {
    try {
      const response = await fetch(getApiUrl('/api/move'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API Python error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error calling Python API:', error);
      // Fallback to random movement
      const availableMoves = request.availableMoves;
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
      return {
        mouseId: request.mouseId,
        move: randomMove,
        reasoning: `API Python non disponible, mouvement aléatoire: ${error}`
      };
    }
  }

  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(getApiUrl('/api/health'));
      return response.ok;
    } catch (error) {
      console.error('Python API health check failed:', error);
      return false;
    }
  }

  // Convertir le labyrinthe Next.js vers le format Python
  static convertLabyrinthToPythonFormat(labyrinth: Labyrinth, uncollectedCheeses?: { x: number; y: number }[]): {
    grid: string[][];
    width: number;
    height: number;
    cheesePositions: { x: number; y: number }[];
  } {
    const grid: string[][] = [];
    const cheesePositions: { x: number; y: number }[] = [];

    for (let y = 0; y < labyrinth.height; y++) {
      const row: string[] = [];
      for (let x = 0; x < labyrinth.width; x++) {
        const cell = labyrinth.grid[y][x];
        switch (cell) {
          case 'wall':
            row.push('wall');
            break;
          case 'cheese':
            row.push('path'); // Le fromage est sur un chemin
            // Utiliser les fromages non collectés si fournis, sinon tous les fromages
            if (!uncollectedCheeses || uncollectedCheeses.some(cheese => cheese.x === x && cheese.y === y)) {
              cheesePositions.push({ x, y });
            }
            break;
          case 'start':
            row.push('path'); // La position de départ est un chemin
            break;
          default:
            row.push('path');
        }
      }
      grid.push(row);
    }

    return {
      grid,
      width: labyrinth.width,
      height: labyrinth.height,
      cheesePositions: uncollectedCheeses || cheesePositions
    };
  }

  // Obtenir les mouvements disponibles pour une position
  static getAvailableMoves(labyrinth: Labyrinth, position: { x: number; y: number }): string[] {
    const moves: string[] = [];
    const { x, y } = position;

    // Vérifier chaque direction
    if (y > 0 && labyrinth.grid[y - 1][x] !== 'wall') {
      moves.push('north');
    }
    if (y < labyrinth.height - 1 && labyrinth.grid[y + 1][x] !== 'wall') {
      moves.push('south');
    }
    if (x < labyrinth.width - 1 && labyrinth.grid[y][x + 1] !== 'wall') {
      moves.push('east');
    }
    if (x > 0 && labyrinth.grid[y][x - 1] !== 'wall') {
      moves.push('west');
    }

    return moves;
  }
}
