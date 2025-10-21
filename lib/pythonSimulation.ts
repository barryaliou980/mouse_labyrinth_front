import { Simulation, Mouse, Labyrinth, Direction, Position } from './types';
import { PythonApiClient, MouseMoveRequest } from './pythonApiClient';
import { applyTurnEffects, checkWinConditions } from './rules';

export class PythonSimulation {
  private simulation: Simulation;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate?: (simulation: Simulation) => void;
  private onLog?: (message: string) => void;

  constructor(simulation: Simulation) {
    this.simulation = { ...simulation };
  }

  // Démarrer la simulation
  start(onUpdate?: (simulation: Simulation) => void, onLog?: (message: string) => void) {
    this.onUpdate = onUpdate;
    this.onLog = onLog;
    this.isRunning = true;
    this.simulation.status = 'running';
    
    this.log('Simulation démarrée (API Python)');
    this.updateSimulation();
    
    // Démarrer la boucle de simulation
    this.intervalId = setInterval(() => {
      this.runTurn();
    }, this.simulation.rules.turnDuration);
  }

  // Arrêter la simulation
  stop() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.simulation.status = 'completed';
    this.simulation.endTime = new Date().toISOString();
    this.log('Simulation arrêtée');
    this.updateSimulation();
  }

  // Mettre en pause la simulation
  pause() {
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.simulation.status = 'paused';
    this.log('Simulation mise en pause');
    this.updateSimulation();
  }

  // Reprendre la simulation
  resume() {
    if (!this.isRunning && this.simulation.status === 'paused') {
      this.isRunning = true;
      this.simulation.status = 'running';
      this.intervalId = setInterval(() => {
        this.runTurn();
      }, this.simulation.rules.turnDuration);
      this.log('Simulation reprise');
      this.updateSimulation();
    }
  }

  // Exécuter un tour de simulation
  private async runTurn() {
    console.log(`[DEBUG] runTurn appelé, isRunning: ${this.isRunning}`);
    if (!this.isRunning) {
      console.log(`[DEBUG] Simulation arrêtée, sortie de runTurn`);
      return;
    }

    this.simulation.currentTurn++;
    console.log(`[DEBUG] Tour ${this.simulation.currentTurn} démarré`);
    this.log(`Tour ${this.simulation.currentTurn}`);

    // Traiter chaque souris vivante
    const aliveMice = this.simulation.mice.filter(mouse => mouse.isAlive);
    console.log(`[DEBUG] ${aliveMice.length} souris vivantes à traiter`);
    
    for (const mouse of aliveMice) {
      console.log(`[DEBUG] Traitement de la souris ${mouse.name}`);
      await this.processMouseTurn(mouse);
    }

    // Vérifier les conditions de fin
    this.checkEndConditions();

    this.updateSimulation();
    console.log(`[DEBUG] Tour ${this.simulation.currentTurn} terminé`);
  }

  // Traiter le tour d'une souris
  private async processMouseTurn(mouse: Mouse) {
    try {
      console.log(`[DEBUG] Traitement de ${mouse.name} à la position (${mouse.position.x}, ${mouse.position.y})`);
      
      // Vérifier si la souris est déjà sur un fromage
      const alreadyOnCheese = this.checkCheeseFound(mouse.position);
      if (alreadyOnCheese) {
        this.log(`${mouse.name} est déjà sur un fromage à (${mouse.position.x}, ${mouse.position.y}) - pas de mouvement`);
        return; // Ne pas traiter cette souris
      }
      
      console.log(`[DEBUG] Appel de l'IA pour ${mouse.name}...`);
      // Obtenir le mouvement de l'API Python
      const move = await this.getMouseMoveFromPython(mouse);
      console.log(`[DEBUG] IA a retourné le mouvement: ${move} pour ${mouse.name}`);
      
      // Calculer la nouvelle position
      const newPosition = this.calculateNewPosition(mouse.position, move);
      console.log(`[DEBUG] Nouvelle position calculée: (${newPosition.x}, ${newPosition.y}) pour ${mouse.name}`);
      
      // Vérifier si le mouvement est valide
      if (this.isValidMove(newPosition)) {
        console.log(`[DEBUG] Mouvement valide pour ${mouse.name}`);
        // Mettre à jour la position
        mouse.position = newPosition;
        mouse.moves++;
        
        // Vérifier si la souris a trouvé du fromage
        if (this.checkCheeseFound(newPosition)) {
          mouse.cheeseFound++;
          this.log(`🎉 ${mouse.name} a trouvé du fromage à (${newPosition.x}, ${newPosition.y}) !`);
          
          // Marquer la simulation comme terminée
          this.simulation.status = 'completed';
          this.simulation.endTime = new Date().toISOString();
          this.isRunning = false;
          if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
          }
        }
        
        // Appliquer les effets du tour
        applyTurnEffects(mouse, this.simulation.rules);
        
        this.log(`${mouse.name} se déplace vers ${move} vers (${newPosition.x}, ${newPosition.y})`);
      } else {
        console.log(`[DEBUG] Mouvement invalide pour ${mouse.name}`);
        this.log(`${mouse.name} ne peut pas se déplacer vers ${move} - mouvement bloqué`);
      }
      
    } catch (error) {
      console.error(`[DEBUG] Erreur lors du traitement de ${mouse.name}:`, error);
      this.log(`Erreur lors du traitement de ${mouse.name}: ${error}`);
    }
  }

  // Obtenir le mouvement de l'API Python
  private async getMouseMoveFromPython(mouse: Mouse): Promise<Direction> {
    try {
      console.log(`[DEBUG] Préparation de la requête pour ${mouse.name}...`);
      const labyrinthFormat = PythonApiClient.convertLabyrinthToPythonFormat(this.simulation.labyrinth);
      const availableMoves = PythonApiClient.getAvailableMoves(this.simulation.labyrinth, mouse.position);
      
      console.log(`[DEBUG] Mouvements disponibles pour ${mouse.name}:`, availableMoves);
      console.log(`[DEBUG] Format du labyrinthe:`, labyrinthFormat);
      
      const request: MouseMoveRequest = {
        mouseId: mouse.id,
        position: mouse.position,
        environment: {
          ...labyrinthFormat,
          otherMice: this.simulation.mice
            .filter(m => m.id !== mouse.id && m.isAlive)
            .map(m => ({ id: m.id, position: m.position })),
          walls: [], // Pas utilisé par l'API Python
          paths: []  // Pas utilisé par l'API Python
        },
        mouseState: {
          health: mouse.health,
          happiness: mouse.happiness,
          energy: mouse.energy,
          cheeseFound: mouse.cheeseFound
        },
        availableMoves
      };

      console.log(`[DEBUG] Envoi de la requête à l'API Python pour ${mouse.name}...`);
      const response = await PythonApiClient.getMouseMove(request);
      console.log(`[DEBUG] Réponse de l'API Python pour ${mouse.name}:`, response);
      this.log(`IA Python: ${response.reasoning}`);
      
      return response.move as Direction;
    } catch (error) {
      console.error(`[DEBUG] Erreur API Python pour ${mouse.name}:`, error);
      // Fallback vers un mouvement aléatoire si l'API Python n'est pas disponible
      this.log(`API Python non disponible, mouvement aléatoire pour ${mouse.name}`);
      const availableMoves = PythonApiClient.getAvailableMoves(this.simulation.labyrinth, mouse.position);
      console.log(`[DEBUG] Mouvements disponibles pour fallback:`, availableMoves);
      if (availableMoves.length === 0) {
        console.log(`[DEBUG] Aucun mouvement disponible, utilisation de 'north' par défaut`);
        return 'north'; // Mouvement par défaut
      }
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)] as Direction;
      console.log(`[DEBUG] Mouvement aléatoire choisi: ${randomMove}`);
      return randomMove;
    }
  }

  // Calculer la nouvelle position basée sur le mouvement
  private calculateNewPosition(currentPosition: Position, direction: Direction): Position {
    const newPosition = { ...currentPosition };
    
    switch (direction) {
      case 'north':
        newPosition.y = Math.max(0, currentPosition.y - 1);
        break;
      case 'south':
        newPosition.y = Math.min(this.simulation.labyrinth.height - 1, currentPosition.y + 1);
        break;
      case 'east':
        newPosition.x = Math.min(this.simulation.labyrinth.width - 1, currentPosition.x + 1);
        break;
      case 'west':
        newPosition.x = Math.max(0, currentPosition.x - 1);
        break;
    }
    
    return newPosition;
  }

  // Vérifier si un mouvement est valide
  private isValidMove(position: Position): boolean {
    const { x, y } = position;
    
    // Vérifier les limites
    if (x < 0 || x >= this.simulation.labyrinth.width || 
        y < 0 || y >= this.simulation.labyrinth.height) {
      return false;
    }
    
    // Vérifier si ce n'est pas un mur
    return this.simulation.labyrinth.grid[y][x] !== 'wall';
  }

  // Vérifier si la souris a trouvé du fromage
  private checkCheeseFound(position: Position): boolean {
    const { x, y } = position;
    return this.simulation.labyrinth.grid[y][x] === 'cheese';
  }

  // Vérifier les conditions de fin
  private checkEndConditions() {
    const aliveMice = this.simulation.mice.filter(mouse => mouse.isAlive);
    
    // Si toutes les souris sont mortes
    if (aliveMice.length === 0) {
      this.simulation.status = 'completed';
      this.simulation.endTime = new Date().toISOString();
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.log('Simulation terminée - toutes les souris sont mortes');
      return;
    }
    
    // Si une souris a trouvé du fromage
    const winningMouse = aliveMice.find(mouse => mouse.cheeseFound > 0);
    if (winningMouse) {
      this.simulation.status = 'completed';
      this.simulation.endTime = new Date().toISOString();
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.log(`Simulation terminée - ${winningMouse.name} a gagné !`);
      return;
    }
    
    // Vérifier les conditions de victoire personnalisées
    const winConditions = checkWinConditions(this.simulation);
    if (winConditions.length > 0) {
      this.simulation.status = 'completed';
      this.simulation.endTime = new Date().toISOString();
      this.isRunning = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
      this.log(`Simulation terminée - conditions de victoire atteintes: ${winConditions.join(', ')}`);
    }
  }

  // Mettre à jour la simulation
  private updateSimulation() {
    if (this.onUpdate) {
      this.onUpdate({ ...this.simulation });
    }
  }

  // Logger un message
  private log(message: string) {
    if (this.onLog) {
      this.onLog(message);
    }
  }

  // Obtenir l'état actuel de la simulation
  getSimulation(): Simulation {
    return { ...this.simulation };
  }

  // Vérifier si la simulation est en cours
  isSimulationRunning(): boolean {
    return this.isRunning;
  }
}
