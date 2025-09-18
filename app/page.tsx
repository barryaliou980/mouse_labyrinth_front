import React from 'react'
import { Github, Zap, Grid3x3, Play } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Mouse IA</h1>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
              Commencer
            </button>
          </div>
        </div>
      </header>

      {/* Section Héros */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Explorez le labyrinthe avec{' '}
            <span className="text-blue-600">Souris guidee par IA</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Une simulation propulsée par l’IA où des souris virtuelles trouvent leur chemin à travers des labyrinthes complexes.
          </p>
          <button className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2">
            <Play className="w-5 h-5" />
            Essayer la démo
          </button>
        </div>
      </section>

      {/* Section Fonctionnalités */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Fonctionnalités clés
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Découvrez ce qui fait de Souris IA l’outil idéal pour explorer les algorithmes de navigation en intelligence artificielle.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Fonctionnalité 1 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Navigation IA
              </h4>
              <p className="text-gray-600">
                Des algorithmes avancés de recherche de chemin guident les souris virtuelles à travers des labyrinthes complexes avec une prise de décision intelligente.
              </p>
            </div>

            {/* Fonctionnalité 2 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Grid3x3 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Labyrinthes personnalisés
              </h4>
              <p className="text-gray-600">
                Créez et personnalisez vos propres labyrinthes avec différents niveaux de difficulté et des défis uniques.
              </p>
            </div>

            {/* Fonctionnalité 3 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Play className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">
                Simulation en temps réel
              </h4>
              <p className="text-gray-600">
                Regardez l’IA en action avec une visualisation fluide et en temps réel des déplacements et des prises de décision de la souris.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pied de page */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              © 2025 Souris IA. Tous droits réservés.
            </p>
            <a
              href="/#"
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5" />
              Voir sur GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}