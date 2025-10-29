'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Server, Wifi, WifiOff, AlertCircle, Info, Bug, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/lib/config';

interface ServerLog {
  type: string;
  level?: string;
  message: string;
  timestamp: string;
  module?: string;
  function?: string;
  line?: number;
  thread_id?: number;
  simulation_id?: string;
  mouse_id?: string;
  turn?: number;
  performance?: {
    cpu_usage: number;
    memory_usage: number;
    response_time: number;
  };
}

interface ServerLogsProps {
  className?: string;
}

const ServerLogs: React.FC<ServerLogsProps> = ({ className = '' }) => {
  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fonction pour obtenir l'icône selon le niveau de log
  const getLogIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'DEBUG':
        return <Bug className="w-4 h-4 text-blue-500" />;
      default:
        return <Info className="w-4 h-4 text-green-500" />;
    }
  };

  // Fonction pour obtenir la couleur selon le niveau de log
  const getLogColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-400';
      case 'WARNING':
        return 'text-yellow-400';
      case 'DEBUG':
        return 'text-blue-400';
      default:
        return 'text-green-400';
    }
  };

  // Fonction pour formater le timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('fr-FR', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3
      });
    } catch {
      return timestamp;
    }
  };



  // Connexion SSE
  useEffect(() => {
    const connectToSSE = () => {
      try {
        const eventSource = new EventSource(getApiUrl('/api/logs/stream'));
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('Connected to server logs stream');
        };

        eventSource.onmessage = (event) => {
          try {
            const logData: ServerLog = JSON.parse(event.data);
            
            // Ignorer les heartbeats
            if (logData.type === 'heartbeat') {
              return;
            }

            setLogs(prevLogs => {
              const newLogs = [...prevLogs, logData];
              // Garder seulement les 200 derniers logs
              return newLogs.slice(-200);
            });
          } catch (err) {
            console.error('Error parsing log data:', err);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);
          setError('Erreur de connexion aux logs serveur');
          
          // Reconnexion automatique après 5 secondes
          setTimeout(() => {
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            connectToSSE();
          }, 5000);
        };

      } catch (err) {
        console.error('Error creating SSE connection:', err);
        setError('Impossible de se connecter aux logs serveur');
        setIsConnected(false);
      }
    };

    connectToSSE();

    // Nettoyage à la fermeture
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // Fonction pour effacer les logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2" style={{ color: '#111827' }}>
          <Server className="w-6 h-6" />
          Logs du Serveur (Server-Sent Events SSE)
        </h2>
        
        <div className="flex items-center gap-3">
          {/* Indicateur de connexion */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {isConnected ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>


          {/* Bouton pour effacer */}
          <button
            onClick={clearLogs}
            className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
          >
            Effacer
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Container des logs */}
      <div 
        className="logs-container bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto"
        style={{ backgroundColor: '#111827' }}
      >
        {logs.length === 0 ? (
          <div className="text-gray-400 flex items-center justify-center h-full">
            <div className="text-center">
              <Server className="w-8 h-8 mx-auto mb-2 text-gray-500" />
              <div>Aucun log serveur pour le moment...</div>
              <div className="text-xs mt-1">
                {isConnected ? 'En attente des logs...' : 'Connexion en cours...'}
              </div>
            </div>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1 flex items-start gap-2">
              {/* Icône du niveau de log */}
              {log.level && getLogIcon(log.level)}
              
              {/* Timestamp */}
              <span className="text-gray-500 text-xs flex-shrink-0">
                {formatTimestamp(log.timestamp)}
              </span>
              
              {/* Message principal */}
              <span className={`flex-1 ${log.level ? getLogColor(log.level) : 'text-green-400'}`}>
                {log.message}
              </span>
              
              {/* Informations supplémentaires */}
              {(log.simulation_id || log.mouse_id || log.turn) && (
                <div className="text-xs text-gray-500 flex-shrink-0">
                  {log.simulation_id && <span>Sim: {log.simulation_id}</span>}
                  {log.mouse_id && <span> | Mouse: {log.mouse_id}</span>}
                  {log.turn && <span> | Turn: {log.turn}</span>}
                </div>
              )}
            </div>
          ))
        )}
        
        {/* Référence pour l'auto-scroll */}
        <div ref={logsEndRef} />
      </div>

      {/* Statistiques */}
      {logs.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 flex justify-between">
          <span>{logs.length} logs affichés</span>
          <span>
            {logs.filter(log => log.level === 'ERROR').length} erreurs, {' '}
            {logs.filter(log => log.level === 'WARNING').length} avertissements
          </span>
        </div>
      )}
    </div>
  );
};

export default ServerLogs;
