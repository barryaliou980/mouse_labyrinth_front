import { Simulation, Mouse, Labyrinth, Direction, Position } from './types';
import { PythonApiClient, MouseMoveRequest } from './pythonApiClient';
import { applyTurnEffects, checkWinConditions } from './rules';
import { getApiUrl } from './config';

export class PythonSimulation {
  private simulation: Simulation;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private onUpdate?: (simulation: Simulation) => void;
  private onLog?: (message: string) => void;
  private collectedCheeses: Set<string> = new Set();
  private totalCheesesCount: number = 0; // Nombre total de fromages au début // Suivi des fromages collectés
  private mouseThreads: Map<string, NodeJS.Timeout> = new Map(); // Threads individuels pour chaque souris
  private endCheckInterval: NodeJS.Timeout | null = null; // Intervalle pour vérifier la fin de simulation

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
    
    // Réinitialiser les fromages et les souris
    this.resetSimulation();
    
    const totalCheeses = this.getTotalCheesesCount();
    this.log(`Simulation démarrée (API Python) - Objectif: collecter ${totalCheeses} fromage(s)`);
    this.log(`Démarrage de ${this.simulation.mice.length} threads individuels pour les souris`);
    this.updateSimulation();
    
    // Démarrer un thread séparé pour chaque souris avec un délai échelonné
    this.simulation.mice.forEach((mouse, index) => {
      setTimeout(() => {
        this.startMouseThread(mouse);
      }, index * 100); // Délai de 100ms entre chaque souris
    });
    
    // Démarrer la vérification périodique de fin de simulation
    this.startEndCheck();
  }

  // Réinitialiser la simulation
  private resetSimulation() {
    // Réinitialiser les fromages collectés
    this.collectedCheeses.clear();
    
    // Stocker le nombre total de fromages au début
    this.totalCheesesCount = this.simulation.labyrinth.cheesePositions.length;
    this.log(` Nombre total de fromages à collecter: ${this.totalCheesesCount}`);
    
    // Afficher les positions des fromages
    this.log(` Positions des fromages: ${this.simulation.labyrinth.cheesePositions.map(p => `(${p.x},${p.y})`).join(', ')}`);
    
    // Réinitialiser les positions des souris à leurs positions de départ
    this.simulation.mice.forEach((mouse, index) => {
      // Forcer la définition du tag si il n'est pas défini
      if (!mouse.tag) {
        mouse.tag = index + 1;
      }
      
      const startPos = this.simulation.labyrinth.startPositions[index] || this.simulation.labyrinth.startPositions[0];
      if (startPos) {
        mouse.position = { ...startPos };
        this.log(` ${mouse.name} (Tag: ${mouse.tag}) repositionnée à (${startPos.x}, ${startPos.y})`);
      }
      mouse.cheeseFound = 0;
      mouse.moves = 0;
      mouse.isAlive = true;
      mouse.health = this.simulation.rules.maxEnergy;
      mouse.happiness = this.simulation.rules.maxHappiness;
      mouse.energy = this.simulation.rules.maxEnergy;
    });
    
    // Restaurer la grille originale avec tous les fromages
    this.restoreOriginalGrid();
    
    this.log(` Simulation réinitialisée - ${this.simulation.mice.length} souris repositionnées, fromages restaurés`);
  }

  // Restaurer la grille originale avec tous les fromages
  private restoreOriginalGrid() {
    // Restaurer tous les fromages dans la grille
    this.simulation.labyrinth.cheesePositions.forEach(cheesePos => {
      if (this.simulation.labyrinth.grid[cheesePos.y] && 
          this.simulation.labyrinth.grid[cheesePos.y][cheesePos.x] === 'path') {
        this.simulation.labyrinth.grid[cheesePos.y][cheesePos.x] = 'cheese';
      }
    });
    
    this.log(` Grille restaurée - ${this.simulation.labyrinth.cheesePositions.length} fromages replacés`);
  }

  // Démarrer la vérification périodique de fin de simulation
  private startEndCheck() {
    this.endCheckInterval = setInterval(async () => {
      if (!this.isRunning) {
        return;
      }
      
      this.log(` Vérification périodique de fin de simulation...`);
      if (this.checkAllCheesesCollected()) {
        this.log(`Tous les fromages ont été collectés ! Simulation terminée !`);
        this.simulation.status = 'completed';
        this.simulation.endTime = new Date().toISOString();
        this.isRunning = false;
        
        // Arrêter tous les threads de souris
        this.simulation.mice.forEach(mouse => {
          this.stopMouseThread(mouse.id);
        });
        
        // Arrêter la vérification périodique
        if (this.endCheckInterval) {
          clearInterval(this.endCheckInterval);
          this.endCheckInterval = null;
        }
        
        // Nettoyer l'API Python
        await this.cleanupPythonAI();
        
        this.log(' Simulation terminée avec succès !');
      } else {
        this.log(` Simulation continue - vérification dans 30 secondes`);
      }
    }, 30000); // Vérifier toutes les 30 secondes
  }

  // Démarrer un thread individuel pour une souris
  private startMouseThread(mouse: Mouse) {
    const mouseId = mouse.id;
    this.log(`- Thread ${mouse.tag} - Démarrage du thread pour ${mouse.name} (ID: ${mouseId})`);
    
    // Utiliser le délai de mouvement configuré pour cette souris
    const delay = mouse.movementDelay || 500; // Utiliser le délai configuré ou 500ms par défaut
    
    // Délai initial avant le premier mouvement (1 seconde pour toutes les souris)
    setTimeout(async () => {
      if (!this.isRunning || !mouse.isAlive) {
        this.log(`- Thread ${mouse.tag} - Arrêt du thread pour ${mouse.name} (simulation arrêtée ou souris morte)`);
        return;
      }
      
      this.log(`- Thread ${mouse.tag} - Premier mouvement pour ${mouse.name}`);
      await this.processMouseTurn(mouse);
    }, 1000); // 1 seconde pour toutes les souris
    
    const threadId = setInterval(async () => {
      if (!this.isRunning || !mouse.isAlive) {
        this.log(`- Thread ${mouse.tag} - Arrêt du thread pour ${mouse.name} (simulation arrêtée ou souris morte)`);
        this.stopMouseThread(mouseId);
        return;
      }
      
      this.log(`- Thread ${mouse.tag} - Exécution du tour pour ${mouse.name}`);
      await this.processMouseTurn(mouse);
    }, delay);
    
    this.mouseThreads.set(mouseId, threadId);
  }

  // Arrêter le thread d'une souris
  private stopMouseThread(mouseId: string) {
    const threadId = this.mouseThreads.get(mouseId);
    if (threadId) {
      clearInterval(threadId);
      this.mouseThreads.delete(mouseId);
    }
  }

  // Nettoyer les instances d'IA Python
  private async cleanupPythonAI() {
    try {
      const response = await fetch(getApiUrl('/api/cleanup'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        this.log(` Nettoyage des instances d'IA: ${result.instances_removed} instances supprimées`);
      } else {
        this.log(` Erreur lors du nettoyage des instances d'IA`);
      }
    } catch (error) {
      this.log(` Impossible de nettoyer les instances d'IA: ${error}`);
    }
  }

  // Arrêter la simulation
  stop() {
    this.isRunning = false;
    
    // Arrêter tous les threads de souris
    this.mouseThreads.forEach((threadId, mouseId) => {
      clearInterval(threadId);
    });
    this.mouseThreads.clear();
    
    // Arrêter la vérification périodique
    if (this.endCheckInterval) {
      clearInterval(this.endCheckInterval);
      this.endCheckInterval = null;
    }
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Nettoyer les instances d'IA Python
    this.cleanupPythonAI();
    
    this.simulation.status = 'completed';
    this.simulation.endTime = new Date().toISOString();
    this.log('Simulation arrêtée - Tous les threads fermés');
    this.updateSimulation();
  }

  // Mettre en pause la simulation
  pause() {
    this.isRunning = false;
    
    // Arrêter tous les threads de souris
    this.mouseThreads.forEach((threadId, mouseId) => {
      clearInterval(threadId);
    });
    this.mouseThreads.clear();
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.simulation.status = 'paused';
    this.log('Simulation mise en pause - Tous les threads suspendus');
    this.updateSimulation();
  }

  // Reprendre la simulation
  resume() {
    if (!this.isRunning && this.simulation.status === 'paused') {
      this.isRunning = true;
      this.simulation.status = 'running';
      
      // Redémarrer les threads pour chaque souris vivante
      this.simulation.mice.filter(mouse => mouse.isAlive).forEach(mouse => {
        this.startMouseThread(mouse);
      });
      
      this.log('Simulation reprise - Threads redémarrés');
      this.updateSimulation();
    }
  }


  // Traiter le tour d'une souris
  private async processMouseTurn(mouse: Mouse) {
    try {
      // Chaque souris a son propre compteur de tours
      if (!mouse.moves) {
        mouse.moves = 0;
      }
      mouse.moves++;
      
      this.log(`- Thread ${mouse.tag} - Tour ${mouse.moves} pour ${mouse.name} à la position (${mouse.position.x}, ${mouse.position.y})`);
      
      // Vérifier si la souris est déjà sur un fromage non collecté
      const alreadyOnCheese = this.checkCheeseFound(mouse.position);
      this.log(`- Thread ${mouse.tag} - Vérification fromage à (${mouse.position.x}, ${mouse.position.y}): ${alreadyOnCheese}`);
      if (alreadyOnCheese) {
        const cheeseKey = `${mouse.position.x}-${mouse.position.y}`;
        if (!this.collectedCheeses.has(cheeseKey)) {
          // La souris est sur un fromage non collecté, le collecter
          mouse.cheeseFound++;
          this.log(` ${mouse.name} a trouvé du fromage à (${mouse.position.x}, ${mouse.position.y}) ! Total: ${mouse.cheeseFound}`);
          
          // Marquer ce fromage comme collecté
          this.collectedCheeses.add(cheeseKey);
          this.log(` Fromage collecté: ${cheeseKey} (Total collectés: ${this.collectedCheeses.size}/${this.totalCheesesCount})`);
          
          // Retirer le fromage de la grille
          this.removeCheeseFromGrid(mouse.position);
          
          // Afficher le progrès
          const remaining = this.getRemainingCheesesCount();
          const total = this.getTotalCheesesCount();
          const collected = this.collectedCheeses.size;
          this.log(` Progrès: ${collected}/${total} fromages collectés (${remaining} restants)`);
          
          // La simulation continue - pas de vérification de fin ici
          this.log(` Simulation continue - il reste des fromages à collecter`);
        }
        // Si le fromage est déjà collecté, la souris peut continuer à bouger
      }
      
      // Obtenir le mouvement de l'API Python
      const move = await this.getMouseMoveFromPython(mouse);
      
      // Calculer la nouvelle position
      const newPosition = this.calculateNewPosition(mouse.position, move);
      
      // Vérifier si le mouvement est valide
      if (this.isValidMove(newPosition)) {
        this.log(`- Thread ${mouse.tag} - Mouvement valide: ${mouse.position.x},${mouse.position.y} → ${newPosition.x},${newPosition.y}`);
        // Mettre à jour la position
        mouse.position = newPosition;
        mouse.moves++;
        
        // Vérifier si la souris a trouvé du fromage
        const cheeseFound = this.checkCheeseFound(newPosition);
        if (cheeseFound) {
          mouse.cheeseFound++;
          this.log(` ${mouse.name} a trouvé du fromage à (${newPosition.x}, ${newPosition.y}) ! Total: ${mouse.cheeseFound}`);
          
          // Marquer ce fromage comme collecté
          const cheeseKey = `${newPosition.x}-${newPosition.y}`;
          this.collectedCheeses.add(cheeseKey);
          
          // Retirer le fromage de la grille
          this.removeCheeseFromGrid(newPosition);
          
          // Vérifier si tous les fromages atteignables ont été collectés
          if (this.checkAllCheesesCollected()) {
            this.log(`${mouse.name} a collecté tous les fromages ! Simulation terminée !`);
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
            this.log(` Progrès: ${collected}/${total} fromages collectés (${remaining} restants)`);
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
        this.log(` ${mouse.name} ne peut pas se déplacer vers ${move} - mouvement bloqué de (${mouse.position.x},${mouse.position.y}) vers (${newPosition.x},${newPosition.y})`);
      }
      
      // Vérifier les conditions de fin après chaque mouvement
      this.checkEndConditions();
      
      // Mettre à jour la simulation
      this.updateSimulation();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Gestion spécifique de l'erreur hasOtherMiceNearby
      if (errorMessage.includes('hasOtherMiceNearby')) {
        this.log(` ERREUR API PYTHON: ${mouse.name} - Problème de communication avec l'API Python`);
        this.log(` Solution: Vérifiez que l'API Python est démarrée sur le port 8000`);
        this.log(` Détails: ${errorMessage}`);
      } else {
        this.log(`Erreur lors du traitement de ${mouse.name}: ${errorMessage}`);
      }
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
          cheeseFound: mouse.cheeseFound,
          tag: mouse.tag
        } as any,
        availableMoves,
        available_cheeses: uncollectedCheeses // Passer les fromages disponibles pour l'optimisation
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
    
    this.log(` Vérification fromage à (${x}, ${y}): cellType='${cellType}'`);
    
    // Vérifier si c'est un fromage dans la grille
    if (cellType !== 'cheese') {
      this.log(` Pas un fromage: cellType='${cellType}'`);
      return false;
    }
    
    // Vérifier si ce fromage n'a pas encore été collecté
    const cheeseKey = `${x}-${y}`;
    const isCollected = this.collectedCheeses.has(cheeseKey);
    this.log(` Fromage trouvé à (${x}, ${y}): déjà collecté=${isCollected}`);
    return !isCollected;
  }

  // Vérifier si tous les fromages atteignables ont été collectés
  private checkAllCheesesCollected(): boolean {
    const totalCheeses = this.getTotalCheesesCount();
    const collectedCount = this.collectedCheeses.size;
    
    // Vérification alternative : compter les fromages restants dans la grille
    const remainingInGrid = this.countCheesesInGrid();
    
    this.log(` Vérification fin: ${collectedCount}/${totalCheeses} fromages collectés`);
    this.log(` Fromages restants dans la grille: ${remainingInGrid}`);
    this.log(` Fromages collectés: [${Array.from(this.collectedCheeses).join(', ')}]`);
    
    // Vérifier seulement s'il n'y a plus de fromages dans la grille
    if (remainingInGrid === 0) {
      this.log(` Tous les fromages ont été collectés ! (${collectedCount}/${totalCheeses})`);
      return true;
    }
    
    this.log(` Simulation continue - ${totalCheeses - collectedCount} fromages restants (${remainingInGrid} dans la grille)`);
    return false;
  }
  
  // Compter les fromages restants dans la grille
  private countCheesesInGrid(): number {
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

  // Obtenir le nombre total de fromages dans le labyrinthe (fromages originaux)
  private getTotalCheesesCount(): number {
    // Utiliser le nombre stocké au début de la simulation
    return this.totalCheesesCount;
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

  // Retirer un fromage de la grille
  private removeCheeseFromGrid(position: Position) {
    const { x, y } = position;
    
    this.log(` Tentative de retirer le fromage à (${x}, ${y})`);
    this.log(` État de la grille avant: grid[${y}][${x}] = '${this.simulation.labyrinth.grid[y]?.[x]}'`);
    
    // Changer le type de cellule de 'cheese' à 'path'
    if (this.simulation.labyrinth.grid[y] && this.simulation.labyrinth.grid[y][x] === 'cheese') {
      this.simulation.labyrinth.grid[y][x] = 'path';
      this.log(` Fromage retiré de la grille à (${x}, ${y}) - Cellule changée de 'cheese' à 'path'`);
      this.log(` État de la grille après: grid[${y}][${x}] = '${this.simulation.labyrinth.grid[y][x]}'`);
    } else {
      this.log(` Tentative de retirer un fromage à (${x}, ${y}) mais la cellule n'est pas un fromage: ${this.simulation.labyrinth.grid[y]?.[x]}`);
    }
    
    // Retirer aussi de la liste des positions de fromages
    this.simulation.labyrinth.cheesePositions = this.simulation.labyrinth.cheesePositions.filter(
      pos => !(pos.x === x && pos.y === y)
    );
  }

  // Mettre à jour la simulation
  private updateSimulation() {
    if (this.onUpdate) {
      // Créer une copie profonde pour forcer la mise à jour
      const updatedSimulation = {
        ...this.simulation,
        labyrinth: {
          ...this.simulation.labyrinth,
          grid: this.simulation.labyrinth.grid.map(row => [...row]),
          cheesePositions: [...this.simulation.labyrinth.cheesePositions]
        },
        mice: this.simulation.mice.map(mouse => ({ ...mouse }))
      };
      this.onUpdate(updatedSimulation);
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
