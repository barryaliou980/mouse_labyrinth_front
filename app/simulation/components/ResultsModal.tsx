'use client';

import React from 'react';
import { X, Trophy, Mouse, Clock, Target, Award } from 'lucide-react';
import { Simulation, Mouse as MouseType } from '@/lib/types';

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: Simulation | null;
  winner: MouseType | null;
}

const ResultsModal: React.FC<ResultsModalProps> = ({
  isOpen,
  onClose,
  simulation,
  winner
}) => {
  if (!isOpen || !simulation) return null;

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = end.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const getMouseRanking = () => {
    return simulation.mice
      .sort((a, b) => {
        // Trier par fromages trouvés, puis par mouvements (moins c'est mieux)
        if (b.cheeseFound !== a.cheeseFound) {
          return b.cheeseFound - a.cheeseFound;
        }
        return a.moves - b.moves;
      });
  };

  const ranking = getMouseRanking();

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-16">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Trophy className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Résultats de la Simulation</h2>
                <p className="text-yellow-100">
                  {winner ? `${winner.name} a gagné !` : 'Simulation terminée'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-yellow-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Winner Section */}
          {winner && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-green-800">
                    🏆 Vainqueur : {winner.name}
                  </h3>
                  <p className="text-green-600">
                    A trouvé le fromage en {winner.moves} mouvements !
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Simulation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-700">Durée</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatDuration(simulation.startTime || new Date().toISOString(), simulation.endTime)}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-gray-700">Tours</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {simulation.currentTurn}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Mouse className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-gray-700">Souris</span>
              </div>
              <p className="text-2xl font-bold text-orange-600">
                {simulation.mice.length}
              </p>
            </div>
          </div>

          {/* Mouse Rankings */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Classement des Souris
            </h3>
            
            <div className="space-y-3">
              {ranking.map((mouse, index) => {
                const isWinner = winner && mouse.id === winner.id;
                const getRankIcon = (rank: number) => {
                  switch (rank) {
                    case 0: return '🥇';
                    case 1: return '🥈';
                    case 2: return '🥉';
                    default: return `${rank + 1}.`;
                  }
                };

                const getRankColor = (rank: number) => {
                  switch (rank) {
                    case 0: return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300';
                    case 1: return 'bg-gradient-to-r from-gray-100 to-gray-200 border-gray-300';
                    case 2: return 'bg-gradient-to-r from-orange-100 to-orange-200 border-orange-300';
                    default: return 'bg-gray-50 border-gray-200';
                  }
                };

                return (
                  <div
                    key={mouse.id}
                    className={`p-4 rounded-lg border-2 ${getRankColor(index)} ${
                      isWinner ? 'ring-2 ring-green-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold">
                          {getRankIcon(index)}
                        </span>
                        <div>
                          <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                              {mouse.tag}
                            </span>
                            {mouse.name}
                            {isWinner && <span className="ml-2 text-green-600">👑</span>}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Type IA: {mouse.intelligenceType}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Fromages</p>
                            <p className="text-xl font-bold text-yellow-600">
                              {mouse.cheeseFound}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Mouvements</p>
                            <p className="text-xl font-bold text-blue-600">
                              {mouse.moves}
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-gray-600">Efficacité</p>
                            <p className="text-xl font-bold text-green-600">
                              {mouse.moves > 0 ? Math.round((mouse.cheeseFound / mouse.moves) * 100) : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Mouse Stats Bars */}
                    <div className="mt-3 grid grid-cols-3 gap-4">
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Santé</span>
                          <span>{mouse.health}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              mouse.health > 70 ? 'bg-green-500' : 
                              mouse.health > 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${mouse.health}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Bonheur</span>
                          <span>{mouse.happiness}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              mouse.happiness > 70 ? 'bg-blue-500' : 
                              mouse.happiness > 40 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${mouse.happiness}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Énergie</span>
                          <span>{mouse.energy}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
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
                );
              })}
            </div>
          </div>

          {/* Labyrinth Info */}
          <div className="bg-gray-50 bg-opacity-50 backdrop-blur-sm border border-gray-200 border-opacity-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Informations du Labyrinthe
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Nom:</span>
                <p className="font-semibold text-gray-800">{simulation.labyrinth.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Taille:</span>
                <p className="font-semibold text-gray-800">{simulation.labyrinth.width} × {simulation.labyrinth.height}</p>
              </div>
              <div>
                <span className="text-gray-600">Règles:</span>
                <p className="font-semibold text-gray-800">{simulation.rules.name}</p>
              </div>
              <div>
                <span className="text-gray-600">Fromages:</span>
                <p className="font-semibold text-gray-800">{simulation.labyrinth.cheesePositions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 bg-opacity-50 backdrop-blur-sm border-t border-gray-200 border-opacity-50 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsModal;
