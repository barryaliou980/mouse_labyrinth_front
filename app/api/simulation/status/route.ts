import { NextRequest, NextResponse } from 'next/server';
import { getSimulationById } from '@/lib/supabaseClient';
import { Simulation, Mouse } from '@/lib/types';

// GET /api/simulation/status - Récupérer le statut d'une simulation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const simulationId = searchParams.get('id');
    
    if (!simulationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation ID is required'
        },
        { status: 400 }
      );
    }
    
    const dbSimulation = await getSimulationById(simulationId);
    
    // Transformer les souris de la base vers le format attendu
    const mice: Mouse[] = dbSimulation.mice.map((dbMouse: any) => ({
      id: dbMouse.id,
      name: dbMouse.name,
      position: dbMouse.final_position || dbMouse.initial_position,
      intelligenceType: dbMouse.intelligence_type as any,
      health: dbMouse.health,
      happiness: dbMouse.happiness,
      energy: dbMouse.energy,
      cheeseFound: dbMouse.cheese_found,
      moves: dbMouse.moves,
      isAlive: dbMouse.is_alive
    }));
    
    // Créer l'objet simulation
    const simulation: Partial<Simulation> = {
      id: dbSimulation.id,
      labyrinthId: dbSimulation.labyrinth_id,
      mice,
      status: dbSimulation.status as any,
      startTime: dbSimulation.start_time,
      endTime: dbSimulation.end_time || undefined,
      results: dbSimulation.results || undefined
    };
    
    return NextResponse.json({
      success: true,
      data: simulation
    });
    
  } catch (error) {
    console.error('Error fetching simulation status:', error);
    
    if (error instanceof Error && error.message.includes('No rows')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation not found'
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch simulation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
