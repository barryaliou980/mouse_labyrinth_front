import { IARequest, IAResponse, Direction } from './types';

// IA mockée pour les tests sans serveur Python
export class MockIA {
  // Générer un mouvement aléatoire
  static randomMove(availableMoves: Direction[]): Direction {
    if (availableMoves.length === 0) {
      return 'north'; // Fallback
    }
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // IA directionnelle - se dirige vers le fromage le plus proche
  static directionalMove(request: IARequest): Direction {
    const { position, environment, availableMoves } = request;
    
    if (availableMoves.length === 0) {
      return 'north';
    }

    // Trouver le fromage le plus proche
    let closestCheese = environment.cheesePositions[0];
    let minDistance = Math.abs(position.x - closestCheese.x) + Math.abs(position.y - closestCheese.y);

    for (const cheese of environment.cheesePositions) {
      const distance = Math.abs(position.x - cheese.x) + Math.abs(position.y - cheese.y);
      if (distance < minDistance) {
        minDistance = distance;
        closestCheese = cheese;
      }
    }

    // Déterminer la direction vers le fromage le plus proche
    const deltaX = closestCheese.x - position.x;
    const deltaY = closestCheese.y - position.y;

    let preferredDirection: Direction;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      preferredDirection = deltaX > 0 ? 'east' : 'west';
    } else {
      preferredDirection = deltaY > 0 ? 'south' : 'north';
    }

    // Vérifier si la direction préférée est disponible
    if (availableMoves.includes(preferredDirection)) {
      return preferredDirection;
    }

    // Sinon, choisir aléatoirement parmi les mouvements disponibles
    return this.randomMove(availableMoves);
  }

  // IA intelligente - évite les murs et cherche le chemin optimal
  static smartMove(request: IARequest): Direction {
    const { position, environment, availableMoves } = request;
    
    if (availableMoves.length === 0) {
      return 'north';
    }

    // Algorithme simple de recherche de chemin
    // Priorité : 1. Vers le fromage, 2. Éviter les murs, 3. Explorer
    const cheesePositions = environment.cheesePositions;
    
    // Calculer la direction vers le fromage le plus proche
    let bestDirection = this.directionalMove(request);
    
    // Vérifier si on peut se rapprocher d'autres souris (comportement social)
    const otherMice = environment.otherMice;
    if (otherMice.length > 0) {
      const closestMouse = otherMice.reduce((closest, mouse) => 
        mouse.distance < closest.distance ? mouse : closest
      );
      
      const deltaX = closestMouse.position.x - position.x;
      const deltaY = closestMouse.position.y - position.y;
      
      let socialDirection: Direction;
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        socialDirection = deltaX > 0 ? 'east' : 'west';
      } else {
        socialDirection = deltaY > 0 ? 'south' : 'north';
      }
      
      // Si la direction sociale est disponible et qu'on est isolé, l'utiliser
      if (availableMoves.includes(socialDirection) && closestMouse.distance > 3) {
        return socialDirection;
      }
    }
    
    return bestDirection;
  }

  // IA sociale - privilégie la proximité avec d'autres souris
  static socialMove(request: IARequest): Direction {
    const { position, environment, availableMoves } = request;
    
    if (availableMoves.length === 0) {
      return 'north';
    }

    const otherMice = environment.otherMice;
    
    // Si pas d'autres souris, se comporter comme directionnelle
    if (otherMice.length === 0) {
      return this.directionalMove(request);
    }

    // Calculer la position moyenne des autres souris
    const avgX = otherMice.reduce((sum, mouse) => sum + mouse.position.x, 0) / otherMice.length;
    const avgY = otherMice.reduce((sum, mouse) => sum + mouse.position.y, 0) / otherMice.length;

    const deltaX = avgX - position.x;
    const deltaY = avgY - position.y;

    let socialDirection: Direction;
    
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      socialDirection = deltaX > 0 ? 'east' : 'west';
    } else {
      socialDirection = deltaY > 0 ? 'south' : 'north';
    }

    // Vérifier si la direction sociale est disponible
    if (availableMoves.includes(socialDirection)) {
      return socialDirection;
    }

    // Sinon, essayer de se rapprocher du fromage
    return this.directionalMove(request);
  }

  // Fonction principale pour obtenir un mouvement selon le type d'IA
  static getMove(request: IARequest): IAResponse {
    const { mouseState, availableMoves } = request;
    
    // Vérifier si la souris est en bonne santé
    if (mouseState.health <= 0 || mouseState.happiness <= 0) {
      return {
        mouseId: request.mouseId,
        move: this.randomMove(availableMoves),
        reasoning: 'Souris en mauvaise santé, mouvement aléatoire'
      };
    }

    // Déterminer le type d'IA basé sur l'ID de la souris ou d'autres critères
    // Pour simplifier, on utilise un hash de l'ID pour déterminer le type
    const hash = request.mouseId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const iaType = Math.abs(hash) % 4;
    let move: Direction;
    let reasoning: string;

    switch (iaType) {
      case 0:
        move = this.randomMove(availableMoves);
        reasoning = 'Mouvement aléatoire';
        break;
      case 1:
        move = this.directionalMove(request);
        reasoning = 'Se dirige vers le fromage le plus proche';
        break;
      case 2:
        move = this.smartMove(request);
        reasoning = 'Algorithme intelligent de recherche de chemin';
        break;
      case 3:
        move = this.socialMove(request);
        reasoning = 'Recherche la proximité avec d\'autres souris';
        break;
      default:
        move = this.randomMove(availableMoves);
        reasoning = 'Mouvement par défaut';
    }

    return {
      mouseId: request.mouseId,
      move,
      reasoning
    };
  }
}
