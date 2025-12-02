// Utilitaires pour synchroniser les simulations avec Supabase en temps réel

import { Simulation, Mouse, Labyrinth } from './types';
import { updateSimulation, updateMouse, supabase } from './supabaseClient';

/**
 * Synchronise uniquement la grille du labyrinthe (pour les fromages collectés)
 * NOTE: Cette fonction stocke l'état actuel de la grille dans la simulation (pas dans le labyrinthe)
 * pour permettre de réutiliser le labyrinthe avec tous ses fromages pour de nouvelles simulations.
 */
export async function syncLabyrinthGrid(labyrinth: Labyrinth, simulationId: string) {
  if (!supabase) {
    return;
  }

  try {
    // Stocker l'état actuel de la grille dans la simulation (dans results.current_grid_state)
    // Cela permet à la page partagée de voir les fromages disparaître sans affecter le labyrinthe original
    const { getSimulationById, updateSimulation } = await import('./supabaseClient');
    const dbSimulation = await getSimulationById(simulationId);
    const currentResults = (dbSimulation as any).results as any || {};
    
    await updateSimulation(simulationId, {
      results: {
        ...currentResults,
        current_grid_state: {
          grid: labyrinth.grid,
          cheesePositions: labyrinth.cheesePositions
        }
      } as unknown as Record<string, unknown>
    });
    
    console.log(`🧀 État de la grille synchronisé dans la simulation (${labyrinth.cheesePositions.length} fromages restants) - Labyrinthe original préservé`);
  } catch (error) {
    console.error('❌ Error syncing grid state to simulation:', error);
  }
}

/**
 * Synchronise une simulation avec Supabase
 */
export async function syncSimulationToDatabase(simulation: Simulation, simulationId: string) {
  if (!supabase) {
    return; // Supabase non configuré, ignorer
  }

  try {
    // Stocker l'état actuel de la grille dans la simulation (dans le champ results)
    // Cela permet à la page partagée de voir les fromages disparaître sans affecter le labyrinthe original
    const currentGridState = {
      grid: simulation.labyrinth.grid,
      cheesePositions: simulation.labyrinth.cheesePositions
    };
    
    // Mettre à jour la simulation avec l'état actuel de la grille
    await updateSimulation(simulationId, {
      status: simulation.status,
      end_time: simulation.endTime,
      results: {
        ...((simulation.results as any) || {}),
        current_grid_state: currentGridState
      } as unknown as Record<string, unknown>
    });

    // NE PAS mettre à jour la grille du labyrinthe dans la base de données
    // La grille originale doit rester intacte pour permettre de réutiliser le labyrinthe
    // avec tous ses fromages pour de nouvelles simulations.
    // L'état actuel de la grille est stocké dans simulations.results.current_grid_state
    console.log(`✅ Simulation synchronisée (grille originale préservée - ${simulation.labyrinth.cheesePositions.length} fromages restants dans l'état actuel)`);

    // Mettre à jour chaque souris en parallèle pour améliorer les performances
    const mouseUpdates = simulation.mice.map(async (mouse) => {
      try {
        const result = await updateMouse(mouse.id, {
          final_position: mouse.position as unknown as Record<string, unknown>,
          health: mouse.health,
          happiness: mouse.happiness,
          energy: mouse.energy,
          cheese_found: mouse.cheeseFound,
          moves: mouse.moves,
          is_alive: mouse.isAlive
        });
        console.log(`✅ Souris ${mouse.name} synchronisée: position (${mouse.position.x}, ${mouse.position.y})`);
        return result;
      } catch (error) {
        // Si la souris n'existe pas encore, on l'ignore (elle sera créée lors du partage)
        console.warn(`⚠️ Mouse ${mouse.id} (${mouse.name}) not found in database, skipping update`);
        throw error;
      }
    });
    
    // Attendre toutes les mises à jour en parallèle
    const results = await Promise.allSettled(mouseUpdates);
    const failed = results.filter(r => r.status === 'rejected').length;
    if (failed > 0) {
      console.warn(`⚠️ ${failed} souris n'ont pas pu être synchronisées`);
    } else {
      console.log(`✅ Toutes les ${simulation.mice.length} souris synchronisées avec succès`);
    }
  } catch (error) {
    console.error('❌ Error syncing simulation to database:', error);
  }
}

/**
 * Écoute les changements d'une simulation via Supabase Realtime
 */
export function subscribeToSimulationUpdates(
  simulationId: string,
  onUpdate: (simulation: Simulation) => void
) {
  if (!supabase) {
    return () => {}; // Retourner une fonction de nettoyage vide
  }

  // Debounce pour éviter trop de mises à jour
  let updateTimeout: NodeJS.Timeout | null = null;
  let lastUpdateTime = 0;
  const DEBOUNCE_DELAY = 200; // 200ms entre les mises à jour pour plus de réactivité

  const debouncedUpdate = () => {
    const now = Date.now();
    if (now - lastUpdateTime < DEBOUNCE_DELAY) {
      // Annuler la mise à jour précédente
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
      // Programmer une nouvelle mise à jour
      updateTimeout = setTimeout(() => {
        lastUpdateTime = Date.now();
        loadSimulationFromDatabase(simulationId).then(onUpdate).catch(error => {
          console.error('Error loading simulation update:', error);
        });
        updateTimeout = null;
      }, DEBOUNCE_DELAY);
    } else {
      // Mise à jour immédiate si assez de temps s'est écoulé
      lastUpdateTime = Date.now();
      loadSimulationFromDatabase(simulationId).then(onUpdate).catch(error => {
        console.error('Error loading simulation update:', error);
      });
    }
  };

  // Récupérer l'ID du labyrinthe depuis la simulation
  let labyrinthId: string | null = null;
  
  // Écouter les changements sur la table simulations
  const simulationChannel = supabase
    .channel(`simulation:${simulationId}`, {
      config: {
        broadcast: { self: true },
        presence: { key: simulationId }
      }
    })
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'simulations',
        filter: `id=eq.${simulationId}`
      },
      async (payload) => {
        console.log('📡 Realtime: Simulation updated:', payload);
        // Récupérer l'ID du labyrinthe si on ne l'a pas encore
        if (!labyrinthId && (payload.new as any).labyrinth_id) {
          labyrinthId = (payload.new as any).labyrinth_id;
        }
        debouncedUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'mice',
        filter: `simulation_id=eq.${simulationId}`
      },
      (payload) => {
        console.log('📡 Realtime: Mouse updated:', payload.new);
        debouncedUpdate();
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'labyrinths'
      },
      async (payload) => {
        // Vérifier si c'est le labyrinthe de cette simulation
        try {
          const sim = await loadSimulationFromDatabase(simulationId);
          if (sim.labyrinth.id === (payload.new as any).id) {
            const gridData = (payload.new as any).grid_data;
            console.log('📡 Realtime: Labyrinth grid updated (cheese collected)');
            console.log(`   Fromages restants: ${gridData?.cheesePositions?.length || 0}`);
            debouncedUpdate();
          }
        } catch (error) {
          // Si on ne peut pas charger, déclencher quand même la mise à jour
          console.log('📡 Realtime: Labyrinth updated (triggering update)');
          debouncedUpdate();
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Abonné aux mises à jour Realtime pour la simulation:', simulationId);
        // Charger la simulation pour obtenir l'ID du labyrinthe
        loadSimulationFromDatabase(simulationId).then(sim => {
          labyrinthId = sim.labyrinth.id;
        });
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Erreur d\'abonnement Realtime:', status);
      } else {
        console.log('🔄 Statut Realtime:', status);
      }
    });

  // Retourner une fonction pour se désabonner
  return () => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    supabase.removeChannel(simulationChannel);
  };
}

/**
 * Charge une simulation depuis la base de données
 */
async function loadSimulationFromDatabase(simulationId: string): Promise<Simulation> {
  const { getSimulationById } = await import('./supabaseClient');
  const { getRulesById } = await import('./rules');
  
  const dbSimulation = await getSimulationById(simulationId);
  
  // Transformer les données
  const dbLabyrinth = (dbSimulation as any).labyrinths;
  const gridData = dbLabyrinth.grid_data as any;
  
  // Vérifier si un état de grille actuel est stocké dans la simulation
  // (pour voir les fromages collectés sans affecter le labyrinthe original)
  const simulationResults = (dbSimulation as any).results as any;
  const currentGridState = simulationResults?.current_grid_state;
  
  let grid: any[][];
  let cheesePositions: { x: number; y: number }[];
  
  if (currentGridState && currentGridState.grid && currentGridState.cheesePositions) {
    // Utiliser l'état actuel de la grille (avec fromages collectés)
    console.log('📊 Chargement de l\'état actuel de la grille depuis la simulation');
    grid = currentGridState.grid.map((row: any[]) => [...row]);
    cheesePositions = currentGridState.cheesePositions || [];
  } else {
    // Utiliser la grille originale du labyrinthe (tous les fromages présents)
    console.log('📊 Chargement de la grille originale du labyrinthe');
    grid = gridData.grid.map((row: any[]) => [...row]);
    cheesePositions = gridData.cheesePositions || [];
  }
  
  // S'assurer que startPositions est toujours un tableau avec au moins une position
  let startPositions = gridData.startPositions || [];
  if (!Array.isArray(startPositions) || startPositions.length === 0) {
    // Si aucune position de départ n'est définie, utiliser une position par défaut (1, 1)
    startPositions = [{ x: 1, y: 1 }];
  }
  
  const labyrinth = {
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
  
  let resolvedRules;
  try {
    // Essayer d'abord les règles prédéfinies
    resolvedRules = getRulesById((dbSimulation as any).rules_id);
    if (!resolvedRules) {
      // Sinon, récupérer depuis Supabase
      const { getSimulationRuleById } = await import('./supabaseClient');
      const dbRule = await getSimulationRuleById((dbSimulation as any).rules_id);
      resolvedRules = dbRule.rules_data as any;
    }
  } catch (error) {
    console.error('Error loading rules:', error);
    // Règle par défaut en cas d'erreur
    resolvedRules = getRulesById('classic') || {
      id: 'classic',
      name: 'Classique',
      description: 'Règles par défaut',
      turnDuration: 500,
      energyConsumption: 1,
      happinessDecay: 1,
      isolationPenalty: 1,
      cheeseBonus: 20,
      proximityBonus: 5,
      maxEnergy: 100,
      maxHappiness: 100,
      winConditions: []
    };
  }
  
  const dbMice = (dbSimulation as any).mice || [];
  const mice: Mouse[] = dbMice.map((dbMouse: any, index: number) => ({
    id: dbMouse.id,
    name: dbMouse.name,
    position: (dbMouse.final_position || dbMouse.initial_position) as { x: number; y: number },
    movementDelay: 500,
    health: dbMouse.health,
    happiness: dbMouse.happiness,
    energy: dbMouse.energy,
    cheeseFound: dbMouse.cheese_found,
    moves: dbMouse.moves,
    isAlive: dbMouse.is_alive,
    tag: index + 1
  }));
  
  return {
    id: (dbSimulation as any).id,
    labyrinthId: (dbSimulation as any).labyrinth_id,
    labyrinth,
    mice,
    rules: resolvedRules,
    status: (dbSimulation as any).status as any,
    currentTurn: 0,
    maxTurns: Infinity,
    startTime: (dbSimulation as any).start_time,
    endTime: (dbSimulation as any).end_time,
    results: (dbSimulation as any).results
  };
}

