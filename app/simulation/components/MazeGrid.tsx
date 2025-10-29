'use client';

import React from 'react';
import { Labyrinth, Mouse, CellType } from '@/lib/types';
import './MazeGrid.css';

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
  // Log pour vérifier les souris reçues
  console.log('🐭 Souris reçues dans MazeGrid:', mice);
  console.log('🐭 Tags des souris:', mice.map(m => ({ name: m.name, tag: m.tag })));
  const getCellClass = (cellType: CellType): string => {
    switch (cellType) {
      case 'wall':
        return 'cell cell-wall';
      case 'path':
        return 'cell cell-path';
      case 'cheese':
        return 'cell cell-cheese';
      case 'start':
        return 'cell cell-start';
      default:
        return 'cell cell-path';
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
    const mouse = mice.find(mouse => mouse.position.x === x && mouse.position.y === y);
    if (mouse) {
      console.log(` Souris trouvée à (${x}, ${y}):`, mouse.name, 'Tag:', mouse.tag);
    }
    return mouse;
  };

  const isCheesePosition = (x: number, y: number): boolean => {
    return labyrinth.cheesePositions.some(pos => pos.x === x && pos.y === y);
  };

  const isStartPosition = (x: number, y: number): boolean => {
    return labyrinth.startPositions.some(pos => pos.x === x && pos.y === y);
  };

  return (
    <div>
    <div className={`maze-grid ${className}`}>
      <div className="grid" 
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
                  ${getCellClass(cellType)}
                  ${onCellClick ? 'hover:opacity-80' : ''}
                  transition-all duration-200
                `}
                onClick={() => onCellClick?.(x, y)}
                title={`Position (${x}, ${y}) - ${cellType}`}
              >
                {/* Contenu de la cellule */}
                {mouse ? (
                  <div className="mouse relative">
                    <span className="text-lg">🐭</span>
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold border border-white">
                      {(() => {
                        // Forcer la définition du tag avec plusieurs fallbacks
                        let tag = mouse.tag;
                        if (!tag || tag === undefined || tag === null) {
                          tag = mice.indexOf(mouse) + 1;
                        }
                        if (!tag || tag === undefined || tag === null) {
                          tag = 1; // Fallback final
                        }
                        console.log(`🐭 Affichage tag pour ${mouse.name}:`, tag, 'mouse.tag original:', mouse.tag);
                        return tag;
                      })()}
                    </span>
                  </div>
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
   
    </div>
       <div className="mt-4 flex flex-wrap gap-4 text-sm">
       <div className="flex items-center gap-2">
         <div className="relative">
           <span className="text-lg">🐭</span>
           <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">1</span>
         </div>
         <span>Souris (Tag)</span>
       </div>
       <div className="flex items-center gap-2">
         <span className="text-lg">🧀</span>
         <span>Fromage</span>
       </div>
       <div className="flex items-center gap-2">
         <div className="w-4 h-4 bg-gray-800 rounded"></div>
         <span>Mur</span>
       </div>
     </div>
    </div>
  );
};

export default MazeGrid;
