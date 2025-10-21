'use client';

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import LabyrinthManager from '@/components/LabyrinthManager';
import LabyrinthEditor from '@/components/LabyrinthEditor';
import RulesEditor from '@/components/RulesEditor';
import { Labyrinth, SimulationRules } from '@/lib/types';
import './management.css';

type ViewMode = 'list' | 'create-labyrinth' | 'edit-labyrinth' | 'create-rule' | 'edit-rule';

export default function ManagementPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLabyrinth, setSelectedLabyrinth] = useState<Labyrinth | null>(null);
  const [selectedRule, setSelectedRule] = useState<SimulationRules | null>(null);

  const handleLabyrinthSelect = (labyrinth: Labyrinth) => {
    setSelectedLabyrinth(labyrinth);
    setViewMode('edit-labyrinth');
  };

  const handleRuleSelect = (rule: SimulationRules) => {
    setSelectedRule(rule);
    setViewMode('edit-rule');
  };

  const handleLabyrinthSave = (labyrinth: Labyrinth) => {
    setSelectedLabyrinth(null);
    setViewMode('list');
  };

  const handleRuleSave = (rule: SimulationRules) => {
    setSelectedRule(null);
    setViewMode('list');
  };

  const handleCancel = () => {
    setSelectedLabyrinth(null);
    setSelectedRule(null);
    setViewMode('list');
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'create-labyrinth':
        return (
          <LabyrinthEditor
            onSave={handleLabyrinthSave}
            onCancel={handleCancel}
          />
        );
      case 'edit-labyrinth':
        return (
          <LabyrinthEditor
            labyrinth={selectedLabyrinth!}
            onSave={handleLabyrinthSave}
            onCancel={handleCancel}
          />
        );
      case 'create-rule':
        return (
          <RulesEditor
            onSave={handleRuleSave}
            onCancel={handleCancel}
          />
        );
      case 'edit-rule':
        return (
          <RulesEditor
            rule={selectedRule!}
            onSave={handleRuleSave}
            onCancel={handleCancel}
          />
        );
      default:
        return (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Gestion des labyrinthes et règles</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('create-labyrinth')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Nouveau labyrinthe
                </button>
                <button
                  onClick={() => setViewMode('create-rule')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Nouvelles règles
                </button>
              </div>
            </div>
            
            <LabyrinthManager
              onLabyrinthSelect={handleLabyrinthSelect}
              onRuleSelect={handleRuleSelect}
            />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="management-page min-h-screen bg-gray-50" style={{ color: '#111827' }}>
        <div className="container mx-auto px-4 py-8">
          {renderContent()}
        </div>
      </div>
    </Layout>
  );
}
