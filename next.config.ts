import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Configuration pour améliorer la compatibilité avec Vercel
  webpack: (config, { isServer }) => {
    // Résoudre les problèmes de modules CSS
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Ignorer les warnings pour les modules optionnels
    config.ignoreWarnings = [
      { module: /node_modules\/lightningcss/ },
      { module: /node_modules\/@tailwindcss/ },
    ];
    
    return config;
  },
  // Configuration pour le build sur Vercel
  experimental: {
    // Améliorer la compatibilité avec les dépendances natives
    serverComponentsExternalPackages: ['@tailwindcss/postcss', 'lightningcss'],
  },
};

export default nextConfig;
