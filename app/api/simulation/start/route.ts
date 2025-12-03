import { NextRequest, NextResponse } from 'next/server';
import { createSimulation, createMouse, getSimulationRuleById } from '@/lib/supabaseClient';
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
    
    // Récupérer les règles depuis la base de données ou les règles prédéfinies
    let rules;
    try {
      // Vérifier si c'est un UUID (règle de la DB) ou un ID simple (règle prédéfinie)
      const isUUID = rulesId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
      
      if (isUUID) {
        // Récupérer depuis la base de données
        const dbRule = await getSimulationRuleById(rulesId);
        rules = dbRule.rules_data as any;
        // S'assurer que l'ID est présent
        if (!rules.id) {
          rules.id = dbRule.id;
        }
        if (!rules.name) {
          rules.name = dbRule.name;
        }
        if (!rules.description) {
          rules.description = dbRule.description;
        }
      } else {
        // Règle prédéfinie
        rules = getRulesById(rulesId);
      }
      
      if (!rules) {
        return NextResponse.json(
          {
            success: false,
            error: 'Règles non trouvées'
          },
          { status: 400 }
        );
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des règles:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erreur lors de la récupération des règles: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
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
      if (!mouseData.name || !mouseData.movementDelay || !mouseData.startPosition) {
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
        movementDelay: mouseData.movementDelay,
        health: rules.maxEnergy,
        happiness: rules.maxHappiness,
        energy: rules.maxEnergy,
        cheeseFound: 0,
        moves: 0,
        isAlive: true,
        tag: mouseData.tag || (i + 1), // Utiliser le tag fourni ou l'index + 1
        algorithm: mouseData.algorithm || 'greedy' // Utiliser l'algorithme fourni ou 'greedy' par défaut
      };
      
      // Forcer la définition du tag si il n'est pas défini
      if (!mouse.tag) {
        mouse.tag = i + 1;
      }
      
      console.log(` Souris créée: ${mouse.name}, Tag: ${mouse.tag}, Données reçues:`, mouseData);
      console.log(` Tag reçu: ${mouseData.tag}, Tag assigné: ${mouse.tag}`);
      
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
