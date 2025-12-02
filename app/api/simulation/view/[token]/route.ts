import { NextRequest, NextResponse } from 'next/server';
import { getSharedSimulationByToken, getSimulationRuleById } from '@/lib/supabaseClient';
import { Simulation, Labyrinth, Mouse, SimulationRules } from '@/lib/types';
import { getRulesById } from '@/lib/rules';

// GET /api/simulation/view/[token] - Récupérer une simulation partagée
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Share token is required'
        },
        { status: 400 }
      );
    }
    
    // Récupérer la simulation partagée
    const sharedData = await getSharedSimulationByToken(token);
    
    if (!sharedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shared simulation not found or expired'
        },
        { status: 404 }
      );
    }
    
    // Extraire les données de la simulation
    const dbSimulation = sharedData.simulations as any;
    
    if (!dbSimulation) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation data not found'
        },
        { status: 404 }
      );
    }
    
    // Transformer le labyrinthe
    const dbLabyrinth = dbSimulation.labyrinths as any;
    const gridData = dbLabyrinth.grid_data as any;
    
    // Vérifier si un état de grille actuel est stocké dans la simulation
    // (pour voir les fromages collectés sans affecter le labyrinthe original)
    const simulationResults = dbSimulation.results as any;
    const currentGridState = simulationResults?.current_grid_state;
    
    let grid: any[][];
    let cheesePositions: { x: number; y: number }[];
    
    if (currentGridState && currentGridState.grid && currentGridState.cheesePositions) {
      // Utiliser l'état actuel de la grille (avec fromages collectés)
      console.log('📊 Page partagée: Chargement de l\'état actuel de la grille depuis la simulation');
      grid = currentGridState.grid;
      cheesePositions = currentGridState.cheesePositions || [];
    } else {
      // Utiliser la grille originale du labyrinthe (tous les fromages présents)
      console.log('📊 Page partagée: Chargement de la grille originale du labyrinthe');
      grid = gridData.grid;
      cheesePositions = gridData.cheesePositions || [];
    }
    
    // S'assurer que startPositions est toujours un tableau avec au moins une position
    let startPositions = gridData.startPositions || [];
    if (!Array.isArray(startPositions) || startPositions.length === 0) {
      // Si aucune position de départ n'est définie, utiliser une position par défaut (1, 1)
      startPositions = [{ x: 1, y: 1 }];
    }
    
    const labyrinth: Labyrinth = {
      id: dbLabyrinth.id,
      name: dbLabyrinth.name,
      description: dbLabyrinth.description || '',
      width: gridData.width,
      height: gridData.height,
      grid: grid,
      startPositions: startPositions,
      cheesePositions: cheesePositions,
      createdAt: dbLabyrinth.created_at,
      updatedAt: dbLabyrinth.updated_at
    };
    
    // Transformer les règles
    let rules: SimulationRules;
    try {
      // Essayer d'abord les règles prédéfinies
      const predefinedRule = getRulesById(dbSimulation.rules_id);
      if (predefinedRule) {
        rules = predefinedRule;
      } else {
        // Sinon, récupérer depuis Supabase
        const dbRule = await getSimulationRuleById(dbSimulation.rules_id);
        if (!dbRule) {
          throw new Error('Rules not found');
        }
        // Transformer les règles depuis la base de données
        rules = dbRule.rules_data as SimulationRules;
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation rules not found'
        },
        { status: 404 }
      );
    }
    
    // Transformer les souris
    const dbMice = dbSimulation.mice || [];
    const mice: Mouse[] = dbMice.map((dbMouse: any, index: number) => ({
      id: dbMouse.id,
      name: dbMouse.name,
      position: (dbMouse.final_position || dbMouse.initial_position) as { x: number; y: number },
      movementDelay: 500, // Valeur par défaut
      health: dbMouse.health,
      happiness: dbMouse.happiness,
      energy: dbMouse.energy,
      cheeseFound: dbMouse.cheese_found,
      moves: dbMouse.moves,
      isAlive: dbMouse.is_alive,
      tag: index + 1
    }));
    
    // Construire l'objet Simulation
    const simulation: Simulation = {
      id: dbSimulation.id,
      labyrinthId: dbSimulation.labyrinth_id,
      labyrinth,
      mice,
      rules,
      status: dbSimulation.status as any,
      currentTurn: 0,
      maxTurns: Infinity,
      startTime: dbSimulation.start_time,
      endTime: dbSimulation.end_time,
      results: dbSimulation.results as any
    };
    
    return NextResponse.json({
      success: true,
      data: {
        simulation,
        shareInfo: {
          viewCount: sharedData.view_count,
          createdAt: sharedData.created_at,
          expiresAt: sharedData.expires_at
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching shared simulation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch shared simulation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

