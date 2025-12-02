'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { AlertCircle, Eye, Clock, CheckCircle } from 'lucide-react';
import MazeGrid from '../../components/MazeGrid';
import ResultsModal from '../../components/ResultsModal';
import { Simulation, Mouse, SimulationStatus } from '@/lib/types';
import { subscribeToSimulationUpdates } from '@/lib/simulationSync';
import './view.css';

export default function SharedSimulationViewPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  
  const [simulation, setSimulation] = useState<Simulation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareInfo, setShareInfo] = useState<{
    viewCount: number;
    createdAt: string;
    expiresAt?: string;
  } | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  useEffect(() => {
    if (token) {
      loadSharedSimulation();
    }
  }, [token]);

  // Synchronisation en temps réel avec polling en fallback
  useEffect(() => {
    if (!simulation || !simulation.id) return;

    console.log('Abonnement aux mises à jour en temps réel pour la simulation:', simulation.id);
    
    let pollingInterval: NodeJS.Timeout | null = null;
    let lastUpdateTime = Date.now();
    
    // Fonction pour charger et mettre à jour la simulation
    const loadAndUpdate = async () => {
      try {
        const response = await fetch(`/api/simulation/view/${token}`);
        const data = await response.json();
        
        if (data.success && data.data.simulation) {
          const updatedSimulation = data.data.simulation;
          
          setSimulation(prev => {
            if (!prev) return updatedSimulation;
            
            // Comparer les positions des souris pour éviter les mises à jour inutiles
            const miceChanged = updatedSimulation.mice.some((mouse, index) => {
              const prevMouse = prev.mice[index];
              if (!prevMouse) return true;
              return mouse.position.x !== prevMouse.position.x || 
                     mouse.position.y !== prevMouse.position.y ||
                     mouse.health !== prevMouse.health ||
                     mouse.happiness !== prevMouse.happiness ||
                     mouse.energy !== prevMouse.energy ||
                     mouse.cheeseFound !== prevMouse.cheeseFound ||
                     mouse.moves !== prevMouse.moves;
            });
            
            // Comparer la grille pour détecter les fromages collectés
            const gridChanged = JSON.stringify(updatedSimulation.labyrinth.grid) !== JSON.stringify(prev.labyrinth.grid);
            
            // Comparer les positions de fromages
            const cheesePositionsChanged = JSON.stringify(updatedSimulation.labyrinth.cheesePositions) !== JSON.stringify(prev.labyrinth.cheesePositions);
            
            // Ne mettre à jour que si quelque chose a vraiment changé
            if (miceChanged || gridChanged || cheesePositionsChanged || updatedSimulation.status !== prev.status) {
              console.log('Mise à jour reçue pour la simulation partagée:', {
                miceChanged,
                gridChanged,
                cheesePositionsChanged,
                statusChanged: updatedSimulation.status !== prev.status
              });
              lastUpdateTime = Date.now();
              return updatedSimulation;
            }
            
            return prev; // Pas de changement, garder l'état précédent
          });
        }
      } catch (error) {
        console.error('Error polling simulation update:', error);
      }
    };
    
    // S'abonner aux mises à jour en temps réel
    const unsubscribe = subscribeToSimulationUpdates(simulation.id, (updatedSimulation) => {
      console.log('Mise à jour Realtime reçue:', updatedSimulation);
      setSimulation(updatedSimulation);
      lastUpdateTime = Date.now();
    });
    
    // Polling en fallback toutes les 800ms si Realtime ne fonctionne pas
    pollingInterval = setInterval(() => {
      // Si aucune mise à jour Realtime depuis 1.5 secondes, utiliser le polling
      if (Date.now() - lastUpdateTime > 1500) {
        console.log('🔄 Utilisation du polling (Realtime semble inactif)');
        loadAndUpdate();
      } else {
        // Même si Realtime fonctionne, faire un polling occasionnel pour vérifier
        loadAndUpdate();
      }
    }, 800); // Polling toutes les 800ms pour garder la synchronisation fluide

    return () => {
      console.log('Désabonnement des mises à jour pour la simulation:', simulation.id);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      unsubscribe();
    };
  }, [simulation?.id, token]);

  const loadSharedSimulation = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/simulation/view/${token}`);
      const data = await response.json();

      if (data.success) {
        setSimulation(data.data.simulation);
        setShareInfo(data.data.shareInfo);
      } else {
        setError(data.error || 'Simulation partagée non trouvée');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Error loading shared simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: SimulationStatus) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-600" />;
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

  if (isLoading) {
    return (
      <Layout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-700" style={{ opacity: 1 }}>Chargement de la simulation partagée...</p>
            </div>
          </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 text-red-700 mb-4" style={{ opacity: 1 }}>
              <AlertCircle className="w-8 h-8" />
              <h2 className="text-2xl font-bold" style={{ opacity: 1 }}>Erreur</h2>
            </div>
            <p className="text-gray-800 mb-6" style={{ opacity: 1 }}>{error}</p>
            <button
              onClick={() => router.push('/simulation')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la simulation
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!simulation) {
    return null;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700 font-medium" style={{ opacity: 1 }}>Mode Observateur</span>
                </div>
                {simulation && (
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(simulation.status)}
                    <span className="text-gray-700" style={{ opacity: 1 }}>
                      {getStatusText(simulation.status)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs text-green-700" style={{ opacity: 1 }}>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Synchronisation active</span>
                </div>
              </div>
              {shareInfo && (
                <div className="flex items-center gap-4 text-sm text-gray-700" style={{ opacity: 1 }}>
                  <span>Vues: {shareInfo.viewCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300`}>
          {/* Informations de partage */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6" style={{ position: 'relative', zIndex: 10 }}>
            <div className="flex items-start gap-3">
              <Eye className="w-5 h-5 mt-0.5" style={{ color: '#2563eb', opacity: 1 }} />
              <div className="flex-1">
                <h3 className="font-medium mb-1" style={{ color: '#1e3a8a', opacity: 1, fontWeight: 500 }}>Simulation partagée</h3>
                <p className="text-sm" style={{ color: '#1e40af', opacity: 1 }}>
                  Vous visualisez cette simulation en mode observateur. Vous pouvez voir l'état actuel de la simulation mais ne pouvez pas la contrôler.
                </p>
              </div>
            </div>
          </div>
          
          {/* Contenu avec opacité conditionnelle */}
          <div className={showResultsModal ? 'opacity-50' : ''}>

          {/* Informations de la simulation */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ opacity: 1 }}>
              {simulation.labyrinth.name}
            </h2>
            {simulation.labyrinth.description && (
              <p className="text-gray-700 mb-4" style={{ opacity: 1 }}>{simulation.labyrinth.description}</p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-700" style={{ opacity: 1 }}>Démarrée:</span>
                <span className="ml-2 font-medium text-gray-900" style={{ opacity: 1 }}>
                  {simulation.startTime ? new Date(simulation.startTime).toLocaleString('fr-FR') : 'N/A'}
                </span>
              </div>
              {simulation.endTime && (
                <div>
                  <span className="text-gray-700" style={{ opacity: 1 }}>Terminée:</span>
                  <span className="ml-2 font-medium text-gray-900" style={{ opacity: 1 }}>
                    {new Date(simulation.endTime).toLocaleString('fr-FR')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-700" style={{ opacity: 1 }}>Souris:</span>
                <span className="ml-2 font-medium text-gray-900" style={{ opacity: 1 }}>{simulation.mice.length}</span>
              </div>
              <div>
                <span className="text-gray-700" style={{ opacity: 1 }}>Tour:</span>
                <span className="ml-2 font-medium text-gray-900" style={{ opacity: 1 }}>{simulation.currentTurn}</span>
              </div>
            </div>
          </div>

          {/* Visualisation du labyrinthe */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4" style={{ opacity: 1 }}>
              Visualisation du Labyrinthe
            </h2>
            
            {simulation.labyrinth ? (
              <div className="space-y-4">
                <MazeGrid
                  labyrinth={simulation.labyrinth}
                  mice={simulation.mice}
                  className="flex justify-center"
                />
                
                {/* Statistiques des souris */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                  {simulation.mice.map((mouse) => (
                    <div key={mouse.id} className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2" style={{ opacity: 1 }}>{mouse.name}</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Santé:</span>
                          <span className={mouse.health > 50 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'} style={{ opacity: 1 }}>
                            {mouse.health}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Bonheur:</span>
                          <span className={mouse.happiness > 50 ? 'text-blue-700 font-medium' : 'text-red-700 font-medium'} style={{ opacity: 1 }}>
                            {mouse.happiness}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Énergie:</span>
                          <span className={mouse.energy > 50 ? 'text-green-700 font-medium' : 'text-red-700 font-medium'} style={{ opacity: 1 }}>
                            {mouse.energy}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Fromages:</span>
                          <span className="text-yellow-700 font-medium" style={{ opacity: 1 }}>{mouse.cheeseFound}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Mouvements:</span>
                          <span className="text-gray-900 font-medium" style={{ opacity: 1 }}>{mouse.moves}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-800" style={{ opacity: 1 }}>Statut:</span>
                          <span className={mouse.isAlive ? 'text-green-700 font-medium' : 'text-red-700 font-medium'} style={{ opacity: 1 }}>
                            {mouse.isAlive ? 'Vivante' : 'Morte'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-red-700" style={{ opacity: 1 }}>
                <p>Erreur: Labyrinthe non chargé</p>
              </div>
            )}
          </div>

          {/* Bouton pour voir les résultats si la simulation est terminée */}
          {simulation.status === 'completed' && simulation.results && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <button
                onClick={() => setShowResultsModal(true)}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Voir les résultats de la simulation
              </button>
            </div>
          )}

          {/* Bouton retour */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <button
              onClick={() => router.push('/simulation')}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retour à la simulation
            </button>
          </div>
          </div>
        </div>

        {/* Modal de résultats */}
        {simulation.status === 'completed' && (
          <ResultsModal
            isOpen={showResultsModal}
            onClose={() => setShowResultsModal(false)}
            simulation={simulation}
            winner={simulation.mice.find(m => m.cheeseFound > 0) || null}
          />
        )}
      </div>
    </Layout>
  );
}

