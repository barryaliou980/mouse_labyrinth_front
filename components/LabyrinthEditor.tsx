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
        grid[y]?.[x] || 'path'
      )
    );
    setGrid(newGrid);
  }, [width, height]);

  const handleCellClick = (x: number, y: number) => {
    const newGrid = [...grid];
    newGrid[y][x] = selectedCellType;
    setGrid(newGrid);
  };

  const getCellColor = (cellType: CellType): string => {
    switch (cellType) {
      case 'wall':
        return 'bg-gray-800';
      case 'path':
        return 'bg-gray-100';
      case 'cheese':
        return 'bg-yellow-400';
      case 'start':
        return 'bg-green-400';
      default:
        return 'bg-gray-100';
    }
  };

  const getCellIcon = (cellType: CellType): string => {
    switch (cellType) {
      case 'cheese':
        return '🧀';
      case 'start':
        return '🚪';
      default:
        return '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Le nom est requis');
      return;
    }

    if (startPositions.length === 0) {
      setError('Au moins une position de départ est requise');
      return;
    }

    if (cheesePositions.length === 0) {
      setError('Au moins une position de fromage est requise');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const labyrinthData: Labyrinth = {
        id: labyrinth?.id || `labyrinth-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        width,
        height,
        grid,
        startPositions,
        cheesePositions,
        createdAt: labyrinth?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (labyrinth) {
        await LabyrinthService.update(labyrinth.id, labyrinthData);
      } else {
        await LabyrinthService.create(labyrinthData);
      }

      onSave?.(labyrinthData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!labyrinth) return;

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le labyrinthe "${labyrinth.name}" ?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await LabyrinthService.delete(labyrinth.id);
      onSave?.(labyrinth);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6" style={{ color: '#111827' }}>
          {labyrinth ? 'Modifier le Labyrinthe' : 'Nouveau Labyrinthe'}
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                Nom *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nom du labyrinthe"
                style={{ color: '#111827' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Description du labyrinthe"
                rows={3}
                style={{ color: '#111827' }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                  Largeur
                </label>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(Math.max(5, Math.min(50, parseInt(e.target.value) || 5)))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="50"
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                  Hauteur
                </label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Math.max(5, Math.min(50, parseInt(e.target.value) || 5)))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="5"
                  max="50"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>

            {/* Contrôles d'édition */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                Type de cellule
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedCellType('wall')}
                  className={`p-3 rounded-lg border-2 ${
                    selectedCellType === 'wall' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-800 rounded"></div>
                    <span style={{ color: '#111827' }}>Mur</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedCellType('path')}
                  className={`p-3 rounded-lg border-2 ${
                    selectedCellType === 'path' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 rounded"></div>
                    <span style={{ color: '#111827' }}>Chemin</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedCellType('start')}
                  className={`p-3 rounded-lg border-2 ${
                    selectedCellType === 'start' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-400 rounded"></div>
                    <span style={{ color: '#111827' }}>Départ</span>
                  </div>
                </button>
                <button
                  onClick={() => setSelectedCellType('cheese')}
                  className={`p-3 rounded-lg border-2 ${
                    selectedCellType === 'cheese' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                    <span style={{ color: '#111827' }}>Fromage</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Positions spéciales */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                  Positions de départ
                </label>
                <div className="flex flex-wrap gap-2">
                  {startPositions.map((pos, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>({pos.x}, {pos.y})</span>
                      <button
                        onClick={() => setStartPositions(prev => prev.filter((_, i) => i !== index))}
                        className="text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
                  Positions de fromage
                </label>
                <div className="flex flex-wrap gap-2">
                  {cheesePositions.map((pos, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm"
                    >
                      <span>({pos.x}, {pos.y})</span>
                      <button
                        onClick={() => setCheesePositions(prev => prev.filter((_, i) => i !== index))}
                        className="text-yellow-600 hover:text-yellow-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grille */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold" style={{ color: '#111827' }}>
              Grille du labyrinthe
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div 
                className="grid gap-1 mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${width}, 1fr)`,
                  gridTemplateRows: `repeat(${height}, 1fr)`,
                  maxWidth: '400px'
                }}
              >
                {Array.from({ length: height }, (_, y) =>
                  Array.from({ length: width }, (_, x) => {
                    const cellType = grid[y]?.[x] || 'path';
                    return (
                      <div
                        key={`${x}-${y}`}
                        className={`
                          w-8 h-8 flex items-center justify-center text-xs
                          border border-gray-300 cursor-pointer
                          ${getCellColor(cellType)}
                          hover:opacity-80 transition-opacity
                        `}
                        onClick={() => handleCellClick(x, y)}
                        title={`Position (${x}, ${y}) - ${cellType}`}
                      >
                        <span className="text-lg">
                          {getCellIcon(cellType)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Messages d'erreur */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800" style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <div>
            {labyrinth && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                style={{ backgroundColor: '#dc2626', color: '#ffffff' }}
                disabled={loading}
              >
                🗑️ Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              disabled={loading}
            >
              {loading ? 'Sauvegarde...' : (labyrinth ? 'Mettre à jour' : 'Créer')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}