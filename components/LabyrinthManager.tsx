'use client';

import React, { useState, useEffect } from 'react';
import { Labyrinth, SimulationRules } from '@/lib/types';
import { LabyrinthService, RulesService } from '@/lib/apiClient';

interface LabyrinthManagerProps {
  onLabyrinthSelect?: (labyrinth: Labyrinth) => void;
  onRuleSelect?: (rule: SimulationRules) => void;
}

export default function LabyrinthManager({ onLabyrinthSelect, onRuleSelect }: LabyrinthManagerProps) {
  const [labyrinths, setLabyrinths] = useState<Labyrinth[]>([]);
  const [rules, setRules] = useState<SimulationRules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'labyrinths' | 'rules'>('labyrinths');

  // Charger les données au montage du composant
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [labyrinthsData, rulesData] = await Promise.all([
        LabyrinthService.getAll(),
        RulesService.getAll()
      ]);
      
      setLabyrinths(labyrinthsData);
      setRules(rulesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleLabyrinthSelect = (labyrinth: Labyrinth) => {
    onLabyrinthSelect?.(labyrinth);
  };

  const handleRuleSelect = (rule: SimulationRules) => {
    onRuleSelect?.(rule);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        <p className="font-bold">Erreur:</p>
        <p>{error}</p>
        <button 
          onClick={loadData}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {/* Onglets */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('labyrinths')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'labyrinths'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Labyrinthes ({labyrinths.length})
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'rules'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Règles ({rules.length})
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'labyrinths' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Labyrinthes disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labyrinths.map((labyrinth) => (
              <div
                key={labyrinth.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleLabyrinthSelect(labyrinth)}
              >
                <h3 className="font-semibold text-lg mb-2">{labyrinth.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{labyrinth.description}</p>
                <div className="text-xs text-gray-500">
                  <p>Taille: {labyrinth.width} x {labyrinth.height}</p>
                  <p>Positions de départ: {labyrinth.startPositions.length}</p>
                  <p>Fromages: {labyrinth.cheesePositions.length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Règles de simulation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleRuleSelect(rule)}
              >
                <h3 className="font-semibold text-lg mb-2">{rule.name}</h3>
                <p className="text-gray-600 text-sm mb-3">{rule.description}</p>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Durée par tour: {rule.turnDuration}ms</p>
                  <p>Consommation d'énergie: {rule.energyConsumption}</p>
                  <p>Décroissance bonheur: {rule.happinessDecay}</p>
                  <p>Bonus fromage: {rule.cheeseBonus}</p>
                  <p>Conditions de victoire: {rule.winConditions.length}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton de rafraîchissement */}
      <div className="mt-6 text-center">
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Rafraîchir les données
        </button>
      </div>
    </div>
  );
}
