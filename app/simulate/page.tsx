'use client';

import { useEffect, useRef, useState } from 'react';

type Maze = { id: string; name: string; grid: string[] };
type MouseCfg = { name: string; agentUrl: string };

export default function SimulatePage() {
  const [mazes, setMazes] = useState<Maze[]>([]);
  const [mazeId, setMazeId] = useState<string>('');
  const [ruleset, setRuleset] = useState<'simple' | 'social'>('social');
  const [mice, setMice] = useState<MouseCfg[]>([
    { name: 'Souris 1', agentUrl: 'http://127.0.0.1:8001/decide' },
    { name: 'Souris 2', agentUrl: 'http://127.0.0.1:8002/decide' },
  ]);
  const [simId, setSimId] = useState<string | null>(null);
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    fetch('/api/mazes').then(r => r.json()).then(d => {
      setMazes(d.mazes);
      setMazeId(d.mazes?.[0]?.id || '');
    });
  }, []);

  const addMouse = () =>
    setMice(m => [...m, { name: `Souris ${m.length + 1}`, agentUrl: 'http://127.0.0.1:8003/decide' }]);

  const start = async () => {
    const maze = mazes.find(m => m.id === mazeId) || mazes[0];
    const res = await fetch('/api/simulations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ maze, mice, ruleset, maxTurns: 50, turnMs: 400 }),
    });
    const { id } = await res.json();
    setSimId(id);
    const evt = new EventSource(`/api/simulations/${id}/stream`);
    evt.onmessage = e => setState(JSON.parse(e.data));
    evt.onerror = () => evt.close();
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cell = 28;

  useEffect(() => {
    if (!state || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const grid: string[] = state.maze.grid;
    const h = grid.length, w = grid[0].length;
    canvasRef.current.width = w * cell;
    canvasRef.current.height = h * cell;
    ctx.clearRect(0, 0, w * cell, h * cell);

    // consistent font for emoji rendering
    ctx.font = `${cell * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const ch = grid[y][x];
            ctx.strokeStyle = '#cbd5e1'; // slate-300
            ctx.strokeRect(x * cell, y * cell, cell, cell);

            if (ch === '#') {
                ctx.fillStyle = '#0f172a'; // slate-900
                ctx.fillRect(x * cell, y * cell, cell, cell);
            }
        }
    }

    // draw dynamic cheese positions from state.cheeses
    for (const c of state.cheeses) {
        ctx.fillText('🧀', c.x * cell + cell / 2, c.y * cell + cell / 2 + 1);
    }

    // draw mice
    state.mice.forEach((m: any, i: number) => {
        ctx.fillText(`🐭${i + 1}`, m.pos.x * cell + cell / 2, m.pos.y * cell + cell / 2 + 2);
    });
    }, [state]);


  return (
    <div className="min-h-screen bg-gray-50">
      {/* header simple, cohérent */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Configurer la simulation</h2>
          {simId && state?.finished && (
            <a className="text-blue-600 hover:underline" href={`/results/${simId}`}>
              Voir les résultats
            </a>
          )}
        </div>
      </header>

      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-8">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Paramètres</h3>
              <label className="block text-sm text-gray-600 mb-1">Labyrinthe</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mb-4"
                value={mazeId}
                onChange={e => setMazeId(e.target.value)}
              >
                {mazes.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>

              <label className="block text-sm text-gray-600 mb-1">Règles</label>
              <select
                className="w-full border rounded-lg px-3 py-2 mb-4"
                value={ruleset}
                onChange={e => setRuleset(e.target.value as any)}
              >
                <option value="simple">Simple</option>
                <option value="social">Social (bien-être)</option>
              </select>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Souris</span>
                <div className="space-x-2">
                  <button
                    className="px-3 py-1 border rounded-lg hover:bg-gray-50"
                    onClick={() => setMice(m => (m.length > 1 ? m.slice(0, -1) : m))}
                  >
                    – Retirer
                  </button>
                  <button className="px-3 py-1 border rounded-lg hover:bg-gray-50" onClick={addMouse}>
                    + Ajouter
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {mice.map((m, idx) => (
                  <div key={idx} className="flex flex-col gap-2 bg-gray-50 rounded-lg p-3">
                    <input
                      className="border rounded-lg px-3 py-2"
                      value={m.name}
                      onChange={e => {
                        const copy = [...mice];
                        copy[idx] = { ...m, name: e.target.value };
                        setMice(copy);
                      }}
                    />
                    <select
                      className="border rounded-lg px-3 py-2"
                      value={m.agentUrl}
                      onChange={e => {
                        const copy = [...mice];
                        copy[idx] = { ...m, agentUrl: e.target.value };
                        setMice(copy);
                      }}
                    >
                      <option value="http://127.0.0.1:8001/decide">IA aléatoire (8001)</option>
                      <option value="http://127.0.0.1:8002/decide">IA tout droit (8002)</option>
                      <option value="http://127.0.0.1:8003/decide">IA glouton (8003)</option>
                    </select>
                  </div>
                ))}
              </div>

              <button
                className="mt-6 w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition"
                onClick={start}
              >
                Lancer la simulation
              </button>
            </div>

            {/* Stats live */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques</h3>
              {state ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Tour</span><span>{state.turn} {state.finished ? '(terminé)' : ''}</span></div>
                  {state.mice.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between">
                      <span>🐭 {m.name || `Souris ${i + 1}`}</span>
                      <span>❤️ {m.health} • 😀 {m.mood} • 🧀 {m.eaten ?? 0}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">En attente de démarrage…</p>
              )}
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Labyrinthe</h3>
              <div className="overflow-auto border rounded-lg">
                <canvas ref={canvasRef} className="block m-auto" />
              </div>
              {state?.finished && simId && (
                <div className="mt-4">
                  <a className="text-blue-600 hover:underline" href={`/results/${simId}`}>
                    Voir les résultats & export CSV
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
