'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import MazeGrid from './components/MazeGrid';
import SimulationPanel from './components/SimulationPanel';
import ResultsModal from './components/ResultsModal';
import ServerLogs from './components/ServerLogs';

import ShareModal from './components/ShareModal';
import { Labyrinth, Mouse, Simulation, SimulationConfig, SimulationStatus, Position ,Algorithm} from '@/lib/types';

import { PythonSimulation } from '@/lib/pythonSimulation';
import { getAllMockLabyrinths, getMockLabyrinthById } from '@/lib/mockData';
import { getRulesById } from '@/lib/rules';
import './simulation.css';

export default function SimulationPage() {
  const [labyrinths, setLabyrinths] = useState<Labyrinth[]>([]);
  const [currentSimulation, setCurrentSimulation] = useState<Simulation | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [pythonSimulation, setPythonSimulation] = useState<PythonSimulation | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
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
          console.log('Labyrinths chargés depuis l\'API:', data.data);
          setLabyrinths(data.data);
          addLog('Labyrinths chargés depuis l\'API');
          return;
        }
      } catch (apiError) {
        console.log('API non disponible, utilisation des données mockées');
      }
      
      // Fallback vers les données mockées
      const mockLabyrinths = getAllMockLabyrinths();
      console.log('Labyrinths mockés chargés:', mockLabyrinths);
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
    const newLog = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-9), newLog]);
  };

  const startSimulation = async (config: SimulationConfig) => {
    try {
      setIsLoading(true);
      setError(null);
      addLog('Démarrage de la simulation...');
      
      // Utiliser directement la simulation Python (pas l'API Next.js)
      console.log('Démarrage de la simulation avec l\'API Python...');
      
      // Créer la simulation avec l'API Python
      const labyrinth = labyrinths.find(l => l.id === config.labyrinthId);
      if (!labyrinth) {
        console.log('Labyrinthes disponibles:', labyrinths.map(l => ({ id: l.id, name: l.name })));
        console.log('ID recherché:', config.labyrinthId);
        throw new Error('Labyrinthe non trouvé');
      }
      
      // Récupérer les règles depuis la base de données
      let rules;
      try {
        console.log('Récupération des règles avec ID:', config.rulesId);
        // Essayer d'abord de récupérer depuis la DB (si c'est un UUID)
        const isUUID = config.rulesId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        console.log('Est un UUID?', isUUID);
        
        if (isUUID) {
          const { RulesService } = await import('@/lib/apiClient');
          console.log('Récupération depuis la DB via RulesService...');
          rules = await RulesService.getById(config.rulesId);
          console.log('Règle récupérée depuis la DB:', rules?.name);
        } else {
          // Si ce n'est pas un UUID, essayer les règles prédéfinies (fallback)
          console.log('Récupération depuis les règles prédéfinies...');
          rules = getRulesById(config.rulesId);
          console.log('Règle prédéfinie trouvée:', rules?.name);
        }
        
        if (!rules) {
          console.error('Aucune règle trouvée avec l\'ID:', config.rulesId);
          throw new Error('Règles non trouvées');
        }
        
        console.log('Règles chargées avec succès:', rules.name);
      } catch (error) {
        console.error('Erreur lors de la récupération des règles:', error);
        throw new Error('Règles non trouvées: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
      }
      
      // Sauvegarder la simulation dans la base de données pour permettre la synchronisation
      addLog('Sauvegarde de la simulation dans la base de données...');
      
      try {
        // Vérifier et créer le labyrinthe si nécessaire
        const { getLabyrinthById, createLabyrinth } = await import('@/lib/supabaseClient');
        let labyrinthId = config.labyrinthId;
        try {
          await getLabyrinthById(labyrinthId);
        } catch (error) {
          // Le labyrinthe n'existe pas, le créer
          const newLabyrinth = await createLabyrinth({
            name: labyrinth.name,
            description: labyrinth.description,
            grid_data: {
              width: labyrinth.width,
              height: labyrinth.height,
              grid: labyrinth.grid,
              startPositions: labyrinth.startPositions,
              cheesePositions: labyrinth.cheesePositions
            }
          });
          labyrinthId = newLabyrinth.id;
        }
        
        // Vérifier et créer la règle si nécessaire
        const { getSimulationRuleById, createSimulationRule, supabase } = await import('@/lib/supabaseClient');
        let rulesId = config.rulesId;
        const isPredefinedRule = !rulesId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        
        if (isPredefinedRule) {
          // Chercher la règle par nom
          if (supabase) {
            const { data: existingRule } = await supabase
              .from('simulation_rules')
              .select('*')
              .eq('name', rules.name)
              .eq('is_predefined', true)
              .maybeSingle();
            
            if (existingRule) {
              rulesId = existingRule.id;
            } else {
              // Créer la règle
              const newRule = await createSimulationRule({
                name: rules.name,
                description: rules.description,
                rules_data: rules as unknown as Record<string, unknown>,
                is_predefined: true
              });
              rulesId = newRule.id;
            }
          }
        }
        
        // Créer la simulation dans la base de données
        const { createSimulation, createMouse } = await import('@/lib/supabaseClient');
        const dbSimulation = await createSimulation({
          labyrinth_id: labyrinthId,
          rules_id: rulesId,
          start_time: new Date().toISOString(),
          status: 'running'
        });
        
        // Créer les souris dans la base de données
        const dbMice = [];
        for (let i = 0; i < config.mice.length; i++) {
          const mouseConfig = config.mice[i];
          // Utiliser les positions de départ du labyrinthe si disponible
          const startPos = labyrinth.startPositions && labyrinth.startPositions.length > 0 
            ? labyrinth.startPositions[i % labyrinth.startPositions.length]
            : { x: 1, y: 1 };
          
          const dbMouse = await createMouse({
            simulation_id: dbSimulation.id,
            name: mouseConfig.name,
            intelligence_type: 'smart',
            initial_position: startPos as unknown as Record<string, unknown>,
            final_position: startPos as unknown as Record<string, unknown>,
            health: rules.maxEnergy,
            happiness: rules.maxHappiness,
            energy: rules.maxEnergy,
            cheese_found: 0,
            moves: 0,
            is_alive: true
          });
          dbMice.push(dbMouse);
        }
        
        // Créer la simulation côté client avec les IDs de la base de données
        const simulation: Simulation = {
          id: dbSimulation.id,
          labyrinthId: labyrinthId,
          labyrinth: { ...labyrinth, id: labyrinthId },
          mice: config.mice.map((mouseConfig: { name: string; movementDelay: number; startPosition?: Position; tag: number; algorithm: Algorithm }, index: number) => {
            const startPos = labyrinth.startPositions && labyrinth.startPositions.length > 0 
              ? labyrinth.startPositions[index % labyrinth.startPositions.length]
              : { x: 1, y: 1 };
            
            return {
              id: dbMice[index].id, // Utiliser l'ID de la base de données
              name: mouseConfig.name,
              position: startPos,
              movementDelay: mouseConfig.movementDelay,
              health: rules.maxEnergy,
              happiness: rules.maxHappiness,
              energy: rules.maxEnergy,
              cheeseFound: 0,
              moves: 0,
              isAlive: true,
              tag: mouseConfig.tag || (index + 1),
              algorithm: mouseConfig.algorithm || 'greedy'
            };
          }),
          rules,
          status: 'running',
          currentTurn: 0,
          maxTurns: Infinity,
          startTime: dbSimulation.start_time
        };
        
        setCurrentSimulation(simulation);
        setIsRunning(true);
        addLog(`Simulation démarrée avec ${config.mice.length} souris (API Python)`);
        addLog(`Simulation sauvegardée dans la base de données (ID: ${dbSimulation.id})`);
        
        // Démarrer la simulation avec l'API Python
        const pythonSim = new PythonSimulation(simulation, dbSimulation.id);
        setPythonSimulation(pythonSim);
        
        // La synchronisation fonctionnera automatiquement maintenant
        pythonSim.start(
          (updatedSimulation) => {
            setCurrentSimulation(updatedSimulation);
            
            // Si on a partagé la simulation, mettre à jour l'ID de la base de données
            if (updatedSimulation.id && !updatedSimulation.id.startsWith('sim-')) {
              pythonSim.setDatabaseId(updatedSimulation.id);
            }
            
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
            
            // Détecter si le message indique qu'une souris a gagné (tous les fromages collectés)
            if (message.includes('🏆') && message.includes('a collecté tous les fromages')) {
              const mouseName = message.split(' ')[1]; // Extraire le nom de la souris
              const winningMouse = currentSimulation?.mice.find(mouse => mouse.name === mouseName);
              if (winningMouse) {
                setWinner(winningMouse);
                setShowResultsModal(true);
                setIsRunning(false);
              }
            }
          }
        );
        
      } catch (saveError) {
        // Erreur lors de la sauvegarde dans la base de données
        console.error('Error saving simulation to database:', saveError);
        addLog('Erreur lors de la sauvegarde dans la base de données, la simulation continue sans synchronisation');
        // Continuer quand même avec la simulation locale
        const localSimulation: Simulation = {
          id: `sim-${Date.now()}`,
          labyrinthId: config.labyrinthId,
          labyrinth,
          mice: config.mice.map((mouseConfig: { name: string; movementDelay: number; startPosition?: Position; tag: number; algorithm: Algorithm }, index: number) => {
            const startPos = labyrinth.startPositions && labyrinth.startPositions.length > 0 
              ? labyrinth.startPositions[index % labyrinth.startPositions.length]
              : { x: 1, y: 1 };
            
            return {
              id: `mouse-${index}`,
              name: mouseConfig.name,
              position: startPos,
              movementDelay: mouseConfig.movementDelay,
              algorithm: mouseConfig.algorithm || 'greedy',
              health: rules.maxEnergy,
              happiness: rules.maxHappiness,
              energy: rules.maxEnergy,
              cheeseFound: 0,
              moves: 0,
              isAlive: true,
              tag: mouseConfig.tag || (index + 1)
            };
          }),
          rules,
          status: 'running',
          currentTurn: 0,
          maxTurns: Infinity,
          startTime: new Date().toISOString()
        };
        
        setCurrentSimulation(localSimulation);
        setIsRunning(true);
        addLog(`Simulation démarrée avec ${config.mice.length} souris (API Python - mode local)`);
        
        const pythonSim = new PythonSimulation(localSimulation);
        setPythonSimulation(pythonSim);
        
        pythonSim.start(
          (updatedSimulation) => {
            setCurrentSimulation(updatedSimulation);
            
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
            
            if (message.includes('🏆') && message.includes('a collecté tous les fromages')) {
              const mouseName = message.split(' ')[1];
              const winningMouse = localSimulation.mice.find(mouse => mouse.name === mouseName);
              if (winningMouse) {
                setWinner(winningMouse);
                setShowResultsModal(true);
                setIsRunning(false);
              }
            }
          }
        );
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      
      // Gestion spécifique de l'erreur hasOtherMiceNearby
      if (errorMessage.includes('hasOtherMiceNearby')) {
        setError(` ERREUR API PYTHON: Problème de communication avec l'API Python. Vérifiez que l'API Python est démarrée sur le port 8000. Détails: ${errorMessage}`);
        addLog(` ERREUR API PYTHON: Problème de communication avec l'API Python`);
        addLog(` Solution: Vérifiez que l'API Python est démarrée sur le port 8000`);
        addLog(` Détails: ${errorMessage}`);
      } else {
        setError(errorMessage);
        addLog(`Erreur: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const pauseSimulation = () => {
    if (pythonSimulation) {
      pythonSimulation.pause();
    }
    setIsRunning(false);
    addLog('Simulation mise en pause');
  };

  const stopSimulation = () => {
    if (pythonSimulation) {
      pythonSimulation.stop();
      setPythonSimulation(null);
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
    <Layout>
      <div className={`simulation-page min-h-screen bg-gray-50 ${showResultsModal || showShareModal ? 'backdrop-blur-sm' : ''}`} style={{ color: '#111827' }}>
        {/* Header de simulation */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                {/* <h1 className="text-2xl font-bold" style={{ color: '#111827' }}>Simulation de Labyrinthe</h1> */}
                {currentSimulation && (
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(currentSimulation.status)}
                    <span style={{ color: '#4b5563' }}>
                      {getStatusText(currentSimulation.status)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {currentSimulation && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Partager
                  </button>
                )}
                <button
                  onClick={loadLabyrinths}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50"
                >
                  {isLoading ? 'Chargement...' : 'Actualiser'}
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300 ${showResultsModal || showShareModal ? 'pointer-events-none' : ''}`}>
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
              <h2 className="text-xl font-bold text-gray-800 mb-4" style={{ color: '#111827' }}>
                Visualisation du Labyrinthe
              </h2>
              <br/>
              
              {currentSimulation ? (
                <div className="space-y-4">
                  {currentSimulation.labyrinth ? (
                    <MazeGrid
                      labyrinth={currentSimulation.labyrinth}
                      mice={currentSimulation.mice}
                      className="flex justify-center"
                    />
                  ) : (
                    <div className="text-center py-8 text-red-600">
                      <p>Erreur: Labyrinthe non chargé</p>
                      <p>ID du labyrinthe: {currentSimulation.labyrinthId}</p>
                    </div>
                  )}
                  
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
                          <div className="flex justify-between">
                            <span className="text-gray-700">Algorithme:</span>
                            <span className="text-gray-900 font-medium">
                              {mouse.algorithm}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500" style={{ color: '#6b7280' }}>
                  <p style={{ color: '#6b7280' }}>Sélectionnez un labyrinthe et démarrez une simulation pour voir la visualisation</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Logs */}
        {/* Section d'erreurs API Python */}
        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4" style={{ color: '#dc2626' }}>
              ⚠️ Erreur API Python
            </h2>
            <div className="bg-red-900 text-red-100 p-4 rounded-lg font-mono text-sm">
              <div className="text-red-300 mb-2">Détails de l'erreur :</div>
              <div className="text-red-100">{error}</div>
              <div className="text-red-300 mt-2 text-xs">
                Cette erreur indique un problème de communication avec l&apos;API Python.
                Vérifiez que l&apos;API Python est démarrée sur le port 8000.
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4" style={{ color: '#111827' }}>Logs de Simulation</h2>
          <div 
            className="logs-container bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-32 overflow-y-auto"
            style={{ backgroundColor: '#111827' }}
          >
            {logs.length === 0 ? (
              <div className="text-gray-400">
                Aucun log pour le moment...
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Logs du serveur */}
        <ServerLogs className="mt-6" />
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

      {/* Modal de partage */}
      {currentSimulation && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          simulationId={currentSimulation.id}
          simulation={currentSimulation}
          onSimulationSaved={(savedId) => {
            // Mettre à jour l'ID de la simulation et informer PythonSimulation
            if (pythonSimulation) {
              pythonSimulation.setDatabaseId(savedId);
            }
            // Mettre à jour l'ID de la simulation actuelle
            setCurrentSimulation(prev => prev ? { ...prev, id: savedId } : null);
          }}
        />
      )}
      </div>
    </Layout>
  );
}
