'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Settings, Mouse, Brain, Target } from 'lucide-react';
import { Labyrinth, Mouse as MouseType, Simulation, SimulationRules } from '@/lib/types';
import { getAllRules } from '@/lib/rules';
import './SimulationPanel.css';

interface SimulationPanelProps {
  labyrinths: Labyrinth[];
  onStartSimulation: (config: SimulationConfig) => void;
  onPauseSimulation: () => void;
  onStopSimulation: () => void;
  simulation?: Simulation;
  isRunning: boolean;
}

interface SimulationConfig {
  labyrinthId: string;
  mice: Array<{
    name: string;
    movementDelay: number;
    startPosition: { x: number; y: number };
    tag: number;
  }>;
  rulesId: string;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({
  labyrinths,
  onStartSimulation,
  onPauseSimulation,
  onStopSimulation,
  simulation,
  isRunning
}) => {
  const [selectedLabyrinth, setSelectedLabyrinth] = useState<string>('');
  const [selectedRules, setSelectedRules] = useState<string>('classic');
  const [mice, setMice] = useState<Array<{
    name: string;
    movementDelay: number;
    startPosition: { x: number; y: number };
    tag: number;
  }>>([
    { name: 'Souris 1', movementDelay: 500, startPosition: { x: 1, y: 1 }, tag: 1 }
  ]);
  
  // Forcer la définition du tag pour toutes les souris
  useEffect(() => {
    setMice(prevMice => prevMice.map((mouse, index) => ({
      ...mouse,
      tag: mouse.tag || (index + 1)
    })));
  }, []);
  
  // Log pour vérifier l'état initial
  console.log('🐭 État initial des souris:', mice);
  console.log('🐭 Tag de la première souris:', mice[0]?.tag);
  
  const [availableRules, setAvailableRules] = useState<SimulationRules[]>([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  useEffect(() => {
    setAvailableRules(getAllRules());
  }, []);

  useEffect(() => {
    if (selectedLabyrinth && labyrinths.length > 0) {
      const labyrinth = labyrinths.find(l => l.id === selectedLabyrinth);
      if (labyrinth && labyrinth.startPositions.length > 0) {
        // Mettre à jour les positions de départ des souris
        setMice(prevMice => prevMice.map((mouse, index) => ({
          ...mouse,
          startPosition: labyrinth.startPositions[index] || labyrinth.startPositions[0]
        })));
      }
    }
  }, [selectedLabyrinth, labyrinths]);

  const addMouse = () => {
    if (mice.length < 3) {
      // Trouver une position de départ disponible
      const labyrinth = labyrinths.find(l => l.id === selectedLabyrinth);
      let startPosition = { x: 1, y: 1 }; // Position par défaut
      
      if (labyrinth && labyrinth.startPositions.length > 0) {
        // Utiliser la prochaine position de départ disponible
        const usedPositions = mice.map(mouse => mouse.startPosition);
        const availablePosition = labyrinth.startPositions.find(pos => 
          !usedPositions.some(used => used.x === pos.x && used.y === pos.y)
        );
        
        if (availablePosition) {
          startPosition = availablePosition;
        } else {
          // Si toutes les positions sont utilisées, utiliser la première
          startPosition = labyrinth.startPositions[0];
        }
      }
      
      const newMouse = {
        name: `Souris ${mice.length + 1}`,
        movementDelay: 500, // Délai par défaut de 500ms
        startPosition: startPosition,
        tag: mice.length + 1
      };
      console.log('🐭 Nouvelle souris créée:', newMouse);
      setMice([...mice, newMouse]);
    }
  };

  const removeMouse = (index: number) => {
    if (mice.length > 1) {
      setMice(mice.filter((_, i) => i !== index));
    }
  };

  const updateMouse = (index: number, field: string, value: any) => {
    setMice(mice.map((mouse, i) => 
      i === index ? { ...mouse, [field]: value } : mouse
    ));
  };

  const handleStartSimulation = () => {
    if (!selectedLabyrinth || mice.length === 0) {
      alert('Veuillez sélectionner un labyrinthe et au moins une souris');
      return;
    }

    const config: SimulationConfig = {
      labyrinthId: selectedLabyrinth,
      mice,
      rulesId: selectedRules
    };

    console.log('🐭 Configuration des souris:', mice);
    console.log('🐭 Tags des souris:', mice.map(m => ({ name: m.name, tag: m.tag })));
    onStartSimulation(config);
  };

  // Plus besoin des types d'IA - remplacés par le délai de mouvement

  return (
    <div className="simulation-panel bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2" style={{ color: '#111827' }}>
          <Settings className="w-6 h-6" />
          Configuration de la Simulation
        </h2>
        <button
          onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          className="text-sm text-blue-600 hover:text-blue-800"
          style={{ color: '#2563eb' }}
        >
          {showAdvancedSettings ? 'Masquer' : 'Paramètres avancés'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Sélection du labyrinthe */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2" style={{ color: '#374151' }}>
            Labyrinthe
          </label>
          <select
            value={selectedLabyrinth}
            onChange={(e) => setSelectedLabyrinth(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isRunning}
          >
            <option value="">Sélectionner un labyrinthe</option>
            {labyrinths.map((labyrinth) => (
              <option key={labyrinth.id} value={labyrinth.id}>
                {labyrinth.name} ({labyrinth.width}x{labyrinth.height})
              </option>
            ))}
          </select>
        </div>

        {/* Sélection des règles */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Règles de simulation
          </label>
          <select
            value={selectedRules}
            onChange={(e) => setSelectedRules(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isRunning}
          >
            {availableRules.map((rule) => (
              <option key={rule.id} value={rule.id}>
                {rule.name} - {rule.description}
              </option>
            ))}
          </select>
        </div>

        {/* Configuration des souris */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Souris ({mice.length}/3)
            </label>
            {!isRunning && mice.length < 3 && (
              <button
                onClick={addMouse}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                + Ajouter une souris
              </button>
            )}
          </div>
          
          <div className="space-y-3">
            {mice.map((mouse, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-800 flex items-center gap-2">
                    <Mouse className="w-4 h-4" />
                    {mouse.name}
                  </h4>
                  {!isRunning && mice.length > 1 && (
                    <button
                      onClick={() => removeMouse(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Supprimer
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      value={mouse.name}
                      onChange={(e) => updateMouse(index, 'name', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      disabled={isRunning}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Tag
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="9"
                      value={mouse.tag}
                      onChange={(e) => updateMouse(index, 'tag', parseInt(e.target.value) || 1)}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      disabled={isRunning}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      Délai de mouvement (ms)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="5000"
                      step="100"
                      value={mouse.movementDelay}
                      onChange={(e) => updateMouse(index, 'movementDelay', parseInt(e.target.value) || 500)}
                      className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                      disabled={isRunning}
                    />
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Délai entre les mouvements: {mouse.movementDelay}ms
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paramètres avancés */}
        {showAdvancedSettings && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
              <Brain className="w-5 h-5" />
              Paramètres avancés
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Durée d'un tour (ms)
                </label>
                <input
                  type="number"
                  value={availableRules.find(r => r.id === selectedRules)?.turnDuration || 500}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-gray-100"
                  disabled
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Consommation d'énergie
                </label>
                <input
                  type="number"
                  value={availableRules.find(r => r.id === selectedRules)?.energyConsumption || 2}
                  className="w-full p-2 border border-gray-300 rounded text-sm text-gray-900 bg-gray-100"
                  disabled
                />
              </div>
            </div>
          </div>
        )}

        {/* Contrôles de simulation */}
        <div className="flex gap-3 pt-4 border-t">
          {!isRunning ? (
            <button
              onClick={handleStartSimulation}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Démarrer la simulation
            </button>
          ) : (
            <>
              <button
                onClick={onPauseSimulation}
                className="flex-1 bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Pause
              </button>
              <button
                onClick={onStopSimulation}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
              >
                <Square className="w-5 h-5" />
                Arrêter
              </button>
            </>
          )}
        </div>

        {/* Statut de la simulation */}
        {simulation && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Statut de la simulation
            </h3>
            <div className="text-sm text-gray-700 space-y-1">
              <div className="flex justify-between">
                <span>Tour actuel:</span>
                <span className="font-medium">{simulation.currentTurn}</span>
              </div>
              <div className="flex justify-between">
                <span>Statut:</span>
                <span className="font-medium capitalize">{simulation.status}</span>
              </div>
              <div className="flex justify-between">
                <span>Souris actives:</span>
                <span className="font-medium">{simulation.mice.filter(m => m.isAlive).length}/{simulation.mice.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimulationPanel;
