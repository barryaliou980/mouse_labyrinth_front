'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, ExternalLink } from 'lucide-react';
import { SharedSimulation } from '@/lib/types';

import { Simulation } from '@/lib/types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationId: string;
  simulation?: Simulation; // Simulation complète pour sauvegarder si nécessaire
  onSimulationSaved?: (savedSimulationId: string) => void; // Callback quand la simulation est sauvegardée
}

export default function ShareModal({ isOpen, onClose, simulationId, simulation, onSimulationSaved }: ShareModalProps) {
  const [shareData, setShareData] = useState<SharedSimulation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCreatedShare, setHasCreatedShare] = useState(false);

  useEffect(() => {
    if (isOpen && simulationId && !hasCreatedShare) {
      createShare();
      setHasCreatedShare(true);
    }
    
    // Réinitialiser quand le modal se ferme
    if (!isOpen) {
      setHasCreatedShare(false);
      setShareData(null);
      setError(null);
    }
  }, [isOpen, simulationId, hasCreatedShare]);

  const createShare = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/simulation/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulationId,
          simulation, // Envoyer la simulation complète pour sauvegarder si nécessaire
          expiresInDays: 30 // Le partage expire dans 30 jours par défaut
        }),
      });

      const data = await response.json();

      if (data.success) {
        setShareData(data.data);
        // Notifier que la simulation a été sauvegardée (l'ID peut avoir changé)
        // L'ID de la simulation sauvegardée est dans le shareToken ou on peut le récupérer depuis l'API
        if (onSimulationSaved && data.data.savedSimulationId) {
          onSimulationSaved(data.data.savedSimulationId);
        }
      } else {
        setError(data.error || 'Erreur lors de la création du partage');
      }
    } catch (err) {
      setError('Erreur de connexion');
      console.error('Error creating share:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareData?.shareUrl) {
      try {
        await navigator.clipboard.writeText(shareData.shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const openShareUrl = () => {
    if (shareData?.shareUrl) {
      window.open(shareData.shareUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ 
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
        willChange: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        style={{
          transform: 'translateZ(0)',
          willChange: 'auto'
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Share2 className="w-6 h-6" />
            Partager la simulation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Création du lien de partage...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {shareData && !isLoading && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lien de partage
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareData.shareUrl}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copié!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>💡 Astuce:</strong> Partagez ce lien avec d'autres personnes pour qu'elles puissent observer la simulation en temps réel.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Vues:</span>
                <span className="ml-2 font-medium">{shareData.viewCount}</span>
              </div>
              {shareData.expiresAt && (
                <div>
                  <span className="text-gray-600">Expire le:</span>
                  <span className="ml-2 font-medium">
                    {new Date(shareData.expiresAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <button
                onClick={openShareUrl}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Ouvrir dans un nouvel onglet
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

