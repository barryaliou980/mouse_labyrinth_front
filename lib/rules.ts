import { SimulationRules, WinCondition } from './types';

// Règles prédéfinies pour les simulations
export const predefinedRules: { [key: string]: SimulationRules } = {
  classic: {
    id: 'classic',
    name: 'Classique',
    description: 'Règles de base pour une simulation équilibrée (souris immortelles)',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 20,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    winConditions: [
      {
        type: 'cheese_count',
        value: 10,
        description: 'Trouver 10 fromages'
      },
      {
        type: 'survival',
        value: 1000,
        description: 'Survivre 1000 tours'
      }
    ]
  },
  
  multiCheese: {
    id: 'multiCheese',
    name: 'Multi-Fromages',
    description: 'Règles pour labyrinthes avec plusieurs fromages à collecter',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 20,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    winConditions: [
      {
        type: 'cheese_count',
        value: 1, // Gagne dès qu'un fromage est trouvé (logique gérée par PythonSimulation)
        description: 'Collecter tous les fromages disponibles'
      }
    ]
  },
  
  survival: {
    id: 'survival',
    name: 'Survie',
    description: 'Mode survie avec consommation d\'énergie élevée (souris immortelles)',
    turnDuration: 300,
    energyConsumption: 2,
    happinessDecay: 1,
    isolationPenalty: 2,
    cheeseBonus: 30,
    proximityBonus: 8,
    maxEnergy: 80,
    maxHappiness: 80,
    winConditions: [
      {
        type: 'survival',
        value: 2000,
        description: 'Survivre 2000 tours'
      },
      {
        type: 'cheese_count',
        value: 15,
        description: 'Trouver 15 fromages'
      }
    ]
  },
  
  social: {
    id: 'social',
    name: 'Social',
    description: 'Mode coopératif avec bonus de proximité',
    turnDuration: 400,
    energyConsumption: 1,
    happinessDecay: 0.5,
    isolationPenalty: 10,
    cheeseBonus: 15,
    proximityBonus: 15,
    maxEnergy: 120,
    maxHappiness: 120,
    winConditions: [
      {
        type: 'happiness',
        value: 80,
        description: 'Maintenir un bonheur de 80%'
      },
      {
        type: 'cheese_count',
        value: 8,
        description: 'Trouver 8 fromages'
      }
    ]
  },
  
  speed: {
    id: 'speed',
    name: 'Vitesse',
    description: 'Mode rapide avec tours courts',
    turnDuration: 200,
    energyConsumption: 3,
    happinessDecay: 1.5,
    isolationPenalty: 2,
    cheeseBonus: 25,
    proximityBonus: 3,
    maxEnergy: 90,
    maxHappiness: 90,
    winConditions: [
      {
        type: 'cheese_count',
        value: 12,
        description: 'Trouver 12 fromages rapidement'
      }
    ]
  },
  
  immortal: {
    id: 'immortal',
    name: 'Immortelle',
    description: 'Les souris ne meurent jamais - simulation éternelle',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 25,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    winConditions: [
      {
        type: 'cheese_count',
        value: 20,
        description: 'Trouver 20 fromages'
      },
      {
        type: 'survival',
        value: 5000,
        description: 'Survivre 5000 tours'
      }
    ]
  },
  
  normal: {
    id: 'normal',
    name: 'Normal',
    description: 'Mode normal - pas de mort, règles classiques',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 20,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    simulationMode: 'normal',
    winConditions: [
      {
        type: 'cheese_count',
        value: 10,
        description: 'Trouver 10 fromages'
      }
    ]
  },
  
  survie: {
    id: 'survie',
    name: 'Survie',
    description: 'Mode survie - perte de 1 point de vie tous les 5 pas, restauration à 10 avec fromage',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 20,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    simulationMode: 'survie',
    winConditions: [
      {
        type: 'cheese_count',
        value: 10,
        description: 'Trouver 10 fromages'
      }
    ]
  },
  
  mortelle: {
    id: 'mortelle',
    name: 'Mortelle',
    description: 'Mode mortelle - perte de 10 points de vie tous les 5 pas, +10 santé avec fromage, les souris peuvent mourir',
    turnDuration: 500,
    energyConsumption: 1,
    happinessDecay: 1,
    isolationPenalty: 1,
    cheeseBonus: 20,
    proximityBonus: 5,
    maxEnergy: 100,
    maxHappiness: 100,
    simulationMode: 'mortelle',
    winConditions: [
      {
        type: 'cheese_count',
        value: 10,
        description: 'Trouver 10 fromages'
      }
    ]
  }
};

// Fonction pour obtenir les règles par ID
export function getRulesById(id: string): SimulationRules | undefined {
  return predefinedRules[id];
}

// Fonction pour obtenir toutes les règles disponibles
export function getAllRules(): SimulationRules[] {
  return Object.values(predefinedRules);
}

// Fonction pour valider les conditions de victoire
export function checkWinConditions(
  mouse: { cheeseFound: number; energy: number; happiness: number },
  rules: SimulationRules,
  currentTurn: number
): boolean {
  // Pour gagner, la souris doit TOUJOURS avoir trouvé au moins un fromage
  if (mouse.cheeseFound === 0) {
    return false;
  }
  
  return rules.winConditions.some(condition => {
    switch (condition.type) {
      case 'cheese_count':
        return mouse.cheeseFound >= condition.value;
      case 'energy':
        return mouse.energy >= condition.value && mouse.cheeseFound > 0;
      case 'happiness':
        return mouse.happiness >= condition.value && mouse.cheeseFound > 0;
      case 'survival':
        // La condition survival nécessite aussi du fromage
        return currentTurn >= condition.value && mouse.cheeseFound > 0;
      default:
        return false;
    }
  });
}

// Fonction pour calculer les effets d'un tour
export function applyTurnEffects(
  mouse: { health: number; happiness: number; energy: number; cheeseFound: number; isAlive: boolean; moves?: number; name?: string },
  rules: SimulationRules,
  environment: {
    hasOtherMiceNearby: boolean;
    foundCheese: boolean;
  }
): { health: number; happiness: number; energy: number; cheeseFound: number; isAlive: boolean } {
  // Copier toutes les valeurs actuelles de la souris
  const updatedMouse = { 
    health: mouse.health,
    happiness: mouse.happiness,
    energy: mouse.energy,
    cheeseFound: mouse.cheeseFound, // Utiliser la valeur actuelle
    isAlive: mouse.isAlive
  };
  const simulationMode = rules.simulationMode || 'normal';
  
  console.log(`[applyTurnEffects] Entrée - ${mouse.name || 'Souris'}: Santé=${mouse.health}, Fromages=${mouse.cheeseFound}, Moves=${mouse.moves}, Mode=${simulationMode}, foundCheese=${environment.foundCheese}`);
  
  // Mode survie: perte de vie tous les 5 pas
  if (simulationMode === 'survie' && mouse.moves && mouse.moves > 0 && mouse.moves % 5 === 0) {
    updatedMouse.health = Math.max(0, updatedMouse.health - 1);
  }
  
  // Mode mortelle: perte de 10 points de vie tous les 5 pas
  // Vérifier que moves est bien défini et que c'est un multiple de 5
  if (simulationMode === 'mortelle' && mouse.moves && mouse.moves > 0 && mouse.moves % 5 === 0) {
    const previousHealth = updatedMouse.health;
    updatedMouse.health = Math.max(0, updatedMouse.health - 10);
    // Log pour débogage
    console.log(`⚡ Mode mortelle: ${mouse.name || 'Souris'} a effectué ${mouse.moves} pas - Perte de 10 points de vie (${previousHealth} → ${updatedMouse.health})`);
  }
  
  // Consommation d'énergie de base
  // Consommation d'énergie (minimum 10 pour éviter la mort)
  updatedMouse.energy = Math.max(10, updatedMouse.energy - rules.energyConsumption);
  
  // Décroissance du bonheur (minimum 10 pour éviter la mort)
  updatedMouse.happiness = Math.max(10, updatedMouse.happiness - rules.happinessDecay);
  
  // Pénalité d'isolement (minimum 10 pour éviter la mort)
  if (!environment.hasOtherMiceNearby) {
    updatedMouse.happiness = Math.max(10, updatedMouse.happiness - rules.isolationPenalty);
  }
  
  // Bonus de proximité
  if (environment.hasOtherMiceNearby) {
    updatedMouse.happiness = Math.min(
      rules.maxHappiness,
      updatedMouse.happiness + rules.proximityBonus
    );
  }
  
  // Bonus de fromage
  if (environment.foundCheese) {
    const previousCheeseFound = updatedMouse.cheeseFound;
    const previousHealth = updatedMouse.health;
    const healthBeforeCheese = updatedMouse.health; // Santé avant l'ajout du fromage
    
    console.log(`🧀 [applyTurnEffects] Fromage détecté - Santé actuelle: ${healthBeforeCheese}, Mode: ${simulationMode}`);
    
    // Incrémenter le compteur de fromages
    updatedMouse.cheeseFound = previousCheeseFound + 1;
    
    updatedMouse.happiness = Math.min(
      rules.maxHappiness,
      updatedMouse.happiness + rules.cheeseBonus
    );
    updatedMouse.energy = Math.min(
      rules.maxEnergy,
      updatedMouse.energy + 10
    );
    
    // Toujours ajouter 10 points de santé quand une souris mange un fromage
    const healthBeforeAdd = updatedMouse.health;
    updatedMouse.health = Math.min(updatedMouse.health + 10, rules.maxEnergy);
    const healthAfterAdd = updatedMouse.health;
    const healthGained = healthAfterAdd - healthBeforeAdd;
    
    console.log(`🧀 ${mouse.name || 'Souris'} mange un fromage - Mode: ${simulationMode}`);
    console.log(`   Santé AVANT: ${healthBeforeAdd}`);
    console.log(`   Ajout de 10 points: ${healthBeforeAdd} + 10 = ${Math.min(healthBeforeAdd + 10, rules.maxEnergy)}`);
    console.log(`   Santé APRÈS: ${healthAfterAdd} (gain: +${healthGained} points, limité à ${rules.maxEnergy})`);
    console.log(`   Fromages: ${previousCheeseFound} → ${updatedMouse.cheeseFound}`);
    
    // Vérification de sécurité: s'assurer que la santé a bien augmenté
    if (healthGained <= 0 && healthBeforeAdd < rules.maxEnergy) {
      console.error(`⚠️ ERREUR: La santé n'a pas augmenté! Avant: ${healthBeforeAdd}, Après: ${healthAfterAdd}`);
    }
  }
  
  // Vérifier si la souris est morte
  // En mode mortelle, la souris meurt si sa vie atteint 0
  if (simulationMode === 'mortelle') {
    if (updatedMouse.health <= 0) {
      updatedMouse.isAlive = false;
      updatedMouse.health = 0; // S'assurer que la vie ne devient pas négative
    } else {
      updatedMouse.isAlive = true;
    }
  } else {
    // Pour les autres modes, les souris ne meurent jamais
    updatedMouse.isAlive = true;
  }
  
  console.log(`[applyTurnEffects] Sortie - ${mouse.name || 'Souris'}: Santé=${updatedMouse.health}, Fromages=${updatedMouse.cheeseFound}, isAlive=${updatedMouse.isAlive}`);
  
  return updatedMouse;
}
