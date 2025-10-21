import { NextRequest, NextResponse } from 'next/server';
import { createSimulation, createMouse } from '@/lib/supabaseClient';
import { getRulesById } from '@/lib/rules';
import { Simulation, Mouse, IntelligenceType } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

// POST /api/simulation/start - Démarrer une nouvelle simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { labyrinthId, mice, rulesId } = body;
    
    // Validation des données
    if (!labyrinthId || !mice || !rulesId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: labyrinthId, mice, rulesId'
        },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(mice) || mice.length === 0 || mice.length > 3) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mice must be an array with 1-3 elements'
        },
        { status: 400 }
      );
    }
    
    // Récupérer les règles
    const rules = getRulesById(rulesId);
    if (!rules) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid rules ID'
        },
        { status: 400 }
      );
    }
    
    // Pour les règles prédéfinies, on ne les stocke pas en base
    // On utilise la simulation côté client
    const simulationId = uuidv4();
    
    // Vérifier si c'est une règle prédéfinie (pas d'UUID)
    const isPredefinedRule = !rulesId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    
    let simulation;
    if (isPredefinedRule) {
      // Pour les règles prédéfinies, créer une simulation côté client
      simulation = {
        id: simulationId,
        labyrinth_id: labyrinthId,
        rules_id: rulesId,
        start_time: new Date().toISOString(),
        status: 'running'
      };
    } else {
      // Pour les règles personnalisées, les stocker en base
      simulation = await createSimulation({
        labyrinth_id: labyrinthId,
        rules_id: rulesId,
        start_time: new Date().toISOString(),
        status: 'running'
      });
    }
    
    // Créer les souris
    const createdMice: Mouse[] = [];
    for (let i = 0; i < mice.length; i++) {
      const mouseData = mice[i];
      const mouseId = uuidv4();
      
      // Validation des données de la souris
      if (!mouseData.name || !mouseData.intelligenceType || !mouseData.startPosition) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid mouse data at index ${i}`
          },
          { status: 400 }
        );
      }
      
      // Transformer en format Mouse
      const mouse: Mouse = {
        id: mouseId,
        name: mouseData.name,
        position: mouseData.startPosition,
        intelligenceType: mouseData.intelligenceType as IntelligenceType,
        health: rules.maxEnergy,
        happiness: rules.maxHappiness,
        energy: rules.maxEnergy,
        cheeseFound: 0,
        moves: 0,
        isAlive: true
      };
      
      // Pour les règles prédéfinies, ne pas stocker en base
      if (!isPredefinedRule) {
        const dbMouse = await createMouse({
          simulation_id: simulationId,
          name: mouseData.name,
          intelligence_type: mouseData.intelligenceType,
          initial_position: mouseData.startPosition,
          health: rules.maxEnergy,
          happiness: rules.maxHappiness,
          energy: rules.maxEnergy,
          cheese_found: 0,
          moves: 0,
          is_alive: true
        });
      }
      
      createdMice.push(mouse);
    }
    
    // Créer l'objet simulation complet
    const fullSimulation: Simulation = {
      id: simulationId,
      labyrinthId,
      labyrinth: {} as any, // Sera rempli par le client si nécessaire
      mice: createdMice,
      rules,
      status: 'running',
      currentTurn: 0,
      maxTurns: Infinity, // Simulation infinie par défaut
      startTime: simulation.start_time
    };
    
    return NextResponse.json({
      success: true,
      data: fullSimulation
    });
    
  } catch (error) {
    console.error('Error starting simulation:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to start simulation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
