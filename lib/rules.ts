export type Direction = "N"|"S"|"E"|"W"|"X";
export type Point = { x:number; y:number };
export type Maze = { id:string; name:string; grid:string[] };
export type Mouse = { id:string; name:string; agentUrl:string; pos:Point; health:number; mood:number; eaten:number; };
export type TurnFrame = { turn:number; mice:Array<{id:string;x:number;y:number;health:number;mood:number;eaten:number}>; cheeses:Point[]; events:string[]; };
export type SimulationConfig = { maze:Maze; mice:Array<{name:string;agentUrl:string;start?:Point}>; ruleset:"simple"|"social"; maxTurns?:number; turnMs?:number; };
export type SimulationState = { id:string; turn:number; maze:Maze; mice:Mouse[]; cheeses:Point[]; finished:boolean; ruleset:"simple"|"social"; history:TurnFrame[]; };
