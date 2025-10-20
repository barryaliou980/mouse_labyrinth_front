import { NextRequest, NextResponse } from 'next/server';
import { getLabyrinthById } from '@/lib/supabaseClient';
import { Labyrinth } from '@/lib/types';

// GET /api/labyrinths/[id] - Récupérer un labyrinthe spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
    
    // Transformer les données de la base vers le format attendu
    const labyrinth: Labyrinth = {
      id: dbLabyrinth.id,
      name: dbLabyrinth.name,
      description: dbLabyrinth.description,
      width: dbLabyrinth.grid_data.width,
      height: dbLabyrinth.grid_data.height,
      grid: dbLabyrinth.grid_data.grid,
      startPositions: dbLabyrinth.grid_data.startPositions,
      cheesePositions: dbLabyrinth.grid_data.cheesePositions,
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
