import { NextRequest, NextResponse } from 'next/server';
import { getSimulationById, updateSimulation } from '@/lib/supabaseClient';
import { SimulationResults, MouseResult } from '@/lib/types';

// GET /api/simulation/results - Récupérer les résultats d'une simulation
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
    
    if (dbSimulation.status !== 'completed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Simulation is not completed yet'
        },
        { status: 400 }
      );
    }
    
    // Si les résultats sont déjà stockés, les retourner
    if (dbSimulation.results) {
      return NextResponse.json({
        success: true,
        data: dbSimulation.results
      });
    }
    
    // Sinon, calculer les résultats
    const results = calculateSimulationResults(dbSimulation);
    
    // Sauvegarder les résultats
    await updateSimulation(simulationId, {
      results: results
    });
    
    return NextResponse.json({
      success: true,
      data: results
    });
    
  } catch (error) {
    console.error('Error fetching simulation results:', error);
    
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
        error: 'Failed to fetch simulation results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/simulation/results - Sauvegarder les résultats d'une simulation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { simulationId, results } = body;
    
    if (!simulationId || !results) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: simulationId, results'
        },
        { status: 400 }
      );
    }
    
    // Sauvegarder les résultats
    await updateSimulation(simulationId, {
      results: results,
      status: 'completed',
      end_time: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: true,
      message: 'Results saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving simulation results:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to save simulation results',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Fonction pour calculer les résultats d'une simulation
function calculateSimulationResults(dbSimulation: any): SimulationResults {
  const startTime = new Date(dbSimulation.start_time);
  const endTime = new Date(dbSimulation.end_time || new Date());
  const duration = endTime.getTime() - startTime.getTime();
  
  // Calculer les résultats pour chaque souris
  const miceResults: MouseResult[] = dbSimulation.mice.map((mouse: any) => {
    const isWinner = mouse.cheese_found > 0 && mouse.is_alive;
    
    return {
      mouseId: mouse.id,
      mouseName: mouse.name,
      finalPosition: mouse.final_position || mouse.initial_position,
      cheeseFound: mouse.cheese_found,
      totalMoves: mouse.moves,
      finalHealth: mouse.health,
      finalHappiness: mouse.happiness,
      finalEnergy: mouse.energy,
      isWinner,
      causeOfDeath: !mouse.is_alive ? 'Energy or happiness depleted' : undefined
    };
  });
  
  // Déterminer le gagnant
  const winner = miceResults
    .filter(mouse => mouse.isWinner)
    .sort((a, b) => b.cheeseFound - a.cheeseFound)[0];
  
  // Générer un résumé
  const summary = generateSummary(miceResults, duration, winner);
  
  return {
    totalTurns: Math.max(...miceResults.map(m => m.totalMoves)),
    duration,
    miceResults,
    winner: winner?.mouseId,
    summary
  };
}

// Fonction pour générer un résumé textuel
function generateSummary(miceResults: MouseResult[], duration: number, winner?: MouseResult): string {
  const totalMice = miceResults.length;
  const aliveMice = miceResults.filter(m => m.finalHealth > 0 && m.finalHappiness > 0).length;
  const totalCheese = miceResults.reduce((sum, m) => sum + m.cheeseFound, 0);
  const avgMoves = miceResults.reduce((sum, m) => sum + m.totalMoves, 0) / totalMice;
  
  let summary = `Simulation terminée en ${Math.round(duration / 1000)}s. `;
  summary += `${aliveMice}/${totalMice} souris ont survécu. `;
  summary += `Total de fromages trouvés: ${totalCheese}. `;
  summary += `Moyenne des mouvements: ${Math.round(avgMoves)}. `;
  
  if (winner) {
    summary += `Gagnant: ${winner.mouseName} avec ${winner.cheeseFound} fromage(s).`;
  } else {
    summary += 'Aucun gagnant déterminé.';
  }
  
  return summary;
}
