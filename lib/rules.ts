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
  mouse: any,
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
  mouse: any,
  rules: SimulationRules,
  environment: {
    hasOtherMiceNearby: boolean;
    foundCheese: boolean;
  }
): any {
  const updatedMouse = { ...mouse };
  
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
    updatedMouse.cheeseFound += 1;
    updatedMouse.happiness = Math.min(
      rules.maxHappiness,
      updatedMouse.happiness + rules.cheeseBonus
    );
    updatedMouse.energy = Math.min(
      rules.maxEnergy,
      updatedMouse.energy + 10
    );
  }
  
  // Vérifier si la souris est morte (DÉSACTIVÉ - les souris ne meurent jamais)
  // if (updatedMouse.energy <= 0 || updatedMouse.happiness <= 0) {
  //   updatedMouse.isAlive = false;
  // }
  
  // Les souris ne meurent jamais - elles restent toujours vivantes
  updatedMouse.isAlive = true;
  
  return updatedMouse;
}
