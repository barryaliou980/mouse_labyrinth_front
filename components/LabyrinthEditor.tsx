'use client';

import React, { useState } from 'react';
import { Labyrinth, CellType, Position } from '@/lib/types';
import { LabyrinthService } from '@/lib/apiClient';

interface LabyrinthEditorProps {
  labyrinth?: Labyrinth;
  onSave?: (labyrinth: Labyrinth) => void;
  onCancel?: () => void;
}

export default function LabyrinthEditor({ labyrinth, onSave, onCancel }: LabyrinthEditorProps) {
  const [name, setName] = useState(labyrinth?.name || '');
  const [description, setDescription] = useState(labyrinth?.description || '');
  const [width, setWidth] = useState(labyrinth?.width || 10);
  const [height, setHeight] = useState(labyrinth?.height || 10);
  const [grid, setGrid] = useState<CellType[][]>(
    labyrinth?.grid || Array(height).fill(null).map(() => Array(width).fill('path'))
  );
  const [startPositions, setStartPositions] = useState<Position[]>(labyrinth?.startPositions || []);
  const [cheesePositions, setCheesePositions] = useState<Position[]>(labyrinth?.cheesePositions || []);
  const [selectedCellType, setSelectedCellType] = useState<CellType>('path');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mettre à jour la grille quand les dimensions changent
  React.useEffect(() => {
    const newGrid = Array(height).fill(null).map((_, y) => 
      Array(width).fill(null).map((_, x) => 
        grid[y] && grid[y][x] ? grid[y][x] : 'path'
      )
    );
    setGrid(newGrid);
  }, [width, height]);

  const handleCellClick = (x: number, y: number) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[y][x] = selectedCellType;
    setGrid(newGrid);

    // Gérer les positions spéciales
    if (selectedCellType === 'start') {
      setStartPositions([{ x, y }]);
    } else if (selectedCellType === 'cheese') {
      setCheesePositions(prev => [...prev, { x, y }]);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const labyrinthData = {
        name,
        description,
        width,
        height,
        grid,
        startPositions,
        cheesePositions
      };

      let savedLabyrinth: Labyrinth;
      if (labyrinth) {
        savedLabyrinth = await LabyrinthService.update(labyrinth.id, labyrinthData);
      } else {
        savedLabyrinth = await LabyrinthService.create(labyrinthData);
      }

      onSave?.(savedLabyrinth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const getCellColor = (cellType: CellType) => {
    switch (cellType) {
      case 'wall': return 'bg-gray-800';
      case 'path': return 'bg-white';
      case 'start': return 'bg-green-500';
      case 'cheese': return 'bg-yellow-500';
      default: return 'bg-white';
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {labyrinth ? 'Modifier le labyrinthe' : 'Créer un nouveau labyrinthe'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulaire */}
        <div className="lg:col-span-1">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Nom du labyrinthe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border rounded h-20"
                placeholder="Description du labyrinthe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Largeur</label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(parseInt(e.target.value) || 10)}
                  className="w-full p-2 border rounded"
                  min="5"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hauteur</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(parseInt(e.target.value) || 10)}
                  className="w-full p-2 border rounded"
                  min="5"
                  max="50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type de cellule</label>
              <div className="grid grid-cols-2 gap-2">
                {(['wall', 'path', 'start', 'cheese'] as CellType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedCellType(type)}
                    className={`p-2 rounded text-sm ${
                      selectedCellType === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {type === 'wall' && 'Mur'}
                    {type === 'path' && 'Chemin'}
                    {type === 'start' && 'Départ'}
                    {type === 'cheese' && 'Fromage'}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Positions de départ: {startPositions.length}</p>
              <p>Fromages: {cheesePositions.length}</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={loading || !name || !description}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        {/* Grille */}
        <div className="lg:col-span-2">
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Grille du labyrinthe</h3>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${width}, 1fr)` }}>
              {grid.map((row, y) =>
                row.map((cell, x) => (
                  <button
                    key={`${x}-${y}`}
                    onClick={() => handleCellClick(x, y)}
                    className={`w-8 h-8 border ${getCellColor(cell)} hover:opacity-80`}
                    title={`${x}, ${y} - ${cell}`}
                  />
                ))
              )}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <p>Cliquez sur une cellule pour la modifier</p>
              <p>Type sélectionné: {selectedCellType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
