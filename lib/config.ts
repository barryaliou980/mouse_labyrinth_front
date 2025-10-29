/**
 * Configuration de l'application avec support des variables d'environnement
 */

// Configuration par défaut
const DEFAULT_CONFIG = {
  PYTHON_API_URL: 'http://localhost:8000',
  NODE_ENV: 'development'
};

// Interface pour la configuration
export interface AppConfig {
  PYTHON_API_URL: string;
  NODE_ENV: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Fonction pour obtenir la configuration
export function getConfig(): AppConfig {
  // Variables d'environnement côté client (Next.js)
  const pythonApiUrl = process.env.NEXT_PUBLIC_PYTHON_API_URL || 
                      process.env.PYTHON_API_URL || 
                      DEFAULT_CONFIG.PYTHON_API_URL;
  
  const nodeEnv = process.env.NODE_ENV || DEFAULT_CONFIG.NODE_ENV;
  
  return {
    PYTHON_API_URL: pythonApiUrl,
    NODE_ENV: nodeEnv,
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production'
  };
}

// Instance de configuration globale
export const config = getConfig();

// Fonction utilitaire pour construire les URLs de l'API
export function getApiUrl(endpoint: string = ''): string {
  const baseUrl = config.PYTHON_API_URL.replace(/\/$/, ''); // Supprimer le slash final
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
}

// Fonction pour valider la configuration
export function validateConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.PYTHON_API_URL) {
    errors.push('PYTHON_API_URL is required');
  }
  
  // Valider que l'URL est valide
  try {
    new URL(config.PYTHON_API_URL);
  } catch {
    errors.push('PYTHON_API_URL must be a valid URL');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Log de la configuration au démarrage (seulement en développement)
if (config.isDevelopment) {
  console.log('🔧 Configuration chargée:', {
    PYTHON_API_URL: config.PYTHON_API_URL,
    NODE_ENV: config.NODE_ENV
  });
}
