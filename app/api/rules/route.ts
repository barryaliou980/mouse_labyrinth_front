import { NextRequest, NextResponse } from 'next/server';
import { 
  getSimulationRules, 
  createSimulationRule, 
  updateSimulationRule, 
  deleteSimulationRule 
} from '@/lib/supabaseClient';

// GET /api/rules - Récupérer toutes les règles
export async function GET() {
  try {
    const rules = await getSimulationRules();
    
    // Transformer les données de la base vers le format attendu
    const formattedRules = rules.map((dbRule) => ({
      id: dbRule.id,
      name: dbRule.name,
      description: dbRule.description,
      turnDuration: dbRule.rules_data.turnDuration,
      energyConsumption: dbRule.rules_data.energyConsumption,
      happinessDecay: dbRule.rules_data.happinessDecay,
      isolationPenalty: dbRule.rules_data.isolationPenalty,
      cheeseBonus: dbRule.rules_data.cheeseBonus,
      proximityBonus: dbRule.rules_data.proximityBonus,
      maxEnergy: dbRule.rules_data.maxEnergy,
      maxHappiness: dbRule.rules_data.maxHappiness,
      winConditions: dbRule.rules_data.winConditions
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedRules
    });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rules',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rules - Créer une nouvelle règle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, turnDuration, energyConsumption, happinessDecay, isolationPenalty, cheeseBonus, proximityBonus, maxEnergy, maxHappiness, winConditions } = body;

    if (!name || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: name, description'
        },
        { status: 400 }
      );
    }

    const rulesData = {
      turnDuration: turnDuration || 500,
      energyConsumption: energyConsumption || 1,
      happinessDecay: happinessDecay || 1,
      isolationPenalty: isolationPenalty || 1,
      cheeseBonus: cheeseBonus || 20,
      proximityBonus: proximityBonus || 5,
      maxEnergy: maxEnergy || 100,
      maxHappiness: maxHappiness || 100,
      winConditions: winConditions || []
    };

    const newRule = await createSimulationRule({
      name,
      description,
      rules_data: rulesData,
      is_predefined: false
    });

    // Transformer les données de la base vers le format attendu
    const formattedRule = {
      id: newRule.id,
      name: newRule.name,
      description: newRule.description,
      turnDuration: newRule.rules_data.turnDuration,
      energyConsumption: newRule.rules_data.energyConsumption,
      happinessDecay: newRule.rules_data.happinessDecay,
      isolationPenalty: newRule.rules_data.isolationPenalty,
      cheeseBonus: newRule.rules_data.cheeseBonus,
      proximityBonus: newRule.rules_data.proximityBonus,
      maxEnergy: newRule.rules_data.maxEnergy,
      maxHappiness: newRule.rules_data.maxHappiness,
      winConditions: newRule.rules_data.winConditions
    };

    return NextResponse.json({
      success: true,
      data: formattedRule
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
