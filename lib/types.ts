// Types pour le système de simulation de souris dans un labyrinthe

export interface Position {
  x: number;
  y: number;
}

// NEW: algorithms supported by the Python backend
export type Algorithm = 'greedy' | 'random' | 'straight' | 'intelligent';

export interface Mouse {
  id: string;
  name: string;
  position: Position;
  movementDelay: number; // Délai entre les mouvements en millisecondes
  health: number;
  happiness: number;
  energy: number;
  cheeseFound: number;
  moves: number;
  isAlive: boolean;
  lastMove?: Direction;
  tag: number; // Tag pour différencier les souris visuellement (1, 2, 3, etc.)
  algorithm: Algorithm;
}

export interface Labyrinth {
  id: string;
  name: string;
  description: string;
  width: number;
  height: number;
  grid: CellType[][];
  startPositions: Position[];
  cheesePositions: Position[];
  createdAt: string;
  updatedAt: string;
}

export interface Simulation {
  id: string;
  labyrinthId: string;
  labyrinth: Labyrinth;
  mice: Mouse[];
  rules: SimulationRules;
  status: SimulationStatus;
  currentTurn: number;
  maxTurns: number;
  startTime?: string;
  endTime?: string;
  results?: SimulationResults;
}

export interface SimulationRules {
  id: string;
  name: string;
  description: string;
  turnDuration: number; // en millisecondes
  energyConsumption: number; // perte d'énergie par tour
  happinessDecay: number; // perte de bonheur par tour
  isolationPenalty: number; // pénalité pour isolement
  cheeseBonus: number; // bonus pour trouver du fromage
  proximityBonus: number; // bonus pour proximité avec autres souris
  maxEnergy: number;
  maxHappiness: number;
  winConditions: WinCondition[];
  simulationMode?: 'normal' | 'survie' | 'mortelle'; // Mode de simulation: normal (par défaut), survie ou mortelle
}

export interface SimulationResults {
  totalTurns: number;
  duration: number; // en millisecondes
  miceResults: MouseResult[];
  winner?: string; // ID de la souris gagnante
  summary: string;
}

export interface MouseResult {
  mouseId: string;
  mouseName: string;
  finalPosition: Position;
  cheeseFound: number;
  totalMoves: number;
  finalHealth: number;
  finalHappiness: number;
  finalEnergy: number;
  isWinner: boolean;
  causeOfDeath?: string;
}

export type CellType = 'wall' | 'path' | 'cheese' | 'start';
export type Direction = 'north' | 'south' | 'east' | 'west';
export type IntelligenceType = 'random' | 'directional' | 'smart' | 'social';
export type SimulationStatus = 'idle' | 'running' | 'paused' | 'completed' | 'error';

export interface WinCondition {
  type: 'cheese_count' | 'energy' | 'happiness' | 'position' | 'survival';
  value: number;
  description: string;
}

// Types pour l'API Python IA
export interface IARequest {
  mouseId: string;
  position: Position;
  environment: EnvironmentContext;
  mouseState: {
    health: number;
    happiness: number;
    energy: number;
    cheeseFound: number;
  };
  availableMoves: Direction[];
}

export interface IAResponse {
  mouseId: string;
  move: Direction;
  reasoning?: string;
}

export interface EnvironmentContext {
  grid: CellType[][];
  width: number;
  height: number;
  cheesePositions: Position[];
  otherMice: Array<{
    id: string;
    position: Position;
    distance: number;
  }>;
  walls: Position[];
  paths: Position[];
}

// Types pour les WebSocket
export interface SimulationUpdate {
  type: 'mouse_move' | 'cheese_found' | 'mouse_died' | 'turn_complete' | 'simulation_end';
  data: Record<string, unknown>;
  timestamp: string;
  turn: number;
}

export interface MouseMoveUpdate {
  mouseId: string;
  fromPosition: Position;
  toPosition: Position;
  direction: Direction;
}

export interface CheeseFoundUpdate {
  mouseId: string;
  position: Position;
  cheeseCount: number;
}

export interface MouseDiedUpdate {
  mouseId: string;
  position: Position;
  cause: string;
}

// Types pour l'API Supabase
export interface DatabaseLabyrinth {
  id: string;
  name: string;
  description: string;
  grid_data: Record<string, unknown>; // JSON
  created_at: string;
  updated_at: string;
}

export interface DatabaseSimulationRules {
  id: string;
  name: string;
  description: string;
  rules_data: Record<string, unknown>; // JSON
  is_predefined: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSimulation {
  id: string;
  labyrinth_id: string;
  rules_id: string;
  start_time: string;
  end_time?: string;
  status: string;
  results?: Record<string, unknown>; // JSON
}

export interface DatabaseMouse {
  id: string;
  simulation_id: string;
  name: string;
  intelligence_type: string;
  initial_position: Record<string, unknown>; // JSON
  final_position?: Record<string, unknown>; // JSON
  health: number;
  happiness: number;
  energy: number;
  cheese_found: number;
  moves: number;
  is_alive: boolean;
}

export interface DatabaseSharedSimulation {
  id: string;
  simulation_id: string;
  share_token: string;
  expires_at?: string;
  view_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types pour les règles prédéfinies
export interface PredefinedRules {
  [key: string]: SimulationRules;
}

// Types pour la configuration
export interface AppConfig {
  pythonServerUrl: string;
  websocketPort: number;
  simulationTickRate: number;
  maxMicePerSimulation: number;
}

// Types pour la configuration de simulation
export interface SimulationConfig {
  labyrinthId: string;
  rulesId: string;
  mice: Array<{
    name: string;
    movementDelay: number; // Délai entre les mouvements en millisecondes
    startPosition?: Position;
    tag: number; // Tag pour différencier les souris visuellement
  }>;
}

// Types pour le partage de simulations
export interface SharedSimulation {
  shareToken: string;
  shareUrl: string;
  expiresAt?: string;
  viewCount: number;
  isActive: boolean;
}
