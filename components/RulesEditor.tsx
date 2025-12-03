'use client';

import React, { useState } from 'react';
import { SimulationRules, WinCondition } from '@/lib/types';
import { RulesService } from '@/lib/apiClient';

interface RulesEditorProps {
  rule?: SimulationRules;
  onSave?: (rule: SimulationRules) => void;
  onCancel?: () => void;
}

export default function RulesEditor({ rule, onSave, onCancel }: RulesEditorProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [turnDuration, setTurnDuration] = useState(rule?.turnDuration || 500);
  const [energyConsumption, setEnergyConsumption] = useState(rule?.energyConsumption || 1);
  const [happinessDecay, setHappinessDecay] = useState(rule?.happinessDecay || 1);
  const [isolationPenalty, setIsolationPenalty] = useState(rule?.isolationPenalty || 1);
  const [cheeseBonus, setCheeseBonus] = useState(rule?.cheeseBonus || 20);
  const [proximityBonus, setProximityBonus] = useState(rule?.proximityBonus || 5);
  const [maxEnergy, setMaxEnergy] = useState(rule?.maxEnergy || 100);
  const [maxHappiness, setMaxHappiness] = useState(rule?.maxHappiness || 100);
  const [simulationMode, setSimulationMode] = useState<'normal' | 'survie' | undefined>(rule?.simulationMode || undefined);
  const [winConditions, setWinConditions] = useState<WinCondition[]>(rule?.winConditions || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addWinCondition = () => {
    setWinConditions([...winConditions, {
      type: 'cheese_count',
      value: 10,
      description: 'Nouvelle condition'
    }]);
  };

  const updateWinCondition = (index: number, field: keyof WinCondition, value: any) => {
    const updated = [...winConditions];
    updated[index] = { ...updated[index], [field]: value };
    setWinConditions(updated);
  };

  const removeWinCondition = (index: number) => {
    setWinConditions(winConditions.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);

      const ruleData: Omit<SimulationRules, 'id'> = {
        name,
        description,
        turnDuration,
        energyConsumption,
        happinessDecay,
        isolationPenalty,
        cheeseBonus,
        proximityBonus,
        maxEnergy,
        maxHappiness,
        simulationMode: simulationMode || undefined,
        winConditions
      };

      let savedRule: SimulationRules;
      if (rule) {
        savedRule = await RulesService.update(rule.id, ruleData);
      } else {
        savedRule = await RulesService.create(ruleData);
      }

      onSave?.(savedRule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">
        {rule ? 'Modifier les règles' : 'Créer de nouvelles règles'}
      </h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Informations de base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Nom</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Nom des règles"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Description des règles"
            />
          </div>
        </div>

        {/* Paramètres de simulation */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4">Paramètres de simulation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Durée par tour (ms)</label>
              <input
                type="number"
                value={turnDuration}
                onChange={(e) => setTurnDuration(parseInt(e.target.value) || 500)}
                className="w-full p-2 border rounded"
                min="100"
                max="5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Consommation d'énergie</label>
              <input
                type="number"
                value={energyConsumption}
                onChange={(e) => setEnergyConsumption(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded"
                min="0"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Décroissance bonheur</label>
              <input
                type="number"
                value={happinessDecay}
                onChange={(e) => setHappinessDecay(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded"
                min="0"
                max="10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pénalité d'isolement</label>
              <input
                type="number"
                value={isolationPenalty}
                onChange={(e) => setIsolationPenalty(parseInt(e.target.value) || 1)}
                className="w-full p-2 border rounded"
                min="0"
                max="20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bonus fromage</label>
              <input
                type="number"
                value={cheeseBonus}
                onChange={(e) => setCheeseBonus(parseInt(e.target.value) || 20)}
                className="w-full p-2 border rounded"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bonus proximité</label>
              <input
                type="number"
                value={proximityBonus}
                onChange={(e) => setProximityBonus(parseInt(e.target.value) || 5)}
                className="w-full p-2 border rounded"
                min="0"
                max="50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Énergie maximale</label>
              <input
                type="number"
                value={maxEnergy}
                onChange={(e) => setMaxEnergy(parseInt(e.target.value) || 100)}
                className="w-full p-2 border rounded"
                min="50"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Bonheur maximal</label>
              <input
                type="number"
                value={maxHappiness}
                onChange={(e) => setMaxHappiness(parseInt(e.target.value) || 100)}
                className="w-full p-2 border rounded"
                min="50"
                max="200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Mode de simulation</label>
              <select
                value={simulationMode || ''}
                onChange={(e) => setSimulationMode(e.target.value === '' ? undefined : e.target.value as 'normal' | 'survie' | 'mortelle')}
                className="w-full p-2 border rounded"
              >
                <option value="">Par défaut (normal)</option>
                <option value="normal">Normal - pas de mort, règles classiques</option>
                <option value="survie">Survie - perte de 1 point de vie tous les 5 pas, restauration avec fromage</option>
                <option value="mortelle">Mortelle - perte de 10 points de vie tous les 5 pas, +10 santé avec fromage, les souris peuvent mourir</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {simulationMode === 'survie' && 'Mode survie: perte de 1 point de vie tous les 5 pas, restauration à 10 avec fromage'}
                {simulationMode === 'normal' && 'Mode normal: règles classiques sans mort'}
                {simulationMode === 'mortelle' && 'Mode mortelle: perte de 10 points de vie tous les 5 pas, +10 santé avec fromage, les souris meurent si leur vie atteint 0'}
                {!simulationMode && 'Utilise les règles par défaut du système'}
              </p>
            </div>
          </div>
        </div>

        {/* Conditions de victoire */}
        <div className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Conditions de victoire</h3>
            <button
              onClick={addWinCondition}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Ajouter
            </button>
          </div>
          <div className="space-y-3">
            {winConditions.map((condition, index) => (
              <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded">
                <select
                  value={condition.type}
                  onChange={(e) => updateWinCondition(index, 'type', e.target.value)}
                  className="p-2 border rounded"
                >
                  <option value="cheese_count">Nombre de fromages</option>
                  <option value="energy">Énergie</option>
                  <option value="happiness">Bonheur</option>
                  <option value="survival">Survie (tours)</option>
                </select>
                <input
                  type="number"
                  value={condition.value}
                  onChange={(e) => updateWinCondition(index, 'value', parseInt(e.target.value) || 0)}
                  className="p-2 border rounded w-20"
                  min="0"
                />
                <input
                  type="text"
                  value={condition.description}
                  onChange={(e) => updateWinCondition(index, 'description', e.target.value)}
                  className="flex-1 p-2 border rounded"
                  placeholder="Description"
                />
                <button
                  onClick={() => removeWinCondition(index)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Supprimer
                </button>
              </div>
            ))}
            {winConditions.length === 0 && (
              <p className="text-gray-500 text-center py-4">Aucune condition de victoire définie</p>
            )}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={loading || !name || !description}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}
