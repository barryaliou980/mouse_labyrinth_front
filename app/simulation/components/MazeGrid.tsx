'use client';

import React from 'react';
import { Labyrinth, Mouse, CellType } from '@/lib/types';
import MouseComponent from './Mouse';

interface MazeGridProps {
  labyrinth: Labyrinth;
  mice: Mouse[];
  onCellClick?: (x: number, y: number) => void;
  className?: string;
}

const MazeGrid: React.FC<MazeGridProps> = ({
  labyrinth,
  mice,
  onCellClick,
  className = ''
}) => {
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

  const getMouseAtPosition = (x: number, y: number): Mouse | undefined => {
    return mice.find(mouse => mouse.position.x === x && mouse.position.y === y);
  };

  const isCheesePosition = (x: number, y: number): boolean => {
    return labyrinth.cheesePositions.some(pos => pos.x === x && pos.y === y);
  };

  const isStartPosition = (x: number, y: number): boolean => {
    return labyrinth.startPositions.some(pos => pos.x === x && pos.y === y);
  };

  return (
    <div className={`maze-grid ${className}`}>
      <div className="grid gap-0 border-2 border-gray-800" 
           style={{ 
             gridTemplateColumns: `repeat(${labyrinth.width}, 1fr)`,
             gridTemplateRows: `repeat(${labyrinth.height}, 1fr)`
           }}>
        {Array.from({ length: labyrinth.height }, (_, y) =>
          Array.from({ length: labyrinth.width }, (_, x) => {
            const cellType = labyrinth.grid[y][x];
            const mouse = getMouseAtPosition(x, y);
            const hasCheese = isCheesePosition(x, y);
            const isStart = isStartPosition(x, y);
            
            return (
              <div
                key={`${x}-${y}`}
                className={`
                  relative w-8 h-8 flex items-center justify-center text-xs
                  border border-gray-300 cursor-pointer
                  ${getCellColor(cellType)}
                  ${onCellClick ? 'hover:opacity-80' : ''}
                  transition-all duration-200
                `}
                onClick={() => onCellClick?.(x, y)}
                title={`Position (${x}, ${y}) - ${cellType}`}
              >
                {/* Contenu de la cellule */}
                {mouse ? (
                  <MouseComponent mouse={mouse} />
                ) : (
                  <span className="text-lg">
                    {getCellIcon(cellType)}
                  </span>
                )}
                
                {/* Indicateurs visuels */}
                {hasCheese && !mouse && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full"></div>
                )}
                {isStart && !mouse && (
                  <div className="absolute bottom-0 left-0 w-2 h-2 bg-green-500 rounded-full"></div>
                )}
              </div>
            );
          })
        )}
      </div>
      
      {/* Légende */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800 rounded"></div>
          <span>Mur</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
          <span>Chemin</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          <span>Fromage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>Départ</span>
        </div>
      </div>
    </div>
  );
};

export default MazeGrid;
