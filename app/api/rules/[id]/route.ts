import { NextRequest, NextResponse } from 'next/server';
import { 
  getSimulationRuleById, 
  updateSimulationRule, 
  deleteSimulationRule 
} from '@/lib/supabaseClient';

// GET /api/rules/[id] - Récupérer une règle par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rule = await getSimulationRuleById(id);
    
    // Transformer les données de la base vers le format attendu
    const formattedRule = {
      id: rule.id,
      name: rule.name,
      description: rule.description,
      turnDuration: rule.rules_data.turnDuration,
      energyConsumption: rule.rules_data.energyConsumption,
      happinessDecay: rule.rules_data.happinessDecay,
      isolationPenalty: rule.rules_data.isolationPenalty,
      cheeseBonus: rule.rules_data.cheeseBonus,
      proximityBonus: rule.rules_data.proximityBonus,
      maxEnergy: rule.rules_data.maxEnergy,
      maxHappiness: rule.rules_data.maxHappiness,
      winConditions: rule.rules_data.winConditions
    };
    
    return NextResponse.json({
      success: true,
      data: formattedRule
    });
  } catch (error) {
    console.error('Error fetching rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Rule not found',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 404 }
    );
  }
}

// PUT /api/rules/[id] - Mettre à jour une règle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, turnDuration, energyConsumption, happinessDecay, isolationPenalty, cheeseBonus, proximityBonus, maxEnergy, maxHappiness, winConditions } = body;

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

    const updatedRule = await updateSimulationRule(id, {
      name,
      description,
      rules_data: rulesData,
      is_predefined: false
    });

    // Transformer les données de la base vers le format attendu
    const formattedRule = {
      id: updatedRule.id,
      name: updatedRule.name,
      description: updatedRule.description,
      turnDuration: updatedRule.rules_data.turnDuration,
      energyConsumption: updatedRule.rules_data.energyConsumption,
      happinessDecay: updatedRule.rules_data.happinessDecay,
      isolationPenalty: updatedRule.rules_data.isolationPenalty,
      cheeseBonus: updatedRule.rules_data.cheeseBonus,
      proximityBonus: updatedRule.rules_data.proximityBonus,
      maxEnergy: updatedRule.rules_data.maxEnergy,
      maxHappiness: updatedRule.rules_data.maxHappiness,
      winConditions: updatedRule.rules_data.winConditions
    };

    return NextResponse.json({
      success: true,
      data: formattedRule
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rules/[id] - Supprimer une règle
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteSimulationRule(id);
    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete rule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
