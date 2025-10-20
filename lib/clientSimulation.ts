import { Simulation, Mouse, Labyrinth, Direction, Position } from './types';
import { MockIA } from './mockIA';
import { applyTurnEffects, checkWinConditions } from './rules';

export class ClientSimulation {
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
    
    this.log('Simulation démarrée (mode client)');
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
    if (this.simulation.status === 'paused') {
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
    if (!this.isRunning) return;

    this.simulation.currentTurn++;
    this.log(`Tour ${this.simulation.currentTurn}`);

    // Traiter chaque souris vivante
    const aliveMice = this.simulation.mice.filter(mouse => mouse.isAlive);
    
    for (const mouse of aliveMice) {
      await this.processMouseTurn(mouse);
    }

    // Vérifier les conditions de fin
    this.checkEndConditions();

    this.updateSimulation();
  }

  // Traiter le tour d'une souris
  private async processMouseTurn(mouse: Mouse) {
    try {
      // Vérifier si la souris est déjà sur un fromage
      const alreadyOnCheese = this.checkCheeseFound(mouse.position);
      if (alreadyOnCheese) {
        this.log(`${mouse.name} est déjà sur un fromage à (${mouse.position.x}, ${mouse.position.y}) - pas de mouvement`);
        return; // Ne pas traiter cette souris
      }
      
      // Obtenir le mouvement de l'IA (mockée)
      const move = await this.getMouseMove(mouse);
      
      // Calculer la nouvelle position
      const newPosition = this.calculateNewPosition(mouse.position, move);
      
      // Vérifier si le mouvement est valide
      if (this.isValidMove(newPosition)) {
        // Mettre à jour la position
        mouse.position = newPosition;
        mouse.lastMove = move;
        mouse.moves++;
        
        this.log(`${mouse.name} se déplace vers ${move} (${newPosition.x}, ${newPosition.y})`);
        
        // Vérifier si la souris trouve du fromage
        const foundCheese = this.checkCheeseFound(mouse.position);
        if (foundCheese) {
          mouse.cheeseFound++;
          this.log(`${mouse.name} a trouvé du fromage ! Total: ${mouse.cheeseFound}`);
        }
        
        // Appliquer les effets du tour
        const environment = this.getEnvironmentContext(mouse);
        const environmentForRules = {
          hasOtherMiceNearby: environment.otherMice.length > 0,
          foundCheese: foundCheese
        };
        const updatedMouse = applyTurnEffects(mouse, this.simulation.rules, environmentForRules);
        Object.assign(mouse, updatedMouse);
        
        // Vérifier si la souris est morte
        if (!mouse.isAlive) {
          this.log(`${mouse.name} est morte (énergie: ${mouse.energy}%, bonheur: ${mouse.happiness}%)`);
        }
      } else {
        this.log(`${mouse.name} ne peut pas se déplacer vers ${move} - mouvement bloqué`);
      }
    } catch (error) {
      this.log(`Erreur lors du traitement de ${mouse.name}: ${error}`);
    }
  }

  // Obtenir le mouvement d'une souris via l'IA Python
  private async getMouseMove(mouse: Mouse): Promise<Direction> {
    try {
      // Construire le contexte environnemental
      const environment = this.getEnvironmentContext(mouse);
      const availableMoves = this.getAvailableMoves(mouse.position);
      
      // Préparer la requête pour l'IA mockée
      const iaRequest = {
        mouseId: mouse.id,
        position: mouse.position,
        environment,
        mouseState: {
          health: mouse.health,
          happiness: mouse.happiness,
          energy: mouse.energy,
          cheeseFound: mouse.cheeseFound
        },
        availableMoves
      };
      
      // Appeler l'API IA Python
      const response = await fetch('/api/ia/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(iaRequest),
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.log(`🤖 ${mouse.name} - IA Python: ${data.data.reasoning}`);
        this.log(`📍 Position: (${mouse.position.x}, ${mouse.position.y}) → Mouvement: ${data.data.move}`);
        return data.data.move;
      } else {
        throw new Error(data.error || 'Erreur de l\'IA');
      }
      
    } catch (error) {
      this.log(`Erreur IA pour ${mouse.name}: ${error}. Utilisation d'un mouvement aléatoire.`);
      // Fallback: mouvement aléatoire
      const availableMoves = this.getAvailableMoves(mouse.position);
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // Obtenir le contexte environnemental d'une souris
  private getEnvironmentContext(mouse: Mouse) {
    const otherMice = this.simulation.mice
      .filter(m => m.id !== mouse.id && m.isAlive)
      .map(m => ({
        id: m.id,
        position: m.position,
        distance: this.calculateDistance(mouse.position, m.position)
      }));

    return {
      grid: this.simulation.labyrinth.grid,
      width: this.simulation.labyrinth.width,
      height: this.simulation.labyrinth.height,
      cheesePositions: this.simulation.labyrinth.cheesePositions,
      otherMice,
      walls: this.getWallPositions(),
      paths: this.getPathPositions()
    };
  }

  // Obtenir les mouvements disponibles depuis une position
  private getAvailableMoves(position: Position): Direction[] {
    const moves: Direction[] = [];
    
    // Vérifier chaque direction
    const directions: { dir: Direction; delta: Position }[] = [
      { dir: 'north', delta: { x: 0, y: -1 } },
      { dir: 'south', delta: { x: 0, y: 1 } },
      { dir: 'east', delta: { x: 1, y: 0 } },
      { dir: 'west', delta: { x: -1, y: 0 } }
    ];
    
    for (const { dir, delta } of directions) {
      const newPosition = {
        x: position.x + delta.x,
        y: position.y + delta.y
      };
      
      if (this.isValidMove(newPosition)) {
        moves.push(dir);
      }
    }
    
    return moves;
  }

  // Calculer la nouvelle position après un mouvement
  private calculateNewPosition(position: Position, direction: Direction): Position {
    const deltas: { [key in Direction]: Position } = {
      north: { x: 0, y: -1 },
      south: { x: 0, y: 1 },
      east: { x: 1, y: 0 },
      west: { x: -1, y: 0 }
    };
    
    const delta = deltas[direction];
    return {
      x: position.x + delta.x,
      y: position.y + delta.y
    };
  }

  // Vérifier si un mouvement est valide
  private isValidMove(position: Position): boolean {
    // Vérifier les limites du labyrinthe
    if (position.x < 0 || position.x >= this.simulation.labyrinth.width ||
        position.y < 0 || position.y >= this.simulation.labyrinth.height) {
      return false;
    }
    
    // Vérifier si c'est un mur
    const cellType = this.simulation.labyrinth.grid[position.y][position.x];
    return cellType !== 'wall';
  }

  // Vérifier si une souris trouve du fromage
  private checkCheeseFound(position: Position): boolean {
    return this.simulation.labyrinth.cheesePositions.some(
      cheesePos => cheesePos.x === position.x && cheesePos.y === position.y
    );
  }

  // Vérifier les conditions de fin de simulation
  private checkEndConditions() {
    const aliveMice = this.simulation.mice.filter(mouse => mouse.isAlive);
    
    // Si toutes les souris sont mortes
    if (aliveMice.length === 0) {
      this.log('Toutes les souris sont mortes - fin de simulation');
      this.stop();
      return;
    }
    
    // Vérifier les conditions de victoire pour toutes les souris vivantes
    const winningMice = aliveMice.filter(mouse => 
      checkWinConditions(mouse, this.simulation.rules, this.simulation.currentTurn)
    );
    
    if (winningMice.length > 0) {
      this.log(`🎉 ${winningMice.map(m => m.name).join(', ')} ont gagné !`);
      this.log(`📊 Statistiques des gagnants:`);
      winningMice.forEach(mouse => {
        this.log(`   ${mouse.name}: ${mouse.cheeseFound} fromages trouvés`);
      });
      this.stop();
      return;
    }
    
    // Vérifier le nombre maximum de tours (seulement si maxTurns n'est pas infini)
    if (this.simulation.maxTurns !== Infinity && this.simulation.currentTurn >= this.simulation.maxTurns) {
      this.log('Nombre maximum de tours atteint - fin de simulation');
      this.stop();
      return;
    }
  }

  // Obtenir les positions des murs
  private getWallPositions(): Position[] {
    const walls: Position[] = [];
    for (let y = 0; y < this.simulation.labyrinth.height; y++) {
      for (let x = 0; x < this.simulation.labyrinth.width; x++) {
        if (this.simulation.labyrinth.grid[y][x] === 'wall') {
          walls.push({ x, y });
        }
      }
    }
    return walls;
  }

  // Obtenir les positions des chemins
  private getPathPositions(): Position[] {
    const paths: Position[] = [];
    for (let y = 0; y < this.simulation.labyrinth.height; y++) {
      for (let x = 0; x < this.simulation.labyrinth.width; x++) {
        if (this.simulation.labyrinth.grid[y][x] === 'path') {
          paths.push({ x, y });
        }
      }
    }
    return paths;
  }

  // Calculer la distance entre deux positions
  private calculateDistance(pos1: Position, pos2: Position): number {
    return Math.sqrt(Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2));
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
