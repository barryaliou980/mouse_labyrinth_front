import React, { useState, useEffect, useCallback } from 'react';
import { SimulationUpdate, MouseMoveUpdate, CheeseFoundUpdate, MouseDiedUpdate } from './types';

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private onUpdate?: (update: SimulationUpdate) => void;
  private onConnect?: () => void;
  private onDisconnect?: () => void;
  private onError?: (error: Event) => void;

  constructor(url: string = 'ws://localhost:3001') {
    this.url = url;
  }

  // Connecter au WebSocket
  connect(
    onUpdate?: (update: SimulationUpdate) => void,
    onConnect?: () => void,
    onDisconnect?: () => void,
    onError?: (error: Event) => void
  ) {
    this.onUpdate = onUpdate;
    this.onConnect = onConnect;
    this.onDisconnect = onDisconnect;
    this.onError = onError;

    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connecté');
        this.reconnectAttempts = 0;
        if (this.onConnect) {
          this.onConnect();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const update: SimulationUpdate = JSON.parse(event.data);
          if (this.onUpdate) {
            this.onUpdate(update);
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message WebSocket:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket déconnecté');
        if (this.onDisconnect) {
          this.onDisconnect();
        }
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        if (this.onError) {
          this.onError(error);
        }
      };

    } catch (error) {
      console.error('Erreur lors de la connexion WebSocket:', error);
      if (this.onError) {
        this.onError(error as Event);
      }
    }
  }

  // Tenter de se reconnecter
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connect(this.onUpdate, this.onConnect, this.onDisconnect, this.onError);
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Impossible de se reconnecter au WebSocket');
    }
  }

  // Déconnecter le WebSocket
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // Envoyer un message
  send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket non connecté, impossible d\'envoyer le message');
    }
  }

  // Vérifier si le WebSocket est connecté
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  // Obtenir l'état de la connexion
  getConnectionState(): string {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }
}

// Hook React pour utiliser le WebSocket
export function useWebSocket(url?: string) {
  const [wsManager] = React.useState(() => new WebSocketManager(url));
  const [isConnected, setIsConnected] = React.useState(false);
  const [connectionState, setConnectionState] = React.useState('disconnected');
  const [updates, setUpdates] = React.useState<SimulationUpdate[]>([]);

  React.useEffect(() => {
    wsManager.connect(
      (update) => {
        setUpdates(prev => [...prev.slice(-99), update]); // Garder les 100 derniers updates
      },
      () => {
        setIsConnected(true);
        setConnectionState('connected');
      },
      () => {
        setIsConnected(false);
        setConnectionState('disconnected');
      },
      (error) => {
        console.error('Erreur WebSocket:', error);
        setConnectionState('error');
      }
    );

    return () => {
      wsManager.disconnect();
    };
  }, [wsManager]);

  const sendMessage = React.useCallback((message: any) => {
    wsManager.send(message);
  }, [wsManager]);

  const clearUpdates = React.useCallback(() => {
    setUpdates([]);
  }, []);

  return {
    isConnected,
    connectionState,
    updates,
    sendMessage,
    clearUpdates,
    wsManager
  };
}

// Utilitaires pour créer des updates
export const createMouseMoveUpdate = (
  mouseId: string,
  fromPosition: { x: number; y: number },
  toPosition: { x: number; y: number },
  direction: string,
  turn: number
): SimulationUpdate => {
  return {
    type: 'mouse_move',
    data: {
      mouseId,
      fromPosition,
      toPosition,
      direction
    } as MouseMoveUpdate,
    timestamp: new Date().toISOString(),
    turn
  };
};

export const createCheeseFoundUpdate = (
  mouseId: string,
  position: { x: number; y: number },
  cheeseCount: number,
  turn: number
): SimulationUpdate => {
  return {
    type: 'cheese_found',
    data: {
      mouseId,
      position,
      cheeseCount
    } as CheeseFoundUpdate,
    timestamp: new Date().toISOString(),
    turn
  };
};

export const createMouseDiedUpdate = (
  mouseId: string,
  position: { x: number; y: number },
  cause: string,
  turn: number
): SimulationUpdate => {
  return {
    type: 'mouse_died',
    data: {
      mouseId,
      position,
      cause
    } as MouseDiedUpdate,
    timestamp: new Date().toISOString(),
    turn
  };
};

export const createTurnCompleteUpdate = (
  turn: number,
  aliveMice: number,
  totalMice: number
): SimulationUpdate => {
  return {
    type: 'turn_complete',
    data: {
      turn,
      aliveMice,
      totalMice
    },
    timestamp: new Date().toISOString(),
    turn
  };
};

export const createSimulationEndUpdate = (
  reason: string,
  finalTurn: number,
  results: any
): SimulationUpdate => {
  return {
    type: 'simulation_end',
    data: {
      reason,
      finalTurn,
      results
    },
    timestamp: new Date().toISOString(),
    turn: finalTurn
  };
};
