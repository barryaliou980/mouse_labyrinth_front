import { NextRequest, NextResponse } from 'next/server';
import { getLabyrinths, initializeDatabase } from '@/lib/supabaseClient';
import { Labyrinth } from '@/lib/types';

// GET /api/labyrinths - Récupérer tous les labyrinths
export async function GET(request: NextRequest) {
  try {
    // Initialiser la base de données si nécessaire
    await initializeDatabase();
    
    const labyrinths = await getLabyrinths();
    
    // Transformer les données de la base vers le format attendu
    const formattedLabyrinths: Labyrinth[] = labyrinths.map((dbLabyrinth) => ({
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
    }));
    
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
