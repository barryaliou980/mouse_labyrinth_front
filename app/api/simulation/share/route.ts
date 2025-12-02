import { NextRequest, NextResponse } from 'next/server';
import { createSharedSimulation, deleteSharedSimulation, getSimulationById, createSimulation, createMouse, getLabyrinthById, createLabyrinth, getSimulationRuleById, createSimulationRule, supabase } from '@/lib/supabaseClient';
import { Simulation } from '@/lib/types';
import { getRulesById } from '@/lib/rules';

// POST /api/simulation/share - Créer un lien de partage pour une simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { simulationId, simulation, expiresInDays } = body;
    
    if (!simulationId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation ID is required'
        },
        { status: 400 }
      );
    }
    
    // Vérifier si la simulation existe dans la base de données
    let dbSimulation;
    let finalSimulationId = simulationId;
    
    try {
      dbSimulation = await getSimulationById(simulationId);
    } catch (error) {
      // Si la simulation n'existe pas, la sauvegarder si on a les données
      if (simulation) {
        try {
          // Vérifier et créer le labyrinthe si nécessaire
          let labyrinthId = simulation.labyrinthId;
          try {
            await getLabyrinthById(labyrinthId);
          } catch (labyrinthError) {
            // Le labyrinthe n'existe pas, le créer
            if (simulation.labyrinth) {
              const newLabyrinth = await createLabyrinth({
                name: simulation.labyrinth.name,
                description: simulation.labyrinth.description,
                grid_data: {
                  width: simulation.labyrinth.width,
                  height: simulation.labyrinth.height,
                  grid: simulation.labyrinth.grid,
                  startPositions: simulation.labyrinth.startPositions,
                  cheesePositions: simulation.labyrinth.cheesePositions
                }
              });
              labyrinthId = newLabyrinth.id;
            } else {
              throw new Error('Labyrinth not found and cannot be created without labyrinth data');
            }
          }
          
          // Vérifier et créer la règle si nécessaire
          let rulesId = simulation.rules.id;
          const isPredefinedRule = !rulesId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
          
          if (isPredefinedRule) {
            // C'est une règle prédéfinie, chercher par nom dans la base de données
            try {
              // Chercher une règle avec le même nom (pour les règles prédéfinies)
              if (supabase) {
                const { data: existingRules, error: searchError } = await supabase
                  .from('simulation_rules')
                  .select('*')
                  .eq('name', simulation.rules.name)
                  .eq('is_predefined', true)
                  .maybeSingle();
                
                if (existingRules && !searchError) {
                  rulesId = existingRules.id;
                } else {
                  // La règle n'existe pas, la créer
                  const newRule = await createSimulationRule({
                    name: simulation.rules.name,
                    description: simulation.rules.description,
                    rules_data: simulation.rules as unknown as Record<string, unknown>,
                    is_predefined: true
                  });
                  rulesId = newRule.id;
                }
              } else {
                // Supabase non configuré, créer quand même la règle
                const newRule = await createSimulationRule({
                  name: simulation.rules.name,
                  description: simulation.rules.description,
                  rules_data: simulation.rules as unknown as Record<string, unknown>,
                  is_predefined: true
                });
                rulesId = newRule.id;
              }
            } catch (ruleError) {
              console.error('Error finding/creating rule:', ruleError);
              // En cas d'erreur, essayer de créer la règle
              try {
                const newRule = await createSimulationRule({
                  name: simulation.rules.name,
                  description: simulation.rules.description,
                  rules_data: simulation.rules as unknown as Record<string, unknown>,
                  is_predefined: true
                });
                rulesId = newRule.id;
              } catch (createError) {
                throw new Error(`Failed to create rule: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
              }
            }
          } else {
            // C'est une règle personnalisée, vérifier qu'elle existe
            try {
              await getSimulationRuleById(rulesId);
            } catch (ruleError) {
              throw new Error('Custom rule not found in database');
            }
          }
          
          // Créer la simulation dans la base de données
          dbSimulation = await createSimulation({
            labyrinth_id: labyrinthId,
            rules_id: rulesId,
            start_time: simulation.startTime || new Date().toISOString(),
            status: simulation.status,
            end_time: simulation.endTime
          });
          
          // Utiliser l'ID de la simulation sauvegardée
          finalSimulationId = dbSimulation.id;
          
          // Créer les souris dans la base de données
          for (const mouse of simulation.mice) {
            await createMouse({
              simulation_id: finalSimulationId,
              name: mouse.name,
              intelligence_type: 'smart', // Valeur par défaut
              initial_position: mouse.position,
              final_position: mouse.position,
              health: mouse.health,
              happiness: mouse.happiness,
              energy: mouse.energy,
              cheese_found: mouse.cheeseFound,
              moves: mouse.moves,
              is_alive: mouse.isAlive
            });
          }
        } catch (saveError) {
          console.error('Error saving simulation:', saveError);
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to save simulation. Please ensure the simulation is properly configured.',
              details: saveError instanceof Error ? saveError.message : 'Unknown error'
            },
            { status: 500 }
          );
        }
      } else {
        return NextResponse.json(
          {
            success: false,
            error: 'Simulation not found in database. Please provide the full simulation data to save it first.'
          },
          { status: 404 }
        );
      }
    }
    
    // Créer le partage avec l'ID final (soit l'original, soit celui sauvegardé)
    const sharedSimulation = await createSharedSimulation(finalSimulationId, expiresInDays);
    
    // Construire l'URL de partage
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (request.headers.get('origin') || 'http://localhost:3000');
    const shareUrl = `${baseUrl}/simulation/view/${sharedSimulation.share_token}`;
    
    return NextResponse.json({
      success: true,
      data: {
        shareToken: sharedSimulation.share_token,
        shareUrl,
        expiresAt: sharedSimulation.expires_at,
        viewCount: sharedSimulation.view_count,
        isActive: sharedSimulation.is_active,
        savedSimulationId: finalSimulationId // Retourner l'ID de la simulation sauvegardée
      }
    });
    
  } catch (error) {
    console.error('Error creating share:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create share',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/simulation/share - Désactiver un partage
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Share token is required'
        },
        { status: 400 }
      );
    }
    
    await deleteSharedSimulation(token);
    
    return NextResponse.json({
      success: true,
      message: 'Share deactivated successfully'
    });
    
  } catch (error) {
    console.error('Error deleting share:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete share',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

