'use client';

import React from 'react';
import { Mouse as MouseType, Direction } from '@/lib/types';

interface MouseProps {
  mouse: MouseType;
  size?: 'sm' | 'md' | 'lg';
  showStats?: boolean;
}

const Mouse: React.FC<MouseProps> = ({ 
  mouse, 
  size = 'md',
  showStats = false 
}) => {
  const getMouseEmoji = (): string => {
    if (!mouse.isAlive) return '💀';
    
    // Changer l'emoji selon la direction du dernier mouvement
    switch (mouse.lastMove) {
      case 'north':
        return '⬆️';
      case 'south':
        return '⬇️';
      case 'east':
        return '➡️';
      case 'west':
        return '⬅️';
      default:
        return '';
    }
  };

  const getHealthColor = (health: number): string => {
    if (health > 70) return 'text-green-600';
    if (health > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHappinessColor = (happiness: number): string => {
    if (happiness > 70) return 'text-blue-600';
    if (happiness > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEnergyColor = (energy: number): string => {
    if (energy > 70) return 'text-green-600';
    if (energy > 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSizeClasses = (): string => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-2xl';
      default:
        return 'text-lg';
    }
  };

  const getIntelligenceColor = (type: string): string => {
    switch (type) {
      case 'random':
        return 'bg-purple-100 text-purple-800';
      case 'directional':
        return 'bg-blue-100 text-blue-800';
      case 'smart':
        return 'bg-green-100 text-green-800';
      case 'social':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mouse-component relative">
      {/* Emoji de la souris */}
      <div className={`${getSizeClasses()} cursor-pointer`} title={mouse.name}>
        {getMouseEmoji()}
      </div>
      
      {/* Statistiques détaillées */}
      {showStats && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-48">
          <div className="text-xs font-semibold text-gray-800 mb-2">
            {mouse.name}
          </div>
          
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-700">Type IA:</span>
              <span className={`px-1 py-0.5 rounded text-xs ${getIntelligenceColor(mouse.intelligenceType)}`}>
                {mouse.intelligenceType}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Santé:</span>
              <span className={getHealthColor(mouse.health)}>
                {mouse.health}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Bonheur:</span>
              <span className={getHappinessColor(mouse.happiness)}>
                {mouse.happiness}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Énergie:</span>
              <span className={getEnergyColor(mouse.energy)}>
                {mouse.energy}%
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Fromages:</span>
              <span className="text-yellow-600">
                {mouse.cheeseFound}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Mouvements:</span>
              <span className="text-gray-600">
                {mouse.moves}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-700">Position:</span>
              <span className="text-gray-600">
                ({mouse.position.x}, {mouse.position.y})
              </span>
            </div>
            
            {mouse.lastMove && (
              <div className="flex justify-between">
                <span className="text-gray-700">Dernier mouvement:</span>
                <span className="text-gray-600 capitalize">
                  {mouse.lastMove}
                </span>
              </div>
            )}
          </div>
          
          {/* Barres de progression */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-gray-700">Santé:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    mouse.health > 70 ? 'bg-green-500' : 
                    mouse.health > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${mouse.health}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-gray-700">Bonheur:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    mouse.happiness > 70 ? 'bg-blue-500' : 
                    mouse.happiness > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${mouse.happiness}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs w-12 text-gray-700">Énergie:</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    mouse.energy > 70 ? 'bg-green-500' : 
                    mouse.energy > 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${mouse.energy}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mouse;
