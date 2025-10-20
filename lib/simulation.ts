import { randomUUID } from "crypto";
import type { Direction, Maze, Point, SimulationConfig, SimulationState, Mouse, TurnFrame } from "@/lib/rules";

const sims = new Map<string, SimulationState>();

function parseMaze(maze: Maze) {
  const h = maze.grid.length;
  const w = maze.grid[0].length;
  const walls = new Set<string>();
  const cheeses: Point[] = [];
  let start: Point | null = null;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = maze.grid[y][x];
      if (c === "#") walls.add(`${x},${y}`);
      if (c === "C") cheeses.push({ x, y });
      if (c === "S") start = { x, y };
    }
  }
  return { h, w, walls, cheeses, start };
}

function nextPoint(p: Point, d: Direction): Point {
  if (d === "N") return { x: p.x, y: p.y - 1 };
  if (d === "S") return { x: p.x, y: p.y + 1 };
  if (d === "W") return { x: p.x - 1, y: p.y };
  if (d === "E") return { x: p.x + 1, y: p.y };
  return p;
}

async function callAgent(agentUrl: string, payload: any): Promise<Direction> {
  try {
    const res = await fetch(agentUrl, { method:"POST", headers:{ "content-type":"application/json" }, body: JSON.stringify(payload), cache:"no-store" });
    const data = await res.json();
    if (["N","S","E","W","X"].includes(data.direction)) return data.direction;
  } catch (e) { console.error("agent error", e); }
  return "X";
}

export function getSimulation(id: string) { return sims.get(id) ?? null; }

function sense(state: SimulationState, env: any, m: Mouse) {
  const around = [
    { dir:"N", p: { x: m.pos.x, y: m.pos.y-1 } },
    { dir:"S", p: { x: m.pos.x, y: m.pos.y+1 } },
    { dir:"W", p: { x: m.pos.x-1, y: m.pos.y } },
    { dir:"E", p: { x: m.pos.x+1, y: m.pos.y } }
  ];
  const isFree = (p: Point) => !(p.x<0||p.y<0||p.x>=env.w||p.y>=env.h||env.walls.has(`${p.x},${p.y}`));
  return { turn: state.turn, me: { x: m.pos.x, y: m.pos.y, health: m.health, mood: m.mood }, neighbors: around.map(a=>({ dir:a.dir, free:isFree(a.p) })), cheeses: state.cheeses, mice: state.mice.map(mm=>({ id:mm.id, x:mm.pos.x, y:mm.pos.y })) };
}

function applyRules_simple(state: SimulationState, env:any, m: Mouse, moved:boolean) {
  if (state.turn % 10 === 0 && moved) m.health = Math.max(0, m.health - 1);
  if (!moved && state.turn % 5 === 0) m.mood = Math.max(0, m.mood - 1);
}
function dist(a: Point, b: Point) { return Math.abs(a.x-b.x)+Math.abs(a.y-b.y); }
function applyRules_social(state: SimulationState, env:any, m: Mouse, moved:boolean) {
  applyRules_simple(state, env, m, moved);
  const near = state.mice.some(mm => mm.id !== m.id && dist(mm.pos, m.pos) <= 3);
  if (near) m.mood = Math.min(10, m.mood+1);
  else if (state.turn % 5 === 0) m.mood = Math.max(0, m.mood-1);
}

function randomFreeCell(
  env: { w: number; h: number; walls: Set<string> },
  used: Set<string>,
  maze: Maze
) {
  const free: { x: number; y: number }[] = [];
  for (let y = 0; y < env.h; y++) {
    for (let x = 0; x < env.w; x++) {
      const ch = maze.grid[y][x];
      // case vide uniquement, pas mur (#), pas déjà utilisée
      if (ch === "." && !env.walls.has(`${x},${y}`) && !used.has(`${x},${y}`)) {
        free.push({ x, y });
      }
    }
  }
  if (free.length === 0) return { x: 1, y: 1 }; // fallback très rare
  const idx = Math.floor(Math.random() * free.length);
  used.add(`${free[idx].x},${free[idx].y}`);
  return free[idx];
}

export function createSimulation(cfg: SimulationConfig) {
  const id = randomUUID();
  const { h, w, walls, cheeses /*, start*/ } = parseMaze(cfg.maze);

  const env = { h, w, walls };
  const used = new Set<string>(); // empêche deux souris de partager la même case au spawn

  const mice: Mouse[] = cfg.mice.map((m, i) => {
    const spawn = randomFreeCell(env, used, cfg.maze);
    return {
      id: randomUUID(),
      name: m.name ?? `Souris ${i + 1}`,
      agentUrl: m.agentUrl,
      pos: spawn,
      health: 10,
      mood: 10,
      eaten: 0,
    };
  });

  const state: SimulationState = {
    id,
    turn: 0,
    maze: cfg.maze,
    mice,
    cheeses: [...cheeses],
    finished: false,
    ruleset: cfg.ruleset ?? "simple",
    history: [],
  };

  sims.set(id, state);
  runLoop(state, cfg, env);
  return state;
}


async function runLoop(state: SimulationState, cfg: SimulationConfig, env:any) {
  const maxTurns = cfg.maxTurns ?? 50;
  const turnMs = cfg.turnMs ?? 400;

  while (!state.finished && state.turn < maxTurns) {
    state.turn += 1;
    const events: string[] = [];

    for (const m of state.mice) {
      const before = { ...m.pos };
      const dir = await callAgent(m.agentUrl, sense(state, env, m));
      const np = nextPoint(m.pos, dir as any);
      const blocked = np.x<0||np.y<0||np.x>=env.w||np.y>=env.h||env.walls.has(`${np.x},${np.y}`);
      let moved = false;
      if (!blocked) { m.pos = np; moved = (before.x!==np.x||before.y!==np.y); }

      const eatIdx = state.cheeses.findIndex(c=>c.x===m.pos.x && c.y===m.pos.y);
      if (eatIdx >= 0) { state.cheeses.splice(eatIdx,1); m.health=Math.min(10,m.health+3); m.mood=10; m.eaten+=1; events.push(`${m.name} a mangé un fromage (${m.eaten})`); }

      if (state.ruleset==="simple") applyRules_simple(state, env, m, moved);
      else applyRules_social(state, env, m, moved);
      if (m.health<=0) events.push(`${m.name} est décédée`);
    }

    const frame: TurnFrame = { turn: state.turn, mice: state.mice.map(mm=>({ id:mm.id, x:mm.pos.x, y:mm.pos.y, health:mm.health, mood:mm.mood, eaten:mm.eaten })), cheeses:[...state.cheeses], events };
    state.history.push(frame);

    const allDead = state.mice.every(m=>m.health<=0);
    const noCheese = state.cheeses.length===0;
    if (allDead || noCheese || state.turn>=maxTurns) state.finished = true;

    await new Promise(r=>setTimeout(r, turnMs));
  }
}
