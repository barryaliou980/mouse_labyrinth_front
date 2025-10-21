'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import MazeGrid from './components/MazeGrid';
import SimulationPanel from './components/SimulationPanel';
import ResultsModal from './components/ResultsModal';
import { Labyrinth, Mouse, Simulation, SimulationConfig, SimulationStatus } from '@/lib/types';
import { ClientSimulation } from '@/lib/clientSimulation';
import { getAllMockLabyrinths, getMockLabyrinthById } from '@/lib/mockData';
import { getRulesById } from '@/lib/rules';

export default function SimulationPage() {
  const [labyrinths, setLabyrinths] = useState<Labyrinth[]>([]);
  const [currentSimulation, setCurrentSimulation] = useState<Simulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [clientSimulation, setClientSimulation] = useState<ClientSimulation | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [winner, setWinner] = useState<Mouse | null>(null);

  // Charger les labyrinths au montage du composant
  useEffect(() => {
    loadLabyrinths();
  }, []);

  const loadLabyrinths = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Essayer d'abord l'API
      try {
        const response = await fetch('/api/labyrinths');
        const data = await response.json();
        
        if (data.success) {
          setLabyrinths(data.data);
          addLog('Labyrinths chargés depuis l\'API');
          return;
        }
      } catch (apiError) {
        console.log('API non disponible, utilisation des données mockées');
      }
      
      // Fallback vers les données mockées
      const mockLabyrinths = getAllMockLabyrinths();
      setLabyrinths(mockLabyrinths);
      addLog('Labyrinths chargés depuis les données mockées');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      addLog(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
  };

  const startSimulation = async (config: SimulationConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      addLog('Démarrage de la simulation...');
      
      // Essayer d'abord l'API
      try {
        const response = await fetch('/api/simulation/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });
        
        const data = await response.json();
        
        if (data.success) {
          setCurrentSimulation(data.data);
          setIsRunning(true);
          addLog(`Simulation démarrée avec ${config.mice.length} souris (API)`);
          
          // Démarrer la boucle de simulation
          startSimulationLoop(data.data.id);
          return;
        }
      } catch (apiError) {
        console.log('API non disponible, utilisation de la simulation côté client');
      }
      
      // Fallback vers la simulation côté client
      const labyrinth = getMockLabyrinthById(config.labyrinthId);
      if (!labyrinth) {
        throw new Error('Labyrinthe non trouvé');
      }
      
      const rules = getRulesById(config.rulesId);
      if (!rules) {
        throw new Error('Règles non trouvées');
      }
      
      // Créer la simulation côté client
      const simulation: Simulation = {
        id: `sim-${Date.now()}`,
        labyrinthId: config.labyrinthId,
        labyrinth,
        mice: config.mice.map((mouseConfig, index) => {
          // Utiliser les positions de départ du labyrinthe si disponible
          const startPos = labyrinth.startPositions && labyrinth.startPositions.length > 0 
            ? labyrinth.startPositions[index % labyrinth.startPositions.length]
            : { x: 1, y: 1 }; // Position par défaut valide
          
          return {
            id: `mouse-${index}`,
            name: mouseConfig.name,
            position: startPos,
            intelligenceType: mouseConfig.intelligenceType,
            health: rules.maxEnergy,
            happiness: rules.maxHappiness,
            energy: rules.maxEnergy,
            cheeseFound: 0,
            moves: 0,
            isAlive: true
          };
        }),
        rules,
        status: 'running',
        currentTurn: 0,
        maxTurns: Infinity, // Simulation infinie
        startTime: new Date().toISOString()
      };
      
      setCurrentSimulation(simulation);
      setIsRunning(true);
      addLog(`Simulation démarrée avec ${config.mice.length} souris (mode client)`);
      
      // Démarrer la simulation côté client
      const clientSim = new ClientSimulation(simulation);
      setClientSimulation(clientSim);
      
      clientSim.start(
        (updatedSimulation) => {
          setCurrentSimulation(updatedSimulation);
          
          // Vérifier si une souris a trouvé du fromage
          const winningMouse = updatedSimulation.mice.find(mouse => 
            mouse.cheeseFound > 0 && updatedSimulation.status === 'completed'
          );
          
          if (winningMouse) {
            setWinner(winningMouse);
            setShowResultsModal(true);
            setIsRunning(false);
          }
        },
        (message) => {
          addLog(message);
          
          // Détecter si le message indique qu'une souris a gagné
          if (message.includes('🎉') && message.includes('a trouvé du fromage')) {
            const mouseName = message.split(' ')[1]; // Extraire le nom de la souris
            const winningMouse = simulation.mice.find(mouse => mouse.name === mouseName);
            if (winningMouse) {
              setWinner(winningMouse);
              setShowResultsModal(true);
              setIsRunning(false);
            }
          }
        }
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      addLog(`Erreur: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const startSimulationLoop = async (simulationId: string) => {
    const interval = setInterval(async () => {
      if (!isRunning) {
        clearInterval(interval);
        return;
      }
      
      try {
        // Récupérer le statut de la simulation
        const statusResponse = await fetch(`/api/simulation/status?id=${simulationId}`);
        const statusData = await statusResponse.json();
        
        if (statusData.success) {
          setCurrentSimulation(prev => ({
            ...prev!,
            ...statusData.data
          }));
          
          // Vérifier si la simulation est terminée
          if (statusData.data.status === 'completed') {
            setIsRunning(false);
            addLog('Simulation terminée');
            clearInterval(interval);
            
            // Récupérer les résultats
            const resultsResponse = await fetch(`/api/simulation/results?id=${simulationId}`);
            const resultsData = await resultsResponse.json();
            
            if (resultsData.success) {
              setCurrentSimulation(prev => ({
                ...prev!,
                results: resultsData.data
              }));
              addLog('Résultats récupérés');
            }
          }
        }
      } catch (err) {
        addLog(`Erreur lors de la mise à jour: ${err}`);
      }
    }, 1000); // Vérifier toutes les secondes
  };

  const pauseSimulation = () => {
    if (clientSimulation) {
      clientSimulation.pause();
    }
    setIsRunning(false);
    addLog('Simulation mise en pause');
  };

  const stopSimulation = () => {
    if (clientSimulation) {
      clientSimulation.stop();
      setClientSimulation(null);
    }
    setIsRunning(false);
    setCurrentSimulation(null);
    setShowResultsModal(false);
    setWinner(null);
    addLog('Simulation arrêtée');
  };

  const getStatusIcon = (status: SimulationStatus) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 text-green-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusText = (status: SimulationStatus) => {
    switch (status) {
      case 'running':
        return 'En cours';
      case 'completed':
        return 'Terminée';
      case 'error':
        return 'Erreur';
      case 'paused':
        return 'En pause';
      default:
        return 'Inactive';
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 ${showResultsModal ? 'backdrop-blur-sm' : ''}`}>
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Simulation de Labyrinthe</h1>
              {currentSimulation && (
                <div className="flex items-center gap-2 text-sm">
                  {getStatusIcon(currentSimulation.status)}
                  <span className="text-gray-600">
                    {getStatusText(currentSimulation.status)}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={loadLabyrinths}
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
            >
              {isLoading ? 'Chargement...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${showResultsModal ? 'pointer-events-none' : ''}`}>
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erreur</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panneau de configuration */}
          <div className="lg:col-span-1">
            <SimulationPanel
              labyrinths={labyrinths}
              onStartSimulation={startSimulation}
              onPauseSimulation={pauseSimulation}
              onStopSimulation={stopSimulation}
              simulation={currentSimulation || undefined}
              isRunning={isRunning}
            />
          </div>

          {/* Zone de visualisation */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                Visualisation du Labyrinthe
              </h2>
              
              {currentSimulation ? (
                <div className="space-y-4">
                  <MazeGrid
                    labyrinth={currentSimulation.labyrinth}
                    mice={currentSimulation.mice}
                    className="flex justify-center"
                  />
                  
                  {/* Statistiques des souris */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                    {currentSimulation.mice.map((mouse) => (
                      <div key={mouse.id} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-800 mb-2">{mouse.name}</h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-700">Santé:</span>
                            <span className={mouse.health > 50 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {mouse.health}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Bonheur:</span>
                            <span className={mouse.happiness > 50 ? 'text-blue-600 font-medium' : 'text-red-600 font-medium'}>
                              {mouse.happiness}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Énergie:</span>
                            <span className={mouse.energy > 50 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {mouse.energy}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-700">Fromages:</span>
                            <span className="text-yellow-600 font-medium">{mouse.cheeseFound}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Sélectionnez un labyrinthe et démarrez une simulation pour voir la visualisation</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Logs de Simulation</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">Aucun log pour le moment...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal de résultats */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => {
          setShowResultsModal(false);
          setWinner(null);
        }}
        simulation={currentSimulation}
        winner={winner}
      />
    </div>
  );
}
