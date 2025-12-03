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
    console.log('API: Début du chargement des règles depuis la DB...');
    const rules = await getSimulationRules();
    console.log('API: Règles récupérées:', rules.length);
    
    if (!rules || rules.length === 0) {
      console.log('API: Aucune règle trouvée dans la DB');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Transformer les données de la base vers le format attendu
    const formattedRules = rules
      .map((dbRule) => {
        try {
          const rulesData = dbRule.rules_data as any;
          return {
            id: dbRule.id,
            name: dbRule.name,
            description: dbRule.description,
            turnDuration: rulesData?.turnDuration || 500,
            energyConsumption: rulesData?.energyConsumption || 1,
            happinessDecay: rulesData?.happinessDecay || 1,
            isolationPenalty: rulesData?.isolationPenalty || 1,
            cheeseBonus: rulesData?.cheeseBonus || 20,
            proximityBonus: rulesData?.proximityBonus || 5,
            maxEnergy: rulesData?.maxEnergy || 100,
            maxHappiness: rulesData?.maxHappiness || 100,
            simulationMode: rulesData?.simulationMode,
            winConditions: rulesData?.winConditions || []
          };
        } catch (err) {
          console.error('Erreur lors du formatage d\'une règle:', err, dbRule);
          return null;
        }
      })
      .filter((rule): rule is NonNullable<typeof rule> => rule !== null);
    
    console.log('API: Règles formatées:', formattedRules.length);
    
    return NextResponse.json({
      success: true,
      data: formattedRules
    });
  } catch (error) {
    console.error('API: Erreur lors du chargement des règles:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('API: Détails de l\'erreur:', errorMessage);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rules',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// POST /api/rules - Créer une nouvelle règle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, turnDuration, energyConsumption, happinessDecay, isolationPenalty, cheeseBonus, proximityBonus, maxEnergy, maxHappiness, simulationMode, winConditions } = body;

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
      simulationMode: simulationMode || undefined,
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
      simulationMode: newRule.rules_data.simulationMode,
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
