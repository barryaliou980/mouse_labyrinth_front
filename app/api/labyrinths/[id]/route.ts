import { NextRequest, NextResponse } from 'next/server';
import { getLabyrinthById, updateLabyrinth, deleteLabyrinth } from '@/lib/supabaseClient';
import { Labyrinth } from '@/lib/types';

// GET /api/labyrinths/[id] - Récupérer un labyrinthe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Labyrinth ID is required'
        },
        { status: 400 }
      );
    }
    
    const dbLabyrinth = await getLabyrinthById(id);
    
    // S'assurer que startPositions est toujours un tableau
    let startPositions = dbLabyrinth.grid_data.startPositions || [];
    if (!Array.isArray(startPositions) || startPositions.length === 0) {
      // Si aucune position de départ n'est définie, utiliser une position par défaut (1, 1)
      startPositions = [{ x: 1, y: 1 }];
    }
    
    // Créer une copie de la grille pour éviter de modifier l'original
    const grid = dbLabyrinth.grid_data.grid.map((row: any[]) => [...row]);
    const cheesePositions = dbLabyrinth.grid_data.cheesePositions || [];
    
    // Restaurer tous les fromages dans la grille en se basant sur cheesePositions
    cheesePositions.forEach((pos: { x: number; y: number }) => {
      if (grid[pos.y] && grid[pos.y][pos.x]) {
        grid[pos.y][pos.x] = 'cheese';
      }
    });
    
    // Transformer les données de la base vers le format attendu
    const labyrinth: Labyrinth = {
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
    
    return NextResponse.json({
      success: true,
      data: labyrinth
    });
    
  } catch (error) {
    console.error('Error fetching labyrinth:', error);
    
    if (error instanceof Error && error.message.includes('No rows')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Labyrinth not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch labyrinth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/labyrinths/[id] - Mettre à jour un labyrinthe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, width, height, grid, startPositions, cheesePositions } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Labyrinth ID is required'
        },
        { status: 400 }
      );
    }

    // Valider que startPositions est fourni et non vide
    if (!startPositions || !Array.isArray(startPositions) || startPositions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Au moins une position de départ est requise'
        },
        { status: 400 }
      );
    }

    const updatedLabyrinth = await updateLabyrinth(id, {
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

    // S'assurer que startPositions est toujours un tableau
    let formattedStartPositions = updatedLabyrinth.grid_data.startPositions || [];
    if (!Array.isArray(formattedStartPositions) || formattedStartPositions.length === 0) {
      formattedStartPositions = [{ x: 1, y: 1 }];
    }

    // Transformer les données de la base vers le format attendu
    const formattedLabyrinth: Labyrinth = {
      id: updatedLabyrinth.id,
      name: updatedLabyrinth.name,
      description: updatedLabyrinth.description,
      width: updatedLabyrinth.grid_data.width,
      height: updatedLabyrinth.grid_data.height,
      grid: updatedLabyrinth.grid_data.grid,
      startPositions: formattedStartPositions,
      cheesePositions: updatedLabyrinth.grid_data.cheesePositions || [],
      createdAt: updatedLabyrinth.created_at,
      updatedAt: updatedLabyrinth.updated_at
    };

    return NextResponse.json({
      success: true,
      data: formattedLabyrinth
    });
    
  } catch (error) {
    console.error('Error updating labyrinth:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update labyrinth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/labyrinths/[id] - Supprimer un labyrinthe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Labyrinth ID is required'
        },
        { status: 400 }
      );
    }
    
    await deleteLabyrinth(id);
    
    return NextResponse.json({
      success: true,
      message: 'Labyrinth deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting labyrinth:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete labyrinth',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
