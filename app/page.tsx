import React from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { Github, Zap, Grid3x3, Play, Brain, Target, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50" style={{ color: '#111827' }}>

      {/* Section Héros */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Explorez le labyrinthe avec{' '}
            <span className="text-blue-600">Souris guidées par IA</span>
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Une simulation propulsée par l'IA où des souris virtuelles trouvent leur chemin à travers des labyrinthes complexes. 
            Développé pour l'Agence Spatiale Canadienne pour étudier les comportements en vue de missions vers Mars.
          </p>
          <Link 
            href="/simulation"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors duration-200 inline-flex items-center gap-2"
          >
            <Play className="w-5 h-5" />
            Commencer la simulation
          </Link>
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Fonctionnalité 1 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Intelligences multiples
              </h4>
              <p className="text-gray-600 text-sm">
                Droit, Aléatoire, Gloutonne et Intelligente - 4 types d'IA distincts pour des comportements variés.
              </p>
            </div>

            {/* Fonctionnalité 2 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Grid3x3 className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Labyrinthes variés
              </h4>
              <p className="text-gray-600 text-sm">
                Plusieurs labyrinthes avec différents niveaux de complexité et défis uniques.
              </p>
            </div>

            {/* Fonctionnalité 3 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Règles configurables
              </h4>
              <p className="text-gray-600 text-sm">
                Différents ensembles de règles : classique, survie, social et vitesse pour varier les défis.
              </p>
            </div>

            {/* Fonctionnalité 4 */}
            <div className="text-center p-6 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Multi-souris
              </h4>
              <p className="text-gray-600 text-sm">
                Simulez jusqu'à 3 souris simultanément avec des interactions sociales et compétitives.
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
              © 2025 Souris IA - Projet SCS INF756. Développé pour l'Agence Spatiale Canadienne.
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
    </Layout>
  )
}