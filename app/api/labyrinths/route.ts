import { NextRequest, NextResponse } from 'next/server';
import { getLabyrinths, createLabyrinth, initializeDatabase } from '@/lib/supabaseClient';
import { Labyrinth } from '@/lib/types';

// GET /api/labyrinths - Récupérer tous les labyrinths
export async function GET(request: NextRequest) {
  try {
    // Initialiser la base de données si nécessaire
    await initializeDatabase();
    
    const labyrinths = await getLabyrinths();
    
    // Transformer les données de la base vers le format attendu
    // Restaurer tous les fromages dans la grille pour garantir que la grille est toujours dans son état original
    const formattedLabyrinths: Labyrinth[] = labyrinths.map((dbLabyrinth) => {
      // Créer une copie de la grille pour éviter de modifier l'original
      const grid = dbLabyrinth.grid_data.grid.map((row: any[]) => [...row]);
      const cheesePositions = dbLabyrinth.grid_data.cheesePositions || [];
      
      // Restaurer tous les fromages dans la grille en se basant sur cheesePositions
      cheesePositions.forEach((pos: { x: number; y: number }) => {
        if (grid[pos.y] && grid[pos.y][pos.x]) {
          grid[pos.y][pos.x] = 'cheese';
        }
      });
      
      // S'assurer que startPositions est toujours un tableau
      let startPositions = dbLabyrinth.grid_data.startPositions || [];
      if (!Array.isArray(startPositions) || startPositions.length === 0) {
        // Si aucune position de départ n'est définie, utiliser une position par défaut (1, 1)
        startPositions = [{ x: 1, y: 1 }];
      }
      
      return {
        id: dbLabyrinth.id,
        name: dbLabyrinth.name,
        description: dbLabyrinth.description,
        width: dbLabyrinth.grid_data.width,
        height: dbLabyrinth.grid_data.height,
        grid: grid,
        startPositions: startPositions,
        cheesePositions: cheesePositions,
        createdAt: dbLabyrinth.created_at,
        updatedAt: dbLabyrinth.updated_at
      };
    });
    
    return NextResponse.json({
      success: true,
      data: formattedLabyrinths
    });
    
  } catch (error) {
    console.error('Error fetching labyrinths:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch labyrinths',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/labyrinths - Créer un nouveau labyrinthe
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, width, height, grid, startPositions, cheesePositions } = body;

    if (!name || !description || !width || !height || !grid || !startPositions || !cheesePositions) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, description, width, height, grid, startPositions, cheesePositions'
        },
        { status: 400 }
      );
    }

    const newLabyrinth = await createLabyrinth({
      name,
      description,
      grid_data: {
        width,
        height,
        grid,
        startPositions,
        cheesePositions
      }
    });

    // Transformer les données de la base vers le format attendu
    const formattedLabyrinth: Labyrinth = {
      id: newLabyrinth.id,
      name: newLabyrinth.name,
      description: newLabyrinth.description,
      width: newLabyrinth.grid_data.width,
      height: newLabyrinth.grid_data.height,
      grid: newLabyrinth.grid_data.grid,
      startPositions: newLabyrinth.grid_data.startPositions,
      cheesePositions: newLabyrinth.grid_data.cheesePositions,
      createdAt: newLabyrinth.created_at,
      updatedAt: newLabyrinth.updated_at
    };

    return NextResponse.json({
      success: true,
      data: formattedLabyrinth
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating labyrinth:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create labyrinth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
