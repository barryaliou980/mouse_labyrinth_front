import { Simulation, Mouse, Labyrinth, Direction, Position } from './types';
import { PythonApiClient, MouseMoveRequest } from './pythonApiClient';
import { applyTurnEffects, checkWinConditions } from './rules';

export class PythonSimulation {
  private simulation: Simulation;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate?: (simulation: Simulation) => void;
  private onLog?: (message: string) => void;
  private collectedCheeses: Set<string> = new Set(); // Suivi des fromages collectés

  constructor(simulation: Simulation) {
    this.simulation = { ...simulation };
    this.initializeCheeseTracking();
  }

  // Initialiser le suivi des fromages
  private initializeCheeseTracking() {
    this.collectedCheeses.clear();
    // Marquer les fromages déjà collectés (au cas où)
    this.simulation.mice.forEach(mouse => {
      if (mouse.cheeseFound > 0) {
        // Si une souris a déjà trouvé des fromages, on les marque comme collectés
        for (let i = 0; i < mouse.cheeseFound; i++) {
          this.collectedCheeses.add(`cheese-${i}`);
        }
      }
    });
  }

  // Démarrer la simulation
  start(onUpdate?: (simulation: Simulation) => void, onLog?: (message: string) => void) {
    this.onUpdate = onUpdate;
    this.onLog = onLog;
    this.isRunning = true;
    this.simulation.status = 'running';
    
    const totalCheeses = this.getTotalCheesesCount();
    this.log(`Simulation démarrée (API Python) - Objectif: collecter ${totalCheeses} fromage(s)`);
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
  }

  // Traiter le tour d'une souris
  private async processMouseTurn(mouse: Mouse) {
    try {
      // Vérifier si la souris est déjà sur un fromage non collecté
      const alreadyOnCheese = this.checkCheeseFound(mouse.position);
      if (alreadyOnCheese) {
        const cheeseKey = `${mouse.position.x}-${mouse.position.y}`;
        if (!this.collectedCheeses.has(cheeseKey)) {
          // La souris est sur un fromage non collecté, le collecter
          mouse.cheeseFound++;
          this.log(`🎉 ${mouse.name} a trouvé du fromage à (${mouse.position.x}, ${mouse.position.y}) ! Total: ${mouse.cheeseFound}`);
          
          // Marquer ce fromage comme collecté
          this.collectedCheeses.add(cheeseKey);
          
          // Vérifier si tous les fromages ont été collectés
          if (this.checkAllCheesesCollected()) {
            this.log(`🏆 ${mouse.name} a collecté tous les fromages ! Simulation terminée !`);
            this.simulation.status = 'completed';
            this.simulation.endTime = new Date().toISOString();
            this.isRunning = false;
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
            }
            return;
          } else {
            const remaining = this.getRemainingCheesesCount();
            const total = this.getTotalCheesesCount();
            const collected = this.collectedCheeses.size;
            this.log(`🍽️ Progrès: ${collected}/${total} fromages collectés (${remaining} restants)`);
          }
        }
        // Si le fromage est déjà collecté, la souris peut continuer à bouger
      }
      
      // Obtenir le mouvement de l'API Python
      const move = await this.getMouseMoveFromPython(mouse);
      
      // Calculer la nouvelle position
      const newPosition = this.calculateNewPosition(mouse.position, move);
      
      // Vérifier si le mouvement est valide
      if (this.isValidMove(newPosition)) {
        // Mettre à jour la position
        mouse.position = newPosition;
        mouse.moves++;
        
        // Vérifier si la souris a trouvé du fromage
        const cheeseFound = this.checkCheeseFound(newPosition);
        if (cheeseFound) {
          mouse.cheeseFound++;
          this.log(`🎉 ${mouse.name} a trouvé du fromage à (${newPosition.x}, ${newPosition.y}) ! Total: ${mouse.cheeseFound}`);
          
          // Marquer ce fromage comme collecté
          const cheeseKey = `${newPosition.x}-${newPosition.y}`;
          this.collectedCheeses.add(cheeseKey);
          
          // Vérifier si tous les fromages atteignables ont été collectés
          if (this.checkAllCheesesCollected()) {
            this.log(`🏆 ${mouse.name} a collecté tous les fromages ! Simulation terminée !`);
            this.simulation.status = 'completed';
            this.simulation.endTime = new Date().toISOString();
            this.isRunning = false;
            if (this.intervalId) {
              clearInterval(this.intervalId);
              this.intervalId = null;
            }
          } else {
            const remaining = this.getRemainingCheesesCount();
            const total = this.getTotalCheesesCount();
            const collected = this.collectedCheeses.size;
            this.log(`🍽️ Progrès: ${collected}/${total} fromages collectés (${remaining} restants)`);
          }
        }
        
        // Appliquer les effets du tour
        const environment = {
          hasOtherMiceNearby: this.checkOtherMiceNearby(mouse),
          foundCheese: false // Le fromage a déjà été traité plus haut
        };
        applyTurnEffects(mouse, this.simulation.rules, environment);
        
        this.log(`${mouse.name} se déplace vers ${move} vers (${newPosition.x}, ${newPosition.y})`);
      } else {
        this.log(`${mouse.name} ne peut pas se déplacer vers ${move} - mouvement bloqué`);
      }
      
    } catch (error) {
      this.log(`Erreur lors du traitement de ${mouse.name}: ${error}`);
    }
  }

  // Obtenir le mouvement de l'API Python
  private async getMouseMoveFromPython(mouse: Mouse): Promise<Direction> {
    try {
      // Obtenir les fromages non collectés
      const uncollectedCheeses = this.getUncollectedCheeses();
      const labyrinthFormat = PythonApiClient.convertLabyrinthToPythonFormat(this.simulation.labyrinth, uncollectedCheeses);
      const availableMoves = PythonApiClient.getAvailableMoves(this.simulation.labyrinth, mouse.position);
      
      const request: MouseMoveRequest = {
        mouseId: mouse.id,
        position: mouse.position,
        environment: {
          ...labyrinthFormat,
          cheesePositions: uncollectedCheeses, // Seulement les fromages non collectés
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

      const response = await PythonApiClient.getMouseMove(request);
      this.log(`IA Python: ${response.reasoning}`);
      
      return response.move as Direction;
    } catch (error) {
      // Fallback vers un mouvement aléatoire si l'API Python n'est pas disponible
      this.log(`API Python non disponible, mouvement aléatoire pour ${mouse.name}`);
      const availableMoves = PythonApiClient.getAvailableMoves(this.simulation.labyrinth, mouse.position);
      if (availableMoves.length === 0) {
        return 'north'; // Mouvement par défaut
      }
      const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)] as Direction;
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
    // Les fromages collectés deviennent des chemins normaux
    const cellType = this.simulation.labyrinth.grid[y][x];
    if (cellType === 'wall') {
      return false;
    }
    
    // Tous les autres types (path, cheese, start) sont valides
    return true;
  }

  // Vérifier si la souris a trouvé du fromage (non collecté)
  private checkCheeseFound(position: Position): boolean {
    const { x, y } = position;
    const cellType = this.simulation.labyrinth.grid[y][x];
    
    // Vérifier si c'est un fromage dans la grille
    if (cellType !== 'cheese') {
      return false;
    }
    
    // Vérifier si ce fromage n'a pas encore été collecté
    const cheeseKey = `${x}-${y}`;
    return !this.collectedCheeses.has(cheeseKey);
  }

  // Vérifier si tous les fromages atteignables ont été collectés
  private checkAllCheesesCollected(): boolean {
    const totalCheeses = this.getTotalCheesesCount();
    const collectedCount = this.collectedCheeses.size;
    return collectedCount >= totalCheeses;
  }

  // Obtenir le nombre total de fromages dans le labyrinthe
  private getTotalCheesesCount(): number {
    let count = 0;
    for (let y = 0; y < this.simulation.labyrinth.height; y++) {
      for (let x = 0; x < this.simulation.labyrinth.width; x++) {
        if (this.simulation.labyrinth.grid[y][x] === 'cheese') {
          count++;
        }
      }
    }
    return count;
  }

  // Obtenir le nombre de fromages restants
  private getRemainingCheesesCount(): number {
    const total = this.getTotalCheesesCount();
    const collected = this.collectedCheeses.size;
    return Math.max(0, total - collected);
  }

  // Obtenir la liste des fromages non collectés
  private getUncollectedCheeses(): Position[] {
    const uncollected: Position[] = [];
    for (let y = 0; y < this.simulation.labyrinth.height; y++) {
      for (let x = 0; x < this.simulation.labyrinth.width; x++) {
        if (this.simulation.labyrinth.grid[y][x] === 'cheese') {
          const cheeseKey = `${x}-${y}`;
          if (!this.collectedCheeses.has(cheeseKey)) {
            uncollected.push({ x, y });
          }
        }
      }
    }
    return uncollected;
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
    
    // La logique de victoire est maintenant gérée dans processMouseTurn()
    // quand tous les fromages sont collectés
    
    // La logique de victoire est entièrement gérée dans processMouseTurn()
    // quand tous les fromages sont collectés via checkAllCheesesCollected()
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

  // Vérifier si d'autres souris sont à proximité
  private checkOtherMiceNearby(mouse: Mouse): boolean {
    const proximityDistance = 2; // Distance de proximité
    
    return this.simulation.mice.some(otherMouse => {
      if (otherMouse.id === mouse.id || !otherMouse.isAlive) {
        return false;
      }
      
      const distance = Math.abs(mouse.position.x - otherMouse.position.x) + 
                      Math.abs(mouse.position.y - otherMouse.position.y);
      
      return distance <= proximityDistance;
    });
  }

  // Vérifier si la simulation est en cours
  isSimulationRunning(): boolean {
    return this.isRunning;
  }
}
